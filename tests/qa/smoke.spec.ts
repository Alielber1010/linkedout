import { test, expect } from "@playwright/test";

test("login page renders", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /negativity/i })).toBeVisible();
  await page.screenshot({ path: "test-results/screenshots/login.png", fullPage: true });
});
