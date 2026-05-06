import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SkuListResponseSchema } from "@demand-planner/contracts";

import { listSkusData, parseSkuListQuery } from "../../../lib/server/dashboard";

export async function GET(request: NextRequest) {
  const query = parseSkuListQuery(request.nextUrl.searchParams);
  const data = await listSkusData(query);
  return NextResponse.json(SkuListResponseSchema.parse(data));
}
