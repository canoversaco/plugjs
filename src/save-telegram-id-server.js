// save-telegram-id-server.js
const express = require("express");
const bodyParser = require("body-parser");
const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp({
  credential: applicationDefault(),
});
const db = getFirestore();

const app = express();
app.use(bodyParser.json());

app.post("/api/save-telegram-id", async (req, res) => {
  const { userId, chatId } = req.body;
  if (!userId || !chatId) return res.status(400).send("Missing fields");
  try {
    await db.collection("users").doc(userId).update({ telegramChatId: chatId });
    return res.send({ success: true });
  } catch (e) {
    return res.status(500).send(e.toString());
  }
});

app.listen(3666, () => {
  console.log("Telegram Save API läuft auf Port 3666!");
});
