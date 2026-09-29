<div align="center">✨ FYXZPEDIA USERBOT TELEGRAM

🚀 Powerful • Lightweight • Termux Ready • PM2 Powered

<p>
  <img src="https://img.shields.io/badge/Platform-Termux-1f1f1f?style=for-the-badge&logo=android&logoColor=white" alt="Termux">
  <img src="https://img.shields.io/badge/Runtime-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Process-PM2-2B037A?style=for-the-badge&logo=pm2&logoColor=white" alt="PM2">
  <img src="https://img.shields.io/badge/Telegram-Userbot-26A5E4?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram">
</p><p>
  <strong>Telegram Userbot untuk Termux Android</strong><br>
  Instalasi mudah • Background process • Autostart • Session persistent
</p><br>╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║                  🤖  FYXZPEDIA USERBOT                       ║
║                                                              ║
║        TELEGRAM AUTOMATION FOR TERMUX / ANDROID              ║
║                                                              ║
║     ⚡ Fast     🔐 Session     🔄 PM2     📱 Termux          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

</div>---

📌 Tentang Project

Fyxzpedia Userbot Telegram adalah Userbot Telegram berbasis Node.js yang dirancang untuk berjalan di Termux Android.

Project ini menggunakan PM2 untuk menjalankan Userbot sebagai background process dan menyediakan manager command "fyx" untuk mengontrol Userbot dengan mudah.

✨ Highlights

Fitur| Status
📱 Termux Android| ✅
🟢 Node.js| ✅
⚡ PM2 Process Manager| ✅
🔐 Persistent Telegram Session| ✅
🔄 Restart Userbot| ✅
🚀 Autostart| ✅
📊 Status Manager| ✅
📜 Log Manager| ✅
💾 Tidak membutuhkan folder Download| ✅
🛠️ Installer otomatis| ✅

---

🖼️ Bot Architecture

                         ┌───────────────────────┐
                         │      TELEGRAM         │
                         │      ☁️  SERVER       │
                         └───────────┬───────────┘
                                     │
                                     │ Telegram API
                                     ▼
                         ┌───────────────────────┐
                         │   🤖 FYXZPEDIA UBOT   │
                         │       Node.js         │
                         └───────────┬───────────┘
                                     │
                         ┌───────────▼───────────┐
                         │         PM2           │
                         │   Process Manager     │
                         └───────────┬───────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │       📱 TERMUX       │
                         │       Android         │
                         └───────────────────────┘

---

🧰 Requirements

Sebelum memulai, pastikan:

- Android
- Termux
- Internet aktif
- Akun Telegram
- Telegram API ID
- Telegram API Hash
- Ruang penyimpanan yang cukup

«⚠️ Gunakan Termux dari sumber terpercaya seperti F-Droid atau repository resmi Termux.»

---

🚀 Installation

1. Update Termux

Buka Termux:

pkg update -y && pkg upgrade -y

---

2. Install Dependencies

pkg install git wget unzip curl tar python clang make pkg-config -y

Cek Python:

python --version

Cek Clang:

clang --version

Keduanya diperlukan terutama untuk dependency Node.js yang menggunakan "node-gyp".

---

📥 3. Clone Repository

Masuk ke home directory Termux:

cd ~

Clone repository:

git clone https://github.com/Fyxzpediaa/Userbot-Telegram-Free.git

Masuk ke folder:

cd ~/Userbot-Telegram-Free

Cek:

ls

Struktur awal:

Userbot-Telegram-Free/
│
├── 📁 bin/
├── 📁 bot/
├── 📁 config/
├── 📁 scripts/
├── 📁 tools/
│
├── 📜 install.sh
├── 📜 setup.sh
├── 📜 run.sh
├── 📜 boot.sh
├── 📜 update.sh
├── 📜 uninstall.sh
│
├── 📄 README.md
└── 📄 LICENSE

---

⚙️ 4. Run Installer

Jalankan:

bash install.sh

Installer akan melakukan:

┌─────────────────────────────────────┐
│       FYXZPEDIA INSTALLER           │
├─────────────────────────────────────┤
│ ✓ Checking Termux                   │
│ ✓ Checking Node.js                  │
│ ✓ Checking npm                      │
│ ✓ Checking PM2                      │
│ ✓ Preparing bot                     │
│ ✓ Installing dependencies           │
│ ✓ Preparing configuration            │
└─────────────────────────────────────┘

Jika Node.js belum tersedia:

Install Node.js now? [Y/n]

