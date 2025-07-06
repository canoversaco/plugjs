import React, { useState, useEffect } from "react";
import { fetchBtcPriceEUR } from "./btcApi";

const ADMIN_BTC_ADDRESS = "bc1qdhqf4axsq4mnd6eq4fjj06jmfgmtlj5ar574z7";

export default function WalletModal({
  user,
  onClose,
  onBuyCryptoClick,
  btcPrice,
}) {
  const [eur, setEur] = useState("");
  const [btc, setBtc] = useState("");
  const [copied, setCopied] = useState(false);

  // Guthaben-Umrechnung
  const userBtc =
    btcPrice && user?.guthaben
      ? (user.guthaben / btcPrice).toFixed(8)
      : "0.00000000";

  useEffect(() => {
    let isActive = true;
    if (!btcPrice) {
      fetchBtcPriceEUR().then((p) => isActive && setBtc(p));
    }
    return () => {
      isActive = false;
    };
  }, [btcPrice]);

  useEffect(() => {
    if (!eur || !btcPrice) return setBtc("");
    setBtc((parseFloat(eur) / btcPrice).toFixed(8));
  }, [eur, btcPrice]);

  const handleCopy = () => {
    navigator.clipboard.writeText(ADMIN_BTC_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      style={{
        background: "#191a20ee",
        minHeight: "100vh",
        minWidth: "100vw",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter',sans-serif",
        overscrollBehavior: "contain",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#23262e",
          borderRadius: 17,
          boxShadow: "0 8px 38px #000b",
          padding: "23px 13px 17px 13px",
          width: "96vw",
          maxWidth: 370,
          minHeight: 390,
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            right: 13,
            top: 13,
            fontSize: 27,
            background: "none",
            border: 0,
            color: "#fff",
            fontWeight: 700,
            lineHeight: 1,
            cursor: "pointer",
            zIndex: 2,
          }}
          aria-label="Schließen"
        >
          ×
        </button>
        <h2
          style={{
            color: "#a3e635",
            fontWeight: 900,
            fontSize: 22,
            marginBottom: 10,
            textAlign: "center",
            letterSpacing: 1,
          }}
        >
          🪙 Krypto Wallet
        </h2>

        {/* Wallet Infos */}
        <div
          style={{
            background: "#18181b",
            borderRadius: 12,
            padding: "13px 10px 11px 10px",
            marginBottom: 16,
            textAlign: "center",
            fontSize: 17,
            fontWeight: 700,
            boxShadow: "0 2px 14px #0002",
          }}
        >
          <div style={{ marginBottom: 7, fontSize: 16 }}>
            <span style={{ color: "#a1a1aa", fontWeight: 400 }}>Guthaben</span>
            <br />
            <span style={{ color: "#a3e635", fontWeight: 900, fontSize: 20 }}>
              {user?.guthaben?.toFixed(2) ?? "0.00"} €
            </span>
            <br />
            <span style={{ color: "#38bdf8", fontWeight: 700, fontSize: 15 }}>
              {userBtc} BTC
            </span>
          </div>
          <div
            style={{
              color: "#a1a1aa",
              fontWeight: 400,
              fontSize: 13.5,
              marginBottom: -6,
            }}
          >
            {btcPrice
              ? "BTC Kurs: " +
                btcPrice.toLocaleString("de-DE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) +
                " €"
              : "Kurs wird geladen..."}
          </div>
        </div>

        {/* Aufladen */}
        <div
          style={{
            background: "#191a20",
            borderRadius: 11,
            padding: "13px 9px 8px 9px",
            marginBottom: 17,
            fontSize: 15,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6, color: "#fff" }}>
            Guthaben aufladen
          </div>
          <div
            style={{
              fontSize: 14.2,
              color: "#a1a1aa",
              marginBottom: 9,
              lineHeight: 1.3,
            }}
          >
            Trage deinen Wunschbetrag ein, klicke auf <b>Einzahlen</b> und folge
            den Anweisungen, um Bitcoin zu kaufen und aufzuladen.
          </div>
          <input
            type="number"
            min="1"
            placeholder="Betrag in € (z.B. 25)"
            value={eur}
            onChange={(e) => setEur(e.target.value)}
            style={{
              width: "100%",
              padding: 9,
              fontSize: 17,
              marginBottom: 10,
              borderRadius: 8,
              border: "1px solid #292933",
              background: "#23262e",
              color: "#fff",
              textAlign: "center",
              fontWeight: 600,
              letterSpacing: 0.2,
            }}
          />
          {btc && (
            <div
              style={{
                color: "#38bdf8",
                fontSize: 14,
                marginBottom: 4,
                marginTop: 2,
              }}
            >
              <b>{eur} €</b> = <b>{btc}</b> BTC
            </div>
          )}
          <button
            onClick={() => onBuyCryptoClick && onBuyCryptoClick(eur, btc)}
            style={{
              width: "100%",
              background: "#a3e635",
              color: "#18181b",
              padding: "12px 0",
              border: 0,
              borderRadius: 9,
              fontWeight: 900,
              fontSize: 17,
              cursor: "pointer",
              marginTop: 6,
              marginBottom: 2,
              boxShadow: "0 2px 10px #a3e63522",
              transition: "filter 0.11s",
            }}
            disabled={!eur || eur <= 0}
          >
            ➕ Einzahlen
          </button>
        </div>

        {/* Adresse anzeigen */}
        <div
          style={{
            background: "#23262e",
            borderRadius: 10,
            padding: "10px 8px 8px 8px",
            marginBottom: 10,
            textAlign: "center",
            fontSize: 14.5,
            boxShadow: "0 1px 7px #0002",
            wordBreak: "break-all",
            color: "#fff",
          }}
        >
          <div style={{ color: "#a1a1aa", marginBottom: 5, fontSize: 13 }}>
            Deine Einzahlungsadresse:
          </div>
          <div
            style={{
              fontFamily: "monospace",
              background: "#191a20",
              padding: "8px 7px",
              borderRadius: 8,
              fontSize: 15,
              color: "#a3e635",
              marginBottom: 5,
            }}
          >
            {ADMIN_BTC_ADDRESS}
          </div>
          <button
            onClick={handleCopy}
            style={{
              background: "#38bdf8",
              color: "#18181b",
              border: 0,
              borderRadius: 7,
              fontWeight: 700,
              fontSize: 14.5,
              padding: "6px 15px",
              marginBottom: 2,
              cursor: "pointer",
              width: "70%",
              margin: "0 auto",
              display: "block",
              transition: "filter 0.14s",
              filter: copied ? "brightness(0.7)" : undefined,
            }}
          >
            {copied ? "✔️ Kopiert" : "Adresse kopieren"}
          </button>
        </div>
        <div
          style={{
            color: "#a1a1aa",
            fontSize: 12.5,
            textAlign: "center",
            marginTop: 3,
          }}
        >
          Nach deiner Einzahlung wird dein Guthaben automatisch in wenigen
          Minuten gutgeschrieben.
        </div>
        <button
          onClick={onClose}
          style={{
            width: "100%",
            background: "#191a20",
            color: "#fff",
            padding: "11px 0",
            border: 0,
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 17,
            marginTop: 13,
            cursor: "pointer",
          }}
        >
          Schließen
        </button>
      </div>
    </div>
  );
}
