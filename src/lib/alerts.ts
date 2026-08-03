import { query } from "@/lib/db";
import type { Alert } from "@/types/alert";

interface AlertRow {
  id: string;
  module: string;
  source_id: string | null;
  severity: string;
  status: string;
  title: string;
  source_label: string;
  value: number | null;
  threshold: number | null;
  created_at: Date;
  acknowledged_at: Date | null;
}

function mapAlert(r: AlertRow): Alert {
  return {
    id: r.id,
    module: r.module,
    sourceId: r.source_id,
    severity: r.severity as Alert["severity"],
    status: r.status as Alert["status"],
    title: r.title,
    sourceLabel: r.source_label,
    value: r.value,
    threshold: r.threshold,
    createdAt: r.created_at.toISOString(),
    acknowledgedAt: r.acknowledged_at ? r.acknowledged_at.toISOString() : null,
  };
}

export async function listAlerts(): Promise<Alert[]> {
  const rows = await query<AlertRow>("SELECT * FROM alerts ORDER BY created_at DESC");
  return rows.map(mapAlert);
}
