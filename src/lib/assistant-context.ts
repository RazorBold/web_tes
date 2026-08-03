// Potret kondisi platform yang disuapkan ke LLM — HANYA UNTUK SERVER.
//
// Tanpa ini, asisten cuma bisa mengarang: ia tidak punya akses ke MySQL maupun
// ke halaman yang sedang dilihat pengguna. Yang dikirim sengaja RINGKASAN, bukan
// seluruh isi tabel — tiap token yang terbuang di prompt membuat jawaban lebih
// lambat dan lebih mahal tanpa membuatnya lebih benar.

import { getWaterOverview, listWaterMeters, listWaterZones } from "@/lib/water";
import { getPowerOverview, getPowerQuality } from "@/lib/power";
import { getFleetOverview } from "@/lib/fleet";
import { getFloodOverview, listFloodSensors } from "@/lib/flood";
import { getTempHumOverview, listRoomsWithStatus } from "@/lib/temphum";
import { listWeatherStations, getWeatherOverview } from "@/lib/weather";
import { listAlerts } from "@/lib/alerts";
import { getDeviceOverview } from "@/lib/devices";
import { NVR_CAMERAS } from "@/lib/cctv-nvr";
import { peopleCounting, crowdTotal, genderDetection, moodAnalysis, cams } from "@/config/cctv";

/**
 * Data dibaca ulang paling cepat tiap 20 detik. Satu percakapan bisa berisi
 * banyak pertanyaan beruntun, dan tiap pertanyaan kalau tidak di-cache berarti
 * belasan query ke MySQL untuk angka yang praktis belum berubah.
 */
const CACHE_TTL_MS = 20_000;

let cache: { at: number; text: string } | null = null;

export async function getPlatformContext(): Promise<string> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.text;

  const text = await buildContext();
  cache = { at: Date.now(), text };
  return text;
}

async function buildContext(): Promise<string> {
  // Dijalankan berbarengan; sepuluh query berurutan akan terasa lambat di chat.
  // `allSettled` supaya satu modul yang bermasalah tidak menjatuhkan seluruh
  // konteks — lebih baik asisten kehilangan satu bagian daripada mati total.
  const [water, waterMeters, waterZones, power, quality, fleet, flood, floodSensors, temphum, rooms, stations, alerts, devices] =
    await Promise.allSettled([
      getWaterOverview(),
      listWaterMeters(),
      listWaterZones(),
      getPowerOverview(),
      getPowerQuality(),
      getFleetOverview(),
      getFloodOverview(),
      listFloodSensors(),
      getTempHumOverview(),
      listRoomsWithStatus(),
      listWeatherStations(),
      listAlerts(),
      getDeviceOverview(),
    ]);

  const val = <T>(r: PromiseSettledResult<T>): T | null => (r.status === "fulfilled" ? r.value : null);

  const w = val(water);
  const wm = val(waterMeters) ?? [];
  const wz = val(waterZones) ?? [];
  const p = val(power);
  const q = val(quality);
  const f = val(fleet);
  const fl = val(flood);
  const fs = val(floodSensors) ?? [];
  const th = val(temphum);
  const rm = val(rooms) ?? [];
  const st = val(stations) ?? [];
  const al = val(alerts) ?? [];
  const dv = val(devices);

  // Cuaca butuh id stasiun, jadi baru bisa diambil setelah daftarnya ada.
  const weather = st[0] ? await getWeatherOverview(st[0].id).catch(() => null) : null;

  const activeAlerts = al.filter((a) => a.status === "active");
  const faceTotal = genderDetection.male + genderDetection.female;

  const snapshot = {
    waktu: new Date().toISOString(),

    air: w && {
      totalPemakaian15Hari: `${w.totalVolume.toLocaleString("id-ID")} m³`,
      rataRataHarian: `${w.avgDaily.toLocaleString("id-ID")} m³/hari`,
      kebocoranAktif: w.activeLeaks,
      meterTerdaftar: wm.length,
      meterOnline: wm.filter((m) => m.status === "online").length,
      zona: wz.map((z) => `${z.name}: ${z.status} (${z.pressureBar} bar)`),
      pelangganTerbesar: w.topConsumers.slice(0, 3).map((c) => `${c.name} (${c.zone}) ${c.usage} m³`),
    },

    energi: p && {
      totalEnergi: `${p.totalEnergy.toLocaleString("id-ID")} kWh`,
      bebanPuncak: `${p.peakLoadKw.toLocaleString("id-ID")} kW pada ${p.peakLoadAt}`,
      faktorDayaRataRata: p.avgPowerFactor,
      susutRataRata: `${p.avgLossPct}%`,
      perSektor: p.sectors.map((s) => `${s.sector}: ${s.energy.toLocaleString("id-ID")} kWh (${s.pct}%)`),
      kualitas: q && `${q.voltage} V, ${q.current} A, ${q.frequency} Hz, PF ${q.powerFactor}`,
    },

    armada: f && {
      total: f.total,
      berjalan: f.moving,
      idle: f.idle,
      perawatan: f.maintenance,
      jarakHariIni: `${f.totalDistanceTodayKm} km`,
      jamAktifHariIni: f.totalHoursActiveToday,
    },

    banjir: fl && {
      statusTertinggi: fl.highestAlertLevel,
      jumlahPerStatus: fl.counts,
      pintuAir: fs.map((s) => `${s.name}: ${(s.waterLevelCm / 100).toFixed(2)} m (${s.alertLevel})`),
    },

    lingkungan: th && {
      suhuRataRata: `${th.avgTemp}°C`,
      kelembapanRataRata: `${th.avgHumidity}%`,
      ruangan: rm.map((r) => `${r.name} (${r.roomTypeName}): ${r.temperature}°C / ${r.humidity}% — ${r.ok ? "normal" : "di luar ambang"}`),
    },

    cuaca: weather && {
      stasiun: weather.station.name,
      kondisi: weather.current.condition,
      suhu: `${weather.current.temperature}°C`,
      kelembapan: `${weather.current.humidity}%`,
      angin: `${weather.current.windSpeed} km/h`,
      curahHujanHarian: `${weather.dailyRainfall} mm`,
    },

    perangkat: dv,

    lansiran: {
      aktif: activeAlerts.length,
      kritis: activeAlerts.filter((a) => a.severity === "critical").length,
      terbaru: al.slice(0, 5).map((a) => `[${a.severity}] ${a.title} — ${a.sourceLabel} (${a.status})`),
    },

    cctv: {
      catatan: "Angka CCTV di bawah adalah DATA CONTOH, bukan hasil deteksi sungguhan.",
      kameraNvrTersambung: Object.entries(NVR_CAMERAS).map(([id, c]) => `${id}: ${c.name}`),
      kameraKatalogDemo: cams.length,
      peopleCounting: `masuk ${peopleCounting.inCount}, keluar ${peopleCounting.outCount}, di area ${peopleCounting.current}`,
      kejadianKerumunan: crowdTotal,
      gender: `pria ${genderDetection.male}, wanita ${genderDetection.female}, total ${faceTotal} wajah`,
      mood: moodAnalysis.map((m) => `${m.name}: ${m.count}`),
    },
  };

  return JSON.stringify(snapshot, null, 1);
}

