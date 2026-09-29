const Axios = require('axios');
const FormData = require('form-data');

async function uploadToUrl(buffer) {
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('fileToUpload', buffer, { filename: 'forward.jpg' });
  const response = await Axios.post('https://catbox.moe/user/api.php', form, { headers: form.getHeaders() });
  return response.data;
}

async function runCfd(client, db) {
  if (!db["cfdTargetChat"]) return;
  if (!db["cfdMsg"] && !db["cfdMedia"]) return;
  try {
    const targetEntity = await client["getInputEntity"](db["cfdTargetChat"]);
    if (db["cfdMedia"]) {
      await client["sendFile"](targetEntity, {
        "file": db["cfdMedia"],
        "caption": db["cfdMsg"] || "",
        "parseMode": "html",
        "forceDocument": false
      });
    } else {
      await client["sendMessage"](targetEntity, {
        "message": db["cfdMsg"],
        "parseMode": "html"
      });
    }
  } catch (err) {
    console.error("[AutoCFD Loop Error]", err);
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
  "commands": ["autocfd", "setcfd"],
  "ownerOnly": true,
  "runCfd": runCfd, // FIX: sebelumnya tidak di-export (beda dgn autobc.js), padahal dibutuhkan bot panel utk restart interval
  "run": async ({ client, msg, db, inputChat }) => {
    const targetChat = inputChat || msg.chatId;
    const cmdUsed = msg.message.split(" ")[0].toLowerCase().replace(db["prefix"], "");

    if (cmdUsed === "autocfd") {
      const args = msg.message.split(" ")[1];
      if (!args || (args !== "on" && args !== "off")) {
        return client["sendMessage"](targetChat, {
          "message": `<blockquote><b>USAGE ERROR</b></blockquote>\nGunakan <code>.autocfd on</code> atau <code>.autocfd off</code>`,
          "parseMode": "html", "replyTo": msg.id
        });
      }

      if (args === "on") {
        // FIX: AutoCFD sekarang boleh jalan BERSAMAAN dengan AutoBC/AutoJoin (sesuai permintaan) -- larangan lama dihapus.
        db["autoCfd"] = true;
        if (db["cfdInterval"] && db["cfdTargetChat"]) {
          if (global.autocfdIntervalId) clearInterval(global.autocfdIntervalId);
          global.autocfdIntervalId = setInterval(() => { runCfd(client, db); }, db["cfdInterval"]);
        }
        return client["sendMessage"](targetChat, { "message": `<blockquote><b>CFD ACTIVE ✅</b></blockquote>`, "parseMode": "html", "replyTo": msg.id });
      } else {
        db["autoCfd"] = false;
        if (global.autocfdIntervalId) {
          clearInterval(global.autocfdIntervalId);
          global.autocfdIntervalId = null;
        }
        return client["sendMessage"](targetChat, { "message": `<blockquote><b>CFD INACTIVE ❌</b></blockquote>`, "parseMode": "html", "replyTo": msg.id });
      }
    }

    if (cmdUsed === "setcfd") {
      const match = msg.message.match(/setcfd\s+(\d+(?:detik|menit|jam))/i);
      if (!match || !msg.replyToMsgId) {
        return client["sendMessage"](targetChat, {
          "message": `<blockquote><b>USAGE ERROR</b></blockquote>\nReply pesan/foto, ketik: <code>.setcfd 10detik</code>`,
          "parseMode": "html", "replyTo": msg.id
        });
      }

      const timeStr = match[1];
      const durationMs = parseInterval(timeStr);
      if (!durationMs) return;

      const statusMsg = await client["sendMessage"](targetChat, { "message": `<blockquote><b>CFD SYSTEM</b></blockquote>\nProcessing...`, "parseMode": "html", "replyTo": msg.id });

      try {
        const repliedMsgs = await client["getMessages"](targetChat, { "ids": msg.replyToMsgId });
        const rMsg = repliedMsgs[0];

        db["cfdMsg"] = rMsg.message || "";
        db["cfdInterval"] = durationMs;
        db["cfdTargetChat"] = msg.chatId.toString();
        db["cfdMedia"] = null;

        if (rMsg.media && rMsg.media.photo) {
          const buffer = await client["downloadMedia"](rMsg.media, {});
          if (buffer) {
            const uploadedUrl = await uploadToUrl(buffer);
            if (uploadedUrl && uploadedUrl.startsWith("http")) db["cfdMedia"] = uploadedUrl;
          }
        }

        if (db["autoCfd"]) {
          if (global.autocfdIntervalId) clearInterval(global.autocfdIntervalId);
          global.autocfdIntervalId = setInterval(() => { runCfd(client, db); }, db["cfdInterval"]);
        }

        await client["editMessage"](targetChat, {
          "message": statusMsg.id,
          "text": `<blockquote><b>CFD SETUP SUCCESS ✅</b></blockquote>\nTarget locked on this chat room.`,
          "parseMode": "html"
        });
      } catch (err) {
        await client["editMessage"](targetChat, { "message": statusMsg.id, "text": `❌ Error: ${err.message}` });
      }
    }
  }
};
