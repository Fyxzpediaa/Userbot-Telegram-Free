<div align="center">🤖 FYXZPEDIA USERBOT

Telegram Userbot • Termux • Android

<p>
  <img src="https://img.shields.io/badge/Telegram-Userbot-26A5E4?style=for-the-badge&logo=telegram&logoColor=white">
  <img src="https://img.shields.io/badge/Termux-Android-000000?style=for-the-badge&logo=termux&logoColor=white">
  <img src="https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=node.js&logoColor=white">
  <img src="https://img.shields.io/badge/PM2-Process%20Manager-2B037A?style=for-the-badge">
</p><p>
  <b>⚡ Fast</b> &nbsp;•&nbsp;
  <b>🛠️ Easy Setup</b> &nbsp;•&nbsp;
  <b>📱 Android</b> &nbsp;•&nbsp;
  <b>🔄 PM2</b>
</p></div>---

📌 Tentang

Fyxzpedia Userbot adalah Telegram Userbot yang dirancang untuk berjalan di Termux Android.

Project ini menggunakan:

Komponen| Fungsi
📱 Termux| Environment Linux di Android
🟢 Node.js| Runtime Userbot
⚡ PM2| Menjalankan & mengelola proses
☁️ Telegram API| Komunikasi dengan Telegram
🔐 Session| Menyimpan sesi login Telegram

---

🧩 Cara Kerja

                    ☁️ TELEGRAM
                         │
                         │ Telegram API
                         ▼
              ┌─────────────────────┐
              │   🤖 FYXZPEDIA      │
              │      USERBOT        │
              │      Node.js        │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │       ⚡ PM2         │
              │  Process Manager    │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │      📱 TERMUX      │
              │       ANDROID       │
              └─────────────────────┘

---

🚀 Quick Start

«💡 Untuk pengguna baru: cukup ikuti bagian ini dari atas sampai bawah.»

01 — Update Termux

pkg update -y

02 — Upgrade Package

pkg upgrade -y

03 — Install Dependency

pkg install git wget unzip curl tar python clang make pkg-config -y

04 — Clone Repository

git clone https://github.com/Fyxzpediaa/Userbot-Telegram-Free.git

05 — Masuk ke Folder

cd ~/Userbot-Telegram-Free

06 — Jalankan Installer

bash install.sh

---

📱 Persyaratan

Sebelum memulai, pastikan kamu memiliki:

- Android
- Termux
- Koneksi internet
- Akun Telegram
- Telegram API ID
- Telegram API Hash

«⚠️ Jangan gunakan akun Telegram yang tidak kamu kendalikan sendiri.»

---

🔑 Telegram API

Untuk mendapatkan API ID dan API Hash, buka:

https://my.telegram.org

Kemudian:

Login
   ↓
API Development Tools
   ↓
Create Application
   ↓
API ID + API Hash

Simpan kedua informasi tersebut dengan aman.

«🔐 API Hash bersifat rahasia. Jangan upload ke GitHub.»

---

⚙️ Proses Instalasi

Setelah menjalankan:

bash install.sh

Installer akan melakukan beberapa proses seperti:

┌─────────────────────────────────┐
│        FYXZPEDIA INSTALLER      │
├─────────────────────────────────┤
│ ✓ Check Termux                  │
│ ✓ Check Node.js                 │
│ ✓ Install dependencies          │
│ ✓ Setup PM2                     │
│ ✓ Setup configuration           │
│ ✓ Telegram authentication       │
│ ✓ Save session                  │
└─────────────────────────────────┘

Jika muncul pilihan:

Where should the bot source come from?

1) Local package
2) Private GitHub release

Choose [1-2] (default 1):

Pilih:

1

---

🔐 Login Telegram

Saat installer meminta nomor Telegram, masukkan nomor akun kamu.

Contoh:

+628xxxxxxxxxx

Kemudian masukkan kode OTP yang dikirim Telegram.

Jika akun menggunakan 2FA, masukkan password 2FA.

Jika berhasil, akan muncul kurang lebih:

[AUTH] Berhasil login!
[SUCCESS] Userbot online sebagai: @username

---

✅ Session Berhasil Disimpan

