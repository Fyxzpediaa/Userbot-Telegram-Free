const fs = require('fs');
const path = require('path');
const Axios = require('axios');
const FormData = require('form-data');
const settings = require('../settings');

// Fungsi mengunggah berkas buffer gambar ke Catbox API (toURL)
async function uploadToUrl(buffer) {
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('fileToUpload', buffer, { filename: 'thumbnail.jpg' });
  
  const response = await Axios.post('https://catbox.moe/user/api.php', form, {
    headers: form.getHeaders()
  });
  return response.data; // Mengeluarkan tautan mentah dari cloud server
}

module.exports = {
  "commands": ["setthumbnail", "setthumb"],
  "ownerOnly": true,
  "run": async ({ client, msg }) => {
    let media = null;

    // Validasi media input langsung atau via reply chat
    if (msg.media && msg.media.photo) {
      media = msg.media;
    } else if (msg.replyToMsgId) {
      const repliedMsgs = await client["getMessages"](msg.chatId, { "ids": msg.replyToMsgId });
      if (repliedMsgs && repliedMsgs[0] && repliedMsgs[0].media && repliedMsgs[0].media.photo) {
        media = repliedMsgs[0].media;
      }
    }

    if (!media) {
      return client["sendMessage"](msg.chatId, {
        "message": `<blockquote><b>ERROR SYSTEM</b></blockquote>\nKirim gambar dengan caption <code>.setthumbnail</code> atau balas (reply) pada pesan gambar untuk mengubah foto menu utama.`,
        "parseMode": "html",
        "replyTo": msg.id
      });
    }

    const statusMsg = await client["sendMessage"](msg.chatId, {
      "message": `<blockquote><b>THUMBNAIL SYSTEM</b></blockquote>\nSedang mengunduh foto dan memproses konversi link toURL...`,
      "parseMode": "html",
      "replyTo": msg.id
    });

    try {
      const buffer = await client["downloadMedia"](media, {});
      if (!buffer) throw new Error("Gagal mengambil data buffer gambar dari Telegram.");

      await client["editMessage"](msg.chatId, {
        "message": statusMsg.id,
        "text": `<blockquote><b>THUMBNAIL SYSTEM</b></blockquote>\nBerhasil dikonversi! Sedang mengunggah ke server cloud dan memodifikasi file <b>settings.js</b>...`,
        "parseMode": "html"
      });

      // Proses pengunggahan media
      const uploadedUrl = await uploadToUrl(buffer);
      if (!uploadedUrl || !uploadedUrl.startsWith("http")) throw new Error("Gagal mengunduh URL balik dari Catbox Server.");

      const settingsPath = path.join(__dirname, "../settings.js");
      
      if (fs.existsSync(settingsPath)) {
        let settingsContent = fs.readFileSync(settingsPath, "utf8");

        // FIX: Regex dialihkan untuk mendeteksi properti 'menuImage' sesuai struktur settings.js Anda
        const regex = /(menuImage\s*:\s*['"`])([^'"`]*)(['"`])/;

        if (regex.test(settingsContent)) {
          settingsContent = settingsContent.replace(regex, `$1${uploadedUrl}$3`);
          fs.writeFileSync(settingsPath, settingsContent, "utf8");

          // Menyuntikkan langsung ke objek RAM global runtime agar efeknya instan tanpa restart bot
          settings.menuImage = uploadedUrl;
        } else {
          throw new Error("Properti kunci 'menuImage' tidak ditemukan di file settings.js Anda.");
        }
      } else {
        throw new Error("Berkas file fisik settings.js tidak ditemukan pada root folder.");
      }

      await client["editMessage"](msg.chatId, {
        "message": statusMsg.id,
        "text": `<blockquote><b>THUMBNAIL SUCCESS</b></blockquote>\nFoto menu berhasil diperbarui!\n\n• <b>Link Cloud Baru:</b> <code>${uploadedUrl}</code>\n\nTautan baru telah sukses ditempel ke properti <code>menuImage</code> di file <b>settings.js</b> Anda secara permanen. ✅`,
        "parseMode": "html"
      });

    } catch (err) {
      console.error(err);
      await client["editMessage"](msg.chatId, {
        "message": statusMsg.id,
        "text": `<blockquote><b>THUMBNAIL ERROR</b></blockquote>\nGagal memproses otomatisasi ke settings: ${err.message}`,
        "parseMode": "html"
      });
    }
  }
};
