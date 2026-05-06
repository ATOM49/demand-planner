import fs from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { stageUploadedImport } from "../src/index";

const createdPaths: string[] = [];

afterEach(async () => {
  await Promise.all(
    createdPaths.splice(0).map(async (filePath) => {
      await fs.rm(filePath, { force: true });
    }),
  );
});

describe("storage uploads", () => {
  it("stages uploaded bytes under the import directory", async () => {
    const content = new TextEncoder().encode("item_id,timestamp\nSKU_TEST,2025-01-01\n");

    const staged = await stageUploadedImport("aggregated_data_valid.csv", content, "actuals");
    createdPaths.push(staged.stagedPath);

    expect(staged.fileName).toBe("aggregated_data_valid.csv");
    expect(staged.stagedPath).toContain(`${path.sep}imports${path.sep}actuals${path.sep}`);
    await expect(fs.readFile(staged.stagedPath, "utf8")).resolves.toContain("SKU_TEST");
  });

  it("sanitizes uploaded file names before staging", async () => {
    const content = new TextEncoder().encode("forecast payload");

    const staged = await stageUploadedImport("../unsafe.csv", content, "forecasts");
    createdPaths.push(staged.stagedPath);

    expect(staged.fileName).toBe("unsafe.csv");
    expect(path.basename(staged.stagedPath)).toMatch(/unsafe\.csv$/);
  });
});