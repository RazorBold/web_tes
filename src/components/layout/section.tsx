import React from "react";

/** Numbered glass section panel — shared across all dashboard pages. */
export default function Section({
  num,
  title,
  className = "",
  children,
}: {
  num: number;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`bg-white/30 backdrop-blur-sm border border-white/50 rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_12px_30px_-18px_rgba(15,23,42,0.12)] ${className}`}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <span className="h-6 w-6 rounded-lg bg-brand-red text-white text-[11px] font-extrabold flex items-center justify-center shadow-sm shadow-red-200/70 flex-shrink-0">
          {num}
        </span>
        <h2 className="text-[12px] font-extrabold text-slate-700 tracking-widest uppercase whitespace-nowrap">
          {title}
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
      </div>
      {children}
    </section>
  );
}
