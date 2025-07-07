// src/components/AdminView.js
import React, { useState, useEffect } from "react";

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";

import { onSnapshot } from "firebase/firestore";
import images from "./images/images";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Coins,
  Award,
  BarChart2,
  Activity,
  Users as UsersIcon,
  User,
  Broadcast,
  Package,
  Key,
  LogOut,
} from "lucide-react";

// ---- TABS, PERIODS
const TABS = [
  { key: "dashboard", label: "📊 Dashboard" },
  { key: "produkte", label: "🛒 Produkte" },
  { key: "orders", label: "📦 Bestellungen" },
  { key: "users", label: "👤 Nutzer" },
  { key: "broadcast", label: "📢 Broadcast" },
  { key: "deposits", label: "💸 Einzahlungen" },
  { key: "lotto", label: "🎰 Lotto" },
];
const PERIODS = [
  { key: "7d", label: "7 Tage", ms: 7 * 24 * 3600 * 1000 },
  { key: "14d", label: "14 Tage", ms: 14 * 24 * 3600 * 1000 },
  { key: "30d", label: "1 Monat", ms: 30 * 24 * 3600 * 1000 },
  { key: "all", label: "Allzeit", ms: null },
];

// ---- MAIN COMPONENT ----
export default class AdminView extends React.Component {
  state = {
    tab: "dashboard",
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
    produktAddForm: {
      name: "",
      preis: "",
      bestand: "",
      beschreibung: "",
      bildName: "defaultBild",
      kategorie: "",
    },
    addError: "",
    orderEdit: null,
    orderForm: { status: "", notiz: "" },
    userEdit: null,
    userForm: { username: "", rolle: "kunde", passwort: "" },
    userAddOpen: false,
    broadcastText: "",
    broadcastError: "",
    broadcastSuccess: "",
    broadcasts: [],
    broadcastEditId: null,
    broadcastEditText: "",
    statsPeriod: "7d",
  };

  componentDidMount() {
    this.fetchBroadcasts();
  }

  fetchBroadcasts = async () => {
    const q = query(collection(db, "broadcasts"), orderBy("created", "desc"));
    const snap = await getDocs(q);
    const broadcasts = [];
    snap.forEach((docSnap) => {
      broadcasts.push({ id: docSnap.id, ...docSnap.data() });
    });
    this.setState({ broadcasts });
  };

  // Broadcast-Handling
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
  handleDeleteBroadcast = async (id) => {
    if (!window.confirm("Broadcast wirklich löschen?")) return;
    await deleteDoc(doc(db, "broadcasts", id));
    this.fetchBroadcasts();
  };
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

  // PRODUKTE
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

