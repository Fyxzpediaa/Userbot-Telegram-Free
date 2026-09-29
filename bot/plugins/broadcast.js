const { formatHeader, sleep } = require('../function');

module.exports = {
  commands: ["bc", "cfd"],
  ownerOnly: true,
  run: async ({ client, msg, db, inputChat }) => {
    const targetChat = inputChat || msg.chatId;

    if (!msg.replyToMsgId) {
      return client.sendMessage(targetChat, {
        message: `${formatHeader("Broadcast System")}Contoh penggunaan:\nBalas/Reply sebuah pesan media/teks, lalu ketik perintah <code>.bc</code> atau <code>.cfd</code>`,
        parseMode: "html", replyTo: msg.id
      });
    }

    const statusMsg = await client.sendMessage(targetChat, { message: `${formatHeader("Broadcast System")}Sedang memproses pengiriman, mohon tunggu...`, parseMode: "html" });
    
    try {
      const dialogs = await client.getDialogs({});
      const groups = dialogs.filter(d => d.isGroup);
      let success = 0, failed = 0;

      for (const group of groups) {
        // Jika perintah .cfd dijalankan, lewati grup yang ada di list database blacklist
        if (msg.text.includes("cfd") && db.blacklist.includes(group.id.toString())) {
          continue;
        }

        try {
          // Mendukung pengiriman pesan teks maupun media secara menyeluruh (Forward Asli)
          await client.forwardMessages(group.id, {
            messages: msg.replyToMsgId,
            fromPeer: targetChat
          });
          success++;
          await sleep(2500); // Penjeda anti-flood server telegram
        } catch {
          failed++;
        }
      }

      await client.editMessage(targetChat, {
        message: statusMsg.id,
        text: `${formatHeader("Broadcast Selesai")}• Sukses Terkirim: ${success} Grup\n• Gagal/Terlewati: ${failed} Grup`,
        parseMode: "html"
      });
    } catch (err) {
      await client.editMessage(targetChat, { message: statusMsg.id, text: `❌ Terjadi Error: ${err.message}` });
    }
  }
};
