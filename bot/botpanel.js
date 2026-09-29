// ============================================================
// BOT PANEL — Menu Interaktif Berbasis Inline Button (Telegraf + Userbot)
// ============================================================
// PRINSIP DESAIN (revisi): bot Telegraf di sini HANYA dipakai untuk
// kebutuhan teknis tombol (inline_query utk render menu "via @bot", dan
// callback_query utk menerima klik tombol) -- SEMUA isi/hasil/prompt
// dikirim oleh USERBOT itu sendiri (GramJS), ke chat tempat menu terakhir
// dipakai (global.lastMenuChat). Tidak ada lagi redirect ke "chat pribadi
// dengan bot" -- pengalamannya 100% terasa seperti userbot yang biasa,
// cuma tombolnya "dipinjam" dari bot pendamping karena itu satu-satunya
// cara MTProto mengizinkan tombol inline benar-benar berfungsi.
//
// Alur input teks/file (mis. isi materi AutoBC) sekarang ditangani oleh
// handleUserbotMessage(), yang DIPANGGIL dari index.js (bukan dari bot).
// ============================================================

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const archiver = require("archiver");
const { Telegraf } = require("telegraf");
const { Api } = require("telegram");
const JavaScriptObfuscator = require("javascript-obfuscator");
const { UploadPixhost, formatHeader, markSelfSent, isSelfSent } = require("./function");
const { leaveMutedGroups, getStatus } = require("./plugins/userbotmanage");
const { getGroupSettings } = require("./plugins/groupmanage");

// ---------------- State percakapan (menunggu input teks/file dari owner) ----------------
const pendingInput = new Map();
const PENDING_TTL_MS = 5 * 60 * 1000; // alur input kedaluwarsa otomatis kalau tidak dilanjutkan 5 menit
function setPending(ownerId, type, chatId, data) { pendingInput.set(ownerId, { type, chatId, data: data || {}, createdAt: Date.now() }); }
function clearPending(ownerId) { pendingInput.delete(ownerId); }

// ---------------- Helper kecil ----------------
function parseIntervalText(text) {
  const t = (text || "").toLowerCase().trim();
  const num = parseInt(t);
  if (isNaN(num) || num <= 0) return null;
  if (t.includes("detik")) return num * 1000;
  if (t.includes("menit")) return num * 60 * 1000;
  if (t.includes("jam")) return num * 60 * 60 * 1000;
  return null;
}

async function uploadPhotoToUrl(buffer) {
  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("fileToUpload", buffer, { filename: "panel_media.jpg" });
  const response = await axios.post("https://catbox.moe/user/api.php", form, { headers: form.getHeaders() });
  return response.data;
}

function statusEmoji(v) { return v ? "AKTIF" : "NONAKTIF"; }

// Tombol Telegraf dgn style WAJIB (primary/success/danger) -- TIDAK PAKAI EMOJI di label.
// style default "primary" kalau tidak disebutkan, supaya tidak ada tombol yg polos tanpa style.
function btn(text, data, style) {
  return { text, callback_data: data, style: style || "primary" };
}

function extractIncoming(msg) {
  // msg = objek Message asli dari GramJS (userbot)
  const text = (msg["message"] || "").trim();
  const hasPhoto = !!(msg["media"] && msg["media"]["photo"]);
  const hasDocument = !!(msg["media"] && msg["media"]["document"]);
  return { text, hasPhoto, hasDocument, media: msg["media"] };
}

async function sendPanel(bot, chatId, text, buttons) {
  return bot.telegram.sendMessage(chatId, text, { parse_mode: "HTML", reply_markup: buttons ? { inline_keyboard: buttons } : undefined });
}
async function editPanel(bot, chatId, messageId, text, buttons) {
  return bot.telegram.editMessageText(chatId, messageId, undefined, text, { parse_mode: "HTML", reply_markup: buttons ? { inline_keyboard: buttons } : undefined })
    .catch(async () => sendPanel(bot, chatId, text, buttons));
}

// Semua prompt/hasil/konfirmasi SEKARANG dikirim oleh USERBOT (bukan bot Telegraf).
async function sendFromUserbot(userbotClient, chatId, text) {
  markSelfSent(text); // cegah gema pesan ini dianggap ketikan owner (lihat markSelfSent di function.js)
  return userbotClient["sendMessage"](chatId, { "message": text, "parseMode": "html" });
}
// sendFile dgn caption: tandai captionnya juga sebelum dikirim
async function sendFileFromUserbot(userbotClient, chatId, opts) {
  if (opts && opts.caption) markSelfSent(opts.caption);
  return userbotClient["sendFile"](chatId, opts);
}
async function sendPromptFromUserbot(userbotClient, chatId, text) {
  return sendFromUserbot(userbotClient, chatId, `${formatHeader("Input Diperlukan")}${text}\n\n<i>Ketik "batal" untuk membatalkan.</i>`);
}

// ---------------- Menu builders (murni, gampang dites) ----------------
function buildMainMenu(db) {
  const text =
    `<blockquote><b>UBOT CONTROL PANEL</b></blockquote>\n` +
    `Pilih kategori di bawah ini.\n\n` +
    `• Mode: <code>${db["selfMode"] ? "Self" : "Public"}</code>\n` +
    `• AutoJoin: <code>${db["autoJoinGroup"] ? "ON" : "OFF"}</code>\n` +
    `• AutoBC: <code>${db["autoBc"] ? "ON" : "OFF"}</code>\n` +
    `• AutoCFD: <code>${db["autoCfd"] ? "ON" : "OFF"}</code>\n` +
    `• Prefix: <code>${db["prefix"]}</code>`;

  const buttons = [
    [btn("Mode & Auto", "mc:mode")],
    [btn("Broadcast", "mc:bc"), btn("Blacklist", "mc:bl")],
    [btn("Grup Tools", "mc:tools"), btn("Kelola Grup", "mc:grp")],
    [btn("Kelola Userbot", "mc:ubot"), btn("Payment", "mc:pay")],
    [btn("File Tools", "mc:files"), btn("Sistem", "mc:sys")]
  ];
  return { text, buttons };
}

function buildBlacklistListView(db) {
  const list = Array.isArray(db["blacklist"]) ? db["blacklist"] : [];
  if (list.length === 0) {
    return { text: `<blockquote><b>Blacklist</b></blockquote>\nDaftar masih kosong.`, buttons: [[btn("Kembali", "mc:bl")]] };
  }
  const rows = list.map((id) => [btn(id, `bl:rm:${id}`, "danger")]);
  rows.push([btn("Kembali", "mc:bl")]);
  return { text: `<blockquote><b>Blacklist</b></blockquote>\nTap salah satu untuk menghapusnya:`, buttons: rows };
}

