<div align="center">🤖 FYXZPEDIA USERBOT TELEGRAM

🚀 Telegram Userbot untuk Termux Android

<p>
  <img src="https://img.shields.io/badge/Platform-Termux-black?style=for-the-badge&logo=android&logoColor=white">
  <img src="https://img.shields.io/badge/Node.js-24.x-green?style=for-the-badge&logo=node.js&logoColor=white">
  <img src="https://img.shields.io/badge/PM2-Process_Manager-purple?style=for-the-badge&logo=pm2&logoColor=white">
  <img src="https://img.shields.io/badge/Telegram-Userbot-26A5E4?style=for-the-badge&logo=telegram&logoColor=white">
</p>╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║                 🤖  FYXZPEDIA USERBOT                        ║
║                                                              ║
║            TELEGRAM USERBOT FOR TERMUX                       ║
║                                                              ║
║       ⚡ Fast • 🔐 Secure • 🔄 PM2 • 📱 Android              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

</div>---

📖 Tentang

Fyxzpedia Userbot Telegram adalah Telegram Userbot berbasis Node.js yang dirancang untuk berjalan di Termux Android.

Project menggunakan PM2 sebagai process manager sehingga Userbot dapat dijalankan sebagai background process.

✨ Fitur

Fitur| Status
📱 Termux Android| ✅
🟢 Node.js| ✅
⚡ PM2| ✅
🔐 Persistent Session| ✅
▶️ Start / Stop| ✅
🔄 Restart| ✅
📊 Status| ✅
📜 Logs| ✅
🚀 Autostart| ✅
💾 Tidak perlu folder Download| ✅

---

🖼️ Architecture

                  ┌──────────────────────┐
                  │      ☁️ TELEGRAM     │
                  │       SERVER         │
                  └──────────┬───────────┘
                             │
                             │ Telegram API
                             ▼
                  ┌──────────────────────┐
                  │   🤖 FYXZPEDIA UBOT  │
                  │       Node.js        │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │        ⚡ PM2         │
                  │   Process Manager    │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │      📱 TERMUX       │
                  │       ANDROID        │
                  └──────────────────────┘

---

📋 Requirements

Sebelum instalasi, siapkan:

- Android
- Termux
- Internet
- Akun Telegram
- Telegram API ID
- Telegram API Hash

«⚠️ Disarankan menggunakan Termux dari F-Droid atau sumber resmi Termux.»

---

🚀 INSTALLATION

1️⃣ Update Termux

Buka Termux.

Command

pkg update -y && pkg upgrade -y

---

2️⃣ Install Dependencies

Command

pkg install git wget unzip curl tar python clang make pkg-config -y

Cek Python

python --version

Cek Clang

clang --version

Jika keduanya menampilkan versi, lanjutkan.

---

📥 3️⃣ Clone Repository

Masuk ke home Termux.

Command

cd ~

Clone repository.

Command

git clone https://github.com/Fyxzpediaa/Userbot-Telegram-Free.git

Masuk ke folder Userbot.

Command

cd ~/Userbot-Telegram-Free

Cek file.

Command

ls

Struktur:

Userbot-Telegram-Free/
├── bin/
├── bot/
├── config/
├── scripts/
├── tools/
├── install.sh
├── setup.sh
├── run.sh
├── boot.sh
├── update.sh
├── uninstall.sh
└── README.md

---

⚙️ 4️⃣ Jalankan Installer

Command

bash install.sh

Jika muncul:

Install Node.js now? [Y/n]

ketik:

y

Jika muncul:

Install PM2 now (npm install -g pm2)? [Y/n]

ketik:

y

---

📦 5️⃣ Pilih Source Bot

Installer akan menampilkan:

Where should the bot source come from?
  1) Local package
  2) Private GitHub release

Choose [1-2] (default 1):

Pilih:

1

Kemudian tekan Enter.

💡 Kenapa pilih "1"?

Karena source bot sudah tersedia di folder:

bot/

dari repository yang kita clone sebelumnya.

---

🛠️ 6️⃣ Troubleshooting "node-gyp"

Jika muncul error:

npm error path .../node_modules/bufferutil
npm error command sh -c node-gyp-build
gyp ERR! find Python
Could not find any Python installation

Install ulang dependency build.

Command

pkg install python clang make pkg-config -y

Cek Python:

Command

python --version

Kemudian jalankan installer kembali.

Command

cd ~/Userbot-Telegram-Free

Command

bash install.sh

Pilih:

1

jika diminta memilih source.

«❗ Tidak perlu melakukan "git clone" ulang.»

---

🔑 7️⃣ Telegram API ID & API Hash

Buka:

https://my.telegram.org

Login menggunakan akun Telegram.

Pilih:

API Development Tools

Buat aplikasi jika belum mempunyai API ID.

Simpan:

API ID
API Hash

⚠️ Jangan membagikan API Hash.

---

👤 8️⃣ Telegram User ID

Jika installer membutuhkan Telegram User ID, gunakan:

@userinfobot

Kirim pesan ke bot tersebut dan gunakan ID yang diberikan.

---

🤖 9️⃣ Bot Token

Jika installer meminta Bot Token, gunakan:

@BotFather

Kemudian:

/newbot

Ikuti instruksi sampai mendapatkan Bot Token.

⚠️ Jangan membagikan Bot Token.

---

🔐 🔟 Login Telegram

Masukkan nomor Telegram ketika diminta.

Contoh:

+628xxxxxxxxxx

Kemudian masukkan OTP Telegram.

Jika akun menggunakan 2FA, masukkan password 2FA.

Jika berhasil:

