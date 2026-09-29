const Axios = require('axios');
const FormData = require('form-data');

async function uploadToUrl(buffer) {
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('fileToUpload', buffer, { filename: 'broadcast.jpg' });
  const response = await Axios.post('https://catbox.moe/user/api.php', form, { headers: form.getHeaders() });
  return response.data;
}

async function runBroadcast(client, db) {
  if (!db["bcMsg"] && !db["bcMedia"]) return;
  try {
    const dialogs = await client["getDialogs"]({});
    const blacklist = Array.isArray(db["blacklist"]) ? db["blacklist"] : [];
    for (const dialog of dialogs) {
      if (dialog.isGroup || dialog.isChannel) {
        // FIX: sebelumnya autobc mengirim ke SEMUA grup/channel tanpa kecuali,
        // tidak konsisten dengan .cfd yang sudah menghormati blacklist.
        if (blacklist.includes(dialog.id.toString())) continue;
        try {
          if (db["bcMedia"]) {
            await client["sendFile"](dialog.id, {
              "file": db["bcMedia"],
              "caption": db["bcMsg"] || "",
              "parseMode": "html",
              "forceDocument": false
            });
          } else {
            await client["sendMessage"](dialog.id, {
              "message": db["bcMsg"],
              "parseMode": "html"
            });
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (e) {}
      }
    }
  } catch (err) {
    console.error("[AutoBC Loop Error]", err);
  }
}

function parseInterval(text) {
  const num = parseInt(text);
  if (isNaN(num)) return null;
  if (text.includes('detik')) return num * 1000;
  if (text.includes('menit')) return num * 60 * 1000;
  if (text.includes('jam')) return num * 60 * 60 * 1000;
  return null;
}

module.exports = {
  "commands": ["autobc", "setbc"],
  "ownerOnly": true,
  "runBroadcast": runBroadcast,
  "run": async ({ client, msg, db, inputChat }) => {
    const targetChat = inputChat || msg.chatId;
    const cmdUsed = msg.message.split(" ")[0].toLowerCase().replace(db["prefix"], "");

    if (cmdUsed === "autobc") {
      const args = msg.message.split(" ")[1];
      if (!args || (args !== "on" && args !== "off")) {
        return client["sendMessage"](targetChat, {
          "message": `<blockquote><b>USAGE ERROR</b></blockquote>\nFormat salah. Gunakan <code>.autobc on</code> atau <code>.autobc off</code>`,
          "parseMode": "html", "replyTo": msg.id
        });
      }

      if (args === "on") {
        // FIX: AutoBC sekarang boleh jalan BERSAMAAN dengan AutoCFD/AutoJoin (sesuai permintaan) -- larangan lama dihapus.
        db["autoBc"] = true;
        if (db["bcInterval"] && (db["bcMsg"] || db["bcMedia"])) {
          if (global.autobcIntervalId) clearInterval(global.autobcIntervalId);
          global.autobcIntervalId = setInterval(() => { runBroadcast(client, db); }, db["bcInterval"]);
        }

        return client["sendMessage"](targetChat, {
          "message": `<blockquote><b>AUTO BC ACTIVE</b></blockquote>\nFitur Auto Broadcast Berhasil diaktifkan! ✅`,
          "parseMode": "html", "replyTo": msg.id
        });
      } else {
        db["autoBc"] = false;
        if (global.autobcIntervalId) {
          clearInterval(global.autobcIntervalId);
          global.autobcIntervalId = null;
        }
        return client["sendMessage"](targetChat, {
          "message": `<blockquote><b>AUTO BC INACTIVE</b></blockquote>\nFitur Auto Broadcast Berhasil dinonaktifkan! ❌`,
          "parseMode": "html", "replyTo": msg.id
        });
      }
    }

    if (cmdUsed === "setbc") {
      const match = msg.message.match(/setbc\s+(\d+(?:detik|menit|jam))/i);
      if (!match || !msg.replyToMsgId) {
        return client["sendMessage"](targetChat, {
          "message": `<blockquote><b>USAGE ERROR</b></blockquote>\nHarap balas pesan/foto, contoh: <code>.setbc 10menit</code>`,
          "parseMode": "html", "replyTo": msg.id
        });
      }

      const timeStr = match[1];
      const durationMs = parseInterval(timeStr);
      if (!durationMs) return;

      const statusMsg = await client["sendMessage"](targetChat, {
        "message": `<blockquote><b>BC SYSTEM</b></blockquote>\nSedang mengunci materi broadcast...`,
        "parseMode": "html", "replyTo": msg.id
      });

      try {
        const repliedMsgs = await client["getMessages"](targetChat, { "ids": msg.replyToMsgId });
        const rMsg = repliedMsgs[0];

        db["bcMsg"] = rMsg.message || "";
        db["bcInterval"] = durationMs;
        db["bcMedia"] = null;

        if (rMsg.media && rMsg.media.photo) {
          await client["editMessage"](targetChat, {
            "message": statusMsg.id,
            "text": `<blockquote><b>BC SYSTEM</b></blockquote>\nSedang mengonversi gambar...`,
            "parseMode": "html"
          });
          const buffer = await client["downloadMedia"](rMsg.media, {});
          if (buffer) {
            const uploadedUrl = await uploadToUrl(buffer);
            if (uploadedUrl && uploadedUrl.startsWith("http")) db["bcMedia"] = uploadedUrl;
          }
        }

        if (db["autoBc"]) {
          if (global.autobcIntervalId) clearInterval(global.autobcIntervalId);
          global.autobcIntervalId = setInterval(() => { runBroadcast(client, db); }, db["bcInterval"]);
        }

        await client["editMessage"](targetChat, {
          "message": statusMsg.id,
          "text": `<blockquote><b>BC SETUP SUCCESS ✅</b></blockquote>\n• <b>Interval:</b> <code>${timeStr}</code>\n• <b>Media:</b> <code>${db["bcMedia"] ? "AKTIF" : "TIDAK ADA"}</code>`,
          "parseMode": "html"
        });
      } catch (err) {
        await client["editMessage"](targetChat, { "message": statusMsg.id, "text": `❌ Gagal: ${err.message}` });
      }
    }
  }
};
