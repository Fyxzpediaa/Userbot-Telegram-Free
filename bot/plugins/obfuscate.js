const { Api } = require("telegram");
const JavaScriptObfuscator = require('javascript-obfuscator');
const { formatHeader } = require('../function');

// Fungsi enkripsi Zero-Width Character (Level 10)
const encodeZero = (text) => text.split('')
  .map(c => c.charCodeAt(0).toString(2).padStart(8, '0').split('')
  .map(b => (b === '1' ? '\u200b' : '\u200c')).join('') + '\u200d').join('');

module.exports = {
  // Mendaftarkan multi-case command dari enc1 sampai enc10 secara dinamis
  commands: ["enc1", "enc2", "enc3", "enc4", "enc5", "enc6", "enc7", "enc8", "enc9", "enc10"],
  ownerOnly: false,
  run: async ({ client, msg, cmdName }) => {
    
    // Validasi input deteksi reply chat
    if (!msg.replyToMsgId) {
      return client.sendMessage(msg.chatId, {
        message: `${formatHeader("Obfuscator System")}Contoh penggunaan:\nBalas (reply) pada pesan teks kode atau berkas dokumen <code>.js</code>, lalu ketik perintah <code>.enc5</code>`,
        parseMode: "html", replyTo: msg.id
      });
    }

    const level = parseInt(cmdName.replace('enc', ''));
    const statusMsg = await client.sendMessage(msg.chatId, { 
      message: `${formatHeader("Obfuscator System")}Sedang memproses enkripsi level ${level}, mohon tunggu...`, 
      parseMode: "html" 
    });

    try {
      // Ambil data pesan yang di-reply
      const repliedMsgs = await client.getMessages(msg.chatId, { ids: msg.replyToMsgId });
      const quoted = repliedMsgs[0];

      if (!quoted) {
        return client.editMessage(msg.chatId, { message: statusMsg.id, text: "❌ Pesan target reply tidak ditemukan." });
      }

      // Ekstraksi kode dari pesan teks ataupun berkas file javascript (.js)
      let kodeAsli = "";
      if (quoted.text) {
        kodeAsli = quoted.text;
      } else if (quoted.media) {
        const buffer = await client.downloadMedia(quoted.media);
        if (buffer) kodeAsli = buffer.toString('utf-8');
      }

      if (!kodeAsli || kodeAsli.trim() === "") {
        return client.editMessage(msg.chatId, { message: statusMsg.id, text: "❌ Kode tidak ditemukan atau pesan kosong!" });
      }

      // Konfigurasi opsi obfuscate berdasarkan tingkat level pilihan
      let opt = { compact: true, controlFlowFlattening: false };
      switch (level) {
        case 1: opt = { compact: true, simplify: true }; break;
        case 2: opt = { compact: true, renameGlobals: true }; break;
        case 3: opt = { compact: true, controlFlowFlattening: true, controlFlowFlatteningThreshold: 0.5 }; break;
        case 4: opt = { compact: true, controlFlowFlattening: true, deadCodeInjection: true, deadCodeInjectionThreshold: 0.2 }; break;
        case 5: opt = { compact: true, stringArray: true, stringArrayThreshold: 0.75, selfDefending: true }; break;
        case 6: opt = { compact: true, controlFlowFlattening: true, stringArrayEncoding: ['base64'], debugProtection: true }; break;
        case 7: opt = { compact: true, splitStrings: true, splitStringsChunkLength: 3, unicodeEscapeSequence: true }; break;
        case 8: opt = { compact: true, controlFlowFlattening: true, deadCodeInjection: true, stringArrayEncoding: ['rc4'], transformObjectKeys: true }; break;
        case 9: opt = { compact: true, controlFlowFlattening: true, selfDefending: true, stringArrayEncoding: ['base64', 'rc4'], numbersToExpressions: true }; break;
        case 10: opt = { compact: true, simplify: true, unicodeEscapeSequence: true, identifierNamesGenerator: 'hexadecimal' }; break;
      }

      // Proses kompilasi obfuscation menggunakan core engine library
      let hasilEnc = JavaScriptObfuscator.obfuscate(kodeAsli, opt).getObfuscatedCode();

      // Injector khusus super stealth (Zero-Width invisible code) untuk level maksimal (10)
      if (level === 10) {
        let encoded = encodeZero(hasilEnc);
        hasilEnc = `eval((function(w){return w.split('\\u200d').filter(x=>x).map(x=>String.fromCharCode(parseInt(x.replace(/\\u200b/g,'1').replace(/\\u200c/g,'0'),2))).join('')})('${encoded}'))`;
      }

      // Kirim hasil akhir berupa file dokumen .js murni ke Telegram chat tujuan
      await client.sendFile(msg.chatId, {
        file: Buffer.from(hasilEnc, 'utf-8'),
        caption: `${formatHeader("Obfuscate Success")}Obfuscate level ${level} sukses dijalankan ✅`,
        parseMode: "html",
        replyTo: msg.id,
        attributes: [
          new Api.DocumentAttributeFilename({
            fileName: `level_${level}_encrypted.js`
          })
        ]
      });

      // Hapus status indikator loading/processing awal
      await client.deleteMessages(msg.chatId, [statusMsg.id], { revoke: true });

    } catch (e) {
      console.error("[Obfuscate Error]", e);
      await client.editMessage(msg.chatId, { 
        message: statusMsg.id, 
        text: `${formatHeader("Obfuscated Error")}Terjadi kesalahan sistem, pastikan kode JavaScript Anda valid dan tidak memiliki syntax error.` 
      });
    }
  }
};
