// config/cctv.ts — sumber tunggal daftar kamera, katalog model AI, & angka analitik CCTV
import {
  Users, ShieldAlert, ScanFace, VenusAndMars, Smile, Flame,
  Meh, Frown, Angry, type LucideIcon,
} from "lucide-react";

export type AiMode = "people" | "crowd" | "heatmap" | "face" | "gender" | "mood";

export interface AiModelMeta {
  /** Nama fitur AI yang tampil ke pengguna */
  label: string;
  /** Versi pendek untuk badge & filter */
  shortLabel: string;
  /** Nama model yang dijalankan di edge server */
  model: string;
  desc: string;
  Icon: LucideIcon;
  /** Chip terang untuk badge di kartu & tabel */
  chip: string;
  /** Badge solid di atas media kamera */
  solid: string;
}

// Urutan kunci di sini menentukan urutan tampil di mana-mana (checklist Settings,
// badge di modal), karena `aiModes` di bawah diturunkan dari Object.keys. Sengaja
// dikelompokkan mengikuti dua grup di halaman /cctv: tiga model "People Crowded"
// dulu, baru tiga model "Face Recognition".
export const AI_MODELS: Record<AiMode, AiModelMeta> = {
  people: {
    label: "People Counting",
    shortLabel: "Counting",
    model: "YOLOv8n-Person",
    desc: "Hitung jumlah orang masuk & keluar",
    Icon: Users,
    chip: "bg-emerald-50 text-emerald-600 border-emerald-100",
    solid: "bg-emerald-500/80 border-emerald-300/30",
  },
  crowd: {
    label: "Deteksi Kerumunan",
    shortLabel: "Kerumunan",
    model: "CrowdNet v2",
    desc: "Deteksi kepadatan & kerumunan berlebih",
    Icon: ShieldAlert,
    chip: "bg-red-50 text-brand-red border-red-100",
    solid: "bg-red-500/80 border-red-300/30",
  },
  heatmap: {
    label: "Heatmap Zona",
    shortLabel: "Heatmap",
    model: "ZoneFlow-HM",
    desc: "Peta panas pergerakan per zona",
    Icon: Flame,
    chip: "bg-orange-50 text-orange-600 border-orange-100",
    solid: "bg-orange-500/80 border-orange-300/30",
  },
  face: {
    label: "Face Recognition",
    shortLabel: "Face",
    model: "ArcFace-R100",
    desc: "Identifikasi & verifikasi wajah pengunjung",
    Icon: ScanFace,
    chip: "bg-indigo-50 text-indigo-600 border-indigo-100",
    solid: "bg-indigo-500/80 border-indigo-300/30",
  },
  gender: {
    label: "Deteksi Gender",
    shortLabel: "Gender",
    model: "FaceAttr-R50",
    desc: "Estimasi gender pengunjung",
    Icon: VenusAndMars,
    chip: "bg-purple-50 text-purple-600 border-purple-100",
    solid: "bg-purple-500/80 border-purple-300/30",
  },
  mood: {
    label: "Deteksi Mood",
    shortLabel: "Mood",
    model: "FER-Net v3",
    desc: "Analisa ekspresi & mood pengunjung",
    Icon: Smile,
    chip: "bg-amber-50 text-amber-600 border-amber-100",
    solid: "bg-amber-500/80 border-amber-300/30",
  },
};

export const aiModes = Object.keys(AI_MODELS) as AiMode[];

export interface Cam {
  id: string;
  name: string;
  location: string;
  metricType: "people" | "vehicle" | "cargo";
  value: number;
  imageUrl: string;
  /** Model AI yang aktif secara default — bisa diubah di Settings */
  aiModes: AiMode[];
  online: boolean;
  accuracy: string;
}

