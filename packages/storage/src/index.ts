import fs from "node:fs/promises";
import path from "node:path";

import { getConfig } from "@demand-planner/config";

export type ImportKind = "actuals" | "forecasts";

function resolveStagedImportPath(kind: ImportKind, fileName: string): string {
  const safeFileName = path.basename(fileName);

  return path.join(
    getConfig().resolvedDataDir,
    "imports",
    kind,
    `${Date.now()}-${safeFileName}`,
  );
}

export async function ensureStorageDirectories(): Promise<void> {
  const { resolvedDataDir } = getConfig();
  await fs.mkdir(path.join(resolvedDataDir, "imports", "actuals"), { recursive: true });
  await fs.mkdir(path.join(resolvedDataDir, "imports", "forecasts"), { recursive: true });
}

export async function stageLocalImport(sourcePath: string, kind: ImportKind): Promise<{ fileName: string; stagedPath: string }> {
  await ensureStorageDirectories();
  const absoluteSourcePath = path.isAbsolute(sourcePath) ? sourcePath : path.resolve(sourcePath);
  const fileName = path.basename(absoluteSourcePath);
  const stagedPath = resolveStagedImportPath(kind, fileName);

  await fs.copyFile(absoluteSourcePath, stagedPath);

  return { fileName, stagedPath };
}

export async function stageUploadedImport(
  fileName: string,
  content: Uint8Array,
  kind: ImportKind,
): Promise<{ fileName: string; stagedPath: string }> {
  await ensureStorageDirectories();
  const safeFileName = path.basename(fileName);
  const stagedPath = resolveStagedImportPath(kind, safeFileName);

  await fs.writeFile(stagedPath, content);

  return { fileName: safeFileName, stagedPath };
}
