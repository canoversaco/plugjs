// save-telegram-id-server.js
const express = require("express");
const bodyParser = require("body-parser");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const serviceAccount = require("./serviceAccountKey.json"); // Pfad ggf. anpassen!

initializeApp({
  credential: cert(serviceAccount),
});
const db = getFirestore();

const app = express();
app.use(bodyParser.json());

app.post("/api/save-telegram-id", async (req, res) => {
  const { userId, chatId } = req.body;
  console.log("Request:", req.body); // <-- DAS HIER EINFÜGEN!
  if (!userId || !chatId) return res.status(400).send("Missing fields");
  try {
    await db.collection("users").doc(userId).update({ telegramChatId: chatId });
    return res.send({ success: true });
  } catch (e) {
    console.error("Firestore Update Fehler:", e); // <--- DAS AUCH!
    return res.status(500).send(e.toString());
  }
});

app.listen(3666, () => {
  console.log("Telegram Save API läuft auf Port 3666!");
});
