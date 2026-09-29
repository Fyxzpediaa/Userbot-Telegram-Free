const { formatHeader } = require('../function');

module.exports = {
  commands: ["pay", "payment"],
  ownerOnly: false,
  run: async ({ client, msg, settings, inputChat }) => {
    const targetChat = inputChat || msg.chatId;

    // Proteksi jika data payment di settings.js tidak terdefinisi
    const payment = settings.payment || { dana: "-", gopay: "-", ovo: "-" };

    const captionText = `${formatHeader("Metode Pembayaran")}` +
      `Silakan lakukan pembayaran melalui salah satu opsi di bawah ini:\n\n` +
      `• <b>DANA:</b> <code>${payment.dana}</code>\n` +
      `• <b>GOPAY:</b> <code>${payment.gopay}</code>\n` +
      `• <b>OVO:</b> <code>${payment.ovo}</code>\n\n` +
      `<i>💡 Setelah transfer, kirimkan screenshot bukti transaksi ke Owner. Terima kasih!\n© Developer Script: t.me/Fyxzpedia</i>`;

    try {
      if (settings.qrisImage && settings.qrisImage.startsWith("http")) {
        await client.sendFile(targetChat, {
          file: settings.qrisImage,
          caption: captionText,
          parseMode: "html",
          replyTo: msg.id
        });
      } else {
        await client.sendMessage(targetChat, {
          message: captionText,
          parseMode: "html",
          replyTo: msg.id
        });
      }
    } catch (err) {
      console.error("[PAY ERROR]", err.message);
      try {
        await client.sendMessage(targetChat, {
          message: captionText + `\n\n⚠️ <i>Gagal memuat gambar QRIS, silakan gunakan nomor di atas.</i>`,
          parseMode: "html",
          replyTo: msg.id
        });
      } catch (e) {}
    }
  }
};
