import path from "node:path";
import { defineConfig } from "vitest/config";

const root = path.resolve(__dirname);

export default defineConfig({
  root,
  test: {
    environment: "node",
    include: [path.join(root, "packages/**/tests/**/*.test.ts")],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
  resolve: {
    alias: {
      "@demand-planner/contracts": path.join(root, "packages/contracts/src/index.ts"),
      "@demand-planner/config": path.join(root, "packages/config/src/index.ts"),
      "@demand-planner/providers": path.join(root, "packages/providers/src/index.ts"),
      "@demand-planner/domain": path.join(root, "packages/domain/src/index.ts"),
    },
  },
});
