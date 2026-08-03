"use client";

import React, { useEffect, useRef } from "react";
import type { CctvAiBox, CctvAiLine, CctvAiRef, CctvAiZone } from "@/types/cctv";

interface CctvAiOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  boxes: CctvAiBox[];
  lines: CctvAiLine[];
  zones: CctvAiZone[];
  aiRef: CctvAiRef | null;
}

/**
 * Menggambar tiga lapis di atas <video>, dari belakang ke depan:
 *   1. ZONA  — poligon setelan kamera (mis. area antrean yang dihitung hunian
 *              & lama tunggunya). Menetap sepanjang sesi.
 *   2. GARIS — garis hitung lintasan orang. Juga menetap.
 *   3. KOTAK — bounding box deteksi, berganti tiap frame.
 *
 * Urutannya penting: zona dan garis adalah latar tetap, kotak deteksi harus
 * terbaca DI ATAS keduanya.
 *
 * Koordinat dari NVR memakai resolusi ACUAN (kamera-kamera ini semuanya
 * 1920×1080), yang belum tentu sama dengan resolusi stream yang sedang diputar —
 * profil "Streaming 2" misalnya cuma 640×360. Karena itu penskalaan wajib
 * bertumpu pada `aiRef`, bukan pada ukuran video.
 */
/**
 * Jejak "kurung sudut" — empat siku membulat plus satu tanda di tengah sisi kiri
 * & kanan, bukan persegi utuh.
 *
 * Persegi penuh menutup objek yang sedang ditunjuknya; kurung sudut menandai
 * batas yang sama tapi membiarkan tengahnya terbuka, jadi orang di dalam kotak
 * tetap terlihat jelas. Panjang siku ikut ukuran kotak — pada deteksi kecil,
 * siku sepanjang seperempat sisi akan menyambung jadi persegi biasa lagi.
 *
 * Hanya menyusun path; pewarnaan diserahkan ke pemanggil supaya path yang sama
 * bisa di-stroke dua kali (bayangan gelap, lalu hijau).
 */
function traceCornerBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const r = Math.min(9, w / 3, h / 3);
  const arm = Math.max(6, Math.min(Math.min(w, h) * 0.3, 26));
  const x2 = x + w;
  const y2 = y + h;

  ctx.beginPath();

  // Kiri-atas
  ctx.moveTo(x, y + r + arm);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.lineTo(x + r + arm, y);

  // Kanan-atas
  ctx.moveTo(x2 - r - arm, y);
  ctx.lineTo(x2 - r, y);
  ctx.quadraticCurveTo(x2, y, x2, y + r);
  ctx.lineTo(x2, y + r + arm);

  // Kanan-bawah
  ctx.moveTo(x2, y2 - r - arm);
  ctx.lineTo(x2, y2 - r);
  ctx.quadraticCurveTo(x2, y2, x2 - r, y2);
  ctx.lineTo(x2 - r - arm, y2);

  // Kiri-bawah
  ctx.moveTo(x + r + arm, y2);
  ctx.lineTo(x + r, y2);
  ctx.quadraticCurveTo(x, y2, x, y2 - r);
  ctx.lineTo(x, y2 - r - arm);

  // Tanda tengah di sisi kiri & kanan — hanya bila sisinya cukup panjang,
  // supaya pada kotak pendek ia tidak menempel ke siku dan terlihat seperti
  // garis penuh yang berlubang.
  const tick = Math.min(h * 0.12, 12);
  if (h > (r + arm) * 2 + tick * 2) {
    const mid = y + h / 2;
    ctx.moveTo(x, mid - tick / 2);
    ctx.lineTo(x, mid + tick / 2);
    ctx.moveTo(x2, mid - tick / 2);
    ctx.lineTo(x2, mid + tick / 2);
  }
}

const WARNA_IN = "#22C55E";
const WARNA_OUT = "#F97316";
const WARNA_GARIS = "#F59E0B";

/** Mata panah segitiga di ujung (tx,ty), menghadap arah (dx,dy) yang sudah unit. */
function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  dx: number,
  dy: number,
  size: number
) {
  // Vektor tegak lurus arah panah, untuk kedua sayapnya.
  const px = -dy;
  const py = dx;
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(tx - dx * size + px * size * 0.55, ty - dy * size + py * size * 0.55);
  ctx.lineTo(tx - dx * size - px * size * 0.55, ty - dy * size - py * size * 0.55);
  ctx.closePath();
  ctx.fill();
}

