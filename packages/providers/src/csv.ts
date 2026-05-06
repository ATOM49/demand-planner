import { parse } from "csv-parse/sync";

export type CsvRecord = Record<string, string>;

export function parseCsv(input: string): CsvRecord[] {
  return parse(input, {
    columns: true,
    skip_empty_lines: true,
    trim: false,
  }) as CsvRecord[];
}

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function safeJsonParse(value: string): unknown {
  return JSON.parse(value);
}
