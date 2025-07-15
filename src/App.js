// src/App.js
import React from "react";
import { db } from "./firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import BuyCryptoModal from "./components/BuyCryptoModal";
import LoginView from "./components/LoginView";
import HomeView from "./components/HomeView";
import KundeView from "./components/KundeView";
import KurierView from "./components/KurierView";
import AdminView from "./components/AdminView";
import MenuView from "./components/MenuView";
import OrderView from "./components/OrderView";
import ChatWindow from "./components/ChatWindow";
import WalletModal from "./components/WalletModal";
import PassPanel from "./components/PassPanel";
import LottoView from "./components/LottoView";
import MysteryBoxUserView from "./components/MysteryBoxUserView";
import UserInventory from "./components/UserInventory";
import "leaflet/dist/leaflet.css";
import { fetchBtcPriceEUR, fetchReceivedTxs } from "./components/btcApi";

const ADMIN_BTC_WALLET = "bc1qdhqf4axsq4mnd6eq4fjj06jmfgmtlj5ar574z7";

class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Error in component:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: "red", padding: 20 }}>
          Ein Fehler ist aufgetreten
        </div>
      );
    }
    return this.props.children;
  }
}

// --- NEU: sendTelegramNotification 100% robust und mit Log
async function sendTelegramNotification(user, text) {
  if (!user?.telegramChatId) {
    console.log("[sendTelegramNotification] Keine ChatId für Telegram:", user);
    return;
  }
  console.log("[sendTelegramNotification] Sende an", user.telegramChatId, "Text:", text);
  try {
    const resp = await fetch("http://185.198.234.220:3667/send-telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: user.telegramChatId,
        text,
      }),
    });
    if (!resp.ok) {
      const msg = await resp.text();
      console.error("[sendTelegramNotification] Fehler vom Server:", resp.status, msg);
    } else {
      console.log("[sendTelegramNotification] Erfolgreich geschickt.");
    }
  } catch (e) {
    console.error("[sendTelegramNotification] Fehler beim Senden:", e);
  }
}

export default class App extends React.Component {
  state = {
    view: "login",
    user: null,
    users: [],
    produkte: [],
    orders: [],
    warenkorb: [],
    broadcast: { text: "", ts: 0 },
    showBroadcast: false,
    chatOrder: null,
    walletOpen: false,
    btcPrice: null,
    buyCryptoModalOpen: false,
    buyCryptoAmount: null,
    buyCryptoBtc: null,
    userListener: null,
    mysteryBoxes: [],
    warenkorbFromInventory: null,
  };

  unsub = [];

  setUserLiveListener = (user) => {
    if (this.state.userListener) {
      this.state.userListener();
    }
    if (!user || !user.id) return;
    const unsub = onSnapshot(doc(db, "users", user.id), (snap) => {
      if (snap.exists()) {
        this.setState({ user: { ...snap.data(), id: user.id } });
      }
    });
    this.setState({ userListener: unsub });
  };

