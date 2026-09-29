const { markSelfSent } = require("../function");

module.exports = {
  "commands": ["afk", "unafk"],
  "ownerOnly": true,
  "run": async ({ client, msg, cmdName, db, saveDb, inputChat }) => {
    const targetChat = inputChat || msg.chatId;
    
    if (cmdName === "afk") {
      const reason = msg["message"].split(" ").slice(1).join(" ").trim() || "Tanpa alasan";

      db["afk"] = {
        "status": true,
        "reason": reason,
        "time": Date.now()
      };
      saveDb();

      const afkOnText = `<blockquote>💤 <b>𝖠𝖥𝖪 𝖬𝖮𝖣𝖤 𝖠𝖢𝖳𝖨𝖵𝖠𝖳𝖤𝖣</b> 🪐\n\nBerhasil masuk ke mode AFK.\n• Reason: <code>${reason}</code></blockquote>`;
      markSelfSent(afkOnText); // FIX: cegah echo pesan ini mematikan AFK yg baru saja diaktifkan
      await client["sendMessage"](targetChat, {
        "message": afkOnText,
        "parseMode": "html", "replyTo": msg["id"]
      });
    } 
    
    else if (cmdName === "unafk") {
      if (!db["afk"] || !db["afk"]["status"]) {
        const notAfkText = `<blockquote>⚠️ Anda tidak sedang dalam mode AFK.</blockquote>`;
        markSelfSent(notAfkText);
        return client["sendMessage"](targetChat, {
          "message": notAfkText,
          "parseMode": "html", "replyTo": msg["id"]
        });
      }

      db["afk"]["status"] = false;
      saveDb();

      const afkOffText = `<blockquote>✨ <b>𝖶𝖤𝖫𝖢𝖮𝖬𝖤 𝖡𝖤𝖱𝖳𝖤𝖬𝖴 𝖪𝖤𝖬𝖡𝖠𝖫𝖨</b>\nMode AFK dinonaktifkan!💫</blockquote>`;
      markSelfSent(afkOffText);
      await client["sendMessage"](targetChat, {
        "message": afkOffText,
        "parseMode": "html", "replyTo": msg["id"]
      });
    }
  }
};
