export interface Alert {
  id: string;
  module: string;
  sourceId: string | null;
  severity: "info" | "warning" | "critical";
  status: "active" | "acknowledged" | "resolved";
  title: string;
  sourceLabel: string;
  value: number | null;
  threshold: number | null;
  createdAt: string;
  acknowledgedAt: string | null;
}
