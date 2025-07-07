import React, { useState, useEffect } from "react";
import { fetchBtcPriceEUR } from "./btcApi";

const ADMIN_BTC_ADDRESS = "bc1qdhqf4axsq4mnd6eq4fjj06jmfgmtlj5ar574z7";
const dummyTx = [
  {
    time: Date.now() - 1000 * 3600 * 5,
    amount: 25,
    type: "Einzahlung",
    status: "Bestätigt",
  },
  {
    time: Date.now() - 1000 * 3600 * 30,
    amount: 13.7,
    type: "Lotto-Gewinn",
    status: "Bestätigt",
  },
];

export default function WalletPage({
  user,
  btcPrice: propBtcPrice,
  onBuyCryptoClick,
  onGoBack,
}) {
  const [eur, setEur] = useState("");
  const [btc, setBtc] = useState("");
  const [btcPrice, setBtcPrice] = useState(propBtcPrice || null);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");

  const userBtc =
    btcPrice && user?.guthaben
      ? (user.guthaben / btcPrice).toFixed(8)
      : "0.00000000";

  useEffect(() => {
    let active = true;
    if (!propBtcPrice) {
      fetchBtcPriceEUR().then((p) => active && setBtcPrice(p));
    }
    return () => {
      active = false;
    };
  }, [propBtcPrice]);

  // Nur positive Zahlen als Einzahlungsbetrag akzeptieren
  function handleEurChange(e) {
    const value = e.target.value.replace(",", "."); // falls Komma statt Punkt
    if (value === "" || isNaN(value)) {
      setEur("");
      setBtc("");
      return;
    }
    if (parseFloat(value) < 0) return; // kein Minus
    setEur(value);
  }

  useEffect(() => {
    const parsed = parseFloat(eur);
    if (!eur || isNaN(parsed) || !btcPrice || parsed <= 0) {
      setBtc("");
      return;
    }
    setBtc((parsed / btcPrice).toFixed(8));
  }, [eur, btcPrice]);

  const handleCopy = () => {
    navigator.clipboard.writeText(ADMIN_BTC_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  const handleBuy = () => {
    const parsed = parseFloat(eur);
    if (parsed > 0 && btc) {
      if (onBuyCryptoClick) {
        onBuyCryptoClick(parsed, btc);
        setNotice("Bitte folge den weiteren Anweisungen.");
      } else {
        setNotice("Demo: Einzahlung ausgeführt!");
      }
    } else {
      setNotice("Bitte gültigen Betrag eingeben.");
    }
    setTimeout(() => setNotice(""), 2000);
  };

  const validAmount = eur && !isNaN(parseFloat(eur)) && parseFloat(eur) > 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#10121a 60%,#1b2330 100%)",
        fontFamily: "Inter,Segoe UI,sans-serif",
        margin: 0,
        padding: 0,
      }}
    >
      {/* HEADER + ZURÜCK-BUTTON */}
      <header
        style={{
          width: "100%",
          padding: "0 0 18px 0",
          background: "linear-gradient(94deg,#1b2330 90%,#1e293b 120%)",
          boxShadow: "0 8px 24px #0007",
          borderBottom: "1.5px solid #23262e33",
        }}
      >
        <div
          style={{
            maxWidth: 440,
            margin: "0 auto",
            padding: "26px 15px 0 15px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            position: "relative",
          }}
        >
          {onGoBack && (
            <button
              onClick={onGoBack}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                background: "none",
                border: 0,
                color: "#e3ff64",
                fontWeight: 900,
                fontSize: 27,
                padding: 0,
                cursor: "pointer",
                lineHeight: 1,
                zIndex: 2,
                transition: "color 0.17s",
              }}
              title="Zurück"
            >
              ←
            </button>
          )}
          <div
            style={{
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: 0.12,
              color: "#e3ff64",
              textShadow: "0 3px 20px #e3ff6422",
              marginBottom: 1,
            }}
          >
            {user?.username ? `Hi, ${user.username}!` : "Wallet"}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              margin: "8px 0 0 0",
            }}
          >
            <span
              style={{
                fontSize: 36,
                fontWeight: 900,
                letterSpacing: 1,
                color: "#fff",
                textShadow: "0 2px 15px #10121a44",
              }}
            >
              {user?.guthaben?.toFixed(2) ?? "0.00"}
              <span
                style={{
                  color: "#e3ff64",
                  fontWeight: 700,
                  fontSize: 20,
                  marginLeft: 6,
                }}
              >
                €
              </span>
            </span>
            <span style={{ color: "#38bdf8", fontWeight: 700, fontSize: 16 }}>
              {userBtc} BTC
            </span>
          </div>
          <span
            style={{
              fontSize: 13.4,
              color: "#94a3b8",
              fontWeight: 500,
              marginTop: 5,
            }}
          >
            {btcPrice ? (
              <>
                BTC Kurs:{" "}
                <b style={{ color: "#e3ff64" }}>
                  {btcPrice.toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  €
                </b>
              </>
            ) : (
              "BTC Kurs wird geladen..."
            )}
          </span>
        </div>
      </header>

      {/* ACTIONS */}
      <main
        style={{
          maxWidth: 440,
          margin: "0 auto",
          padding: "20px 0 0 0",
        }}
      >
        {/* AUFLADEN */}
        <section
          style={{
            background: "#191d23",
            borderRadius: 20,
            margin: "0 12px 20px 12px",
            padding: "22px 16px 14px 16px",
            boxShadow: "0 6px 22px #0006",
            border: "1.5px solid #2dd4bf11",
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            gap: 12,
          }}
        >
          <div
            style={{
              fontWeight: 900,
              color: "#a3e635",
              fontSize: 17,
              letterSpacing: 0.15,
              marginBottom: 3,
            }}
          >
            Wallet aufladen
          </div>
          <div
            style={{
              display: "flex",
              gap: 7,
              alignItems: "center",
              marginBottom: 0,
            }}
          >
            <input
              type="number"
              min="1"
              placeholder="€ Betrag"
              value={eur}
              onChange={handleEurChange}
              style={{
                flex: 1,
                padding: "11px 10px",
                fontSize: 16.4,
                borderRadius: 10,
                border: "1.5px solid #222a37",
                background: "#12151b",
                color: "#e3ff64",
                fontWeight: 800,
                outline: "none",
                textAlign: "center",
                boxShadow: "0 2px 8px #e3ff6431",
                letterSpacing: 0.15,
              }}
            />
            <button
              onClick={handleBuy}
              style={{
                minWidth: 118,
                background: "linear-gradient(94deg,#e3ff64 55%,#38bdf8 140%)",
                color: "#191d23",
                padding: "12px 0",
                border: 0,
                borderRadius: 11,
                fontWeight: 900,
                fontSize: 16,
                boxShadow: "0 3px 12px #e3ff6421",
                cursor: validAmount ? "pointer" : "not-allowed",
                opacity: validAmount ? 1 : 0.65,
                transition: "all 0.15s",
                textShadow: "0 2px 10px #e3ff6430",
              }}
              disabled={!validAmount}
            >
              Einzahlen
            </button>
          </div>
          {btc && validAmount && (
            <div
              style={{
                color: "#38bdf8",
                fontWeight: 700,
                fontSize: 14,
                marginTop: 0,
                textAlign: "right",
                minHeight: 18,
              }}
            >
              {eur} € ≈ {btc} BTC
            </div>
          )}
          {notice && (
            <div
              style={{
                color: "#e3ff64",
                fontWeight: 700,
                fontSize: 14,
                marginTop: 3,
                minHeight: 19,
              }}
            >
              {notice}
            </div>
          )}
        </section>

        {/* BTC ADRESSE */}
        <section
          style={{
            background: "#161a23",
            borderRadius: 20,
            margin: "0 12px 18px 12px",
            padding: "18px 16px 13px 16px",
            boxShadow: "0 6px 18px #0003",
            border: "1.2px solid #38bdf822",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 7,
          }}
        >
          <div
            style={{
              color: "#38bdf8",
              fontWeight: 800,
              fontSize: 15.5,
              marginBottom: 2,
              letterSpacing: 0.07,
              textTransform: "uppercase",
            }}
          >
            BTC Einzahlungsadresse
          </div>
          <div
            style={{
              fontFamily: "monospace",
              background: "#1b1d25",
              padding: "8px 9px",
              borderRadius: 8,
              fontSize: 14.7,
              color: "#e3ff64",
              letterSpacing: 0.1,
              wordBreak: "break-all",
              userSelect: "all",
              textAlign: "center",
              width: "100%",
              marginBottom: 2,
              border: "1.5px solid #23262e",
              fontWeight: 700,
            }}
          >
            {ADMIN_BTC_ADDRESS}
          </div>
          <button
            onClick={handleCopy}
            style={{
              background: copied ? "#e3ff64" : "#23262e",
              color: copied ? "#18181b" : "#38bdf8",
              border: "1.2px solid #23262e",
              borderRadius: 8,
              fontWeight: 800,
              fontSize: 14.5,
              padding: "8px 0",
              width: 180,
              cursor: "pointer",
              boxShadow: copied ? "0 0 0 4px #e3ff6420" : "none",
              marginTop: 2,
              transition: "all 0.12s",
            }}
          >
            {copied ? "✔️ Adresse kopiert" : "Adresse kopieren"}
          </button>
          <span
            style={{
              color: "#a1a1aa",
              fontSize: 13,
              marginTop: 4,
              fontWeight: 500,
              opacity: 0.88,
            }}
          >
            Überweise BTC an diese Adresse
            <br />
            Dein Guthaben ist <b>in wenigen Minuten</b> da.
          </span>
        </section>

        {/* TRANSAKTIONEN */}
        <section
          style={{
            background: "#191d23",
            borderRadius: 20,
            margin: "0 12px 0 12px",
            padding: "19px 13px 9px 13px",
            boxShadow: "0 2px 8px #10121a0a",
            border: "1.1px solid #23262e",
          }}
        >
          <div
            style={{
              fontWeight: 800,
              color: "#38bdf8",
              fontSize: 16,
              marginBottom: 11,
              letterSpacing: 0.13,
              textTransform: "uppercase",
            }}
          >
            Transaktionen
          </div>
          {dummyTx && dummyTx.length > 0 ? (
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                color: "#fff",
                fontSize: 14.4,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {dummyTx.slice(0, 7).map((t, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 13,
                    borderLeft:
                      "4px solid " +
                      (t.type === "Lotto-Gewinn" ? "#38bdf8" : "#e3ff64"),
                    paddingLeft: 12,
                    background: "#181a1e",
                    borderRadius: 10,
                    boxShadow: "0 1px 8px #0003",
                  }}
                >
                  <span style={{ fontSize: 17, marginRight: 3 }}>
                    {t.type === "Lotto-Gewinn" ? "🏆" : "💸"}
                  </span>
                  <span style={{ flex: 1 }}>
                    <span style={{ fontWeight: 800 }}>{t.type}</span>
                    <span
                      style={{
                        color: "#a1a1aa",
                        marginLeft: 7,
                        fontWeight: 500,
                        fontSize: 12.5,
                      }}
                    >
                      {new Date(t.time).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                      })}{" "}
                      {new Date(t.time).toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </span>
                  <span>
                    <b style={{ color: t.amount > 0 ? "#e3ff64" : "#f87171" }}>
                      {t.amount > 0 ? "+" : ""}
                      {t.amount.toFixed(2)} €
                    </b>
                    <span
                      style={{
                        color: t.status === "Bestätigt" ? "#22c55e" : "#f59e42",
                        fontWeight: 700,
                        marginLeft: 7,
                        fontSize: 12,
                      }}
                    >
                      {t.status}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div
              style={{
                color: "#a1a1aa",
                textAlign: "center",
                fontSize: 14,
                padding: 10,
              }}
            >
              Noch keine Transaktionen.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
