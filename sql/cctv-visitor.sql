-- Riwayat Visitor Counting dari NVR (channel 74237).
--
-- Berkas terpisah dari schema.sql yang sengaja DROP-lalu-CREATE seluruh tabel
-- sensor: menjalankan ini tidak boleh sampai menghapus riwayat yang sudah
-- terkumpul, karena API NVR hanya menyimpan data HARI BERJALAN — begitu lewat
-- tengah malam, satu-satunya salinan yang tersisa ada di tabel ini.
--
-- SATU BARIS = SATU ORANG TERLACAK (track_id), bukan satu event mentah.
--
-- Alasannya: NVR mengirim satu event tiap kali titik lacak melintasi garis, dan
-- orang yang berdiri di dekat garis menghasilkan puluhan event bergantian
-- in/out dalam hitungan detik (terukur: 73% event harian berasal dari 10 orang
-- yang berdiri di garis). Menyimpan per event berarti menyimpan getaran itu dan
-- menggelembungkan semua angka turunannya.
--
-- Pecahannya tetap disimpan (events_in, events_out, first/last_direction),
-- supaya metode penghitungan masih bisa diganti belakangan lewat SQL saja,
-- tanpa perlu menarik ulang data yang sumbernya sudah keburu hilang.

CREATE TABLE IF NOT EXISTS cctv_visitor_tracks (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,

  camera_id        VARCHAR(32) NOT NULL COMMENT 'id kamera di aplikasi, mis. visitor',
  channel_id       INT UNSIGNED NOT NULL COMMENT 'channel AI di NVR, mis. 74237',
  track_id         VARCHAR(32) NOT NULL COMMENT 'id pelacakan dari NVR; berulang tiap hari',
  day              DATE NOT NULL COMMENT 'tanggal lokal — bagian dari kunci unik',

  first_seen       DATETIME NOT NULL COMMENT 'event pertama; dipakai sebagai waktu kunjungan',
  last_seen        DATETIME NOT NULL,

  events_in        SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  events_out       SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  -- events_in − events_out. Disimpan (bukan dihitung saat query) supaya bisa
  -- diindeks dan dijumlah tanpa membaca dua kolom lain.
  net              SMALLINT NOT NULL DEFAULT 0,

  first_direction  ENUM('in','out') NOT NULL,
  last_direction   ENUM('in','out') NOT NULL,

  updated_at       DATETIME NOT NULL,

  -- Sinkronisasi berjalan berulang atas rentang waktu yang sama, jadi kunci ini
  -- yang membuat penarikan ulang memperbarui baris, bukan menggandakannya.
  UNIQUE KEY uq_visitor_track (camera_id, day, track_id),
  INDEX idx_visitor_day (camera_id, day),
  INDEX idx_visitor_first_seen (camera_id, first_seen)
);

-- Penanda kapan terakhir kali sinkronisasi berhasil, per kamera.
-- Dipakai penyelaras untuk tahu sejauh mana harus menarik ulang, dan dipakai UI
-- untuk memberi tahu kapan angkanya terakhir diperbarui.
CREATE TABLE IF NOT EXISTS cctv_sync_state (
  camera_id     VARCHAR(32) NOT NULL PRIMARY KEY,
  channel_id    INT UNSIGNED NOT NULL,
  last_sync_at  DATETIME NOT NULL,
  last_event_at DATETIME NULL COMMENT 'waktu event terbaru yang sudah masuk',
  tracks_total  INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'jumlah track pada sinkron terakhir',
  note          VARCHAR(255) NULL
);
