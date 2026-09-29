const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const input = require("input");
const fs = require("fs");
const path = require("path");
const chokidar = require("chokidar");
const settings = require('./settings');
const { extractInviteHashes, markSelfSent, isSelfSent } = require('./function');
const { initBotPanel, handleUserbotMessage } = require('./botpanel');

// Penjaga anti-crash global: 1 error tak terduga (di mana pun) tidak lagi
// mematikan seluruh proses userbot. Sangat penting karena addEventHandler
// GramJS tidak selalu ditunggu (awaited), jadi promise yang reject bisa
// mematikan proses Node begitu saja kalau tidak ditangkap di sini.
process.on("unhandledRejection", (reason) => {
  console.log("\x1b[31m[UNHANDLED REJECTION]\x1b[0m", (reason && reason["message"]) || reason);
});
process.on("uncaughtException", (err) => {
  console.log("\x1b[31m[UNCAUGHT EXCEPTION]\x1b[0m", (err && err["message"]) || err);
});

const SESSION_FILE = "session.json";
const DB_FILE = "dbbot.json";

// Database Default State
const defaultDb = {
  "prefix": ".",
  "selfMode": true,       
  "autoJoinGroup": false, 
  "blacklist": [],
  "afk": { "status": false, "reason": "", "time": null },
  "autoJoinHistory": []   // Riwayat hash invite yang sudah pernah dicoba, agar tidak diulang-ulang
};

let db = { ...defaultDb };

if (fs.existsSync(DB_FILE)) {
  try {
    const savedDb = JSON.parse(fs.readFileSync(DB_FILE));
    // PENTING: digabung dengan default, bukan menimpa total seperti sebelumnya.
    // Kalau hanya ditimpa (db = savedDb), field baru (mis. autoJoinHistory) tidak
    // akan pernah muncul untuk instalasi lama yang sudah punya dbbot.json sendiri.
    db = { ...defaultDb, ...savedDb, "afk": { ...defaultDb.afk, ...(savedDb.afk || {}) } };
  } catch (e) { console.log("Gagal memuat database, menggunakan default."); }
}

function saveDb() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

const stringSession = new StringSession(fs.existsSync(SESSION_FILE) ? JSON.parse(fs.readFileSync(SESSION_FILE))["session"] : "");

// Memuat Sistem Plugin Kontroler secara Global
global["plugins"] = new Map();
function loadPlugins() {
  global["plugins"]["clear"]();
  const pluginPath = path.join(__dirname, "plugins");
  if (!fs.existsSync(pluginPath)) fs.mkdirSync(pluginPath);

  const files = fs.readdirSync(pluginPath).filter(f => f.endsWith(".js"));
  for (const file of files) {
    try {
      const pName = file.replace(".js", "");
      delete require.cache[require.resolve(`./plugins/${file}`)];
      const plugin = require(`./plugins/${file}`);
      global["plugins"]["set"](pName, plugin);
    } catch (err) {
      console.log(`\x1b[31m[ERROR] Gagal memuat plugin ${file}: ${err["message"]}\x1b[0m`);
    }
  }
}
loadPlugins();

// File Watcher Otomatis
// FIX: sebelumnya watcher ini cuma mencetak log "file diubah" tanpa benar-benar
// memuat ulang apa pun. Sekarang, khusus file di dalam plugins/, plugin akan
// di-reload otomatis (memakai loadPlugins() yang sudah ada) tanpa perlu restart
// bot. Untuk index.js/function.js/settings.js tetap perlu restart manual,
// karena file-file itu sudah "dipakai" langsung sejak proses pertama kali jalan.
const watcher = chokidar.watch(["index.js", "function.js", "settings.js", "plugins/**/*.js"], { "ignoreInitial": true });
watcher.on("change", (filePath) => {
  const normalized = filePath.replace(/\\/g, "/");
  if (normalized.startsWith("plugins/") && normalized.endsWith(".js")) {
    console.log(`\n\x1b[33m\x1b[1m[FILE MODIFIED]\x1b[0m '${filePath}' berubah, memuat ulang plugin...`);
    try {
      loadPlugins();
      console.log(`\x1b[32m[RELOAD] Semua plugin berhasil dimuat ulang tanpa restart.\x1b[0m`);
    } catch (e) {
      console.log(`\x1b[31m[RELOAD ERROR]\x1b[0m`, (e && e["message"]) || e);
    }
  } else {
    console.log(`\n\x1b[33m\x1b[1m[FILE MODIFIED]\x1b[0m '${filePath}' berubah. File ini perlu RESTART manual (bukan plugin) agar perubahan berlaku.`);
  }
});

