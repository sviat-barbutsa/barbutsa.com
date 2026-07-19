import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: [
        "src/lib/atlas/model.ts",
        "src/theme/{state,strategy}.ts",
        "src/theme/animations/{fluid,radial}.ts",
        "src/lib/content/article-policy.ts",
        "src/lib/runtime/{activity-gate,pause-registry}.ts",
        "src/lib/telemetry-core.ts",
        "src/lib/flamenco/{collision,score-storage}.ts",
      ],
      thresholds: {
        perFile: true,
        lines: 85,
        statements: 85,
        functions: 85,
        branches: 80,
      },
    },
  },
});
