import React from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import images from "./images/images";

// Tabs inkl. Einzahlungen-Tab!
const TABS = [
  { key: "produkte", label: "🛒 Produkte" },
  { key: "orders", label: "📦 Bestellungen" },
  { key: "users", label: "👤 Nutzer" },
  { key: "broadcast", label: "📢 Broadcast" },
  { key: "deposits", label: "💸 Einzahlungen" },
  { key: "lotto", label: "🎰 Lotto" },
];

// Lotto-Komponente ausgelagert
function anonymisiereName(name) {
  if (!name) return "";
  if (name.length < 2) return "***";
  return name.slice(0, 2) + "***" + name.slice(-2);
}

function LottoAdminTab() {
  const [lottos, setLottos] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    const unsub = onSnapshot(collection(db, "lottos"), (snap) => {
      const lottos = [];
      snap.forEach((d) => lottos.push({ id: d.id, ...d.data() }));
      lottos.sort((a, b) => (b.start || 0) - (a.start || 0));
      setLottos(lottos);
    });
    return unsub;
  }, []);

  async function startLotto() {
    setLoading(true);
    setMessage("");
    try {
      const now = Date.now();
      await addDoc(collection(db, "lottos"), {
        start: now,
        end: now + 7 * 24 * 3600 * 1000,
        pot: 0,
        teilnehmer: [],
        finished: false,
        gebuehren: 10,
      });
      setMessage("Lotto-Ziehung gestartet!");
    } catch {
      setMessage("Fehler beim Start!");
    }
    setLoading(false);
  }

  async function ziehungBeenden(lotto) {
    if (lotto.finished) return;
    if (!lotto.teilnehmer || lotto.teilnehmer.length === 0) {
      setMessage("Keine Teilnehmer!");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const winner =
        lotto.teilnehmer[Math.floor(Math.random() * lotto.teilnehmer.length)];
      const gewinnbetrag = Math.round((lotto.pot || 0) * 0.9 * 100) / 100;

      const userRef = doc(db, "users", winner.userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};
      await updateDoc(userRef, {
        guthaben: (userData.guthaben ?? 0) + gewinnbetrag,
      });

      await updateDoc(doc(db, "lottos", lotto.id), {
        finished: true,
        winner: { ...winner, gewinn: gewinnbetrag },
      });

      setMessage(
        `Ziehung abgeschlossen! Gewinner: ${anonymisiereName(
          winner.username
        )} (+${gewinnbetrag.toFixed(2)} €)`
      );
    } catch (e) {
      setMessage("Fehler bei der Auszahlung!");
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 580, margin: "0 auto", paddingTop: 12 }}>
      <h3 style={{ fontWeight: 900, fontSize: 25, marginBottom: 17 }}>
        🎰 Lotto-Verwaltung
      </h3>
      <button
        onClick={startLotto}
        disabled={loading || lottos.some((l) => !l.finished)}
        style={{
          background: "linear-gradient(97deg,#a3e635 70%,#38bdf8 100%)",
          color: "#18181b",
          fontWeight: 900,
          border: 0,
          borderRadius: 11,
          fontSize: 19,
          padding: "13px 0",
          cursor: "pointer",
          width: "100%",
          marginBottom: 19,
          boxShadow: "0 2px 14px #a3e63533",
        }}
      >
        Neue Ziehung starten
      </button>
      {message && (
        <div
          style={{
            color:
              message.startsWith("Lotto") ||
              message.startsWith("Ziehung abgeschlossen")
                ? "#a3e635"
                : "#f87171",
            marginBottom: 13,
            fontWeight: 700,
          }}
        >
          {message}
        </div>
      )}
            <div>
        {lottos.length === 0 ? (
          <div style={{ color: "#aaa" }}>Noch keine Ziehung vorhanden.</div>
        ) : (
          lottos.map((lotto) => (
            <div
              key={lotto.id}
              style={{
                background: "#23262e",
                borderRadius: 11,
                padding: 15,
                marginBottom: 18,
                boxShadow: "0 2px 10px #38bdf822",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 18 }}>
                Start: {new Date(lotto.start).toLocaleString()} <br />
                Ende: {new Date(lotto.end).toLocaleString()}
              </div>
              <div style={{ fontSize: 15, margin: "7px 0" }}>
                Pot: <b>{lotto.pot?.toFixed(2) ?? "0.00"} €</b>
                <br />
                Teilnehmer: <b>{lotto.teilnehmer?.length ?? 0}</b>
              </div>
              <div>
                {lotto.teilnehmer && lotto.teilnehmer.length > 0 && (
                  <div style={{ fontSize: 15, margin: "7px 0" }}>
                    <b>Teilnehmer:</b>
                    <ul style={{ margin: 0, paddingLeft: 14 }}>
                      {lotto.teilnehmer.map((t, i) => (
                        <li key={i}>{anonymisiereName(t.username)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {lotto.finished && lotto.winner ? (
                <div
                  style={{
                    color: "#a3e635",
                    fontWeight: 800,
                    fontSize: 16.5,
                    marginTop: 9,
                  }}
                >
                  🏆 Gewinner: {anonymisiereName(lotto.winner.username)} <br />
                  Gewinn: <b>+{(lotto.winner.gewinn || 0).toFixed(2)} €</b>
                </div>
              ) : (
                <button
                  onClick={() => ziehungBeenden(lotto)}
                  disabled={loading}
                  style={{
                    background: "#38bdf8",
                    color: "#18181b",
                    fontWeight: 900,
                    border: 0,
                    borderRadius: 8,
                    fontSize: 16,
                    padding: "9px 0",
                    cursor: "pointer",
                    marginTop: 6,
                  }}
                >
                  Ziehung beenden & Gewinner ziehen
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
export default class AdminView extends React.Component {
  state = {
    tab: "produkte",

    // Produkt BEARBEITEN
    produktEdit: null,
    produktForm: {
      name: "",
      preis: "",
      bestand: "",
      beschreibung: "",
      bildName: "defaultBild",
      kategorie: "",
    },
    error: "",
    sortBy: "name",

    // Produkt HINZUFÜGEN
    produktAddForm: {
      name: "",
      preis: "",
      bestand: "",
      beschreibung: "",
      bildName: "defaultBild",
      kategorie: "",
    },
    addError: "",

    // Bestellung
    orderEdit: null,
    orderForm: { status: "", notiz: "" },

    // Nutzer
    userEdit: null,
    userForm: { username: "", role: "kunde", password: "" },
    userAddOpen: false,

    // Broadcast
    broadcastText: "",
    broadcastError: "",
    broadcastSuccess: "",
    broadcasts: [],
    broadcastEditId: null,
    broadcastEditText: "",
  };

  componentDidMount() {
    this.fetchBroadcasts();
  }

  // Alle Broadcasts laden
  fetchBroadcasts = async () => {
    const q = query(collection(db, "broadcasts"), orderBy("created", "desc"));
    const snap = await getDocs(q);
    const broadcasts = [];
    snap.forEach((docSnap) => {
      broadcasts.push({ id: docSnap.id, ...docSnap.data() });
    });
    this.setState({ broadcasts });
  };

  // Broadcast anlegen
  handleSendBroadcast = async () => {
    const text = this.state.broadcastText.trim();
    if (!text) {
      this.setState({ broadcastError: "Bitte Text eingeben." });
      return;
    }
    try {
      await addDoc(collection(db, "broadcasts"), {
        text,
        created: Date.now(),
      });
      this.setState({
        broadcastText: "",
        broadcastSuccess: "Gesendet!",
        broadcastError: "",
      });
      setTimeout(() => this.setState({ broadcastSuccess: "" }), 1500);
      this.fetchBroadcasts();
    } catch (e) {
      this.setState({ broadcastError: "Fehler beim Senden." });
    }
  };

  // Broadcast löschen
  handleDeleteBroadcast = async (id) => {
    if (!window.confirm("Broadcast wirklich löschen?")) return;
    await deleteDoc(doc(db, "broadcasts", id));
    this.fetchBroadcasts();
  };

  // Broadcast editieren
  handleEditBroadcast = (id, text) => {
    this.setState({ broadcastEditId: id, broadcastEditText: text });
  };

  // Broadcast speichern
  handleSaveEditBroadcast = async () => {
    const { broadcastEditId, broadcastEditText } = this.state;
    if (!broadcastEditText.trim()) {
      this.setState({ broadcastError: "Text darf nicht leer sein!" });
      return;
    }
    await updateDoc(doc(db, "broadcasts", broadcastEditId), {
      text: broadcastEditText.trim(),
    });
    this.setState({
      broadcastEditId: null,
      broadcastEditText: "",
      broadcastError: "",
      broadcastSuccess: "Geändert!",
    });
    setTimeout(() => this.setState({ broadcastSuccess: "" }), 1000);
    this.fetchBroadcasts();
  };

  handleCancelEditBroadcast = () => {
    this.setState({ broadcastEditId: null, broadcastEditText: "" });
  };

  handleTab(tab) {
    this.setState({ tab });
  }
    // PRODUKT-BEARBEITEN
  handleEditProdukt = (produkt) => {
    this.setState({
      produktEdit: produkt.id,
      produktForm: { ...produkt },
      error: "",
    });
  };

  handleChange = (field, value) => {
    this.setState((s) => ({
      produktForm: { ...s.produktForm, [field]: value },
    }));
  };

  handleSaveProdukt = () => {
    const { produktForm, produktEdit } = this.state;
    if (
      !produktForm.name ||
      produktForm.preis <= 0 ||
      produktForm.bestand < 0
    ) {
      this.setState({ error: "Bitte gültige Produktdaten angeben." });
      return;
    }
    this.props.onProduktUpdate &&
      this.props.onProduktUpdate(produktEdit, {
        ...produktForm,
        preis: Number(produktForm.preis),
        bestand: Number(produktForm.bestand),
      });
    this.setState({
      produktEdit: null,
      produktForm: {
        name: "",
        preis: "",
        bestand: "",
        beschreibung: "",
        bildName: "defaultBild",
        kategorie: "",
      },
      error: "",
    });
  };

  // PRODUKT-HINZUFÜGEN
  handleChangeAdd = (field, value) => {
    this.setState((s) => ({
      produktAddForm: { ...s.produktAddForm, [field]: value },
    }));
  };

  handleAddProdukt = () => {
    const { produktAddForm } = this.state;
    if (!produktAddForm.name || produktAddForm.preis <= 0) {
      this.setState({ addError: "Produktname & Preis erforderlich." });
      return;
    }
    this.props.onProduktAdd &&
      this.props.onProduktAdd({
        ...produktAddForm,
        preis: Number(produktAddForm.preis),
        bestand: Number(produktAddForm.bestand),
      });
    this.setState({
      produktAddForm: {
        name: "",
        preis: "",
        bestand: "",
        beschreibung: "",
        bildName: "defaultBild",
        kategorie: "",
      },
      addError: "",
    });
  };

  // PRODUKT-LÖSCHEN
  async handleProduktDelete(produktId) {
    if (window.confirm("Produkt wirklich löschen?")) {
      try {
        await deleteDoc(doc(db, "produkte", produktId));
        alert("Produkt gelöscht!");
      } catch (e) {
        alert("Fehler beim Löschen des Produkts!");
      }
    }
  }
    // Order bearbeiten öffnen
  openOrderEdit(order) {
    this.setState({
      orderEdit: order.id,
      orderForm: {
        status: order.status || "",
        notiz: order.notiz || "",
      },
    });
  }

  // Order speichern
  async handleSaveOrder(orderId) {
    const { orderForm } = this.state;
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: orderForm.status,
        notiz: orderForm.notiz,
      });
      this.setState({ orderEdit: null });
    } catch (e) {
      alert("Fehler beim Speichern!");
    }
  }

  // Order löschen
  async handleOrderDelete(orderId) {
    if (window.confirm("Diese Bestellung wirklich löschen?")) {
      try {
        await deleteDoc(doc(db, "orders", orderId));
        alert("Bestellung gelöscht!");
      } catch (e) {
        alert("Fehler beim Löschen der Bestellung!");
      }
    }
  }

  // Nutzer bearbeiten
  openUserEdit = (u) => {
    this.setState({
      userEdit: u.id,
      userForm: {
        username: u.username,
        role: u.role,
        password: "",
      },
    });
  };

  handleChangeUser = (field, value) => {
    this.setState((s) => ({
      userForm: { ...s.userForm, [field]: value },
    }));
  };

  // Nutzer speichern
  async handleSaveUser(userId) {
    const { userForm } = this.state;
    try {
      await updateDoc(doc(db, "users", userId), {
        role: userForm.role,
        ...(userForm.password ? { password: userForm.password } : {}),
      });
      this.setState({
        userEdit: null,
        userForm: { username: "", role: "kunde", password: "" },
      });
    } catch (e) {
      alert("Fehler beim Speichern!");
    }
  }

  // Nutzer hinzufügen
  async handleAddUser() {
    const { userForm } = this.state;
    if (!userForm.username || !userForm.password) {
      this.setState({ error: "Name & Passwort erforderlich!" });
      return;
    }
    try {
      await addDoc(collection(db, "users"), {
        username: userForm.username,
        role: userForm.role,
        password: userForm.password,
      });
      this.setState({
        userForm: { username: "", role: "kunde", password: "" },
        userAddOpen: false,
        error: "",
      });
    } catch (e) {
      alert("Fehler beim Hinzufügen!");
    }
  }
    render() {
    const {
      produkte = [],
      orders = [],
      users = [],
      onGoBack,
      onChat,
    } = this.props;

    const {
      tab,
      produktEdit,
      produktForm,
      error,
      sortBy,
      produktAddForm,
      addError,
    } = this.state;

    const offeneDepositWishes = collectOpenDepositWishes(users);
    const offeneDeposits = collectDeposits(users, false);
    const abgeschlDeposits = collectDeposits(users, true);

    const sortedProdukte = [...produkte].sort((a, b) =>
      (a[sortBy] || "")
        .toString()
        .localeCompare((b[sortBy] || "").toString(), undefined, {
          numeric: true,
        })
    );

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#16171c",
          color: "#fff",
          fontFamily: "'Inter',sans-serif",
          padding: "0 0 60px 0",
        }}
      >
        <div
          style={{
            width: "98%",
            maxWidth: 900,
            margin: "0 auto",
            paddingTop: 38,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 30,
              gap: 14,
            }}
          >
            <button
              onClick={onGoBack}
              style={{
                background: "#23262e",
                color: "#fff",
                borderRadius: 9,
                border: 0,
                padding: "10px 26px",
                fontSize: 17,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ⬅️ Zurück
            </button>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 900,
                letterSpacing: 1,
                margin: 0,
              }}
            >
              Admin Panel
            </h2>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 7, marginBottom: 20 }}>
            {TABS.map((tabBtn) => (
              <button
                key={tabBtn.key}
                onClick={() => this.handleTab(tabBtn.key)}
                style={{
                  background: tab === tabBtn.key ? "#23262e" : "#22232b",
                  color: "#fff",
                  borderRadius: 8,
                  border: 0,
                  fontWeight: 700,
                  fontSize: 15,
                  padding: "8px 24px",
                  cursor: "pointer",
                  boxShadow:
                    tab === tabBtn.key ? "0 2px 10px #0001" : undefined,
                  borderBottom:
                    tab === tabBtn.key
                      ? "2px solid #38bdf8"
                      : "2px solid transparent",
                  transition: "all 0.13s",
                }}
              >
                {tabBtn.label}
              </button>
            ))}
          </div>

          {/* Tab-Inhalte */}
          {tab === "produkte" && (
            <div>
              {/* HIER KOMMT DER PRODUKT-TAB (bereits geliefert in Teil 4) */}
            </div>
          )}

          {tab === "orders" && (
            <div>
              {/* HIER KOMMT DER ORDER-TAB (bereits geliefert in Teil 5) */}
            </div>
          )}

          {tab === "users" && (
            <div>
              {/* HIER KOMMT DER NUTZER-TAB (bereits geliefert in Teil 5) */}
            </div>
          )}

          {tab === "broadcast" && (
            <div>
              {/* HIER KOMMT DER BROADCAST-TAB (bereits geliefert in Teil 3) */}
            </div>
          )}

          {tab === "deposits" && (
            <div>
              {/* HIER KOMMT DER EINZAHLUNGSTAB */}
              <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 14 }}>
                💸 Alle Einzahlungen
              </h3>
              <h4 style={{ color: "#fde047", fontWeight: 700, marginTop: 12 }}>
                Offene Einzahlungswünsche
              </h4>
              <OpenDepositList deposits={offeneDepositWishes} />

              <h4 style={{ color: "#fde047", fontWeight: 700, marginTop: 23 }}>
                Erkannte BTC-Einzahlungen (nicht gutgeschrieben)
              </h4>
              <DepositList deposits={offeneDeposits} />

              <h4 style={{ color: "#34d399", fontWeight: 700, marginTop: 23 }}>
                Abgeschlossene Einzahlungen
              </h4>
              <DepositList deposits={abgeschlDeposits} />
            </div>
          )}

          {tab === "lotto" && <LottoAdminTab />}
        </div>
      </div>
    );
  }
}

// ---- HILFSFUNKTIONEN für Einzahlungen/Wünsche ----

function collectOpenDepositWishes(users) {
  const wishes = [];
  users.forEach((u) => {
    if (u.openDeposit && !u.openDeposit.erledigt) {
      wishes.push({
        ...u.openDeposit,
        user: u.username,
        userId: u.id,
      });
    }
  });
  // Neueste zuerst
  return wishes.sort((a, b) => (b.ts || 0) - (a.ts || 0));
}

function collectDeposits(users, abgeschlossen = false) {
  const deposits = [];
  users.forEach((u) => {
    if (Array.isArray(u.btc_deposits)) {
      u.btc_deposits.forEach((d) => {
        // Status check (false = offen, true = abgeschlossen)
        if (Boolean(d.gutgeschrieben) === abgeschlossen) {
          deposits.push({
            ...d,
            user: u.username,
            userId: u.id,
          });
        }
      });
    }
  });
  // Sortiert nach Zeit, neueste oben
  return deposits.sort((a, b) => (b.time || b.ts || 0) - (a.time || a.ts || 0));
}

// ------------- LISTEN FÜR EINZAHLUNGEN/WÜNSCHE ---------

function OpenDepositList({ deposits }) {
  if (!deposits || deposits.length === 0)
    return (
      <div style={{ color: "#aaa", marginBottom: 13 }}>
        Keine offenen Einzahlungswünsche.
      </div>
    );
  return (
    <table
      style={{
        width: "100%",
        background: "#18181b",
        borderRadius: 9,
        marginBottom: 20,
      }}
    >
      <thead>
        <tr style={{ color: "#fde047", fontWeight: 900, fontSize: 16 }}>
          <th style={{ textAlign: "left", padding: 6 }}>User</th>
          <th style={{ textAlign: "left", padding: 6 }}>EUR</th>
          <th style={{ textAlign: "left", padding: 6 }}>BTC</th>
          <th style={{ textAlign: "left", padding: 6 }}>Zeit</th>
          <th style={{ textAlign: "left", padding: 6 }}>Status</th>
        </tr>
      </thead>
      <tbody>
        {deposits.map((d, i) => (
          <tr key={i}>
            <td style={{ padding: 7, fontWeight: 700 }}>{d.user}</td>
            <td style={{ padding: 7 }}>{d.eur ?? "-"}</td>
            <td style={{ padding: 7 }}>{d.btc ?? "-"}</td>
            <td style={{ padding: 7 }}>
              {d.ts ? new Date(d.ts).toLocaleString() : "-"}
            </td>
            <td style={{ padding: 7, color: "#fde047" }}>offen</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DepositList({ deposits }) {
  if (!deposits || deposits.length === 0)
    return (
      <div style={{ color: "#aaa", marginBottom: 13 }}>Keine Einzahlungen.</div>
    );
  return (
    <table
      style={{
        width: "100%",
        background: "#18181b",
        borderRadius: 9,
        marginBottom: 20,
      }}
    >
      <thead>
        <tr style={{ color: "#a3e635", fontWeight: 900, fontSize: 16 }}>
          <th style={{ textAlign: "left", padding: 6 }}>User</th>
          <th style={{ textAlign: "left", padding: 6 }}>Betrag (BTC)</th>
          <th style={{ textAlign: "left", padding: 6 }}>Zeit</th>
          <th style={{ textAlign: "left", padding: 6 }}>Status</th>
          <th style={{ textAlign: "left", padding: 6 }}>TX</th>
        </tr>
      </thead>
      <tbody>
        {deposits.map((d, i) => (
          <tr key={i}>
            <td style={{ padding: 7, fontWeight: 700 }}>{d.user}</td>
            <td style={{ padding: 7 }}>{d.amount ?? d.btc} BTC</td>
            <td style={{ padding: 7 }}>
              {d.time
                ? new Date(d.time).toLocaleString()
                : d.ts
                ? new Date(d.ts).toLocaleString()
                : "-"}
            </td>
            <td
              style={{
                padding: 7,
                color: d.gutgeschrieben ? "#22c55e" : "#fde047",
              }}
            >
              {d.gutgeschrieben ? "abgeschlossen" : "offen"}
            </td>
            <td style={{ padding: 7, maxWidth: 130, overflow: "auto" }}>
              <a
                href={
                  d.txid
                    ? "https://mempool.space/tx/" + d.txid
                    : d.tx
                    ? "https://mempool.space/tx/" + d.tx
                    : "#"
                }
                style={{ color: "#38bdf8" }}
                target="_blank"
                rel="noopener noreferrer"
              >
                {(d.txid || d.tx || "").slice(0, 18)}...
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}