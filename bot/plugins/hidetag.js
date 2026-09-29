module.exports = {
  "commands": ["hidetag", "ht"],
  "ownerOnly": true, // Di-lock khusus owner agar bot tidak disalahgunakan orang lain di grup
  "run": async ({ client, msg }) => {
    // 1. Ambil entitas lengkap chat saat ini untuk mencegah error "Input Entity"
    let targetEntity;
    try {
      targetEntity = await client["getEntity"](msg.chatId);
    } catch (e) {
      return;
    }

    // Validasi: Hidetag hanya berjalan di Group / Supergroup / Channel
    if (msg.isPrivate) {
      return client["sendMessage"](msg.chatId, {
        "message": `<blockquote><b>SYSTEM WARNING</b></blockquote>\nFitur hidetag hanya dapat digunakan di dalam Grup atau Channel!`,
        "parseMode": "html",
        "replyTo": msg.id
      });
    }

    // 2. Ekstrak teks yang diketik setelah command .hidetag / .ht
    let textUsed = msg.message.split(" ").slice(1).join(" ").trim();

    // 3. Deteksi media foto (Skenario langsung atau via reply chat)
    let mediaObject = null;
    if (msg.media && msg.media.photo) {
      mediaObject = msg.media;
    } else if (msg.replyToMsgId) {
      const repliedMsgs = await client["getMessages"](msg.chatId, { "ids": msg.replyToMsgId });
      if (repliedMsgs && repliedMsgs[0]) {
        if (repliedMsgs[0].media && repliedMsgs[0].media.photo) {
          mediaObject = repliedMsgs[0].media;
        }
        // Jika perintah tidak membawa teks, ambil teks dari chat yang direply sebagai cadangan
        if (!textUsed && repliedMsgs[0].message) {
          textUsed = repliedMsgs[0].message;
        }
      }
    }

    try {
      // 4. Tarik seluruh daftar anggota/partisipan yang ada di grup
      const participants = await client["getParticipants"](targetEntity);

      // Susun daftar tag siluman (satu per anggota) menggunakan zero-width space
      const tags = [];
      for (const part of participants) {
        if (part.id && !part.bot) { // Lewati bot agar menghemat limit kuota entity Telegram
          tags.push(`<a href="tg://user?id=${part.id}">&#8203;</a>`);
        }
      }

      // Hapus pesan pemicu perintah (.hidetag) agar proses tag terlihat rapi dan misterius
      await client["deleteMessages"](msg.chatId, [msg.id], { "revoke": true });

      // FIX: Telegram membatasi caption foto ±1024 karakter & pesan teks ±4096 karakter.
      // Grup dengan banyak anggota akan menghasilkan ribuan tag sekaligus — kalau
      // digabung jadi satu pesan seperti sebelumnya, pengiriman akan GAGAL TOTAL
      // (error "message too long") begitu jumlah anggota cukup banyak.
      // Solusinya: pecah tag menjadi beberapa bagian (chunk) sesuai batas aman,
      // lalu kirim berurutan sebagai beberapa pesan.
      const CAPTION_LIMIT = 1000; // sedikit di bawah 1024 sebagai buffer aman
      const TEXT_LIMIT = 4000;    // sedikit di bawah 4096 sebagai buffer aman

      const chunks = [];
      let current = "";
      let limit = Math.max((mediaObject ? CAPTION_LIMIT : TEXT_LIMIT) - textUsed.length, 100);

      for (const tag of tags) {
        if (current.length + tag.length > limit) {
          chunks.push(current);
          current = "";
          limit = TEXT_LIMIT; // mulai chunk ke-2 dst selalu berupa pesan teks biasa (tanpa media)
        }
        current += tag;
      }
      chunks.push(current); // selalu ada minimal 1 bagian (walau grup tanpa anggota bertag)

      // 5. Kirim bagian pertama (disertai media & teks utama jika ada)
      if (mediaObject) {
        await client["sendFile"](targetEntity, {
          "file": mediaObject, // Mengirimkan objek media asli tanpa download/upload ulang (Instan)
          "caption": `${textUsed}${chunks[0]}`,
          "parseMode": "html",
          "forceDocument": false
        });
      } else {
        await client["sendMessage"](targetEntity, {
          "message": `${textUsed}${chunks[0]}`,
          "parseMode": "html"
        });
      }

      // Kirim sisa chunk (kalau anggota grup banyak) sebagai pesan susulan, dengan jeda anti-flood
      for (let i = 1; i < chunks.length; i++) {
        await new Promise((r) => setTimeout(r, 1200));
        await client["sendMessage"](targetEntity, {
          "message": chunks[i],
          "parseMode": "html"
        });
      }

    } catch (err) {
      console.error("[Hidetag Error]", err);
    }
  }
};
