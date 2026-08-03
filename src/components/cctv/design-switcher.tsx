"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid } from "lucide-react";

/**
 * Pemindah varian tampilan CCTV & AI.
 *
 * Ada dua salinan tampilan yang berdiri sendiri (src/components/cctv/v1 dan
 * /v2) supaya keduanya bisa dikerjakan tanpa saling mengganggu. Yang TIDAK
 * diduplikasi adalah mesinnya — pemutar stream dan overlay bounding box ada di
 * src/components/cctv/shared dan dipakai dua-duanya, jadi perbaikan seperti
 * jeda koneksi wsai atau penjaga stream kosong cukup dikerjakan sekali.
 *
 * Tombol ini sengaja tampil di halaman, bukan di sidebar: keduanya varian dari
 * satu menu yang sama, dan saat membandingkan desain, saklarnya paling enak
 * berada tepat di atas yang sedang dibandingkan.
 */

const VARIAN = [
  { href: "/cctv/v1", label: "V1" },
  { href: "/cctv/v2", label: "V2" },
];

export default function DesignSwitcher() {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <span className="flex items-center gap-2 text-[12px] font-bold text-slate-400">
        <LayoutGrid className="h-3.5 w-3.5" />
        Varian tampilan
      </span>

      <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1">
        {VARIAN.map((v) => {
          const aktif = pathname === v.href;
          return (
            <Link
              key={v.href}
              href={v.href}
              aria-current={aktif ? "page" : undefined}
              className={`px-3.5 py-1.5 rounded-lg text-[12px] font-extrabold tracking-wide transition-colors ${
                aktif
                  ? "bg-brand-red text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white"
              }`}
            >
              {v.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
