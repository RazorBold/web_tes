import React from "react";

/** Numbered glass section panel — shared across all dashboard pages. */
export default function Section({
  num,
  title,
  subtitle,
  className = "",
  children,
}: {
  num: number;
  title: string;
  /** Keterangan kecil di bawah judul — mis. fokus AI atau nama model. Opsional
      supaya semua pemakaian Section yang sudah ada tidak berubah tampilannya. */
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`bg-white/30 backdrop-blur-sm border border-white/50 rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_12px_30px_-18px_rgba(15,23,42,0.12)] ${className}`}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <span className="h-6 w-6 rounded-lg bg-brand-red text-white text-[13px] font-extrabold flex items-center justify-center shadow-sm shadow-red-200/70 flex-shrink-0">
          {num}
        </span>
        <div className="min-w-0">
          <h2 className="text-[14px] font-extrabold text-slate-700 tracking-widest uppercase whitespace-nowrap">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[11px] font-semibold text-slate-400 mt-1 truncate">{subtitle}</p>
          )}
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
      </div>
      {children}
    </section>
  );
}
