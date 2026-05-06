import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const nextConfig: NextConfig = {
  transpilePackages: [
    "@demand-planner/config",
    "@demand-planner/contracts",
    "@demand-planner/db",
    "@demand-planner/domain",
    "@demand-planner/observability",
    "@demand-planner/providers",
    "@demand-planner/storage",
  ],
  serverExternalPackages: ["better-sqlite3"],
  outputFileTracingRoot: workspaceRoot,
};

export default nextConfig;
