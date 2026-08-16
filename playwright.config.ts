import { devices, defineConfig } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:4321";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
  retries: process.env.CI ? 1 : 0,
  // Keep local release runs below Windows' localhost socket-pressure ceiling.
  // The route and accessibility suites crawl the full static site in parallel.
  workers: process.env.CI ? 1 : 8,
  reporter: [["line"], ["html", { open: "never" }]],
  // Text rendering differs between operating systems, so visual baselines are
  // kept per platform: -win32 (authored locally) and -linux (rendered by the
  // "Snapshots" workflow and committed after review).
  snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}-{projectName}-{platform}{ext}",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: process.env.E2E_SKIP_WEB_SERVER
    ? undefined
    : {
        command: "pnpm preview --host 127.0.0.1 --port 4321",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
      },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "chromium-mobile",
      use: {
        ...devices["Pixel 7"],
      },
    },
  ],
});
