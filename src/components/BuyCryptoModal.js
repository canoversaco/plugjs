import React, { useState, useEffect } from "react";

const ADMIN_BTC_ADDRESS = "bc1qdhqf4axsq4mnd6eq4fjj06jmfgmtlj5ar574z7";

// Guardarian Link-Bau (EUR → BTC, BTC-Adresse vorausgefüllt)
function getGuardarianUrl(amountEUR) {
  // Link-Template siehe https://guardarian.com/widget/
  // Fiat, Krypto, Adresse, Language, E-Mail optional
  return `https://guardarian.com/buy-crypto?crypto_currency=BTC&fiat_currency=EUR&amount=${amountEUR || 100}&wallet_address=${ADMIN_BTC_ADDRESS}&theme=dark`;
}

// MoonPay Link (optional)
function getMoonpayUrl(amount) {
  return `https://buy.moonpay.com?apiKey=pk_live_LKIScJ6CKR9aRwt7QRDSKR7krXAbk0u&currencyCode=btc&walletAddress=${ADMIN_BTC_ADDRESS}&baseCurrencyCode=eur${
    amount ? `&baseCurrencyAmount=${amount}` : ""
  }&enabledPaymentMethods=apple_pay,google_pay,sepa_bank_transfer,credit_debit_card`;
}

// BTC-Preis holen (CoinGecko API, kein Key nötig)
async function fetchBtcPrice() {
  const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur");
  const data = await res.json();
  return data.bitcoin.eur;
}

