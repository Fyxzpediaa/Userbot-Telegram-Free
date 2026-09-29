# Fyxzpedia Ubot Installer (Termux)

Auto installer + runner untuk **Fyxzpedia Ubot** (Hello-Ubot FullButton V4) yang berjalan native di Android **Termux**.
Tanpa root, tanpa `sudo`, tanpa `systemd`, tanpa Docker. Semua script memakai `pkg`, `npm`, dan PM2.

```bash
unzip fyxzpedia-installer.zip
cd fyxzpedia-installer
bash install.sh
```

Setelah selesai:

```bash
fyx status
fyx start
fyx logs
```

## Requirements

- Termux terbaru dari F-Droid atau GitHub (jangan campur sumber instalasi).
- Koneksi internet stabil saat install.
- Node.js >= 18 (dipasang otomatis: `nodejs-lts`), npm, curl, tar, PM2 (dipasang otomatis setelah kamu setuju).
- Untuk autostart setelah HP reboot: aplikasi **Termux:Boot** (lihat bagian Boot).

## Installation

`install.sh` menjalankan 7 langkah: cek Termux, Node.js, npm, PM2, siapkan bot, buat `settings.js`, login Telegram + start.

Instalasi berjalan **dua kali aman**. Jika sudah terpasang, muncul menu:
`1. Repair  2. Update  3. Reconfigure  4. Cancel`. Settings tidak dihapus tanpa persetujuanmu.

Sumber bot ada dua mode (dipilih saat install):

| Mode | Sumber | Catatan |
|---|---|---|
| A. Local package | folder `bot/` di dalam installer | tidak butuh internet selain `npm install` |
| B. Private GitHub Release | release di repo privat | memakai **token milik pengguna**, lihat bagian GitHub |

## Lokasi file

```
~/.fyxzpedia/
├── bot/            source bot (aman ditimpa saat update)
├── config/         settings.js (+ release.conf bila mode GitHub)
├── data/           session.json + dbbot.json  (sesi Telegram & database bot)
├── logs/           out.log, error.log, boot.log
├── backups/        settings-YYYY-MM-DD-HHMMSS.js, backup source bot (3 terakhir)
├── releases/       paket release yang diunduh (3 terakhir)
├── manager/        salinan script installer (dipakai oleh `fyx`)
└── version
```

`bot/settings.js`, `bot/session.json`, dan `bot/dbbot.json` adalah **symlink** ke `config/` dan `data/`.
Bot membaca file itu secara relatif dari foldernya (`require('./settings')`, `session.json`, `dbbot.json`),
jadi tidak ada satu baris pun source bot yang diubah, dan **update tidak pernah menyentuh data pengguna**.

## Configuration

Installer membuat `~/.fyxzpedia/config/settings.js` dari `config/settings.template.js`.
Template mengikuti **struktur asli** `settings.js` bot (properti flat: `api_id`, `api_hash`, `id_owner`, `bot_token`, ...),
tetap `module.exports = {...}`, dan format `menuImage: "..."` dipertahankan karena bot mengubahnya lewat regex
(`.setthumbnail`). Input rahasia (API Hash, Bot Token, API Key) tidak ditampilkan di layar.

| Prompt | Properti | Wajib |
|---|---|---|
| Bot Name | `name` | ya |
| Owner Telegram ID | `id_owner` | ya (angka, cek via @userinfobot) |
| API ID / API Hash | `api_id` / `api_hash` | ya (my.telegram.org) |
| Bot Token + Bot Username | `bot_token` / `botUsername` | tidak (untuk menu tombol) |
| Menu image URL | `menuImage` | tidak |
| Server API URL / Key | `fyxzgatewayBaseUrl` / `fyxzgatewayApiKey` | tidak (QRIS otomatis) |
| QRIS image, DANA, GoPay, OVO | `qrisImage`, `payment.*` | tidak |

Catatan: prefix perintah bot (default `.`) **bukan** bagian `settings.js`; ubah lewat perintah bot `.setprefix`.

