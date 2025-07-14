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
      selectedKat: "ALLE",
      menge: {},
      error: "",
      imgActive: "",
      cartOpen: false,
      suche: "",
      searchFocused: false,
    };
  }

  filterProdukte = () => {
    const { produkte } = this.props;
    const { selectedKat, suche } = this.state;
    let res = produkte;
    if (selectedKat !== "ALLE") {
      res = res.filter((p) => (p.kategorie || "Standard") === selectedKat);
    }
    if (suche.trim()) {
      const s = suche.trim().toLowerCase();
      res = res.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(s)) ||
          (p.beschreibung && p.beschreibung.toLowerCase().includes(s))
      );
    }
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

  clearSuche = () => this.setState({ suche: "" });

  render() {
    const {
      warenkorb = [],
      onAddToCart,
      onRemoveFromCart,
      onCheckout,
      onGoBack,
      produkte = [],
    } = this.props;
    const {
      kategorien,
      selectedKat,
      menge,
      error,
      imgActive,
      cartOpen,
      suche,
      searchFocused,
    } = this.state;

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
          background: "linear-gradient(130deg, #191c22 60%, #1a2330 100%)",
          color: "#fff",
          fontFamily: "'Inter', sans-serif",
          padding: "18px 7vw 42px 7vw",
        }}
      >
        <style>{`
          .menu-kat-bar {
            display: flex;
            align-items: center;
            gap: 13px;
            flex-wrap: wrap;
            margin-bottom: 15px;
            justify-content: flex-start;
            position: relative;
          }
          .menu-kat-btn {
            background: #22242b;
            color: #fff;
            border: none;
            border-radius: 12px;
            padding: 7px 20px;
            font-size: 15.3px;
            font-weight: 800;
            cursor: pointer;
            transition: background 0.17s, color 0.12s, transform 0.13s;
            box-shadow: 0 2px 10px #23262e18;
            display: flex;
            align-items: center;
            gap: 8px;
            letter-spacing: 0.02em;
            outline: none;
            opacity: 0.94;
          }
          .menu-kat-btn.selected {
            background: linear-gradient(93deg, #38bdf8 64%, #a3e635 125%);
            color: #18181b !important;
            transform: scale(1.07);
            opacity: 1;
          }
          .search-wrap {
            position: relative;
            margin-left: auto;
            min-width: 220px;
            flex: 1 1 230px;
            max-width: 270px;
            display: flex;
            align-items: center;
            background: #1c1e25;
            border-radius: 9px;
            box-shadow: 0 2px 10px #38bdf820;
            margin-right: 7px;
            height: 40px;
          }
          .search-input {
            background: transparent;
            border: none;
            border-radius: 9px;
            padding: 8px 35px 8px 36px;
            font-size: 16px;
            color: #fff;
            width: 100%;
            font-weight: 600;
            outline: none;
            transition: background 0.14s, box-shadow 0.14s;
            letter-spacing: 0.01em;
          }
          .search-input:focus {
            background: #21222b;
          }
          .search-icon {
            position: absolute;
            left: 10px;
            top: 10px;
            font-size: 18.5px;
            color: #38bdf8;
            opacity: 0.89;
          }
          .search-clear-btn {
            position: absolute;
            right: 7px;
            top: 8px;
            background: none;
            border: none;
            color: #f87171;
            font-size: 19px;
            cursor: pointer;
            border-radius: 20px;
            width: 25px;
            height: 25px;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.74;
            transition: opacity 0.14s, background 0.14s;
          }
          .search-clear-btn:hover {
            background: #23262e;
            opacity: 1;
          }
          .menu-prod-img {
            transition: transform 0.16s cubic-bezier(.41,.8,.59,1.21), box-shadow 0.18s;
            cursor: pointer;
          }
          .menu-prod-img:hover {
            transform: scale(1.07);
            box-shadow: 0 3px 15px #38bdf850;
          }
          .menu-prod-img.active {
            transform: scale(1.14) !important;
            box-shadow: 0 5px 21px #a3e63580;
          }
          .menu-cart-fab {
            position: fixed;
            right: 24px;
            bottom: 28px;
            z-index: 120;
            background: linear-gradient(100deg, #a3e635 69%, #38bdf8 128%);
            color: #18181b;
            border: none;
            border-radius: 100px;
            box-shadow: 0 3px 24px #a3e63555;
            padding: 0 22px 0 17px;
            font-weight: 900;
            font-size: 21px;
            min-width: 85px;
            min-height: 61px;
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            transition: box-shadow 0.17s, background 0.18s;
            outline: none;
          }
          .menu-cart-fab:hover {
            box-shadow: 0 4px 30px #38bdf877;
            background: linear-gradient(95deg, #38bdf8 77%, #a3e635 120%);
          }
          .cart-drawer-bg {
            position: fixed;
            inset: 0;
            background: rgba(24,24,27, 0.74);
            z-index: 199;
            animation: fadeinbg .16s;
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
            animation: slideinright .20s cubic-bezier(.31,1.04,.59,.98);
          }
          @keyframes fadeinbg {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideinright {
            from { transform: translateX(120px); opacity: 0; }
            to { transform: none; opacity: 1; }
          }
          @media (max-width: 600px) {
            .cart-drawer { width: 98vw; }
            .menu-cart-fab { right: 6px; bottom: 10px; min-width: 70px; }
            .menu-kat-bar { gap: 9px; }
            .search-wrap { min-width: 120px; }
          }
        `}</style>

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 19,
            marginBottom: 12,
          }}
        >
          <button
            onClick={onGoBack}
            style={{
              background: "#22242b",
              color: "#fff",
              borderRadius: 9,
              border: 0,
              padding: "8px 19px",
              fontSize: 15.5,
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
              fontSize: 25,
              fontWeight: 900,
              margin: 0,
              letterSpacing: 0.13,
            }}
          >
            🛍️ Produkte{" "}
            <span
              style={{
                fontWeight: 400,
                fontSize: 15,
                color: "#38bdf8",
                marginLeft: 7,
                letterSpacing: 0,
              }}
            >
              [Bestellen]
            </span>
          </h2>
        </div>

        {/* Kategorie + Suche */}
        <div className="menu-kat-bar">
          <button
            className={"menu-kat-btn" + (selectedKat === "ALLE" ? " selected" : "")}
            onClick={() => this.setState({ selectedKat: "ALLE" })}
          >
            <span style={{ fontSize: 18 }}>🌐</span> Alle
          </button>
          {kategorien.map((kat) => (
            <button
              key={kat.name}
              className={"menu-kat-btn" + (selectedKat === kat.name ? " selected" : "")}
              onClick={() => this.setState({ selectedKat: kat.name })}
            >
              <span style={{ fontSize: 18 }}>{KAT_EMOJIS[kat.name] || "🛍️"}</span>
              {kat.name}
            </button>
          ))}
          <div className="search-wrap" style={{ marginLeft: "auto" }}>
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              type="text"
              placeholder="Suchen…"
              value={suche}
              onChange={e => this.setState({ suche: e.target.value })}
              maxLength={44}
              onFocus={() => this.setState({ searchFocused: true })}
              onBlur={() => this.setState({ searchFocused: false })}
              style={{
                background: searchFocused ? "#22242b" : "transparent",
                boxShadow: searchFocused ? "0 2px 15px #38bdf822" : undefined,
              }}
            />
            {suche && (
              <button
                className="search-clear-btn"
                tabIndex={0}
                onClick={this.clearSuche}
                aria-label="Suchfeld leeren"
                title="Suchfeld leeren"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Produktliste */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))",
            gap: 23,
            marginBottom: 28,
          }}
        >
          {this.filterProdukte().length === 0 ? (
            <div
              style={{
                color: "#a1a1aa",
                gridColumn: "1/-1",
                fontSize: 17,
                fontWeight: 500,
                padding: 21,
                textAlign: "center",
                background: "#23262e",
                borderRadius: 13,
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
                  borderRadius: 16,
                  padding: 18,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  boxShadow: "0 2px 12px #00000013",
                  gap: 15,
                  minHeight: 98,
                }}
              >
                <img
                  src={images[p.bildName] || images.defaultBild}
                  alt={p.name}
                  className={
                    "menu-prod-img" + (imgActive === p.id ? " active" : "")
                  }
                  style={{
                    width: 72,
                    height: 72,
                    objectFit: "cover",
                    borderRadius: 15,
                    border: "2px solid #18181b",
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
                      fontSize: 19,
                      marginBottom: 1,
                      letterSpacing: 0.01,
                      color: "#fff",
                    }}
                  >
                    {p.name}{" "}
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: "#38bdf8",
                      }}
                    >
                      {KAT_EMOJIS[p.kategorie] || ""}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 14.3,
                      color: "#a1a1aa",
                      marginBottom: 4,
                      minHeight: 18,
                      letterSpacing: 0.01,
                      fontWeight: 500,
                    }}
                  >
                    {p.beschreibung}
                  </div>
                  <div
                    style={{ fontSize: 15.5, marginBottom: 2, fontWeight: 700 }}
                  >
                    <span style={{ color: "#a3e635" }}>{p.preis} €/g</span>
                    <span
                      style={{ color: "#bbb", fontWeight: 500, marginLeft: 7 }}
                    >
                      | Bestand: {p.bestand}
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", gap: 6, alignItems: "center" }}
                  >
                    <input
                      type="number"
                      min={1}
                      value={menge[p.id] || 1}
                      onChange={(e) =>
                        this.handleMengeChange(p.id, e.target.value)
                      }
                      style={{
                        width: 38,
                        background: "#18181b",
                        color: "#fff",
                        border: "1px solid #333",
                        borderRadius: 6,
                        padding: "5px 6px",
                        fontWeight: 700,
                        fontSize: 14,
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
                        borderRadius: 8,
                        border: 0,
                        padding: "8px 13px",
                        fontSize: 15,
                        cursor: p.bestand === 0 ? "not-allowed" : "pointer",
                        opacity: p.bestand === 0 ? 0.5 : 1,
                        marginRight: 2,
                        boxShadow: "0 2px 8px #a3e63524",
                      }}
                    >
                      ➕
                    </button>
                    {cartMenge(p.id) > 0 && (
                      <button
                        className="menu-remove-btn"
                        onClick={() => onRemoveFromCart(p.id)}
                        style={{
                          background: "#f87171",
                          color: "#fff",
                          border: 0,
                          borderRadius: 8,
                          padding: "7px 11px",
                          fontWeight: 700,
                          fontSize: 14,
                          cursor: "pointer",
                          marginLeft: 0,
                          boxShadow: "0 1px 7px #f8717122",
                        }}
                      >
                        −
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
          <span style={{ marginLeft: 0, color: "#18181b", fontWeight: 900 }}>
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
                minHeight: 66,
              }}>
                <h3 style={{ fontWeight: 900, fontSize: 19.5, margin: 0 }}>
                  🛒 Dein Warenkorb
                </h3>
                <button
                  onClick={this.handleCartClose}
                  style={{
                    background: "#23262e",
                    color: "#fff",
                    borderRadius: 7,
                    border: 0,
                    fontSize: 19,
                    fontWeight: 800,
                    padding: "5px 14px",
                    cursor: "pointer",
                    marginLeft: 7,
                  }}
                >
                  ✖
                </button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: 19 }}>
                {warenkorb.length === 0 ? (
                  <div style={{ color: "#a1a1aa", padding: 10, fontSize: 16.2 }}>
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
                            fontSize: 15.5,
                            marginBottom: 11,
                            paddingBottom: 10,
                            borderBottom: "1px solid #23262e",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <img
                            src={images[p?.bildName] || images.defaultBild}
                            alt={p?.name}
                            style={{
                              width: 33,
                              height: 33,
                              objectFit: "cover",
                              borderRadius: 8,
                              background: "#23262e",
                              border: "1.3px solid #333",
                              marginRight: 2,
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <b>{p?.name || "?"}</b>
                            <div
                              style={{
                                fontSize: 12.5,
                                color: "#a1a1aa",
                                marginBottom: 1,
                                fontWeight: 400,
                              }}
                            >
                              {p?.beschreibung}
                            </div>
                            <div style={{ fontSize: 13.3 }}>
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
                              padding: "6px 10px",
                              fontWeight: 700,
                              fontSize: 14,
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
                padding: "19px 22px 19px 22px",
                borderTop: "1px solid #23262e",
                background: "#18181b",
              }}>
                <div style={{
                  fontWeight: 900,
                  fontSize: 16.5,
                  marginBottom: 7,
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
                    borderRadius: 11,
                    border: 0,
                    padding: "12px 28px",
                    fontSize: 16,
                    cursor: warenkorb.length === 0 ? "not-allowed" : "pointer",
                    boxShadow: warenkorb.length === 0 ? "" : "0 2px 12px #38bdf822",
                    transition: "background 0.13s, transform 0.13s",
                    marginTop: 2,
                  }}
                >
                  ✅ Zur Kasse
                </button>
              </div>
            </div>
          </>
        )}

        {/* FEHLER-ANZEIGE */}
        <div style={{ color: "#f87171", marginTop: 13, minHeight: 19 }}>
          {error}
        </div>
      </div>
    );
  }
}
