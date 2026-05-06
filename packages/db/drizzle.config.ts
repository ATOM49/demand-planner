import { defineConfig } from "drizzle-kit";

import { getConfig } from "@demand-planner/config";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: getConfig().sqliteFilePath,
  },
});
