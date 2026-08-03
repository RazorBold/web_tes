// Penjadwal penarikan data Visitor Counting.
//
// Kenapa perlu, padahal route-nya sudah menarik sendiri saat dibuka: API NVR
// hanya menyimpan data HARI BERJALAN. Kalau seharian tidak ada yang membuka
// dashboard, lewat tengah malam data hari itu HILANG PERMANEN — tidak ada
// tempat lain untuk mengambilnya lagi. Penjadwal ini yang memastikan tiap hari
// tersalin ke MySQL apa pun yang terjadi.
//
// Sengaja hanya memanggil endpoint-nya, bukan mengulang logika NVR-nya: seluruh
// penarikan, peringkasan, dan penyimpanan tetap satu tempat di TypeScript
// (src/lib/cctv-visitor.ts). Skrip ini cuma pemicu.
//
// Usage: node scripts/cctv-sync.mjs [url]   (atau lewat PM2, lihat ecosystem.config.js)

const BASE =
  process.argv[2] ?? process.env.CCTV_SYNC_URL ?? "http://localhost:14546/api/v1";

// Kedua channel sama-sama perlu dijaga: API NVR hanya menyimpan hari berjalan,
// jadi yang tidak pernah ditarik akan hilang permanen lewat tengah malam.
const ENDPOINTS = [
  ["visitor", `${BASE}/cctv/visitor/overview`],
  ["antrian", `${BASE}/cctv/queue/overview`],
  // Heatmap: endpoint ini membaca daftar yang sudah jadi DAN memicu render
  // frame baru di latar. Dipanggil berkala supaya antrean render tetap jalan
  // walau tidak ada yang membuka dashboard.
  ["heatmap", `${BASE}/cctv/heatmap/frames?limit=1`],
];

// Dua menit. Proses ini cuma jaring pengaman untuk saat TIDAK ADA yang membuka
// dashboard — kesegaran bagi penonton sudah diurus endpoint-nya sendiri. Yang
// dijaga di sini hanya kelengkapan riwayat harian, jadi tak perlu rapat-rapat.
const INTERVAL_MS = 2 * 60_000;

const stamp = () => new Date().toLocaleString("id-ID");

async function sync() {
  for (const [nama, url] of ENDPOINTS) {
    try {
      const res = await fetch(url);
      const json = await res.json();

      if (!json.success) {
        console.error(`[${stamp()}] ${nama} gagal: ${json.error?.message ?? res.status}`);
        continue;
      }

      const d = json.data;
      const warn = d.syncWarning ? `  ⚠ ${d.syncWarning}` : "";
      const ringkas =
        nama === "visitor"
          ? `${d.uniqueVisitors} orang unik · masuk ${d.in} keluar ${d.out} bolak-balik ${d.lingering}`
          : nama === "antrian"
          ? `${d.totalCrowded}/${d.totalSamples} sampel berisi orang · puncak ${d.peakPeople}`
          : `frame terbaru ${d[0] ? new Date(d[0].capturedAt).toLocaleTimeString("id-ID") + " (" + d[0].points + " titik)" : "belum ada"}`;
      console.log(`[${stamp()}] ${nama}: ${ringkas}${warn}`);
    } catch (err) {
      // Jangan sampai proses mati: kalau app sedang di-restart, panggilan
      // berikutnya beberapa menit lagi akan berhasil.
      console.error(`[${stamp()}] ${nama} gagal menghubungi ${url}: ${err.message}`);
    }
  }
}

console.log(`cctv-sync berjalan — menarik ${ENDPOINTS.length} channel tiap ${INTERVAL_MS / 60000} menit dari ${BASE}`);
await sync();
setInterval(sync, INTERVAL_MS);
