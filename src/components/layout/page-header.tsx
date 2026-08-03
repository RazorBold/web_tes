import React from "react";

/** Page hero header with merah-putih flag chip. */
export default function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
      <div>
        <div className="flex items-center gap-2.5">
          {/* Merah Putih flag chip */}
          <span className="inline-flex flex-col w-5 h-3.5 rounded-[3px] overflow-hidden border border-slate-300/70 shadow-sm flex-shrink-0">
            <span className="flex-1 bg-brand-red" />
            <span className="flex-1 bg-white" />
          </span>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none">
            {title}
          </h1>
        </div>
        <p className="text-[14px] text-slate-500 font-medium mt-1.5 ml-[30px]">{subtitle}</p>
      </div>
      {right && <div className="flex items-center gap-2 ml-[30px] md:ml-0">{right}</div>}
    </div>
  );
}
