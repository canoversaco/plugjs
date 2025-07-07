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
} from "firebase/firestore";
import { db } from "../firebase";
import images from "./images/images";

// Tabs inkl. Einzahlungen-Tab!
const TABS = [
  { key: "produkte", label: "🛒 Produkte" },
  { key: "orders", label: "📦 Bestellungen" },
  { key: "users", label: "👤 Nutzer" },
  { key: "broadcast", label: "📢 Broadcast" },
  { key: "deposits", label: "💸 Einzahlungen" },{ key: "lotto", label: "🎰 Lotto" },
];

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

    // Produkt HINZUFÜGEN (NEU!)
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
    broadcasts: [], // NEU: Liste aller Broadcasts
    broadcastEditId: null, // NEU: aktuell zu bearbeitender Broadcast
    broadcastEditText: "", // NEU: Text für Edit-Modus
  };
  componentDidMount() {
    this.fetchBroadcasts();
  } // Lädt alle Broadcasts aus Firestore
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
      this.fetchBroadcasts(); // neu laden
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

  // Order/User/Broadcast Methoden
  openOrderEdit(order) {
    this.setState({
      orderEdit: order.id,
      orderForm: {
        status: order.status || "",
        notiz: order.notiz || "",
      },
    });
  }

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

  handleChangeUser = (field, value) => {
    this.setState((s) => ({
      userForm: { ...s.userForm, [field]: value },
    }));
  };

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

  async handleSendBroadcast() {
    const text = this.state.broadcastText?.trim();
    if (!text) {
      this.setState({ broadcastError: "Bitte Text eingeben." });
      return;
    }
    try {
      await updateDoc(doc(db, "settings", "main"), {
        broadcast: text,
        ts: Date.now(),
      });
      this.setState({
        broadcastText: "",
        broadcastSuccess: "Gesendet!",
        broadcastError: "",
      });
      setTimeout(() => this.setState({ broadcastSuccess: "" }), 2000);
    } catch (e) {
      this.setState({ broadcastError: "Fehler beim Senden." });
    }
  }

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
    // Produkt-Sortierung
    const sortedProdukte = [...produkte].sort((a, b) =>
      (a[sortBy] || "")
        .toString()
        .localeCompare((b[sortBy] || "").toString(), undefined, {
          numeric: true,
        })
    );
