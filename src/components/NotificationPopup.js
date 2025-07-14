import React from "react";

export default function NotificationPopup({ message, onClose, actionText, onAction }) {
  React.useEffect(() => {
    const timer = setTimeout(() => onClose && onClose(), 9000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div style={{
      position: "fixed",
      bottom: 30,
      right: 30,
      background: "#23262e",
      color: "#fff",
      borderRadius: 16,
      padding: "22px 28px 18px 24px",
      boxShadow: "0 6px 40px #000c",
      minWidth: 280,
      maxWidth: 360,
      zIndex: 99999,
      border: "2.5px solid #a3e635"
    }}>
      <div style={{fontWeight: 900, fontSize: 18, marginBottom: 9}}>
        🔔 Hinweis
      </div>
      <div style={{fontWeight: 600, fontSize: 16, marginBottom: 8}}>{message}</div>
      {actionText && (
        <button
          style={{
            background: "#a3e635",
            color: "#23262e",
            border: 0,
            borderRadius: 8,
            fontWeight: 800,
            fontSize: 15,
            padding: "6px 22px",
            marginRight: 10,
            cursor: "pointer"
          }}
          onClick={onAction}
        >
          {actionText}
        </button>
      )}
      <button
        onClick={onClose}
        style={{
          background: "transparent",
          color: "#fff",
          border: 0,
          fontWeight: 700,
          fontSize: 14,
          position: "absolute",
          top: 10,
          right: 16,
          cursor: "pointer",
        }}
      >
        ✖
      </button>
    </div>
  );
}
