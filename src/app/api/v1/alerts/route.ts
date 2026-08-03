import { listAlerts } from "@/lib/alerts";
import { ok } from "@/lib/api-response";

export async function GET() {
  const alerts = await listAlerts();
  return ok(alerts, { page: 1, pageSize: alerts.length, total: alerts.length });
}
