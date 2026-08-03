// PM2 process list for this app.
// Usage:
//   npm run build              # once, before starting in production mode
//   pm2 start ecosystem.config.js
//   pm2 logs                   # watch all processes
//   pm2 stop ecosystem.config.js / pm2 delete ecosystem.config.js
//
// Port frontend: 14546. Ditulis di satu tempat (WEB_PORT di bawah) lalu dipakai
// ulang untuk URL sinkronisasi CCTV — dulu angkanya tersebar di beberapa baris
// dan sempat lepas sinkron dengan proses yang benar-benar berjalan.

const WEB_PORT = 14546;

module.exports = {
  apps: [
    {
      name: "superweb-iot-web",
      script: "npm",
      args: "start",
      cwd: __dirname,
      env: { NODE_ENV: "production", PORT: String(WEB_PORT) },
    },
    {
      name: "superweb-iot-simulator",
      script: "scripts/live-simulator.mjs",
      interpreter: "node",
      cwd: __dirname,
    },
    {
      // Menyalin Visitor Counting & Antrian dari NVR ke MySQL secara berkala.
      // WAJIB jalan:
      // API NVR hanya menyimpan hari berjalan, jadi tanpa proses ini data satu
      // hari hilang permanen bila tak ada yang membuka dashboard sebelum tengah
      // malam.
      name: "superweb-iot-cctv-sync",
      script: "scripts/cctv-sync.mjs",
      interpreter: "node",
      cwd: __dirname,
      env: { CCTV_SYNC_URL: `http://localhost:${WEB_PORT}/api/v1` },
    },
  ],
};
