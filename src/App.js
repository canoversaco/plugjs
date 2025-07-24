
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
import MysteryBoxUserView from "./components/MysteryBoxUserView";
import PassPanel from "./components/PassPanel";
import UserInventory from "./components/UserInventory";
import WalletModal from "./components/WalletModal";
import LottoView from "./components/LottoView";
import NotificationPopup from "./components/NotificationPopup";
import UpdateInfoModal from "./components/UpdateInfoModal";
import "leaflet/dist/leaflet.css";
import { fetchBtcPriceEUR, fetchReceivedTxs } from "./components/btcApi";
// --------- NEU FÜR BIGBOT ----------
import BiggiHomeView from "./components/bigbot/BiggiHomeView";

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

async function sendTelegramNotification(user, text) {
  console.log("DEBUG: Notification wird gesendet an:", user, text);
  if (!user?.telegramChatId) {
    console.log("[sendTelegramNotification] Keine ChatId für Telegram:", user);
    return;
  }
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
      console.error(
        "[sendTelegramNotification] Fehler vom Server:",
        resp.status,
        msg
      );
    } else {
      console.log("[sendTelegramNotification] Erfolgreich geschickt.");
    }
  } catch (e) {
    console.error("[sendTelegramNotification] Fehler beim Senden:", e);
  }
}
window.sendTelegramNotification = sendTelegramNotification;

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
    showUpdateModal: false,
    updateModalSeen: false,
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

    if (!localStorage.getItem("plug_updateinfo_seen_v2")) {
      this.setState({ showUpdateModal: true });
    }
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
        if (user.telegramChatId) {
          await sendTelegramNotification(
            user,
            `💰 Deine Einzahlung war erfolgreich! Dein Guthaben wurde um <b>${eurValue.toFixed(2)} €</b> erhöht.`
          );
        }
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
      let msg = `🚚 Dein Bestellstatus wurde geändert: <b>${status.toUpperCase()}</b>`;
      if (status === "abgeschlossen") {
        msg = `✅ Deine Bestellung wurde <b>abgeschlossen</b>. Bitte bewerte jetzt deine Bestellung!`;
      }
      await sendTelegramNotification(kunde, msg);
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

  // Wichtig: Konsequent ein Feld benutzen! role ODER rolle!
  const role = user.role || user.rolle || "";

  if (role.startsWith("bb_")) {
    this.setState({
      user,
      view: "bigbot_home",
      updateModalSeen: false,
    });
  } else {
    this.setState({
      user,
      view: "home",
      updateModalSeen: false,
    });
  }
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

    // NEU: BigBot-View!
    if (this.state.view === "bigbot_home" && this.state.user) {
      return (
        <BiggiHomeView
          user={this.state.user}
          onLogout={this.handleLogout}
          // Gib weitere Props rein, je nach Biggi-Logik
        />
      );
    }

    return (
      <>
        {activeEtaOrder &&
          this.state.user &&
          this.state.user.rolle !== "kurier" &&
          activeEtaOrder.eta > Date.now() && (
            <div
              style={{
                position: "fixed",
                top: 95,
                left: 10,
                zIndex: 5000,
                background: "rgba(30,32,40,0.74)",
                boxShadow: "0 3px 16px #38bdf81c, 0 1.5px 6px #0003",
                backdropFilter: "blur(9px)",
                borderRadius: 13,
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "9px 18px 9px 13px",
                fontSize: 15.5,
                color: "#f4f4f5",
                fontWeight: 600,
                fontFamily: "'Inter', 'Roboto', 'Arial', sans-serif",
                letterSpacing: 0.06,
                border: "1.6px solid #38bdf8",
                minWidth: 0,
                maxWidth: 260,
                transition: "box-shadow 0.16s",
                animation: "etafadein 0.23s cubic-bezier(.21,.8,.34,1.18)",
                cursor: "default",
              }}
            >
              <span
                style={{
                  background:
                    "linear-gradient(135deg,#38bdf8 60%,#a3e635 120%)",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 1.5px 4px #23262e55",
                  fontSize: 17,
                  color: "#18181b",
                }}
              >
                ⏳
              </span>
              <span
                style={{
                  flex: 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Ankunft&nbsp;
                <span style={{ color: "#a3e635", fontWeight: 900 }}>
                  {Math.max(
                    1,
                    Math.round((activeEtaOrder.eta - Date.now()) / 60000)
                  )}
                </span>
                &nbsp;min&nbsp;
                <span style={{ fontSize: 16, marginLeft: 1 }}>🛵</span>
              </span>
            </div>
          )}

        {this.state.showUpdateModal && (
          <UpdateInfoModal
            onClose={() => {
              this.setState({ showUpdateModal: false });
              localStorage.setItem("plug_updateinfo_seen_v2", "1");
            }}
          />
        )}
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
          <LoginView users={this.state.users} onLogin={this.handleLogin} />
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
        {this.state.view === "inventar" && this.state.user && (
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
            onOrderDelete={this.handleOrderDelete}
            onOrderStatusUpdate={this.handleOrderStatusUpdate}
          />
        )}
        {this.state.view === "pässe" && this.state.user && (
          <PassPanel
            user={this.state.user}
            onGoBack={() => this.setState({ view: "home" })}
            onBuyPass={this.handleBuyPass}
          />
        )}
        {this.state.view === "boxen" &&
          this.state.user &&
          (!this.state.user.id || this.state.user.guthaben === undefined ? (
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
          ))}
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
            onOrderStatusUpdate={this.handleOrderStatusUpdate}
            onOrderDelete={this.handleOrderDelete}
            onOrderUpdate={this.handleOrderUpdate}
            onOrderLocationUpdate={this.handleOrderLocationUpdate}
          />
        )}
        {[
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
          "admin",
        ].indexOf(this.state.view) === -1 && <div>Unbekannte Ansicht</div>}
      </>
    );
  }
}