// `value` = jumlah objek yang TERDETEKSI SAAT INI di frame (bukan akumulasi harian).
// Kamera 1 dipakai sebagai kamera People Counting, jadi nilainya diikat ke
// `peopleCounting.current` di bawah — jangan diubah sendirian.
//
// Kamera 1 & 3 adalah kamera jangkar dua grup di halaman /cctv, jadi `aiModes`
// keduanya harus cocok dengan judul grupnya (lihat defaultCamId di cctv/page.tsx):
//   • cam 1 "People Crowded"    → people + crowd + heatmap
//   • cam 3 "Face Recognition"  → face + gender + mood
export const cams: Cam[] = [
  { id: "1", name: "01. Lobby Utama", location: "Jakarta Pusat", metricType: "people", value: 24, aiModes: ["people", "crowd", "heatmap"], online: true, accuracy: "98,2%", imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&h=500&q=80" },
  { id: "2", name: "02. Parkir Area", location: "Jakarta Pusat", metricType: "vehicle", value: 7, aiModes: ["crowd", "heatmap"], online: true, accuracy: "96,8%", imageUrl: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&h=500&q=80" },
  { id: "3", name: "03. Main Gate", location: "Jakarta Selatan", metricType: "people", value: 18, aiModes: ["face", "gender", "mood"], online: true, accuracy: "97,5%", imageUrl: "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?auto=format&fit=crop&w=800&h=500&q=80" },
  { id: "4", name: "04. Koridor Lt. 1", location: "Jakarta Timur", metricType: "people", value: 0, aiModes: ["mood"], online: false, accuracy: "—", imageUrl: "https://images.unsplash.com/photo-1517502884422-41eaaced0168?auto=format&fit=crop&w=800&h=500&q=80" },
  { id: "5", name: "05. Pintu Barat In", location: "Jakarta Pusat", metricType: "vehicle", value: 9, aiModes: ["heatmap"], online: true, accuracy: "95,4%", imageUrl: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&h=500&q=80" },
  { id: "6", name: "06. Loading Dock C", location: "Jakarta Selatan", metricType: "cargo", value: 5, aiModes: ["people"], online: true, accuracy: "97,1%", imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&h=500&q=80" },
  { id: "7", name: "07. Koridor Lt. 3", location: "Jakarta Barat", metricType: "people", value: 11, aiModes: ["gender", "mood"], online: true, accuracy: "98,0%", imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&h=500&q=80" },
  { id: "8", name: "08. Area Genset/PLN", location: "Bekasi", metricType: "vehicle", value: 3, aiModes: ["crowd"], online: true, accuracy: "94,9%", imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&h=500&q=80" },
];

/** Satuan yang tampil di badge thumbnail, mengikuti jenis objek yang dihitung kamera. */
export const METRIC_LABEL: Record<Cam["metricType"], string> = {
  people: "People",
  vehicle: "Vehicle",
  cargo: "Cargo",
};

/** Versi panjang berbahasa Indonesia — dipakai live card & modal player. */
export const DETECTED_LABEL: Record<Cam["metricType"], string> = {
  people: "Orang Terdeteksi",
  vehicle: "Kendaraan Terdeteksi",
  cargo: "Kargo Terdeteksi",
};

export const camLocations = ["Semua Lokasi", ...Array.from(new Set(cams.map((c) => c.location)))];

export const defaultAiAssignments: Record<string, AiMode[]> = Object.fromEntries(
  cams.map((c) => [c.id, c.aiModes])
);

// ─────────────────────────────────────────────────────────────────────────────
// DATA ANALITIK AI (mock) — sumber tunggal untuk semua kartu di halaman /cctv.
//
// Angka-angka di bawah SENGAJA saling terikat supaya tiap kartu bercerita hal
// yang sama (sebelumnya tiap kartu punya angka sendiri yang saling bertentangan):
//   • peopleCounting.current  = masuk − keluar  = cams[0].value  (kamera lobby)
//   • total gender = total mood (dua-duanya "akumulasi hari ini, semua kamera")
// Kalau salah satu diubah, ikut sesuaikan pasangannya.
// ─────────────────────────────────────────────────────────────────────────────

const PEOPLE_IN = 142;
const PEOPLE_OUT = 118;

export const peopleCounting = {
  inCount: PEOPLE_IN,
  outCount: PEOPLE_OUT,
  /** Orang yang masih berada di dalam area: 142 − 118 = 24 */
  current: PEOPLE_IN - PEOPLE_OUT,
  /** Perubahan terhadap hari sebelumnya, dalam persen. Tanda menentukan
   *  arah panah & warna pil pada kartu — positif naik, negatif turun. */
  inTrendPct: 12,
  outTrendPct: -8,
  /**
   * Sebaran per jam (7 kurun terakhir) untuk sparkline di kartu ringkasan.
   *
   * Ditaruh di sini, bukan dikarang di dalam komponen, karena seluruh angka CCTV
   * memang berkumpul di berkas ini — sparkline yang datanya lahir di komponen
   * akan jadi satu-satunya angka CCTV yang tak bisa dilacak dari sumber bersama.
   * Jumlah tiap deret sengaja dibuat sama dengan inCount/outCount di atas.
   */
  inHourly: [12, 18, 24, 31, 22, 20, 15],
  outHourly: [8, 13, 19, 27, 21, 17, 13],
};

export interface CrowdBucket {
  /** Banyaknya orang dalam satu rumpun yang terdeteksi. */
  range: string;
  /** Berapa KALI kerumunan seukuran itu terdeteksi hari ini. */
  count: number;
  /** Semua kelas di bawah ditulis literal, bukan dirangkai dari variabel —
   *  Tailwind hanya men-generate kelas yang muncul apa adanya di source. */
  tile: string;
  iconWrap: string;
  chip: string;
  value: string;
}

/**
 * Klasifikasi kerumunan hari ini. Satuannya **kejadian deteksi, bukan orang**:
 * tiap kali model kerumunan menemukan satu rumpun, kejadian itu masuk ke salah
 * satu rentang di bawah menurut jumlah orang dalam rumpun tersebut.
 *
 * Karena akumulatif sejak awal hari, wajar kalau totalnya jauh lebih besar dari
 * `peopleCounting.current` yang hanya potret sesaat — keduanya mengukur hal
 * berbeda dan memang tidak perlu cocok.
 */
export const crowdClassification: CrowdBucket[] = [
  {
    range: "1 - 5",
    count: 986,
    tile: "bg-emerald-50/60 border-emerald-100",
    iconWrap: "bg-emerald-100/80 text-emerald-600",
    chip: "bg-emerald-100/80 text-emerald-700",
    value: "text-emerald-700",
  },
  {
    range: "6 - 10",
    count: 0,
    tile: "bg-amber-50/60 border-amber-100",
    iconWrap: "bg-amber-100/80 text-amber-600",
    chip: "bg-amber-100/80 text-amber-700",
    value: "text-amber-600",
  },
  {
    range: "> 10",
    count: 0,
    tile: "bg-rose-50/60 border-rose-100",
    iconWrap: "bg-rose-100/80 text-rose-500",
    chip: "bg-rose-100/80 text-rose-600",
    value: "text-rose-600",
  },
];

/** Diturunkan, bukan ditulis ulang, supaya tak mungkin lepas dari rinciannya. */
export const crowdTotal = crowdClassification.reduce((sum, b) => sum + b.count, 0);

/** Akumulasi deteksi gender hari ini. Total = 8.412, sama dengan total mood. */
export const genderDetection = {
  male: 5797,
  female: 2615,
};

export interface MoodSlice {
  name: string;
  count: number;
  /** Hex, dipakai untuk ikon & progress bar sekaligus. */
  color: string;
  Icon: LucideIcon;
}

/**
 * Akumulasi mood hari ini. Total = 8.412, sama dengan total gender.
 *
 * Warnanya diuji dengan validator palet kategorikal, bukan dipilih dengan mata:
 * pasangan terdekat berjarak ΔE 20,4 (penglihatan normal) dan 14,4 (tritanopia),
 * dan keempatnya lolos kontras 3:1 terhadap permukaan kartu. Nilai lama
 * (#10B981/#64748B/#3B82F6) jatuh di kontras — hijaunya cuma 2,47:1.
 *
 * "Neutral" sengaja tetap abu-abu meski itu berarti gagal syarat chroma sebuah
 * palet kategorikal: abu-abu justru MAKNANYA di skala mood. Yang membuatnya tetap
 * aman, tiap baris selalu membawa ikon + nama + angka, jadi identitas kategori
 * tidak pernah bergantung pada warna saja.
 */
export const moodAnalysis: MoodSlice[] = [
  { name: "Happy", count: 4630, color: "#16A34A", Icon: Smile },
  { name: "Neutral", count: 2740, color: "#475569", Icon: Meh },
  { name: "Sad", count: 700, color: "#2563EB", Icon: Frown },
  { name: "Angry", count: 342, color: "#DC2626", Icon: Angry },
];

export interface CctvSnapshot {
  id: string;
  camId: string;
  camera: string;
  location: string;
  time: string;
  count: number;
  metricType: Cam["metricType"];
  imageUrl: string;
  aiMode: string;
  confidence: string;
}

// Jam capture ditulis literal (bukan turunan Date.now()) supaya render di server
// dan di browser identik — kalau tidak, React akan melempar hydration mismatch.
const snapshotTimes = ["10:26:21", "10:21:05", "10:19:44", "10:18:32", "10:16:18", "10:12:57", "10:09:03"];

/** Bukti snapshot hanya dari kamera yang online — kamera mati tak mengirim frame. */
export const snapshots: CctvSnapshot[] = cams
  .filter((c) => c.online)
  .map((c, i) => ({
    id: `sn-${c.id}`,
    camId: c.id,
    camera: c.name,
    location: c.location,
    time: `${snapshotTimes[i % snapshotTimes.length]} WIB`,
    count: c.value,
    metricType: c.metricType,
    imageUrl: c.imageUrl,
    aiMode: AI_MODELS[c.aiModes[0]].label,
    confidence: c.accuracy,
  }));

// ─────────────────────────────────────────────────────────────────────────────
// OVERLAY HEATMAP — dipakai kartu Snapshot Heatmap & lightbox-nya.
// ─────────────────────────────────────────────────────────────────────────────

export type HeatLevel = "low" | "mid" | "high";

/**
 * Tiga tingkat kepadatan beserta warnanya. `glow` dipakai sebagai warna
 * radial-gradient di overlay (butuh nilai rgba mentah, bukan kelas Tailwind),
 * `dot` untuk kotak legenda.
 */
export const HEAT_LEVELS: Record<HeatLevel, { label: string; dot: string; glow: string }> = {
  low: { label: "Low", dot: "bg-blue-500", glow: "rgba(37,99,235,0.85)" },
  mid: { label: "Mid", dot: "bg-yellow-400", glow: "rgba(250,204,21,0.85)" },
  high: { label: "High", dot: "bg-red-500", glow: "rgba(239,68,68,0.90)" },
};

/** Urutan legenda: rendah → tinggi, sama seperti gradasi warnanya. */
export const heatLegend = ["low", "mid", "high"] as const;

export interface HeatBlob {
  /** Titik pusat & diameter dalam persen bidang gambar, bukan piksel — supaya
   *  posisinya tetap benar baik di thumbnail 68px maupun di lightbox. */
  x: string;
  y: string;
  size: string;
  level: HeatLevel;
}

/**
 * Rumpun panas satu frame. Sengaja bertumpuk (blob `low` melebar di belakang,
 * `high` kecil di depan) supaya setelah di-blur menghasilkan gradasi biru →
 * hijau → kuning → merah seperti heatmap sungguhan, bukan tiga bulatan terpisah.
 * Yang terpanas ditaruh di tengah-bawah: itu area lalu-lalang utama di depan
 * kamera.
 */
export const heatBlobs: HeatBlob[] = [
  { x: "12%", y: "62%", size: "34%", level: "low" },
  { x: "30%", y: "58%", size: "40%", level: "low" },
  { x: "46%", y: "64%", size: "46%", level: "mid" },
  { x: "44%", y: "70%", size: "26%", level: "high" },
  { x: "56%", y: "66%", size: "22%", level: "high" },
  { x: "70%", y: "56%", size: "34%", level: "mid" },
  { x: "86%", y: "60%", size: "30%", level: "low" },
];

export interface DetectionBox {
  x: string;
  y: string;
  w: string;
  h: string;
  label: string;
  /** Skor keyakinan model, ditampilkan dalam kurung siku seperti keluaran YOLO. */
  score: string;
}

/** Kotak deteksi objek yang menemani heatmap di lightbox. */
export const detectionBoxes: DetectionBox[] = [
  { x: "8%", y: "46%", w: "9%", h: "26%", label: "Person", score: "0.84" },
  { x: "26%", y: "40%", w: "8%", h: "30%", label: "Person", score: "0.94" },
  { x: "40%", y: "52%", w: "9%", h: "28%", label: "Person", score: "0.91" },
  { x: "52%", y: "44%", w: "8%", h: "32%", label: "Person", score: "0.96" },
  { x: "64%", y: "50%", w: "9%", h: "26%", label: "Person", score: "0.89" },
  { x: "78%", y: "42%", w: "8%", h: "30%", label: "Person", score: "0.92" },
  { x: "35%", y: "70%", w: "12%", h: "20%", label: "Cart", score: "0.88" },
];