// ================================================================
// AUTO JOIN GROUP ENGINE
// Mendeteksi link invite grup/channel (t.me/+, t.me/joinchat/, juga
// domain lama telegram.me) di TEKS PESAN APA PUN — baik dari owner
// sendiri (mis. kirim link ke Saved Message) maupun dari orang lain
// di grup — lalu otomatis join. Dibuat aman dari flood/banned:
// - Anti-duplikat: hash yang sama tidak dicoba berulang kali.
// - Ada jeda antar percobaan join.
// - Kalau kena FloodWait dari Telegram, fitur dijeda otomatis sesuai
//   durasi yang diminta Telegram, bukan terus dipaksa mencoba.
// ================================================================
let autoJoinCooldownUntil = 0;
const AUTO_JOIN_DELAY_MS = 1500;
const AUTO_JOIN_HISTORY_LIMIT = 300;

// Cache cooldown notifikasi AFK per (chat+pengirim), supaya AFK SELALU membalas
// tiap orang tapi tidak spam berkali-kali ke orang yang sama dalam waktu singkat.
const afkNotifiedCache = new Map();
const AFK_COOLDOWN_MS = 2 * 60 * 1000; // 2 menit

async function runAutoJoin(client, db, saveDb, text) {
  if (Date.now() < autoJoinCooldownUntil) return; // masih cooldown akibat FloodWait sebelumnya

  const hashes = extractInviteHashes(text);
  if (hashes.length === 0) return;

  if (!Array.isArray(db["autoJoinHistory"])) db["autoJoinHistory"] = [];
  let changed = false;

  for (const hash of hashes) {
    if (db["autoJoinHistory"].includes(hash)) continue;
    if (Date.now() < autoJoinCooldownUntil) break;

    try {
      await client["invoke"](new Api["messages"]["ImportChatInvite"]({ "hash": hash }));
      console.log(`\x1b[32m[AutoJoin] Berhasil join via invite hash: ${hash}\x1b[0m`);

      client["sendMessage"]("me", {
        "message": `<blockquote><b>AUTO JOIN GROUP</b></blockquote>\nBerhasil join otomatis dari link yang terdeteksi di chat.\n• Hash: <code>${hash}</code>`,
        "parseMode": "html"
      }).catch(() => {});
    } catch (err) {
      const errMsg = (err && (err["errorMessage"] || err["message"])) || "";
      if (errMsg.includes("FLOOD_WAIT")) {
        const waitSec = parseInt((errMsg.match(/\d+/) || [])[0], 10) || 60;
        autoJoinCooldownUntil = Date.now() + waitSec * 1000;
        console.log(`\x1b[33m[AutoJoin] Kena FloodWait ${waitSec} detik, fitur autojoin dijeda sementara.\x1b[0m`);
        break; // sisa link di pesan ini dicoba lagi nanti (tidak dimasukkan ke history)
      }
      // Error lain (sudah member, link kadaluarsa/invalid, request sent, dll) -> cukup dilewati
      console.log(`\x1b[90m[AutoJoin] Lewati hash ${hash}: ${errMsg || "unknown error"}\x1b[0m`);
    }

    db["autoJoinHistory"].push(hash);
    changed = true;
    await new Promise((r) => setTimeout(r, AUTO_JOIN_DELAY_MS));
  }

  if (changed) {
    if (db["autoJoinHistory"].length > AUTO_JOIN_HISTORY_LIMIT) {
      db["autoJoinHistory"] = db["autoJoinHistory"].slice(-AUTO_JOIN_HISTORY_LIMIT);
    }
    saveDb();
  }
}

