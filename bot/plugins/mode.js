const { formatHeader } = require('../function');

module.exports = {
  commands: ["mode", "autojoin"],
  ownerOnly: true,
  run: async ({ client, msg, args, cmdName, db, saveDb }) => {
    if (cmdName === "mode") {
      if (!args[0]) {
        return client.sendMessage(msg.chatId, {
          message: `${formatHeader("Mode Control")}Contoh penggunaan:\n<code>.mode self</code> atau <code>.mode public</code>`,
          parseMode: "html", replyTo: msg.id
        });
      }
      const type = args[0].toLowerCase();
      if (type === "self") {
        db.selfMode = true;
        saveDb();
        await client.sendMessage(msg.chatId, { message: `${formatHeader("Mode Control")}Berhasil mengubah mode bot menjadi <b>Self (Private)</b>.`, parseMode: "html" });
      } else if (type === "public") {
        db.selfMode = false;
        saveDb();
        await client.sendMessage(msg.chatId, { message: `${formatHeader("Mode Control")}Berhasil mengubah mode bot menjadi <b>Public (Umum)</b>.`, parseMode: "html" });
      }
    }

    if (cmdName === "autojoin") {
      if (!args[0]) {
        return client.sendMessage(msg.chatId, {
          message: `${formatHeader("Auto Join Control")}Contoh penggunaan:\n<code>.autojoin on</code> atau <code>.autojoin off</code>`,
          parseMode: "html", replyTo: msg.id
        });
      }
      const opt = args[0].toLowerCase();
      db.autoJoinGroup = (opt === "on");
      saveDb();
      await client.sendMessage(msg.chatId, { message: `${formatHeader("Auto Join Control")}Fitur auto join group telah di-<b>${db.autoJoinGroup ? "Aktifkan" : "Matikan"}</b>.`, parseMode: "html" });
    }
  }
};
