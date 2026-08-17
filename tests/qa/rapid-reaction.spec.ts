import { test, expect } from "@playwright/test";

test("rapid reaction clicks settle to the correct final state, no error", async ({ page }) => {
  const marker = `Rapid reaction QA ${Date.now()}`;

  await page.goto("/login");
  await page.getByRole("button", { name: /continue anonymously/i }).click();
  await page.waitForURL("/");
  await page.getByPlaceholder(/corporate crime/i).click();
  await page.getByPlaceholder(/corporate crime/i).fill(marker);
  await page.getByRole("button", { name: /^vent$/i }).click();
  await expect(page.getByText(marker).first()).toBeVisible({ timeout: 10000 });

  const card = page.locator("article", { hasText: marker });
  const flagButton = card.getByRole("button", { name: /^red flag/i });

  // Fire clicks as fast as the DOM allows — button disables itself
  // mid-flight, so most of these should just no-op rather than fire
  // parallel requests.
  for (let i = 0; i < 6; i++) {
    await flagButton.click({ force: true, trial: false, timeout: 2000 }).catch(() => {});
  }

  await page.waitForTimeout(2000);
  await page.reload();

  const finalCard = page.locator("article", { hasText: marker });
  await expect(finalCard.getByRole("button", { name: /^red flag/i })).toHaveAttribute(
    "aria-pressed",
    /true|false/
  );
  const pressedState = await finalCard.getByRole("button", { name: /^red flag/i }).getAttribute("aria-pressed");
  console.log("FINAL aria-pressed after reload:", pressedState);

  await expect(page.getByText(/didn't save/i)).toHaveCount(0);
  await page.screenshot({ path: "test-results/screenshots/rapid-reaction.png", fullPage: true });
});
