// Memangkas tabel pembacaan sensor agar hanya menyimpan beberapa hari terakhir.
//
// Kenapa perlu: live-simulator.mjs menulis ~389.000 baris/hari (~30 MB). Dibiarkan
// berbulan-bulan, ringkasan air yang menyapu rentang waktu jadi lambat sekali —
// pernah terukur 9,3 detik untuk satu permintaan.
//
// Penghapusan dilakukan BERTAHAP (per 50.000 baris), bukan sekali jalan: satu
// DELETE atas ratusan ribu baris menahan kunci lama dan membengkakkan undo log,
// yang membuat simulator gagal menulis selama proses berjalan.
//
// Usage: node scripts/db-prune.mjs [jumlah_hari]     (bawaan: 3)

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import mysql from "mysql2/promise";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function loadEnvLocal() {
  for (const file of [".env.local", ".env"]) {
    const p = path.join(rootDir, file);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      if (!(key in process.env)) process.env[key] = trimmed.slice(eq + 1).trim();
    }
    break;
  }
}

loadEnvLocal();

// Tabel beserta nama kolom waktunya — weather memakai `observed_at`.
const TABLES = [
  ["water_readings", "recorded_at"],
  ["fleet_positions", "recorded_at"],
  ["power_readings", "recorded_at"],
  ["flood_readings", "recorded_at"],
  ["temphum_readings", "recorded_at"],
  ["weather_readings", "observed_at"],
];

const BATCH = 50_000;

export async function pruneReadings(db, days) {
  let removed = 0;
  for (const [table, col] of TABLES) {
    let n;
    do {
      const [res] = await db.query(
        `DELETE FROM \`${table}\` WHERE \`${col}\` < (NOW() - INTERVAL ? DAY) LIMIT ?`,
        [days, BATCH]
      );
      n = res.affectedRows;
      removed += n;
    } while (n === BATCH);
  }
  return removed;
}

async function main() {
  const days = Number(process.argv[2] ?? 3);
  if (!Number.isFinite(days) || days < 1) {
    console.error("Jumlah hari harus angka >= 1");
    process.exit(1);
  }

  const db = await mysql.createConnection({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "superweb_iot",
  });

  console.log(`Memangkas pembacaan yang lebih tua dari ${days} hari...`);

  for (const [table, col] of TABLES) {
    const [[before]] = await db.query(`SELECT COUNT(*) AS n FROM \`${table}\``);
    const [[old]] = await db.query(
      `SELECT COUNT(*) AS n FROM \`${table}\` WHERE \`${col}\` < (NOW() - INTERVAL ? DAY)`,
      [days]
    );
    process.stdout.write(`  ${table.padEnd(18)} ${String(before.n).padStart(8)} baris, ${String(old.n).padStart(8)} kedaluwarsa → `);

    let n;
    do {
      const [res] = await db.query(
        `DELETE FROM \`${table}\` WHERE \`${col}\` < (NOW() - INTERVAL ? DAY) LIMIT ?`,
        [days, BATCH]
      );
      n = res.affectedRows;
    } while (n === BATCH);

    const [[after]] = await db.query(`SELECT COUNT(*) AS n FROM \`${table}\``);
    console.log(`${String(after.n).padStart(8)} baris tersisa`);
  }

  // Ruang yang dilepas DELETE tetap dipegang InnoDB sampai tabelnya ditata
  // ulang; tanpa ini ukuran file di disk tidak berkurang sama sekali.
  console.log("\nMerapikan ruang tabel (OPTIMIZE TABLE)...");
  for (const [table] of TABLES) {
    await db.query(`OPTIMIZE TABLE \`${table}\``);
    process.stdout.write(`  ${table} ✓\n`);
  }

  await db.end();
  console.log("\nSelesai.");
}

// Hanya jalan sebagai perintah mandiri; saat diimpor simulator, `pruneReadings`
// dipakai langsung tanpa ikut mencetak apa pun.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error("Gagal memangkas:", err.message);
    process.exit(1);
  });
}
