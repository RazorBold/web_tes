export function floodLevelLabel(level: "normal" | "waspada" | "siaga" | "bahaya"): string {
  switch (level) {
    case "bahaya":
      return "Bahaya (Siaga I)";
    case "siaga":
      return "Siaga (Siaga II)";
    case "waspada":
      return "Waspada (Siaga III)";
    default:
      return "Normal (Siaga IV)";
  }
}

const COMPASS_POINTS = ["U", "TL", "T", "TG", "S", "BD", "B", "BL"];

export function windDirectionLabel(degrees: number): string {
  const index = Math.round(degrees / 45) % 8;
  return COMPASS_POINTS[index];
}

export function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} mnt lalu`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  return `${days} hari lalu`;
}