function buildCategoryMenu(cat, db) {
  const back = [btn("Kembali ke Menu Utama", "mm")];

  if (cat === "mode") {
    return {
      text: `<blockquote><b>Mode & Auto</b></blockquote>\nTap untuk mengubah status. AutoBC/AutoCFD/AutoJoin sekarang boleh aktif bersamaan.`,
      buttons: [
        [btn(`Mode: ${db["selfMode"] ? "Self" : "Public"}`, "tg:mode", "primary")],
        [btn(`AutoJoin: ${statusEmoji(db["autoJoinGroup"])}`, "tg:aj", db["autoJoinGroup"] ? "danger" : "success")],
        [btn(`AutoBC: ${statusEmoji(db["autoBc"])}`, "tg:abc", db["autoBc"] ? "danger" : "success")],
        [btn(`AutoCFD: ${statusEmoji(db["autoCfd"])}`, "tg:acfd", db["autoCfd"] ? "danger" : "success")],
        back
      ]
    };
  }
  if (cat === "bc") {
    return {
      text: `<blockquote><b>Broadcast</b></blockquote>\nAtur materi berkala, atau kirim sekali ke semua grup/channel.`,
      buttons: [
        [btn("Atur Materi AutoBC", "in:bcsetup")],
        [btn("Atur Target & Materi CFD", "gp:cfd:0")],
        [btn("Broadcast Sekali (Semua Grup)", "in:bconce", "danger")],
        back
      ]
    };
  }
  if (cat === "bl") {
    return {
      text: `<blockquote><b>Blacklist</b></blockquote>\nGrup di daftar ini dilewati saat AutoBC / AutoCFD / Broadcast Sekali.`,
      buttons: [[btn("Lihat Daftar", "ac:bllist")], [btn("Tambah dari Grup", "gp:bladd:0", "success")], back]
    };
  }
  if (cat === "tools") {
    return {
      text: `<blockquote><b>Grup Tools</b></blockquote>`,
      buttons: [[btn("Hidetag", "gp:ht:0")], [btn("Cek ID", "in:cekid")], back]
    };
  }
  if (cat === "grp") {
    return {
      text: `<blockquote><b>Kelola Grup</b></blockquote>\nPilih grup untuk mengatur Antilink, Antiflood, dan Filter Kata.`,
      buttons: [[btn("Pilih Grup", "gp:grpmanage:0")], back]
    };
  }
  if (cat === "ubot") {
    return {
      text: `<blockquote><b>Kelola Userbot</b></blockquote>`,
      buttons: [
        [btn("Keluar dari Grup yang Mute", "ac:leavemuted", "danger")],
        [btn("Status & Ping", "ac:status")],
        back
      ]
    };
  }
  if (cat === "pay") {
    return {
      text: `<blockquote><b>Payment</b></blockquote>`,
      buttons: [[btn("Info Pembayaran", "ac:pay")], [btn("Buat QRIS", "in:qris")], back]
    };
  }
  if (cat === "files") {
    return {
      text: `<blockquote><b>File Tools</b></blockquote>`,
      buttons: [
        [btn("Ganti Thumbnail Menu", "in:thumb")],
        [btn("Media ke URL", "in:tourl")],
        [btn("Obfuscate JS", "mc:obflvl")],
        back
      ]
    };
  }
  if (cat === "obflvl") {
    const row1 = [1, 2, 3, 4, 5].map((n) => btn(`${n}`, `lvl:${n}`));
    const row2 = [6, 7, 8, 9, 10].map((n) => btn(`${n}`, `lvl:${n}`));
    return { text: `<blockquote><b>Obfuscate JS</b></blockquote>\nPilih level (1 = ringan, 10 = paling berat).`, buttons: [row1, row2, [btn("Kembali", "mc:files")]] };
  }
  if (cat === "sys") {
    return {
      text: `<blockquote><b>Sistem</b></blockquote>\nPrefix saat ini: <code>${db["prefix"]}</code>`,
      buttons: [
        [btn("Ganti Prefix", "in:setprefix")],
        [btn("Aktifkan AFK", "in:afkon", "success"), btn("Nonaktifkan AFK", "ac:afkoff", "danger")],
        [btn("Backup Script", "ac:backup")],
        back
      ]
    };
  }
  return buildMainMenu(db);
}

function buildGroupManageDetail(db, groupId, groupTitle) {
  const s = getGroupSettings(db, groupId);
  return {
    text: `<blockquote><b>Kelola Grup</b></blockquote>\n${groupTitle ? `Grup: <b>${groupTitle}</b>\n` : ""}\n` +
      `• Antilink: <code>${s.antilink.enabled ? "ON" : "OFF"}</code> (mode: <code>${s.antilink.mode}</code>)\n` +
      `• Antiflood: <code>${s.antiflood.enabled ? "ON" : "OFF"}</code>\n` +
      `• Filter Kata: <code>${s.wordfilter.enabled ? "ON" : "OFF"}</code> (${s.wordfilter.words.length} kata)`,
    buttons: [
      [btn(`Antilink: ${s.antilink.enabled ? "ON" : "OFF"}`, `ga:link:${groupId}`, s.antilink.enabled ? "danger" : "success")],
      [btn(`Mode Antilink: ${s.antilink.mode}`, `ga:lmode:${groupId}`, "primary")],
      [btn(`Antiflood: ${s.antiflood.enabled ? "ON" : "OFF"}`, `ga:flood:${groupId}`, s.antiflood.enabled ? "danger" : "success")],
      [btn(`Filter Kata: ${s.wordfilter.enabled ? "ON" : "OFF"}`, `ga:filt:${groupId}`, s.wordfilter.enabled ? "danger" : "success")],
      [btn("Kembali", "mc:grp")]
    ]
  };
}

