module.exports = {
  commands: ["setprefix"],
  ownerOnly: true,
  run: async ({ client, msg, args, db, saveDb }) => {
    const newPrefix = args[0] ? args[0].trim() : "";

    if (!newPrefix) {
      return client.sendMessage(msg.chatId, {
        message: `<blockquote><b>ERROR SYSTEM</b></blockquote>\nFormat salah! Masukkan prefix baru.\nContoh: <code>.setprefix #</code>`,
        parseMode: "html",
        replyTo: msg.id
      });
    }

    const oldPrefix = db.prefix;
    
    // Perbarui prefix di database ram panel & simpan
    db.prefix = newPrefix;
    saveDb();

    return client.sendMessage(msg.chatId, {
      message: `<blockquote><b>PREFIX CHANGED</b></blockquote>\nSistem prefix berhasil diubah!\n\n• Sebelum: <code>${oldPrefix}</code>\n• Sesudah: <code>${newPrefix}</code>`,
      parseMode: "html",
      replyTo: msg.id
    });
  }
};
