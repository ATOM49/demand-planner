import fs from "node:fs";

import { getConfig } from "@demand-planner/config";

function removeIfPresent(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    return;
  }

  fs.rmSync(filePath, { force: true });
}

export function clearDatabase(): void {
  const { sqliteFilePath } = getConfig();

  removeIfPresent(sqliteFilePath);
  removeIfPresent(`${sqliteFilePath}-shm`);
  removeIfPresent(`${sqliteFilePath}-wal`);
}

clearDatabase();