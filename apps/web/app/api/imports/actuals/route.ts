import { NextResponse } from "next/server";

import { ImportSourceSchema, ImportUploadFieldName } from "@demand-planner/contracts";
import { normalizeError } from "@demand-planner/observability";

import { importActualsFromPath, importActualsFromUpload } from "../../../../lib/server/imports";

async function resolveActualsImport(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get(ImportUploadFieldName);

    if (!file || typeof file === "string") {
      throw new Error("Expected a CSV file upload.");
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      throw new Error("Expected a .csv file.");
    }

    return importActualsFromUpload(file.name, new Uint8Array(await file.arrayBuffer()));
  }

  const payload = ImportSourceSchema.parse(await request.json());
  return importActualsFromPath(payload.sourcePath);
}

export async function POST(request: Request) {
  try {
    const result = await resolveActualsImport(request);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(normalizeError(error), { status: 400 });
  }
}
