module.exports = {
  // --- API Telegram ---
  api_id: {{api_id}},
  api_hash: {{api_hash}},

  // --- Bot Properties ---
  name: {{name}},
  version: {{version}},
  id_owner: {{id_owner}}, // ID Telegram Owner

  // --- Bot Panel (Menu Tombol) ---
  // Token bot dari @BotFather, khusus untuk menu tombol (BUKAN userbot).
  // Kosongkan ("") kalau belum mau pakai menu tombol -- fitur command teks
  // (.menu, .autojoin, dst) tetap jalan normal walau ini kosong.
  bot_token: {{bot_token}},
  // Username bot pendamping TANPA "@" (contoh: "MyPanelBot_bot").
  // WAJIB diisi + WAJIB aktifkan Inline Mode bot ini lewat @BotFather
  // (/setinline) supaya .menu bisa kirim tombol "via @bot" dari userbot.
  botUsername: {{botUsername}},

  // --- Media Menu Foto ---
  menuImage: {{menuImage}},

  // --- Payment Qris Otomatis ---
  fyxzgatewayApiKey: {{fyxzgatewayApiKey}},
  fyxzgatewayBaseUrl: {{fyxzgatewayBaseUrl}},

  // --- Payment Qris Manual ---
  qrisImage: {{qrisImage}},
  payment: {
    dana: {{payment.dana}},
    gopay: {{payment.gopay}},
    ovo: {{payment.ovo}}
  }
};
