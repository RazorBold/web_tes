import { ok, fail } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Alamat layanan perawatan perangkat keras di host NVR.
 *
 * Diturunkan dari NVR_HOST supaya tidak ada satu pun IP yang ditulis dua kali,
 * tapi tetap bisa ditimpa lewat HARDWARE_API_URL kalau suatu saat layanan ini
 * pindah host.
 */
function hardwareUrl(action?: string): string {
  const base = (() => {
    const dari = process.env.HARDWARE_API_URL;
    if (dari) return dari;
    const host = process.env.NVR_HOST;
    if (!host) throw new Error("NVR_HOST / HARDWARE_API_URL belum dikonfigurasi di .env.local");
    return `http://${host}:9088/web-hardware/api.php`;
  })();

  // TANPA parameter untuk statistik — `?action=` kosong ditolak layanannya
  // dengan {"error":"Unknown action: "}, bukan dianggap "aksi bawaan".
  return action ? `${base}?action=${encodeURIComponent(action)}` : base;
}

/** Bentuk balasan layanan itu (terukur langsung, bukan dugaan). */
interface RestartResponse {
  success?: boolean;
  queued?: string;
  file?: string;
  elapsed_ms?: number;
}

const TIMEOUT_MS = 15_000;

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
  if (!res.ok) throw new Error(`Layanan perangkat keras membalas HTTP ${res.status}`);
  return (await res.json()) as T;
}

/**
 * POST /api/v1/hardware/restart-service
 *
 * Menyuruh host NVR memuat ulang layanannya supaya memori yang tertahan
 * dilepas. Terukur sekali jalan: RAM turun dari 6,8 GB (44,5%) ke 4,9 GB
 * (32,3%).
 *
 * HARUS lewat server, bukan dipanggil browser langsung: layanan itu ada di
 * host lain tanpa header CORS, jadi browser akan memblokirnya — dan lewat sini
 * alamat internal NVR tidak ikut bocor ke setiap penonton dashboard.
 *
 * Balasannya `queued`, BUKAN "selesai": layanan itu hanya memasukkan tugasnya ke
 * antrean lalu menjawab dalam ±0,5 ms. Karena itu route ini TIDAK ikut membaca
 * dan melaporkan pemakaian memori.
 *
 * Versi sebelumnya melakukannya — menunggu 4 detik lalu membaca statistik — dan
 * pengujian menunjukkan itu menyesatkan: pada percobaan kedua yang berdekatan,
 * angka yang dilaporkan masih 6,9 GB (45%) karena restart-nya belum benar-benar
 * jalan, padahal percobaan pertama terbukti menurunkan 6,8 GB → 4,9 GB. Angka
 * yang belum berubah membuat tombol yang bekerja terbaca seperti tombol rusak.
 * Lebih jujur melaporkan apa yang memang sudah pasti: perintahnya diterima.
 * Sebagai bonus, tombolnya membalas seketika, bukan setelah 4,7 detik.
 */
export async function POST() {
  try {
    const hasil = await getJson<RestartResponse>(hardwareUrl("restart-service"), { method: "POST" });

    if (hasil?.success === false) {
      return fail("HARDWARE_ERROR", "Layanan menolak permintaan restart", 502);
    }

    return ok({ queued: hasil?.queued ?? "service_restart", file: hasil?.file ?? null });
  } catch (err) {
    const pesan = err instanceof Error ? err.message : "Gagal menghubungi layanan perangkat keras";
    // Timeout dari AbortSignal muncul sebagai TimeoutError.
    const status = err instanceof Error && err.name === "TimeoutError" ? 504 : 502;
    return fail("HARDWARE_ERROR", pesan, status);
  }
}
