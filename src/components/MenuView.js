import React from "react";
import images from "./images/images";

export default class MenuView extends React.Component {
  constructor(props) {
    super(props);

    const kategorien = Array.from(
      new Set((props.produkte || []).map((p) => p.kategorie || "Standard"))
    ).map((k) => ({ name: k }));

    this.state = {
      kategorien,
      selectedKat: kategorien[0]?.name || "",
      menge: {},
      error: "",
    };
  }

  // Produkte filtern und nach Preis sortieren
  filterProdukte = () => {
    const { produkte } = this.props;
    const { selectedKat } = this.state;
    return produkte
      .filter((p) => (p.kategorie || "Standard") === selectedKat)
      .sort((a, b) => (a.preis || 0) - (b.preis || 0)); // <-- nach Preis sortieren!
  };

  handleMengeChange = (produktId, val) => {
    this.setState((s) => ({
      menge: { ...s.menge, [produktId]: Math.max(1, Number(val) || 1) },
    }));
  };

  render() {
    const {
      warenkorb = [],
      onAddToCart,
      onRemoveFromCart,
      onCheckout,
      onGoBack,
      produkte = [],
    } = this.props;
    const { kategorien, selectedKat, menge, error } = this.state;

    const cartMenge = (produktId) =>
      warenkorb.find((w) => w.produktId === produktId)?.menge || 0;

    const gesamt = warenkorb.reduce((sum, w) => {
      const p = produkte.find((pr) => pr.id === w.produktId);
      return sum + (p?.preis || 0) * w.menge;
    }, 0);

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#1a1b1e",
          color: "#fff",
          fontFamily: "'Inter', sans-serif",
          padding: 30,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 18,
          }}
        >
          <button
            onClick={onGoBack}
            style={{
              background: "#23262e",
              color: "#fff",
              borderRadius: 8,
              border: 0,
              padding: "10px 22px",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              marginRight: 7,
            }}
          >
            ⬅️ Zurück
          </button>
          <h2 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>
            🍃 Produkt-Menü
          </h2>
        </div>

        {/* Kategorie-Auswahl */}
        <div
          style={{
            display: "flex",
            gap: 14,
            marginBottom: 22,
            flexWrap: "wrap",
          }}
        >
          {kategorien.map((kat) => (
            <button
              key={kat.name}
              onClick={() => this.setState({ selectedKat: kat.name })}
              style={{
                background: selectedKat === kat.name ? "#38bdf8" : "#23262e",
                color: selectedKat === kat.name ? "#18181b" : "#fff",
                border: 0,
                borderRadius: 10,
                padding: "8px 22px",
                fontWeight: 700,
                fontSize: 17,
                cursor: "pointer",
                boxShadow:
                  selectedKat === kat.name
                    ? "0 2px 10px #38bdf822"
                    : "0 2px 8px #00000010",
                transition: "all 0.13s",
              }}
            >
              {kat.name}
            </button>
          ))}
        </div>

        {/* Produktliste */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(370px, 1fr))",
            gap: 24,
            marginBottom: 28,
          }}
        >
          {this.filterProdukte().length === 0 ? (
            <div
              style={{
                color: "#a1a1aa",
                gridColumn: "1/-1",
                fontSize: 18,
                fontWeight: 500,
                padding: 25,
                textAlign: "center",
                background: "#23262e",
                borderRadius: 12,
              }}
            >
              Keine Produkte in dieser Kategorie.
            </div>
          ) : (
            this.filterProdukte().map((p) => (
              <div
                key={p.id}
                style={{
                  background: "#23262e",
                  borderRadius: 16,
                  padding: 22,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  boxShadow: "0 2px 12px #00000014",
                  gap: 20,
                  minHeight: 110,
                }}
              >
                <img
                  src={images[p.bildName] || images.defaultBild}
                  alt={p.name}
                  style={{
                    width: 75,
                    height: 75,
                    objectFit: "cover",
                    borderRadius: 14,
                    border: "2px solid #23262e",
                    background: "#111",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{ fontWeight: 800, fontSize: 21, marginBottom: 2 }}
                  >
                    {p.name}
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      color: "#a1a1aa",
                      marginBottom: 4,
                      minHeight: 18,
                    }}
                  >
                    {p.beschreibung}
                  </div>
                  <div style={{ fontSize: 16, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: "#a3e635" }}>
                      {p.preis} €/g
                    </span>{" "}
                    <span style={{ color: "#bbb" }}>
                      | Bestand: {p.bestand}
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", gap: 7, alignItems: "center" }}
                  >
                    <input
                      type="number"
                      min={1}
                      value={menge[p.id] || 1}
                      onChange={(e) =>
                        this.handleMengeChange(p.id, e.target.value)
                      }
                      style={{
                        width: 44,
                        background: "#18181b",
                        color: "#fff",
                        border: "1px solid #333",
                        borderRadius: 7,
                        padding: "7px 6px",
                        fontWeight: 700,
                        fontSize: 15,
                      }}
                    />
                    <button
                      onClick={() => {
                        const m = menge[p.id] || 1;
                        for (let i = 0; i < m; ++i) onAddToCart(p.id);
                      }}
                      disabled={p.bestand === 0}
                      style={{
                        background: "#a3e635",
                        color: "#18181b",
                        fontWeight: 900,
                        borderRadius: 8,
                        border: 0,
                        padding: "9px 17px",
                        fontSize: 16,
                        cursor: p.bestand === 0 ? "not-allowed" : "pointer",
                        opacity: p.bestand === 0 ? 0.5 : 1,
                        transition: "opacity 0.14s",
                      }}
                    >
                      ➕ Hinzufügen
                    </button>
                    {cartMenge(p.id) > 0 && (
                      <button
                        onClick={() => onRemoveFromCart(p.id)}
                        style={{
                          background: "#f87171",
                          color: "#fff",
                          border: 0,
                          borderRadius: 8,
                          padding: "8px 15px",
                          fontWeight: 700,
                          fontSize: 14,
                          cursor: "pointer",
                        }}
                      >
                        − Entfernen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Warenkorb und Kasse */}
        <div
          style={{
            margin: "0 auto",
            background: "#191a20",
            borderRadius: 18,
            padding: 22,
            maxWidth: 500,
            boxShadow: "0 2px 24px #00000023",
          }}
        >
          <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 13 }}>
            🛒 Dein Warenkorb
          </h3>
          {warenkorb.length === 0 ? (
            <div style={{ color: "#a1a1aa", padding: 10 }}>
              Noch keine Produkte im Warenkorb.
            </div>
          ) : (
            <ul style={{ marginBottom: 12 }}>
              {warenkorb.map((item, idx) => {
                const p = this.props.produkte.find(
                  (pr) => pr.id === item.produktId
                );
                return (
                  <li key={idx} style={{ fontSize: 16, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700 }}>{p?.name || "?"}</span> ×{" "}
                    {item.menge} ={" "}
                    <span style={{ fontWeight: 700 }}>
                      {(p?.preis * item.menge).toFixed(2)} €
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <div
            style={{
              fontWeight: 800,
              fontSize: 19,
              marginTop: 8,
              marginBottom: 6,
              color: "#a3e635",
            }}
          >
            Gesamt: {gesamt.toFixed(2)} €
          </div>
          <button
            onClick={onCheckout}
            disabled={warenkorb.length === 0}
            style={{
              background: warenkorb.length === 0 ? "#444" : "#38bdf8",
              color: "#18181b",
              fontWeight: 900,
              borderRadius: 11,
              border: 0,
              padding: "14px 36px",
              fontSize: 18,
              marginTop: 12,
              marginBottom: 4,
              cursor: warenkorb.length === 0 ? "not-allowed" : "pointer",
              boxShadow: warenkorb.length === 0 ? "" : "0 2px 8px #38bdf833",
              transition: "background 0.14s",
            }}
          >
            ✅ Zur Kasse
          </button>
        </div>
        <div style={{ color: "#f87171", marginTop: 18, minHeight: 25 }}>
          {error}
        </div>
      </div>
    );
  }
}
