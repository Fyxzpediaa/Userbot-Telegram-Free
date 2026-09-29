const settings = require('../settings');
const { sendInline } = require('../function');

module.exports = {
  "commands": ["menu", "help"],
  "ownerOnly": false,
  "run": async ({ client, msg, db }) => {
    // FITUR BARU: kalau bot panel sudah dikonfigurasi (bot_token + botUsername
    // di settings.js keduanya terisi), kirim menu versi TOMBOL lewat mekanisme
    // "via @bot" -- pesan tetap tampak terkirim dari userbot ini, tapi
    // tombolnya benar-benar berfungsi (diproses oleh bot pendamping).
    // Kalau belum dikonfigurasi, otomatis fallback ke menu teks/foto biasa
    // di bawah supaya .menu tetap selalu berfungsi walau tanpa bot panel.
    if (settings["bot_token"] && settings["botUsername"]) {
      try {
        // Catat chat tempat OWNER membuka menu. Semua prompt/hasil lanjutan
        // (isi materi, file, konfirmasi) dikirim USERBOT ke chat ini -- bukan
        // ke DM bot. Hanya diperbarui kalau yang memanggil owner sendiri,
        // supaya orang lain yang iseng mengetik .menu tidak menggeser tujuannya.
        const senderIdStr = msg.senderId ? msg.senderId.toString() : "";
        if (msg.out || senderIdStr === settings["id_owner"].toString()) {
          global["lastMenuChat"] = msg.chatId;
        }
        await sendInline(client, settings["botUsername"], msg.chatId, "menu");
        return;
      } catch (e) {
        console.log("\x1b[31m[Menu Inline Error]\x1b[0m", e.message, "-- fallback ke menu teks biasa.");
        // lanjut ke bawah (fallback), jangan return
      }
    }

    // --- Bagian 1: Bot Information ---
    let listMenu = `<blockquote><b>🖥# 𝗕𝗼𝘁 - 𝗗𝗲𝘁𝗮𝗶𝗹 𝗜𝗻𝗳𝗼𝗿𝗺𝗮𝘁𝗶𝗼𝗻</b></blockquote>\n`;
    listMenu += `   • Developer : https://t.me/Fyxzpedia\n`;
    listMenu += `   • Version : <code>Premium Berbayar</code>\n`;
    listMenu += `   • Botprefix : <code>${db["prefix"]}</code>\n`;
    listMenu += `   • Botmode : <code>${db["selfMode"] ? "Self" : "Public"}</code>\n`;
    listMenu += `   • AutoJoin : <code>${db["autoJoinGroup"] ? "ON" : "OFF"}</code>\n\n`;

    const userCmds = [];
    const ownerCmds = [];

    // Proses tracking otomatis berkas command dari seluruh plugin
    for (const [name, plugin] of global.plugins) {
      if (!plugin["commands"] || plugin["commands"].length === 0) continue;
      
      for (const cmd of plugin["commands"]) {
        // Pengecualian untuk fitur backup, .npm, dan .config
        if (["backup", ".npm", ".config", "npm", "config"].includes(cmd.toLowerCase())) {
          continue;
        }

        if (plugin["ownerOnly"]) {
          if (!ownerCmds.includes(cmd)) ownerCmds.push(cmd);
        } else {
          if (!userCmds.includes(cmd)) userCmds.push(cmd);
        }
      }
    }

    // --- Bagian 2: Kategori Utilitas Kompak (User/Publik) ---
    if (userCmds.length > 0) {
      listMenu += `<blockquote><b>🧩# 𝗕𝗼𝘁 𝗨𝘁𝗶𝗹𝗶𝘁𝘆 𝗙𝗲𝗮𝘁𝘂𝗿𝗲𝘀</b></blockquote>\n`;
      let hasUserEnc = false;
      
      for (const cmd of userCmds) {
        if (/^enc([1-9]|10)$/.test(cmd)) {
          hasUserEnc = true;
          continue; 
        }
        listMenu += `    • <code>${db["prefix"]}${cmd}</code>\n`;
      }
      
      if (hasUserEnc) {
        listMenu += `    • <code>${db["prefix"]}enc1-10</code>\n`;
      }
      listMenu += `\n`;
    }

    // --- Bagian 3: Kategori Fitur Khusus Owner ---
    if (ownerCmds.length > 0) {
      listMenu += `<blockquote><b>🎗# 𝗕𝗼𝘁 𝗢𝘄𝗻𝗲𝗿 𝗧𝗼𝗼𝗹𝘀</b></blockquote>\n`;
      let hasOwnerEnc = false;

      for (const cmd of ownerCmds) {
        if (/^enc([1-9]|10)$/.test(cmd)) {
          hasOwnerEnc = true;
          continue; 
        }
        listMenu += `    • <code>${db["prefix"]}${cmd}</code>\n`;
      }

      if (hasOwnerEnc) {
        listMenu += `    • <code>${db["prefix"]}enc1-10</code>\n`;
      }
      listMenu += `\n`;
    }
    
    listMenu = listMenu.trim();

    // Mengambil string URL gambar murni langsung dari berkas settings.js Anda
    const finalMenuImage = settings.menuImage;

    try {
      // 🔥 FIX UTAMA: Tarik data entitas chat secara utuh dari server Telegram agar mendapatkan Access Hash
      const targetEntity = await client["getEntity"](msg.chatId);

      // Kirim menu berupa foto langsung ke targetEntity yang sudah valid
      await client["sendFile"](targetEntity, {
        "file": finalMenuImage,
        "caption": listMenu,
        "parseMode": "html",
        "forceDocument": false, 
        "replyTo": msg.id
      });

    } catch (e) {
      console.error("[Menu Send Error]", e);
      try {
        // Fallback darurat berupa teks jika pengiriman media mengalami kendala internet
        const targetEntity = await client["getEntity"](msg.chatId);
        await client["sendMessage"](targetEntity, { 
          "message": listMenu, 
          "parseMode": "html", 
          "replyTo": msg.id 
        });
      } catch (err) {}
    }
  }
};
