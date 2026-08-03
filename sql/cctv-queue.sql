-- Riwayat Antrian / People Crowded dari NVR (channel 74289).
--
-- Sama seperti sql/cctv-visitor.sql: berkas terpisah dari schema.sql yang
-- DROP-lalu-CREATE, karena API NVR hanya menyimpan HARI BERJALAN — begitu lewat
-- tengah malam, satu-satunya salinan tersisa ada di sini.
--
-- SATU BARIS = SATU SAMPEL (~30 detik sekali, ±650 baris/hari). Berbeda dari
-- tabel visitor yang satu baris per orang: channel ini memang tidak melaporkan
-- individu, melainkan keadaan zona pada satu saat.
--
-- Catatan soal kolom in/out: pada channel ini keduanya BUKAN pencacah harian.
-- Nilainya naik-turun antar sampel (terukur: naik 206×, turun 195× dalam sehari),
-- jadi jangan pernah dijumlahkan sebagai "total masuk hari ini".

CREATE TABLE IF NOT EXISTS cctv_queue_samples (
  id             BIGINT AUTO_INCREMENT PRIMARY KEY,

  camera_id      VARCHAR(32) NOT NULL COMMENT 'id kamera di aplikasi, mis. antrian',
  channel_id     INT UNSIGNED NOT NULL COMMENT 'channel AI di NVR, mis. 74289',
  day            DATE NOT NULL,
  sampled_at     DATETIME NOT NULL,

  -- Nama berkas dari NVR (mis. "152847813"). Sekaligus kunci unik sampel dan
  -- penghubung ke gambar buktinya: .../max_image/152847813.jpg
  file           VARCHAR(32) NOT NULL,
  image_path     VARCHAR(160) NULL COMMENT 'path relatif gambar bukti di NVR',

  -- Jumlah orang di zona pada saat sampel diambil.
  current_count  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  -- Puncak orang serentak selama rentang sampel. INI yang dipakai untuk
  -- mengelompokkan ukuran kerumunan (1-5 / 6-10 / >10), bukan current_count,
  -- karena yang dicari "seberapa ramai sempat terjadi", bukan potret sesaat.
  max_detection  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  -- Hunian rata-rata; pecahan, karena NVR menghaluskannya sepanjang rentang.
  occupancy      DECIMAL(6,3) NOT NULL DEFAULT 0,

  avg_stay_s     DECIMAL(8,2) NOT NULL DEFAULT 0,
  max_stay_s     DECIMAL(8,2) NOT NULL DEFAULT 0,

  updated_at     DATETIME NOT NULL,

  -- Penarikan berulang atas rentang yang sama memperbarui baris, bukan
  -- menggandakannya.
  UNIQUE KEY uq_queue_sample (camera_id, day, file),
  INDEX idx_queue_day (camera_id, day),
  INDEX idx_queue_time (camera_id, sampled_at),
  -- Dipakai kartu People Crowded yang mengelompokkan per ukuran kerumunan.
  INDEX idx_queue_bucket (camera_id, day, max_detection)
);
