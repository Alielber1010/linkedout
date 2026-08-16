import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/qa",
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3100",
    screenshot: "on",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