  async componentDidMount() {
    this.unsub.push(
      onSnapshot(collection(db, "produkte"), (snap) => {
        this.setState({
          produkte: snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        });
      })
    );
    this.unsub.push(
      onSnapshot(collection(db, "orders"), (snap) => {
        this.setState({
          orders: snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        });
      })
    );
    this.unsub.push(
      onSnapshot(collection(db, "users"), (snap) => {
        this.setState({
          users: snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        });
      })
    );
    this.unsub.push(
      onSnapshot(doc(db, "settings", "main"), (snap) => {
        const data = snap.data();
        if (data?.broadcast && data.ts !== this.state.broadcast.ts) {
          this.setState({
            broadcast: { text: data.broadcast, ts: data.ts },
            showBroadcast: true,
          });
        }
      })
    );
    this.unsub.push(
      onSnapshot(collection(db, "mysteryBoxes"), (snap) => {
        const boxes = snap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            produkte: Array.isArray(data.produkte) ? data.produkte : [],
          };
        });
        this.setState({ mysteryBoxes: boxes });
      })
    );

    const btcPrice = await fetchBtcPriceEUR();
    this.setState({ btcPrice });

    this.depositInterval = setInterval(this.monitorDeposits, 60000);
    this.priceInterval = setInterval(async () => {
      const price = await fetchBtcPriceEUR();
      this.setState({ btcPrice: price });
    }, 120000);
  }

  componentWillUnmount() {
    this.unsub.forEach((f) => f && f());
    if (this.state.userListener) this.state.userListener();
    clearInterval(this.depositInterval);
    clearInterval(this.priceInterval);
  }

  monitorDeposits = async () => {
    const { users } = this.state;
    const { details } = await fetchReceivedTxs(ADMIN_BTC_WALLET);
    const btcPrice = await fetchBtcPriceEUR();

    for (let user of users) {
      const open = user.openDeposit;
      if (!open || open.erledigt) continue;

      const passendeTx = details.find(
        (tx) =>
          tx.confirmations >= 1 &&
          Math.abs(tx.value / 1e8 - open.btc) < open.btc * 0.03 &&
          !(user.btc_deposits || []).some((t) => t.txid === tx.txid)
      );

      if (passendeTx) {
        const txBtc = passendeTx.value / 1e8;
        const eurValue = txBtc * btcPrice;

        await updateDoc(doc(db, "users", user.id), {
          guthaben: (user.guthaben || 0) + eurValue,
          btc_deposits: [
            ...(user.btc_deposits || []),
            {
              ...passendeTx,
              gutgeschrieben: false,
              eurValue,
              Timestamp: Date.now(),
            },
          ],
          openDeposit: { ...open, erledigt: true, txid: passendeTx.txid },
        });
      }
    }
  };

  findActiveEtaOrder() {
    const { orders, user } = this.state;
    if (!user) return null;
    const meineAktiven = orders.filter(
      (o) =>
        o.kunde === user.username &&
        o.status === "unterwegs" &&
        o.eta &&
        o.eta > Date.now()
    );
    return meineAktiven.length ? meineAktiven[0] : null;
  }

  handleSendChatMessage = async (orderId, text, senderId) => {
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    const order = orderSnap.data();
    const users = this.state.users;
    const sender = users.find((u) => u.id === senderId);

    let empfaenger;
    if (order.kurierId && senderId === order.kurierId) {
      empfaenger = users.find((u) => u.username === order.kunde);
    } else {
      empfaenger =
        users.find((u) => u.id === order.kurierId) ||
        users.find((u) => u.rolle === "admin" || u.role === "admin");
    }

    console.log("[handleSendChatMessage] Empfaenger:", empfaenger);
    if (empfaenger && empfaenger.telegramChatId) {
      await sendTelegramNotification(
        empfaenger,
        `📩 Neue Chatnachricht in deiner Bestellung!\n\n"${text}"`
      );
    }
  };

  handleOrderStatusUpdate = async (orderId, status) => {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, { status });
    const orderSnap = await getDoc(orderRef);
    const order = orderSnap.data();
    const kunde = this.state.users.find((u) => u.username === order.kunde);
    if (kunde?.telegramChatId) {
      await sendTelegramNotification(
        kunde,
        `🚚 Dein Bestellstatus hat sich geändert: ${status.toUpperCase()}`
      );
    }
  };

  handleOrderLocationUpdate = async (orderId, neuerStandort) => {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, { standort: neuerStandort });
    const orderSnap = await getDoc(orderRef);
    const order = orderSnap.data();
    const kunde = this.state.users.find((u) => u.username === order.kunde);
    if (kunde?.telegramChatId) {
      await sendTelegramNotification(
        kunde,
        `📍 Dein Treffpunkt/Standort wurde aktualisiert!\nNeuer Standort: ${neuerStandort}`
      );
    }
  };

  handleLottoWin = async (user, gewinn) => {
    if (user.telegramChatId) {
      await sendTelegramNotification(
        user,
        `🎉 Glückwunsch! Du hast im Lotto ${gewinn} gewonnen!`
      );
    }
  };

  produktHinzufügen = async (produkt) => {
    await addDoc(collection(db, "produkte"), produkt);
  };

  produktUpdaten = async (produktId, patch) => {
    await updateDoc(doc(db, "produkte", produktId), patch);
  };

  bestellungHinzufügen = async (order) => {
    await addDoc(collection(db, "orders"), order);
  };

  handleLogin = (user) => {
    this.setUserLiveListener(user);
    this.setState({ user, view: "home" });
  };

  handleLogout = () => {
    if (this.state.userListener) this.state.userListener();
    this.setState({
      user: null,
      view: "login",
      warenkorb: [],
      userListener: null,
      warenkorbFromInventory: null,
    });
  };

  handleAddToCart = (produktId) => {
    this.setState((prev) => {
      const already = prev.warenkorb.find((w) => w.produktId === produktId);
      if (already) {
        return {
          warenkorb: prev.warenkorb.map((w) =>
            w.produktId === produktId ? { ...w, menge: w.menge + 1 } : w
          ),
        };
      }
      return { warenkorb: [...prev.warenkorb, { produktId, menge: 1 }] };
    });
  };

  handleRemoveFromCart = (produktId) => {
    this.setState((prev) => ({
      warenkorb: prev.warenkorb.filter((w) => w.produktId !== produktId),
    }));
  };

  handleBuyPass = async (pass) => {
    const { user } = this.state;
    if (!user) return;
    const userRef = doc(db, "users", user.id);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? userSnap.data() : {};

    if (userData.pass && userData.pass.gültigBis > Date.now()) {
      alert("Du hast bereits einen aktiven Pass!");
      return;
    }

    if ((userData.guthaben || 0) < pass.preis) {
      alert("Nicht genug Guthaben für diesen Pass!");
      return;
    }

    const jetzt = Date.now();
    const bis = jetzt + pass.laufzeit * 24 * 60 * 60 * 1000;
    const neuesGuthaben = (userData.guthaben || 0) - pass.preis + pass.guthaben;

    const passInfo = {
      ...pass,
      gekauftAm: jetzt,
      gültigBis: bis,
      gespartAktuell: 0,
    };

    await updateDoc(userRef, {
      guthaben: neuesGuthaben,
      pass: passInfo,
    });
  };

  handleBestellungAbsenden = async (orderData) => {
    const { user, warenkorb, produkte } = this.state;

    for (let item of warenkorb) {
      const p = produkte.find((pr) => pr.id === item.produktId);
      if (!p || p.bestand < item.menge) return;
    }
    for (let item of warenkorb) {
      const p = produkte.find((pr) => pr.id === item.produktId);
      await this.produktUpdaten(p.id, { bestand: p.bestand - item.menge });
    }

    const rabatt = orderData.rabatt ?? 0;
    const zuZahlen = orderData.endpreis ?? 0;

    if (
      orderData.zahlung === "krypto" &&
      (!user.guthaben || user.guthaben < zuZahlen)
    ) {
      alert("Nicht genug Guthaben! Bitte BTC-Guthaben aufladen.");
      return;
    }

    const aktiverPass =
      user.pass && user.pass.gültigBis > Date.now() ? user.pass : null;

    if (aktiverPass && rabatt > 0) {
      await updateDoc(doc(db, "users", user.id), {
        "pass.gespartAktuell": (aktiverPass.gespartAktuell ?? 0) + rabatt,
      });
    }

    await this.bestellungHinzufügen({
      kunde: user.username,
      warenkorb,
      gesamt: orderData.gesamt ?? 0,
      rabatt: rabatt,
      endpreis: zuZahlen,
      zahlung: orderData.zahlung ?? "bar",
      kryptoWaehrung:
        orderData.zahlung === "krypto" ? orderData.kryptoWaehrung : null,
      notiz: orderData.notiz ?? "",
      status: "offen",
      treffpunkt: orderData.treffpunkt ?? null,
      ts: Date.now(),
      chat: [],
    });

    if (orderData.zahlung === "krypto") {
      await updateDoc(doc(db, "users", user.id), {
        guthaben: user.guthaben - zuZahlen,
      });
    }

    this.setState({
      warenkorb: [],
      warenkorbFromInventory: null,
      view: "meine",
    });
  };

  handleBuyCryptoClick = async (eur, btc) => {
    const { user } = this.state;
    if (!user || !eur || !btc) return;
    await updateDoc(doc(db, "users", user.id), {
      openDeposit: {
        btc: parseFloat(btc),
        eur: parseFloat(eur),
        ts: Date.now(),
        erledigt: false,
      },
    });
    this.setState({
      walletOpen: false,
      buyCryptoModalOpen: true,
      buyCryptoAmount: eur,
      buyCryptoBtc: btc,
    });
  };

  handleOrderFromInventory = (produkt) => {
    this.setState({
      warenkorbFromInventory: [
        { produktId: produkt.id, menge: 1, gratis: true },
      ],
      view: "order_inventory",
    });
  };

  handleSwapFromInventory = async (produkt) => {
    const { user } = this.state;
    if (!user || !produkt) return;
    const guthabenNeu = (user.guthaben || 0) + (produkt.preis || 0);
    const userRef = doc(db, "users", user.id);
    const userSnap = await getDoc(userRef);
    let inventar = userSnap.data()?.inventory || [];
    inventar = inventar.filter((item) => item.produktId !== produkt.id);

    await updateDoc(userRef, {
      guthaben: guthabenNeu,
      inventory: inventar,
    });
  };

  handleGoInventar = () => {
    this.setState({ view: "inventar" });
  };

  render() {
    // -- ETA-Banner für Kunde, in jeder View oben!
    const activeEtaOrder = this.findActiveEtaOrder && this.findActiveEtaOrder();
    return (
      <>
        {/* ETA-Banner für Kunden */}
        {activeEtaOrder &&
          this.state.user &&
          this.state.user.rolle !== "kurier" &&
          activeEtaOrder.eta > Date.now() && (
            <>
              <style>
                {`
                  @keyframes etafadein {
                    from { opacity: 0; transform: translateY(-20px) scale(0.97);}
                    to   { opacity: 1; transform: translateY(0) scale(1);}
                  }
                `}
              </style>
              <div
                style={{
                  position: "fixed",
                  top: 18,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background:
                    "linear-gradient(100deg, #38bdf8 65%, #a3e635 120%)",
                  color: "#18181b",
                  borderRadius: 15,
                  padding: "16px 38px",
                  boxShadow: "0 4px 24px #23262e33",
                  zIndex: 5000,
                  fontSize: 20,
                  fontWeight: 900,
                  letterSpacing: 0.01,
                  minWidth: 240,
                  textAlign: "center",
                  border: "2px solid #18181b",
                  animation: "etafadein 0.23s cubic-bezier(.18,.82,.36,1.13)"
                }}
              >
                <span role="img" aria-label="Ankunft">⏳</span>
                &nbsp;Ankunft in ca.&nbsp;
                <span style={{ color: "#0e820e" }}>
                  {Math.max(
                    1,
                    Math.round((activeEtaOrder.eta - Date.now()) / 60000)
                  )}
                </span>
                &nbsp;Minuten&nbsp;
                <span role="img" aria-label="Delivery">🛵</span>
              </div>
            </>
          )}

        {/* ---- Rest wie gehabt ---- */}

        {this.state.chatOrder && (
          <ChatWindow
            user={this.state.user}
            order={this.state.chatOrder}
            onClose={() => this.setState({ chatOrder: null })}
            onSendMessage={this.handleSendChatMessage}
          />
        )}
        {this.state.walletOpen && (
          <WalletModal
            user={this.state.user}
            btcPrice={this.state.btcPrice}
            onClose={() => this.setState({ walletOpen: false })}
            onBuyCryptoClick={this.handleBuyCryptoClick}
          />
        )}
        {this.state.buyCryptoModalOpen && (
          <BuyCryptoModal
            user={this.state.user}
            onClose={() =>
              this.setState({
                buyCryptoModalOpen: false,
                buyCryptoAmount: null,
                buyCryptoBtc: null,
              })
            }
            amount={this.state.buyCryptoAmount}
            btc={this.state.buyCryptoBtc}
          />
        )}
        {this.state.view === "login" && (
          <LoginView
            users={this.state.users}
            onLogin={this.handleLogin}
          />
        )}
        {this.state.view === "home" && this.state.user && (
          <HomeView
            user={this.state.user}
            btcPrice={this.state.btcPrice}
            onGotoMenu={() => this.setState({ view: "menü" })}
            onGotoOrders={() => this.setState({ view: "meine" })}
            onGotoAdmin={() => this.setState({ view: "admin" })}
            onGotoKurier={() => this.setState({ view: "kurier" })}
            onGotoPass={() => this.setState({ view: "pässe" })}
            onGotoLotto={() => this.setState({ view: "lotto" })}
            onGotoMysteryBoxen={() => this.setState({ view: "boxen" })}
            onGotoInventar={() => this.setState({ view: "inventar" })}
            onLogout={this.handleLogout}
            onWalletClick={() => this.setState({ walletOpen: true })}
            onBuyCryptoClick={() =>
              this.setState({ buyCryptoModalOpen: true, buyCryptoAmount: null })
            }
            broadcast={this.state.broadcast}
            showBroadcast={this.state.showBroadcast}
            closeBroadcast={() => this.setState({ showBroadcast: false })}
          />
        )}
        {this.state.view === "inventar" &&
          this.state.user && (
            <UserInventory
              user={this.state.user}
              produkte={this.state.produkte}
              onGoBack={() => this.setState({ view: "home" })}
              onOrderFromInventory={this.handleOrderFromInventory}
              onSwapFromInventory={this.handleSwapFromInventory}
            />
          )}
        {this.state.view === "order_inventory" &&
          this.state.user &&
          this.state.warenkorbFromInventory && (
            <OrderView
              produkte={this.state.produkte}
              warenkorb={this.state.warenkorbFromInventory}
              onBestellungAbsenden={this.handleBestellungAbsenden}
              onGoBack={() =>
                this.setState({
                  view: "inventar",
                  warenkorbFromInventory: null,
                })
              }
              btcPrice={this.state.btcPrice}
              user={this.state.user}
            />
          )}
        {this.state.view === "lotto" && this.state.user && (
          <LottoView
            user={this.state.user}
            users={this.state.users}
            onGoBack={() => this.setState({ view: "home" })}
            onLottoWin={this.handleLottoWin}
          />
        )}
        {this.state.view === "menü" && this.state.user && (
          <MenuView
            produkte={this.state.produkte}
            warenkorb={this.state.warenkorb}
            onAddToCart={this.handleAddToCart}
            onRemoveFromCart={this.handleRemoveFromCart}
            onCheckout={() => this.setState({ view: "order" })}
            onGoBack={() => this.setState({ view: "home" })}
          />
        )}
        {this.state.view === "order" && this.state.user && (
          <OrderView
            produkte={this.state.produkte}
            warenkorb={this.state.warenkorb}
            onBestellungAbsenden={this.handleBestellungAbsenden}
            onGoBack={() => this.setState({ view: "menü" })}
            btcPrice={this.state.btcPrice}
            user={this.state.user}
          />
        )}
        {this.state.view === "meine" && this.state.user && (
          <KundeView
            user={this.state.user}
            orders={this.state.orders}
            produkte={this.state.produkte}
            onGoBack={() => this.setState({ view: "home" })}
            onChat={(order) => this.setState({ chatOrder: order })}
          />
        )}
        {this.state.view === "kurier" && this.state.user && (
          <KurierView
            user={this.state.user}
            orders={this.state.orders}
            produkte={this.state.produkte}
            onGoBack={() => this.setState({ view: "home" })}
            onChat={(order) => this.setState({ chatOrder: order })}
          />
        )}
        {this.state.view === "pässe" && this.state.user && (
          <PassPanel
            user={this.state.user}
            onGoBack={() => this.setState({ view: "home" })}
            onBuyPass={this.handleBuyPass}
          />
        )}
        {this.state.view === "boxen" && this.state.user && (
          !this.state.user.id || this.state.user.guthaben === undefined ? (
            <div>Fehler: Benutzerdaten unvollständig</div>
          ) : (
            <ErrorBoundary>
              <MysteryBoxUserView
                user={this.state.user}
                onGoBack={() => this.setState({ view: "home" })}
                onOrderFromInventory={this.handleOrderFromInventory}
                onSwapFromInventory={this.handleSwapFromInventory}
                onGoInventar={this.handleGoInventar}
              />
            </ErrorBoundary>
          )
        )}
        {this.state.view === "admin" && this.state.user && (
          <AdminView
            user={this.state.user}
            produkte={this.state.produkte}
            orders={this.state.orders}
            users={this.state.users}
            onGoBack={() => this.setState({ view: "home" })}
            onChat={(order) => this.setState({ chatOrder: order })}
            onProduktAdd={this.produktHinzufügen}
            onProduktUpdate={this.produktUpdaten}
          />
        )}
        {/* Fallback */}
        {![
          "login",
          "home",
          "inventar",
          "order_inventory",
          "lotto",
          "menü",
          "order",
          "meine",
          "kurier",
          "pässe",
          "boxen",
          "admin"
        ].includes(this.state.view) && <div>Unbekannte Ansicht</div>}
      </>
    );
  }
}
