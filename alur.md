# Alur Deploy — SuperWeb IoT di VM Baru

Runbook dari VM kosong sampai dashboard jalan. Semua perintah diuji pada Ubuntu
22.04, Node v22.22.3, MySQL 8.0.46, PM2 6.0.13 — versi yang benar-benar dipakai
instalasi sekarang, bukan angka minimum di atas kertas.

Urutannya berurutan. Langkah 5 (basis data) **menghapus tabel sensor** kalau
dijalankan di database yang sudah berisi — baca peringatannya sebelum menekan
enter.

---

## Daftar Isi

1. [Prasyarat VM](#1-prasyarat-vm)
2. [Paket yang dipasang](#2-paket-yang-dipasang)
3. [Ambil kode](#3-ambil-kode)
4. [Environment](#4-environment)
5. [Basis data](#5-basis-data)
6. [Build](#6-build)
7. [PM2](#7-pm2)
8. [Buka port](#8-buka-port)
9. [Verifikasi](#9-verifikasi)
10. [Cara update](#10-cara-update)
11. [Kalau bermasalah](#11-kalau-bermasalah)
12. [Cadangan & pemeliharaan](#12-cadangan--pemeliharaan)

---

## 1. Prasyarat VM

| Kebutuhan | Nilai | Alasan |
|---|---|---|
| OS | Ubuntu 22.04 LTS x86_64 | `sharp` memakai biner prebuilt glibc; di Alpine/musl harus dikompilasi sendiri |
| RAM | ≥ 4 GB | `next build` sendiri butuh ±2 GB; render heatmap memakai buffer gambar |
| Disk | ≥ 20 GB | database ±100 MB, `data/heatmap/` tumbuh ±81 MB/hari sebelum dipangkas |
| CPU | 2 vCPU cukup | render heatmap 268 ms/frame, tidak berat |

### Jaringan — bagian yang paling sering salah

**VM ini yang harus bisa menjangkau NVR, bukan browser pemakainya.** Seluruh
lalu lintas NVR diproksikan lewat server: video, anotasi AI, gambar bukti,
semuanya. Browser cukup bisa membuka aplikasi ini.

Keluar dari VM (ke `NVR_HOST`, default `192.168.88.248`):

| Port | Protokol | Untuk |
|---|---|---|
| 443 | HTTPS | login, get-stream, byte video MPEG-TS, WebSocket `wss://…/wsai/` |
| 8989 | HTTP | API riwayat (visitor counting, antrean, heatmap) |
| 9088 | HTTP | layanan perawatan (tombol "Bersihkan memori NVR") |

Masuk ke VM: **14546/tcp** dari jaringan pemakai.

Uji sebelum lanjut — kalau salah satu gagal, betulkan dulu jaringannya:

```bash
curl -sk -o /dev/null -w "443  → %{http_code}\n" https://192.168.88.248/
curl -s  -o /dev/null -w "8989 → %{http_code}\n" http://192.168.88.248:8989/
curl -s  -o /dev/null -w "9088 → %{http_code}\n" http://192.168.88.248:9088/web-hardware/api.php
```

### Browser pemakai

Stream kamera berisi **HEVC/H.265**. Wajib **Chrome atau Edge terbaru** —
Firefox dan Chromium tanpa codec proprietary tidak punya dekodernya. Aplikasi
sudah memeriksa ini di awal dan menampilkan pesan jelas, bukan layar hitam.

---

## 2. Paket yang dipasang

```bash
sudo apt update
sudo apt install -y curl git build-essential

# Node.js 22 (LTS) — repo NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# MySQL 8
sudo apt install -y mysql-server
sudo systemctl enable --now mysql

# PM2 (global)
sudo npm install -g pm2

node -v && npm -v && mysql --version && pm2 -v
```

Tidak ada paket sistem tambahan untuk `sharp` (renderer heatmap) di Ubuntu
x86_64 — binernya sudah prebuilt. Tidak ada Nginx dalam alur ini; Next.js
melayani port 14546 langsung. Kalau nanti mau di depan reverse proxy, lihat
catatan di §8.

---

## 3. Ambil kode

```bash
sudo mkdir -p /opt/superweb && sudo chown "$USER" /opt/superweb
cd /opt/superweb
git clone https://github.com/RazorBold/web_tes.git
cd web_tes

npm ci        # `ci`, bukan `install` — mengikuti package-lock.json persis
```

---

## 4. Environment

```bash
cp .env.example .env.local
nano .env.local
```

Yang **wajib** diisi (sisanya boleh kosong):

| Variabel | Contoh | Catatan |
|---|---|---|
| `DB_HOST` `DB_PORT` `DB_NAME` `DB_USER` `DB_PASSWORD` | `localhost` `3306` `superweb_iot` `dbadmin` `…` | dibuat di §5 |
| `NVR_HOST` | `192.168.88.248` | tanpa `http://` |
| `NVR_PORT` | `443` | |
| `NVR_USERNAME` `NVR_PASSWORD` | | akun NVR |
| `NVR_HISTORY_URL` | `http://192.168.88.248:8989` | pakai `http://`, bukan https |
| `NVR_HISTORY_JWT_SECRET` | | **baca peringatan di bawah** |
| `DEEPSEEK_API_KEY` | `sk-…` | boleh kosong kalau asisten AI tidak dipakai |

> ### ⚠️ Tanda `$` di dalam secret wajib di-escape
>
> `NVR_HISTORY_JWT_SECRET` mengandung `$`. dotenv memperlakukannya sebagai nama
> variabel dan **memotong nilainya tanpa peringatan sedikit pun**. Tanda kutip
> tunggal TIDAK menolong.
>
> ```
> SALAH  : NVR_HISTORY_JWT_SECRET=abc$14jAng4n
> SALAH  : NVR_HISTORY_JWT_SECRET='abc$14jAng4n'
> BENAR  : NVR_HISTORY_JWT_SECRET=abc\$14jAng4n
> ```
>
> Gejala kalau salah: kartu Visitor Counting, Crowd Detection, dan Heatmap
> kosong, log berisi `invalid or expired token` — padahal login NVR normal dan
> live stream jalan. Sulit ditebak karena yang gagal cuma layanan port 8989.
>
> Periksa nilainya benar-benar utuh — cara paling langsung, tanpa perkakas
> tambahan: minta API riwayat menjawab. Kalau secret-nya terpotong, endpoint ini
> membalas galat token; kalau utuh, ia membalas angka.
>
> ```bash
> curl -s http://localhost:14546/api/v1/cctv/queue/overview | head -c 200; echo
> ```
>
> Bisa juga membandingkan panjangnya langsung dari berkas (tanpa mengurai
> escape), lalu cocokkan dengan secret aslinya:
>
> ```bash
> grep '^NVR_HISTORY_JWT_SECRET=' .env.local | sed 's/^[^=]*=//' | tr -d '\\' | wc -c
> ```

---

## 5. Basis data

### 5a. Buat database & user

```bash
sudo mysql <<'SQL'
CREATE DATABASE IF NOT EXISTS superweb_iot
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'dbadmin'@'localhost' IDENTIFIED BY 'GANTI_PASSWORD_INI';
GRANT ALL PRIVILEGES ON superweb_iot.* TO 'dbadmin'@'localhost';
FLUSH PRIVILEGES;
SQL
```

### 5b. Tabel sensor + data awal

> **⚠️ MENGHAPUS DATA.** `sql/schema.sql` diawali `DROP TABLE IF EXISTS` untuk
> 18 tabel sensor (water, power, fleet, flood, weather, temphum, alerts,
> devices). Aman di VM baru; di server berisi, ini **membuang seluruh riwayat
> sensor**. Tabel CCTV tidak ikut terhapus — berkasnya terpisah.

```bash
npm run db:setup
```

### 5c. Tabel CCTV — TIDAK termasuk di atas

`db:setup` hanya menjalankan `schema.sql`. Empat tabel CCTV harus dipasang
sendiri (semuanya `CREATE TABLE IF NOT EXISTS`, jadi aman diulang):

```bash
for f in sql/cctv-visitor.sql sql/cctv-queue.sql sql/cctv-heatmap.sql; do
  mysql -u dbadmin -p superweb_iot < "$f" && echo "✓ $f"
done
```

Pastikan 22 tabel terbentuk:

```bash
mysql -u dbadmin -p -N -e \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='superweb_iot'"
# harus: 22
```

---

## 6. Build

```bash
npm run build
```

`data/heatmap/` tidak perlu dibuat manual — dibuat sendiri saat frame pertama
dirender. Yang penting proses PM2 punya izin tulis di direktori proyek.

---

## 7. PM2

```bash
pm2 start ecosystem.config.js
pm2 save                                    # simpan daftar proses
pm2 startup                                 # cetak perintah systemd; jalankan yang dicetak
```

Tiga proses berjalan:

| Proses | Fungsi | Wajib? |
|---|---|---|
| `superweb-iot-web` | Next.js produksi, port **14546** | ya |
| `superweb-iot-cctv-sync` | menarik visitor, antrean, heatmap dari NVR tiap **2 menit** | **ya** |
| `superweb-iot-simulator` | mengisi data sensor tiap 10 detik + pangkas retensi tiap jam | ya selama sensor masih simulasi |

> **`cctv-sync` bukan pelengkap.** API NVR hanya menyimpan **hari berjalan**.
> Kalau seharian tidak ada yang membuka dashboard dan proses ini mati, lewat
> tengah malam data hari itu **hilang permanen** — tidak ada tempat lain untuk
> mengambilnya lagi.

> **Pemangkasan retensi menumpang di `simulator`.** Retensi 3 hari
> (`src/config/retention.ts`) dijalankan tiap jam dari proses itu. Kalau suatu
> saat simulator dimatikan karena sensor sudah nyata, pasang penggantinya:
> `0 * * * * cd /opt/superweb/web_tes && node scripts/db-prune.mjs`

---

## 8. Buka port

```bash
sudo ufw allow 14546/tcp
sudo ufw status
```

Kalau VM di belakang NAT/router, **tambahkan juga port forwarding 14546** di
perangkat itu. Ini pernah menghabiskan waktu: aplikasi jalan sempurna di LAN
tapi tidak bisa dibuka dari luar, karena router masih meneruskan port yang lama.

Mau ganti port? Ubah `WEB_PORT` di `ecosystem.config.js` — satu tempat, ikut
terpakai untuk URL sinkronisasi CCTV. Lalu **`pm2 delete` + `pm2 start`**, bukan
`restart` (lihat §11).

Pakai Nginx di depan? Yang perlu diperhatikan: route stream dan SSE **tidak
boleh di-buffer**.

```nginx
location /api/v1/cctv/ {
    proxy_pass http://127.0.0.1:14546;
    proxy_buffering off;
    proxy_read_timeout 3600s;
    proxy_http_version 1.1;
}
```

---

## 9. Verifikasi

Jalankan berurutan; semuanya harus lulus.

```bash
# 1. Halaman terbuka
curl -s -o /dev/null -w "web        → %{http_code}\n" http://localhost:14546/cctv/v1

# 2. Daftar kamera (uji NVR login + get-stream)
curl -s http://localhost:14546/api/v1/cctv/cameras | head -c 200; echo

# 3. Video benar-benar mengalir (putus di batas ukuran = BERHASIL)
timeout 8 curl -s -m 8 --max-filesize 250000 -o /dev/null \
  -w "stream     → %{http_code}\n" \
  http://localhost:14546/api/v1/cctv/cameras/visitor/stream \
  || echo "stream     → byte mengalir (putus di batas ukuran, ini benar)"

# 4. Riwayat/database (uji JWT 8989 — di sinilah masalah "$" muncul)
curl -s http://localhost:14546/api/v1/cctv/visitor/overview | head -c 200; echo
curl -s http://localhost:14546/api/v1/cctv/queue/overview   | head -c 200; echo

# 5. Sensor
curl -s -o /dev/null -w "water      → %{http_code}\n" http://localhost:14546/api/v1/water/overview

# 6. Proses
pm2 list
```

Anotasi AI (bounding box) — tiga koneksi SSE dibuka bersamaan, semuanya harus
menerima pesan:

```bash
for cam in visitor antrian; do
  echo -n "$cam: "; timeout 12 curl -sN "http://localhost:14546/api/v1/cctv/cameras/$cam/events" \
    | grep -c "event: annotations"
done
```

Setelah **±5 menit**, heatmap harus mulai terisi:

```bash
curl -s "http://localhost:14546/api/v1/cctv/heatmap/frames?limit=3" | head -c 300; echo
```

Terakhir buka `http://<ip-vm>:14546/` di **Chrome/Edge** dan pastikan video
kedua kamera benar-benar tampil, bukan cuma bounding box di atas layar hitam.

---

## 10. Cara update

```bash
cd /opt/superweb/web_tes
git pull
npm ci                 # hanya bila package-lock.json berubah
npm run build
pm2 restart superweb-iot-web
```

Pakai **nama** proses, bukan id — id berubah setiap proses di-`delete` lalu
di-`start` lagi.

Kalau ada berkas SQL baru di `sql/`, jalankan yang baru itu saja. **Jangan**
mengulang `npm run db:setup` di server berisi (§5b).

---

## 11. Kalau bermasalah

Kumpulan jebakan yang sudah pernah menghabiskan waktu, dengan gejalanya.

| Gejala | Sebab | Perbaikan |
|---|---|---|
| Kartu Visitor/Crowd/Heatmap kosong, log `invalid or expired token`, tapi live stream jalan | `$` di `NVR_HISTORY_JWT_SECRET` termakan dotenv | escape jadi `\$` (§4) |
| Layar hitam, "Browser tidak bisa memutar HEVC" | browser tanpa dekoder H.265 | pakai Chrome/Edge |
| Pemutar mentok di "Menyambung" selamanya | profil stream yang diminta kosong di kamera itu | hanya `Streaming 2` yang berisi; server sudah menjaganya dan membalas 502 berpesan |
| Salah satu kamera hidup tanpa bounding box | koneksi wsai dibuka berdempetan | sudah ditangani jeda 1200 ms; kalau muncul lagi, naikkan `OPEN_STAGGER_MS` di `src/lib/cctv-ai-socket.ts` |
| Angka kartu berhenti bertambah, live stream normal | GUID kamera diganti di NVR → nomor channel riwayat ikut berganti | cara menemukan nomor barunya ada di komentar `src/lib/cctv-history.ts` |
| Ganti env/args di `ecosystem.config.js` tidak berefek | `pm2 restart --update-env` **tidak** membaca ulang berkas itu | `pm2 delete <nama>` lalu `pm2 start ecosystem.config.js`, kemudian `pm2 save` |
| Bisa dibuka dari LAN, tidak dari luar | port forwarding router belum diarahkan ke 14546 | §8 |
| `502` sesekali pada satu kamera | NVR menutup koneksi tanpa isi saat sibuk | wajar; pemutar menyambung ulang sendiri setelah 4 detik |
| Disk membengkak | retensi tidak jalan (proses simulator mati) | `node scripts/db-prune.mjs`, lalu pastikan penjadwalnya hidup (§7) |

Log:

```bash
pm2 logs superweb-iot-web --lines 100
pm2 logs superweb-iot-cctv-sync --lines 50    # ringkasan tiap 2 menit
```

---

## 12. Cadangan & pemeliharaan

```bash
# Basis data
mysqldump -u dbadmin -p superweb_iot | gzip > /backup/superweb_$(date +%F).sql.gz

# .env.local — TIDAK ada di git, satu-satunya salinan ada di server
cp .env.local /backup/env.local.$(date +%F)
```

`data/heatmap/` **tidak perlu dicadangkan** — isinya hasil render yang dibangun
ulang sendiri dari NVR, dan dipangkas mengikuti retensi 3 hari.

Yang tidak ikut ke git dan harus disiapkan manual di tiap VM:

| Berkas | Isi |
|---|---|
| `.env.local` | seluruh kredensial |
| `APIGETDATA_CCTVAI.json` | koleksi Postman NVR (memuat secret JWT) |
| `data/` | hasil render heatmap |