/**
 * Instruksi tetap untuk asisten.
 *
 * Dua hal paling penting di sini: (1) melarang mengarang angka, karena satu
 * angka palsu di dashboard pemantauan lebih berbahaya daripada jawaban "tidak
 * tahu"; dan (2) mewajibkannya menyebut bahwa data CCTV masih contoh, supaya
 * asisten tidak ikut membuat demo terlihat lebih jadi daripada kenyataannya.
 */
export function buildSystemPrompt(context: string): string {
  return `Kamu adalah "AI Telkom Assistant", asisten di dalam dashboard Merah Putih IoT Platform milik PT Telkom Indonesia.

Platform ini memantau: smart water meter, power/energy meter, fleet tracking GPS, sensor banjir, weather station, sensor suhu-kelembapan-udara, CCTV + AI analytics, serta pusat lansiran dan inventaris perangkat.

ATURAN:
- Jawab dalam Bahasa Indonesia yang ringkas dan langsung. Maksimal 4 kalimat kecuali diminta rinci.
- Pakai HANYA angka dari DATA di bawah. Dilarang menebak atau mengarang angka.
- Kalau data yang ditanyakan tidak ada di bawah, katakan terus terang bahwa kamu tidak punya datanya — jangan diperkirakan.
- Kalau ditanya soal angka CCTV/AI, sebutkan bahwa itu masih data contoh (hanya aliran video kamera NVR yang sudah sungguhan).
- Tulis TEKS BIASA saja, tanpa format markdown apa pun. Dilarang memakai **tebal**, *miring*, judul #, tabel, maupun daftar bertanda. Gelembung chat menampilkan teks apa adanya, jadi tanda-tanda itu akan terlihat sebagai bintang dan pagar yang mengotori jawaban.
- Kalau ditanya di mana melihat sesuatu, sebutkan nama menunya (Dashboard, CCTV & AI, Water, Energy, Fleet Tracking, Flood, Weather, Environment, Alert Center, Reports, Devices, Settings).

DATA PLATFORM SAAT INI (JSON):
${context}`;
}
