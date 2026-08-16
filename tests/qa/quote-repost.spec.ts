import { test, expect } from "@playwright/test";

test("repost toggles and quote embeds the original post", async ({ page }) => {
  const marker = `Quote-repost QA target post ${Date.now()}`;

  await page.goto("/login");
  await page.getByRole("button", { name: /continue anonymously/i }).click();
  await page.waitForURL("/");
  await page.getByPlaceholder(/corporate crime/i).click();
  await page.getByPlaceholder(/corporate crime/i).fill(marker);
  await page.getByRole("button", { name: /^vent$/i }).click();
  await expect(page.getByText(marker).first()).toBeVisible({ timeout: 10000 });

  const card = page.locator("article", { hasText: marker });

  // Plain repost toggle
  await card.getByRole("button", { name: /^repost/i }).click();
  await card.getByRole("menuitem", { name: /^repost$/i }).click();
  await expect(card.getByRole("button", { name: /^repost \(1\)/i })).toBeVisible({ timeout: 10000 });
  await page.screenshot({ path: "test-results/screenshots/repost-toggled.png", fullPage: true });

  // Quote
  await card.getByRole("button", { name: /^repost/i }).click();
  await card.getByRole("menuitem", { name: /^quote$/i }).click();
  await page.getByPlaceholder(/add a comment/i).fill("Quoting this for QA");
  await page.getByRole("button", { name: /^post$/i }).click();
  await expect(page.getByText("Quoting this for QA").first()).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(marker).nth(1)).toBeVisible({ timeout: 10000 });
  await page.screenshot({ path: "test-results/screenshots/quote-repost.png", fullPage: true });
});