Masukkan:

y

Jika PM2 belum tersedia:

Install PM2 now (npm install -g pm2)? [Y/n]

Masukkan:

y

---

📦 5. Select Bot Source

Installer akan menampilkan:

Where should the bot source come from?

  1) Local package
  2) Private GitHub release

Choose [1-2] (default 1):

Pilih:

1

Kenapa pilih "1"?

Karena source Userbot sudah tersedia di:

bot/

dari repository yang baru saja di-clone.

---

🛠️ 6. Jika Error "node-gyp"

Jika muncul:

npm error code 1
npm error path .../node_modules/bufferutil
npm error command sh -c node-gyp-build

gyp ERR! find Python
Could not find any Python installation

Jangan clone repository ulang.

Jalankan:

pkg install python clang make pkg-config -y

Kemudian:

python --version

Setelah Python tersedia:

cd ~/Userbot-Telegram-Free
bash install.sh

Pilih:

1

jika kembali ditanya sumber bot.

---

🔑 7. Telegram API ID & API Hash

Buka:

👉 https://my.telegram.org

Login menggunakan akun Telegram.

Masuk ke:

API Development Tools

Buat aplikasi dan simpan:

API ID
API Hash

⚠️ SECURITY

Jangan pernah membagikan:

❌ API Hash
❌ Bot Token
❌ OTP Telegram
❌ Password 2FA
❌ Session file

---

👤 8. Telegram User ID

Jika diperlukan, gunakan:

@userinfobot

untuk mendapatkan Telegram User ID.

---

🤖 9. Bot Token

Jika konfigurasi meminta Bot Token, buat melalui:

@BotFather

Gunakan:

/newbot

Ikuti instruksi BotFather sampai mendapatkan token.

«🔐 Bot Token adalah credential rahasia. Jangan publikasikan.»

---

🔐 10. Telegram Login

Installer akan meminta nomor Telegram.

Contoh:

+628xxxxxxxxxx

Telegram kemudian mengirim kode login.

Masukkan kode tersebut.

Jika menggunakan Two-Step Verification, masukkan password 2FA.

Jika berhasil:

[AUTH] Berhasil login!

[SUCCESS] Userbot online sebagai: @username

✓ Session saved.
✓ Telegram login completed.

🎉 Telegram session berhasil dibuat.

---

⛔ 11. CTRL+C Setelah Login

Jika muncul:

✓ Session saved.
Press CTRL+C to finish the login step.

kamu dapat menekan:

CTRL+C

Jika kemudian muncul:

[!] Interrupted.

tidak perlu panik.

Selama sebelumnya sudah muncul:

✓ Session saved.
✓ Telegram login completed.

maka login berhasil.

---

📊 12. Check Status

Masuk ke repository:

cd ~/Userbot-Telegram-Free

Kemudian:

fyx status

Contoh:

╔══════════════════════════════════════╗
║        FYXZPEDIA UBOT STATUS         ║
╚══════════════════════════════════════╝

Manager version : 1.0.0
Bot version     : 2.0.0

Install dir     : ~/.fyxzpedia
settings.js     : valid
Telegram login  : session saved
PM2 process     : not running
Boot autostart  : disabled

Pada tahap ini login sudah berhasil, tetapi Userbot belum dijalankan oleh PM2.

---

▶️ 13. Start Userbot

Jalankan:

fyx start

Kemudian:

fyx status

Target:

PM2 process     : running

🎉 Userbot sekarang berjalan melalui PM2.

---

📜 14. View Logs

Gunakan:

fyx logs

Untuk keluar dari log:

CTRL+C

---

🔄 15. Restart

Untuk restart Userbot:

fyx restart

---

⛔ 16. Stop

Untuk menghentikan Userbot:

fyx stop

---

🚀 17. Enable Autostart

Jika Userbot sudah berjalan:

fyx start

aktifkan autostart:

bash ~/.fyxzpedia/manager/boot.sh

Kemudian:

fyx status

Target:

PM2 process     : running
Boot autostart  : enabled

---

🧭 Command Center

Semua kontrol utama menggunakan command "fyx".

┌──────────────────────────────────────────┐
│             🤖 FYX COMMAND CENTER        │
├──────────────────────────────────────────┤
│                                          │
│  fyx start       ▶ Start Userbot         │
│  fyx stop        ⏹ Stop Userbot          │
│  fyx restart     🔄 Restart Userbot      │
│  fyx status      📊 Show status          │
│  fyx logs        📜 Show logs            │
│  fyx settings    ⚙️ Settings             │
│  fyx update      🔄 Update               │
│                                          │
└──────────────────────────────────────────┘