Jika muncul:

✓ Session saved.

berarti session Telegram sudah tersimpan.

Jika installer menampilkan:

Press CTRL+C to finish the login step.

tekan:

CTRL + C

Kemudian lanjutkan ke tahap menjalankan Userbot.

---

▶️ Menjalankan Userbot

Setelah instalasi selesai:

fyx start

Kemudian cek:

fyx status

Jika berhasil:

Telegram login  : session saved
PM2 process     : running

---

📊 Status Userbot

Gunakan:

fyx status

Contoh:

Manager version : 1.0.0
Bot version     : 2.0.0
Install dir     : ~/.fyxzpedia
settings.js     : valid
Telegram login  : session saved
PM2 process     : running

---

📜 Melihat Log

Untuk melihat aktivitas Userbot:

fyx logs

Keluar dari tampilan log:

CTRL + C

---

🔄 Restart

Jika Userbot perlu dijalankan ulang:

fyx restart

Kemudian:

fyx status

---

⛔ Stop

Untuk menghentikan Userbot:

fyx stop

---

⚡ Autostart

Jika ingin menggunakan mekanisme boot yang disediakan installer:

Jalankan Userbot

fyx start

Aktifkan Boot

bash ~/.fyxzpedia/manager/boot.sh

Periksa Status

fyx status

Jika berhasil, status akan menunjukkan:

PM2 process     : running
Boot autostart  : enabled

«ℹ️ Perilaku autostart dapat bergantung pada konfigurasi Android dan Termux.»

---

🛠️ Troubleshooting

❌ "node-gyp" / Python Error

Jika muncul error terkait Python atau "node-gyp":

pkg install python clang make pkg-config -y

Cek:

python --version

Kemudian kembali ke repository:

cd ~/Userbot-Telegram-Free

Jalankan installer kembali:

bash install.sh

---

❌ Node.js Tidak Terdeteksi

Cek:

node --version

Cek npm:

npm --version

Jika diperlukan:

pkg install nodejs-lts npm -y

---

❌ PM2 Tidak Berjalan

Coba:

fyx start

Kemudian:

fyx status

Jika masih bermasalah:

fyx logs

---

❌ Userbot Berhenti

Restart:

fyx restart

Kemudian periksa:

fyx status

---

📁 Struktur Penyimpanan

Project tidak harus disimpan di folder Download Android.

Repository:

~/Userbot-Telegram-Free

Manager:

~/.fyxzpedia

Dalam Termux, "~" berada di storage private aplikasi Termux.

Contoh:

/data/data/com.termux/files/home/

Jadi tidak perlu memindahkan project ke:

/sdcard/Download

---

🔒 SECURITY

Jangan pernah upload informasi berikut ke repository publik:

API Hash
Bot Token
Telegram Session
OTP
Password 2FA
session.json
*.session
.env

".gitignore"

Gunakan:

node_modules/

.env

.env.*

session.json

*.session

*.session-journal

logs/

backups/

---

🧹 Jika Ingin Membersihkan Repository

Periksa file:

ls -la

Pastikan file rahasia tidak ikut masuk repository.

Jika menggunakan Git:

git status

---

📋 Command Reference

Command| Fungsi
"fyx start"| Menjalankan Userbot
"fyx stop"| Menghentikan Userbot
"fyx restart"| Restart Userbot
"fyx status"| Melihat status
"fyx logs"| Melihat log

Start

fyx start

Stop

fyx stop

Restart

fyx restart

Status

fyx status

Logs

fyx logs

---

🏁 Final Checklist

Sebelum menganggap instalasi selesai, jalankan:

fyx status

Pastikan:

✓ settings.js     : valid
✓ Telegram login  : session saved
✓ PM2 process     : running

Jika menggunakan autostart:

✓ Boot autostart  : enabled

---

🤝 Credits

<div align="center">FYXZPEDIA

Telegram Userbot for Termux Android

⭐ Jika project ini bermanfaat, kamu bisa memberikan Star pada repository.

</div>---

<div align="center">🤖 FYXZPEDIA USERBOT

"Telegram" • "Node.js" • "PM2" • "Termux"

</div>