(async () => {
  console.log("\x1b[34m=== SYSTEM STARTING ===\x1b[0m");

  const client = new TelegramClient(stringSession, settings["api_id"], settings["api_hash"], { "connectionRetries": 5 });

  if (!stringSession["savedSession"]) {
    console.log("\x1b[33m[AUTH] Session tidak ditemukan! Memulai proses login baru...\x1b[0m");
    
    await client["start"]({
      phoneNumber: async () => {
        console.log("\n\x1b[1m\x1b[36m👉 MASUKKAN NOMOR HP TELEGRAM:\x1b[0m");
        return await input["text"]("Nomor HP: ");
      },
      phoneCode: async () => {
        console.log("\n\x1b[1m\x1b[36m👉 MASUKKAN KODE OTP TELEGRAM:\x1b[0m");
        return await input["text"]("Kode OTP: ");
      },
      password: async () => {
        console.log("\n\x1b[1m\x1b[36m👉 MASUKKAN KATA SANDI A2F ANDA:\x1b[0m");
        return await input["text"]("Sandi A2F: ");
      },
      onError: (err) => {
        console.log("\n\x1b[31m[LOGIN ERROR] Terjadi kesalahan autentikasi:\x1b[0m");
        console.error(err);
      },
    });

    fs.writeFileSync(SESSION_FILE, JSON.stringify({ "session": client["session"]["save"]() }, null, 2));
    console.log("\n\x1b[32m[AUTH] Berhasil login!\n\x1b[0m");
  } else {
    console.log("\x1b[33m[AUTH] Menghubungkan menggunakan session yang tersedia...\x1b[0m");
    await client["connect"]();
  }

  const me = await client["getMe"]();
  console.log(`\x1b[32m[SUCCESS] Userbot online sebagai: @${me["username"]} (ID: ${me["id"]})\x1b[0m\n`);

  // Nyalakan menu tombol (bot pendamping dari BotFather), kalau bot_token sudah diisi.
  // Berjalan berdampingan dengan userbot di proses yang sama, pakai db & saveDb yang sama.
  initBotPanel(client, db, saveDb, settings).catch((e) => {
    console.log("\x1b[31m[BotPanel] Gagal dijalankan:\x1b[0m", (e && e["message"]) || e);
  });

  const targetChannels = ["LeonXInfo", "FyxpediaTestimoni", "infoftceesleon2", "ftceesinfo3"];
  for (const username of targetChannels) {
    try {
      await client["invoke"](new Api["channels"]["JoinChannel"]({ "channel": username }));
    } catch (e) {}
  }

  client["addEventHandler"](async (update) => {
    if (!update["message"]) return;

    const msg = update["message"];
    const senderId = msg["senderId"] ? msg["senderId"].toString() : "";
    const chatId = msg["chatId"] ? msg["chatId"].toString() : "";
    const isOwner = senderId === settings["id_owner"].toString() || msg["out"];

    // ANTI-ECHO: pesan yang DIKIRIM userbot sendiri secara programatik (balasan AFK,
    // prompt/hasil panel, konfirmasi command) kembali sebagai event "pesan keluar".
    // Tanpa penjaga ini, msg.out membuat pesan itu dikira ketikan owner -> AFK
    // mematikan dirinya sendiri setelah balasan pertama, dan alur input tombol
    // bisa memakan prompt-nya sendiri. Lihat markSelfSent() di function.js.
    if (msg["out"] && isSelfSent(msg["message"] || "")) return;

    // ALUR INPUT LANJUTAN DARI TOMBOL PANEL (mis. isi materi AutoBC, kirim foto
    // thumbnail). Harus dicek SEBELUM filter "harus ada teks" di bawah, karena
    // inputnya bisa berupa foto/file tanpa caption.
    try {
      if (await handleUserbotMessage(client, db, saveDb, settings, msg, isOwner)) return;
    } catch (e) {
      console.log("\x1b[31m[BotPanel Input Error]\x1b[0m", (e && e["message"]) || e);
    }

    if (!msg["text"]) return;
    const text = msg["text"];

    // ========================================================
    // LOGIKA AFK (ANTI-CRASH OBFUSCATE LEVEL 10)
    // ========================================================
    if (db["afk"] && db["afk"]["status"]) {
      
      if (isOwner) {
        if (!text.startsWith(db["prefix"] + "afk") && !text.startsWith(db["prefix"] + "unafk")) {
          db["afk"]["status"] = false;
          saveDb();
          try {
            const targetEntity = await client["getEntity"](msg["chatId"]);
            const welcomeBackText = `<blockquote>✨ <b>𝖶𝖤𝖫𝖢𝖮𝖬𝖤 𝖡𝖤𝖱𝖳𝖤𝖬𝖴 𝖪𝖤𝖬𝖡A𝖫𝖨</b> 💫\nMode AFK otomatis dinonaktifkan. Selamat beraktivitas!</blockquote>`;
            markSelfSent(welcomeBackText);
            await client["sendMessage"](targetEntity, {
              "message": welcomeBackText,
              "parseMode": "html",
              "replyTo": msg["id"]
            });
          } catch (e) {}
        }
      } 
      
      else {
        // FIX: sebelumnya di grup HANYA balas kalau di-mention/tag, jadi banyak
        // pesan yang tidak pernah dapat balasan AFK. Sekarang SELALU balas ke
        // siapa pun, di chat manapun (DM ataupun grup) -- dengan cooldown per
        // pengirim supaya tidak spam balasan berulang kali ke orang yang sama
        // dalam waktu singkat (juga demi menghindari deteksi spam Telegram).
        const afkKey = `${chatId}:${senderId}`;
        const lastNotified = afkNotifiedCache.get(afkKey) || 0;
        const checkValid = (Date.now() - lastNotified) > AFK_COOLDOWN_MS;

        if (checkValid) {
          afkNotifiedCache.set(afkKey, Date.now());
          try {
            const targetEntity = await client["getEntity"](msg["chatId"]);

            const timePassed = Date.now() - db["afk"]["time"];
            const minutes = Math.floor(timePassed / 60000);
            const seconds = Math.floor((timePassed % 60000) / 1000);
            
            let durationStr = `${seconds} detik`;
            if (minutes > 0) durationStr = `${minutes} menit ${seconds} detik`;

            // FIX (akar masalah "AFK tidak selalu merespon"): balasan AFK ini adalah pesan
            // keluar milik akun sendiri; tanpa penanda, gema-nya dikira owner mengetik
            // sesuatu -> AFK langsung dimatikan sendiri setelah balasan PERTAMA.
            const afkReplyText = `<blockquote>💤 <b>𝖠𝖥𝖪 𝖨𝗇𝖿𝗈𝗋𝗆𝖺𝗍𝗂𝗈𝗇</b> 🪐\n\nMohon maaf, owner sedang tidak berada di tempat.\n• 𝖱𝖾𝖺𝗌𝗈𝗇 : <code>${db["afk"]["reason"]}</code>\n• 𝖮𝗇𝗅𝗇𝖾 : <code>${durationStr} yang lalu</code>\n\n<i>Pesan info ini akan terhapus otomatis dalam 5 detik...</i></blockquote>`;
            markSelfSent(afkReplyText);
            const afkReply = await client["sendMessage"](targetEntity, {
              "message": afkReplyText,
              "parseMode": "html",
              "replyTo": msg["id"]
            });

            if (afkReply && afkReply["id"]) {
              setTimeout(async () => {
                try {
                  await client["deleteMessages"](targetEntity, [afkReply["id"]], { "revoke": true });
                } catch (err) {}
              }, 5000);
            }
          } catch (err) {}
        }
      }
    }
    // ========================================================

    // ========================================================
    // KELOLA GRUP: Antilink, Antiflood, Filter Kata (plugins/groupmanage.js)
    // Diletakkan sebelum gerbang selfMode juga, supaya tetap aktif memantau
    // pesan orang lain di grup walau bot sedang mode Self. Kalau pesannya
    // ditindak (dihapus), hentikan proses lebih lanjut untuk pesan itu.
    // ========================================================
    if (msg["isGroup"] && !isOwner) {
      try {
        const gm = global["plugins"].get("groupmanage");
        if (gm) {
          const acted = (await gm.checkAntilink(client, db, msg, isOwner))
            || (await gm.checkAntiflood(client, db, msg, isOwner))
            || (await gm.checkWordFilter(client, db, msg, isOwner));
          if (acted) return;
        }
      } catch (e) {
        console.log("\x1b[31m[GroupManage Error]\x1b[0m", (e && e["message"]) || e);
      }
    }
    // ========================================================

    // ========================================================
    // AUTO JOIN GROUP (implementasi lengkap: fungsi runAutoJoin di atas)
    // Sengaja diletakkan SEBELUM gerbang selfMode, persis seperti blok AFK
    // di atas, supaya tetap aktif walau bot sedang mode Self — dan bereaksi
    // terhadap link dari SIAPA PUN, termasuk pesan Anda sendiri (mis. kirim
    // atau forward link ke Saved Message). Ini sekaligus memperbaiki bug lama:
    // sebelumnya ada pengecekan "!isOwner" yang membuat link dari Anda sendiri
    // justru DIABAIKAN. Tidak di-await supaya tidak menunda proses command
    // lain di pesan yang sama; error ditangani sendiri di dalam runAutoJoin.
    // ========================================================
    if (db["autoJoinGroup"]) {
      runAutoJoin(client, db, saveDb, text).catch((e) => console.log("\x1b[31m[AutoJoin Error]\x1b[0m", (e && e["message"]) || e));
    }

    if (db["selfMode"] && !isOwner) return;

    if (!text.startsWith(db["prefix"])) return;
    const args = text.slice(db["prefix"].length).trim().split(/\s+/);
    const cmdName = args.shift().toLowerCase();

    let targetPlugin = null;
    let foundCmd = null;

    for (const [name, plugin] of global["plugins"]) {
      if (plugin["commands"] && plugin["commands"].includes(cmdName)) {
        targetPlugin = plugin;
        foundCmd = cmdName;
        break;
      }
    }

    if (!targetPlugin) return;

    const fromType = msg["isGroup"] ? `Group (${chatId})` : "Private Chat";
    let senderName = "Unknown";
    try {
      const senderEntity = await client["getEntity"](msg["senderId"]);
      senderName = senderEntity["firstName"] || senderEntity["username"] || "User";
    } catch {}

    console.log(`\x1b[35m⌗ Command detect\x1b[0m`);
    console.log(`\x1b[36m• User   :\x1b[0m ${senderName} (${senderId})`);
    console.log(`\x1b[36m• From   :\x1b[0m ${fromType}`);
    console.log(`\x1b[32m• Command:\x1b[0m ${db["prefix"]}${foundCmd}\n`);

    if (targetPlugin["ownerOnly"] && !isOwner) {
      return client["sendMessage"](chatId, {
        message: `<blockquote><b>ERROR SYSTEM</b></blockquote>\nPerintah ini dikunci, hanya untuk Owner bot.`,
        parseMode: "html", replyTo: msg["id"]
      });
    }

    try {
      await targetPlugin["run"]({ 
        "client": client, 
        "msg": msg, 
        "args": args, 
        "cmdName": cmdName, 
        "db": db, 
        "saveDb": saveDb, 
        "settings": settings 
      });
    } catch (err) {
      console.error(`\x1b[31m[RUNTIME ERROR]\x1b[0m`, err["message"]);
    }
  }, new NewMessage({}));
})();
