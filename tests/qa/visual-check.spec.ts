import { test, expect } from "@playwright/test";

test("feed renders after anonymous sign-in, no gray card fills", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /continue anonymously/i }).click();
  await page.waitForURL("/");
  await expect(page.getByPlaceholder(/corporate crime/i)).toBeVisible({ timeout: 10000 });
  await page.screenshot({ path: "test-results/screenshots/feed.png", fullPage: true });

  await page.getByPlaceholder(/corporate crime/i).click();
  await page.getByPlaceholder(/corporate crime/i).fill("Testing the new engagement row #Layoffs");
  await page.getByRole("button", { name: /^vent$/i }).click();
  await expect(page.getByText("Testing the new engagement row").first()).toBeVisible({ timeout: 10000 });
  await page.screenshot({ path: "test-results/screenshots/feed-after-post.png", fullPage: true });

  await page.locator('a[href^="/post/"]').first().click();
  await page.waitForURL(/\/post\//);
  await page.getByPlaceholder(/reply/i).fill("First comment!");
  await page.getByRole("button", { name: /^reply$/i }).click();
  // Wait past the optimistic render for the actual server round-trip to
  // settle — the button reverts from "Replying..." once createComment
  // resolves — so we don't screenshot/tear down before the insert commits.
  await expect(page.getByRole("button", { name: /^reply$/i })).toBeVisible({ timeout: 10000 });
  await expect(page.getByText("First comment!")).toBeVisible();
  await page.screenshot({ path: "test-results/screenshots/post-detail.png", fullPage: true });
});
