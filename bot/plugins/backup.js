const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

module.exports = {
  "commands": ["backup"],
  "ownerOnly": true,
  "run": async ({ client, msg }) => {
    // Catatan keamanan: file backup ini berisi settings.js (API key/token),
    // jadi TIDAK dikirim ke sembarang chat tempat perintah dijalankan —
    // hanya status prosesnya yang tampil di sini, filenya selalu ke Saved Messages.
    const targetChat = msg.chatId;

    const statusMsg = await client["sendMessage"](targetChat, {
      "message": `<blockquote><b>BACKUP SYSTEM</b></blockquote>\nSedang mengompres berkas utama script, mohon tunggu...`,
      "parseMode": "html", "replyTo": msg.id
    });

    const zipPath = path.join(__dirname, "../script_backup.zip");
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);

    const rootDir = path.join(__dirname, "../");
    const filesToBackup = ["index.js", "package.json", "settings.js", "function.js"];
    const pluginsDir = path.join(__dirname, "../plugins");

    for (const file of filesToBackup) {
      const filePath = path.join(rootDir, file);
      if (fs.existsSync(filePath)) archive.file(filePath, { name: file });
    }

    if (fs.existsSync(pluginsDir)) archive.directory(pluginsDir, "plugins");

    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
      archive.finalize();
    });

    try {
      await client["sendFile"]("me", {
        "file": zipPath,
        "caption": `<blockquote><b>BACKUP SUCCESS ✅</b></blockquote>\nBerikut adalah file cadangan script Anda.\n⚠️ Berisi data sensitif (API key/token) dari settings.js — jangan disebarkan ke siapa pun.`,
        "parseMode": "html"
      });

      await client["editMessage"](targetChat, {
        "message": statusMsg.id,
        "text": `<blockquote><b>BACKUP SUCCESS ✅</b></blockquote>\nFile cadangan berhasil dikirim ke <b>Saved Messages</b> Anda (bukan ke chat ini), demi keamanan karena isinya termasuk API key/token.`,
        "parseMode": "html"
      });
    } catch (sendErr) {
      await client["editMessage"](targetChat, {
        "message": statusMsg.id,
        "text": `<blockquote><b>BACKUP ERROR</b></blockquote>\nGagal mengirim: ${sendErr.message}`,
        "parseMode": "html"
      });
    } finally {
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
    }
  }
};
