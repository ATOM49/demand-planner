import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { listAlertsData } from "../../../lib/server/dashboard";

export async function GET(request: NextRequest) {
  const severity = request.nextUrl.searchParams.get("severity") ?? undefined;
  const alerts = await listAlertsData(severity);
  return NextResponse.json({ items: alerts, total: alerts.length });
}
