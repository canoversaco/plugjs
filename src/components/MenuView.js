// src/components/MenuView.js
import React from "react";
import images from "./images/images"; // Pfad ggf. anpassen!

// Kategorie-Emojis als kleines Extra:
const KAT_EMOJIS = {
  Standard: "🛍️",
  Hase: "🍀",
  Shem: "🧊",
  Schoko: "🍫",
  Medikamente: "🧪",
  Cali: "🍹",
};

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
      imgActive: "", // für Klick-Animation
    };
  }

  // Produkte filtern und nach Preis sortieren
  filterProdukte = () => {
    const { produkte } = this.props;
    const { selectedKat } = this.state;
    return produkte
      .filter((p) => (p.kategorie || "Standard") === selectedKat)
      .sort((a, b) => (a.preis || 0) - (b.preis || 0));
  };

  handleMengeChange = (produktId, val) => {
    this.setState((s) => ({
      menge: { ...s.menge, [produktId]: Math.max(1, Number(val) || 1) },
    }));
  };

  // Für Bild-Klickanimation
  handleImgClick = (id) => {
    this.setState({ imgActive: id });
    setTimeout(() => this.setState({ imgActive: "" }), 210);
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
    const { kategorien, selectedKat, menge, error, imgActive } = this.state;

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
          background: "linear-gradient(130deg, #161718 60%, #1a222f 100%)",
          color: "#fff",
          fontFamily: "'Inter', sans-serif",
          padding: 30,
        }}
      >
        {/* Animations-Styles */}
        <style>{`
          .menu-kat-btn {
            transition: background 0.18s, color 0.14s, transform 0.13s;
            box-shadow: 0 2px 8px #00000020;
          }
          .menu-kat-btn.selected, .menu-kat-btn:active {
            background: #38bdf8 !important;
            color: #18181b !important;
            transform: scale(1.06);
            box-shadow: 0 4px 24px #38bdf855;
          }
          .menu-prod-img {
            transition: transform 0.16s cubic-bezier(.41,.8,.59,1.21), box-shadow 0.18s;
            cursor: pointer;
          }
          .menu-prod-img:hover {
            transform: scale(1.09);
            box-shadow: 0 3px 16px #38bdf850;
          }
          .menu-prod-img.active {
            transform: scale(1.18) !important;
            box-shadow: 0 5px 25px #a3e63580;
          }
          .menu-cart-btn, .menu-remove-btn {
            transition: background 0.13s, color 0.13s, transform 0.14s;
            box-shadow: 0 2px 8px #38bdf822;
          }
          .menu-cart-btn:active, .menu-remove-btn:active {
            transform: scale(0.96);
            filter: brightness(0.93);
          }
        `}</style>

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 22,
          }}
        >
          <button
            onClick={onGoBack}
            style={{
              background: "#23262e",
              color: "#fff",
              borderRadius: 9,
              border: 0,
              padding: "10px 23px",
              fontSize: 16.5,
              fontWeight: 800,
              cursor: "pointer",
              marginRight: 7,
              boxShadow: "0 2px 8px #0003",
            }}
          >
            ⬅️ Zurück
          </button>
          <h2
            style={{
              fontSize: 29,
              fontWeight: 900,
              margin: 0,
              letterSpacing: 0.2,
            }}
          >
            🛍️ Menü{" "}
            <span
              style={{
                fontWeight: 400,
                fontSize: 19,
                color: "#38bdf8",
                marginLeft: 10,
              }}
            >
              [Auswahl]
            </span>
          </h2>
        </div>

        {/* Kategorie-Auswahl */}
        <div
          style={{
            display: "flex",
            gap: 14,
            marginBottom: 26,
            flexWrap: "wrap",
          }}
        >
          {kategorien.map((kat) => (
            <button
              key={kat.name}
              className={
                "menu-kat-btn" + (selectedKat === kat.name ? " selected" : "")
              }
              onClick={() => this.setState({ selectedKat: kat.name })}
              style={{
                background: selectedKat === kat.name ? "#38bdf8" : "#23262e",
                color: selectedKat === kat.name ? "#18181b" : "#fff",
                border: 0,
                borderRadius: 12,
                padding: "9px 25px",
                fontWeight: 800,
                fontSize: 17,
                cursor: "pointer",
                minWidth: 70,
                letterSpacing: 0.15,
                display: "flex",
                alignItems: "center",
                gap: 9,
                fontFamily: "inherit",
              }}
            >
              <span style={{ fontSize: 21 }}>
                {KAT_EMOJIS[kat.name] || "🛍️"}
              </span>
              {kat.name}
            </button>
          ))}
        </div>

        {/* Produktliste */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            gap: 26,
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
                padding: 24,
                textAlign: "center",
                background: "#23262e",
                borderRadius: 14,
              }}
            >
              😕 Keine Produkte in dieser Kategorie.
            </div>
          ) : (
            this.filterProdukte().map((p) => (
              <div
                key={p.id}
                style={{
                  background: "#23262e",
                  borderRadius: 18,
                  padding: 22,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  boxShadow: "0 2px 14px #00000018",
                  gap: 20,
                  minHeight: 112,
                }}
              >
                <img
                  src={images[p.bildName] || images.defaultBild}
                  alt={p.name}
                  className={
                    "menu-prod-img" + (imgActive === p.id ? " active" : "")
                  }
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 16,
                    border: "2.3px solid #18181b",
                    background: "#18181b",
                  }}
                  onMouseDown={() => this.handleImgClick(p.id)}
                  onMouseUp={() => this.setState({ imgActive: "" })}
                  onMouseLeave={() => this.setState({ imgActive: "" })}
                  tabIndex={0}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: 22,
                      marginBottom: 2,
                      letterSpacing: 0.03,
                    }}
                  >
                    {p.name}{" "}
                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 500,
                        color: "#38bdf8",
                      }}
                    >
                      {KAT_EMOJIS[p.kategorie] || ""}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 15.5,
                      color: "#a1a1aa",
                      marginBottom: 5,
                      minHeight: 19,
                      letterSpacing: 0.02,
                    }}
                  >
                    {p.beschreibung}
                  </div>
                  <div
                    style={{ fontSize: 16.5, marginBottom: 4, fontWeight: 700 }}
                  >
                    <span style={{ color: "#a3e635" }}>{p.preis} €/g</span>
                    <span
                      style={{ color: "#bbb", fontWeight: 500, marginLeft: 9 }}
                    >
                      | Bestand: {p.bestand}
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <input
                      type="number"
                      min={1}
                      value={menge[p.id] || 1}
                      onChange={(e) =>
                        this.handleMengeChange(p.id, e.target.value)
                      }
                      style={{
                        width: 46,
                        background: "#18181b",
                        color: "#fff",
                        border: "1px solid #333",
                        borderRadius: 7,
                        padding: "7px 6px",
                        fontWeight: 700,
                        fontSize: 15,
                        marginRight: 2,
                      }}
                    />
                    <button
                      className="menu-cart-btn"
                      onClick={() => {
                        const m = menge[p.id] || 1;
                        for (let i = 0; i < m; ++i) onAddToCart(p.id);
                      }}
                      disabled={p.bestand === 0}
                      style={{
                        background: "#a3e635",
                        color: "#18181b",
                        fontWeight: 900,
                        borderRadius: 9,
                        border: 0,
                        padding: "9px 18px",
                        fontSize: 16,
                        cursor: p.bestand === 0 ? "not-allowed" : "pointer",
                        opacity: p.bestand === 0 ? 0.5 : 1,
                        marginRight: 4,
                      }}
                    >
                      ➕ Hinzufügen
                    </button>
                    {cartMenge(p.id) > 0 && (
                      <button
                        className="menu-remove-btn"
                        onClick={() => onRemoveFromCart(p.id)}
                        style={{
                          background: "#f87171",
                          color: "#fff",
                          border: 0,
                          borderRadius: 9,
                          padding: "8px 13px",
                          fontWeight: 700,
                          fontSize: 15,
                          cursor: "pointer",
                          marginLeft: 1,
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
            background: "#18181b",
            borderRadius: 19,
            padding: 23,
            maxWidth: 500,
            boxShadow: "0 2px 28px #00000025",
          }}
        >
          <h3 style={{ fontWeight: 900, fontSize: 20, marginBottom: 13 }}>
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
                  <li key={idx} style={{ fontSize: 16.5, marginBottom: 4 }}>
                    <span style={{ fontWeight: 800 }}>{p?.name || "?"}</span> ×{" "}
                    {item.menge} ={" "}
                    <span style={{ fontWeight: 800 }}>
                      {(p?.preis * item.menge).toFixed(2)} €
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <div
            style={{
              fontWeight: 900,
              fontSize: 19,
              marginTop: 8,
              marginBottom: 7,
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
              borderRadius: 12,
              border: 0,
              padding: "14px 36px",
              fontSize: 18,
              marginTop: 11,
              marginBottom: 4,
              cursor: warenkorb.length === 0 ? "not-allowed" : "pointer",
              boxShadow: warenkorb.length === 0 ? "" : "0 2px 12px #38bdf822",
              transition: "background 0.13s, transform 0.13s",
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
