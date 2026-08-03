-- Katalog frame heatmap yang SUDAH dirender.
--
-- Gambarnya sendiri TIDAK disimpan di sini, melainkan sebagai berkas di
-- data/heatmap/. Alasannya terukur: satu frame ±253 KB dan NVR menghasilkan
-- ±320 frame/hari, jadi menaruhnya di MySQL berarti ±81 MB/hari — sementara
-- seluruh database saat ini 82 MB. Gambar akan mendominasi database dan
-- memberati setiap backup, tanpa satu pun keuntungan: tidak ada yang di-query
-- dari isi gambarnya.
--
-- Yang disimpan di sini hanya keterangan + path, supaya kartu bisa menampilkan
-- daftar tanpa menyentuh disk sama sekali.

CREATE TABLE IF NOT EXISTS cctv_heatmap_frames (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,

  camera_id     VARCHAR(32) NOT NULL COMMENT 'id kamera di aplikasi, mis. heatmap',
  image_channel INT UNSIGNED NOT NULL COMMENT 'channel gambar di NVR (74039)',
  detect_channel INT UNSIGNED NOT NULL COMMENT 'channel titik deteksi di NVR (74028)',

  day           DATE NOT NULL,
  captured_at   DATETIME NOT NULL COMMENT 'jam gambar, diurai dari nama berkasnya',
  /** Path relatif gambar asli di NVR — sekaligus kunci unik frame. */
  imgpath       VARCHAR(160) NOT NULL,

  -- Hasil render.
  status        ENUM('pending','rendered','empty','failed') NOT NULL DEFAULT 'pending',
  /**
   * Jumlah titik pijak orang yang dipakai membangun heatmap.
   * 0 dengan status 'empty' berarti MEMANG TIDAK ADA ORANG pada jendela itu —
   * bukan kegagalan. Dibedakan supaya frame kosong tidak dicoba render
   * berulang-ulang, dan supaya UI tidak menampilkannya sebagai error.
   */
  points        INT UNSIGNED NOT NULL DEFAULT 0,
  /** Lebar jendela titik yang akhirnya dipakai (detik) — bisa melebar otomatis. */
  window_sec    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  widened       BOOLEAN NOT NULL DEFAULT FALSE,

  thumb_file    VARCHAR(120) NULL COMMENT 'nama berkas thumbnail di data/heatmap/',
  full_file     VARCHAR(120) NULL COMMENT 'nama berkas ukuran penuh di data/heatmap/',
  bytes         INT UNSIGNED NOT NULL DEFAULT 0,

  error         VARCHAR(255) NULL,
  render_ms     INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at    DATETIME NOT NULL,

  UNIQUE KEY uq_heatmap_frame (camera_id, imgpath),
  INDEX idx_heatmap_day (camera_id, day, captured_at),
  -- Dipakai penjadwal untuk mencari frame yang belum dirender.
  INDEX idx_heatmap_status (camera_id, status, captured_at)
);