export default function BuyCryptoModal({ user, amount, btc, onClose }) {
  const [eur, setEur] = useState(amount || "");
  const [btcPrice, setBtcPrice] = useState(null);
  const [calcBtc, setCalcBtc] = useState(btc || "");
  const [active, setActive] = useState("guardarian"); // oder "moonpay"

  useEffect(() => {
    fetchBtcPrice().then(setBtcPrice);
  }, []);

  // EUR → BTC berechnen
  useEffect(() => {
    if (btcPrice && eur) {
      setCalcBtc((parseFloat(eur) / btcPrice).toFixed(6));
    }
  }, [eur, btcPrice]);

  const guardarianUrl = getGuardarianUrl(eur || 100);
  const moonpayUrl = getMoonpayUrl(eur);

  // Copy-to-Clipboard für BTC-Adresse
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(ADMIN_BTC_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        minWidth: "100vw",
        background: "rgba(15,18,25,0.91)",
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
      onClick={onClose}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #21242c 86%, #38bdf822 100%)",
          borderRadius: 22,
          padding: "35px 24px 28px 24px",
          maxWidth: 470,
          width: "97vw",
          boxShadow: "0 12px 36px #0009, 0 2px 10px #38bdf822",
          border: "1.5px solid #292933",
          position: "relative",
          transition: "box-shadow 0.18s"
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            right: 15, top: 14,
            fontSize: 27, background: "#222b",
            border: 0, color: "#38bdf8",
            fontWeight: 900, borderRadius: 8,
            width: 36, height: 36, cursor: "pointer", zIndex: 2
          }}
          aria-label="Schließen"
        >
          ×
        </button>
        <h2
          style={{
            color: "#38bdf8",
            marginBottom: 13, fontWeight: 900,
            fontSize: 23, letterSpacing: 0.9, textAlign: "center",
            textShadow: "0 1px 7px #23292a50"
          }}
        >
          Krypto kaufen ohne KYC
        </h2>

        <div style={{display: "flex", gap: 11, marginBottom: 19}}>
          <button
            onClick={() => setActive("guardarian")}
            style={{
              flex: 1,
              background: active === "guardarian" ? "#a3e635" : "#222",
              color: active === "guardarian" ? "#222" : "#eee",
              border: "none", borderRadius: 9, fontWeight: 900, fontSize: 16.6,
              padding: "11px 0", boxShadow: "0 1px 7px #a3e63534", cursor: "pointer",
              transition: "background 0.13s"
            }}
          >
            Guardarian
          </button>
          <button
            onClick={() => setActive("moonpay")}
            style={{
              flex: 1,
              background: active === "moonpay" ? "#38bdf8" : "#222",
              color: active === "moonpay" ? "#222" : "#eee",
              border: "none", borderRadius: 9, fontWeight: 900, fontSize: 16.6,
              padding: "11px 0", boxShadow: "0 1px 7px #38bdf844", cursor: "pointer",
              transition: "background 0.13s"
            }}
          >
            MoonPay
          </button>
        </div>

        {/* Betrag und Anzeige */}
        <div style={{
          background: "#22292f",
          borderRadius: 13,
          padding: "12px 18px 11px 18px",
          marginBottom: 18,
          boxShadow: "0 2px 10px #0003, 0 1px 4px #38bdf822"
        }}>
          <div style={{ fontWeight: 800, color: "#a3e635", fontSize: 15.6, marginBottom: 2 }}>
            Wunschbetrag in EUR:
          </div>
          <input
            type="number"
            value={eur}
            onChange={e => setEur(e.target.value)}
            min={10}
            max={700}
            placeholder="100"
            style={{
              width: "90%", fontSize: 19, fontWeight: 700, border: "none",
              borderRadius: 6, padding: "9px 12px", marginTop: 7, marginBottom: 3,
              background: "#23272e", color: "#38bdf8", boxShadow: "0 1px 6px #0002"
            }}
          />
          {btcPrice && (
            <div style={{ color: "#fff", fontSize: 14.6, marginTop: 2 }}>
              ≈ <span style={{ color: "#38bdf8", fontWeight: 800 }}>{calcBtc}</span> BTC &nbsp;({btcPrice.toLocaleString()} €/BTC)
            </div>
          )}
          <div style={{ color: "#bababa", fontSize: 13.6, marginTop: 5 }}>
            <b>Kein KYC/Account</b> bis 700 €.  
            Die Einzahlung muss <b>an diese Adresse</b> gehen:
            <span style={{
              color: "#a3e635", fontFamily: "monospace",
              background: "#18181b", borderRadius: 7, padding: "2px 8px",
              fontSize: 14.5, marginLeft: 7, letterSpacing: 0.1
            }}>{ADMIN_BTC_ADDRESS}</span>
            <button
              onClick={handleCopy}
              style={{
                marginLeft: 7, padding: "3px 13px", fontSize: 13,
                border: "none", borderRadius: 7, background: copied ? "#22c55e" : "#23262e",
                color: copied ? "#fff" : "#38bdf8", fontWeight: 700, cursor: "pointer",
                transition: "background 0.14s"
              }}
            >
              {copied ? "✔️ Kopiert" : "Adresse kopieren"}
            </button>
          </div>
        </div>

        {/* Kauf-Buttons und iframe */}
        {active === "guardarian" && (
          <>
            <a
              href={guardarianUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: "100%",
                display: "block",
                textAlign: "center",
                background: "linear-gradient(90deg,#a3e635 60%,#38bdf8 100%)",
                color: "#222", fontWeight: 900, fontSize: 19,
                padding: "15px 0", borderRadius: 13, marginBottom: 13,
                boxShadow: "0 2px 12px #a3e63533"
              }}
            >
              🛒 Mit Guardarian BTC kaufen&nbsp;&rarr;
            </a>
            <div style={{
              fontSize: 14.5, color: "#bababa", textAlign: "center", marginBottom: 4
            }}>
              <b>Info:</b> Nach deiner Einzahlung siehst du das Guthaben nach ca. 1 Bestätigung automatisch in deiner Wallet.
            </div>
          </>
        )}
        {active === "moonpay" && (
          <div
            style={{
              width: "100%",
              height: 420,
              borderRadius: 12,
              overflow: "hidden",
              marginBottom: 7,
              boxShadow: "0 2px 12px #23262e15"
            }}
          >
            <iframe
              src={moonpayUrl}
              title="MoonPay Buy BTC"
              allow="accelerometer; autoplay; camera; gyroscope; payment"
              frameBorder="0"
              style={{
                width: "100%", height: "100%", minHeight: 390,
                border: "none", borderRadius: 12, background: "#fff"
              }}
            />
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: "100%",
            background: "#38bdf8", color: "#18181b",
            padding: "13px 0", border: 0, borderRadius: 11,
            fontWeight: 900, fontSize: 18, marginTop: 8,
            cursor: "pointer", boxShadow: "0 2px 10px #38bdf822",
            letterSpacing: 0.2
          }}
        >
          Zurück
        </button>
      </div>
    </div>
  );
}
