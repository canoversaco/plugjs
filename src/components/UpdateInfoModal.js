
// src/components/UpdateInfoModal.js
import React, { useState, useEffect } from "react";

export default function UpdateInfoModal({ onClose }) {
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setCanClose(true), 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        zIndex: 9999,
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(25,26,32,0.93)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', 'Roboto', 'Arial', sans-serif"
      }}
    >
      <div
        style={{
          background: "#21222c",
          borderRadius: 18,
          boxShadow: "0 8px 36px #0009",
          minWidth: 340,
          maxWidth: 420,
          padding: "36px 28px 24px",
          color: "#f4f4f5",
          textAlign: "left",
        }}
      >
        <h2 style={{ fontWeight: 900, fontSize: 25, marginBottom: 7, color: "#a3e635", letterSpacing: 0.4 }}>
          🚀 Was ist neu?
        </h2>
        <ul style={{ fontSize: 17, lineHeight: 1.7, marginBottom: 12 }}>
          <li>
            <b>Neues ETA-Banner:</b> Deine Lieferzeit wird jetzt in echtzeit oben links angezeigt!
          </li>
          <li>
            <b>Telegram-Benachrichtigungen:</b> Wichtige Updates direkt aufs Handy – aktiviere Telegram Benachrichtigunen!
          </li>
          <li>
            <b>Wochen-/Monatspässe</b> Spare bis zu 150€ mit Wochen/Monatspässen!
          </li>
          <li>
            <b>Lotto & Mystery-Boxen:</b> Versuche dein Glück bei der Wöchentlichen Ziehung oder bei einer Mystery Box!
          </li>
        </ul>
        <div style={{ fontSize: 15.5, color: "#d1d5db", marginBottom: 16 }}>
          <b>Tipp:</b> Für die beste Erfahrung nutze die App als PWA! Einfach im Browser „Zum Startbildschirm hinzufügen“ wählen.
        </div>
        <button
          disabled={!canClose}
          onClick={onClose}
          style={{
            marginTop: 7,
            padding: "11px 0",
            width: "100%",
            fontWeight: 800,
            fontSize: 17,
            borderRadius: 10,
            border: 0,
            background: canClose ? "#a3e635" : "#23262e",
            color: canClose ? "#18181b" : "#fff",
            cursor: canClose ? "pointer" : "not-allowed",
            transition: "background 0.2s"
          }}
        >
          {canClose ? "Schließen" : "Bitte warte…"}
        </button>
      </div>
    </div>
  );
}
