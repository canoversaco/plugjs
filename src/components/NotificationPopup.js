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
        top: 28,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        background: "linear-gradient(93deg,#a3e635 65%,#38bdf8 100%)",
        color: "#18181b",
        borderRadius: 13,
        fontWeight: 900,
        fontSize: 15.2,
        padding: "10px 10px 10px 15px",
        boxShadow: "0 6px 18px #38bdf829, 0 2px 8px #a3e63522",
        display: "flex",
        alignItems: "center",
        minWidth: 0,
        maxWidth: "94vw",
        width: "auto",
        wordBreak: "break-word",
        lineHeight: 1.35,
        minHeight: 0,
        maxHeight: 70,
        overflow: "hidden",
        ...style,
      }}
    >
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 15.5,
          wordBreak: "break-word",
          overflowWrap: "anywhere",
          whiteSpace: "pre-line",
          textOverflow: "ellipsis",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {message}
      </span>
      {actionText && (
        <button
          style={{
            marginLeft: 8,
            background: "#23262e",
            color: "#fff",
            border: 0,
            borderRadius: 8,
            fontWeight: 800,
            fontSize: 14.3,
            padding: "7px 10px",
            cursor: "pointer",
            transition: "background 0.16s",
            flexShrink: 0,
            maxHeight: 34,
            lineHeight: 1.05,
            display: "inline-block",
          }}
          onClick={onAction}
        >
          {actionText}
        </button>
      )}
      <button
        style={{
          marginLeft: 6,
          background: "none",
          border: "none",
          color: "#18181b",
          fontSize: 21,
          fontWeight: 900,
          cursor: "pointer",
          opacity: 0.7,
          padding: "1px 5px",
          flexShrink: 0,
          lineHeight: 1,
          display: "inline-block",
        }}
        onClick={onClose}
        aria-label="Schließen"
      >
        ×
      </button>
    </motion.div>
  );
}