Setelah dibuat, file divalidasi (`node --check`, tipe data, format token, field wajib). Jika gagal:
`ERROR: settings.js is invalid. Installation aborted.` dan file lama tidak disentuh. Secret tidak pernah dicetak.

Jika kamu ingin menyediakan default untuk penerima installer, salin `config/config.example.json` menjadi
`config/config.json` sebelum di-ZIP (hanya repo/pola nama asset/mode; **jangan** isi token).

## Login Telegram pertama

Login pertama bersifat interaktif (nomor HP, kode OTP, sandi 2FA) sehingga tidak bisa dijawab oleh PM2.
Installer menawarkannya di langkah 7. Kapan saja: `fyx login`. Setelah muncul `[SUCCESS] Userbot online`, tekan **CTRL+C**;
sesi tersimpan di `~/.fyxzpedia/data/session.json`. `fyx start` menolak berjalan tanpa sesi.

## Running & PM2

| Perintah | Fungsi |
|---|---|
| `fyx start` / `bash run.sh` | jalankan bot; jika sudah berjalan: `Fyxzpedia Ubot is already running.` (tidak ada proses ganda) |
| `fyx stop` | hentikan (`pm2 stop`) |
| `fyx restart` | restart (`pm2 restart`) |
| `fyx status` | versi, validitas settings, sesi, status PM2, autostart |
| `fyx logs` | `pm2 logs fyxzpedia-ubot` (mis. `fyx logs --lines 200`) |
| `fyx settings` | menu: edit, reconfigure, validate, backup, restore |
| `fyx update` | update dari GitHub Release |
| `fyx boot enable\|disable\|status` | autostart |
| `fyx version` | versi manager dan bot |
| `fyx uninstall` | hapus bot |

Nama proses PM2: `fyxzpedia-ubot`. Log ditulis ke `~/.fyxzpedia/logs/`. `fyx` bisa dipanggil dari folder mana pun.
Saat start, `termux-wake-lock` dipanggil bila tersedia.

## Update

```
$ fyx update
Checking latest release...
Current version : 1.0.0
Latest version  : 1.1.0
Update available.
Download → Verify → Backup configuration → Install update → Restore configuration → Restart
```

- `settings.js` dibackup ke `backups/` (format `settings-2026-09-29-153000.js`) sebelum perubahan, lalu tetap dipakai.
- Sesi Telegram dan `dbbot.json` tidak disentuh. `node_modules` dipakai ulang jika `package.json` tidak berubah.
- Jika `npm install` gagal, bot lama otomatis dikembalikan.
- Mode Local: unduh installer ZIP baru, jalankan `bash install.sh`, pilih **Update installation**.

## Private GitHub Release

Installer **tidak berisi token pemilik**. Pengguna memasukkan token miliknya sendiri:

- Token hanya diminta lewat prompt tersembunyi (atau environment variable `GH_TOKEN` yang sudah kamu set), dipakai selama proses berjalan, lalu `unset GH_TOKEN`.
- Token dikirim ke `curl` melalui stdin (`curl -K -`), jadi tidak muncul di `ps`, di riwayat shell, di log, di `settings.js`, maupun di file mana pun. Yang disimpan hanya nama repo dan pola nama asset (`config/release.conf`), sehingga `fyx update` meminta token lagi.
- Gunakan fine-grained token dengan akses **read-only** (Contents) ke repo tersebut saja.

Cara membuat release (di komputermu):

```bash
tar -czf fyxzpedia-ubot-v1.0.0.tar.gz -C bot .          # index.js + package.json di root paket
sha256sum fyxzpedia-ubot-v1.0.0.tar.gz > fyxzpedia-ubot-v1.0.0.tar.gz.sha256
gh release create v1.0.0 fyxzpedia-ubot-v1.0.0.tar.gz fyxzpedia-ubot-v1.0.0.tar.gz.sha256
```

Nama asset harus cocok dengan `fyxzpedia-ubot-*.tar.gz`. Tag `v1.0.0` menjadi versi `1.0.0`.
Jika ada file `.sha256`, paket **diverifikasi sebelum diekstrak**; bila tidak cocok:
`ERROR: Package verification failed. The downloaded package will not be installed.`
Jika release tidak punya checksum, installer memperingatkan dan default-nya menolak.
Paket dengan path berbahaya (`/` di depan atau `..`) ditolak.

