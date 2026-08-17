import { test, expect } from "@playwright/test";

// NOTE: this only exercises the username picker UI (live-availability check,
// submit-button gating) — it does NOT submit the sign-up form, because
// Supabase Auth's own signup rate limit gets exhausted fast from repeated
// test runs and that's a Supabase-side 429, not something this app controls.
// The actual account-creation path (supabase.auth.signUp + profile update)
// reuses the same client calls already proven by the profile-edit username
// picker and the anonymous account-linking flow — verify those + a single
// manual signup in a real browser instead of hammering this endpoint.
test("sign-up username picker: validates, checks availability, gates submit", async ({ page }) => {
  const unique = Date.now();
  const emailAddr = `qa-signup-${unique}@example.com`;
  const desiredUsername = `qauser${unique}`.slice(0, 20);

  await page.goto("/login");
  await page.getByRole("button", { name: /^sign up$/i }).click();
  await page.getByPlaceholder(/notmycurrentemployer/i).fill(emailAddr);

  const submitButton = page.getByRole("button", { name: /^create account$/i });
  const usernameInput = page.getByPlaceholder("username");

  // No username yet: submit stays disabled.
  await page.getByPlaceholder("Password").fill("password123");
  await expect(submitButton).toBeDisabled();

  // Invalid username (too short): stays disabled, shows the format hint.
  await usernameInput.fill("ab");
  await expect(page.getByText(/lowercase letters, numbers, underscores/i)).toBeVisible();
  await expect(submitButton).toBeDisabled();

  // Valid + available: availability check runs and submit enables.
  await usernameInput.fill(desiredUsername);
  await expect(page.getByText(/checking availability/i)).toBeVisible({ timeout: 2000 }).catch(() => {});
  await expect(page.getByText(/that username is free/i)).toBeVisible({ timeout: 5000 });
  await expect(submitButton).toBeEnabled();

  await page.screenshot({ path: "test-results/screenshots/signup-username-picker.png", fullPage: true });

  // Taken username (an existing seeded profile from earlier in this
  // session): submit disables again.
  await usernameInput.fill("user89");
  await expect(page.getByText(/already claimed/i)).toBeVisible({ timeout: 5000 });
  await expect(submitButton).toBeDisabled();
});

test("anonymous user sees the account-linking form in settings", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /continue anonymously/i }).click();
  await page.waitForURL("/");
  await page.goto("/settings");
  await expect(page.getByText(/save your account/i)).toBeVisible({ timeout: 10000 });
  await page.screenshot({ path: "test-results/screenshots/link-account.png", fullPage: true });
});