async function renderGroupPicker(userbotClient, purpose, page) {
  const dialogs = await userbotClient["getDialogs"]({});
  const groups = dialogs.filter((d) => d.isGroup || d.isChannel);
  const perPage = 8;
  const totalPages = Math.max(1, Math.ceil(groups.length / perPage));
  const p = Math.min(Math.max(0, page), totalPages - 1);
  const pageItems = groups.slice(p * perPage, p * perPage + perPage);
  const purposeLabel = { bladd: "di-blacklist", ht: "target Hidetag", cfd: "target CFD", grpmanage: "diatur" }[purpose] || purpose;

  const rows = pageItems.map((g) => [btn((g.title || g.name || "Tanpa Judul").toString().slice(0, 40), `gs:${purpose}:${g.id.toString()}`)]);

  const navRow = [];
  if (p > 0) navRow.push(btn("Sebelumnya", `gp:${purpose}:${p - 1}`));
  navRow.push(btn(`${p + 1}/${totalPages}`, "nop"));
  if (p < totalPages - 1) navRow.push(btn("Berikutnya", `gp:${purpose}:${p + 1}`));
  rows.push(navRow);
  rows.push([btn("Batal", "cn", "danger")]);

  const text = groups.length === 0
    ? `<blockquote><b>Pilih Grup</b></blockquote>\nUserbot belum join grup/channel manapun.`
    : `<blockquote><b>Pilih Grup</b></blockquote>\nPilih grup untuk dijadikan ${purposeLabel}:`;
  return { text, buttons: rows };
}

// ---------------- Aksi instan ----------------
async function handleBackup(ctx) {
  const { userbotClient, replyChatId } = ctx;
  const statusMsg = await sendFromUserbot(userbotClient, replyChatId, `${formatHeader("Backup")}Sedang membuat backup...`);
  const zipPath = path.join(__dirname, "panel_backup.zip");
  try {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(output);
    const filesToBackup = ["index.js", "package.json", "settings.js", "function.js", "botpanel.js"];
    for (const f of filesToBackup) {
      const fp = path.join(__dirname, f);
      if (fs.existsSync(fp)) archive.file(fp, { name: f });
    }
    const pluginsDir = path.join(__dirname, "plugins");
    if (fs.existsSync(pluginsDir)) archive.directory(pluginsDir, "plugins");
    await new Promise((resolve, reject) => { output.on("close", resolve); archive.on("error", reject); archive.finalize(); });

    await sendFileFromUserbot(userbotClient, replyChatId, {
      "file": zipPath,
      "caption": `${formatHeader("Backup Success")}Berisi API key/token dari settings.js, jangan disebar ke siapa pun.`,
      "parseMode": "html"
    });
    await userbotClient["deleteMessages"](replyChatId, [statusMsg.id], { "revoke": true }).catch(() => {});
  } catch (e) {
    await userbotClient["editMessage"](replyChatId, { "message": statusMsg.id, "text": `Gagal backup: ${e.message}` }).catch(() => {});
  } finally {
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  }
}

async function handlePay(ctx) {
  const { userbotClient, settings, replyChatId } = ctx;
  const payment = settings["payment"] || { dana: "-", gopay: "-", ovo: "-" };
  const captionText = `${formatHeader("Metode Pembayaran")}• DANA: <code>${payment.dana}</code>\n• GOPAY: <code>${payment.gopay}</code>\n• OVO: <code>${payment.ovo}</code>`;
  try {
    if (settings["qrisImage"] && settings["qrisImage"].startsWith("http")) {
      await sendFileFromUserbot(userbotClient, replyChatId, { "file": settings["qrisImage"], "caption": captionText, "parseMode": "html" });
    } else {
      await sendFromUserbot(userbotClient, replyChatId, captionText);
    }
  } catch (e) {
    await sendFromUserbot(userbotClient, replyChatId, captionText + `\n\nGagal memuat gambar QRIS.`);
  }
}

async function handleLeaveMuted(ctx) {
  const { userbotClient, replyChatId } = ctx;
  const statusMsg = await sendFromUserbot(userbotClient, replyChatId, `${formatHeader("Leave Muted Groups")}Sedang memeriksa semua grup/channel...`);
  try {
    const result = await leaveMutedGroups(userbotClient);
    await userbotClient["editMessage"](replyChatId, {
      "message": statusMsg.id,
      "text": `${formatHeader("Leave Muted Groups Selesai")}• Diperiksa: <b>${result.checked}</b>\n• Keluar dari: <b>${result.left}</b> grup${result.leftNames.length ? "\n\n" + result.leftNames.map((n, i) => `${i + 1}. ${n}`).join("\n") : ""}`,
      "parseMode": "html"
    });
  } catch (e) {
    await userbotClient["editMessage"](replyChatId, { "message": statusMsg.id, "text": `Gagal: ${e.message}` }).catch(() => {});
  }
}

async function handleStatus(ctx) {
  const { userbotClient, replyChatId } = ctx;
  const st = await getStatus(userbotClient);
  await sendFromUserbot(userbotClient, replyChatId, `${formatHeader("Status Userbot")}• Ping: <code>${st.pingMs}ms</code>\n• Uptime: <code>${st.uptimeStr}</code>\n• Memori: <code>${st.memMB} MB</code>\n• Grup: <code>${st.groups}</code>\n• Channel: <code>${st.channels}</code>`);
}

async function handleInstantAction(name, ctx) {
  const { db, saveDb, updatePanel } = ctx;
  if (name === "pay") return handlePay(ctx);
  if (name === "backup") return handleBackup(ctx);
  if (name === "leavemuted") return handleLeaveMuted(ctx);
  if (name === "status") return handleStatus(ctx);
  if (name === "afkoff") {
    db["afk"] = db["afk"] || {};
    db["afk"]["status"] = false;
    saveDb();
    const v = buildCategoryMenu("sys", db);
    return updatePanel(`AFK dinonaktifkan.\n\n${v.text}`, v.buttons);
  }
  if (name === "bllist") {
    const v = buildBlacklistListView(db);
    return updatePanel(v.text, v.buttons);
  }
}

