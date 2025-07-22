import React from "react";
import { motion } from "framer-motion";

export default function NotificationPopup({ message, actionText, onAction, onClose, style = {} }) {
  return (
    <motion.div
      initial={{ y: -60, opacity: 0, scale: 0.97 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -60, opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.32, type: "spring" }}
      style={{
        position: "fixed",
        top: 38,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        background: "linear-gradient(93deg,#a3e635 60%,#38bdf8 100%)",
        color: "#18181b",
        borderRadius: 16,
        fontWeight: 900,
        fontSize: 17,
        padding: "17px 13px 17px 17px",
        boxShadow: "0 8px 32px #a3e63539, 0 2px 13px #38bdf844",
        display: "flex",
        alignItems: "center",
        minWidth: 0,
        maxWidth: "94vw",
        width: "auto",
        wordBreak: "break-word",
        lineHeight: 1.45,
        ...style,
      }}
    >
      <span style={{
        flex: 1,
        minWidth: 0,
        fontSize: 16.8,
        wordBreak: "break-word",
        overflowWrap: "anywhere",
      }}>
        {message}
      </span>
      {actionText && (
        <button
          style={{
            marginLeft: 13,
            background: "#23262e",
            color: "#fff",
            border: 0,
            borderRadius: 10,
            fontWeight: 800,
            fontSize: 15.5,
            padding: "10px 17px",
            cursor: "pointer",
            transition: "background 0.16s",
            flexShrink: 0,
          }}
          onClick={onAction}
        >
          {actionText}
        </button>
      )}
      <button
        style={{
          marginLeft: 9,
          background: "none",
          border: "none",
          color: "#18181b",
          fontSize: 28,
          fontWeight: 800,
          cursor: "pointer",
          opacity: 0.7,
          padding: "2px 7px",
          flexShrink: 0,
          lineHeight: 1,
        }}
        onClick={onClose}
        aria-label="Schließen"
      >
        ×
      </button>
    </motion.div>
  );
}