[AUTH] Berhasil login!

[SUCCESS] Userbot online sebagai: @username

✓ Session saved.
✓ Telegram login completed.

🎉 Login berhasil.

---

⛔ 1️⃣1️⃣ CTRL+C Setelah Login

Jika muncul:

✓ Session saved.
Press CTRL+C to finish the login step.

Tekan:

CTRL+C

Jika muncul:

[!] Interrupted.

tidak masalah selama sebelumnya sudah muncul:

✓ Session saved.
✓ Telegram login completed.

---

📊 1️⃣2️⃣ Check Status

Masuk ke repository.

Command

cd ~/Userbot-Telegram-Free

Cek status.

Command

fyx status

Contoh:

settings.js     : valid
Telegram login  : session saved
PM2 process     : not running
Boot autostart  : disabled

Artinya login berhasil, tetapi Userbot belum dijalankan melalui PM2.

---

▶️ 1️⃣3️⃣ Start Userbot

Command

fyx start

Tunggu beberapa detik.

Kemudian cek:

Command

fyx status

Target:

PM2 process     : running

🎉 Userbot sudah berjalan.

---

📜 1️⃣4️⃣ View Logs

Command

fyx logs

Untuk keluar:

CTRL+C

---

🔄 1️⃣5️⃣ Restart Userbot

Command

fyx restart

Kemudian:

Command

fyx status

---

⛔ 1️⃣6️⃣ Stop Userbot

Command

fyx stop

---

🚀 1️⃣7️⃣ Enable Autostart

Setelah Userbot berhasil berjalan:

Command

fyx start

Kemudian aktifkan autostart:

Command

bash ~/.fyxzpedia/manager/boot.sh

Cek:

Command

fyx status

Target:

PM2 process     : running
Boot autostart  : enabled

---

🎛️ Command Center

╔══════════════════════════════════════════════╗
║            🤖 FYX COMMAND CENTER             ║
╠══════════════════════════════════════════════╣
║                                              ║
║  ▶  fyx start       Start Userbot            ║
║  ⏹  fyx stop        Stop Userbot             ║
║  🔄 fyx restart     Restart Userbot          ║
║  📊 fyx status      Show status              ║
║  📜 fyx logs        Show logs                ║
║  ⚙️ fyx settings    Settings                 ║
║  🔄 fyx update      Update                   ║
║                                              ║
╚══════════════════════════════════════════════╝

---

📂 Storage

Repository:

~/Userbot-Telegram-Free

Data Userbot:

~/.fyxzpedia

Lokasi sebenarnya berada di:

/data/data/com.termux/files/home/

Tidak perlu memindahkan Userbot ke:

/storage/emulated/0/Download

dan tidak perlu:

termux-setup-storage

untuk instalasi standar.

---

🔐 SECURITY

Jangan pernah upload credential ke GitHub.

Jangan upload:

session.json
*.session
.env
API Hash
Bot Token
OTP
Password 2FA

Tambahkan ke ".gitignore":

node_modules/
.env
.env.*
session.json
*.session
*.session-journal
data/
logs/
backups/

---

🧯 Troubleshooting

Node.js tidak ditemukan

pkg install nodejs-lts npm -y

Cek:

node --version

npm --version

---

Python tidak ditemukan

pkg install python -y

Cek:

python --version

---

"bufferutil" / "node-gyp"

pkg install python clang make pkg-config -y

Kemudian:

cd ~/Userbot-Telegram-Free

bash install.sh

---

PM2 tidak ditemukan

npm install -g pm2

Cek:

pm2 --version

---

PM2 "not running"

fyx start

Kemudian:

fyx status

Jika masih gagal:

fyx logs

---

Userbot berhenti

fyx restart

Kemudian:

fyx logs

---

⚡ QUICK INSTALL

Untuk instalasi dari awal:

pkg update -y && pkg upgrade -y

pkg install git wget unzip curl tar python clang make pkg-config -y

cd ~

git clone https://github.com/Fyxzpediaa/Userbot-Telegram-Free.git

cd ~/Userbot-Telegram-Free

bash install.sh

Saat diminta source:

1

Setelah login Telegram:

fyx status

Jalankan:

fyx start

Cek:

fyx status

Aktifkan autostart:

bash ~/.fyxzpedia/manager/boot.sh

Cek terakhir:

fyx status

---

✅ FINAL CHECKLIST

╔════════════════════════════════════════════════════╗
║                  INSTALLATION CHECK                ║
╠════════════════════════════════════════════════════╣
║                                                    ║
║  [✓] Termux                                       ║
║  [✓] Git                                          ║
║  [✓] Python                                       ║
║  [✓] Clang                                        ║
║  [✓] Node.js                                      ║
║  [✓] npm                                          ║
║  [✓] PM2                                          ║
║  [✓] Repository                                   ║
║  [✓] Dependencies                                 ║
║  [✓] Telegram API                                 ║
║  [✓] Telegram Login                               ║
║  [✓] Session                                      ║
║  [✓] PM2 Running                                  ║
║  [✓] Autostart                                    ║
║                                                    ║
╚════════════════════════════════════════════════════╝

Target akhir:

Telegram login  : session saved
PM2 process     : running
Boot autostart  : enabled

---

🌟 Credits

<div align="center">FYXZPEDIA USERBOT TELEGRAM

Built for:

📱 Android
⚡ Termux
🟢 Node.js
🔄 PM2
✈️ Telegram

⚡ AUTOMATE • 🔐 SECURE • 🚀 RUN

</div>---

<div align="center">⭐ Jika project ini membantu, jangan lupa berikan Star di GitHub! ⭐

</div>