/** Teks bergaris tepi gelap — supaya terbaca di atas lantai terang maupun gelap. */
function labelTegas(ctx: CanvasRenderingContext2D, teks: string, x: number, y: number, warna: string) {
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = "rgba(2,6,23,0.85)";
  ctx.strokeText(teks, x, y);
  ctx.fillStyle = warna;
  ctx.fillText(teks, x, y);
}

/**
 * Garis hitung lengkap dengan penunjuk arah IN / OUT.
 *
 * ARAH DITURUNKAN DARI GARISNYA SENDIRI, bukan ditulis tetap: sisi IN adalah
 * normal kanan dari vektor x1,y1 → x2,y2, yaitu (−dy, dx). Untuk garis yang
 * membentang ke kanan, itu jatuh ke bawah — cocok dengan tampilan acuan dari
 * NVR pada kamera Visitor Counting (garis mendatar, IN di bawah, OUT di atas).
 * Konsekuensinya polanya ikut apa pun yang disetel: garis tegak otomatis
 * memberi IN/OUT kiri-kanan, dan menukar urutan titiknya membalik keduanya.
 *
 * Semua ukuran diturunkan dari panjang garis DI LAYAR, bukan dari koordinat
 * acuan NVR — kartu kecil dan tampilan penuh memakai kanvas yang jauh berbeda
 * ukurannya, dan angka tetap akan tenggelam di satu sisi lalu memenuhi layar di
 * sisi lain.
 */
function drawCountingLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 4) return;

  const ux = dx / len;
  const uy = dy / len;
  // Normal kanan = sisi IN.
  const nx = -uy;
  const ny = ux;

  const tebal = Math.max(2, Math.min(len * 0.012, 5));
  const tickLen = Math.max(4, Math.min(len * 0.03, 14));
  // Jarak diturunkan dari panjang, bukan dipatok: hasilnya jumlah sirip yang
  // kira-kira tetap (±26) berapa pun panjang garisnya, jadi kerapatannya terlihat
  // sama di kartu kecil maupun tampilan penuh. Batas bawah 8px mencegah sirip
  // menyatu jadi pita pada garis pendek.
  const jarakTick = Math.max(8, Math.min(len / 26, 18));

  ctx.save();
  ctx.lineCap = "round";
  ctx.setLineDash([]);

  // Bayangan gelap di bawah garis oranye — tanpa ini garis hilang di atas
  // lantai terang.
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = "rgba(2,6,23,0.45)";
  ctx.lineWidth = tebal + 2.5;
  ctx.stroke();
  ctx.strokeStyle = WARNA_GARIS;
  ctx.lineWidth = tebal;
  ctx.stroke();

  // Sirip pendek di sepanjang garis: hijau menjorok ke sisi IN, oranye ke sisi
  // OUT. Fungsinya menyatakan sisi mana yang mana di SEPANJANG garis, bukan cuma
  // di titik tengah — pada garis panjang, panah di tengah saja mudah salah baca.
  ctx.lineWidth = Math.max(1.5, tebal * 0.6);
  for (let d = jarakTick; d < len; d += jarakTick) {
    const px = x1 + ux * d;
    const py = y1 + uy * d;

    ctx.strokeStyle = WARNA_IN;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + nx * tickLen, py + ny * tickLen);
    ctx.stroke();

    ctx.strokeStyle = WARNA_OUT;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px - nx * tickLen, py - ny * tickLen);
    ctx.stroke();
  }

  // Titik ujung menegaskan panjang garis.
  for (const [ex, ey] of [[x1, y1], [x2, y2]]) {
    ctx.beginPath();
    ctx.arc(ex, ey, tebal * 0.9, 0, Math.PI * 2);
    ctx.fillStyle = WARNA_GARIS;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(2,6,23,0.55)";
    ctx.stroke();
  }

  // Panah dua arah di tengah. Dilewati kalau garisnya terlalu pendek di layar —
  // panah dan dua label di ruang sesempit itu hanya jadi gumpalan.
  if (len < 70) {
    ctx.restore();
    return;
  }

  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const panah = Math.max(14, Math.min(len * 0.14, 46));
  const kepala = Math.max(5, Math.min(panah * 0.34, 12));

  const gambarPanah = (sisiX: number, sisiY: number, warna: string) => {
    const tipX = mx + sisiX * panah;
    const tipY = my + sisiY * panah;
    ctx.strokeStyle = "rgba(2,6,23,0.6)";
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(tipX - sisiX * kepala * 0.6, tipY - sisiY * kepala * 0.6);
    ctx.stroke();
    ctx.strokeStyle = warna;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = warna;
    drawArrowHead(ctx, tipX, tipY, sisiX, sisiY, kepala);
  };

  gambarPanah(nx, ny, WARNA_IN);
  gambarPanah(-nx, -ny, WARNA_OUT);

  const ukuranHuruf = Math.max(11, Math.min(len * 0.05, 20));
  ctx.font = `800 ${Math.round(ukuranHuruf)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";

  const jarakLabel = panah + ukuranHuruf * 0.9;
  labelTegas(ctx, "IN", mx + nx * jarakLabel, my + ny * jarakLabel, WARNA_IN);
  labelTegas(ctx, "OUT", mx - nx * jarakLabel, my - ny * jarakLabel, WARNA_OUT);

  // Wajib: fungsi ini mengubah font, textAlign, dan textBaseline yang dipakai
  // lapisan kotak deteksi sesudahnya.
  ctx.restore();
}

export default function CctvAiOverlay({ videoRef, boxes, lines, zones, aiRef }: CctvAiOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    let raf = 0;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const cssW = video.clientWidth;
      const cssH = video.clientHeight;

      if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);
      }
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      const refW = aiRef?.width || video.videoWidth || cssW;
      const refH = aiRef?.height || video.videoHeight || cssH;
      if (!refW || !refH) {
        raf = requestAnimationFrame(draw);
        return;
      }

      // `object-fit: contain` menyisakan bilah hitam bila rasionya berbeda;
      // offset di bawah yang membuat kotak tidak melenceng ke bilah itu.
      const scale = Math.min(cssW / refW, cssH / refH);
      const offX = (cssW - refW * scale) / 2;
      const offY = (cssH - refH * scale) / 2;
      const sx = (x: number) => offX + x * scale;
      const sy = (y: number) => offY + y * scale;

      // ── 1. Zona poligon ──────────────────────────────────────────────
      // Isian sangat tipis + garis putus-putus: ini bidang setelan, bukan
      // temuan AI, jadi tidak boleh menyaingi kotak deteksi.
      for (const z of zones) {
        if (z.points.length < 3) continue;
        ctx.beginPath();
        ctx.moveTo(sx(z.points[0][0]), sy(z.points[0][1]));
        for (const [px, py] of z.points.slice(1)) ctx.lineTo(sx(px), sy(py));
        ctx.closePath();

        ctx.fillStyle = "rgba(56,189,248,0.10)";
        ctx.fill();
        ctx.strokeStyle = "#38BDF8";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([7, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // ── 2. Garis hitung + penunjuk IN/OUT ────────────────────────────
      for (const l of lines) {
        drawCountingLine(ctx, sx(l.x1), sy(l.y1), sx(l.x2), sy(l.y2));
      }

      // ── 3. Kotak deteksi ─────────────────────────────────────────────
      ctx.font = "700 13px system-ui, sans-serif";
      ctx.textBaseline = "top";
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      for (const b of boxes) {
        const x = sx(Math.min(b.x1, b.x2));
        const y = sy(Math.min(b.y1, b.y2));
        const w = Math.abs(b.x2 - b.x1) * scale;
        const h = Math.abs(b.y2 - b.y1) * scale;

        // Digambar dua kali: garis gelap sedikit lebih tebal dulu sebagai bayangan,
        // baru hijaunya di atas. Tanpa itu, kotak hijau di atas latar terang (aspal,
        // dinding putih) nyaris tak terlihat. Selisihnya cukup 1,5px — kalau bayangan
        // terlalu tebal, garisnya terbaca gemuk lagi meski hijaunya sudah tipis.
        traceCornerBox(ctx, x, y, w, h);
        ctx.strokeStyle = "rgba(2,6,23,0.5)";
        ctx.lineWidth = 3.5;
        ctx.stroke();

        ctx.strokeStyle = "#22C55E";
        ctx.lineWidth = 2;
        ctx.stroke();

        if (b.label) {
          // Diberi jarak dari garis atas — garis tepi gelap pada teks membuat
          // huruf "melebar", jadi jarak 1–2px masih terlihat menempel.
          // Saat kotak menyentuh tepi atas frame, label pindah ke dalam kotak.
          const ly = y - 21 < 0 ? y + 4 : y - 21;
          // Teks bergaris tepi, bukan di dalam kotak isian: kotak isian menutupi
          // bagian gambar yang justru sedang dijelaskannya.
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = "rgba(2,6,23,0.75)";
          ctx.strokeText(b.label, x, ly);
          ctx.fillStyle = "#22C55E";
          ctx.fillText(b.label, x, ly);
        }
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [videoRef, boxes, lines, zones, aiRef]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
}
