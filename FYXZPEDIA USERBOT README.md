<div align="center">

# 🤖 FYXZPEDIA USERBOT

**Telegram Userbot • Termux • Android**

![Telegram API](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)
![Termux](https://img.shields.io/badge/Termux-000000?style=for-the-badge&logo=terminal&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![PM2](https://img.shields.io/badge/PM2-2B037A?style=for-the-badge&logo=pm2&logoColor=white)

⚡ **Fast**  •  🛠️ **Easy Setup**  •  📱 **Android**  •  🔄 **PM2** 

</div>

---

## 📑 Daftar Isi
- [Tentang](#-tentang)
- [Cara Kerja](#-cara-kerja)
- [Persyaratan](#-persyaratan)
- [Mendapatkan API Telegram](#-telegram-api)
- [🚀 Quick Start (Instalasi)](#-quick-start)
- [Login Telegram](#-login-telegram)
- [Command Reference](#-command-reference)
- [Menjalankan Userbot](#-menjalankan-userbot)
- [Fitur Tambahan (Autostart, Logs)](#-fitur-tambahan)
- [Troubleshooting](#️-troubleshooting)
- [Struktur & Keamanan](#-struktur-penyimpanan--security)
- [Credits](#-credits)

---

## 📌 Tentang

**Fyxzpedia Userbot** adalah Telegram Userbot yang dirancang khusus dan dioptimalkan untuk berjalan di lingkungan **Termux Android**.

Project ini menggunakan komponen-komponen berikut:

| Komponen | Fungsi |
| :--- | :--- |
| 📱 **Termux** | Environment Linux di Android |
| 🟢 **Node.js** | Runtime utama Userbot |
| ⚡ **PM2** | Menjalankan & mengelola proses secara background |
| ☁️ **Telegram API** | Komunikasi dengan server Telegram |
| 🔐 **Session** | Menyimpan data otentikasi & sesi login Telegram |

## 🧩 Cara Kerja

```text
 ☁️ TELEGRAM
 │
 │ Telegram API
 ▼
 ┌─────────────────────┐
 │  🤖 FYXZPEDIA       │
 │     USERBOT         │
 │     Node.js         │
 └──────────┬──────────┘
 │
 ▼
 ┌─────────────────────┐
 │  ⚡ PM2             │
 │     Process Manager │
 └──────────┬──────────┘
 │
 ▼
 ┌─────────────────────┐
 │  📱 TERMUX          │
 │     ANDROID         │
 └─────────────────────┘
```

---

## 📱 Persyaratan

Sebelum memulai instalasi, pastikan kamu sudah menyiapkan:
- [x] Perangkat Android
- [x] Aplikasi Termux terinstal
- [x] Koneksi internet yang stabil
- [x] Akun Telegram aktif
- [x] **Telegram API ID**
- [x] **Telegram API Hash**

> ⚠️ **PERINGATAN:** Jangan pernah menggunakan akun Telegram yang tidak kamu kendalikan sendiri (akun pinjaman/beli).

---

## 🔑 Telegram API

Untuk mendapatkan `API ID` dan `API Hash`, ikuti langkah berikut:

1. Buka website resmi: https://my.telegram.org
2. Login menggunakan nomor Telegram kamu.
3. Masuk ke menu **API Development Tools**.
4. Klik **Create Application**.
5. Salin dan simpan **API ID** & **API Hash** kamu.

> 🔐 **PENTING:** `API Hash` bersifat sangat rahasia. **JANGAN PERNAH** membagikan atau menguploadnya ke GitHub/publik.

---

## 🚀 Quick Start

💡 *Untuk pengguna baru: Cukup ikuti urutan perintah di bawah ini dari atas sampai bawah. Klik ikon copy di pojok kanan atas setiap blok kode untuk menyalin.*

**01 — Update Termux**
```bash
pkg update -y
```

**02 — Upgrade Package**
```bash
pkg upgrade -y
```

**03 — Install Dependency**
```bash
pkg install git wget unzip curl tar python clang make pkg-config -y
```

**04 — Clone Repository**
```bash
git clone https://github.com/Fyxzpediaa/Userbot-Telegram-Free.git
```

**05 — Masuk ke Folder Project**
```bash
cd ~/Userbot-Telegram-Free
```

**06 — Jalankan Installer**
```bash
bash install.sh
```

---

## ⚙️ Proses Instalasi & Konfigurasi

Setelah menjalankan perintah `bash install.sh`, installer akan melakukan proses otomatis. Tampilannya kurang lebih seperti ini:

```text
┌─────────────────────────────────┐
│       FYXZPEDIA INSTALLER       │
├─────────────────────────────────┤
│ ✓ Check Termux                  │
│ ✓ Check Node.js                 │
│ ✓ Install dependencies          │
│ ✓ Setup PM2                     │
│ ✓ Setup configuration           │
│ ✓ Telegram authentication       │
│ ✓ Save session                  │
└─────────────────────────────────┘
```

Jika di tengah proses muncul pilihan seperti ini:
```text
Where should the bot source come from?
1) Local package
2) Private GitHub release
Choose [1-2] (default 1):
```
👉 Ketik `1` lalu tekan Enter.

---

## 🔐 Login Telegram

Saat installer meminta nomor Telegram, masukkan nomor akun kamu dengan format internasional.
*Contoh:*
```text
+628xxxxxxxxxx
```
1. Masukkan **Kode OTP** yang dikirimkan pihak Telegram ke aplikasi Telegram kamu.
2. Jika akun kamu menggunakan keamanan 2FA, masukkan **Password 2FA** kamu.
3. Jika berhasil, akan muncul notifikasi:
```text
[AUTH] Berhasil login!
[SUCCESS] Userbot online sebagai: @username
✓ Session saved.
```

Saat layar menampilkan:
```text
Press CTRL+C to finish the login step.
```
Tekan tombol `CTRL + C` pada keyboard Termux kamu untuk keluar dari proses login, lalu lanjutkan ke tahap menjalankan Userbot di bawah.

---

## 📋 Command Reference

Berikut adalah perintah singkat (shortcut) untuk mengelola Userbot kamu:

| Command | Fungsi |
| :--- | :--- |
| `fyx start` | Menjalankan Userbot di background |
| `fyx stop` | Menghentikan proses Userbot |
| `fyx restart` | Memulai ulang (Restart) Userbot |
| `fyx status` | Melihat status sistem & bot |
| `fyx logs` | Melihat log aktivitas bot secara real-time |

---

## ▶️ Menjalankan Userbot

Setelah semua proses instalasi selesai, jalankan bot dengan perintah:
```bash
fyx start
```

Untuk mengecek apakah bot sudah berjalan dengan baik:
```bash
fyx status
```
*Output sukses:*
```text
Manager version : 1.0.0
Bot version     : 2.0.0
Install dir     : ~/.fyxzpedia
settings.js     : valid
Telegram login  : session saved
PM2 process     : running
```

---

## 🛠 Fitur Tambahan

### 📜 Melihat Log
Untuk melihat aktivitas Userbot (pesan masuk, error, dll):
```bash
fyx logs
```
*(Tekan `CTRL + C` untuk keluar dari tampilan log)*

### ⚡ Autostart (Jalan Otomatis)
Jika ingin bot otomatis menyala (boot) saat proses Termux dimulai:
```bash
fyx start
bash ~/.fyxzpedia/manager/boot.sh
```
Periksa statusnya dengan `fyx status`. Pastikan bagian ini terlihat:
```text
Boot autostart  : enabled
```
*(ℹ️ Catatan: Perilaku autostart dapat bergantung pada konfigurasi OS Android dan Termux kamu).*

---

## 🛠️ Troubleshooting

Jika kamu mengalami kendala, coba solusi di bawah ini:

<details>
<summary><b>❌ Error Python atau node-gyp</b></summary>

Jalankan perintah ini untuk menginstal ulang modul build:
```bash
pkg install python clang make pkg-config -y
python --version
cd ~/Userbot-Telegram-Free
bash install.sh
```
</details>

<details>
<summary><b>❌ Node.js Tidak Terdeteksi</b></summary>

Pastikan Node.js terinstal dengan benar:
```bash
node --version
npm --version
```
Jika gagal/tidak ada, instal ulang dengan:
```bash
pkg install nodejs-lts npm -y
```
</details>

<details>
<summary><b>❌ PM2 Tidak Berjalan / Userbot Berhenti</b></summary>

Coba pancing dengan restart:
```bash
fyx restart
fyx status
```
Jika masih error, periksa pesan kesalahannya di log:
```bash
fyx logs
```
</details>

---

## 📁 Struktur Penyimpanan & Security

### Struktur
Project ini **tidak harus** disimpan di folder Download Android (`/sdcard/Download`). Biarkan project berada di storage private bawaan Termux agar lebih aman:
* **Repository:** `~/Userbot-Telegram-Free`
* **Manager:** `~/.fyxzpedia`
*(Lokasi asli di dalam sistem Android: `/data/data/com.termux/files/home/`)*

### 🔒 SECURITY (SANGAT PENTING!)
**JANGAN PERNAH UPLOAD** informasi berikut ke repository publik (GitHub/GitLab):
- `API Hash`
- `Bot Token` (jika ada)
- `Telegram Session`
- `OTP` / `Password 2FA`
- `session.json` / `*.session`
- `.env`

**Rekomendasi `.gitignore`:**
Pastikan file `.gitignore` kamu berisi baris berikut:
```gitignore
node_modules/
.env
.env.*
session.json
*.session
*.session-journal
logs/
backups/
```
🧹 **Tips Membersihkan Repo:** Selalu gunakan perintah `git status` sebelum melakukan *commit* untuk memastikan tidak ada file rahasia yang tidak sengaja masuk.

---

## 🏁 Final Checklist

Sebelum bersantai, pastikan instalasi sudah 100% sempurna dengan menjalankan `fyx status`:
- [x] `settings.js : valid`
- [x] `Telegram login : session saved`
- [x] `PM2 process : running`

---

## 🤝 Credits

**FYXZPEDIA** — Telegram Userbot for Termux Android  
Telegram • Node.js • PM2 • Termux

⭐️ *Jika project ini bermanfaat, jangan lupa berikan **Star** pada repository ini ya!*