Batasan jujur: checksum berasal dari release yang sama, jadi ia melindungi dari file rusak atau unduhan terpotong,
bukan dari pihak yang sudah menguasai repo/token-mu.

## Boot (autostart)

Termux tidak punya systemd. Autostart butuh aplikasi terpisah **Termux:Boot**:

1. Pasang Termux:Boot dari sumber yang sama dengan Termux (F-Droid/GitHub).
2. Buka aplikasinya minimal sekali.
3. `fyx boot enable` (atau jawab Y saat install).
4. Set baterai Termux ke **Unrestricted**. Android tetap bisa menghentikan proses; ini bukan jaminan uptime.

`fyx boot enable` menulis `~/.termux/boot/fyxzpedia-ubot` yang menjalankan `fyx start --boot`.
Bila kamu sengaja menjalankan `fyx stop`, bot tidak dinyalakan otomatis saat boot berikutnya sampai `fyx start`.

## Uninstall

`fyx uninstall` menghentikan dan menghapus proses PM2, lalu bertanya `Remove configuration too? [y/N]` (default **N**):

- N: `Bot removed. Configuration preserved.` (`config/`, `data/` sesi, `backups/` tetap ada).
- Y: `Bot and configuration removed.` (seluruh `~/.fyxzpedia`, termasuk sesi Telegram).

## Security

- Tidak ada token GitHub, bot token, API secret, atau password di source installer.
- `settings.js` dan `session.json` dibuat dengan izin `600`; folder konfigurasi `700`.
- File yang tidak boleh di-commit ada di `.gitignore` (`settings.js`, `.env`, `*.key`, `*.pem`, `session.json`, ...).
- **Sesi Telegram = akses penuh ke akunmu.** Jangan dibagikan. Plugin `.backup` dan tombol backup di bot membuat ZIP yang berisi
  `settings.js` (API key/token); jangan disebar.
- `settings.js` asli dari source yang diberikan berisi kredensial nyata (API ID/Hash, gateway key, nomor pembayaran).
  Itu **sengaja tidak dimasukkan** ke `bot/` installer. Jika ZIP source itu pernah dibagikan, pertimbangkan merotasi
  API Hash (my.telegram.org) dan gateway key.
- Obfuscation opsional: `bash tools/obfuscate-bot.sh` (butuh internet, hasil di `bot-obfuscated/`, **uji dulu**).
  Obfuscation hanya mempersulit reverse engineering, bukan proteksi mutlak. Logika yang benar-benar rahasia
  (validasi lisensi, algoritma proprietary, kredensial privat, otorisasi) harus di server-side
  (`Termux Bot → HTTPS → Fyxzpedia API`), bukan di perangkat pengguna.

## Troubleshooting

| Gejala | Solusi |
|---|---|
| `This installer is designed for Termux.` | Jalankan di Termux, bukan di Linux/proot biasa. |
| `npm install` gagal | Cek internet, lalu `bash install.sh` → Repair. Bila error kompilasi native: `pkg install python make clang`. |
| `Node.js ... too old` | `pkg upgrade nodejs-lts` |
| `No Telegram session yet` | `fyx login` |
| Status PM2 `errored` / tidak online | `fyx logs --lines 100`; cek `fyx settings` → Validate |
| `fyx: command not found` | Buka sesi Termux baru; atau `bash ~/.fyxzpedia/manager/install.sh` → Repair |
| Bot mati sendiri di background | `termux-wake-lock`, baterai Termux Unrestricted, jangan Force Stop |
| `Could not read the release` | Cek nama repo `owner/repo`, izin token, dan asset bernama `fyxzpedia-ubot-*.tar.gz` |

Struktur ZIP: setelah `unzip fyxzpedia-installer.zip`, folder `fyxzpedia-installer/` langsung berisi `install.sh`, `update.sh`, dst.
Membuat ZIP: `cd <folder induk> && zip -r fyxzpedia-installer.zip fyxzpedia-installer -x '*/.git/*'`.