const [lottos, setLottos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
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
          // ... (Rest deines Codes bleibt wie gehabt)

//LOTTO TAB
function LottoAdminTab() {
  

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "lottos"), (snap) => {
      const lottos = [];
      snap.forEach((d) => lottos.push({ id: d.id, ...d.data() }));
      // Neueste oben
      lottos.sort((a, b) => (b.start || 0) - (a.start || 0));
      setLottos(lottos);
    });
    return unsub;
  }, []);

  // Ziehung starten
  async function startLotto() {
    setLoading(true);
    setMessage("");
    try {
      const now = Date.now();
      // 7 Tage Laufzeit (in ms)
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

  // Ziehung abschließen, Gewinner festlegen und Guthaben auszahlen
  async function ziehungBeenden(lotto) {
    if (lotto.finished) return;
    if (!lotto.teilnehmer || lotto.teilnehmer.length === 0) {
      setMessage("Keine Teilnehmer!");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      // Zufälligen Gewinner wählen
      const winner =
        lotto.teilnehmer[Math.floor(Math.random() * lotto.teilnehmer.length)];
      const gewinnbetrag = Math.round((lotto.pot || 0) * 0.9 * 100) / 100;

      // Guthaben an Gewinner auszahlen
      const userRef = doc(db, "users", winner.userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};
      await updateDoc(userRef, {
        guthaben: (userData.guthaben ?? 0) + gewinnbetrag,
      });

      // Gewinner und Gewinn speichern
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

function anonymisiereName(name) {
  if (!name) return "";
  if (name.length < 2) return "***";
  return name.slice(0, 2) + "***" + name.slice(-2);
}

// ... (Rest deines Codes bleibt unverändert)
          {/* PRODUKTE-TAB */}
          {tab === "produkte" && (
            <div>
              {/* Sortieren */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 15,
                }}
              >
                <h3 style={{ fontWeight: 800, fontSize: 20, margin: 0 }}>
                  Produkte
                </h3>
                <div>
                  <label
                    style={{
                      fontWeight: 500,
                      fontSize: 14,
                      marginRight: 9,
                      color: "#a1a1aa",
                    }}
                  >
                    Sortieren:
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => this.setState({ sortBy: e.target.value })}
                    style={{
                      padding: 5,
                      borderRadius: 7,
                      fontSize: 15,
                      background: "#23262e",
                      color: "#fff",
                      border: 0,
                    }}
                  >
                    <option value="name">Name</option>
                    <option value="preis">Preis</option>
                    <option value="bestand">Bestand</option>
                    <option value="kategorie">Kategorie</option>
                  </select>
                </div>
              </div>
              {/* Produktliste */}
              <div
                style={{
                  maxHeight: 260,
                  overflowY: "auto",
                  marginBottom: 16,
                }}
              >
                {sortedProdukte.length === 0 ? (
                  <div style={{ color: "#aaa" }}>Keine Produkte vorhanden.</div>
                ) : (
                  sortedProdukte.map((p) =>
                    produktEdit === p.id ? (
                      <div
                        key={p.id}
                        style={{
                          background: "#292933",
                          borderRadius: 10,
                          padding: 13,
                          marginBottom: 10,
                          display: "flex",
                          gap: 9,
                          alignItems: "center",
                        }}
                      >
                        <img
                          src={images[p.bildName] || images.defaultBild}
                          alt={p.name}
                          style={{
                            width: 38,
                            height: 38,
                            objectFit: "cover",
                            borderRadius: 7,
                            marginRight: 8,
                          }}
                        />
                        <input
                          type="text"
                          value={produktForm.name}
                          onChange={(e) =>
                            this.handleChange("name", e.target.value)
                          }
                          placeholder="Name"
                          style={{ padding: 6, borderRadius: 7, width: 95 }}
                        />
                        <input
                          type="number"
                          value={produktForm.preis}
                          onChange={(e) =>
                            this.handleChange("preis", e.target.value)
                          }
                          placeholder="Preis (€)"
                          style={{ padding: 6, borderRadius: 7, width: 63 }}
                        />
                        <input
                          type="number"
                          value={produktForm.bestand}
                          onChange={(e) =>
                            this.handleChange("bestand", e.target.value)
                          }
                          placeholder="Bestand"
                          style={{ padding: 6, borderRadius: 7, width: 63 }}
                        />
                        <input
                          type="text"
                          value={produktForm.kategorie}
                          onChange={(e) =>
                            this.handleChange("kategorie", e.target.value)
                          }
                          placeholder="Kategorie"
                          style={{ padding: 6, borderRadius: 7, width: 87 }}
                        />
                        <input
                          type="text"
                          value={produktForm.beschreibung}
                          onChange={(e) =>
                            this.handleChange("beschreibung", e.target.value)
                          }
                          placeholder="Beschreibung"
                          style={{ padding: 6, borderRadius: 7, width: 120 }}
                        />
                        <select
                          value={produktForm.bildName}
                          onChange={(e) =>
                            this.handleChange("bildName", e.target.value)
                          }
                          style={{
                            padding: 6,
                            borderRadius: 7,
                            background: "#18181b",
                            color: "#fff",
                            border: 0,
                          }}
                        >
                          {Object.keys(images).map((k) => (
                            <option key={k} value={k}>
                              {k}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={this.handleSaveProdukt}
                          style={{
                            background: "#a3e635",
                            color: "#18181b",
                            border: 0,
                            borderRadius: 8,
                            padding: "6px 14px",
                            fontWeight: 700,
                            fontSize: 14,
                            marginLeft: 6,
                            cursor: "pointer",
                          }}
                        >
                          Speichern
                        </button>
                        <button
                          onClick={() => this.setState({ produktEdit: null })}
                          style={{
                            background: "#23262e",
                            color: "#fff",
                            border: 0,
                            borderRadius: 8,
                            padding: "6px 11px",
                            fontWeight: 700,
                            fontSize: 14,
                            cursor: "pointer",
                            marginLeft: 4,
                          }}
                        >
                          Abbr.
                        </button>
                        <div style={{ color: "#f87171", minWidth: 56 }}>
                          {error}
                        </div>
                      </div>
                    ) : (
                      <div
                        key={p.id}
                        style={{
                          background: "#23262e",
                          borderRadius: 10,
                          padding: 9,
                          marginBottom: 7,
                          display: "flex",
                          alignItems: "center",
                          gap: 9,
                        }}
                      >
                        <img
                          src={images[p.bildName] || images.defaultBild}
                          alt={p.name}
                          style={{
                            width: 36,
                            height: 36,
                            objectFit: "cover",
                            borderRadius: 7,
                            marginRight: 7,
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <b style={{ fontSize: 15 }}>{p.name}</b>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#a1a1aa",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: 120,
                            }}
                          >
                            {p.beschreibung}
                          </div>
                          <div style={{ fontSize: 13, marginTop: 1 }}>
                            💰 {p.preis}€ | 📦 {p.bestand} | 🏷️ {p.kategorie}
                          </div>
                        </div>
                        <button
                          onClick={() => this.handleEditProdukt(p)}
                          style={{
                            background: "#38bdf8",
                            color: "#18181b",
                            border: 0,
                            borderRadius: 8,
                            padding: "5px 11px",
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: "pointer",
                            marginRight: 5,
                          }}
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => this.handleProduktDelete(p.id)}
                          style={{
                            background: "#f87171",
                            color: "#fff",
                            border: 0,
                            borderRadius: 8,
                            padding: "5px 9px",
                            fontWeight: 700,
                            fontSize: 14,
                            cursor: "pointer",
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    )
                  )
                )}
              </div>
              {/* Produkt HINZUFÜGEN */}
              <div
                style={{
                  marginTop: 10,
                  background: "#18181b",
                  borderRadius: 9,
                  padding: 11,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <h4
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
                    margin: 0,
                    minWidth: 115,
                  }}
                >
                  ➕ Produkt
                </h4>
                <input
                  type="text"
                  value={produktAddForm.name}
                  onChange={(e) => this.handleChangeAdd("name", e.target.value)}
                  placeholder="Name"
                  style={{
                    padding: 6,
                    borderRadius: 7,
                    width: 95,
                  }}
                />
                <input
                  type="number"
                  value={produktAddForm.preis}
                  onChange={(e) =>
                    this.handleChangeAdd("preis", e.target.value)
                  }
                  placeholder="Preis (€)"
                  style={{
                    padding: 6,
                    borderRadius: 7,
                    width: 63,
                  }}
                />
                <input
                  type="number"
                  value={produktAddForm.bestand}
                  onChange={(e) =>
                    this.handleChangeAdd("bestand", e.target.value)
                  }
                  placeholder="Bestand"
                  style={{
                    padding: 6,
                    borderRadius: 7,
                    width: 63,
                  }}
                />
                <input
                  type="text"
                  value={produktAddForm.kategorie}
                  onChange={(e) =>
                    this.handleChangeAdd("kategorie", e.target.value)
                  }
                  placeholder="Kategorie"
                  style={{
                    padding: 6,
                    borderRadius: 7,
                    width: 87,
                  }}
                />
                <input
                  type="text"
                  value={produktAddForm.beschreibung}
                  onChange={(e) =>
                    this.handleChangeAdd("beschreibung", e.target.value)
                  }
                  placeholder="Beschreibung"
                  style={{
                    padding: 6,
                    borderRadius: 7,
                    width: 120,
                  }}
                />
                <select
                  value={produktAddForm.bildName}
                  onChange={(e) =>
                    this.handleChangeAdd("bildName", e.target.value)
                  }
                  style={{
                    padding: 6,
                    borderRadius: 7,
                    background: "#18181b",
                    color: "#fff",
                    border: 0,
                  }}
                >
                  {Object.keys(images).map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
                <button
                  onClick={this.handleAddProdukt}
                  style={{
                    background: "#a3e635",
                    color: "#18181b",
                    border: 0,
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  Hinzufügen
                </button>
                <div style={{ color: "#f87171", minWidth: 48 }}>{addError}</div>
              </div>
            </div>
          )}
          {/* --- Orders/Nutzer/Broadcast Tabs wie gehabt... */}
          {tab === "orders" && (
            <div>
              <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 18 }}>
                Bestellungen
              </h3>
              {orders.length === 0 ? (
                <div>Keine Bestellungen.</div>
              ) : (
                orders
                  .sort((a, b) => b.ts - a.ts)
                  .map((order) =>
                    this.state.orderEdit === order.id ? (
                      <div
                        key={order.id}
                        style={{
                          background: "#292933",
                          borderRadius: 12,
                          marginBottom: 18,
                          padding: 18,
                          boxShadow: "0 2px 8px #00000018",
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: 17 }}>
                          {order.kunde} |{" "}
                          <span style={{ color: "#38bdf8" }}>
                            {order.status}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: "#a1a1aa",
                            marginBottom: 8,
                          }}
                        >
                          Bestellt am:{" "}
                          {order.ts ? new Date(order.ts).toLocaleString() : "-"}
                        </div>
                        <ul style={{ paddingLeft: 16, marginBottom: 8 }}>
                          {order.warenkorb &&
                            order.warenkorb.map((item, idx) => {
                              const p = produkte.find(
                                (pr) => pr.id === item.produktId
                              );
                              return (
                                <li key={idx}>
                                  {p?.name || "?"} × {item.menge}
                                </li>
                              );
                            })}
                        </ul>
                        <div style={{ fontWeight: 700 }}>
                          Endpreis: {order.endpreis?.toFixed(2) ?? "-"} €
                        </div>
                        <div style={{ margin: "14px 0" }}>
                          Status:{" "}
                          <select
                            value={this.state.orderForm.status}
                            onChange={(e) =>
                              this.setState({
                                orderForm: {
                                  ...this.state.orderForm,
                                  status: e.target.value,
                                },
                              })
                            }
                            style={{
                              borderRadius: 7,
                              padding: 6,
                              width: 130,
                            }}
                          >
                            <option value="offen">offen</option>
                            <option value="abgeschlossen">abgeschlossen</option>
                            <option value="storniert">storniert</option>
                          </select>
                        </div>
                        <div>
                          <input
                            type="text"
                            value={this.state.orderForm.notiz}
                            onChange={(e) =>
                              this.setState({
                                orderForm: {
                                  ...this.state.orderForm,
                                  notiz: e.target.value,
                                },
                              })
                            }
                            placeholder="Notiz"
                            style={{
                              borderRadius: 7,
                              padding: 5,
                              width: 220,
                            }}
                          />
                        </div>
                        <button
                          onClick={() => this.handleSaveOrder(order.id)}
                          style={{
                            marginTop: 13,
                            background: "#a3e635",
                            color: "#18181b",
                            border: 0,
                            borderRadius: 8,
                            padding: "7px 22px",
                            fontWeight: 700,
                            fontSize: 15,
                            cursor: "pointer",
                            marginRight: 9,
                          }}
                        >
                          Speichern
                        </button>
                        <button
                          onClick={() => this.setState({ orderEdit: null })}
                          style={{
                            marginTop: 13,
                            background: "#23262e",
                            color: "#fff",
                            border: 0,
                            borderRadius: 8,
                            padding: "7px 22px",
                            fontWeight: 700,
                            fontSize: 15,
                            cursor: "pointer",
                          }}
                        >
                          Abbrechen
                        </button>
                      </div>
                    ) : (
                      <div
                        key={order.id}
                        style={{
                          background: "#23262e",
                          borderRadius: 12,
                          marginBottom: 17,
                          padding: 15,
                          boxShadow: "0 2px 8px #00000018",
                          display: "flex",
                          alignItems: "center",
                          gap: 13,
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 17 }}>
                            {order.kunde} | {order.status}
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              color: "#a1a1aa",
                              marginBottom: 7,
                            }}
                          >
                            Bestellt am:{" "}
                            {order.ts
                              ? new Date(order.ts).toLocaleString()
                              : "-"}
                          </div>
                          <ul style={{ paddingLeft: 16, marginBottom: 8 }}>
                            {order.warenkorb &&
                              order.warenkorb.map((item, idx) => {
                                const p = produkte.find(
                                  (pr) => pr.id === item.produktId
                                );
                                return (
                                  <li key={idx}>
                                    {p?.name || "?"} × {item.menge}
                                  </li>
                                );
                              })}
                          </ul>
                          <div style={{ fontWeight: 700 }}>
                            Endpreis: {order.endpreis?.toFixed(2) ?? "-"} €
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                          }}
                        >
                          <button
                            onClick={() => this.openOrderEdit(order)}
                            style={{
                              background: "#38bdf8",
                              color: "#18181b",
                              border: 0,
                              borderRadius: 8,
                              padding: "7px 14px",
                              fontWeight: 700,
                              fontSize: 14,
                              cursor: "pointer",
                            }}
                          >
                            Bearbeiten
                          </button>
                          <button
                            onClick={() => this.handleOrderDelete(order.id)}
                            style={{
                              background: "#f87171",
                              color: "#fff",
                              border: 0,
                              borderRadius: 8,
                              padding: "7px 14px",
                              fontWeight: 700,
                              fontSize: 14,
                              cursor: "pointer",
                            }}
                          >
                            🗑️ Löschen
                          </button>
                          <button
                            onClick={() => onChat(order)}
                            style={{
                              background: "#a3e635",
                              color: "#18181b",
                              border: 0,
                              borderRadius: 8,
                              padding: "7px 14px",
                              fontWeight: 700,
                              fontSize: 14,
                              cursor: "pointer",
                            }}
                          >
                            💬 Chat
                          </button>
                        </div>
                      </div>
                    )
                  )
              )}
            </div>
          )}
          {tab === "users" && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <h3 style={{ fontWeight: 800, fontSize: 20, margin: 0 }}>
                  Nutzer
                </h3>
                <button
                  onClick={() =>
                    this.setState({ userAddOpen: !this.state.userAddOpen })
                  }
                  style={{
                    background: "#a3e635",
                    color: "#18181b",
                    border: 0,
                    borderRadius: 8,
                    padding: "4px 15px",
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: "pointer",
                  }}
                >
                  {this.state.userAddOpen ? "✖" : "➕ Nutzer"}
                </button>
              </div>
              {this.state.userAddOpen && (
                <div
                  style={{
                    marginBottom: 15,
                    background: "#18181b",
                    borderRadius: 8,
                    padding: 11,
                    display: "flex",
                    gap: 7,
                    alignItems: "center",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Benutzername"
                    value={this.state.userForm.username}
                    onChange={(e) =>
                      this.handleChangeUser("username", e.target.value)
                    }
                    style={{
                      padding: 6,
                      borderRadius: 7,
                      width: 100,
                    }}
                  />
                  <input
                    type="password"
                    placeholder="Passwort"
                    value={this.state.userForm.password}
                    onChange={(e) =>
                      this.handleChangeUser("password", e.target.value)
                    }
                    style={{
                      padding: 6,
                      borderRadius: 7,
                      width: 100,
                    }}
                  />
                  <select
                    value={this.state.userForm.role}
                    onChange={(e) =>
                      this.handleChangeUser("role", e.target.value)
                    }
                    style={{ padding: 6, borderRadius: 7, minWidth: 100 }}
                  >
                    <option value="kunde">Kunde</option>
                    <option value="kurier">Kurier</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    onClick={() => this.handleAddUser()}
                    style={{
                      background: "#38bdf8",
                      color: "#18181b",
                      border: 0,
                      borderRadius: 8,
                      padding: "6px 12px",
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    Hinzufügen
                  </button>
                </div>
              )}
              <ul style={{ marginTop: 7 }}>
                {users.map((u) =>
                  this.state.userEdit === u.id ? (
                    <li
                      key={u.id}
                      style={{
                        marginBottom: 9,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>{u.username}</span>
                      <select
                        value={this.state.userForm.role}
                        onChange={(e) =>
                          this.handleChangeUser("role", e.target.value)
                        }
                        style={{
                          marginLeft: 7,
                          borderRadius: 6,
                          padding: 4,
                        }}
                      >
                        <option value="kunde">kunde</option>
                        <option value="admin">admin</option>
                        <option value="kurier">kurier</option>
                      </select>
                      <input
                        type="password"
                        placeholder="Passwort ändern (leer = unverändert)"
                        value={this.state.userForm.password}
                        onChange={(e) =>
                          this.handleChangeUser("password", e.target.value)
                        }
                        style={{
                          marginLeft: 7,
                          padding: 4,
                          borderRadius: 6,
                          width: 110,
                        }}
                      />
                      <button
                        onClick={() => this.handleSaveUser(u.id)}
                        style={{
                          background: "#a3e635",
                          color: "#18181b",
                          border: 0,
                          borderRadius: 8,
                          padding: "4px 10px",
                          fontWeight: 700,
                          fontSize: 14,
                          marginRight: 7,
                          cursor: "pointer",
                        }}
                      >
                        Speichern
                      </button>
                      <button
                        onClick={() => this.setState({ userEdit: null })}
                        style={{
                          background: "#23262e",
                          color: "#fff",
                          border: 0,
                          borderRadius: 8,
                          padding: "4px 9px",
                          fontWeight: 700,
                          fontSize: 14,
                          cursor: "pointer",
                        }}
                      >
                        Abbr.
                      </button>
                    </li>
                  ) : (
                    <li key={u.id} style={{ marginBottom: 6 }}>
                      {u.username} ({u.role})
                      <button
                        onClick={() => this.openUserEdit(u)}
                        style={{
                          marginLeft: 8,
                          background: "#38bdf8",
                          color: "#18181b",
                          border: 0,
                          borderRadius: 7,
                          padding: "2px 10px",
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        Bearbeiten
                      </button>
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
          {this.state.tab === "broadcast" && (
            <div>
              <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 16 }}>
                📢 Broadcasts verwalten
              </h3>
              <div style={{ marginBottom: 20 }}>
                <textarea
                  value={this.state.broadcastText}
                  onChange={(e) =>
                    this.setState({ broadcastText: e.target.value })
                  }
                  placeholder="Neue Nachricht eingeben..."
                  style={{
                    marginTop: 8,
                    width: "100%",
                    borderRadius: 7,
                    border: 0,
                    padding: 10,
                    fontSize: 16,
                    background: "#18181b",
                    color: "#fff",
                    resize: "vertical",
                    minHeight: 48,
                  }}
                />
                <button
                  onClick={this.handleSendBroadcast}
                  style={{
                    marginTop: 9,
                    background: "#38bdf8",
                    color: "#18181b",
                    border: 0,
                    borderRadius: 8,
                    padding: "7px 26px",
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                >
                  Senden
                </button>
              </div>
              <div style={{ color: "#a3e635", minHeight: 20 }}>
                {this.state.broadcastSuccess}
              </div>
              <div style={{ color: "#f87171", minHeight: 20 }}>
                {this.state.broadcastError}
              </div>
              {/* Broadcast-Liste */}
              <div style={{ marginTop: 18 }}>
                {this.state.broadcasts.length === 0 ? (
                  <div style={{ color: "#a1a1aa" }}>
                    Keine Broadcasts vorhanden.
                  </div>
                ) : (
                  this.state.broadcasts.map((b) =>
                    this.state.broadcastEditId === b.id ? (
                      <div
                        key={b.id}
                        style={{
                          background: "#23262e",
                          borderRadius: 9,
                          marginBottom: 11,
                          padding: 11,
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <textarea
                          value={this.state.broadcastEditText}
                          onChange={(e) =>
                            this.setState({ broadcastEditText: e.target.value })
                          }
                          style={{
                            width: "80%",
                            borderRadius: 7,
                            border: 0,
                            padding: 9,
                            fontSize: 15,
                            background: "#18181b",
                            color: "#fff",
                            minHeight: 40,
                          }}
                        />
                        <button
                          onClick={this.handleSaveEditBroadcast}
                          style={{
                            marginLeft: 7,
                            background: "#a3e635",
                            color: "#18181b",
                            border: 0,
                            borderRadius: 8,
                            padding: "6px 12px",
                            fontWeight: 700,
                            fontSize: 15,
                            cursor: "pointer",
                          }}
                        >
                          Speichern
                        </button>
                        <button
                          onClick={this.handleCancelEditBroadcast}
                          style={{
                            marginLeft: 6,
                            background: "#23262e",
                            color: "#fff",
                            border: 0,
                            borderRadius: 8,
                            padding: "6px 11px",
                            fontWeight: 700,
                            fontSize: 15,
                            cursor: "pointer",
                          }}
                        >
                          Abbr.
                        </button>
                      </div>
                    ) : (
                      <div
                        key={b.id}
                        style={{
                          background: "#23262e",
                          borderRadius: 9,
                          marginBottom: 10,
                          padding: 12,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div
                          style={{
                            color: "#fff",
                            fontSize: 16,
                            fontWeight: 700,
                          }}
                        >
                          {b.text}
                        </div>
                        <div style={{ display: "flex", gap: 9 }}>
                          <button
                            onClick={() =>
                              this.handleEditBroadcast(b.id, b.text)
                            }
                            style={{
                              background: "#38bdf8",
                              color: "#18181b",
                              border: 0,
                              borderRadius: 7,
                              padding: "6px 12px",
                              fontWeight: 700,
                              fontSize: 15,
                              cursor: "pointer",
                            }}
                          >
                            Bearbeiten
                          </button>
                          <button
                            onClick={() => this.handleDeleteBroadcast(b.id)}
                            style={{
                              background: "#f87171",
                              color: "#fff",
                              border: 0,
                              borderRadius: 7,
                              padding: "6px 12px",
                              fontWeight: 700,
                              fontSize: 15,
                              cursor: "pointer",
                            }}
                          >
                            Löschen
                          </button>
                        </div>
                      </div>
                    )
                  )
                )}
              </div>
            </div>
          )}
          {/* --- EINZAHLUNGEN-TAB NEU --- */}
          {tab === "deposits" && (
            <div>
              <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 14 }}>
                💸 Alle Einzahlungen
              </h3>
              {/* OFFENE EINZAHLUNGSWÜNSCHE */}
              <h4 style={{ color: "#fde047", fontWeight: 700, marginTop: 12 }}>
                Offene Einzahlungswünsche (noch nicht ausgeführt)
              </h4>
              <OpenDepositList deposits={offeneDepositWishes} />

              {/* OFFENE, ERKANNTE, ABER NICHT GUTGESCHRIEBENE BTC-EINZAHLUNGEN */}
              <h4 style={{ color: "#fde047", fontWeight: 700, marginTop: 23 }}>
                Erkannte BTC-Einzahlungen (noch nicht gutgeschrieben)
              </h4>
              <DepositList deposits={offeneDeposits} />

              {/* ABGESCHLOSSENE EINZAHLUNGEN */}
              <h4 style={{ color: "#34d399", fontWeight: 700, marginTop: 23 }}>
                Abgeschlossene Einzahlungen
              </h4>
              <DepositList deposits={abgeschlDeposits} />
            </div>
          )}
          )}
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
