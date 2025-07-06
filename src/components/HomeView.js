// src/components/HomeView.js
import React, { useState } from "react";

import { Wallet } from "lucide-react"; // oder ein eigenes Icon
import Broadcasts from "./Broadcast";
export default function HomeView({
  user,
  onGotoMenu,
  onGotoOrders,
  onGotoAdmin,
  onGotoKurier,
  onLogout,
  broadcast,
  showBroadcast,
  closeBroadcast,
  onWalletClick,
  onBuyCryptoClick,
}) {
  const [broadcasts, setBroadcasts] = useState([
    {
      id: 1,
      text: "⚡ Krypto Update! Check deine Wallet                (Symbol      oben Rechts) aus und siehe nach wie du Krypto Kaufen kannst. Du erhälst 5€ als Guthaben geschenkt! (Nur mit Krypto verwendbar!)",
    },
    {
      id: 2,
      text: "🔴 Zahle mit Bitcoin und spare zusätzlich bis 250€ 5% und über 250€ 10%!",
    },
  ]);

  const removeBroadcast = (id) =>
    setBroadcasts(broadcasts.filter((b) => b.id !== id));
  return (
    <div
      style={{
        background: "#18181b",
        minHeight: "100vh",
        fontFamily: "'Inter',sans-serif",
        padding: 0,
        position: "relative",
      }}
    >
      {/* Wallet Button oben rechts */}
      <div style={{ position: "absolute", right: 32, top: 32, zIndex: 50 }}>
        <button
          onClick={onWalletClick}
          style={{
            background: "#23262e",
            color: "#a3e635",
            border: 0,
            borderRadius: 13,
            padding: 11,
            fontWeight: 800,
            fontSize: 24,
            cursor: "pointer",
            boxShadow: "0 2px 10px #0006",
            display: "flex",
            alignItems: "center",
            gap: 9,
          }}
          title="Wallet öffnen"
        >
          <Wallet size={27} style={{ marginRight: 2 }} />
        </button>
      </div>

      <div style={{ maxWidth: 450, margin: "0 auto", paddingTop: 90 }}>
        <h1
          style={{
            color: "#fff",
            fontSize: 29,
            fontWeight: 900,
            marginBottom: 25,
            textAlign: "center",
            letterSpacing: 1,
          }}
        >
          Willkommen, {user.username}!
        </h1>

        {showBroadcast && (
          <div
            style={{
              background: "#23262e",
              color: "#38bdf8",
              borderRadius: 12,
              padding: 15,
              fontSize: 17,
              marginBottom: 22,
              textAlign: "center",
              fontWeight: 700,
            }}
          >
            {<Broadcasts broadcasts={broadcasts} onClose={removeBroadcast} />}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <button
            onClick={onGotoMenu}
            style={{
              width: "100%",
              background: "#a3e635",
              color: "#18181b",
              fontWeight: 900,
              border: 0,
              borderRadius: 11,
              fontSize: 21,
              padding: "18px 0",
              cursor: "pointer",
              marginBottom: 3,
            }}
          >
            🛒 Menü
          </button>
          <button
            onClick={onGotoOrders}
            style={{
              width: "100%",
              background: "#38bdf8",
              color: "#18181b",
              fontWeight: 900,
              border: 0,
              borderRadius: 11,
              fontSize: 21,
              padding: "18px 0",
              cursor: "pointer",
              marginBottom: 3,
            }}
          >
            📦 Meine Bestellungen
          </button>
          {(user.rolle === "admin" || user.role === "admin") && (
            <button
              onClick={onGotoAdmin}
              style={{
                width: "100%",
                background: "#18181b",
                color: "#fff",
                fontWeight: 900,
                border: "2px solid #23262e",
                borderRadius: 11,
                fontSize: 20,
                padding: "16px 0",
                cursor: "pointer",
                marginBottom: 3,
              }}
            >
              ⚙️ Admin Panel
            </button>
          )}
          {(user.rolle === "admin" || user.role === "kurier") && (
            <button
              onClick={onGotoKurier}
              style={{
                width: "100%",
                background: "#18181b",
                color: "#fff",
                fontWeight: 900,
                border: "2px solid #23262e",
                borderRadius: 11,
                fontSize: 20,
                padding: "16px 0",
                cursor: "pointer",
                marginBottom: 3,
              }}
            >
              🛵 Kurier Panel
            </button>
          )}
          {/* NEU: Krypto kaufen Button */}
          <button
            onClick={onBuyCryptoClick}
            style={{
              width: "100%",
              background: "#18181b",
              color: "#a3e635",
              fontWeight: 900,
              border: "2px solid #a3e635",
              borderRadius: 11,
              fontSize: 20,
              padding: "16px 0",
              cursor: "pointer",
              marginBottom: 3,
            }}
          >
            💰 Krypto kaufen
          </button>
          <button
            onClick={onLogout}
            style={{
              width: "100%",
              background: "#f87171",
              color: "#fff",
              fontWeight: 900,
              border: 0,
              borderRadius: 11,
              fontSize: 19,
              padding: "14px 0",
              cursor: "pointer",
            }}
          >
            Abmelden
          </button>
        </div>
      </div>
    </div>
  );
}
