import React from "react";
import { motion } from "framer-motion";

export default function NotificationPopup({ message, actionText, onAction, onClose }) {
  return (
    <motion.div
      initial={{ y: -60, opacity: 0, scale: 0.97 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -60, opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.32, type: "spring" }}
      style={{
        position: "fixed",
        top: 19,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        background: "linear-gradient(93deg,#a3e635 60%,#38bdf8 100%)",
        color: "#18181b",
        borderRadius: 14,
        fontWeight: 900,
        fontSize: 16.5,
        padding: "15px 32px 15px 19px",
        boxShadow: "0 8px 32px #a3e63539, 0 2px 13px #38bdf844",
        display: "flex",
        alignItems: "center",
        minWidth: 250,
        maxWidth: 450,
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      {actionText && (
        <button
          style={{
            marginLeft: 19,
            background: "#23262e",
            color: "#fff",
            border: 0,
            borderRadius: 8,
            fontWeight: 800,
            fontSize: 15,
            padding: "7px 16px",
            cursor: "pointer",
            transition: "background 0.16s",
          }}
          onClick={onAction}
        >
          {actionText}
        </button>
      )}
      <button
        style={{
          marginLeft: 13,
          background: "none",
          border: "none",
          color: "#18181b",
          fontSize: 23,
          fontWeight: 800,
          cursor: "pointer",
          opacity: 0.7,
        }}
        onClick={onClose}
        aria-label="Schließen"
      >
        ×
      </button>
    </motion.div>
  );
}
