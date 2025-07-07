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
import LottoView from "./components/LottoView"; // <--- NEU
import "leaflet/dist/leaflet.css";
import { fetchBtcPriceEUR, fetchReceivedTxs } from "./components/btcApi";

const ADMIN_BTC_WALLET = "bc1qdhqf4axsq4mnd6eq4fjj06jmfgmtlj5ar574z7";

function BuyCryptoModal({ user, amount, btc, onClose }) {
  const ADMIN_BTC_ADDRESS = ADMIN_BTC_WALLET;
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(ADMIN_BTC_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 1300);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        minWidth: "100vw",
        background: "rgba(20,22,30,0.90)",
        color: "#fafaf9",
        fontFamily: "'Inter',sans-serif",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2000,
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #23262e 93%, #38bdf822 100%)",
          borderRadius: 20,
          padding: "36px 26px 30px 26px",
          maxWidth: 400,
          width: "95vw",
          boxShadow: "0 12px 36px #000b, 0 2px 10px #38bdf822",
          border: "1.5px solid #292933",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            right: 15,
            top: 14,
            fontSize: 26,
            background: "rgba(37,40,54,0.75)",
            border: 0,
            color: "#e5e7eb",
            fontWeight: 800,
            borderRadius: 7,
            width: 34,
            height: 34,
            cursor: "pointer",
            zIndex: 2,
          }}
          aria-label="Schließen"
        >
          ×
        </button>
        <h2
          style={{
            color: "#38bdf8",
            marginBottom: 17,
            fontWeight: 900,
            fontSize: 23,
            letterSpacing: 0.8,
            textAlign: "center",
            textShadow: "0 1px 7px #22292f30",
          }}
        >
          Krypto kaufen
        </h2>
        <h2
          style={{
            color: "#ff0000",
            marginBottom: 15,
            fontWeight: 900,
            fontSize: 22,
            letterSpacing: 0.7,
            textAlign: "center",
            textShadow: "0 1px 7px #22292f30",
          }}
        >
          ⚠️ACHTUNG ⚠️
        </h2>
        <div>
          Du musst in deiner Wallet (Symbol oben rechts) vorher den
          Einzahlungsbetrag eingeben und auf Einzahlen klicken, ansonsten kann
          deine Einzahlung nicht Zugeordnet werden und wird nicht als Guthaben
          gutgeschrieben! Nach 1 Bestätigung erhältst du das Guthaben
          automatisch als EUR in deinem Wallet gutgeschrieben.
        </div>
        <br />
        <div style={{ marginBottom: 16, fontSize: 15.8 }}>
          <b>BTC schnell und einfach mit Apple Pay kaufen:</b>
          <br />
          <a
            href={`https://guardarian.com`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "#38bdf8",
              color: "#18181b",
              fontWeight: 900,
              padding: "13px 0",
              borderRadius: 10,
              width: "100%",
              display: "block",
              textAlign: "center",
              fontSize: 18,
              marginTop: 14,
              marginBottom: 7,
              boxShadow: "0 2px 10px #38bdf822",
              textDecoration: "none",
              letterSpacing: 0.18,
            }}
          >
            🟦 Bitcoin Kaufen ohne Verifizierung! (Banküberweisung, Revolut Pay,
            Visa)
          </a>
          <div
            style={{
              color: "#a1a1aa",
              fontSize: 14,
              marginTop: 8,
              marginBottom: 8,
            }}
          >
            <b>
              Kein Account/KYC nötig bis ca. 700 €. Direktversand auf deine
              Adresse.
            </b>
          </div>
        </div>
        <div style={{ marginBottom: 17 }}>
          <ol style={{ marginLeft: 22, color: "#e5e7eb", fontSize: 15.1 }}>
            <li style={{ marginBottom: 13 }}>
              Nutze den Apple Pay Button oben – du kaufst <b>direkt BTC</b> auf
              unsere Wallet.
            </li>
            <li style={{ marginBottom: 13 }}>
              Sende anschließend den gewünschten Betrag an diese Adresse:
              <br />
              <span
                style={{
                  wordBreak: "break-all",
                  color: "#a3e635",
                  fontFamily: "monospace",
                  fontSize: 16.5,
                  background: "#18181b",
                  borderRadius: 7,
                  padding: "7px 8px",
                  display: "inline-block",
                  margin: "7px 0 4px 0",
                  boxShadow: "0 1px 5px #23262e22",
                  border: "1.2px solid #292933",
                  letterSpacing: 0.19,
                }}
              >
                {ADMIN_BTC_ADDRESS}
              </span>
              <button
                onClick={handleCopy}
                style={{
                  background: copied ? "#22c55e" : "#23262e",
                  color: copied ? "#fff" : "#38bdf8",
                  border: 0,
                  borderRadius: 7,
                  fontWeight: 700,
                  fontSize: 15.3,
                  padding: "5px 13px",
                  marginLeft: 13,
                  marginBottom: 5,
                  marginTop: 3,
                  cursor: "pointer",
                  transition: "background 0.13s",
                  outline: "none",
                  boxShadow: copied ? "0 0 0 2px #22c55e55" : "",
                }}
              >
                {copied ? "✔️ Kopiert" : "Adresse kopieren"}
              </button>
              {amount && btc && (
                <div
                  style={{
                    margin: "10px 0 0 0",
                    color: "#38bdf8",
                    fontWeight: 700,
                    fontSize: 15.5,
                  }}
                >
                  Dein Wunschbetrag: <b>{amount} €</b> = <b>{btc} BTC</b>
                </div>
              )}
            </li>
            <li>
              Nach 1 Bestätigung erhältst du das Guthaben automatisch als EUR in
              deinem Wallet gutgeschrieben.
            </li>
          </ol>
        </div>
        <button
          onClick={onClose}
          style={{
            width: "100%",
            background: "#38bdf8",
            color: "#18181b",
            padding: "13px 0",
            border: 0,
            borderRadius: 10,
            fontWeight: 900,
            fontSize: 18,
            marginTop: 6,
            cursor: "pointer",
            boxShadow: "0 2px 10px #38bdf822",
            letterSpacing: 0.25,
          }}
        >
          Zurück
        </button>
      </div>
    </div>
  );
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
  };

  unsub = [];

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

  produktHinzufügen = async (produkt) => {
    await addDoc(collection(db, "produkte"), produkt);
  };

  produktUpdaten = async (produktId, patch) => {
    await updateDoc(doc(db, "produkte", produktId), patch);
  };

  bestellungHinzufügen = async (order) => {
    await addDoc(collection(db, "orders"), order);
  };

  handleLogin = (user) => this.setState({ user, view: "home" });

  handleLogout = () =>
    this.setState({ user: null, view: "login", warenkorb: [] });

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

    this.setState({
      user: {
        ...user,
        guthaben: neuesGuthaben,
        pass: passInfo,
      },
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

    // User nach Rabatt-Update neu laden
    let updatedUserSnap = await getDoc(doc(db, "users", user.id));
    let updatedUser = {
      ...user,
      ...(updatedUserSnap.exists() ? updatedUserSnap.data() : {}),
    };

    this.setState({ warenkorb: [], view: "meine" });
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
    } = this.state;

    if (chatOrder)
      return (
        <ChatWindow
          user={user}
          order={chatOrder}
          onClose={() => this.setState({ chatOrder: null })}
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
          onGotoLotto={() => this.setState({ view: "lotto" })} // <---- HIER
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
    if (view === "lotto" && user)
      return (
        <LottoView
          user={user}
          users={users}
          onGoBack={() => this.setState({ view: "home" })}
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