async function handleToggle(key, ctx) {
  const { db, saveDb, userbotClient, updatePanel } = ctx;

  // FIX: mutual exclusion AutoBC/AutoCFD/AutoJoin DIHAPUS -- sekarang boleh jalan bersamaan.
  if (key === "mode") { db["selfMode"] = !db["selfMode"]; saveDb(); }
  else if (key === "aj") { db["autoJoinGroup"] = !db["autoJoinGroup"]; saveDb(); }
  else if (key === "abc") {
    db["autoBc"] = !db["autoBc"];
    if (db["autoBc"]) {
      if (db["bcInterval"] && (db["bcMsg"] || db["bcMedia"])) {
        const autobc = global["plugins"].get("autobc");
        if (global["autobcIntervalId"]) clearInterval(global["autobcIntervalId"]);
        if (autobc && autobc.runBroadcast) global["autobcIntervalId"] = setInterval(() => { autobc.runBroadcast(userbotClient, db); }, db["bcInterval"]);
      }
    } else if (global["autobcIntervalId"]) { clearInterval(global["autobcIntervalId"]); global["autobcIntervalId"] = null; }
    saveDb();
  } else if (key === "acfd") {
    db["autoCfd"] = !db["autoCfd"];
    if (db["autoCfd"]) {
      if (db["cfdInterval"] && db["cfdTargetChat"]) {
        const autocfd = global["plugins"].get("autocfd");
        if (global["autocfdIntervalId"]) clearInterval(global["autocfdIntervalId"]);
        if (autocfd && autocfd.runCfd) global["autocfdIntervalId"] = setInterval(() => { autocfd.runCfd(userbotClient, db); }, db["cfdInterval"]);
      }
    } else if (global["autocfdIntervalId"]) { clearInterval(global["autocfdIntervalId"]); global["autocfdIntervalId"] = null; }
    saveDb();
  }

  const v = buildCategoryMenu("mode", db);
  return updatePanel(v.text, v.buttons);
}

async function handleGroupManageToggle(action, groupId, ctx) {
  const { db, saveDb, updatePanel } = ctx;
  const s = getGroupSettings(db, groupId);
  if (action === "link") s.antilink.enabled = !s.antilink.enabled;
  else if (action === "lmode") s.antilink.mode = s.antilink.mode === "kick" ? "nokick" : "kick";
  else if (action === "flood") s.antiflood.enabled = !s.antiflood.enabled;
  else if (action === "filt") s.wordfilter.enabled = !s.wordfilter.enabled;
  saveDb();
  const v = buildGroupManageDetail(db, groupId);
  return updatePanel(v.text, v.buttons);
}

async function handleGroupSelected(purpose, groupId, ctx) {
  const { db, saveDb, ownerId, replyChatId, updatePanel } = ctx;
  if (purpose === "bladd") {
    if (!Array.isArray(db["blacklist"])) db["blacklist"] = [];
    if (!db["blacklist"].includes(groupId)) { db["blacklist"].push(groupId); saveDb(); }
    const v = buildCategoryMenu("bl", db);
    return updatePanel(`Grup ${groupId} ditambahkan ke blacklist.\n\n${v.text}`, v.buttons);
  }
  if (purpose === "grpmanage") {
    const v = buildGroupManageDetail(db, groupId);
    return updatePanel(v.text, v.buttons);
  }
  if (purpose === "ht") {
    setPending(ownerId, "htmsg", replyChatId, { targetChat: groupId });
    return sendPromptFromUserbot(ctx.userbotClient, replyChatId, "Kirim teks pesan buat hidetag (atau ketik \"skip\" untuk tanpa teks).");
  }
  if (purpose === "cfd") {
    setPending(ownerId, "cfdsetup", replyChatId, { stage: "content", targetChat: groupId });
    return sendPromptFromUserbot(ctx.userbotClient, replyChatId, "Kirim materi CFD (teks atau foto+caption) untuk grup ini.");
  }
}

async function handleHidetagRun(groupId, hidetagText, ctx) {
  const { userbotClient, replyChatId } = ctx;
  const statusMsg = await sendFromUserbot(userbotClient, replyChatId, `${formatHeader("Hidetag")}Sedang menjalankan hidetag...`);
  try {
    const targetEntity = await userbotClient["getEntity"](groupId);
    const participants = await userbotClient["getParticipants"](targetEntity);
    const tags = [];
    for (const part of participants) {
      if (part.id && !part.bot) tags.push(`<a href="tg://user?id=${part.id}">&#8203;</a>`);
    }
    const TEXT_LIMIT = 4000;
    const chunks = [];
    let current = hidetagText || "";
    let limit = Math.max(TEXT_LIMIT - current.length, 100);
    for (const tag of tags) {
      if (current.length + tag.length > limit) { chunks.push(current); current = ""; limit = TEXT_LIMIT; }
      current += tag;
    }
    chunks.push(current);
    for (let i = 0; i < chunks.length; i++) {
      await userbotClient["sendMessage"](targetEntity, { message: chunks[i], parseMode: "html" });
      if (i < chunks.length - 1) await new Promise((r) => setTimeout(r, 1200));
    }
    await userbotClient["editMessage"](replyChatId, { "message": statusMsg.id, "text": `Hidetag terkirim (${tags.length} anggota, ${chunks.length} pesan).` });
  } catch (e) {
    await userbotClient["editMessage"](replyChatId, { "message": statusMsg.id, "text": `Gagal: ${e.message}` }).catch(() => {});
  }
}

async function handleBroadcastCapture(ctx, incoming, pending, kind) {
  const { userbotClient, db, saveDb, ownerId, replyChatId } = ctx;

  if (pending.data.stage === "content") {
    if (!incoming.text && !incoming.hasPhoto) return sendPromptFromUserbot(userbotClient, replyChatId, "Materi kosong. Kirim teks atau foto.");
    let mediaUrl = null;
    if (incoming.hasPhoto) {
      const buffer = await userbotClient["downloadMedia"](incoming.media);
      if (buffer) mediaUrl = await uploadPhotoToUrl(buffer);
    }
    pending.data.text = incoming.text;
    pending.data.media = mediaUrl;
    pending.data.stage = "interval";
    pendingInput.set(ownerId, pending);
    return sendPromptFromUserbot(userbotClient, replyChatId, "Interval berkala? Contoh: 10menit, 1jam, 30detik");
  }

  if (pending.data.stage === "interval") {
    const ms = parseIntervalText(incoming.text);
    if (!ms) return sendPromptFromUserbot(userbotClient, replyChatId, "Format salah. Contoh: 10menit, 1jam, 30detik");

    if (kind === "bc") {
      db["bcMsg"] = pending.data.text || ""; db["bcMedia"] = pending.data.media || null; db["bcInterval"] = ms;
      saveDb();
      if (db["autoBc"]) {
        const autobc = global["plugins"].get("autobc");
        if (global["autobcIntervalId"]) clearInterval(global["autobcIntervalId"]);
        if (autobc && autobc.runBroadcast) global["autobcIntervalId"] = setInterval(() => { autobc.runBroadcast(userbotClient, db); }, ms);
      }
    } else {
      db["cfdMsg"] = pending.data.text || ""; db["cfdMedia"] = pending.data.media || null; db["cfdInterval"] = ms; db["cfdTargetChat"] = pending.data.targetChat;
      saveDb();
      if (db["autoCfd"]) {
        const autocfd = global["plugins"].get("autocfd");
        if (global["autocfdIntervalId"]) clearInterval(global["autocfdIntervalId"]);
        if (autocfd && autocfd.runCfd) global["autocfdIntervalId"] = setInterval(() => { autocfd.runCfd(userbotClient, db); }, ms);
      }
    }

    clearPending(ownerId);
    return sendFromUserbot(userbotClient, replyChatId, `${kind === "bc" ? "AutoBC" : "AutoCFD"} berhasil diatur & disimpan.`);
  }
}

