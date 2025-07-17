import React, { useState, useRef } from "react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import images from "./images/images";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat, toLonLat } from "ol/proj";
import Overlay from "ol/Overlay";
import "ol/ol.css";

// Statusoptionen
const STATUS_OPTIONS = [
  "offen",
  "akzeptiert",
  "unterwegs",
  "angekommen",
  "abgeschlossen",
  "storniert",
];
const STATUS_COLORS = {
  offen: "#fbbf24",
  akzeptiert: "#38bdf8",
  unterwegs: "#a3e635",
  angekommen: "#38bdf8",
  abgeschlossen: "#22c55e",
  storniert: "#f87171",
};

// =============== MAP PICKER ===================
function TreffpunktMapPicker({ value, onChange, onCancel }) {
  const mapRef = useRef();
  const markerRef = useRef();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [marker, setMarker] = useState(value || [51.5, 7.0]);

  React.useEffect(() => {
    const markerEl = document.createElement("div");
    markerEl.style.background = "#38bdf8";
    markerEl.style.width = "24px";
    markerEl.style.height = "24px";
    markerEl.style.borderRadius = "50%";
    markerEl.style.boxShadow = "0 2px 8px #0004";
    markerEl.style.transform = "translate(-50%, -50%)";
    markerEl.style.border = "3px solid white";
    markerEl.style.position = "absolute";
    markerEl.style.zIndex = 11;
    markerEl.innerHTML =
      '<svg style="margin:1.5px 0 0 1.5px;" width="20" height="20" fill="none" viewBox="0 0 20 20"><circle cx="10" cy="10" r="6" fill="#18181b"/><circle cx="10" cy="10" r="3" fill="#38bdf8"/></svg>';

    const markerOv = new Overlay({
      element: markerEl,
      positioning: "center-center",
      stopEvent: false,
    });
    markerRef.current = markerOv;

    const center = fromLonLat([marker[1], marker[0]]);
    const map = new Map({
      target: "kurier-treffpunkt-map",
      layers: [new TileLayer({ source: new OSM() })],
      overlays: [markerOv],
      view: new View({
        center,
        zoom: 13,
      }),
    });
    markerOv.setPosition(center);

    map.on("click", (evt) => {
      const coords = toLonLat(evt.coordinate);
      setMarker([coords[1], coords[0]]);
      markerOv.setPosition(evt.coordinate);
    });

    mapRef.current = map;

    return () => map.setTarget(null);
    // eslint-disable-next-line
  }, []);

  React.useEffect(() => {
    if (mapRef.current && markerRef.current && marker) {
      const coord = fromLonLat([marker[1], marker[0]]);
      markerRef.current.setPosition(coord);
      mapRef.current.getView().setCenter(coord);
    }
  }, [marker]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    setLoading(true);
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          search
        )}`
      );
      const data = await resp.json();
      if (data && data[0]) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setMarker([lat, lon]);
        if (mapRef.current) {
          const center = fromLonLat([lon, lat]);
          mapRef.current.getView().setCenter(center);
          mapRef.current.getView().setZoom(16);
        }
      } else {
        alert("Adresse nicht gefunden!");
      }
    } catch {
      alert("Fehler bei der Suche.");
    }
    setLoading(false);
  };

  const handleSave = () => {
    if (marker) onChange(marker);
  };

  return (
    <div style={{ margin: "10px 0" }}>
      <form onSubmit={handleSearch} style={{ marginBottom: 8, display: "flex" }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Adresse suchen (z.B. Hauptstraße Essen)"
          style={{
            padding: 7,
            borderRadius: 8,
            border: "1.5px solid #38bdf8",
            width: 220,
            fontSize: 15,
            background: "#23262e",
            color: "#fff",
            marginRight: 7,
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            background: "#38bdf8",
            color: "#18181b",
            border: 0,
            borderRadius: 8,
            padding: "6px 16px",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          {loading ? "..." : "Suchen"}
        </button>
      </form>
      <div
        id="kurier-treffpunkt-map"
        style={{
          width: 320,
          height: 180,
          borderRadius: 12,
          marginBottom: 10,
          background: "#111",
        }}
      />
      <div style={{ fontSize: 14, color: "#a1a1aa" }}>
        Auf die Karte klicken oder Adresse suchen, um einen Treffpunkt zu wählen.
      </div>
      <div style={{ marginTop: 10 }}>
        <button
          onClick={handleSave}
          disabled={!marker}
          style={{
            background: marker ? "#a3e635" : "#383838",
            color: "#18181b",
            border: 0,
            borderRadius: 8,
            padding: "8px 18px",
            fontWeight: 700,
            fontSize: 15,
            marginRight: 10,
            cursor: marker ? "pointer" : "not-allowed",
          }}
        >
          Speichern
        </button>
        <button
          onClick={onCancel}
          style={{
            background: "#23262e",
            color: "#fff",
            borderRadius: 7,
            border: 0,
            padding: "8px 18px",
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}

// ===================== PRODUKTE-ÄNDERUNGSPANEL ===================
function EditOrderPanel({ order, produkte, onSave, onCancel }) {
  const [items, setItems] = useState(
    (order.warenkorb || []).map((item) => ({
      ...item,
      removed: false,
      changed: false,
      note: "",
    }))
  );
  const [extraNote, setExtraNote] = useState("");

  const handleChange = (idx, field, value) => {
    setItems((old) =>
      old.map((it, i) =>
        i === idx
          ? {
              ...it,
              [field]: value,
              changed: field !== "note" ? true : it.changed,
              removed: field === "removed" ? value : it.removed,
            }
          : it
      )
    );
  };

  const handleSave = () => {
    const changedItems = items
      .filter((it) => it.removed || it.changed)
      .map((it) => ({
        produktId: it.produktId,
        oldMenge: order.warenkorb.find((oi) => oi.produktId === it.produktId)
          ?.menge,
        newMenge: it.removed ? 0 : it.menge,
        note: it.note,
        removed: it.removed,
      }));
    if (changedItems.length === 0 && !extraNote.trim()) {
      alert("Keine Änderung vorgenommen.");
      return;
    }
    const newWarenkorb = items
      .filter((it) => !it.removed)
      .map((it) => ({
        produktId: it.produktId,
        menge: Number(it.menge),
      }));
    onSave({ newWarenkorb, changedItems, extraNote });
  };

  return (
    <div
      style={{
        background: "#23262e",
        borderRadius: 10,
        padding: 18,
        marginTop: 14,
        marginBottom: 18,
        color: "#fff",
        boxShadow: "0 4px 32px #0009",
        maxWidth: 430,
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 7 }}>
        Produkte ändern/nicht verfügbar:
      </div>
      <ul style={{ paddingLeft: 0 }}>
        {items.map((item, idx) => {
          const p = produkte.find((pr) => pr.id === item.produktId);
          return (
            <li key={item.produktId} style={{ marginBottom: 15, listStyle: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img
                  src={images[p?.bildName] || images.defaultBild}
                  alt={p?.name}
                  style={{
                    width: 28,
                    height: 28,
                    objectFit: "cover",
                    borderRadius: 6,
                  }}
                />
                <b style={{ minWidth: 80 }}>{p?.name || "?"}</b>
                <span style={{ fontSize: 15, marginRight: 4 }}>Menge:</span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={item.menge}
                  onChange={(e) =>
                    handleChange(idx, "menge", Number(e.target.value))
                  }
                  disabled={item.removed}
                  style={{
                    width: 44,
                    background: item.removed ? "#262626" : "#191a20",
                    color: "#fff",
                    borderRadius: 6,
                    border: "1px solid #383838",
                    fontSize: 15,
                    marginRight: 8,
                  }}
                />
                <button
                  onClick={() => handleChange(idx, "removed", !item.removed)}
                  style={{
                    background: item.removed ? "#f87171" : "#23262e",
                    color: "#fff",
                    borderRadius: 7,
                    border: "none",
                    padding: "6px 12px",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {item.removed ? "Wieder hinzufügen" : "Entfernen"}
                </button>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Notiz (z.B. ausverkauft, nur halbe Menge)"
                  value={item.note}
                  onChange={(e) => handleChange(idx, "note", e.target.value)}
                  disabled={!item.removed && !item.changed}
                  style={{
                    marginTop: 4,
                    width: "100%",
                    borderRadius: 7,
                    border: "1px solid #333",
                    padding: 6,
                    background: "#191a20",
                    color: "#fff",
                    fontSize: 15,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <div style={{ marginTop: 13, marginBottom: 8 }}>
        <textarea
          placeholder="Zusätzliche Notiz für den Kunden (optional)..."
          value={extraNote}
          onChange={(e) => setExtraNote(e.target.value)}
          style={{
            width: "100%",
            borderRadius: 8,
            border: "1px solid #383838",
            padding: 9,
            background: "#18181b",
            color: "#fff",
            fontSize: 15,
          }}
          rows={2}
        />
      </div>
      <button
        onClick={handleSave}
        style={{
          background: "#a3e635",
          color: "#18181b",
          border: 0,
          borderRadius: 8,
          padding: "9px 26px",
          fontWeight: 900,
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        Änderung senden
      </button>
      <button
        onClick={onCancel}
        style={{
          marginLeft: 9,
          background: "#23262e",
          color: "#fff",
          border: 0,
          borderRadius: 8,
          padding: "9px 22px",
          fontWeight: 700,
          fontSize: 15,
          cursor: "pointer",
        }}
      >
        Abbrechen
      </button>
    </div>
  );
}

// ========== KURIER VIEW (inkl. ETA!) ===========
export default function KurierView({
  user,
  orders = [],
  produkte = [],
  onGoBack,
  onChat,
  onOrderDelete,
  onOrderStatusUpdate,    // <---- HIER ergänzen
}) {
  const [statusEditId, setStatusEditId] = useState(null);
  const [treffpunktEdit, setTreffpunktEdit] = useState(null);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [orderEditId, setOrderEditId] = useState(null);

  // ETA Minuten pro Bestellung (nur lokal)
  const [etaInputs, setEtaInputs] = useState({});

  // Status ändern
 const handleStatusChange = async (orderId, status) => {
  if (typeof onOrderStatusUpdate === "function") {
    await onOrderStatusUpdate(orderId, status);
  } else {
    await updateDoc(doc(db, "orders", orderId), { status });
  }
  setStatusEditId(null);
};

  // Treffpunkt ändern (und speichern)
  const handleSaveTreffpunkt = async (orderId, pos) => {
    setLoadingUpdate(true);
    await updateDoc(doc(db, "orders", orderId), { treffpunkt: pos });
    setTreffpunktEdit(null);
    setLoadingUpdate(false);
  };

  // ETA setzen
  const handleSetEta = async (orderId) => {
    const etaMin = Number(etaInputs[orderId]);
    if (!etaMin || etaMin < 1) {
      alert("Bitte gültige Minuten eingeben.");
      return;
    }
    const eta = Date.now() + etaMin * 60000;
    await updateDoc(doc(db, "orders", orderId), { eta });
    setEtaInputs((old) => ({ ...old, [orderId]: "" }));
    alert(`Ankunftszeit (ETA) auf ${etaMin} Minuten gesetzt!`);
  };

  // ETA anzeigen
  const renderEta = (etaTimestamp) => {
    const diff = Math.round((etaTimestamp - Date.now()) / 60000);
    return diff > 1 ? diff : 1;
  };

  // Löschen
  const handleDelete = async (orderId) => {
    if (window.confirm("Bestellung wirklich löschen?")) {
      await deleteDoc(doc(db, "orders", orderId));
    }
  };

  // Änderung speichern/an Kunde schicken
  const handleSaveOrderEdit = async (orderId, { newWarenkorb, changedItems, extraNote }) => {
    await updateDoc(doc(db, "orders", orderId), {
      changeRequest: {
        from: user?.username || "Kurier",
        text: extraNote || "",
        status: "offen",
        ts: Date.now(),
        changedItems: changedItems,
        newWarenkorb: newWarenkorb,
      },
    });
    setOrderEditId(null);
    alert("Änderungsvorschlag wurde an den Kunden gesendet!");
  };

  const offeneOrders = orders
    .filter((o) => o.status === "offen")
    .sort((a, b) => b.ts - a.ts);
  const andereOrders = orders
    .filter((o) => o.status !== "offen")
    .sort((a, b) => b.ts - a.ts);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#101014",
        color: "#fff",
        fontFamily: "'Inter',sans-serif",
        padding: 30,
      }}
    >
      <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 18 }}>
        🛵 Kurier Panel
      </h2>
      <button
        onClick={onGoBack}
        style={{
          background: "#23262e",
          color: "#fff",
          borderRadius: 8,
          border: 0,
          padding: "10px 22px",
          fontSize: 17,
          fontWeight: 700,
          cursor: "pointer",
          marginBottom: 18,
        }}
      >
        ⬅️ Zurück
      </button>

      {/* Offene Bestellungen */}
      <section
        style={{
          background: "#191a20",
          borderRadius: 14,
          padding: 18,
          marginBottom: 30,
          maxWidth: 900,
        }}
      >
        <h3
          style={{
            fontWeight: 800,
            fontSize: 18,
            marginBottom: 9,
            color: "#fbbf24",
          }}
        >
          Offene Bestellungen
        </h3>
        {offeneOrders.length === 0 ? (
          <div style={{ color: "#aaa" }}>Keine offenen Bestellungen.</div>
        ) : (
          <table style={{ width: "100%", borderSpacing: 0 }}>
            <thead>
              <tr style={{ color: "#a1a1aa", fontSize: 14 }}>
                <th style={{ textAlign: "left", padding: "5px 6px" }}>Kunde</th>
                <th style={{ textAlign: "left", padding: "5px 6px" }}>
                  Produkte
                </th>
                <th style={{ textAlign: "left", padding: "5px 6px" }}>Preis</th>
                <th style={{ textAlign: "left", padding: "5px 6px" }}>
                  Treffpunkt
                </th>
                <th style={{ textAlign: "left", padding: "5px 6px" }}>
                  Status
                </th>
                <th style={{ textAlign: "left", padding: "5px 6px" }}>
                  Aktionen
                </th>
                <th style={{ textAlign: "left", padding: "5px 6px" }}>
                  ETA (min)
                </th>
              </tr>
            </thead>
            <tbody>
              {offeneOrders.map((order) => (
                <tr
                  key={order.id}
                  style={{
                    background: "#23262e",
                    borderRadius: 7,
                    marginBottom: 5,
                    borderBottom: "5px solid #101014",
                  }}
                >
                  <td style={{ padding: 8, fontWeight: 700 }}>{order.kunde}</td>
                  <td style={{ padding: 8 }}>
                    <ul style={{ margin: 0, paddingLeft: 14 }}>
                      {(order.warenkorb || []).map((item, idx) => {
                        const p = produkte.find(
                          (pr) => pr.id === item.produktId
                        );
                        return (
                          <li key={idx}>
                            <img
                              src={images[p?.bildName] || images.defaultBild}
                              alt={p?.name}
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 6,
                                objectFit: "cover",
                                verticalAlign: "middle",
                                marginRight: 6,
                              }}
                            />
                            {p?.name || "?"} × {item.menge}
                          </li>
                        );
                      })}
                    </ul>
                  </td>
                  <td style={{ padding: 8, fontWeight: 600 }}>
                    {order.endpreis?.toFixed(2) ?? "-"} €
                  </td>
                  <td style={{ padding: 8 }}>
                    {treffpunktEdit === order.id ? (
                      <TreffpunktMapPicker
                        value={order.treffpunkt}
                        onChange={(pos) => handleSaveTreffpunkt(order.id, pos)}
                        onCancel={() => setTreffpunktEdit(null)}
                      />
                    ) : order.treffpunkt ? (
                      <>
                        <a
                          href={`https://maps.google.com/?q=${order.treffpunkt[0]},${order.treffpunkt[1]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#38bdf8",
                            textDecoration: "underline",
                            fontWeight: 600,
                          }}
                        >
                          Karte öffnen
                        </a>
                        <button
                          onClick={() => setTreffpunktEdit(order.id)}
                          style={{
                            marginLeft: 8,
                            background: "#38bdf8",
                            color: "#18181b",
                            border: 0,
                            borderRadius: 7,
                            fontWeight: 700,
                            padding: "5px 9px",
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                          disabled={loadingUpdate}
                        >
                          🖉 Ändern
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setTreffpunktEdit(order.id)}
                        style={{
                          background: "#a3e635",
                          color: "#18181b",
                          border: 0,
                          borderRadius: 7,
                          fontWeight: 700,
                          padding: "5px 10px",
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                        disabled={loadingUpdate}
                      >
                        Treffpunkt setzen
                      </button>
                    )}
                  </td>
                  <td style={{ padding: 8 }}>
                    <span
                      style={{
                        background: STATUS_COLORS[order.status] || "#23262e",
                        color: "#18181b",
                        borderRadius: 7,
                        fontWeight: 900,
                        padding: "3px 11px",
                        fontSize: 14,
                        cursor: "pointer",
                        display: "inline-block",
                      }}
                      onClick={() => setStatusEditId(order.id)}
                    >
                      {order.status}
                    </span>
                    {statusEditId === order.id && (
                      <select
  autoFocus
  value={order.status}
  onBlur={() => setStatusEditId(null)}
  onChange={(e) =>
    handleStatusChange(order.id, e.target.value)
  }
                        style={{
                          marginLeft: 7,
                          borderRadius: 7,
                          padding: 4,
                          fontWeight: 700,
                          fontSize: 15,
                        }}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td style={{ padding: 8 }}>
                    <button
                      onClick={() => onChat && onChat(order)}
                      style={{
                        background: "#38bdf8",
                        color: "#18181b",
                        border: 0,
                        borderRadius: 7,
                        fontWeight: 700,
                        padding: "6px 13px",
                        marginRight: 7,
                        fontSize: 14,
                        cursor: "pointer",
                      }}
                    >
                      💬 Chat
                    </button>
                    <button
                      onClick={() =>
                        onOrderDelete
                          ? onOrderDelete(order.id)
                          : handleDelete(order.id)
                      }
                      style={{
                        background: "#f87171",
                        color: "#fff",
                        border: 0,
                        borderRadius: 7,
                        fontWeight: 700,
                        padding: "6px 13px",
                        fontSize: 14,
                        cursor: "pointer",
                      }}
                    >
                      🗑️ Löschen
                    </button>
                    <button
                      onClick={() => setOrderEditId(order.id)}
                      style={{
                        background: "#fbbf24",
                        color: "#18181b",
                        border: 0,
                        borderRadius: 7,
                        fontWeight: 700,
                        padding: "6px 12px",
                        fontSize: 14,
                        marginLeft: 7,
                        cursor: "pointer",
                      }}
                    >
                      ✏️ Produkte ändern
                    </button>
                    {/* Produkte-Änderungs-Panel */}
                    {orderEditId === order.id && (
                      <EditOrderPanel
                        order={order}
                        produkte={produkte}
                        onSave={(changeObj) =>
                          handleSaveOrderEdit(order.id, changeObj)
                        }
                        onCancel={() => setOrderEditId(null)}
                      />
                    )}
                  </td>
                  <td style={{ padding: 8 }}>
                    {/* ETA setzen und anzeigen */}
                    <input
                      type="number"
                      min={1}
                      value={etaInputs[order.id] || ""}
                      onChange={(e) =>
                        setEtaInputs((old) => ({
                          ...old,
                          [order.id]: e.target.value,
                        }))
                      }
                      style={{
                        width: 50,
                        marginRight: 5,
                        borderRadius: 6,
                        border: "1px solid #383838",
                        fontSize: 14,
                        padding: 4,
                        background: "#191a20",
                        color: "#fff",
                      }}
                      placeholder="Min"
                    />
                    <button
                      onClick={() => handleSetEta(order.id)}
                      style={{
                        background: "#a3e635",
                        color: "#18181b",
                        border: 0,
                        borderRadius: 8,
                        padding: "6px 10px",
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: "pointer",
                      }}
                    >
                      Setzen
                    </button>
                    {order.eta && order.eta > Date.now() && (
                      <div
                        style={{
                          marginTop: 4,
                          color: "#a3e635",
                          fontWeight: 700,
                          fontSize: 15,
                        }}
                      >
                        ETA: {renderEta(order.eta)} min
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Angenommene & alte Bestellungen */}
      <section
        style={{
          background: "#191a20",
          borderRadius: 14,
          padding: 18,
          marginBottom: 30,
          maxWidth: 900,
        }}
      >
        <h3
          style={{
            fontWeight: 800,
            fontSize: 18,
            marginBottom: 9,
            color: "#38bdf8",
          }}
        >
          Angenommene & alte Bestellungen
        </h3>
        {andereOrders.length === 0 ? (
          <div style={{ color: "#aaa" }}>
            Keine angenommenen oder alten Bestellungen.
          </div>
        ) : (
          <table style={{ width: "100%", borderSpacing: 0 }}>
            <thead>
              <tr style={{ color: "#a1a1aa", fontSize: 14 }}>
                <th style={{ textAlign: "left", padding: "5px 6px" }}>Kunde</th>
                <th style={{ textAlign: "left", padding: "5px 6px" }}>
                  Produkte
                </th>
                <th style={{ textAlign: "left", padding: "5px 6px" }}>Preis</th>
                <th style={{ textAlign: "left", padding: "5px 6px" }}>
                  Treffpunkt
                </th>
                <th style={{ textAlign: "left", padding: "5px 6px" }}>
                  Status
                </th>
                <th style={{ textAlign: "left", padding: "5px 6px" }}>
                  Bewertung
                </th>
                <th style={{ textAlign: "left", padding: "5px 6px" }}>
                  Aktionen
                </th>
                <th style={{ textAlign: "left", padding: "5px 6px" }}>
                  ETA
                </th>
              </tr>
            </thead>
            <tbody>
              {andereOrders.map((order) => (
                <tr
                  key={order.id}
                  style={{
                    background: "#23262e",
                    borderRadius: 7,
                    marginBottom: 5,
                    borderBottom: "5px solid #101014",
                  }}
                >
                  <td style={{ padding: 8, fontWeight: 700 }}>{order.kunde}</td>
                  <td style={{ padding: 8 }}>
                    <ul style={{ margin: 0, paddingLeft: 14 }}>
                      {(order.warenkorb || []).map((item, idx) => {
                        const p = produkte.find(
                          (pr) => pr.id === item.produktId
                        );
                        return (
                          <li key={idx}>
                            <img
                              src={images[p?.bildName] || images.defaultBild}
                              alt={p?.name}
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 6,
                                objectFit: "cover",
                                verticalAlign: "middle",
                                marginRight: 6,
                              }}
                            />
                            {p?.name || "?"} × {item.menge}
                          </li>
                        );
                      })}
                    </ul>
                  </td>
                  <td style={{ padding: 8, fontWeight: 600 }}>
                    {order.endpreis?.toFixed(2) ?? "-"} €
                  </td>
                  <td style={{ padding: 8 }}>
                    {treffpunktEdit === order.id ? (
                      <TreffpunktMapPicker
                        value={order.treffpunkt}
                        onChange={(pos) => handleSaveTreffpunkt(order.id, pos)}
                        onCancel={() => setTreffpunktEdit(null)}
                      />
                    ) : order.treffpunkt ? (
                      <>
                        <a
                          href={`https://maps.google.com/?q=${order.treffpunkt[0]},${order.treffpunkt[1]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#38bdf8",
                            textDecoration: "underline",
                            fontWeight: 600,
                          }}
                        >
                          Karte öffnen
                        </a>
                        <button
                          onClick={() => setTreffpunktEdit(order.id)}
                          style={{
                            marginLeft: 8,
                            background: "#38bdf8",
                            color: "#18181b",
                            border: 0,
                            borderRadius: 7,
                            fontWeight: 700,
                            padding: "5px 9px",
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                          disabled={loadingUpdate}
                        >
                          🖉 Ändern
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setTreffpunktEdit(order.id)}
                        style={{
                          background: "#a3e635",
                          color: "#18181b",
                          border: 0,
                          borderRadius: 7,
                          fontWeight: 700,
                          padding: "5px 10px",
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                        disabled={loadingUpdate}
                      >
                        Treffpunkt setzen
                      </button>
                    )}
                  </td>
                  <td style={{ padding: 8 }}>
                    <span
                      style={{
                        background: STATUS_COLORS[order.status] || "#23262e",
                        color: "#18181b",
                        borderRadius: 7,
                        fontWeight: 900,
                        padding: "3px 11px",
                        fontSize: 14,
                        cursor: "pointer",
                        display: "inline-block",
                      }}
                      onClick={() => setStatusEditId(order.id)}
                    >
                      {order.status}
                    </span>
                    {statusEditId === order.id && (
                      <select
                        autoFocus
                        value={order.status}
                        onBlur={() => setStatusEditId(null)}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value)
                        }
                        style={{
                          marginLeft: 7,
                          borderRadius: 7,
                          padding: 4,
                          fontWeight: 700,
                          fontSize: 15,
                        }}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td style={{ padding: 8 }}>
                    {order.status === "abgeschlossen" && order.rating ? (
                      <div style={{ color: "#a3e635", fontWeight: 600 }}>
                        🌟 Service: {order.rating.service}/5,
                        <br />
                        Wartezeit: {order.rating.wartezeit}/5,
                        <br />
                        Qualität: {order.rating.qualitaet}/5
                      </div>
                    ) : (
                      <span style={{ color: "#a1a1aa" }}>–</span>
                    )}
                  </td>
                  <td style={{ padding: 8 }}>
                    <button
                      onClick={() => onChat && onChat(order)}
                      style={{
                        background: "#38bdf8",
                        color: "#18181b",
                        border: 0,
                        borderRadius: 7,
                        fontWeight: 700,
                        padding: "6px 13px",
                        marginRight: 7,
                        fontSize: 14,
                        cursor: "pointer",
                      }}
                    >
                      💬 Chat
                    </button>
                    <button
                      onClick={() =>
                        onOrderDelete
                          ? onOrderDelete(order.id)
                          : handleDelete(order.id)
                      }
                      style={{
                        background: "#f87171",
                        color: "#fff",
                        border: 0,
                        borderRadius: 7,
                        fontWeight: 700,
                        padding: "6px 13px",
                        fontSize: 14,
                        cursor: "pointer",
                      }}
                    >
                      🗑️ Löschen
                    </button>
                  </td>
                  <td style={{ padding: 8 }}>
                    {order.eta && order.eta > Date.now() && (
                      <span style={{ color: "#a3e635", fontWeight: 700 }}>
                        ETA: {renderEta(order.eta)} min
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
