const { formatHeader, UploadPixhost } = require('../function');

module.exports = {
  commands: ["tourl", "catbox"],
  ownerOnly: false,
  run: async ({ client, msg }) => {
    if (!msg.replyToMsgId) {
      return client.sendMessage(msg.chatId, {
        message: `${formatHeader("Media To URL Uploader")}Contoh penggunaan:\nBalas/Reply pesan gambar yang dikirimkan, lalu ketik perintah <code>.tourl</code>`,
        parseMode: "html", replyTo: msg.id
      });
    }

    const statusMsg = await client.sendMessage(msg.chatId, { message: `${formatHeader("Media To URL Uploader")}Sedang mengunduh dan memproses media ke server cloud...`, parseMode: "html" });

    try {
      const replied = await client.getMessages(msg.chatId, { ids: msg.replyToMsgId });
      if (!replied || !replied[0] || !replied[0].media) {
        return client.editMessage(msg.chatId, { message: statusMsg.id, text: "❌ Pesan yang Anda balas tidak memiliki berkas media/gambar valid." });
      }

      const buffer = await client.downloadMedia(replied[0].media);
      const urlResult = await UploadPixhost(buffer);

      if (!urlResult) throw new Error("Gagal mengupload file media.");

      await client.editMessage(msg.chatId, {
        message: statusMsg.id,
        text: `${formatHeader("Upload Berhasil")}• URL Tautan Direct:\n<code>${urlResult}</code>`,
        parseMode: "html"
      });
    } catch (err) {
      await client.editMessage(msg.chatId, { message: statusMsg.id, text: `❌ Gagal: ${err.message}` });
    }
  }
};