async function handleOneTimeBroadcast(ctx, incoming) {
  const { userbotClient, db, ownerId, replyChatId } = ctx;
  if (!incoming.text && !incoming.hasPhoto) return sendPromptFromUserbot(userbotClient, replyChatId, "Materi kosong. Kirim teks atau foto.");

  clearPending(ownerId);
  const statusMsg = await sendFromUserbot(userbotClient, replyChatId, "Sedang broadcast ke semua grup/channel, mohon tunggu...");

  let mediaUrl = null;
  if (incoming.hasPhoto) {
    const buffer = await userbotClient["downloadMedia"](incoming.media);
    if (buffer) mediaUrl = await uploadPhotoToUrl(buffer);
  }

  const blacklist = Array.isArray(db["blacklist"]) ? db["blacklist"] : [];
  let success = 0, failed = 0, skipped = 0;
  try {
    const dialogs = await userbotClient["getDialogs"]({});
    const targets = dialogs.filter((d) => d.isGroup || d.isChannel);
    for (const dialog of targets) {
      if (blacklist.includes(dialog.id.toString())) { skipped++; continue; }
      try {
        if (mediaUrl) await userbotClient["sendFile"](dialog.id, { file: mediaUrl, caption: incoming.text || "", parseMode: "html", forceDocument: false });
        else await userbotClient["sendMessage"](dialog.id, { message: incoming.text, parseMode: "html" });
        success++;
      } catch (e) { failed++; }
      await new Promise((r) => setTimeout(r, 2500));
    }
    await userbotClient["editMessage"](replyChatId, { "message": statusMsg.id, "text": `${formatHeader("Broadcast Selesai")}Sukses: ${success} | Gagal: ${failed} | Dilewati: ${skipped}` });
  } catch (err) {
    await userbotClient["editMessage"](replyChatId, { "message": statusMsg.id, "text": `Error: ${err.message}` }).catch(() => {});
  }
}

// ---------------- QRIS, Obfuscate, ToURL, Thumbnail (native, kirim via userbot) ----------------
async function handleQrisAmount(text, ctx) {
  const { userbotClient, db, saveDb, settings, ownerId, replyChatId } = ctx;
  const apiKey = settings["fyxzgatewayApiKey"];
  const baseUrl = settings["fyxzgatewayBaseUrl"];
  if (!apiKey || !baseUrl) { clearPending(ownerId); return sendFromUserbot(userbotClient, replyChatId, "Gateway API tidak dikonfigurasi."); }

  let amountStr = text.toLowerCase().replace(",", ".");
  let amount = 0;
  try {
    if (amountStr.endsWith("k")) {
      const numPart = parseFloat(amountStr.slice(0, -1));
      if (isNaN(numPart) || numPart <= 0) throw new Error("Format salah");
      amount = Math.round(numPart * 1000);
    } else {
      amount = parseInt(amountStr);
      if (isNaN(amount) || amount <= 0) throw new Error("Format salah");
    }
  } catch (e) {
    return sendPromptFromUserbot(userbotClient, replyChatId, "Format nominal tidak dikenali. Contoh: 1200 atau 1.2k. Kirim ulang.");
  }
  if (amount < 500) return sendPromptFromUserbot(userbotClient, replyChatId, "Nominal minimal 500. Kirim ulang.");

  clearPending(ownerId);
  const statusMsg = await sendFromUserbot(userbotClient, replyChatId, "Sedang membuat invoice...");

  try {
    const response = await axios.get(`${baseUrl}/invoice`, { params: { apikey: apiKey, amount }, headers: { Authorization: `Bearer ${apiKey}`, "X-API-Key": apiKey } });
    const data = response.data;
    if (!data.success) throw new Error(data.message || "Gagal membuat invoice");

    if (!db["pendingInvoices"]) db["pendingInvoices"] = {};
    db["pendingInvoices"][data.invoice_id] = { chatId: replyChatId, amount: data.amount, status: "pending", createdAt: Date.now(), expiredAt: data.expired_at };
    saveDb();

    const caption = `${formatHeader("Payment QRIS")}Invoice ID: <code>${data.invoice_id}</code>\nAmount: <code>${data.amount}</code>\nFee: <code>${data.fee}</code>\nTotal: <code>${data.total}</code>\nExpired: <code>${data.expired_at}</code>`;
    await sendFileFromUserbot(userbotClient, replyChatId, { file: data.qris_image, caption, parseMode: "html" });
    await userbotClient["deleteMessages"](replyChatId, [statusMsg.id], { revoke: true }).catch(() => {});

    let checkCount = 0;
    const maxChecks = 20;
    const checkInterval = setInterval(async () => {
      checkCount++;
      try {
        const statusRes = await axios.get(`${baseUrl}/invoice/status`, { params: { apikey: apiKey, invoice_id: data.invoice_id }, headers: { Authorization: `Bearer ${apiKey}`, "X-API-Key": apiKey } });
        const statusData = statusRes.data;
        if (db["pendingInvoices"] && db["pendingInvoices"][data.invoice_id]) { db["pendingInvoices"][data.invoice_id].status = statusData.status; saveDb(); }

        if (statusData.status === "paid") {
          clearInterval(checkInterval);
          await sendFromUserbot(userbotClient, replyChatId, `${formatHeader("Payment Success")}Invoice <code>${statusData.invoice_id}</code> LUNAS (${statusData.total}).`).catch(() => {});
          if (db["pendingInvoices"] && db["pendingInvoices"][data.invoice_id]) { delete db["pendingInvoices"][data.invoice_id]; saveDb(); }
          return;
        }
        if (statusData.status === "expired" || new Date(statusData.expired_at) < new Date()) {
          clearInterval(checkInterval);
          await sendFromUserbot(userbotClient, replyChatId, "Invoice telah kadaluwarsa.").catch(() => {});
          if (db["pendingInvoices"] && db["pendingInvoices"][data.invoice_id]) { delete db["pendingInvoices"][data.invoice_id]; saveDb(); }
          return;
        }
        if (checkCount >= maxChecks) { clearInterval(checkInterval); await sendFromUserbot(userbotClient, replyChatId, `Belum terdeteksi setelah 10 menit. Invoice: <code>${data.invoice_id}</code>`).catch(() => {}); }
      } catch (err) { clearInterval(checkInterval); }
    }, 30000);
  } catch (err) {
    let errorDetail = err.message;
    if (err.response && err.response.data) errorDetail = JSON.stringify(err.response.data);
    await userbotClient["editMessage"](replyChatId, { "message": statusMsg.id, "text": `Gagal membuat invoice: ${errorDetail}` }).catch(() => {});
  }
}

