import React, { useState, useEffect } from "react";
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
import NotificationPopup from "./NotificationPopup";

function msToDHM(ms) {
  const t = Math.max(0, ms);
  const days = Math.floor(t / (1000 * 60 * 60 * 24));
  const hours = Math.floor((t / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((t / (1000 * 60)) % 60);
  return `${days > 0 ? days + "d " : ""}${hours}h ${mins}m`;
}

const ACTIONS = [
  {
    id: "menu",
    label: "Menü",
    icon: <ShoppingCart size={30} />,
    color: "#18181b",
    bg: "linear-gradient(133deg,#a3e635 85%,#38bdf855 100%)",
    action: "onGotoMenu",
  },
  {
    id: "orders",
    label: "Bestellungen",
    icon: <Package size={30} />,
    color: "#fff",
    bg: "linear-gradient(135deg,#38bdf8 85%,#a3e63533 100%)",
    action: "onGotoOrders",
  },
  {
    id: "passes",
    label: "Pässe kaufen",
    icon: <Ticket size={30} />,
    color: "#fff",
    bg: "linear-gradient(135deg,#a3e635 50%,#38bdf8bb 100%)",
    action: "onGotoPass",
  },
  {
    id: "lotto",
    label: "Lotto",
    icon: "🎰",
    color: "#fff",
    bg: "linear-gradient(125deg,#38bdf8 70%,#a3e635bb 100%)",
    border: "2px solid #38bdf8",
    action: "onGotoLotto",
  },
  {
    id: "mystery",
    label: "Mystery Boxen",
    icon: <Gift size={32} />,
    color: "#fff",
    bg: "linear-gradient(120deg,#f59e42 65%,#a3e635 120%)",
    border: "2px solid #f59e42",
    action: "onGotoMysteryBoxen",
    animate: true,
  },
  {
    id: "inventar",
    label: "Inventar",
    icon: <Boxes size={30} />,
    color: "#fff",
    bg: "linear-gradient(120deg,#38bdf8 75%,#a3e63566 100%)",
    border: "2px solid #38bdf8",
    action: "onGotoInventar",
  },
  {
    id: "crypto",
    label: "Guthaben aufladen",
    icon: <Bitcoin size={29} />,
    color: "#a3e635",
    bg: "linear-gradient(127deg,#18181b 65%,#a3e63555 100%)",
    border: "2px solid #a3e635",
    action: "onBuyCryptoClick",
  },
  {
    id: "admin",
    label: "Admin Panel",
    icon: <UserCog size={28} />,
    color: "#fff",
    bg: "linear-gradient(122deg,#18181b 60%,#38bdf877 100%)",
    border: "2px solid #38bdf8",
    role: "admin",
    action: "onGotoAdmin",
  },
  {
    id: "kurier",
    label: "Kurier Panel",
    icon: <Truck size={28} />,
    color: "#fff",
    bg: "linear-gradient(122deg,#18181b 60%,#38bdf877 100%)",
    border: "2px solid #38bdf8",
    role: "kurier",
    action: "onGotoKurier",
  },
  {
    id: "logout",
    label: "Abmelden",
    icon: <LogOut size={29} />,
    color: "#fff",
    bg: "linear-gradient(133deg,#f87171 75%,#18181b 100%)",
    action: "onLogout",
  },
];

const DEMO_BROADCASTS = [
  {
    id: 1,
    text: "🎁 Mystery Box Update: Öffne eine Mystery Box und lass dich überraschen!",
  },
  {
    id: 2,
    text: "🛒 Schau dir die neuen Wochen-/Monatspässe an und fang an zu sparen!",
  },
  {
    id: 3,
    text: "🔴 Nimm an der wöchentlichen Lotto Ziehung teil!",
  },
];

export default function HomeView({
  user,
  orders = [],
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
  onGotoInventar,
}) {
  const [broadcasts, setBroadcasts] = useState(DEMO_BROADCASTS);
  const [notification, setNotification] = useState(null);

  const removeBroadcast = (id) =>
    setBroadcasts((prev) => prev.filter((b) => b.id !== id));

  const aktiverPass =
    user?.pass && user.pass.gültigBis && user.pass.gültigBis > Date.now()
      ? user.pass
      : null;
  const gespart = aktiverPass?.gespartAktuell ?? 0;
  const rabattLimit =
    (aktiverPass?.maxRabatt ?? aktiverPass?.gesparlimit ?? 0) - gespart;

  const role = user.rolle || user.role;
  const actionGrid = ACTIONS.filter(
    (a) =>
      !a.role ||
      (a.role === "admin" && role === "admin") ||
      (a.role === "kurier" && (role === "kurier" || role === "admin"))
  );

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

  useEffect(() => {
    if (
      user &&
      orders &&
      orders.some(
        (o) =>
          o.kunde === user.username &&
          o.status === "abgeschlossen" &&
          !o.rating
      )
    ) {
      setNotification({
        message:
          "Du hast eine abgeschlossene Bestellung, die du noch bewerten kannst! 🌟",
        actionText: "Jetzt bewerten",
        onAction: () => {
          setNotification(null);
          if (typeof onGotoOrders === "function") onGotoOrders();
        },
      });
    } else if (user && !user.telegramChatId) {
      setNotification({
        message:
          "Erhalte alle wichtigen Infos direkt per Telegram! Willst du Benachrichtigungen aktivieren?",
        actionText: "Telegram verbinden",
        onAction: () => {
          setNotification(null);
          const tgBotName = "PlugApp_bot";
          const url = `https://t.me/${tgBotName}?start=plug_${user.id}`;
          window.open(url, "_blank");
        },
      });
    }
  }, [orders, user, onGotoOrders]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at 35% 40%, #23292F 67%, #15191c 100%)",
        fontFamily: "'Inter',sans-serif",
        padding: 0,
        margin: 0,
        overflow: "auto",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {/* Notification Popup - leicht mittiger */}
      {notification && (
        <div style={{ position: "fixed", left: 0, right: 0, top: 44, zIndex: 5000 }}>
          <NotificationPopup
            message={notification.message}
            actionText={notification.actionText}
            onAction={notification.onAction}
            onClose={() => setNotification(null)}
            style={{ maxWidth: 340, margin: "0 auto" }}
          />
        </div>
      )}

      {/* Wallet unten rechts für Mobile */}
      <div
        style={{
          position: "fixed",
          right: 18,
          bottom: 20,
          zIndex: 90,
        }}
      >
        <button
          onClick={onWalletClick}
          style={{
            background: "#18181b",
            color: "#a3e635",
            border: "2px solid #23262e",
            borderRadius: "50%",
            padding: 15,
            fontWeight: 900,
            fontSize: 32,
            cursor: "pointer",
            boxShadow: "0 2px 18px #38bdf844, 0 2px 12px #0006",
            transition: "background 0.12s",
            minWidth: 54,
            minHeight: 54,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Wallet öffnen"
        >
          <Wallet size={32} />
        </button>
      </div>
      {!user.telegramChatId ? (
        <div style={{ marginTop: 10, marginBottom: 7, textAlign: "center" }}>
          <button
            style={{
              background: "#229ED9",
              color: "#fff",
              border: 0,
              borderRadius: 10,
              padding: "12px 19px",
              fontWeight: 800,
              fontSize: 18,
              cursor: "pointer",
              boxShadow: "0 2px 12px #229ED922",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              letterSpacing: 0.10,
              width: "90%",
              maxWidth: 340,
            }}
            onClick={() => {
              const tgBotName = "PlugApp_bot";
              const url = `https://t.me/${tgBotName}?start=plug_${user.id}`;
              window.open(url, "_blank");
            }}
          >
            <span style={{ fontSize: 23 }}>📲</span>
            Telegram-Benachrichtigungen aktivieren
          </button>
          <div style={{ fontSize: 13.5, color: "#229ED9", marginTop: 2 }}>
            Erhalte wichtige Benachrichtigungen direkt auf Telegram!
          </div>
        </div>
      ) : (
        <div
          style={{
            marginTop: 10,
            marginBottom: 7,
            color: "#229ED9",
            fontWeight: 700,
            fontSize: 15,
            textAlign: "center",
          }}
        >
          ✅ Telegram Benachrichtigungen aktiviert!
        </div>
      )}
      <div
        style={{
          maxWidth: 420,
          margin: "0 auto",
          padding: "0 4vw",
          paddingTop: 42,
          paddingBottom: 54,
        }}
      >
        {/* User Header */}
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            marginBottom: 13,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg,#38bdf8cc 60%,#a3e63577 100%)",
              borderRadius: "50%",
              width: 48,
              height: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: 22,
              color: "#fff",
              boxShadow: "0 2.5px 14px #38bdf822",
              userSelect: "none",
            }}
          >
            {user.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div
              style={{
                fontSize: 17,
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
                fontSize: 14.5,
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
              borderRadius: 12,
              padding: "11px 13px 10px 13px",
              boxShadow: "0 4px 13px #a3e63533, 0 2px 8px #38bdf822",
              marginBottom: 11,
              color: "#fff",
              fontSize: 13.2,
              border: "2px solid #a3e63533",
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <Ticket size={22} style={{ color: "#a3e635", marginRight: 6 }} />
            <div style={{ flex: 1, minWidth: 100 }}>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 14.5,
                  color: "#a3e635",
                  marginBottom: 1,
                }}
              >
                {aktiverPass.name}
              </div>
              <div
                style={{ color: "#38bdf8", fontWeight: 700, fontSize: 12.5 }}
              >
                {aktiverPass.rabatt}% Rabatt&nbsp; • &nbsp;
                <span style={{ color: "#a3e635", fontWeight: 900 }}>
                  {msToDHM(aktiverPass.gültigBis - Date.now())}
                </span>{" "}
                gültig
              </div>
              <div style={{ color: "#fff", fontSize: 11.7, marginTop: 2 }}>
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
              initial={{ x: 45, opacity: 0, scale: 0.94 }}
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
              exit={{ x: 40, opacity: 0, scale: 0.92 }}
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
                borderRadius: 11,
                padding: "9px 13px",
                fontSize: 14.2,
                fontWeight: 700,
                marginBottom: 7,
                boxShadow: "0 1.5px 7px #23262e44",
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
                  fontSize: 18,
                  fontWeight: 800,
                  marginLeft: 10,
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
            gridTemplateColumns: "1fr",
            gap: 12,
            marginTop: 6,
            width: "100%",
          }}
        >
          {actionGrid.map((a) =>
            a.animate ? (
              <motion.button
                key={a.id}
                onClick={handleAction(a.action)}
                whileHover={{ scale: 1.07, rotate: [0, -3, 3, 0] }}
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
                  borderRadius: 13,
                  fontWeight: 800,
                  fontSize: 16.3,
                  padding: "20px 0 12px 0",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "background 0.12s, color 0.13s, box-shadow 0.13s",
                  minHeight: 68,
                  position: "relative",
                  userSelect: "none",
                }}
              >
                <div>{a.icon}</div>
                <div style={{ letterSpacing: 0.07 }}>{a.label}</div>
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
                    right: 11,
                    top: 11,
                    color: "#fff8",
                    fontSize: 17,
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
                  borderRadius: 13,
                  boxShadow: "0 2px 10px #0001",
                  fontWeight: 800,
                  fontSize: 16.3,
                  padding: "20px 0 12px 0",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "background 0.12s, color 0.13s, box-shadow 0.13s",
                  minHeight: 68,
                  position: "relative",
                  userSelect: "none",
                }}
              >
                <div>{a.icon}</div>
                <div style={{ letterSpacing: 0.07 }}>{a.label}</div>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
