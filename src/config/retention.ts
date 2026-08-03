// Berapa lama data pembacaan sensor disimpan.
//
// Satu angka ini mengatur TIGA hal sekaligus, dan memang harus begitu:
//   1. sampai berapa jauh ke belakang query menyapu (src/lib/*.ts),
//   2. tulisan rentang waktu di layar ("Tren Penggunaan 3 Hari Terakhir"),
//   3. batas hapus di scripts/db-prune.mjs & live-simulator.mjs.
//
// Kalau ketiganya ditulis terpisah, cepat atau lambat akan berselisih — layar
// menjanjikan 15 hari sementara database hanya menyimpan 3, dan grafiknya
// terlihat "putus" tanpa ada yang salah di kodenya.
//
// Kenapa 3 hari: simulator menulis ~389.000 baris/hari (~30 MB). Pada 15 hari,
// ringkasan air perlu menyapu ±830.000 baris dan endpoint-nya makan 9,3 detik —
// padahal dipakai dashboard, halaman Water, KPI, sekaligus asisten AI.
export const RETENTION_DAYS = 3;

/** Untuk label di layar, mis. "Tren Penggunaan 3 Hari Terakhir". */
export const RETENTION_LABEL = `${RETENTION_DAYS} Hari`;
