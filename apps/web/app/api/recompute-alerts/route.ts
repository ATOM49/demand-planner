import { NextResponse } from "next/server";

import { recomputeAlertData } from "../../../lib/server/imports";

export async function POST() {
  const result = await recomputeAlertData();
  return NextResponse.json(result);
}