  handleSaveProdukt = async () => {
    const { produktForm, produktEdit } = this.state;
    if (
      !produktForm.name ||
      produktForm.preis === "" ||
      produktForm.preis <= 0 ||
      produktForm.bestand === "" ||
      produktForm.bestand < 0
    ) {
      this.setState({ error: "Bitte gültige Produktdaten angeben." });
      return;
    }
    if (this.props.onProduktUpdate) {
      await this.props.onProduktUpdate(produktEdit, {
        ...produktForm,
        preis: Number(produktForm.preis),
        bestand: Number(produktForm.bestand),
      });
    }
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

  handleAddProdukt = async () => {
    const { produktAddForm } = this.state;
    if (
      !produktAddForm.name ||
      produktAddForm.preis === "" ||
      produktAddForm.preis <= 0
    ) {
      this.setState({ addError: "Produktname & Preis erforderlich." });
      return;
    }
    if (this.props.onProduktAdd) {
      await this.props.onProduktAdd({
        ...produktAddForm,
        preis: Number(produktAddForm.preis),
        bestand: Number(produktAddForm.bestand),
      });
    }
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

  handleProduktDelete = async (produktId) => {
    if (window.confirm("Produkt wirklich löschen?")) {
      try {
        await deleteDoc(doc(db, "produkte", produktId));
        // Produkte-Liste wird durch Parent neu geladen, sonst hier explizit laden!
        alert("Produkt gelöscht!");
      } catch (e) {
        alert("Fehler beim Löschen des Produkts!");
      }
    }
  };

  // ORDERS
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

  // USERS
  handleChangeUser = (field, value) => {
    this.setState((s) => ({
      userForm: { ...s.userForm, [field]: value },
    }));
  };
  openUserEdit = (u) => {
    this.setState({
      userEdit: u.id,
      userForm: {
        username: u.username,
        rolle: u.rolle,
        passwort: "",
      },
    });
  };
  async handleSaveUser(userId) {
    const { userForm } = this.state;
    try {
      await updateDoc(doc(db, "users", userId), {
        rolle: userForm.rolle,
        ...(userForm.passwort ? { passwort: userForm.passwort } : {}),
      });
      this.setState({
        userEdit: null,
        userForm: { username: "", rolle: "kunde", passwort: "" },
      });
    } catch (e) {
      alert("Fehler beim Speichern!");
    }
  }
  async handleAddUser() {
    const { userForm } = this.state;
    if (!userForm.username || !userForm.passwort) {
      this.setState({ error: "Name & Passwort erforderlich!" });
      return;
    }
    try {
      await addDoc(collection(db, "users"), {
        username: userForm.username,
        rolle: userForm.rolle,
        passwort: userForm.passwort,
      });
      this.setState({
        userForm: { username: "", rolle: "kunde", passwort: "" },
        userAddOpen: false,
        error: "",
      });
    } catch (e) {
      alert("Fehler beim Hinzufügen!");
    }
  }

  // ---- Dashboard Statistiken
  filterOrdersByPeriod(orders, periodKey) {
    const now = Date.now();
    const period = PERIODS.find((p) => p.key === periodKey);
    if (!period || !period.ms) return orders;
    return orders.filter((o) => now - o.ts <= period.ms);
  }
  getStats(orders, produkte, users, periodKey) {
    const filteredOrders = this.filterOrdersByPeriod(orders, periodKey);
    let sumAll = 0;
    let sumBar = 0;
    let sumCrypto = 0;
    let countBar = 0;
    let countCrypto = 0;
    let productSales = {};
    let userStats = {};

    filteredOrders.forEach((o) => {
      if (o.status === "storniert") return;
      const val = Number(o.endpreis || 0);
      sumAll += val;
      if (o.zahlung === "krypto") {
        sumCrypto += val;
        countCrypto += 1;
      } else {
        sumBar += val;
        countBar += 1;
      }
      if (Array.isArray(o.warenkorb)) {
        o.warenkorb.forEach((item) => {
          productSales[item.produktId] =
            (productSales[item.produktId] || 0) + item.menge;
        });
      }
      if (o.kunde) {
        userStats[o.kunde] = userStats[o.kunde] || { sum: 0, count: 0 };
        userStats[o.kunde].sum += val;
        userStats[o.kunde].count += 1;
      }
    });

    // Top-Produkte
    const topProducts = Object.entries(productSales)
      .map(([produktId, menge]) => ({
        produkt: produkte.find((p) => p.id === produktId) || { name: "?" },
        menge,
      }))
      .sort((a, b) => b.menge - a.menge)
      .slice(0, 3);

    // Top-Kunden
    const topKunden = Object.entries(userStats)
      .map(([username, v]) => ({
        username,
        umsatz: v.sum,
        bestellungen: v.count,
      }))
      .sort((a, b) => b.umsatz - a.umsatz)
      .slice(0, 3);

    return {
      umsatz: sumAll,
      bar: sumBar,
      krypto: sumCrypto,
      bestellungen: filteredOrders.length,
      countBar,
      countCrypto,
      avg: filteredOrders.length ? sumAll / filteredOrders.length : 0,
      topProducts,
      topKunden,
      kundenGesamt: users.length,
    };
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
      statsPeriod,
    } = this.state;

    const stats = this.getStats(orders, produkte, users, statsPeriod);

    // Admin Panel Layout
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(133deg,#18181b 80%,#23262e 100%)",
          color: "#fff",
          fontFamily: "'Inter',sans-serif",
          padding: "0 0 60px 0",
        }}
      >
        <div
          style={{
            width: "99%",
            maxWidth: 1100,
            margin: "0 auto",
            paddingTop: 32,
          }}
        >
          {/* Header + Tabs */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 20,
              gap: 10,
              flexWrap: "wrap",
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
                boxShadow: "0 2px 9px #0006",
              }}
            >
              ⬅️ Zurück
            </button>
            <h2
              style={{
                fontSize: 29,
                fontWeight: 900,
                letterSpacing: 1,
                margin: 0,
                flex: 1,
              }}
            >
              Admin Panel
            </h2>
            <div style={{ display: "flex", gap: 6 }}>
              {TABS.map((tabBtn) => (
                <button
                  key={tabBtn.key}
                  onClick={() => this.handleTab(tabBtn.key)}
                  style={{
                    background: tab === tabBtn.key ? "#38bdf8" : "#23262e",
                    color: tab === tabBtn.key ? "#18181b" : "#fff",
                    borderRadius: 9,
                    border: 0,
                    fontWeight: 800,
                    fontSize: 16,
                    padding: "8px 20px",
                    cursor: "pointer",
                    transition: "all 0.13s",
                    boxShadow:
                      tab === tabBtn.key ? "0 2px 16px #38bdf844" : undefined,
                  }}
                >
                  {tabBtn.label}
                </button>
              ))}
            </div>
          </div>

