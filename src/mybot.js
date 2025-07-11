const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios"); // Nur falls du Firestore oder Backend ansteuern willst

const TELEGRAM_TOKEN = "7459654349:AAE3UmBpba5o8eXMOFtbLeZwlRUOiGsl5z8";

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// /start command
bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  // Optionale Payload (z. B. plug_<userId>)
  const payload = match[1];

  // Hier kannst du deine Logik einbauen:
  // Zum Beispiel Firestore: userId aus payload auslesen und chatId speichern
  // Oder REST-API anpingen, um Telegram-ChatId zu speichern
  if (payload && payload.startsWith("plug_")) {
    const userId = payload.replace("plug_", "");
    // Sende die userId + chatId an dein Backend oder speichere sie in Firestore
    // Beispiel: Anfrage an eigene API
    try {
      await axios.post("http://185.198.234.220/api/save-telegram-id", {
        userId,
        chatId,
      });
      bot.sendMessage(
        chatId,
        `✅ Telegram-Benachrichtigungen sind jetzt aktiviert!`
      );
    } catch (e) {
      bot.sendMessage(chatId, `❌ Fehler beim Verknüpfen: ${e.toString()}`);
    }
  } else {
    bot.sendMessage(
      chatId,
      `Willkommen beim PlugBot! Nutze den Link aus der App, um Benachrichtigungen zu aktivieren.`
    );
  }
});
