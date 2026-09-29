const { formatHeader } = require('../function');

// FITUR BARU: sebelumnya db["blacklist"] sudah dipakai oleh .cfd (broadcast.js)
// untuk melewati grup tertentu, tapi TIDAK ADA plugin untuk mengisi/menghapus/
// melihat isinya — jadi fitur itu sebenarnya tidak bisa dipakai sama sekali.
// Plugin ini melengkapi bagian yang hilang itu.
module.exports = {
  commands: ["blacklist", "bl"],
  ownerOnly: true,
  run: async ({ client, msg, args, db, saveDb }) => {
    const targetChat = msg.chatId;

    if (!Array.isArray(db["blacklist"])) db["blacklist"] = [];

    const sub = (args[0] || "").toLowerCase();

    // .blacklist add [chatId] -> default: chat saat ini
    if (sub === "add") {
      const idToAdd = (args[1] || targetChat).toString();

      if (db["blacklist"].includes(idToAdd)) {
        return client["sendMessage"](targetChat, {
          "message": `${formatHeader("Blacklist")}Chat <code>${idToAdd}</code> sudah ada di dalam daftar blacklist.`,
          "parseMode": "html", "replyTo": msg.id
        });
      }

      db["blacklist"].push(idToAdd);
      saveDb();

      return client["sendMessage"](targetChat, {
        "message": `${formatHeader("Blacklist")}✅ Chat <code>${idToAdd}</code> berhasil ditambahkan ke blacklist.\nChat ini akan dilewati saat <code>.cfd</code> atau <code>.autobc</code> berjalan.`,
        "parseMode": "html", "replyTo": msg.id
      });
    }

    // .blacklist del / remove / rm [chatId] -> default: chat saat ini
    if (sub === "del" || sub === "remove" || sub === "rm") {
      const idToRemove = (args[1] || targetChat).toString();
      const idx = db["blacklist"].indexOf(idToRemove);

      if (idx === -1) {
        return client["sendMessage"](targetChat, {
          "message": `${formatHeader("Blacklist")}Chat <code>${idToRemove}</code> tidak ditemukan di dalam daftar blacklist.`,
          "parseMode": "html", "replyTo": msg.id
        });
      }

      db["blacklist"].splice(idx, 1);
      saveDb();

      return client["sendMessage"](targetChat, {
        "message": `${formatHeader("Blacklist")}✅ Chat <code>${idToRemove}</code> berhasil dihapus dari blacklist.`,
        "parseMode": "html", "replyTo": msg.id
      });
    }

    // .blacklist list -> tampilkan semua chat yang di-blacklist
    if (sub === "list") {
      if (db["blacklist"].length === 0) {
        return client["sendMessage"](targetChat, {
          "message": `${formatHeader("Blacklist")}Daftar blacklist masih kosong.`,
          "parseMode": "html", "replyTo": msg.id
        });
      }

      const listText = db["blacklist"].map((id, i) => `${i + 1}. <code>${id}</code>`).join("\n");

      return client["sendMessage"](targetChat, {
        "message": `${formatHeader("Blacklist")}Total <b>${db["blacklist"].length}</b> chat di-blacklist:\n\n${listText}`,
        "parseMode": "html", "replyTo": msg.id
      });
    }

    // Tanpa argumen / argumen tidak dikenali -> tampilkan cara pakai
    return client["sendMessage"](targetChat, {
      "message": `${formatHeader("Blacklist Control")}` +
        `• <code>.blacklist add</code> — blacklist chat ini\n` +
        `• <code>.blacklist add -100xxxxxxxxxx</code> — blacklist chat lain via ID\n` +
        `• <code>.blacklist del</code> — hapus chat ini dari blacklist\n` +
        `• <code>.blacklist list</code> — lihat semua chat yang di-blacklist\n\n` +
        `<i>Chat yang di-blacklist otomatis dilewati saat .cfd atau .autobc berjalan.</i>`,
      "parseMode": "html", "replyTo": msg.id
    });
  }
};
