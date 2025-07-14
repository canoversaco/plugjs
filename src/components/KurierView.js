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

// ---------------------------------------------
// MAP PICKER mit Suchleiste & Marker für Treffpunkt
function TreffpunktMapPicker({ value, onChange, onCancel }) {
  const mapRef = useRef();
  const markerRef = useRef();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [marker, setMarker] = useState(value || [51.5, 7.0]);

  // Init OpenLayers map
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

  // Marker verschieben wenn sich marker-Position ändert
  React.useEffect(() => {
    if (mapRef.current && markerRef.current && marker) {
      const coord = fromLonLat([marker[1], marker[0]]);
      markerRef.current.setPosition(coord);
      mapRef.current.getView().setCenter(coord);
    }
  }, [marker]);

  // Suche nach Adresse
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
      <form
        onSubmit={handleSearch}
        style={{ marginBottom: 8, display: "flex" }}
      >
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
        Auf die Karte klicken oder Adresse suchen, um einen Treffpunkt zu
        wählen.
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
export default function KurierView({
  user,
  orders = [],
  produkte = [],
  onGoBack,
  onChat,
  onOrderDelete,
}) {
  const [statusEditId, setStatusEditId] = useState(null);
  const [treffpunktEdit, setTreffpunktEdit] = useState(null); // Order-ID die editiert wird
  const [loadingUpdate, setLoadingUpdate] = useState(false);

  // Status ändern
  const handleStatusChange = async (orderId, status) => {
    await updateDoc(doc(db, "orders", orderId), { status });
    setStatusEditId(null);
  };

  // Treffpunkt ändern (und speichern)
  const handleSaveTreffpunkt = async (orderId, pos) => {
    setLoadingUpdate(true);
    await updateDoc(doc(db, "orders", orderId), { treffpunkt: pos });
    setTreffpunktEdit(null);
    setLoadingUpdate(false);
  };

  // Löschen
  const handleDelete = async (orderId) => {
    if (window.confirm("Bestellung wirklich löschen?")) {
      await deleteDoc(doc(db, "orders", orderId));
    }
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
  <div style={{ display: "inline-flex", alignItems: "center", marginLeft: 7 }}>
    <select
      autoFocus
      value={order.status}
      onBlur={() => setStatusEditId(null)}
      onChange={async (e) => {
        const newStatus = e.target.value;
        // Wenn unterwegs gewählt, nach ETA fragen
        if (newStatus === "unterwegs") {
          const min = prompt("Ungefähre Ankunft in wie vielen Minuten? (z.B. 10)");
          const eta = parseInt(min, 10);
          if (!isNaN(eta) && eta > 0) {
            await updateDoc(doc(db, "orders", order.id), {
              status: newStatus,
              eta: Date.now() + eta * 60000,
            });
          } else {
            // nur Status ohne ETA setzen
            await handleStatusChange(order.id, newStatus);
          }
        } else {
          await updateDoc(doc(db, "orders", order.id), {
            status: newStatus,
            eta: null,
          });
        }
        setStatusEditId(null);
      }}
      style={{
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
    {/* ETA anzeigen, falls unterwegs */}
    {order.status === "unterwegs" && order.eta && (
      <span style={{
        marginLeft: 6,
        color: "#a3e635",
        fontWeight: 700,
        fontSize: 15
      }}>
        ETA: {Math.max(1, Math.round((order.eta - Date.now()) / 60000))} Min.
      </span>
    )}
  </div>
)}

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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