---

📂 Storage Layout

Project tidak membutuhkan penyimpanan di folder Android "Download".

Repository:

/data/data/com.termux/files/home/Userbot-Telegram-Free

atau:

~/Userbot-Telegram-Free

Data Userbot:

/data/data/com.termux/files/home/.fyxzpedia

atau:

~/.fyxzpedia

Contoh:

~/.fyxzpedia/
│
├── 📁 bot/
├── 📁 config/
├── 📁 data/
├── 📁 logs/
├── 📁 backups/
├── 📁 releases/
├── 📁 manager/
└── 📄 version

Tidak perlu:

termux-setup-storage

untuk instalasi standar ini.

---

🔐 Security

Userbot Telegram menggunakan session untuk mempertahankan login.

Perlakukan session sebagai credential rahasia.

Jangan upload ke GitHub:

❌ session.json
❌ .session
❌ API Hash
❌ Bot Token
❌ OTP
❌ Password 2FA
❌ Private credentials

Jika repository kamu public, pastikan file rahasia masuk ".gitignore".

Contoh:

# Telegram credentials
session.json
*.session
*.session-journal

# Environment
.env
.env.*

# Local data
data/
logs/
backups/

# Node
node_modules/

---

🧯 Troubleshooting

❌ Node.js tidak ditemukan

Jalankan:

pkg install nodejs-lts npm -y

Kemudian:

node --version
npm --version

---

❌ Python tidak ditemukan

Jalankan:

pkg install python -y

Cek:

python --version

---

❌ "bufferutil" / "node-gyp" error

Jalankan:

pkg install python clang make pkg-config -y

Kemudian:

cd ~/Userbot-Telegram-Free
bash install.sh

---

❌ PM2 tidak ditemukan

Jalankan:

npm install -g pm2

Kemudian:

pm2 --version

---

❌ PM2 process "not running"

Jalankan:

fyx start

Kemudian:

fyx status

Jika masih gagal:

fyx logs

---

❌ Telegram login sudah berhasil tetapi Userbot tidak berjalan

Cek:

fyx status

Jika:

Telegram login  : session saved
PM2 process     : not running

jalankan:

fyx start

---

❌ Userbot berhenti

Coba:

fyx restart

Kemudian:

fyx logs

---

🔁 Full Installation — Quick Copy

Jika ingin melihat seluruh perintah utama:

pkg update -y && pkg upgrade -y
pkg install git wget unzip curl tar python clang make pkg-config -y
cd ~
git clone https://github.com/Fyxzpediaa/Userbot-Telegram-Free.git
cd ~/Userbot-Telegram-Free
bash install.sh

Saat installer bertanya:

Choose [1-2] (default 1):

pilih:

1

Setelah konfigurasi dan login Telegram selesai:

cd ~/Userbot-Telegram-Free
fyx status
fyx start
fyx status

Aktifkan autostart:

bash ~/.fyxzpedia/manager/boot.sh

Cek terakhir:

fyx status

Target:

Telegram login  : session saved
PM2 process     : running
Boot autostart  : enabled

---

🏁 Final Checklist

╔════════════════════════════════════════════════════╗
║             ✅ INSTALLATION CHECK                  ║
╠════════════════════════════════════════════════════╣
║                                                    ║
║  [✓] Termux installed                             ║
║  [✓] Git installed                                ║
║  [✓] Python installed                             ║
║  [✓] Clang installed                              ║
║  [✓] Node.js installed                            ║
║  [✓] npm installed                                ║
║  [✓] PM2 installed                                ║
║  [✓] Repository cloned                            ║
║  [✓] Bot dependencies installed                   ║
║  [✓] Telegram API configured                      ║
║  [✓] Telegram login completed                     ║
║  [✓] Session saved                                ║
║  [✓] PM2 process running                          ║
║  [✓] Autostart enabled                            ║
║                                                    ║
╚════════════════════════════════════════════════════╝

---

🌟 Credits

Made for Termux + Telegram Userbot.

Repository:

https://github.com/Fyxzpediaa/Userbot-Telegram-Free

---

<div align="center">🤖 FYXZPEDIA USERBOT

Built for Android • Powered by Termux • Managed by PM2

<br>⚡ AUTOMATE  •  🔐 SECURE  •  🚀 RUN

</div>
