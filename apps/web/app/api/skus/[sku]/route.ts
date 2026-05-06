import { NextResponse } from "next/server";

import { SkuSeriesResponseSchema } from "@demand-planner/contracts";

import { getSkuPageData } from "../../../../lib/server/dashboard";

export async function GET(_: Request, context: { params: Promise<{ sku: string }> }) {
  const { sku } = await context.params;
  const data = await getSkuPageData(sku);

  if (!data) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json(SkuSeriesResponseSchema.parse(data));
}
