import React from "react";
import { AI_MODELS, type AiMode } from "@/config/cctv";

/** Ikon model AI CCTV — dipakai di halaman CCTV & Settings. */
export default function AiModeIcon({
  mode,
  className = "h-3 w-3",
}: {
  mode: AiMode;
  className?: string;
}) {
  const Icon = AI_MODELS[mode].Icon;
  return <Icon className={className} />;
}
