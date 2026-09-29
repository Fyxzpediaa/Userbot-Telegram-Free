🤖 FYXZPEDIA USERBOT TELEGRAM

<p align="center">
  <b>Telegram Userbot untuk Termux Android</b><br>
  <i>Simple • Powerful • Stable • Easy Setup</i>
</p><p align="center">
  <img src="https://img.shields.io/badge/Platform-Termux-000000?style=for-the-badge&logo=termux">
  <img src="https://img.shields.io/badge/Node.js-Required-339933?style=for-the-badge&logo=node.js">
  <img src="https://img.shields.io/badge/PM2-Process_Manager-2B037A?style=for-the-badge">
  <img src="https://img.shields.io/badge/Telegram-Userbot-26A5E4?style=for-the-badge&logo=telegram">
</p>---

☁️ Arsitektur

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

📋 Daftar Isi

- "✨ Tentang" (#-tentang)
- "📱 Persyaratan" (#-persyaratan)
- "🚀 Instalasi" (#-instalasi)
- "🔑 Telegram API" (#-telegram-api)
- "🤖 BotFather" (#-botfather)
- "🔐 Login Telegram" (#-login-telegram)
- "▶️ Menjalankan Userbot" (#️-menjalankan-userbot)
- "📊 Status" (#-status)
- "📜 Logs" (#-logs)
- "🔄 Restart" (#-restart)
- "⛔ Stop" (#-stop)
- "⚡ Autostart" (#-autostart)
- "🛠️ Troubleshooting" (#️-troubleshooting)
- "🔒 Keamanan" (#-keamanan)
- "📁 Lokasi File" (#-lokasi-file)

---

✨ Tentang

Fyxzpedia Userbot Telegram adalah userbot Telegram yang dapat dijalankan melalui Termux Android.

Userbot menggunakan:

- Node.js
- Telegram API
- PM2
- Termux
- Session Telegram

Repository:

Fyxzpediaa/Userbot-Telegram-Free

---

📱 Persyaratan

Sebelum melakukan instalasi, siapkan:

- Android
- Termux
- Internet
- Akun Telegram
- Telegram API ID
- Telegram API Hash
- Bot Token jika diperlukan oleh konfigurasi userbot

«⚠️ Disarankan menggunakan Termux dari sumber resmi/terpercaya dan memberikan izin yang diperlukan hanya jika memang dibutuhkan.»

---

🚀 Instalasi

1. Update Termux

Jalankan command berikut satu per satu.

pkg update -y

pkg upgrade -y

---

2. Install Dependency

pkg install git wget unzip curl tar python clang make pkg-config -y

---

3. Cek Python

python --version

---

4. Cek Clang

clang --version

---

5. Masuk ke Home Termux

cd ~

---

6. Clone Repository

git clone https://github.com/Fyxzpediaa/Userbot-Telegram-Free.git

---

7. Masuk ke Folder Repository

cd ~/Userbot-Telegram-Free

---

8. Cek File

ls

Pastikan file instalasi terlihat.

---

9. Jalankan Installer

bash install.sh

Ikuti instruksi yang muncul di Termux.

Jika installer menanyakan:

Where should the bot source come from?

1) Local package
2) Private GitHub release

Choose [1-2] (default 1):

Pilih:

1

---

🔧 Jika Muncul Error node-gyp

Jika muncul error seperti:

gyp ERR!
Could not find any Python installation

atau error saat memasang:

bufferutil

install dependency berikut:

pkg install python clang make pkg-config -y

Cek Python:

python --version

Cek Clang:

clang --version

Kemudian kembali ke folder repository:

cd ~/Userbot-Telegram-Free

Jalankan installer lagi:

bash install.sh

---

🔑 Telegram API

Untuk mendapatkan API ID dan API Hash, buka:

https://my.telegram.org

Login menggunakan akun Telegram.

Kemudian pilih:

API Development Tools

Buat aplikasi jika belum memiliki API.

Simpan:

API ID
API Hash

⚠️ Jangan publikasikan API Hash.

---

👤 Telegram User ID

Jika installer membutuhkan Telegram User ID, kamu dapat menggunakan bot Telegram yang menyediakan informasi ID akun, misalnya:

@userinfobot

Kirim:

/start

Simpan User ID yang diberikan.

---

🤖 BotFather

Jika konfigurasi userbot meminta Bot Token, buat bot melalui:

@BotFather

Kirim:

/newbot

Ikuti instruksi sampai mendapatkan:

Bot Token

⚠️ Jangan pernah membagikan Bot Token.

---

🔐 Login Telegram

Saat installer meminta login Telegram, masukkan nomor Telegram kamu.

Contoh:

+628xxxxxxxxxx

Kemudian masukkan kode OTP yang dikirim Telegram.

Jika akun menggunakan verifikasi dua langkah, masukkan password 2FA.

Jika login berhasil, biasanya akan muncul informasi seperti:

[AUTH] Berhasil login!
[SUCCESS] Userbot online sebagai: @username

---

⚠️ Jika Muncul "Press CTRL+C"

Jika muncul:

✓ Session saved. Press CTRL+C to finish the login step.

dan sebelumnya sudah muncul:

[AUTH] Berhasil login!
✓ Session saved.
✓ Telegram login completed.

maka session sudah tersimpan.

Tekan:

CTRL + C

untuk keluar dari tahap login interaktif.

---

▶️ Menjalankan Userbot

Setelah instalasi selesai, jalankan:

fyx start

Kemudian cek:

fyx status

Targetnya:

PM2 process     : running

---

📊 Status

Untuk melihat status userbot:

fyx status

Contoh kondisi normal:

Manager version : 1.0.0
Bot version     : 2.0.0
settings.js     : valid
Telegram login  : session saved
PM2 process     : running

---

📜 Logs

Untuk melihat log userbot:

fyx logs

Gunakan:

CTRL + C

untuk keluar dari tampilan log.

---

🔄 Restart

Jika userbot mengalami masalah atau ingin menjalankan ulang:

fyx restart

Kemudian cek:

fyx status

Jika perlu melihat error:

fyx logs

---

⛔ Stop

Untuk menghentikan userbot:

fyx stop

Cek status:

fyx status

---

⚡ Autostart

Jika ingin mengaktifkan proses boot/autostart yang disediakan oleh installer:

Pastikan userbot sudah berjalan:

fyx start

Kemudian jalankan:

bash ~/.fyxzpedia/manager/boot.sh

Cek kembali:

fyx status

Target:

PM2 process     : running
Boot autostart  : enabled

«Catatan: kemampuan menjalankan proses secara otomatis setelah Android/Termux dibuka dapat bergantung pada konfigurasi perangkat dan Termux.»

---

🛠️ Troubleshooting

❌ Node.js Bermasalah

Cek Node.js:

node --version

Cek npm:

npm --version

Jika diperlukan, install Node.js LTS:

pkg install nodejs-lts npm -y

Cek kembali:

node --version

npm --version

---

❌ Python Tidak Ditemukan

Install Python:

pkg install python -y

Cek:

python --version

---

❌ PM2 Tidak Terinstall

Install PM2:

npm install -g pm2

Cek:

pm2 --version

---

❌ PM2 Tidak Running

Jalankan:

fyx start

Kemudian:

fyx status

Jika masih bermasalah:

fyx logs

---

❌ Userbot Berhenti

Coba restart:

fyx restart

Kemudian:

fyx status

Jika masih bermasalah:

fyx logs

---

📁 Lokasi File

Userbot dapat tetap disimpan di storage private Termux.

Repository:

~/Userbot-Telegram-Free

Manager/config:

~/.fyxzpedia

Contoh lokasi absolut:

/data/data/com.termux/files/home/Userbot-Telegram-Free

dan:

/data/data/com.termux/files/home/.fyxzpedia

Tidak perlu menyimpan repository di:

/sdcard/Download

atau:

/storage/emulated/0/Download

---

🔒 Keamanan

Jangan upload file rahasia ke GitHub.

Jangan masukkan file atau informasi berikut ke repository publik:

API Hash
Bot Token
OTP Telegram
Password 2FA
Telegram Session
session.json
*.session
.env

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

📋 Quick Install

Kalau ingin instalasi cepat, jalankan command berikut satu per satu.

Update

pkg update -y

Upgrade

pkg upgrade -y

Dependency

pkg install git wget unzip curl tar python clang make pkg-config -y

Clone

cd ~

git clone https://github.com/Fyxzpediaa/Userbot-Telegram-Free.git

Masuk folder

cd ~/Userbot-Telegram-Free

Install

bash install.sh

Jalankan

fyx start

Cek

fyx status

Logs

fyx logs

---

🎯 Checklist

Setelah selesai, pastikan:

✓ Repository berhasil di-clone
✓ Dependency berhasil di-install
✓ Telegram berhasil login
✓ Session tersimpan
✓ PM2 berjalan
✓ Userbot online

Cek dengan:

fyx status

Kondisi yang diharapkan:

Telegram login  : session saved
PM2 process     : running

Jika autostart sudah diaktifkan:

Boot autostart  : enabled

---

💡 Catatan Copy Button GitHub

Setiap command Termux di README ini sengaja dibuat menjadi blok kode terpisah.

Dengan begitu GitHub akan memberikan tombol:

📋 Copy

pada setiap command.

Jangan menggabungkan banyak command ke dalam satu blok jika ingin setiap command mempunyai tombol Copy sendiri.

---

<p align="center">
  <b>🤖 FYXZPEDIA USERBOT</b><br>
  <i>Powered by Termux • Node.js • PM2 • Telegram</i>
</p>
