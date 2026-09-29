const axios = require('axios');
const { formatHeader } = require('../function');

module.exports = {
  commands: ["qris"],
  ownerOnly: false,
  run: async ({ client, msg, args, db, saveDb, settings }) => {
    const targetChat = msg.chatId;
    const apiKey = settings.fyxzgatewayApiKey;
    const baseUrl = settings.fyxzgatewayBaseUrl;
    const ownerId = settings.id_owner;

    if (!apiKey || !baseUrl) {
      return client.sendMessage(targetChat, {
        message: `${formatHeader("Payment Error")}Gateway API tidak dikonfigurasi. Hubungi owner.`,
        parseMode: "html",
        replyTo: msg.id
      });
    }

    // Parse nominal
    if (!args[0]) {
      return client.sendMessage(targetChat, {
        message: `${formatHeader("Payment")}Gunakan: <code>.qris 500</code> atau <code>.qris 1.2k</code>\nMinimal 500`,
        parseMode: "html",
        replyTo: msg.id
      });
    }

    let amountStr = args[0].toLowerCase().replace(',', '.'); // ganti koma jadi titik
    let amount = 0;
    try {
      if (amountStr.endsWith('k')) {
        // Contoh: 1.2k, 2,5k, 3k, 0.5k
        const numPart = parseFloat(amountStr.slice(0, -1));
        if (isNaN(numPart) || numPart <= 0) throw new Error("Format salah");
        amount = Math.round(numPart * 1000);
      } else {
        // Angka biasa: 1200, 5000, 15000
        amount = parseInt(amountStr);
        if (isNaN(amount) || amount <= 0) throw new Error("Format salah");
      }
    } catch (e) {
      return client.sendMessage(targetChat, {
        message: `${formatHeader("Payment Error")}Format nominal tidak dikenali. Contoh: <code>.qris 1200</code> atau <code>.qris 1.2k</code>`,
        parseMode: "html",
        replyTo: msg.id
      });
    }

    if (amount < 500) {
      return client.sendMessage(targetChat, {
        message: `${formatHeader("Payment Error")}Nominal minimal 500. Contoh: <code>.qris 500</code> atau <code>.qris 0.5k</code>`,
        parseMode: "html",
        replyTo: msg.id
      });
    }

    const statusMsg = await client.sendMessage(targetChat, {
      message: `${formatHeader("Payment")}⏳ Sedang membuat invoice...`,
      parseMode: "html",
      replyTo: msg.id
    });

    try {
      // Buat invoice
      const response = await axios.get(`${baseUrl}/invoice`, {
        params: { apikey: apiKey, amount: amount },
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-API-Key': apiKey
        }
      });
      const data = response.data;
      if (!data.success) throw new Error(data.message || "Gagal membuat invoice");

      // Simpan ke database
      if (!db.pendingInvoices) db.pendingInvoices = {};
      db.pendingInvoices[data.invoice_id] = {
        chatId: targetChat,
        amount: data.amount,
        status: 'pending',
        createdAt: Date.now(),
        expiredAt: data.expired_at
      };
      saveDb();

      // Kirim QRIS dengan info lengkap
      const caption = `${formatHeader("Payment QRIS")}` +
        `• Invoice ID: <code>${data.invoice_id}</code>\n` +
        `• Amount: <code>${data.amount}</code>\n` +
        `• Fee: <code>${data.fee}</code>\n` +
        `• Total: <code>${data.total}</code>\n` +
        `• Expired: <code>${data.expired_at}</code>\n\n` +
        `Scan QRIS untuk membayar. Sistem akan otomatis memeriksa pembayaran setiap 30 detik.`;

      await client.sendFile(targetChat, {
        file: data.qris_image,
        caption: caption,
        parseMode: "html",
        replyTo: msg.id
      });

      // Hapus pesan loading
      await client.deleteMessages(targetChat, [statusMsg.id], { revoke: true });

      // ========== AUTO CHECK BERKALA ==========
      let checkCount = 0;
      const maxChecks = 20; // 20 x 30 detik = 10 menit

      const checkInterval = setInterval(async () => {
        checkCount++;
        try {
          const statusRes = await axios.get(`${baseUrl}/invoice/status`, {
            params: { apikey: apiKey, invoice_id: data.invoice_id },
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'X-API-Key': apiKey
            }
          });
          const statusData = statusRes.data;

          // Update database
          if (db.pendingInvoices && db.pendingInvoices[data.invoice_id]) {
            db.pendingInvoices[data.invoice_id].status = statusData.status;
            saveDb();
          }

          // Jika PAID
          if (statusData.status === 'paid') {
            clearInterval(checkInterval);

            // Notifikasi ke owner (Saved Messages / chat pribadi owner)
            const notifOwner = `${formatHeader("✅ PAYMENT SUCCESS")}` +
              `Pembayaran telah dikonfirmasi!\n\n` +
              `• Invoice ID: <code>${statusData.invoice_id}</code>\n` +
              `• Amount: <code>${statusData.amount}</code>\n` +
              `• Fee: <code>${statusData.fee}</code>\n` +
              `• Total: <code>${statusData.total}</code>\n` +
              `• Status: <b>LUNAS</b>\n` +
              `• Dibayar oleh: <code>${msg.senderId}</code>\n` +
              `• Chat asal: <code>${targetChat}</code>`;

            await client.sendMessage(ownerId, {
              message: notifOwner,
              parseMode: "html"
            }).catch(() => {});

            // Notifikasi ke user
            await client.sendMessage(targetChat, {
              message: `${formatHeader("Payment Success")}✅ Pembayaran sebesar <code>${statusData.amount}</code> telah diterima!\nInvoice: <code>${data.invoice_id}</code>`,
              parseMode: "html"
            }).catch(() => {});

            // Hapus dari database
            if (db.pendingInvoices && db.pendingInvoices[data.invoice_id]) {
              delete db.pendingInvoices[data.invoice_id];
              saveDb();
            }
            return;
          }

          // Jika EXPIRED
          if (statusData.status === 'expired' || new Date(statusData.expired_at) < new Date()) {
            clearInterval(checkInterval);
            await client.sendMessage(targetChat, {
              message: `${formatHeader("Payment Expired")}⏳ Invoice telah kadaluwarsa. Silakan buat ulang dengan <code>.qris</code> baru.`,
              parseMode: "html"
            }).catch(() => {});
            if (db.pendingInvoices && db.pendingInvoices[data.invoice_id]) {
              delete db.pendingInvoices[data.invoice_id];
              saveDb();
            }
            return;
          }

          // Jika masih pending dan sudah mencapai batas maksimum cek
          if (checkCount >= maxChecks) {
            clearInterval(checkInterval);
            await client.sendMessage(targetChat, {
              message: `${formatHeader("Payment Info")}⏳ Pembayaran masih belum terdeteksi setelah 10 menit. Silakan hubungi owner untuk konfirmasi manual dengan Invoice ID: <code>${data.invoice_id}</code>`,
              parseMode: "html"
            }).catch(() => {});
            // Tidak dihapus dari database agar owner bisa cek manual nanti
          }
        } catch (err) {
          console.error("[Auto Check Invoice Error]", err.message);
          // Jika terjadi error, hentikan interval agar tidak spam
          clearInterval(checkInterval);
        }
      }, 30000); // 30 detik

    } catch (err) {
      let errorDetail = err.message;
      if (err.response && err.response.data) {
        errorDetail = JSON.stringify(err.response.data);
      }
      await client.editMessage(targetChat, {
        message: statusMsg.id,
        text: `${formatHeader("Payment Error")}Gagal membuat invoice: ${errorDetail}`,
        parseMode: "html"
      });
    }
  }
};