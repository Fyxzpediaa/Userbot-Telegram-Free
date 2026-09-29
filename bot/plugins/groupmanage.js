const { formatHeader } = require('../function');
const { Api } = require('telegram');

// ============================================================
// KELOLA GRUP: Antilink, Antiflood, Filter Kata
// ============================================================
// Pengaturan disimpan PER GRUP di db.groupSettings[chatId], supaya tiap
// grup bisa punya konfigurasi sendiri-sendiri. Fungsi checkAntilink,
// checkAntiflood, dan checkWordFilter di-export supaya index.js bisa
// memanggilnya di message handler utama (mirip pola AutoJoin/AFK).
// ============================================================

function getGroupSettings(db, chatId) {
  if (!db["groupSettings"]) db["groupSettings"] = {};
  if (!db["groupSettings"][chatId]) {
    db["groupSettings"][chatId] = {
      "antilink": { "enabled": false, "mode": "nokick" }, // mode: "kick" | "nokick"
      "antiflood": { "enabled": false },
      "wordfilter": { "enabled": false, "words": [] }
    };
  }
  return db["groupSettings"][chatId];
}

// Cache in-memory buat deteksi flood: chatId:senderId -> array timestamp pesan terakhir
const floodCache = new Map();
const FLOOD_WINDOW_MS = 8000;   // jendela waktu
const FLOOD_MAX_MSG = 5;        // maksimal pesan dalam jendela waktu sebelum dianggap flood

const URL_REGEX = /(https?:\/\/|www\.|t(?:elegram)?\.me\/)\S+/i;

async function isSenderAdmin(client, chatId, senderId) {
  try {
    // Pakai raw MTProto call (channels.GetParticipant) -- hanya berlaku utk
    // supergroup/channel (mayoritas grup Telegram modern). Grup basic/legacy
    // akan gagal di sini dan di-treat fail-safe (null -> aksi dilewati).
    const result = await client["invoke"](new Api["channels"]["GetParticipant"]({ "channel": chatId, "participant": senderId }));
    const cls = result && result["participant"] && result["participant"]["className"];
    return cls === "ChannelParticipantCreator" || cls === "ChannelParticipantAdmin";
  } catch (e) {
    return null; // tidak bisa dipastikan -> caller sebaiknya skip aksi (fail-safe)
  }
}

/**
 * Cek & tindak pesan berisi link, sesuai pengaturan antilink grup ybs.
 * Dipanggil dari index.js untuk SETIAP pesan masuk di grup (bukan dari owner).
 */
async function checkAntilink(client, db, msg, isOwner) {
  if (isOwner || !msg["isGroup"]) return false;
  const chatId = msg["chatId"].toString();
  const settings = getGroupSettings(db, chatId);
  if (!settings["antilink"]["enabled"]) return false;

  const text = msg["message"] || "";
  if (!URL_REGEX.test(text)) return false;

  const isAdmin = await isSenderAdmin(client, msg["chatId"], msg["senderId"]);
  if (isAdmin === true) return false;  // admin dikecualikan
  if (isAdmin === null) return false;  // gagal cek hak akses -> jangan bertindak (fail-safe)

  try {
    await client["deleteMessages"](msg["chatId"], [msg["id"]], { "revoke": true });
  } catch (e) {}

  if (settings["antilink"]["mode"] === "kick") {
    try {
      await client["kickParticipant"](msg["chatId"], msg["senderId"]);
    } catch (e) {}
  }
  return true;
}

/**
 * Cek & tindak flood (spam beruntun). Menghapus pesan-pesan flood, TANPA kick
 * (mode kick untuk flood berisiko salah tendang lebih tinggi daripada link).
 */
async function checkAntiflood(client, db, msg, isOwner) {
  if (isOwner || !msg["isGroup"]) return false;
  const chatId = msg["chatId"].toString();
  const settings = getGroupSettings(db, chatId);
  if (!settings["antiflood"]["enabled"]) return false;

  const isAdmin = await isSenderAdmin(client, msg["chatId"], msg["senderId"]);
  if (isAdmin === true || isAdmin === null) return false;

  const key = `${chatId}:${msg["senderId"]}`;
  const now = Date.now();
  const timestamps = (floodCache.get(key) || []).filter((t) => now - t < FLOOD_WINDOW_MS);
  timestamps.push(now);
  floodCache.set(key, timestamps);

  if (timestamps.length > FLOOD_MAX_MSG) {
    try { await client["deleteMessages"](msg["chatId"], [msg["id"]], { "revoke": true }); } catch (e) {}
    return true;
  }
  return false;
}

/**
 * Cek & hapus pesan yang mengandung kata terlarang sesuai daftar filter grup.
 */
