import React, { useState } from "react";
import {
  Wallet,
  Ticket,
  ShoppingCart,
  Package,
  LogOut,
  UserCog,
  Truck,
  Bitcoin,
  Gift,
  Boxes,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Hilfsfunktion für Restzeit
function msToDHM(ms) {
  const t = Math.max(0, ms);
  const days = Math.floor(t / (1000 * 60 * 60 * 24));
  const hours = Math.floor((t / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((t / (1000 * 60)) % 60);
  return `${days > 0 ? days + "d " : ""}${hours}h ${mins}m`;
}

// Modernere Card/Tile-Struktur für Aktionen!
const ACTIONS = [
  {
    id: "menu",
    label: "Menü",
    icon: <ShoppingCart size={26} />,
    color: "#18181b",
    bg: "linear-gradient(133deg,#a3e635 85%,#38bdf855 100%)",
    action: "onGotoMenu",
  },
  {
    id: "orders",
    label: "Bestellungen",
    icon: <Package size={26} />,
    color: "#fff",
    bg: "linear-gradient(135deg,#38bdf8 85%,#a3e63533 100%)",
    action: "onGotoOrders",
  },
  {
    id: "passes",
    label: "Pässe kaufen",
    icon: <Ticket size={25} />,
    color: "#fff",
    bg: "linear-gradient(135deg,#a3e635 50%,#38bdf8bb 100%)",
    action: "onGotoPass",
  },
  // --- LOTTO BUTTON HIER ---
  {
    id: "lotto",
    label: "Lotto",
    icon: "🎰",
    color: "#fff",
    bg: "linear-gradient(125deg,#38bdf8 70%,#a3e635bb 100%)",
    border: "2px solid #38bdf8",
    action: "onGotoLotto",
  },
  // --- MYSTERY BOXEN BUTTON (NEU) ---
  {
    id: "mystery",
    label: "Mystery Boxen",
    icon: <Gift size={27} />,
    color: "#fff",
    bg: "linear-gradient(120deg,#f59e42 65%,#a3e635 120%)",
    border: "2px solid #f59e42",
    action: "onGotoMysteryBoxen",
    animate: true,
  },
  // --- INVENTAR BUTTON (NEU) ---
  {
    id: "inventar",
    label: "Inventar",
    icon: <Boxes size={26} />,
    color: "#fff",
    bg: "linear-gradient(120deg,#38bdf8 75%,#a3e63566 100%)",
    border: "2px solid #38bdf8",
    action: "onGotoInventar",
  },
  // -------------------------
  {
    id: "crypto",
    label: "Guthaben aufladen",
    icon: <Bitcoin size={25} />,
    color: "#a3e635",
    bg: "linear-gradient(127deg,#18181b 65%,#a3e63555 100%)",
    border: "2px solid #a3e635",
    action: "onBuyCryptoClick",
  },
  {
    id: "admin",
    label: "Admin Panel",
    icon: <UserCog size={24} />,
    color: "#fff",
    bg: "linear-gradient(122deg,#18181b 60%,#38bdf877 100%)",
    border: "2px solid #38bdf8",
    role: "admin",
    action: "onGotoAdmin",
  },
  {
    id: "kurier",
    label: "Kurier Panel",
    icon: <Truck size={24} />,
    color: "#fff",
    bg: "linear-gradient(122deg,#18181b 60%,#38bdf877 100%)",
    border: "2px solid #38bdf8",
    role: "kurier",
    action: "onGotoKurier",
  },
  {
    id: "logout",
    label: "Abmelden",
    icon: <LogOut size={25} />,
    color: "#fff",
    bg: "linear-gradient(133deg,#f87171 75%,#18181b 100%)",
    action: "onLogout",
  },
];

// BROADCAST Demo
const DEMO_BROADCASTS = [
  {
    id: 1,
    text: "🎁 Mystery Box Update: Öffne eine Mystery Box und lass dich überraschen!",
  },
  {
    id: 2,
    text: "🛒 Schaue dir die neuen Wochen-/Monatspässe an und fange an zu sparen!",
  },
  {
    id: 3,
    text: "🔴 Nimm an der wöchentlichen Lotto Ziehung teil!",
  },
];

export default function HomeView({
  user,
  onGotoMenu,
  onGotoOrders,
  onGotoAdmin,
  onGotoKurier,
  onLogout,
  showBroadcast,
  broadcast,
  onGotoPass,
  closeBroadcast,
  onWalletClick,
  onBuyCryptoClick,
  onGotoLotto,
  onGotoMysteryBoxen,
  onGotoInventar, // <-- WICHTIG: Wird vom App.js übergeben!
}) {
  const [broadcasts, setBroadcasts] = useState(DEMO_BROADCASTS);

  const removeBroadcast = (id) =>
    setBroadcasts((prev) => prev.filter((b) => b.id !== id));

  // Aktiver Pass
  const aktiverPass =
    user?.pass && user.pass.gültigBis && user.pass.gültigBis > Date.now()
      ? user.pass
      : null;
  const gespart = aktiverPass?.gespartAktuell ?? 0;
  const rabattLimit =
    (aktiverPass?.maxRabatt ?? aktiverPass?.gesparlimit ?? 0) - gespart;

  // Grid-Layout für Aktionen
  const role = user.rolle || user.role;
  const actionGrid = ACTIONS.filter(
    (a) =>
      !a.role ||
      (a.role === "admin" && role === "admin") ||
      (a.role === "kurier" && (role === "kurier" || role === "admin"))
  );

  // Action Handler zuordnen
  const handleAction = (action) => {
    switch (action) {
      case "onGotoMenu":
        return onGotoMenu;
      case "onGotoOrders":
        return onGotoOrders;
      case "onGotoAdmin":
        return onGotoAdmin;
      case "onGotoKurier":
        return onGotoKurier;
      case "onGotoPass":
        return onGotoPass;
      case "onBuyCryptoClick":
        return onBuyCryptoClick;
      case "onGotoLotto":
        return onGotoLotto;
      case "onGotoMysteryBoxen":
        return onGotoMysteryBoxen;
      case "onGotoInventar":
        return onGotoInventar;
      case "onLogout":
        return onLogout;
      default:
        return undefined;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 35% 40%, #222931 63%, #191e24 100%)",
        fontFamily: "'Inter',sans-serif",
        padding: 0,
        margin: 0,
        overflow: "auto",
      }}
    >
      {/* Wallet oben rechts */}
      <div style={{ position: "fixed", right: 32, top: 32, zIndex: 80 }}>
        <button
          onClick={onWalletClick}
          style={{
            background: "#18181b",
            color: "#a3e635",
            border: "2px solid #23262e",
            borderRadius: "50%",
            padding: 13,
            fontWeight: 900,
            fontSize: 26,
            cursor: "pointer",
            boxShadow: "0 2px 12px #38bdf844, 0 2px 10px #0006",
            transition: "background 0.12s",
          }}
          title="Wallet öffnen"
        >
          <Wallet size={26} />
        </button>
      </div>

      <div
        style={{
          maxWidth: 630,
          margin: "0 auto",
          padding: "0 10px",
          paddingTop: 74,
          paddingBottom: 42,
        }}
      >
        {/* User Header */}
        <div
          style={{
            display: "flex",
            gap: 18,
            alignItems: "center",
            marginBottom: 15,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              background:
                "linear-gradient(135deg,#38bdf8cc 60%,#a3e63577 100%)",
              borderRadius: "50%",
              width: 56,
              height: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: 26,
              color: "#fff",
              boxShadow: "0 3px 17px #38bdf822",
              userSelect: "none",
            }}
          >
            {user.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div
              style={{
                fontSize: 19,
                fontWeight: 900,
                color: "#fff",
                letterSpacing: 1,
              }}
            >
              Willkommen, {user.username}
            </div>
            <div
              style={{
                color: "#a3e635",
                fontWeight: 700,
                fontSize: 15.5,
                marginTop: 2,
              }}
            >
              Guthaben:{" "}
              <span style={{ color: "#fff", fontWeight: 900 }}>
                {user.guthaben?.toFixed(2) ?? "0.00"} €
              </span>
            </div>
          </div>
        </div>

        {/* Aktiver Pass als horizontale "Card" */}
        {aktiverPass && (
          <div
            style={{
              background: "linear-gradient(105deg,#24292e 80%,#a3e63533 100%)",
              borderRadius: 13,
              padding: "13px 16px 11px 16px",
              boxShadow: "0 4px 13px #a3e63533, 0 2px 8px #38bdf822",
              marginBottom: 15,
              color: "#fff",
              fontSize: 14.2,
              border: "2px solid #a3e63533",
              display: "flex",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <Ticket size={27} style={{ color: "#a3e635", marginRight: 7 }} />
            <div style={{ flex: 1, minWidth: 130 }}>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 15.5,
                  color: "#a3e635",
                  marginBottom: 1,
                }}
              >
                {aktiverPass.name}
              </div>
              <div
                style={{ color: "#38bdf8", fontWeight: 700, fontSize: 13.5 }}
              >
                {aktiverPass.rabatt}% Rabatt&nbsp; • &nbsp;
                <span style={{ color: "#a3e635", fontWeight: 900 }}>
                  {msToDHM(aktiverPass.gültigBis - Date.now())}
                </span>{" "}
                gültig
              </div>
              <div style={{ color: "#fff", fontSize: 13.2, marginTop: 2 }}>
                Max:{" "}
                <span style={{ color: "#38bdf8", fontWeight: 700 }}>
                  {(aktiverPass.maxRabatt ?? 0).toFixed(2)} €
                </span>
                {" | "}Gespart:{" "}
                <span style={{ color: "#a3e635", fontWeight: 700 }}>
                  {gespart.toFixed(2)} €
                </span>
                {" | "}Übrig:{" "}
                <span style={{ color: "#a3e635", fontWeight: 900 }}>
                  {rabattLimit.toFixed(2)} €
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Broadcast-Karten animiert */}
        <AnimatePresence>
          {broadcasts.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ x: 60, opacity: 0, scale: 0.92 }}
              animate={{
                x: 0,
                opacity: 1,
                scale: 1,
                background:
                  i % 2 === 0
                    ? [
                        "linear-gradient(93deg,#38bdf8dd 65%,#a3e63544 100%)",
                        "linear-gradient(93deg,#a3e635dd 70%,#38bdf855 100%)",
                        "linear-gradient(93deg,#38bdf8dd 65%,#a3e63544 100%)",
                      ]
                    : [
                        "linear-gradient(93deg,#a3e635dd 70%,#38bdf855 100%)",
                        "linear-gradient(93deg,#38bdf8dd 65%,#a3e63544 100%)",
                        "linear-gradient(93deg,#a3e635dd 70%,#38bdf855 100%)",
                      ],
              }}
              exit={{ x: 55, opacity: 0, scale: 0.85 }}
              transition={{
                duration: 0.35,
                type: "spring",
                background: {
                  repeat: Infinity,
                  duration: 4.4,
                  ease: "linear",
                },
              }}
              style={{
                borderRadius: 12,
                padding: "10px 15px",
                fontSize: 15.5,
                fontWeight: 700,
                marginBottom: 9,
                boxShadow: "0 1.5px 8px #23262e44",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: "#fff",
              }}
            >
              <span style={{ flex: 1 }}>{b.text}</span>
              <button
                onClick={() => removeBroadcast(b.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#fff",
                  fontSize: 19,
                  fontWeight: 800,
                  marginLeft: 15,
                  cursor: "pointer",
                  lineHeight: "1.3",
                  transition: "color 0.14s",
                  opacity: 0.84,
                }}
                aria-label="Schließen"
              >
                ×
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Grid-Layout für Aktionen! */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 13,
            marginTop: 7,
          }}
        >
          {actionGrid.map((a) =>
            a.animate ? (
              <motion.button
                key={a.id}
                onClick={handleAction(a.action)}
                whileHover={{ scale: 1.08, rotate: [0, -3, 3, 0] }}
                animate={{
                  boxShadow: [
                    "0 0px 16px #f59e4234, 0 2px 12px #a3e63521",
                    "0 0px 26px #a3e63599, 0 2px 16px #f59e4225",
                    "0 0px 16px #f59e4234, 0 2px 12px #a3e63521",
                  ],
                }}
                transition={{
                  boxShadow: {
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "linear",
                  },
                }}
                style={{
                  background: a.bg,
                  color: a.color,
                  border: a.border || "none",
                  borderRadius: 14,
                  fontWeight: 800,
                  fontSize: 15.5,
                  padding: "19px 0 11px 0",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 9,
                  transition: "background 0.12s, color 0.13s, box-shadow 0.13s",
                  minHeight: 74,
                  position: "relative",
                  userSelect: "none",
                }}
              >
                <div>{a.icon}</div>
                <div style={{ letterSpacing: 0.08 }}>{a.label}</div>
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [1, 1.13, 1] }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    repeatType: "loop",
                  }}
                  style={{
                    position: "absolute",
                    right: 13,
                    top: 12,
                    color: "#fff8",
                    fontSize: 19,
                    pointerEvents: "none",
                  }}
                >
                  ✨
                </motion.div>
              </motion.button>
            ) : (
              <button
                key={a.id}
                onClick={handleAction(a.action)}
                style={{
                  background: a.bg,
                  color: a.color,
                  border: a.border || "none",
                  borderRadius: 14,
                  boxShadow: "0 2px 10px #0001",
                  fontWeight: 800,
                  fontSize: 15.5,
                  padding: "19px 0 11px 0",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 9,
                  transition: "background 0.12s, color 0.13s, box-shadow 0.13s",
                  minHeight: 74,
                  position: "relative",
                  userSelect: "none",
                }}
              >
                <div>{a.icon}</div>
                <div style={{ letterSpacing: 0.08 }}>{a.label}</div>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
