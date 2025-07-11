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

// -- Telegram Notification zentral --
async function sendTelegramNotification(user, text) {
  if (!user?.telegramChatId) return;
  try {
    await fetch("http://185.198.234.220:3666/send-telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: user.telegramChatId,
        text,
      }),
    });
  } catch (e) {
    // Ignore
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

  // ---------------------- //
  // --- Notifications ---- //
  // ---------------------- //

  // Chat Nachricht: ruft diese Methode nach dem Abspeichern einer neuen Nachricht auf!
  handleSendChatMessage = async (orderId, text, senderId) => {
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    const order = orderSnap.data();
    const users = this.state.users;
    const sender = users.find(u => u.id === senderId);

    // Empfänger ermitteln
    let empfaenger;
    if (order.kurierId && senderId === order.kurierId) {
      // Kurier schreibt -> Kunde benachrichtigen
      empfaenger = users.find(u => u.username === order.kunde);
    } else {
      // Kunde schreibt -> Kurier/Admin benachrichtigen
      empfaenger = users.find(u => u.id === order.kurierId) || users.find(u => (u.rolle === "admin" || u.role === "admin"));
    }

    // Telegram schicken
    if (empfaenger && empfaenger.telegramChatId) {
      await sendTelegramNotification(
        empfaenger,
        `📩 Neue Chatnachricht in deiner Bestellung!\n\n"${text}"`
      );
    }
  };

  // Order-Status ändern + Telegram
  handleOrderStatusUpdate = async (orderId, status) => {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, { status });
    const orderSnap = await getDoc(orderRef);
    const order = orderSnap.data();
    const kunde = this.state.users.find(u => u.username === order.kunde);
    if (kunde?.telegramChatId) {
      await sendTelegramNotification(
        kunde,
        `🚚 Dein Bestellstatus hat sich geändert: ${status.toUpperCase()}`
      );
    }
  };

  // Standort ändern + Telegram
  handleOrderLocationUpdate = async (orderId, neuerStandort) => {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, { standort: neuerStandort });
    const orderSnap = await getDoc(orderRef);
    const order = orderSnap.data();
    const kunde = this.state.users.find(u => u.username === order.kunde);
    if (kunde?.telegramChatId) {
      await sendTelegramNotification(
        kunde,
        `📍 Dein Treffpunkt/Standort wurde aktualisiert!\nNeuer Standort: ${neuerStandort}`
      );
    }
  };

  // Lotto-Gewinn + Telegram
  handleLottoWin = async (user, gewinn) => {
    if (user.telegramChatId) {
      await sendTelegramNotification(
        user,
        `🎉 Glückwunsch! Du hast im Lotto ${gewinn} gewonnen!`
      );
    }
  };

  // ---------------------- //
  // Rest bleibt wie gehabt //
  // ---------------------- //

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
    const {
      view,
      user,
      users,
      produkte,
      warenkorb,
      orders,
      broadcast,
      showBroadcast,
      chatOrder,
      walletOpen,
      btcPrice,
      buyCryptoModalOpen,
      buyCryptoAmount,
      buyCryptoBtc,
      mysteryBoxes,
      warenkorbFromInventory,
    } = this.state;

    if (chatOrder)
      return (
        <ChatWindow
          user={user}
          order={chatOrder}
          onClose={() => this.setState({ chatOrder: null })}
          onSendMessage={this.handleSendChatMessage} // wichtig!
        />
      );

    if (walletOpen)
      return (
        <WalletModal
          user={user}
          btcPrice={btcPrice}
          onClose={() => this.setState({ walletOpen: false })}
          onBuyCryptoClick={this.handleBuyCryptoClick}
        />
      );

    if (buyCryptoModalOpen)
      return (
        <BuyCryptoModal
          user={user}
          onClose={() =>
            this.setState({
              buyCryptoModalOpen: false,
              buyCryptoAmount: null,
              buyCryptoBtc: null,
            })
          }
          amount={buyCryptoAmount}
          btc={buyCryptoBtc}
        />
      );

    if (view === "login")
      return <LoginView users={users} onLogin={this.handleLogin} />;

    if (view === "home" && user)
      return (
        <HomeView
          user={user}
          btcPrice={btcPrice}
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
          broadcast={broadcast}
          showBroadcast={showBroadcast}
          closeBroadcast={() => this.setState({ showBroadcast: false })}
        />
      );

    if (view === "inventar" && user) {
      return (
        <UserInventory
          user={user}
          produkte={produkte}
          onGoBack={() => this.setState({ view: "home" })}
          onOrderFromInventory={this.handleOrderFromInventory}
          onSwapFromInventory={this.handleSwapFromInventory}
        />
      );
    }

    if (view === "order_inventory" && user && warenkorbFromInventory) {
      return (
        <OrderView
          produkte={produkte}
          warenkorb={warenkorbFromInventory}
          onBestellungAbsenden={this.handleBestellungAbsenden}
          onGoBack={() =>
            this.setState({ view: "inventar", warenkorbFromInventory: null })
          }
          btcPrice={btcPrice}
          user={user}
        />
      );
    }

    if (view === "lotto" && user)
      return (
        <LottoView
          user={user}
          users={users}
          onGoBack={() => this.setState({ view: "home" })}
          onLottoWin={this.handleLottoWin} // wichtig!
        />
      );

    if (view === "menü" && user)
      return (
        <MenuView
          produkte={produkte}
          warenkorb={warenkorb}
          onAddToCart={this.handleAddToCart}
          onRemoveFromCart={this.handleRemoveFromCart}
          onCheckout={() => this.setState({ view: "order" })}
          onGoBack={() => this.setState({ view: "home" })}
        />
      );

    if (view === "order" && user)
      return (
        <OrderView
          produkte={produkte}
          warenkorb={warenkorb}
          onBestellungAbsenden={this.handleBestellungAbsenden}
          onGoBack={() => this.setState({ view: "menü" })}
          btcPrice={btcPrice}
          user={user}
        />
      );

    if (view === "meine" && user)
      return (
        <KundeView
          user={user}
          orders={orders}
          produkte={produkte}
          onGoBack={() => this.setState({ view: "home" })}
          onChat={(order) => this.setState({ chatOrder: order })}
        />
      );

    if (view === "kurier" && user)
      return (
        <KurierView
          user={user}
          orders={orders}
          produkte={produkte}
          onGoBack={() => this.setState({ view: "home" })}
          onChat={(order) => this.setState({ chatOrder: order })}
        />
      );

    if (view === "pässe" && user)
      return (
        <PassPanel
          user={user}
          onGoBack={() => this.setState({ view: "home" })}
          onBuyPass={this.handleBuyPass}
        />
      );

    if (view === "boxen" && user) {
      if (!user.id || user.guthaben === undefined) {
        console.error("User-Objekt ist nicht vollständig:", user);
        return <div>Fehler: Benutzerdaten unvollständig</div>;
      }
      return (
        <ErrorBoundary>
          <MysteryBoxUserView
            user={user}
            onGoBack={() => this.setState({ view: "home" })}
            onOrderFromInventory={this.handleOrderFromInventory}
            onSwapFromInventory={this.handleSwapFromInventory}
            onGoInventar={this.handleGoInventar}
          />
        </ErrorBoundary>
      );
    }

    if (view === "admin" && user)
      return (
        <AdminView
          user={user}
          produkte={produkte}
          orders={orders}
          users={users}
          onGoBack={() => this.setState({ view: "home" })}
          onChat={(order) => this.setState({ chatOrder: order })}
          onProduktAdd={this.produktHinzufügen}
          onProduktUpdate={this.produktUpdaten}
        />
      );

    return <div>Unbekannte Ansicht</div>;
  }
}
