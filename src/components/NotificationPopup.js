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
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        background: "linear-gradient(93deg,#a3e635 65%,#38bdf8 100%)",
        color: "#18181b",
        borderRadius: 13,
        fontWeight: 900,
        fontSize: 15.2,
        padding: "10px 12px",
        boxShadow: "0 6px 18px #38bdf829, 0 2px 8px #a3e63522",
        display: "flex",
        alignItems: "center",
        minWidth: 0,
        maxWidth: "95vw",
        width: "auto",
        wordBreak: "break-word",
        lineHeight: 1.32,
        minHeight: 0,
        maxHeight: 90,
        overflow: "hidden",
        ...style,
      }}
    >
      <span
        style={{
          flex: 1,
          fontSize: 15.5,
          wordBreak: "break-word",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "normal",
        }}
      >
        {message}
      </span>
      {actionText && (
        <button
          style={{
            marginLeft: 10,
            background: "#23262e",
            color: "#fff",
            border: 0,
            borderRadius: 8,
            fontWeight: 800,
            fontSize: 14.3,
            padding: "7px 12px",
            cursor: "pointer",
            transition: "background 0.16s",
            flexShrink: 0,
            maxHeight: 36,
            lineHeight: 1.12,
            display: "inline-block",
          }}
          onClick={onAction}
        >
          {actionText}
        </button>
      )}
      <button
        style={{
          marginLeft: 7,
          background: "none",
          border: "none",
          color: "#18181b",
          fontSize: 22,
          fontWeight: 900,
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
