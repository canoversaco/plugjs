import React, { useState, useEffect } from "react";

// Deine Admin Wallet
const ADMIN_BTC_ADDRESS = "bc1qdhqf4axsq4mnd6eq4fjj06jmfgmtlj5ar574z7";

// APIs
async function fetchBtcPrice() {
  const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur");
  const data = await res.json();
  return data.bitcoin.eur;
}

// Guardarian
function getGuardarianUrl(amountEUR) {
  return `https://guardarian.com/buy-crypto?crypto_currency=BTC&fiat_currency=EUR&amount=${amountEUR || 100}&wallet_address=${ADMIN_BTC_ADDRESS}&theme=dark`;
}

// Changelly (ohne Registrierung, mit Apple Pay/Karte)
function getChangellyUrl(amountEUR) {
  return `https://changelly.com/buy/btc/eur?amount=${amountEUR || 100}&address=${ADMIN_BTC_ADDRESS}`;
}

// Optional: Helper für Backend-Deposit anlegen
async function setPendingDeposit(userId, eur, btc) {
  // Hier ggf. an dein Backend/Firestore schreiben – Beispiel:
  await fetch("/api/open-deposit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, eur, btc, ts: Date.now() }),
  });
}

export default function BuyCryptoModal({ user, amount, btc, onClose }) {
  // Steps: 0=Input, 1=Provider, 2=Pending
  const [step, setStep] = useState(0);
  const [eur, setEur] = useState(amount || "");
  const [btcPrice, setBtcPrice] = useState(null);
  const [calcBtc, setCalcBtc] = useState(btc || "");
  const [provider, setProvider] = useState("guardarian");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchBtcPrice().then(setBtcPrice);
  }, []);

  useEffect(() => {
    if (btcPrice && eur) {
      setCalcBtc((parseFloat(eur) / btcPrice).toFixed(6));
    }
  }, [eur, btcPrice]);

  // Step 2: Pending-Check (simulate "awaiting deposit")
  useEffect(() => {
    if (step === 2 && user && eur && calcBtc) {
      // Trigger optional Backend für "offene Einzahlung" (dein Backend verarbeitet dies automatisch)
      setPendingDeposit(user.id, eur, calcBtc).catch(() => {});
    }
  }, [step, user, eur, calcBtc]);

  function handleCopy() {
    navigator.clipboard.writeText(ADMIN_BTC_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  function handleAbortDeposit() {
    // Optional: Informiere Backend, dass die offene Einzahlung abgebrochen wurde (ggf. openDeposit löschen)
    // await fetch("/api/abort-deposit", { ... });
    setStep(0);
    setProvider("guardarian");
  }

  const guardarianUrl = getGuardarianUrl(eur || 100);
  const changellyUrl = getChangellyUrl(eur || 100);

  // Statusbalken
  function Stepper({ step }) {
    const labels = ["Betrag wählen", "Kaufen", "Prüfung"];
    return (
      <div style={{ display: "flex", gap: 0, margin: "14px 0 22px 0", justifyContent: "center" }}>
        {labels.map((label, idx) => (
          <div key={label} style={{
            flex: 1,
            textAlign: "center",
            fontSize: 14,
            color: step === idx ? "#38bdf8" : "#bababa",
            fontWeight: step === idx ? 800 : 700,
            letterSpacing: 0.08,
            borderBottom: step === idx ? "3.5px solid #38bdf8" : "2.5px solid #23262e",
            paddingBottom: 4,
            opacity: step >= idx ? 1 : 0.7
          }}>
            {label}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        minWidth: "100vw",
        background: "rgba(15,18,25,0.92)",
        color: "#fafaf9",
        fontFamily: "'Inter',sans-serif",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 2000,
        backdropFilter: "blur(7px)",
        WebkitBackdropFilter: "blur(7px)",
        transition: "background 0.18s"
      }}
      // NICHT schließbar über Overlay!
    >
      <div
        style={{
          background: "linear-gradient(133deg, #181b23 82%, #38bdf833 100%)",
          borderRadius: 23,
          padding: "34px 22px 26px 22px",
          maxWidth: 410, width: "97vw",
          boxShadow: "0 12px 36px #000a, 0 2px 10px #38bdf822",
          border: "1.5px solid #292933",
          position: "relative"
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute", right: 15, top: 12,
            fontSize: 26, background: "#222c",
            border: 0, color: "#38bdf8", fontWeight: 900, borderRadius: 8,
            width: 36, height: 36, cursor: "pointer", zIndex: 2
          }}
          aria-label="Schließen"
        >
          ×
        </button>

        <h2
          style={{
            color: "#38bdf8", marginBottom: 5, fontWeight: 900,
            fontSize: 22, letterSpacing: 0.82, textAlign: "center"
          }}
        >
          Krypto kaufen
        </h2>
        <Stepper step={step} />

        {step === 0 && (
          <>
            {/* Schritt 1: Betrag wählen */}
            <div style={{
              background: "#232734", borderRadius: 13,
              padding: "13px 15px 13px 15px", marginBottom: 15,
              boxShadow: "0 2px 10px #0002, 0 1px 4px #38bdf822"
            }}>
              <div style={{ fontWeight: 700, color: "#a3e635", fontSize: 15.8, marginBottom: 2 }}>
                Wunschbetrag in EUR:
              </div>
              <input
                type="number"
                value={eur}
                onChange={e => setEur(e.target.value)}
                min={10}
                max={700}
                step={5}
                placeholder="100"
                style={{
                  width: "97%", fontSize: 18, fontWeight: 700, border: "none",
                  borderRadius: 7, padding: "8px 13px", marginTop: 6, marginBottom: 2,
                  background: "#282d38", color: "#38bdf8", boxShadow: "0 1px 6px #0002"
                }}
              />
              <div style={{ color: "#fff", fontSize: 14.7, marginTop: 2, marginBottom: 2 }}>
                ≈ <span style={{ color: "#38bdf8", fontWeight: 800 }}>{calcBtc}</span> BTC &nbsp;
                <span style={{ color: "#bababa", fontSize: 13 }}>({btcPrice ? btcPrice.toLocaleString() : "?"} €/BTC)</span>
              </div>
            </div>
            <div style={{
              color: "#b4f27a", background: "#232f1c", borderRadius: 8, fontSize: 14.2,
              padding: "10px 14px", marginBottom: 14, textAlign: "center", fontWeight: 600, lineHeight: 1.4
            }}>
              <span style={{ color: "#eab308", fontWeight: 700 }}>Wichtig:</span> Das <b>Guthaben wird nur automatisch gutgeschrieben</b>, wenn <b>der exakte BTC-Betrag</b> (<span style={{ color: "#38bdf8" }}>{calcBtc} BTC</span>) <b>+/-1%</b> an die unten stehende Adresse gesendet wird!
            </div>
            <button
              onClick={() => setStep(1)}
              disabled={!eur || eur < 10 || eur > 700}
              style={{
                width: "100%", background: "#38bdf8", color: "#18181b",
                padding: "13px 0", border: 0, borderRadius: 11, fontWeight: 900,
                fontSize: 18, marginTop: 3, cursor: (!eur || eur < 10) ? "not-allowed" : "pointer",
                boxShadow: "0 2px 10px #38bdf822", letterSpacing: 0.21,
                opacity: !eur || eur < 10 || eur > 700 ? 0.64 : 1
              }}
            >
              Weiter &rarr;
            </button>
          </>
        )}

        {step === 1 && (
          <>
            {/* Schritt 2: Anbieter wählen + BTC-Adresse */}
            <div style={{ color: "#bababa", fontSize: 14.5, marginBottom: 7, textAlign: "center" }}>
              <span style={{ color: "#a3e635", fontWeight: 700 }}>Deine BTC-Empfangsadresse:</span>
            </div>
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "center",
              background: "#18181b", borderRadius: 7,
              padding: "6px 12px", fontFamily: "monospace",
              fontSize: 15.2, color: "#a3e635", letterSpacing: 0.05,
              marginBottom: 12
            }}>
              <span>{ADMIN_BTC_ADDRESS}</span>
              <button
                onClick={handleCopy}
                style={{
                  marginLeft: 10, padding: "3px 12px", fontSize: 13,
                  border: "none", borderRadius: 7,
                  background: copied ? "#22c55e" : "#23262e",
                  color: copied ? "#fff" : "#38bdf8", fontWeight: 700, cursor: "pointer",
                  transition: "background 0.14s"
                }}
              >
                {copied ? "✔️ Kopiert" : "Adresse kopieren"}
              </button>
            </div>
            <div style={{ color: "#bababa", fontSize: 13.5, marginBottom: 10, textAlign: "center" }}>
              <b>Empfohlen:</b> Guardarian (Apple Pay, Google Pay, Karte, keine Registrierung)
            </div>
            <div style={{ display: "flex", gap: 9, marginBottom: 13 }}>
              <button
                onClick={() => setProvider("guardarian")}
                style={{
                  flex: 1,
                  background: provider === "guardarian" ? "#a3e635" : "#23262e",
                  color: provider === "guardarian" ? "#23262e" : "#b4f27a",
                  border: "none", borderRadius: 9, fontWeight: 900, fontSize: 16.1,
                  padding: "10px 0", boxShadow: "0 1px 7px #a3e63544", cursor: "pointer"
                }}
              >
                Guardarian
              </button>
              <button
                onClick={() => setProvider("changelly")}
                style={{
                  flex: 1,
                  background: provider === "changelly" ? "#38bdf8" : "#23262e",
                  color: provider === "changelly" ? "#23262e" : "#b7eafe",
                  border: "none", borderRadius: 9, fontWeight: 900, fontSize: 16.1,
                  padding: "10px 0", boxShadow: "0 1px 7px #38bdf844", cursor: "pointer"
                }}
              >
                Changelly
              </button>
            </div>
            {provider === "guardarian" && (
              <a
                href={guardarianUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setStep(2)}
                style={{
                  width: "100%", display: "block", textAlign: "center",
                  background: "linear-gradient(90deg,#a3e635 60%,#38bdf8 100%)",
                  color: "#23262e", fontWeight: 900, fontSize: 18.5,
                  padding: "13px 0", borderRadius: 13, marginBottom: 13,
                  boxShadow: "0 2px 12px #a3e63522",
                  letterSpacing: 0.15,
                  textDecoration: "none"
                }}
              >
                Mit Guardarian BTC kaufen &rarr;
              </a>
            )}
            {provider === "changelly" && (
              <a
                href={changellyUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setStep(2)}
                style={{
                  width: "100%", display: "block", textAlign: "center",
                  background: "linear-gradient(90deg,#38bdf8 60%,#a3e635 100%)",
                  color: "#23262e", fontWeight: 900, fontSize: 18.5,
                  padding: "13px 0", borderRadius: 13, marginBottom: 13,
                  boxShadow: "0 2px 12px #38bdf822",
                  letterSpacing: 0.15,
                  textDecoration: "none"
                }}
              >
                Mit Changelly BTC kaufen &rarr;
              </a>
            )}
            <button
              onClick={() => setStep(0)}
              style={{
                width: "100%",
                background: "#23262e",
                color: "#bababa",
                padding: "12px 0",
                border: "none",
                borderRadius: 11,
                fontWeight: 900,
                fontSize: 15,
                marginTop: 0,
                cursor: "pointer",
                boxShadow: "0 2px 10px #0001",
                letterSpacing: 0.14,
              }}
            >
              &larr; Zurück
            </button>
          </>
        )}

        {step === 2 && (
          <>
            {/* Schritt 3: Pending-Status */}
            <div style={{
              color: "#38bdf8", background: "#18181b",
              borderRadius: 12, fontSize: 17.2,
              padding: "20px 10px 15px 10px", textAlign: "center",
              marginBottom: 13, fontWeight: 700, letterSpacing: 0.08
            }}>
              <div style={{ fontSize: 27, marginBottom: 7 }}>⏳</div>
              <div>Geldeingang wird geprüft...</div>
              <div style={{ fontSize: 15.7, margin: "12px 0 0 0", color: "#b1fbab" }}>
                Sobald dein BTC auf der Blockchain bestätigt wurde, wird dein Guthaben <b>automatisch</b> gutgeschrieben.<br />
                Du kannst dieses Fenster schließen.
              </div>
            </div>
            <button
              onClick={handleAbortDeposit}
              style={{
                width: "100%",
                background: "#f87171",
                color: "#fff",
                padding: "12px 0",
                border: "none",
                borderRadius: 11,
                fontWeight: 900,
                fontSize: 15,
                marginTop: 0,
                cursor: "pointer",
                boxShadow: "0 2px 10px #f8717115",
                letterSpacing: 0.15,
                marginBottom: 2
              }}
            >
              Einzahlung abbrechen
            </button>
            <div style={{
              fontSize: 14, color: "#bababa", textAlign: "center",
              marginBottom: 0, marginTop: 4, lineHeight: 1.38
            }}>
              Bei Problemen wende dich bitte an den Support.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
