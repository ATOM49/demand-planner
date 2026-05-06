import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { getConfig } from "../src/index";

const originalCwd = process.cwd();
const workspaceRoot = path.resolve(__dirname, "../../..");

afterEach(() => {
  process.chdir(originalCwd);
});

describe("config path resolution", () => {
  it("resolves relative paths from the monorepo root when called from the db package", () => {
    process.chdir(path.join(workspaceRoot, "packages/db"));

    const config = getConfig({
      NODE_ENV: "test",
      LOG_LEVEL: "debug",
      DATA_DIR: "./data",
      DATABASE_URL: "file:./data/demand-planner.sqlite",
      ALERT_ACTUAL_LOOKBACK_DAYS: "28",
      ALERT_FORECAST_JUMP_THRESHOLD: "0.25",
      ALERT_FORECAST_DROP_THRESHOLD: "0.25",
      ALERT_UNCERTAINTY_RATIO_THRESHOLD: "0.4",
      ALERT_PRICE_CHANGE_THRESHOLD: "0.05",
      ALERT_IN_STOCK_CHANGE_THRESHOLD: "0.15",
      IMPORT_MAX_FILE_MB: "20",
    });

    expect(config.workspaceRoot).toBe(workspaceRoot);
    expect(config.resolvedDataDir).toBe(path.join(workspaceRoot, "data"));
    expect(config.sqliteFilePath).toBe(path.join(workspaceRoot, "data", "demand-planner.sqlite"));
  });

  it("resolves the same root data paths when called from the web app", () => {
    process.chdir(path.join(workspaceRoot, "apps/web"));

    const config = getConfig({
      NODE_ENV: "test",
      LOG_LEVEL: "debug",
      DATA_DIR: "./data",
      DATABASE_URL: "file:./data/demand-planner.sqlite",
      ALERT_ACTUAL_LOOKBACK_DAYS: "28",
      ALERT_FORECAST_JUMP_THRESHOLD: "0.25",
      ALERT_FORECAST_DROP_THRESHOLD: "0.25",
      ALERT_UNCERTAINTY_RATIO_THRESHOLD: "0.4",
      ALERT_PRICE_CHANGE_THRESHOLD: "0.05",
      ALERT_IN_STOCK_CHANGE_THRESHOLD: "0.15",
      IMPORT_MAX_FILE_MB: "20",
    });

    expect(config.workspaceRoot).toBe(workspaceRoot);
    expect(config.resolvedDataDir).toBe(path.join(workspaceRoot, "data"));
    expect(config.sqliteFilePath).toBe(path.join(workspaceRoot, "data", "demand-planner.sqlite"));
  });
});