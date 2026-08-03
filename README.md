# SuperWeb IoT — Merah Putih IoT Platform

Dashboard monitoring **IoT multi-modul**: CCTV & AI analytics dari NVR sungguhan, smart water
meter, fleet tracking, power meter, weather station, flood sensor, serta temp/humidity & air
quality.

Dibangun dengan **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4**, dengan
**MySQL** sebagai penyimpan dan **Route Handler** sebagai lapisan API-nya sendiri — tidak ada
backend terpisah.

> **Catatan:** ini bukan Next.js versi standar — ada breaking changes pada API & konvensi.
> Selalu rujuk `node_modules/next/dist/docs/` sebelum menulis kode Next.js (lihat `AGENTS.md`).

---

## Daftar Isi

- [Arsitektur](#arsitektur)
- [Modul CCTV & AI](#modul-cctv--ai)
- [Modul sensor IoT](#modul-sensor-iot)
- [Asisten LLM](#asisten-llm)
- [Basis data](#basis-data)
- [Proses latar (PM2)](#proses-latar-pm2)
- [Menjalankan](#menjalankan)
- [Environment variables](#environment-variables)
- [Struktur proyek](#struktur-proyek)
- [Catatan lapangan](#catatan-lapangan)

---

## Arsitektur

Tiga sumber data yang sifatnya berbeda, dan itulah yang membentuk seluruh rancangan:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ BROWSER                                                                 │
│   React 19 · React Query (polling) · Zustand · ECharts · Leaflet        │
│   mpegts.js (HEVC) untuk video  ·  EventSource untuk anotasi AI         │
└───────────────┬──────────────────────────────┬──────────────────────────┘
                │ HTTP / SSE                   │
┌───────────────▼──────────────────────────────▼──────────────────────────┐
│ NEXT.JS ROUTE HANDLER  (satu proses, runtime nodejs)                    │
│   /api/v1/cctv/*      proxy stream, SSE anotasi, riwayat, heatmap       │
│   /api/v1/{water,power,fleet,flood,weather,temphum,alerts,devices}      │
│   /api/v1/assistant/chat                                               │
└───┬─────────────────────┬───────────────────────────┬───────────────────┘
    │ mysql2              │ node:https / ws           │ https
┌───▼──────────┐  ┌───────▼─────────────────────┐  ┌──▼───────────────┐
│ MySQL        │  │ NVR  192.168.88.248         │  │ DeepSeek API     │
│ 22 tabel     │  │  :443  login + get-stream   │  │  chat completion │
│ retensi 3hr  │  │  :443  /wsai/  anotasi AI   │  └──────────────────┘
│              │  │  :8989 history-object (JWT) │
└──────────────┘  └─────────────────────────────┘
```

**Kenapa semuanya lewat server, bukan langsung dari browser:**

1. API NVR tidak mengirim header CORS sama sekali.
2. Sertifikat NVR sah untuk `*.icode.id` tapi diakses lewat alamat IP, sehingga verifikasi nama
   host gagal. Untuk `wss://` tidak ada tombol "lanjutkan saja" seperti pada halaman HTTPS.
3. NVR hanya mengizinkan **satu token stream aktif per akun**. Token diperiksa hanya saat koneksi
   dibuka, jadi beberapa kamera bisa mengalir bersamaan **asal proses terbit-token → buka-koneksi
   tidak pernah disela**. Itu dijamin antrean serial di `src/lib/cctv-nvr.ts`.
4. Password NVR, secret JWT, dan kunci DeepSeek tidak boleh sampai ke browser.

---

## Modul CCTV & AI

### Kamera

Dua kamera fisik, tiga kanal AI. Kanal heatmap dan antrean berasal dari kamera fisik yang sama,
jadi hanya satu yang ditonton — GUID heatmap tetap terdaftar karena masih dipakai menarik gambar
riwayat, tapi ditandai `historyOnly` supaya tidak muncul sebagai pilihan tontonan.

| Id | Nama tampil | Fungsi AI | Ditonton |
|----|-------------|-----------|----------|
| `visitor` | Kamera 1 — Visitor Counting | garis hitung masuk/keluar | ya |
| `antrian` | Kamera 2 — Antrian dan Heatmap | zona antrean (hunian & lama tunggu) | ya |
| `heatmap` | Kamera 2 — Heatmap | titik pijak pengunjung | hanya riwayat |

### Video: MPEG-TS berisi HEVC

Meski path-nya bernama `streamRTSPnew`, yang keluar dari NVR adalah **MPEG-TS berisi H.265/HEVC**
lewat HTTP biasa. Konsekuensinya:

- `mpegts.js` dari npm **tidak mendukung HEVC**. Repo ini memakai build khusus yang di-vendor di
  [`public/vendor/mpegts.js`](public/vendor/mpegts.js).
- Pemutarannya tetap bergantung pada dekoder HEVC browser. Ada preflight
  `MediaSource.isTypeSupported()` sebelum stream dibuka — tanpa itu gejalanya menyesatkan: lencana
  sempat menyala "Live" lalu gagal diam-diam di `addSourceBuffer`.
- Hanya profil **`Streaming 2` (640×360)** yang berisi. `Streaming 1` dan `Streaming 3` membalas
  HTTP 200 lalu menutup koneksi **tanpa satu byte pun**. Route stream menahan respons sampai byte
  pertama benar-benar datang, lalu mengembalikan 502 berpesan jelas — kalau 200 kosong diteruskan
  apa adanya, pemutar menggantung di "Menyambung" selamanya tanpa pernah dianggap galat.

### Anotasi AI: WebSocket → SSE

Kotak deteksi, garis hitung, dan zona datang dari `wss://<nvr>/wsai/`. Route Handler Next tidak
bisa di-upgrade jadi WebSocket — dan memang tidak perlu, anotasi hanya mengalir satu arah, jadi
diteruskan ke browser sebagai **Server-Sent Events**.

> **Koneksi wsai WAJIB dibuka berjeda.** Terukur dengan tiga kanal dibuka bersamaan lalu diamati
> 45 detik: jeda 0 ms → hanya 1 dari 3 kanal berisi, dua lainnya init OK tapi **nol pesan**; jeda
> 1000 ms → 3 dari 3 berisi. Dengan lima kanal serentak, satu koneksi bahkan menerima pesan milik
> GUID lain. Inilah penyebab gejala lama "kadang tidak ada bounding box padahal stream jalan".
> Antreannya ada di `OPEN_STAGGER_MS`, [`src/lib/cctv-ai-socket.ts`](src/lib/cctv-ai-socket.ts).

Overlay digambar di canvas tiga lapis — zona, garis hitung, lalu kotak deteksi paling atas.
Penskalaannya bertumpu pada **resolusi acuan dari pesan init**, bukan ukuran video: acuan AI tidak
selalu sama dengan resolusi stream, dan pernah berubah sendiri dari 1920×1080 ke 640×360.

Arah **IN/OUT** pada garis hitung diturunkan dari garisnya sendiri — sisi IN adalah normal kanan
dari vektor `x1,y1 → x2,y2`. Jadi garis tegak otomatis memberi IN/OUT kiri-kanan, dan menukar
urutan titiknya membalik keduanya.

### Riwayat: API terpisah di port 8989

Layanan yang berbeda dari server streaming, dengan **autentikasi JWT HS256 buatan sendiri
berpayload kosong** — bukan token login. Channel-nya terikat pada GUID; waktu GUID diganti, nomor
channel-nya ikut berganti dan tidak ada endpoint yang mendaftarnya. Cara menemukannya (memindai
rentang dengan jendela pendek lalu mencocokkan bentuk data) didokumentasikan di
[`src/lib/cctv-history.ts`](src/lib/cctv-history.ts).

> ⚠️ Channel deteksi heatmap memuat potongan JPEG base64 per objek — ±173 MB/jam. Permintaan 24 jam
> pernah membuat layanan 8989 berhenti merespons. Selalu pakai jendela sempit.

### Heatmap: dirender di latar, disimpan sebagai berkas

Kartu heatmap **tidak** merender apa pun saat dibuka. Alasannya terukur: mengambil titik deteksi
dari NVR makan 2,3 detik rata-rata (sampai 7,9 detik saat ramai), sementara gambar historis tidak
pernah berubah — merender saat kartu dibuka berarti tiap penonton membayar ongkos yang sama untuk
hasil yang persis sama.

```
penjadwal → discoverFrames()  catat gambar baru sebagai `pending`
          → renderOne()       ambil gambar + titik deteksi (paralel)
                              → titik pijak = tengah-bawah kotak orang
                              → blur gaussian di grid ¼ resolusi
                              → colormap jet → komposit → JPEG + thumbnail
          → simpan berkas ke data/heatmap/, katalognya ke MySQL
```

Gambarnya **tidak** disimpan di MySQL: satu frame ±253 KB × ±320 frame/hari = ±81 MB/hari, yang
akan mendominasi database dan memberati tiap backup tanpa satu pun keuntungan — tidak ada yang
di-query dari isi gambar. Render terukur 268 ms, jadi bukan hambatannya.

### Varian tampilan V1 / V2

Halaman CCTV punya dua varian tampilan yang berdiri sendiri:

| Route | Isi |
|-------|-----|
| `/cctv` | pengalihan 307 ke varian bawaan |
| `/cctv/v1` | tampilan aktif |
| `/cctv/v2` | salinan bebas dirombak |

Yang **tidak** diduplikasi adalah mesinnya: pemutar stream dan overlay bounding box ada di
`src/components/cctv/shared/` dan dipakai kedua varian, supaya perbaikan seperti jeda koneksi wsai
cukup dikerjakan sekali. Kalau V2 butuh pemutar yang tampilannya lain, bungkus komponen shared itu
— jangan disalin.

---

## Modul sensor IoT

Water, power, fleet, flood, weather, dan temphum dibaca dari MySQL lewat Route Handler dengan pola
yang sama: `overview` untuk ringkasan, daftar entitas, dan `history` per entitas. Datanya diisi
oleh `scripts/live-simulator.mjs` — modul-modul ini belum tersambung ke perangkat sungguhan,
berbeda dengan CCTV yang sudah memakai NVR nyata.

| Route | Modul |
|-------|-------|
| `/cctv/v1`, `/cctv/v2` | CCTV & AI analytics (NVR sungguhan) |
| `/water` | Smart water meter |
| `/power` | Power meter |
| `/fleet` | Fleet tracking (peta GPS) |
| `/flood` | Flood smart meter |
| `/weather` | Weather station |
| `/temphum` | Temp/humidity & air quality |
| `/alerts` | Alert & notifikasi |
| `/analytics` | Analitik lintas modul |
| `/reports` | Laporan & export |
| `/devices` | Inventaris perangkat |
| `/settings`, `/settings/integrations` | Pengaturan & integrasi |
| `/` | Overview dashboard (tautannya sedang disembunyikan dari sidebar) |

---

## Asisten LLM

Panel tanya-jawab memakai **DeepSeek**. Kuncinya hanya ada di server; browser bicara ke
`/api/v1/assistant/chat`.

Sebelum bertanya ke model, [`src/lib/assistant-context.ts`](src/lib/assistant-context.ts) menyusun
potret keadaan platform (angka dari MySQL, di-cache 20 detik) dan menyisipkannya ke system prompt,
disertai larangan tegas mengarang angka. Tanpa itu, jawabannya terdengar meyakinkan tapi isinya
tebakan.

---

## Basis data

MySQL, 22 tabel. Skema inti di [`sql/schema.sql`](sql/schema.sql); tabel CCTV dipisah per fungsi:

| Berkas | Tabel | Isi |
|--------|-------|-----|
| `sql/schema.sql` | 18 tabel | water, power, fleet, flood, weather, temphum, alerts, devices |
| `sql/cctv-visitor.sql` | `cctv_visitor_tracks`, `cctv_sync_state` | satu baris per orang yang melintas |
| `sql/cctv-queue.sql` | `cctv_queue_samples` | satu baris per sampel zona (±30 detik) |
| `sql/cctv-heatmap.sql` | `cctv_heatmap_frames` | katalog frame + path berkas, bukan gambarnya |

**Retensi 3 hari** ([`src/config/retention.ts`](src/config/retention.ts)). Pembersihannya batched
+ `OPTIMIZE`, dijalankan `scripts/db-prune.mjs` dan otomatis tiap jam dari penjadwal.

Kenapa sinkronisasi CCTV wajib jalan: **API NVR hanya menyimpan hari berjalan.** Kalau seharian
tidak ada yang membuka dashboard, lewat tengah malam data hari itu hilang permanen.

Angka Visitor Counting dihitung **per track id, bukan per event** — terukur 73% event berasal dari
10 orang yang berlama-lama di garis; menghitung per event membuat mereka membanjiri angkanya
sendirian.

---

## Proses latar (PM2)

```bash
npm run build
pm2 start ecosystem.config.js
pm2 logs
```

| Proses | Fungsi |
|--------|--------|
| `superweb-iot-web` | Next.js produksi, port **14546** |
| `superweb-iot-simulator` | mengisi data sensor + prune otomatis tiap jam |
| `superweb-iot-cctv-sync` | menarik visitor, antrean, dan heatmap dari NVR tiap 2 menit |

> `pm2 restart --update-env` **tidak** membaca ulang `ecosystem.config.js`. Untuk mengubah args
> atau env, lakukan `pm2 delete <nama>` lalu `pm2 start`, kemudian `pm2 save`.

---

## Menjalankan

```bash
# 1. Dependencies
npm install

# 2. Environment
cp .env.example .env.local     # lalu isi (lihat tabel di bawah)

# 3. Basis data
mysql -u <user> -p <db> < sql/schema.sql
mysql -u <user> -p <db> < sql/cctv-visitor.sql
mysql -u <user> -p <db> < sql/cctv-queue.sql
mysql -u <user> -p <db> < sql/cctv-heatmap.sql
node scripts/db-setup.mjs      # data awal

# 4. Jalankan
npm run dev                    # pengembangan
npm run build && npm run start # produksi
```

**Browser harus sejaringan dengan NVR** untuk melihat video, dan harus punya dekoder HEVC — Chrome
atau Edge terbaru. Chromium tanpa codec proprietary akan menampilkan pesan galat yang jelas, bukan
layar hitam diam-diam.

### Scripts

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Development server |
| `npm run build` | Build produksi |
| `npm run start` | Menjalankan hasil build |
| `npm run lint` | ESLint |
| `node scripts/db-setup.mjs` | Isi data awal |
| `node scripts/db-prune.mjs` | Pangkas data lewat batas retensi |
| `node scripts/cctv-sync.mjs [url]` | Picu sinkronisasi CCTV sekali jalan |
| `node scripts/live-simulator.mjs` | Simulator data sensor |

---

## Environment variables

Template: [`.env.example`](.env.example). Semua nilai nyata hanya di `.env.local`, yang
di-gitignore.

| Variabel | Keterangan |
|----------|-----------|
| `DB_HOST` `DB_PORT` `DB_NAME` `DB_USER` `DB_PASSWORD` | MySQL — server saja |
| `NVR_HOST` `NVR_PORT` `NVR_USERNAME` `NVR_PASSWORD` | Login & get-stream NVR — server saja |
| `NVR_HISTORY_URL` | API riwayat, port 8989 (HTTP biasa) |
| `NVR_HISTORY_JWT_SECRET` | Secret HS256 API riwayat — **lihat peringatan di bawah** |
| `DEEPSEEK_API_KEY` `DEEPSEEK_MODEL` | Asisten LLM — server saja |
| `NEXT_PUBLIC_MQTT_*` | Broker MQTT (belum dipakai modul CCTV) |
| `NEXTAUTH_URL` `NEXTAUTH_SECRET` | NextAuth |
| `NEXT_PUBLIC_MAP_*` | Tile URL, center & zoom default peta |

> ⚠️ **Tanda `$` pada secret WAJIB di-escape jadi `\$`.** dotenv memperluasnya sebagai nama
> variabel dan **memotong nilainya tanpa peringatan** — gejalanya "invalid or expired token" yang
> menyesatkan. Tanda kutip tunggal tidak menolong.

---

## Struktur proyek

```
src/
├── app/
│   ├── (dashboard)/            # semua halaman modul
│   │   └── cctv/{v1,v2}/       # dua varian tampilan CCTV
│   └── api/v1/                 # Route Handler — lapisan API-nya sendiri
├── components/
│   ├── cctv/
│   │   ├── shared/             # pemutar stream + overlay AI (JANGAN disalin per varian)
│   │   ├── v1/                 # kartu & modal varian 1
│   │   └── v2/                 # kartu & modal varian 2
│   ├── layout/                 # sidebar, topbar, footer, asisten AI
│   ├── widgets/                # widget modul sensor
│   ├── charts/                 # wrapper ECharts
│   └── maps/                   # wrapper Leaflet
├── lib/                        # akses NVR, MySQL, parsing, render heatmap, DeepSeek
├── hooks/                      # React Query per modul
├── config/                     # tema/navigasi, profil stream, retensi
├── stores/                     # Zustand
└── types/                      # kontrak data

scripts/                        # penjadwal & perkakas basis data
sql/                            # skema
public/vendor/mpegts.js         # build mpegts.js ber-HEVC
data/heatmap/                   # hasil render (gitignore)
```

---

## Catatan lapangan

Hal-hal yang tidak terbaca dari kode dan sudah pernah menyita waktu:

- **NVR tidak suka permintaan berdempetan.** Baik pembukaan stream maupun koneksi wsai harus
  diantre. Dua tempat yang menanganinya: `serialize()` di `cctv-nvr.ts` dan `OPEN_STAGGER_MS` di
  `cctv-ai-socket.ts`.
- **URL stream tidak boleh di-cache.** Tiap `get-stream` membatalkan token sebelumnya — URL simpanan
  hampir pasti sudah mati saat dipakai lagi.
- **Channel riwayat terikat GUID.** Waktu GUID diganti, kartu tetap menampilkan angka lama dari
  MySQL sementara sumbernya sudah berhenti. Gejalanya tidak terlihat seperti kerusakan.
- **Resolusi bukti berubah-ubah dari sisi NVR.** Bukti antrean pernah 960×540 lalu jadi 320×180;
  acuan AI pernah 1920×1080 lalu jadi 640×360. Semua penskalaan di aplikasi ini bertumpu pada nilai
  yang datang bersama data, bukan angka tetap.
- **Koleksi Postman `APIGETDATA_CCTVAI.json` memuat secret JWT** dan sengaja di-gitignore.

---

## Dokumentasi

| Dokumen | Isi |
|---------|-----|
| [`docs/API.md`](docs/API.md) | Kontrak REST + MQTT + auth |
| [`public/openapi.json`](public/openapi.json) | Spesifikasi OpenAPI 3.1, di-render di `/api-docs` |
| [`PRD_Frontend_SuperWeb_IoT_v1.0.md`](PRD_Frontend_SuperWeb_IoT_v1.0.md) | PRD: desain, RBAC, milestone |
| [`AGENTS.md`](AGENTS.md) | Catatan versi Next.js di repo ini |