const encodeZero = (text) => text.split("").map((c) => c.charCodeAt(0).toString(2).padStart(8, "0").split("").map((b) => (b === "1" ? "\u200b" : "\u200c")).join("") + "\u200d").join("");

function getObfLevelOptions(level) {
  switch (level) {
    case 1: return { compact: true, simplify: true };
    case 2: return { compact: true, renameGlobals: true };
    case 3: return { compact: true, controlFlowFlattening: true, controlFlowFlatteningThreshold: 0.5 };
    case 4: return { compact: true, controlFlowFlattening: true, deadCodeInjection: true, deadCodeInjectionThreshold: 0.2 };
    case 5: return { compact: true, stringArray: true, stringArrayThreshold: 0.75, selfDefending: true };
    case 6: return { compact: true, controlFlowFlattening: true, stringArrayEncoding: ["base64"], debugProtection: true };
    case 7: return { compact: true, splitStrings: true, splitStringsChunkLength: 3, unicodeEscapeSequence: true };
    case 8: return { compact: true, controlFlowFlattening: true, deadCodeInjection: true, stringArrayEncoding: ["rc4"], transformObjectKeys: true };
    case 9: return { compact: true, controlFlowFlattening: true, selfDefending: true, stringArrayEncoding: ["base64", "rc4"], numbersToExpressions: true };
    case 10: return { compact: true, simplify: true, unicodeEscapeSequence: true, identifierNamesGenerator: "hexadecimal" };
    default: return { compact: true, controlFlowFlattening: false };
  }
}

async function handleObfuscateInput(incoming, level, ctx) {
  const { userbotClient, ownerId, replyChatId } = ctx;
  clearPending(ownerId);

  let kodeAsli = "";
  if (incoming.text) kodeAsli = incoming.text;
  else if (incoming.hasDocument) { const buffer = await userbotClient["downloadMedia"](incoming.media); kodeAsli = buffer.toString("utf-8"); }

  if (!kodeAsli || kodeAsli.trim() === "") { await sendFromUserbot(userbotClient, replyChatId, "Kode tidak ditemukan atau pesan kosong."); return; }

  const statusMsg = await sendFromUserbot(userbotClient, replyChatId, `Sedang memproses enkripsi level ${level}, mohon tunggu...`);
  try {
    const opt = getObfLevelOptions(level);
    let hasilEnc = JavaScriptObfuscator.obfuscate(kodeAsli, opt).getObfuscatedCode();
    if (level === 10) {
      const encoded = encodeZero(hasilEnc);
      hasilEnc = `eval((function(w){return w.split('\\u200d').filter(x=>x).map(x=>String.fromCharCode(parseInt(x.replace(/\\u200b/g,'1').replace(/\\u200c/g,'0'),2))).join('')})('${encoded}'))`;
    }
    await sendFileFromUserbot(userbotClient, replyChatId, {
      file: Buffer.from(hasilEnc, "utf-8"),
      caption: `${formatHeader("Obfuscate Success")}Obfuscate level ${level} sukses dijalankan.`,
      parseMode: "html",
      attributes: [new Api["DocumentAttributeFilename"]({ fileName: `level_${level}_encrypted.js` })]
    });
    await userbotClient["deleteMessages"](replyChatId, [statusMsg.id], { revoke: true }).catch(() => {});
  } catch (e) {
    await userbotClient["editMessage"](replyChatId, { "message": statusMsg.id, "text": "Pastikan kode JavaScript Anda valid." }).catch(() => {});
  }
}

async function handleTourlInput(incoming, ctx) {
  const { userbotClient, ownerId, replyChatId } = ctx;
  if (!incoming.hasPhoto && !incoming.hasDocument) return sendPromptFromUserbot(userbotClient, replyChatId, "Tidak ada media. Kirim ulang berupa file/foto.");

  clearPending(ownerId);
  const statusMsg = await sendFromUserbot(userbotClient, replyChatId, "Sedang mengunduh dan memproses media ke server cloud...");
  try {
    const buffer = await userbotClient["downloadMedia"](incoming.media);
    const urlResult = await UploadPixhost(buffer);
    if (!urlResult) throw new Error("Gagal mengupload file media.");
    await userbotClient["editMessage"](replyChatId, { "message": statusMsg.id, "text": `${formatHeader("Upload Berhasil")}URL: <code>${urlResult}</code>` });
  } catch (err) {
    await userbotClient["editMessage"](replyChatId, { "message": statusMsg.id, "text": `Gagal: ${err.message}` }).catch(() => {});
  }
}