          {/* --- DASHBOARD --- */}
          {tab === "dashboard" && (
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 24,
                  marginBottom: 25,
                  alignItems: "flex-end",
                  flexWrap: "wrap",
                }}
              >
                {/* Zeitraum Auswahl */}
                <div style={{ flex: 1, minWidth: 210 }}>
                  <h3
                    style={{
                      fontWeight: 900,
                      fontSize: 22,
                      margin: 0,
                      marginBottom: 6,
                      letterSpacing: 0.2,
                    }}
                  >
                    📊 Statistiken
                  </h3>
                  <div style={{ marginTop: 7, marginBottom: 3 }}>
                    {PERIODS.map((p) => (
                      <button
                        key={p.key}
                        onClick={() => this.setState({ statsPeriod: p.key })}
                        style={{
                          background:
                            statsPeriod === p.key ? "#a3e635" : "#23262e",
                          color: statsPeriod === p.key ? "#18181b" : "#a1a1aa",
                          border: 0,
                          borderRadius: 7,
                          padding: "5px 17px",
                          fontWeight: 800,
                          fontSize: 15,
                          marginRight: 9,
                          cursor: "pointer",
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Gesamtumsatz */}
                <motion.div
                  whileHover={{ scale: 1.06 }}
                  transition={{ type: "spring", stiffness: 180 }}
                  style={{
                    background:
                      "linear-gradient(117deg,#38bdf8 80%,#18181b 100%)",
                    color: "#18181b",
                    borderRadius: 17,
                    minWidth: 210,
                    minHeight: 105,
                    padding: "22px 30px 18px 28px",
                    fontWeight: 900,
                    fontSize: 23,
                    boxShadow: "0 2px 12px #38bdf833",
                  }}
                >
                  <Coins size={35} style={{ marginBottom: 2 }} />
                  <div style={{ fontWeight: 800, fontSize: 18, color: "#fff" }}>
                    Gesamtumsatz
                  </div>
                  <div style={{ fontWeight: 900, fontSize: 27 }}>
                    {stats.umsatz.toFixed(2)} €
                  </div>
                  <div
                    style={{ fontSize: 15, color: "#a1a1aa", fontWeight: 600 }}
                  >
                    {stats.bestellungen} Bestellungen
                  </div>
                </motion.div>
              </div>

              {/* KPI-Kachel-Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(235px,1fr))",
                  gap: 23,
                  marginBottom: 25,
                }}
              >
                <StatTile
                  title="Bar-Umsatz"
                  value={stats.bar.toFixed(2) + " €"}
                  icon={<Award size={27} />}
                  color="#a3e635"
                  sub={`Transaktionen: ${stats.countBar}`}
                />
                <StatTile
                  title="Krypto-Umsatz"
                  value={stats.krypto.toFixed(2) + " €"}
                  icon={<Activity size={27} />}
                  color="#38bdf8"
                  sub={`Transaktionen: ${stats.countCrypto}`}
                />
                <StatTile
                  title="Ø Bestellwert"
                  value={stats.avg.toFixed(2) + " €"}
                  icon={<BarChart2 size={27} />}
                  color="#a1a1aa"
                  sub={stats.bestellungen + " Bestellungen"}
                />
                <StatTile
                  title="Kunden gesamt"
                  value={stats.kundenGesamt}
                  icon={<UsersIcon size={27} />}
                  color="#fde047"
                />
              </div>

              {/* Top-Produkte & Top-Kunden */}
              <div
                style={{
                  display: "flex",
                  gap: 30,
                  marginTop: 10,
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                }}
              >
                {/* Top-Produkte */}
                <div style={{ minWidth: 250, flex: 1 }}>
                  <h4
                    style={{
                      color: "#38bdf8",
                      fontWeight: 900,
                      fontSize: 18,
                      marginBottom: 8,
                    }}
                  >
                    🏆 Meistverkaufte Produkte
                  </h4>
                  {stats.topProducts.length === 0 && (
                    <div style={{ color: "#a1a1aa" }}>Keine Daten.</div>
                  )}
                  {stats.topProducts.map((prod, idx) => (
                    <motion.div
                      key={prod.produkt.name + idx}
                      whileHover={{ scale: 1.04 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 13,
                        background: "#23262e",
                        borderRadius: 11,
                        padding: "10px 13px",
                        marginBottom: 8,
                        boxShadow: "0 1px 8px #38bdf811",
                      }}
                    >
                      <img
                        src={
                          images[prod.produkt.bildName] || images.defaultBild
                        }
                        alt={prod.produkt.name}
                        style={{
                          width: 36,
                          height: 36,
                          objectFit: "cover",
                          borderRadius: 7,
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <b style={{ fontSize: 15 }}>{prod.produkt.name}</b>
                        <div style={{ fontSize: 13, color: "#a1a1aa" }}>
                          {prod.menge} verkauft
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                {/* Top-Kunden */}
                <div style={{ minWidth: 250, flex: 1 }}>
                  <h4
                    style={{
                      color: "#a3e635",
                      fontWeight: 900,
                      fontSize: 18,
                      marginBottom: 8,
                    }}
                  >
                    👑 Top Kunden (Umsatz)
                  </h4>
                  {stats.topKunden.length === 0 && (
                    <div style={{ color: "#a1a1aa" }}>Keine Daten.</div>
                  )}
                  {stats.topKunden.map((kunde, idx) => (
                    <motion.div
                      key={kunde.username}
                      whileHover={{ scale: 1.03 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        background: "#23262e",
                        borderRadius: 11,
                        padding: "10px 13px",
                        marginBottom: 8,
                        boxShadow: "0 1px 8px #a3e63522",
                      }}
                    >
                      <User size={24} style={{ marginRight: 3 }} />
                      <div style={{ flex: 1 }}>
                        <b style={{ fontSize: 15 }}>{kunde.username}</b>
                        <div style={{ fontSize: 13, color: "#a1a1aa" }}>
                          Umsatz: {kunde.umsatz.toFixed(2)} €<br />
                          Bestellungen: {kunde.bestellungen}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* --- ALLE WEITEREN TABS: Produkte, Orders, Nutzer, Broadcast, Deposits --- */}
          {tab === "produkte" && renderProdukteTab(this)}
          {tab === "orders" && renderOrdersTab(this, produkte, orders, onChat)}
          {tab === "users" && renderUsersTab(this, users)}
          {tab === "broadcast" && renderBroadcastTab(this)}
          {tab === "deposits" && renderDepositsTab(users)}
          {tab === "lotto" && <LottoAdminTab />}
        </div>
      </div>
    );
  }
}

// ---------- STAT KACHEL ----------
function StatTile({ title, value, icon, color, sub }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, boxShadow: `0 2px 14px ${color}33` }}
      style={{
        background: "#23262e",
        borderRadius: 14,
        minHeight: 80,
        padding: "18px 22px",
        fontWeight: 900,
        fontSize: 20,
        color,
        boxShadow: "0 1px 10px #0003",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 5,
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {icon}
        <span
          style={{
            color: "#fff",
            fontSize: 15,
            fontWeight: 800,
            marginLeft: 6,
          }}
        >
          {title}
        </span>
      </span>
      <span style={{ fontSize: 20, color, fontWeight: 900 }}>{value}</span>
      {sub && (
        <span style={{ fontSize: 14, color: "#a1a1aa", fontWeight: 600 }}>
          {sub}
        </span>
      )}
    </motion.div>
  );
}

// ------- ALLE TABS ALS FUNKTION (übersichtlich & copy-paste ready!) -------
// ... Füge hier den Produkt-, Order-, Nutzer-, Broadcast- und Deposits-Tab ein wie gehabt!

//LOTTO TAB
function LottoAdminTab() {
  const [lottos, setLottos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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

      if (!winner || !winner.userId || !winner.username) {
        setMessage("Gewinner ungültig!");
        setLoading(false);
        return;
      }

      const pot = typeof lotto.pot === "number" ? lotto.pot : 0;
      const gewinnbetrag = Math.round(pot * 0.9 * 100) / 100;

      if (isNaN(gewinnbetrag) || gewinnbetrag <= 0) {
        setMessage("Ungültiger Gewinnbetrag!");
        setLoading(false);
        return;
      }

      // Gewinner User abholen
      const userRef = doc(db, "users", winner.userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setMessage("User nicht gefunden!");
        setLoading(false);
        return;
      }

      const userData = userSnap.data();
      const neuesGuthaben = (userData.guthaben ?? 0) + gewinnbetrag;

      // 1. Guthaben des Gewinners erhöhen
      await updateDoc(userRef, {
        guthaben: neuesGuthaben,
      });

      // 2. Lotto-Dokument als abgeschlossen markieren & Gewinner eintragen
      await updateDoc(doc(db, "lottos", lotto.id), {
        finished: true,
        winner: {
          userId: winner.userId,
          username: winner.username,
          gewinn: gewinnbetrag,
          teilgenommenAm: winner.teilgenommenAm ?? null,
        },
      });

      setMessage(
        `Ziehung abgeschlossen! Gewinner: ${anonymisiereName(
          winner.username
        )} (+${gewinnbetrag.toFixed(2)} €)`
      );
    } catch (e) {
      console.error("Fehler bei der Auszahlung!", e);
      setMessage("Fehler bei der Auszahlung! " + e.message);
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

// PRODUKTE TAB
function renderProdukteTab(ctx) {
  const {
    produkte = [],
    produktEdit,
    produktForm,
    error,
    sortBy,
    produktAddForm,
    addError,
  } = ctx.state;
  const sortedProdukte = [...produkte].sort((a, b) =>
    (a[sortBy] || "")
      .toString()
      .localeCompare((b[sortBy] || "").toString(), undefined, {
        numeric: true,
      })
  );

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 15,
          marginTop: 8,
        }}
      >
        <h3 style={{ fontWeight: 900, fontSize: 21, margin: 0 }}>
          Produkte verwalten
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
            onChange={(e) => ctx.setState({ sortBy: e.target.value })}
            style={{
              padding: 6,
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
          maxHeight: 240,
          overflowY: "auto",
          marginBottom: 18,
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
                  onChange={(e) => ctx.handleChange("name", e.target.value)}
                  placeholder="Name"
                  style={{ padding: 6, borderRadius: 7, width: 95 }}
                />
                <input
                  type="number"
                  value={produktForm.preis}
                  onChange={(e) => ctx.handleChange("preis", e.target.value)}
                  placeholder="Preis (€)"
                  style={{ padding: 6, borderRadius: 7, width: 63 }}
                />
                <input
                  type="number"
                  value={produktForm.bestand}
                  onChange={(e) => ctx.handleChange("bestand", e.target.value)}
                  placeholder="Bestand"
                  style={{ padding: 6, borderRadius: 7, width: 63 }}
                />
                <input
                  type="text"
                  value={produktForm.kategorie}
                  onChange={(e) =>
                    ctx.handleChange("kategorie", e.target.value)
                  }
                  placeholder="Kategorie"
                  style={{ padding: 6, borderRadius: 7, width: 87 }}
                />
                <input
                  type="text"
                  value={produktForm.beschreibung}
                  onChange={(e) =>
                    ctx.handleChange("beschreibung", e.target.value)
                  }
                  placeholder="Beschreibung"
                  style={{ padding: 6, borderRadius: 7, width: 120 }}
                />
                <select
                  value={produktForm.bildName}
                  onChange={(e) => ctx.handleChange("bildName", e.target.value)}
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
                  onClick={ctx.handleSaveProdukt}
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
                  onClick={() => ctx.setState({ produktEdit: null })}
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
                <div style={{ color: "#f87171", minWidth: 56 }}>{error}</div>
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
                  onClick={() => ctx.handleEditProdukt(p)}
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
                  onClick={() => ctx.handleProduktDelete(p.id)}
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
          onChange={(e) => ctx.handleChangeAdd("name", e.target.value)}
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
          onChange={(e) => ctx.handleChangeAdd("preis", e.target.value)}
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
          onChange={(e) => ctx.handleChangeAdd("bestand", e.target.value)}
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
          onChange={(e) => ctx.handleChangeAdd("kategorie", e.target.value)}
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
          onChange={(e) => ctx.handleChangeAdd("beschreibung", e.target.value)}
          placeholder="Beschreibung"
          style={{
            padding: 6,
            borderRadius: 7,
            width: 120,
          }}
        />
        <select
          value={produktAddForm.bildName}
          onChange={(e) => ctx.handleChangeAdd("bildName", e.target.value)}
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
          onClick={ctx.handleAddProdukt}
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
  );
}

// ORDERS TAB
function renderOrdersTab(ctx, produkte, orders, onChat) {
  return (
    <div>
      <h3 style={{ fontWeight: 900, fontSize: 21, marginBottom: 18 }}>
        Bestellungen verwalten
      </h3>
      {orders.length === 0 ? (
        <div>Keine Bestellungen.</div>
      ) : (
        orders
          .sort((a, b) => b.ts - a.ts)
          .map((order) =>
            ctx.state.orderEdit === order.id ? (
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
                  <span style={{ color: "#38bdf8" }}>{order.status}</span>
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
                      const p = produkte.find((pr) => pr.id === item.produktId);
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
                    value={ctx.state.orderForm.status}
                    onChange={(e) =>
                      ctx.setState({
                        orderForm: {
                          ...ctx.state.orderForm,
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
                    value={ctx.state.orderForm.notiz}
                    onChange={(e) =>
                      ctx.setState({
                        orderForm: {
                          ...ctx.state.orderForm,
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
                  onClick={() => ctx.handleSaveOrder(order.id)}
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
                  onClick={() => ctx.setState({ orderEdit: null })}
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
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <button
                    onClick={() => ctx.openOrderEdit(order)}
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
                    onClick={() => ctx.handleOrderDelete(order.id)}
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
  );
}

// USERS TAB
function renderUsersTab(ctx, users) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
          marginTop: 8,
        }}
      >
        <h3 style={{ fontWeight: 900, fontSize: 21, margin: 0 }}>
          Nutzer verwalten
        </h3>
        <button
          onClick={() => ctx.setState({ userAddOpen: !ctx.state.userAddOpen })}
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
          {ctx.state.userAddOpen ? "✖" : "➕ Nutzer"}
        </button>
      </div>
      {ctx.state.userAddOpen && (
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
            value={ctx.state.userForm.username}
            onChange={(e) => ctx.handleChangeUser("username", e.target.value)}
            style={{
              padding: 6,
              borderRadius: 7,
              width: 100,
            }}
          />
          <input
            type="password"
            placeholder="Passwort"
            value={ctx.state.userForm.passwort}
            onChange={(e) => ctx.handleChangeUser("passwort", e.target.value)}
            style={{
              padding: 6,
              borderRadius: 7,
              width: 100,
            }}
          />
          <select
            value={ctx.state.userForm.rolle}
            onChange={(e) => ctx.handleChangeUser("rolle", e.target.value)}
            style={{ padding: 6, borderRadius: 7, minWidth: 100 }}
          >
            <option value="kunde">Kunde</option>
            <option value="kurier">Kurier</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={() => ctx.handleAddUser()}
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
          ctx.state.userEdit === u.id ? (
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
                value={ctx.state.userForm.rolle}
                onChange={(e) => ctx.handleChangeUser("rolle", e.target.value)}
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
                value={ctx.state.userForm.passwort}
                onChange={(e) =>
                  ctx.handleChangeUser("passwort", e.target.value)
                }
                style={{
                  marginLeft: 7,
                  padding: 4,
                  borderRadius: 6,
                  width: 110,
                }}
              />
              <button
                onClick={() => ctx.handleSaveUser(u.id)}
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
                onClick={() => ctx.setState({ userEdit: null })}
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
              {u.username} ({u.rolle})
              <button
                onClick={() => ctx.openUserEdit(u)}
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
  );
}

// BROADCAST TAB
function renderBroadcastTab(ctx) {
  return (
    <div>
      <h3 style={{ fontWeight: 900, fontSize: 21, marginBottom: 16 }}>
        📢 Broadcasts verwalten
      </h3>
      <div style={{ marginBottom: 20 }}>
        <textarea
          value={ctx.state.broadcastText}
          onChange={(e) => ctx.setState({ broadcastText: e.target.value })}
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
          onClick={ctx.handleSendBroadcast}
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
        {ctx.state.broadcastSuccess}
      </div>
      <div style={{ color: "#f87171", minHeight: 20 }}>
        {ctx.state.broadcastError}
      </div>
      {/* Broadcast-Liste */}
      <div style={{ marginTop: 18 }}>
        {ctx.state.broadcasts.length === 0 ? (
          <div style={{ color: "#a1a1aa" }}>Keine Broadcasts vorhanden.</div>
        ) : (
          ctx.state.broadcasts.map((b) =>
            ctx.state.broadcastEditId === b.id ? (
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
                  value={ctx.state.broadcastEditText}
                  onChange={(e) =>
                    ctx.setState({ broadcastEditText: e.target.value })
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
                  onClick={ctx.handleSaveEditBroadcast}
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
                  onClick={ctx.handleCancelEditBroadcast}
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
                    onClick={() => ctx.handleEditBroadcast(b.id, b.text)}
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
                    onClick={() => ctx.handleDeleteBroadcast(b.id)}
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
  );
}

// DEPOSITS TAB & Hilfsfunktionen
function renderDepositsTab(users) {
  const offeneDepositWishes = collectOpenDepositWishes(users);
  const offeneDeposits = collectDeposits(users, false);
  const abgeschlDeposits = collectDeposits(users, true);

  return (
    <div>
      <h3 style={{ fontWeight: 900, fontSize: 21, marginBottom: 14 }}>
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
  );
}
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
  return wishes.sort((a, b) => (b.ts || 0) - (a.ts || 0));
}
function collectDeposits(users, abgeschlossen = false) {
  const deposits = [];
  users.forEach((u) => {
    if (Array.isArray(u.btc_deposits)) {
      u.btc_deposits.forEach((d) => {
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
  return deposits.sort((a, b) => (b.time || b.ts || 0) - (a.time || a.ts || 0));
}
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
