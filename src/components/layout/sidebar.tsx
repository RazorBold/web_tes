"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Monitor,
  Cpu,
  Droplets,
  Zap,
  Truck,
  Camera,
  Leaf,
  CloudSun,
  Waves,
  ThermometerSun,
  BarChart3,
  Bell,
  FileText,
  HardDrive,
  Plug,
  Settings,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { navigation } from "@/config/theme";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Monitor,
  Cpu,
  Droplets,
  Zap,
  Truck,
  Camera,
  Leaf,
  CloudSun,
  Waves,
  ThermometerSun,
  BarChart3,
  Bell,
  FileText,
  HardDrive,
  Plug,
  Settings,
};

export default function Sidebar() {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    "Sensor IoT": true,
  });

  const toggleMenu = (label: string) =>
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));

  const renderIcon = (iconName: string, className = "h-4 w-4") => {
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent className={className} /> : null;
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 overflow-y-auto">
      {/* Brand Header — Danantara × Telkom Indonesia (height matches topbar; dark→light gradient so both wordmarks read) */}
      <div className="flex-shrink-0 h-20 flex items-center px-4 border-b border-slate-200 bg-[linear-gradient(90deg,#0f172a_0%,#334155_40%,#cbd5e1_58%,#ffffff_80%)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Danantara Indonesia · Telkom Indonesia"
          className="w-full h-auto object-contain"
        />
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item, index) => {
          if (item.hidden) return null;

          if (item.type === "divider") {
            return <hr key={`div-${index}`} className="my-3 border-slate-100" />;
          }

          if (item.type === "header") {
            return (
              <div
                key={`hdr-${index}`}
                className="px-3 pt-4 pb-1 text-[12px] font-bold uppercase tracking-widest text-slate-400"
              >
                {item.label}
              </div>
            );
          }

          const isOpen = openMenus[item.label || ""] ?? false;
          // Cocok persis, ATAU berada di bawah `activePrefix` bila menu itu punya
          // beberapa halaman setara. CCTV & AI menunjuk ke /cctv/v1 tapi harus
          // tetap menyala di /cctv/v2 — tanpa ini menunya padam begitu varian
          // lain dibuka. Awalannya ditulis eksplisit di konfigurasi, bukan
          // disimpulkan dari href, supaya menu lain tidak ikut kena aturan ini.
          const isActive =
            pathname === item.href ||
            (!!item.activePrefix &&
              (pathname === item.activePrefix || pathname.startsWith(`${item.activePrefix}/`)));

          if (item.collapsible) {
            return (
              <div key={item.label} className="space-y-1">
                <button
                  onClick={() => toggleMenu(item.label || "")}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500">
                      {renderIcon(item.icon || "")}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                </button>

                {isOpen && item.children && (
                  <div className="pl-6 space-y-1">
                    {item.children.map((child) => {
                      const isChildActive = pathname === child.href;
                      return (
                        <Link
                          key={child.label}
                          href={child.href}
                          className={`flex items-center gap-3 px-3 py-1.5 text-[14px] font-medium rounded-lg transition-colors ${
                            isChildActive
                              ? "bg-red-50 text-brand-red"
                              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <span className="h-7 w-7 rounded-lg bg-slate-50 flex items-center justify-center">
                            {renderIcon(child.icon || "", "h-3.5 w-3.5")}
                          </span>
                          <span>{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href || "/"}
              className={`flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-xl transition-colors ${
                isActive
                  ? "bg-red-50 text-brand-red"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                    isActive ? "bg-brand-red text-white" : "bg-slate-50 text-slate-500"
                  }`}
                >
                  {renderIcon(item.icon || "")}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="bg-brand-red text-white text-[12px] font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3 space-y-3 flex-shrink-0">
        {/* Pride promo card */}
        <div className="bg-gradient-to-br from-brand-red to-red-700 rounded-2xl p-4 text-white relative overflow-hidden shadow-md">
          <div className="absolute right-[-20px] top-[-20px] h-24 w-24 bg-white/10 rounded-full" />
          <div className="absolute right-[-30px] bottom-[-30px] h-20 w-20 bg-white/10 rounded-full" />
          <h4 className="font-extrabold text-sm leading-tight relative">
            Bangga
            <br />
            Buatan Indonesia
          </h4>
          <p className="text-[13px] text-white/80 mt-2 relative">
            Menuju Indonesia Smart &amp; Digital
          </p>
        </div>

        {/* System Status */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center gap-3 shadow-sm">
          <div className="relative h-9 w-9 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
            <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="absolute h-2.5 w-2.5 bg-emerald-500 rounded-full animate-ping opacity-40" />
          </div>
          <div className="leading-tight">
            <h5 className="font-bold text-[14px] text-slate-800">System Status</h5>
            <span className="text-[13px] text-emerald-600 font-semibold">All System Operational</span>
          </div>
        </div>

        <div className="text-center px-1 leading-tight">
          <p className="text-[12px] text-slate-400">&copy; 2026 Merah Putih IoT Platform</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Edited by <span className="font-bold text-brand-red">PT Telkom Indonesia</span>
          </p>
        </div>
      </div>
    </aside>
  );
}
