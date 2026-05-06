import fs from "node:fs/promises";

import {
  AggregatedActualImportRowSchema,
  type AggregatedActualImportRow,
} from "@demand-planner/contracts";

import { parseCsv, isIsoDate, safeJsonParse } from "./csv";
import { CsvValidationError, type CsvRowIssue } from "./errors";

type RawDemandDrivers = {
  avg_unit_price?: unknown;
  cust_instock?: unknown;
};

export function parseAggregatedActualsCsv(input: string, fileName: string): AggregatedActualImportRow[] {
  const records = parseCsv(input);
  const issues: CsvRowIssue[] = [];
  const dedupe = new Set<string>();
  const parsedRows: AggregatedActualImportRow[] = [];

  records.forEach((record, index) => {
    const rowNumber = index + 2;
    const itemId = record.item_id?.trim();
    const timestamp = record.timestamp?.trim();
    const unitsSoldValue = record.units_sold?.trim();
    const demandDriversRaw = record.demand_drivers;

    if (!itemId) {
      issues.push({ fileName, rowNumber, field: "item_id", reason: "Missing item_id" });
      return;
    }

    if (!timestamp || !isIsoDate(timestamp)) {
      issues.push({ fileName, rowNumber, itemId, field: "timestamp", reason: "Invalid timestamp" });
      return;
    }

    const unitsSold = Number(unitsSoldValue);
    if (!Number.isFinite(unitsSold)) {
      issues.push({
        fileName,
        rowNumber,
        itemId,
        field: "units_sold",
        reason: "Non-numeric units_sold",
      });
      return;
    }

    if (!demandDriversRaw) {
      issues.push({
        fileName,
        rowNumber,
        itemId,
        field: "demand_drivers",
        reason: "Invalid demand_drivers JSON",
      });
      return;
    }

    let drivers: RawDemandDrivers;
    try {
      drivers = safeJsonParse(demandDriversRaw) as RawDemandDrivers;
    } catch {
      issues.push({
        fileName,
        rowNumber,
        itemId,
        field: "demand_drivers",
        reason: "Invalid demand_drivers JSON",
      });
      return;
    }

    const avgUnitPrice = drivers.avg_unit_price;
    if (!Number.isFinite(avgUnitPrice)) {
      issues.push({
        fileName,
        rowNumber,
        itemId,
        field: "avg_unit_price",
        reason: "Missing avg_unit_price",
      });
      return;
    }

    const custInStock = drivers.cust_instock;
    if (
      typeof custInStock !== "number" ||
      !Number.isFinite(custInStock) ||
      custInStock < 0 ||
      custInStock > 1
    ) {
      issues.push({
        fileName,
        rowNumber,
        itemId,
        field: "cust_instock",
        reason: "cust_instock must be between 0 and 1",
      });
      return;
    }

    const naturalKey = `${itemId}:${timestamp}`;
    if (dedupe.has(naturalKey)) {
      issues.push({
        fileName,
        rowNumber,
        itemId,
        field: "item_id+timestamp",
        reason: "Duplicate natural key",
      });
      return;
    }
    dedupe.add(naturalKey);

    parsedRows.push(
      AggregatedActualImportRowSchema.parse({
        sku: itemId,
        date: timestamp,
        unitsSold,
        avgUnitPrice,
        custInStock,
      }),
    );
  });

  if (issues.length > 0) {
    throw new CsvValidationError(`Failed to parse ${fileName}`, issues);
  }

  return parsedRows;
}

export async function parseAggregatedActualsCsvFile(filePath: string): Promise<AggregatedActualImportRow[]> {
  const input = await fs.readFile(filePath, "utf8");
  return parseAggregatedActualsCsv(input, filePath);
}
