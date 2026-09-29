const axios = require('axios');
const FormData = require('form-data');
const { Api } = require('telegram');

/**
 * Membuat format judul response menggunakan Blockquote HTML
 */
function formatHeader(title) {
  return `<blockquote><b>${title.toUpperCase()}</b></blockquote>\n\n`;
}

/**
 * Delay fungsi dalam milidetik
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Format tanggal bergaya lokal Indonesia
 */
function formatTanggal(date) {
  return date.toLocaleString('id-ID', { 
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

/**
 * Mengambil SEMUA kode invite hash grup/channel dari sebuah teks pesan.
 * Mendukung:
 *  - t.me/+xxxxxxxx dan t.me/joinchat/xxxxxxxx
 *  - domain lama telegram.me/+xxxx dan telegram.me/joinchat/xxxx
 *  - dengan/tanpa http/https/www, dan tidak peka huruf besar-kecil di bagian domain
 *  - lebih dari satu link sekaligus dalam satu pesan
 * Mengembalikan array hash unik (tanpa duplikat), sesuai urutan kemunculan di teks.
 * Sengaja hanya menangani link UNDANGAN (invite), bukan link @username publik,
 * supaya tidak memicu terlalu banyak percobaan resolve/join untuk link biasa
 * (link ke pesan channel, bot, dsb.) yang berisiko memicu limit anti-spam Telegram.
 */
function extractInviteHashes(text) {
  if (!text) return [];
  const regex = /(?:https?:\/\/)?(?:www\.)?t(?:elegram)?\.me\/(?:joinchat\/|\+)([a-zA-Z0-9_-]{4,})/gi;
  const found = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[1] && !found.includes(match[1])) found.push(match[1]);
  }
  return found;
}

/**
 * Fungsi upload gambar menggunakan multi-provider fallback (Pixhost API / Catbox)
 */
async function UploadPixhost(buffer) {
  try {
    const form = new FormData();
    form.append('img', buffer, { filename: 'image.png' });
    form.append('content_type', '0'); // 0 = Safe content
    form.append('max_file_size', '10485760');

    const res = await axios.post('https://pixhost.to/api/v1/upload', form, {
      headers: form.getHeaders(),
      timeout: 15000
    });

    if (res.data && res.data.show_url) {
      // Mengubah show_url menjadi direct link gambar jika memungkinkan
      return res.data.show_url;
    }
    return null;
  } catch (e) {
    console.error("[Pixhost Error]", e.message);
    // Fallback otomatis menggunakan anonymous Catbox jika Pixhost terkendali limit
    try {
      const formCatbox = new FormData();
      formCatbox.append('reqtype', 'fileupload');
      formCatbox.append('fileToUpload', buffer, { filename: 'image.png' });
      const catboxRes = await axios.post('https://catbox.moe/user/api.php', formCatbox, {
        headers: formCatbox.getHeaders()
      });
      return catboxRes.data;
    } catch (err) {
      console.error("[Catbox Fallback Error]", err.message);
      return null;
    }
  }
}

// ============================================================
// PENANDA PESAN BUATAN SENDIRI (anti-echo)
// ============================================================
// Pesan yang DIKIRIM userbot secara programatik (balasan AFK, prompt/hasil
// panel, konfirmasi command, dst) kembali lagi ke message handler sebagai
// event "pesan keluar" (msg.out = true), dan karena isOwner ikut menghitung
// msg.out, pesan-pesan itu salah dikira ketikan owner. Dampaknya: AFK mematikan
// dirinya sendiri begitu balasan pertamanya terkirim, dan alur input tombol
// bisa "memakan" prompt-nya sendiri.
// Solusi deterministik (tanpa race): SEBELUM mengirim, teks (versi polos,
// tanpa tag HTML) didaftarkan di sini; saat event-nya kembali, handler cukup
// cek isSelfSent(teks) lalu mengabaikannya.
const selfSentTexts = new Map();

function normText(t) {
  return String(t || "").replace(/\s+/g, " ").trim();
}

function htmlToPlain(html) {
  return normText(
    String(html || "")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
      .replace(/&amp;/g, "&")
  );
}

function markSelfSent(html) {
  const key = htmlToPlain(html);
  if (!key) return;
  selfSentTexts.set(key, Date.now() + 120000); // berlaku 2 menit
  if (selfSentTexts.size > 300) {
    const now = Date.now();
    for (const [k, exp] of selfSentTexts) if (exp < now) selfSentTexts.delete(k);
  }
}

function isSelfSent(plainText) {
  const key = normText(plainText);
  if (!key) return false;
  const exp = selfSentTexts.get(key);
  if (!exp) return false;
  if (exp < Date.now()) { selfSentTexts.delete(key); return false; }
  return true;
}

/**
 * Mengirim pesan dari USERBOT yang punya tombol inline BENERAN berfungsi,
 * dengan cara "meminjam" hasil inline query dari bot pendamping (Telegraf).
 * Hasilnya: pesan tampak terkirim dari akun userbot sendiri (di chat manapun),
 * berlabel kecil "via @namabot", dan tombolnya diproses oleh bot pendamping.
 *
 * Ini SATU-SATUNYA cara resmi userbot (akun biasa) bisa punya tombol inline
 * yang benar-benar menerima callback_query -- akun biasa tidak bisa kirim
 * inline keyboard sendiri secara langsung.
 *
 * @param {TelegramClient} client - client userbot (GramJS) yang sudah login
 * @param {string} botUsername - username bot pendamping TANPA "@" (settings.botUsername)
 * @param {string|number|Api.TypePeer} chatId - chat tujuan pesan dikirim
 * @param {string} query - teks query, dicocokkan oleh handler inline_query di sisi bot
 */
async function sendInline(client, botUsername, chatId, query) {
  if (!botUsername) throw new Error("settings.botUsername belum diisi.");
  const botEntity = await client.getInputEntity(botUsername);
  const peer = await client.getInputEntity(chatId);
  const results = await client.invoke(new Api.messages.GetInlineBotResults({ bot: botEntity, peer, query, offset: "" }));
  if (!results.results || results.results.length === 0) {
    throw new Error("Bot tidak mengembalikan hasil inline untuk query ini (cek apakah bot online & inline mode aktif di BotFather).");
  }
  await client.invoke(new Api.messages.SendInlineBotResult({ peer, queryId: results.queryId, id: results.results[0].id }));
}

module.exports = {
  formatHeader,
  sleep,
  formatTanggal,
  UploadPixhost,
  extractInviteHashes,
  sendInline,
  markSelfSent,
  isSelfSent
};