async function checkWordFilter(client, db, msg, isOwner) {
  if (isOwner || !msg["isGroup"]) return false;
  const chatId = msg["chatId"].toString();
  const settings = getGroupSettings(db, chatId);
  if (!settings["wordfilter"]["enabled"] || settings["wordfilter"]["words"].length === 0) return false;

  const text = (msg["message"] || "").toLowerCase();
  const hit = settings["wordfilter"]["words"].some((w) => text.includes(w.toLowerCase()));
  if (!hit) return false;

  const isAdmin = await isSenderAdmin(client, msg["chatId"], msg["senderId"]);
  if (isAdmin === true || isAdmin === null) return false;

  try { await client["deleteMessages"](msg["chatId"], [msg["id"]], { "revoke": true }); } catch (e) {}
  return true;
}

module.exports = {
  commands: ["antilink", "antiflood", "filter"],
  ownerOnly: true,
  getGroupSettings,
  checkAntilink,
  checkAntiflood,
  checkWordFilter,
  run: async ({ client, msg, args, db, saveDb, cmdName }) => {
    const targetChat = msg.chatId;
    if (!msg["isGroup"]) {
      return client["sendMessage"](targetChat, {
        "message": `${formatHeader("Kelola Grup")}Fitur ini cuma bisa dipakai di dalam grup.`,
        "parseMode": "html", "replyTo": msg.id
      });
    }
    const chatId = targetChat.toString();
    const settings = getGroupSettings(db, chatId);

    if (cmdName === "antilink") {
      const sub = (args[0] || "").toLowerCase();
      if (sub === "on" || sub === "off") {
        settings["antilink"]["enabled"] = sub === "on";
        saveDb();
        return client["sendMessage"](targetChat, { "message": `${formatHeader("Antilink")}Status: <b>${sub === "on" ? "AKTIF" : "NONAKTIF"}</b>`, "parseMode": "html", "replyTo": msg.id });
      }
      if (sub === "kick" || sub === "nokick") {
        settings["antilink"]["mode"] = sub;
        saveDb();
        return client["sendMessage"](targetChat, { "message": `${formatHeader("Antilink")}Mode diatur ke: <b>${sub}</b>`, "parseMode": "html", "replyTo": msg.id });
      }
      return client["sendMessage"](targetChat, {
        "message": `${formatHeader("Antilink")}• <code>.antilink on/off</code>\n• <code>.antilink kick/nokick</code>\n\nStatus saat ini: <b>${settings["antilink"]["enabled"] ? "AKTIF" : "NONAKTIF"}</b> (mode: ${settings["antilink"]["mode"]})`,
        "parseMode": "html", "replyTo": msg.id
      });
    }

    if (cmdName === "antiflood") {
      const sub = (args[0] || "").toLowerCase();
      if (sub === "on" || sub === "off") {
        settings["antiflood"]["enabled"] = sub === "on";
        saveDb();
        return client["sendMessage"](targetChat, { "message": `${formatHeader("Antiflood")}Status: <b>${sub === "on" ? "AKTIF" : "NONAKTIF"}</b>`, "parseMode": "html", "replyTo": msg.id });
      }
      return client["sendMessage"](targetChat, {
        "message": `${formatHeader("Antiflood")}• <code>.antiflood on/off</code>\n\nStatus saat ini: <b>${settings["antiflood"]["enabled"] ? "AKTIF" : "NONAKTIF"}</b>`,
        "parseMode": "html", "replyTo": msg.id
      });
    }

    if (cmdName === "filter") {
      const sub = (args[0] || "").toLowerCase();
      if (sub === "on" || sub === "off") {
        settings["wordfilter"]["enabled"] = sub === "on";
        saveDb();
        return client["sendMessage"](targetChat, { "message": `${formatHeader("Filter Kata")}Status: <b>${sub === "on" ? "AKTIF" : "NONAKTIF"}</b>`, "parseMode": "html", "replyTo": msg.id });
      }
      if (sub === "add" && args[1]) {
        const word = args.slice(1).join(" ").toLowerCase();
        if (!settings["wordfilter"]["words"].includes(word)) settings["wordfilter"]["words"].push(word);
        saveDb();
        return client["sendMessage"](targetChat, { "message": `${formatHeader("Filter Kata")}Ditambahkan: <code>${word}</code>`, "parseMode": "html", "replyTo": msg.id });
      }
      if (sub === "del" && args[1]) {
        const word = args.slice(1).join(" ").toLowerCase();
        settings["wordfilter"]["words"] = settings["wordfilter"]["words"].filter((w) => w !== word);
        saveDb();
        return client["sendMessage"](targetChat, { "message": `${formatHeader("Filter Kata")}Dihapus: <code>${word}</code>`, "parseMode": "html", "replyTo": msg.id });
      }
      if (sub === "list") {
        const list = settings["wordfilter"]["words"];
        return client["sendMessage"](targetChat, { "message": `${formatHeader("Filter Kata")}${list.length ? list.map((w, i) => `${i + 1}. ${w}`).join("\n") : "Daftar masih kosong."}`, "parseMode": "html", "replyTo": msg.id });
      }
      return client["sendMessage"](targetChat, {
        "message": `${formatHeader("Filter Kata")}• <code>.filter on/off</code>\n• <code>.filter add <kata></code>\n• <code>.filter del <kata></code>\n• <code>.filter list</code>`,
        "parseMode": "html", "replyTo": msg.id
      });
    }
  }
};
