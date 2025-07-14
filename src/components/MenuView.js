// src/components/MenuView.js
import React from "react";
import images from "./images/images"; // Pfad ggf. anpassen!

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
      imgActive: "",
      cartOpen: false,
      suche: "",
    };
  }

  filterProdukte = () => {
    const { produkte } = this.props;
    const { selectedKat, suche } = this.state;
    // Erst nach Kategorie filtern (falls "Alle" zeigen, falls du das willst)
    let res = produkte;
    if (selectedKat !== "ALLE") {
      res = res.filter((p) => (p.kategorie || "Standard") === selectedKat);
    }
    // Dann nach Suchbegriff (name, beschreibung)
    if (suche.trim()) {
      const s = suche.trim().toLowerCase();
      res = res.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(s)) ||
          (p.beschreibung && p.beschreibung.toLowerCase().includes(s))
      );
    }
    // Nach Preis sortieren
    return res.sort((a, b) => (a.preis || 0) - (b.preis || 0));
  };

  handleMengeChange = (produktId, val) => {
    this.setState((s) => ({
      menge: { ...s.menge, [produktId]: Math.max(1, Number(val) || 1) },
    }));
  };

  handleImgClick = (id) => {
    this.setState({ imgActive: id });
    setTimeout(() => this.setState({ imgActive: "" }), 210);
  };

  handleCartOpen = () => this.setState({ cartOpen: true });
  handleCartClose = () => this.setState({ cartOpen: false });

  render() {
    const {
      warenkorb = [],
      onAddToCart,
      onRemoveFromCart,
      onCheckout,
      onGoBack,
      produkte = [],
    } = this.props;
    const { kategorien, selectedKat, menge, error, imgActive, cartOpen, suche } = this.state;

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
          .menu-cart-fab {
            position: fixed;
            right: 24px;
            bottom: 32px;
            z-index: 120;
            background: linear-gradient(100deg, #a3e635 72%, #38bdf8 128%);
            color: #18181b;
            border: none;
            border-radius: 100px;
            box-shadow: 0 2px 22px #a3e63544;
            padding: 0 25px 0 21px;
            font-weight: 900;
            font-size: 22px;
            min-width: 90px;
            min-height: 66px;
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: pointer;
            transition: box-shadow 0.17s, background 0.18s;
            outline: none;
          }
          .menu-cart-fab:hover {
            box-shadow: 0 4px 30px #38bdf877;
            background: linear-gradient(90deg, #38bdf8 75%, #a3e635 120%);
          }
          .cart-drawer-bg {
            position: fixed;
            inset: 0;
            background: rgba(24,24,27, 0.73);
            z-index: 199;
            animation: fadeinbg .18s;
          }
          .cart-drawer {
            position: fixed;
            right: 0;
            top: 0;
            bottom: 0;
            width: 375px;
            max-width: 100vw;
            background: #18181b;
            box-shadow: -3px 0 25px #23262e88;
            z-index: 200;
            padding: 0;
            display: flex;
            flex-direction: column;
            animation: slideinright .21s cubic-bezier(.31,1.04,.59,.98);
          }
          @keyframes fadeinbg {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideinright {
            from { transform: translateX(120px); opacity: 0; }
            to { transform: none; opacity: 1; }
          }
          .search-input {
            background: #23262e;
            border: none;
            border-radius: 9px;
            padding: 12px 17px 12px 40px;
            font-size: 17px;
            font-weight: 700;
            color: #fff;
            width: 100%;
            box-shadow: 0 2px 12px #38bdf81a;
            transition: box-shadow 0.15s;
            outline: none;
          }
          .search-input:focus {
            box-shadow: 0 4px 18px #38bdf844;
          }
          .search-icon {
            position: absolute;
            left: 15px;
            top: 12px;
            font-size: 21px;
            color: #38bdf8;
            pointer-events: none;
          }
          @media (max-width: 550px) {
            .cart-drawer { width: 99vw; }
            .menu-cart-fab { right: 7px; bottom: 12px; min-width: 70px; }
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

        {/* SUCHFELD + Kategorie-Auswahl */}
        <div style={{ display: "flex", gap: 18, marginBottom: 25, flexWrap: "wrap" }}>
          <div style={{ flex: "2 1 320px", position: "relative" }}>
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              type="text"
              placeholder="Produkt suchen …"
              value={suche}
              onChange={e => this.setState({ suche: e.target.value })}
              maxLength={64}
              autoFocus
            />
          </div>
          <div style={{ display: "flex", gap: 12, flex: "1 1 160px", minWidth: 160, overflowX: "auto" }}>
            <button
              className={"menu-kat-btn" + (selectedKat === "ALLE" ? " selected" : "")}
              onClick={() => this.setState({ selectedKat: "ALLE" })}
              style={{
                background: selectedKat === "ALLE" ? "#38bdf8" : "#23262e",
                color: selectedKat === "ALLE" ? "#18181b" : "#fff",
                border: 0,
                borderRadius: 12,
                padding: "9px 21px",
                fontWeight: 800,
                fontSize: 16,
                cursor: "pointer",
                minWidth: 55,
                letterSpacing: 0.13,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "inherit",
              }}
            >
              <span style={{ fontSize: 21 }}>🌐</span> Alle
            </button>
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
                  padding: "9px 21px",
                  fontWeight: 800,
                  fontSize: 16,
                  cursor: "pointer",
                  minWidth: 55,
                  letterSpacing: 0.13,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
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
              😕 Keine Produkte gefunden.
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

        {/* FLOATING WARENKORB-BUTTON */}
        <button
          className="menu-cart-fab"
          onClick={this.handleCartOpen}
          aria-label="Warenkorb öffnen"
        >
          🛒
          <span style={{ marginLeft: 1, color: "#18181b", fontWeight: 900 }}>
            {warenkorb.length}
          </span>
          <span style={{ color: "#23262e", fontSize: 15, fontWeight: 700, marginLeft: 7 }}>
            {gesamt.toFixed(2)} €
          </span>
        </button>

        {/* CART DRAWER */}
        {cartOpen && (
          <>
            <div className="cart-drawer-bg" onClick={this.handleCartClose}></div>
            <div className="cart-drawer">
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid #23262e",
                padding: "23px 23px 12px 23px",
                minHeight: 70,
              }}>
                <h3 style={{ fontWeight: 900, fontSize: 21, margin: 0 }}>
                  🛒 Dein Warenkorb
                </h3>
                <button
                  onClick={this.handleCartClose}
                  style={{
                    background: "#23262e",
                    color: "#fff",
                    borderRadius: 8,
                    border: 0,
                    fontSize: 20,
                    fontWeight: 800,
                    padding: "6px 16px",
                    cursor: "pointer",
                    marginLeft: 10,
                  }}
                >
                  ✖
                </button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: 23 }}>
                {warenkorb.length === 0 ? (
                  <div style={{ color: "#a1a1aa", padding: 12, fontSize: 17 }}>
                    Noch keine Produkte im Warenkorb.
                  </div>
                ) : (
                  <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                    {warenkorb.map((item, idx) => {
                      const p = produkte.find(
                        (pr) => pr.id === item.produktId
                      );
                      return (
                        <li
                          key={idx}
                          style={{
                            fontSize: 17,
                            marginBottom: 13,
                            paddingBottom: 12,
                            borderBottom: "1px solid #23262e",
                            display: "flex",
                            alignItems: "center",
                            gap: 13,
                          }}
                        >
                          <img
                            src={images[p?.bildName] || images.defaultBild}
                            alt={p?.name}
                            style={{
                              width: 38,
                              height: 38,
                              objectFit: "cover",
                              borderRadius: 9,
                              background: "#23262e",
                              border: "1.5px solid #333",
                              marginRight: 2,
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <b>{p?.name || "?"}</b>
                            <div
                              style={{
                                fontSize: 13.5,
                                color: "#a1a1aa",
                                marginBottom: 1,
                                fontWeight: 400,
                              }}
                            >
                              {p?.beschreibung}
                            </div>
                            <div style={{ fontSize: 14 }}>
                              <span style={{ color: "#a3e635", fontWeight: 800 }}>
                                {p?.preis?.toFixed(2)} € x {item.menge}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => onRemoveFromCart(p.id)}
                            style={{
                              background: "#f87171",
                              color: "#fff",
                              border: 0,
                              borderRadius: 7,
                              padding: "7px 12px",
                              fontWeight: 700,
                              fontSize: 15,
                              cursor: "pointer",
                            }}
                          >
                            −
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              {/* Checkout-Bereich */}
              <div style={{
                padding: "23px 23px 23px 23px",
                borderTop: "1px solid #23262e",
                background: "#18181b",
              }}>
                <div style={{
                  fontWeight: 900,
                  fontSize: 18,
                  marginBottom: 9,
                  color: "#a3e635",
                }}>
                  Gesamt: {gesamt.toFixed(2)} €
                </div>
                <button
                  onClick={() => {
                    this.handleCartClose();
                    onCheckout();
                  }}
                  disabled={warenkorb.length === 0}
                  style={{
                    background: warenkorb.length === 0 ? "#444" : "#38bdf8",
                    color: "#18181b",
                    fontWeight: 900,
                    borderRadius: 12,
                    border: 0,
                    padding: "14px 36px",
                    fontSize: 18,
                    cursor: warenkorb.length === 0 ? "not-allowed" : "pointer",
                    boxShadow: warenkorb.length === 0 ? "" : "0 2px 12px #38bdf822",
                    transition: "background 0.13s, transform 0.13s",
                    marginTop: 3,
                  }}
                >
                  ✅ Zur Kasse
                </button>
              </div>
            </div>
          </>
        )}

        {/* FEHLER-ANZEIGE */}
        <div style={{ color: "#f87171", marginTop: 18, minHeight: 25 }}>
          {error}
        </div>
      </div>
    );
  }
}
