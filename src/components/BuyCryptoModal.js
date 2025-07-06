import React from "react";

const ADMIN_BTC_ADDRESS = "bc1qdhqf4axsq4mnd6eq4fjj06jmfgmtlj5ar574z7";

export default function BuyCryptoModal({ user, amount, btc, onClose }) {
  // MoonPay-URL vorbereiten
  // Siehe: https://www.moonpay.com/docs/widget/web#query-parameters
  const moonpayUrl = `https://buy.moonpay.com?apiKey=pk_live_LKIScJ6CKR9aRwt7QRDSKR7krXAbk0u&currencyCode=btc&walletAddress=${ADMIN_BTC_ADDRESS}&baseCurrencyCode=eur${
    amount ? `&baseCurrencyAmount=${amount}` : ""
  }&enabledPaymentMethods=apple_pay,google_pay,sepa_bank_transfer,credit_debit_card`;

  return (
    <div
      style={{
        minHeight: "100vh",
        minWidth: "100vw",
        background: "rgba(20,22,30,0.90)",
        color: "#fafaf9",
        fontFamily: "'Inter',sans-serif",
        padding: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2000,
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #23262e 93%, #38bdf822 100%)",
          borderRadius: 20,
          padding: "26px 16px 18px 16px",
          maxWidth: 460,
          width: "97vw",
          boxShadow: "0 12px 36px #000b, 0 2px 10px #38bdf822",
          border: "1.5px solid #292933",
          position: "relative",
          transition: "box-shadow 0.16s",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            right: 15,
            top: 14,
            fontSize: 26,
            background: "rgba(37,40,54,0.75)",
            border: 0,
            color: "#e5e7eb",
            fontWeight: 800,
            borderRadius: 7,
            width: 34,
            height: 34,
            lineHeight: 1,
            cursor: "pointer",
            zIndex: 2,
            transition: "background 0.16s",
          }}
          aria-label="Schließen"
        >
          ×
        </button>
        <h2
          style={{
            color: "#38bdf8",
            marginBottom: 15,
            fontWeight: 900,
            fontSize: 22,
            letterSpacing: 0.7,
            textAlign: "center",
            textShadow: "0 1px 7px #22292f30",
          }}
        >
          Krypto kaufen&nbsp;–&nbsp;MoonPay
        </h2>
        <div
          style={{
            marginBottom: 13,
            fontSize: 15.2,
            color: "#bdbdbd",
            textAlign: "center",
          }}
        >
          Zahle direkt mit <b>Apple Pay</b>, <b>Google Pay</b> oder Karte auf
          deine Wallet!
          <br />
          Der Kauf läuft sicher über&nbsp;
          <a
            href="https://www.moonpay.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#38bdf8",
              textDecoration: "underline",
              fontWeight: 600,
            }}
          >
            moonpay.com
          </a>
          .
        </div>

        <div style={{ marginBottom: 12, fontSize: 15.1, color: "#bababa" }}>
          Deine BTC-Adresse:{" "}
          <span
            style={{
              color: "#a3e635",
              fontFamily: "monospace",
              background: "#18181b",
              borderRadius: 6,
              padding: "2px 8px",
              fontSize: 14.8,
              letterSpacing: 0.1,
            }}
          >
            {ADMIN_BTC_ADDRESS}
          </span>
        </div>

        <div
          style={{
            width: "100%",
            height: 440,
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 7,
            boxShadow: "0 2px 12px #23262e15",
          }}
        >
          <iframe
            src={moonpayUrl}
            title="MoonPay Buy BTC"
            allow="accelerometer; autoplay; camera; gyroscope; payment"
            frameBorder="0"
            style={{
              width: "100%",
              height: "100%",
              minHeight: 390,
              border: "none",
              borderRadius: 12,
              background: "#fff",
            }}
          />
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            background: "#38bdf8",
            color: "#18181b",
            padding: "13px 0",
            border: 0,
            borderRadius: 10,
            fontWeight: 900,
            fontSize: 18,
            marginTop: 5,
            cursor: "pointer",
            boxShadow: "0 2px 10px #38bdf822",
            letterSpacing: 0.23,
            transition: "background 0.14s, box-shadow 0.14s",
          }}
        >
          Zurück
        </button>
      </div>
    </div>
  );
}