async function handleThumbInput(incoming, ctx) {
  const { userbotClient, settings, ownerId, replyChatId } = ctx;
  if (!incoming.hasPhoto) return sendPromptFromUserbot(userbotClient, replyChatId, "Itu bukan foto. Kirim ulang berupa FOTO.");

  clearPending(ownerId);
  const statusMsg = await sendFromUserbot(userbotClient, replyChatId, "Sedang mengunduh foto dan mengunggah ke server cloud...");
  try {
    const buffer = await userbotClient["downloadMedia"](incoming.media);
    const uploadedUrl = await uploadPhotoToUrl(buffer);
    if (!uploadedUrl || !uploadedUrl.startsWith("http")) throw new Error("Gagal mengunduh URL balik dari Catbox Server.");

    const settingsPath = path.join(__dirname, "settings.js");
    if (fs.existsSync(settingsPath)) {
      let settingsContent = fs.readFileSync(settingsPath, "utf8");
      const regex = /(menuImage\s*:\s*['"`])([^'"`]*)(['"`])/;
      if (regex.test(settingsContent)) {
        settingsContent = settingsContent.replace(regex, `$1${uploadedUrl}$3`);
        fs.writeFileSync(settingsPath, settingsContent, "utf8");
        settings["menuImage"] = uploadedUrl;
      } else {
        throw new Error("Properti 'menuImage' tidak ditemukan di settings.js.");
      }
    } else {
      throw new Error("File settings.js tidak ditemukan.");
    }
    await userbotClient["editMessage"](replyChatId, { "message": statusMsg.id, "text": `${formatHeader("Thumbnail Success")}Link Cloud Baru: <code>${uploadedUrl}</code>` });
  } catch (err) {
    await userbotClient["editMessage"](replyChatId, { "message": statusMsg.id, "text": `Gagal: ${err.message}` }).catch(() => {});
  }
}

// ---------------- Router pesan lanjutan (dipanggil dari index.js) ----------------
async function handlePendingInput(ctx, incoming, pending) {
  const { userbotClient, db, saveDb, ownerId, replyChatId } = ctx;
  const text = incoming.text;

  if (pending.type === "setprefix") {
    const newPrefix = text.split(/\s+/)[0];
    if (!newPrefix) return sendPromptFromUserbot(userbotClient, replyChatId, "Prefix tidak boleh kosong. Kirim ulang.");
    db["prefix"] = newPrefix; saveDb(); clearPending(ownerId);
    return sendFromUserbot(userbotClient, replyChatId, `Prefix diubah jadi "${newPrefix}".`);
  }
  if (pending.type === "afkon") {
    const reason = !text || text.toLowerCase() === "skip" ? "Tanpa alasan" : text;
    db["afk"] = { status: true, reason, time: Date.now() }; saveDb(); clearPending(ownerId);
    return sendFromUserbot(userbotClient, replyChatId, `AFK diaktifkan. Alasan: ${reason}`);
  }
  if (pending.type === "cekid") {
    try {
      const entity = await userbotClient["getEntity"](text);
      const idOut = entity.id ? entity.id.toString() : "?";
      const nameOut = entity.title || entity.firstName || entity.username || "-";
      clearPending(ownerId);
      return sendFromUserbot(userbotClient, replyChatId, `${formatHeader("Id Checker")}Nama: ${nameOut}\nID: <code>${idOut}</code>`);
    } catch (e) {
      return sendPromptFromUserbot(userbotClient, replyChatId, `Tidak ditemukan (${e.message}). Kirim ulang @username atau ID.`);
    }
  }
  if (pending.type === "qris") return handleQrisAmount(text, ctx);
  if (pending.type === "thumb") return handleThumbInput(incoming, ctx);
  if (pending.type === "tourl") return handleTourlInput(incoming, ctx);
  if (pending.type === "objs") {
    if (!text && !incoming.hasDocument) return sendPromptFromUserbot(userbotClient, replyChatId, "Kirim kode (teks) atau file .js-nya.");
    return handleObfuscateInput(incoming, pending.data.level, ctx);
  }
  if (pending.type === "htmsg") {
    const groupId = pending.data.targetChat;
    const hidetagText = !text || text.toLowerCase() === "skip" ? "" : text;
    clearPending(ownerId);
    return handleHidetagRun(groupId, hidetagText, ctx);
  }
  if (pending.type === "bcsetup") return handleBroadcastCapture(ctx, incoming, pending, "bc");
  if (pending.type === "cfdsetup") return handleBroadcastCapture(ctx, incoming, pending, "cfd");
  if (pending.type === "bconce") return handleOneTimeBroadcast(ctx, incoming);
}

async function beginInputFlow(type, ctx) {
  const { userbotClient, ownerId, replyChatId } = ctx;
  const prompts = {
    setprefix: "Kirim prefix baru (contoh: . atau !).",
    afkon: "Kirim alasan AFK (atau ketik \"skip\" untuk tanpa alasan).",
    cekid: "Kirim @username atau ID yang mau dicek.",
    qris: "Kirim nominal QRIS (contoh: 5000 atau 1.2k).",
    thumb: "Kirim FOTO yang mau dijadikan gambar menu.",
    tourl: "Kirim file/foto yang mau diubah jadi URL.",
    bcsetup: "Kirim materi AutoBC (teks atau foto+caption).",
    bconce: "Kirim materi buat broadcast SEKALI ke semua grup/channel (teks atau foto)."
  };
  if (!prompts[type]) return;
  setPending(ownerId, type, replyChatId, type === "bcsetup" ? { stage: "content" } : {});
  return sendPromptFromUserbot(userbotClient, replyChatId, prompts[type]);
}

function buildCtx(userbotClient, db, saveDb, settings, ownerId, replyChatId) {
  return { userbotClient, db, saveDb, settings, ownerId, replyChatId };
}

// ============================================================
// Dipanggil dari index.js untuk SETIAP pesan masuk dari owner.
// Return true kalau pesan ini ditangani sbg input flow (index.js harus
// berhenti memproses lebih lanjut); false kalau bukan (lanjut proses normal).
// ============================================================
async function handleUserbotMessage(userbotClient, db, saveDb, settings, msg, isOwner) {
  if (!isOwner) return false;
  const ownerId = settings["id_owner"].toString();
  const pending = pendingInput.get(ownerId);
  if (!pending) return false;

  // Alur yang sudah terlalu lama menggantung dibuang, supaya pesan biasa owner tidak "termakan".
  if (pending.createdAt && Date.now() - pending.createdAt > PENDING_TTL_MS) { clearPending(ownerId); return false; }

  const chatIdStr = msg["chatId"].toString();
  if (pending.chatId && pending.chatId.toString() !== chatIdStr) return false; // balasan di chat lain, abaikan (biarkan proses normal)

  const incoming = extractIncoming(msg);

  // Pengaman ganda: kalau ini ternyata pesan buatan userbot sendiri, jangan dianggap input.
  if (msg["out"] && incoming.text && isSelfSent(incoming.text)) return false;

  // Kalau owner mengetik COMMAND yang dikenal (mis. .menu), berarti dia sudah pindah urusan:
  // batalkan alur input yang menggantung & biarkan command diproses normal.
  const prefix = db["prefix"] || ".";
  if (incoming.text && incoming.text.startsWith(prefix)) {
    const cmd = incoming.text.slice(prefix.length).trim().split(/\s+/)[0].toLowerCase();
    const isKnownCmd = !!cmd && global["plugins"] && [...global["plugins"].values()].some((p) => p["commands"] && p["commands"].includes(cmd));
    if (isKnownCmd) { clearPending(ownerId); return false; }
  }

  if (incoming.text && ["batal", "cancel"].includes(incoming.text.toLowerCase())) {
    clearPending(ownerId);
    await sendFromUserbot(userbotClient, msg["chatId"], "Dibatalkan.");
    return true;
  }

  const ctx = buildCtx(userbotClient, db, saveDb, settings, ownerId, msg["chatId"]);
  await handlePendingInput(ctx, incoming, pending);
  return true;
}

// ============================================================
// Inisialisasi: pasang bot Telegraf HANYA untuk inline_query & callback_query
// ============================================================
async function initBotPanel(userbotClient, db, saveDb, settings) {
  if (!settings["bot_token"]) {
    console.log("\x1b[33m[BotPanel] settings.bot_token belum diisi — menu tombol dilewati (command teks tetap normal seperti biasa).\x1b[0m");
    return;
  }

  const bot = new Telegraf(settings["bot_token"]);
  const ownerId = settings["id_owner"].toString();

  bot.catch((err) => console.log("\x1b[31m[BotPanel Error]\x1b[0m", (err && err.message) || err));

  bot.on("inline_query", async (ctx) => {
    try {
      const q = (ctx.inlineQuery.query || "").trim().toLowerCase();
      if (q !== "menu" && q !== "") return ctx.answerInlineQuery([], { cache_time: 0 }).catch(() => {});

      const v = buildMainMenu(db);
      return ctx.answerInlineQuery([{
        type: "article",
        id: "menu-" + Date.now(),
        title: "Buka Panel Kontrol Userbot",
        description: "Tampilkan menu dengan tombol interaktif",
        input_message_content: { message_text: v.text, parse_mode: "HTML" },
        reply_markup: { inline_keyboard: v.buttons }
      }], { cache_time: 0 }).catch(() => {});
    } catch (e) {
      console.log("\x1b[31m[BotPanel Inline Error]\x1b[0m", (e && e.message) || e);
      ctx.answerInlineQuery([], { cache_time: 0 }).catch(() => {});
    }
  });

  bot.on("callback_query", async (ctx) => {
    try {
      const senderId = ctx.from ? ctx.from.id.toString() : "";
      if (senderId !== ownerId) { await ctx.answerCbQuery("Bot ini private.", { show_alert: true }).catch(() => {}); return; }

      const data = ctx.callbackQuery.data || "";
      const inlineMessageId = ctx.callbackQuery.inline_message_id || null;
      const hasChat = !!ctx.chat;
      const msgId = (!inlineMessageId && ctx.callbackQuery.message) ? ctx.callbackQuery.message.message_id : null;
      await ctx.answerCbQuery().catch(() => {});
      clearPending(ownerId); // tiap tombol ditekan = owner sudah lanjut ke hal lain; alur input lama dibuang

      // replyChatId = chat tempat menu ini TERAKHIR dipakai userbot (via .menu) --
      // SEMUA prompt/hasil dikirim ke sini oleh USERBOT, bukan oleh bot.
      const replyChatId = global["lastMenuChat"] || (hasChat ? ctx.chat.id : null) || "me";

      const ctxObj = buildCtx(userbotClient, db, saveDb, settings, ownerId, replyChatId);
      ctxObj.updatePanel = (text, buttons) => {
        const extra = { parse_mode: "HTML", reply_markup: buttons ? { inline_keyboard: buttons } : undefined };
        if (inlineMessageId) return bot.telegram.editMessageText(undefined, undefined, inlineMessageId, text, extra).catch(() => {});
        if (hasChat && msgId) return bot.telegram.editMessageText(ctx.chat.id, msgId, undefined, text, extra).catch(() => {});
      };

      const parts = data.split(":");
      const ns = parts[0];

      if (data === "mm") { const v = buildMainMenu(db); return ctxObj.updatePanel(v.text, v.buttons); }
      if (data === "nop") return;
      if (data === "cn") { clearPending(ownerId); const v = buildMainMenu(db); return ctxObj.updatePanel(v.text, v.buttons); }
      if (ns === "mc") { const v = buildCategoryMenu(parts[1], db); return ctxObj.updatePanel(v.text, v.buttons); }
      if (ns === "tg") return handleToggle(parts[1], ctxObj);
      if (ns === "ac") return handleInstantAction(parts[1], ctxObj);
      if (ns === "ga") return handleGroupManageToggle(parts[1], parts[2], ctxObj);
      if (ns === "gp") { const v = await renderGroupPicker(userbotClient, parts[1], parseInt(parts[2]) || 0); return ctxObj.updatePanel(v.text, v.buttons); }
      if (ns === "gs") return handleGroupSelected(parts[1], parts[2], ctxObj);
      if (ns === "bl" && parts[1] === "rm") {
        if (Array.isArray(db["blacklist"])) { const idx = db["blacklist"].indexOf(parts[2]); if (idx !== -1) { db["blacklist"].splice(idx, 1); saveDb(); } }
        const v = buildBlacklistListView(db);
        return ctxObj.updatePanel(v.text, v.buttons);
      }
      if (ns === "lvl") {
        setPending(ownerId, "objs", replyChatId, { level: parseInt(parts[1]) });
        return sendPromptFromUserbot(userbotClient, replyChatId, `Kirim kode (teks) atau upload file .js yang mau di-obfuscate, level ${parts[1]}.`);
      }
      if (ns === "in") return beginInputFlow(parts[1], ctxObj);
    } catch (e) {
      console.log("\x1b[31m[BotPanel Callback Error]\x1b[0m", (e && e.message) || e);
    }
  });

  bot.launch().catch((e) => console.log("\x1b[31m[BotPanel] Gagal launch bot:\x1b[0m", (e && e.message) || e));

  try {
    const botMe = await bot.telegram.getMe();
    console.log(`\x1b[32m[BotPanel] Menu tombol online sebagai: @${botMe.username}\x1b[0m`);
  } catch (e) {
    console.log("\x1b[31m[BotPanel] Gagal login bot, cek bot_token di settings.js:\x1b[0m", (e && e.message) || e);
  }
}

module.exports = { initBotPanel, handleUserbotMessage };
