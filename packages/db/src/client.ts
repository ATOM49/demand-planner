import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import type DatabaseConstructor from "better-sqlite3";
import type { drizzle as drizzleFn } from "drizzle-orm/better-sqlite3";

import { getConfig } from "@demand-planner/config";

import * as schema from "./schema";

const require = createRequire(import.meta.url);

type SqliteConstructor = typeof DatabaseConstructor;
type SqliteDatabase = InstanceType<SqliteConstructor>;
type DrizzleFactory = typeof drizzleFn;
type DrizzleModule = { drizzle: DrizzleFactory };

let sqlite: SqliteDatabase | undefined;
let sqliteConstructor: SqliteConstructor | undefined;
let drizzleFactory: DrizzleFactory | undefined;
let sqliteNativeBindingPath: string | undefined;

function getSqliteNativeBindingPath(): string {
  if (sqliteNativeBindingPath) {
    return sqliteNativeBindingPath;
  }

  const candidateRoots = [process.cwd(), path.resolve(process.cwd(), "../..")];

  for (const root of candidateRoots) {
    const pnpmDirectory = path.join(root, "node_modules", ".pnpm");
    if (!fs.existsSync(pnpmDirectory)) {
      continue;
    }

    const betterSqlitePackage = fs
      .readdirSync(pnpmDirectory)
      .find((entry) => entry.startsWith("better-sqlite3@"));

    if (!betterSqlitePackage) {
      continue;
    }

    const bindingPath = path.join(
      pnpmDirectory,
      betterSqlitePackage,
      "node_modules",
      "better-sqlite3",
      "build",
      "Release",
      "better_sqlite3.node",
    );

    if (fs.existsSync(bindingPath)) {
      sqliteNativeBindingPath = bindingPath;
      return sqliteNativeBindingPath;
    }
  }

  throw new Error("Could not locate better-sqlite3 native binding.");
}

function getSqliteConstructor(): SqliteConstructor {
  sqliteConstructor ??= require("better-sqlite3") as SqliteConstructor;
  return sqliteConstructor;
}

function getDrizzleFactory(): DrizzleFactory {
  drizzleFactory ??= (require("drizzle-orm/better-sqlite3") as DrizzleModule).drizzle;
  return drizzleFactory;
}

export function getSqlite(): SqliteDatabase {
  if (!sqlite) {
    const { sqliteFilePath } = getConfig();
    const Database = getSqliteConstructor();
    fs.mkdirSync(path.dirname(sqliteFilePath), { recursive: true });
    const sqliteInstance = new Database(sqliteFilePath, { nativeBinding: getSqliteNativeBindingPath() });
    sqliteInstance.pragma("journal_mode = WAL");
    sqlite = sqliteInstance;
  }

  return sqlite;
}

export function getDb() {
  return getDrizzleFactory()(getSqlite(), { schema });
}
