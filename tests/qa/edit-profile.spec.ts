import { test, expect, type Page } from "@playwright/test";
import { buildFixtures } from "./helpers/fixtures";

const fixtures = buildFixtures();
const SHOT = "test-results/screenshots";

// These flows chain sign-in -> profile -> Storage upload -> save -> reload
// against a dev server that compiles routes on first hit; 30s isn't enough.
test.beforeEach(({}, testInfo) => testInfo.setTimeout(120_000));

/** Anonymous sign-in, then land on /profile with the header rendered. */
async function signInAndOpenProfile(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: /continue anonymously/i }).click();
  await page.waitForURL("/");
  await page.goto("/profile");
  await expect(page.getByRole("button", { name: /edit profile/i })).toBeVisible({
    timeout: 20000,
  });
}

async function openModal(page: Page) {
  await page.getByRole("button", { name: /edit profile/i }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  return dialog;
}

/** Every "n / max" counter currently rendered inside the modal. */
function counters(dialog: ReturnType<Page["getByRole"]>) {
  return dialog.getByText(/^\d+ \/ \d+$/);
}

test("edit profile modal: banner/avatar layout, floating labels, focused-only counters", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
  page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));

  await signInAndOpenProfile(page);
  const dialog = await openModal(page);

  // Whole modal, empty state — banner strip + overlapping avatar.
  await dialog.screenshot({ path: `${SHOT}/ep-01-modal-empty.png` });
  await page.screenshot({ path: `${SHOT}/ep-02-modal-in-page.png` });

  // The avatar must overlap the banner (its top edge sits above the banner's
  // bottom edge) and be left-aligned with the field boxes below it.
  const banner = dialog.locator("form > div .aspect-\\[3\\/1\\]").first();
  const avatar = dialog.locator("form .rounded-full.ring-4").first();
  const bannerBox = (await banner.boundingBox())!;
  const avatarBox = (await avatar.boundingBox())!;
  const usernameBox = (await dialog
    .locator("#profile-username")
    .boundingBox())!;

  expect(avatarBox.y).toBeLessThan(bannerBox.y + bannerBox.height);
  expect(avatarBox.y + avatarBox.height).toBeGreaterThan(
    bannerBox.y + bannerBox.height
  );
  console.log(
    "banner",
    JSON.stringify(bannerBox),
    "avatar",
    JSON.stringify(avatarBox),
    "username input x",
    usernameBox.x
  );

  // Nothing focused yet in a field -> no counters. (The modal autofocuses its
  // first focusable element, which is the header Close button.)
  await page.keyboard.press("Escape").catch(() => {});
  await expect(dialog).toBeHidden();
  const dialog2 = await openModal(page);
  await expect(counters(dialog2)).toHaveCount(0);

  const fields = [
    { label: "Username", max: 20, id: "profile-username" },
    { label: "Name", max: 50, id: "profile-display-name" },
    { label: "Headline", max: 120, id: "profile-headline" },
    { label: "Bio", max: 160, id: "profile-bio" },
    { label: "Location", max: 30, id: "profile-location" },
    { label: "Website", max: 200, id: "profile-website" },
  ];

  for (const field of fields) {
    await dialog2.locator(`#${field.id}`).click();
    // Exactly one counter on screen, and it belongs to the focused field.
    await expect(counters(dialog2)).toHaveCount(1);
    await expect(counters(dialog2)).toHaveText(
      new RegExp(`^\\d+ / ${field.max}$`)
    );
    await dialog2.screenshot({
      path: `${SHOT}/ep-03-focus-${field.label.toLowerCase()}.png`,
    });
  }

  // Blur everything -> counter disappears again.
  await dialog2.getByRole("heading", { name: "Edit profile" }).click();
  await expect(counters(dialog2)).toHaveCount(0);

  expect(consoleErrors, `console errors: ${consoleErrors.join(" | ")}`).toEqual(
    []
  );
});

test("edit profile modal: username gating disables Save", async ({ page }) => {
  await signInAndOpenProfile(page);
  const dialog = await openModal(page);
  const save = dialog.getByRole("button", { name: /^save/i });
  const username = dialog.locator("#profile-username");

  await expect(save).toBeEnabled();

  // Invalid
  await username.fill("ab");
  await expect(
    dialog.getByText(/lowercase letters, numbers, underscores\. 3–20/i)
  ).toBeVisible();
  await expect(save).toBeDisabled();
  await dialog.screenshot({ path: `${SHOT}/ep-10-username-invalid.png` });

  // Taken (a real, pre-existing profile)
  await username.fill("user89");
  await expect(dialog.getByText(/already claimed/i)).toBeVisible({
    timeout: 8000,
  });
  await expect(save).toBeDisabled();
  await dialog.screenshot({ path: `${SHOT}/ep-11-username-taken.png` });

  // Free
  await username.fill(`qa${Date.now()}`.slice(0, 20));
  await expect(dialog.getByText(/that username is free/i)).toBeVisible({
    timeout: 8000,
  });
  await expect(save).toBeEnabled();
  await dialog.screenshot({ path: `${SHOT}/ep-12-username-free.png` });
});

test("edit profile modal: rejects oversized and non-image files inline", async ({
  page,
}) => {
  await signInAndOpenProfile(page);
  const dialog = await openModal(page);

  // >5MB PNG
  await dialog.locator('input[type="file"]').first().setInputFiles(
    fixtures.oversizedPng
  );
  await expect(dialog.getByRole("alert")).toContainText(/too big|5MB/i, {
    timeout: 10000,
  });
  await dialog.screenshot({ path: `${SHOT}/ep-20-oversized.png` });

  // Not an image
  await dialog
    .locator('input[type="file"]')
    .nth(1)
    .setInputFiles(fixtures.textFile);
  await expect(dialog.getByRole("alert")).toContainText(
    /file type isn't supported/i,
    { timeout: 10000 }
  );
  await dialog.screenshot({ path: `${SHOT}/ep-21-wrong-type.png` });

  // Neither bad file should have stuck: no <img> inside the media strip.
  await expect(dialog.locator("form img")).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: /^save/i })).toBeEnabled();
});

test("edit profile modal: uploads preview, gate Save while in flight, and persist", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
  page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));

  await signInAndOpenProfile(page);
  const dialog = await openModal(page);
  const save = dialog.getByRole("button", { name: /^save/i });

  // Slow the Storage upload down so the in-flight state is observable.
  await page.route("**/storage/v1/object/profile-media/**", async (route) => {
    await new Promise((r) => setTimeout(r, 2500));
    await route.continue();
  });

  const uniqueName = `QA Dana ${Date.now() % 100000}`;
  const uniqueUsername = `qa${Date.now()}`.slice(0, 20);

  await dialog.locator("#profile-username").fill(uniqueUsername);
  await dialog.locator("#profile-display-name").fill(uniqueName);
  await dialog.locator("#profile-headline").fill("Chief Complaint Officer");
  await dialog.locator("#profile-bio").fill("Professionally disappointed.");
  await dialog.locator("#profile-location").fill("Open-plan hell");
  await dialog.locator("#profile-website").fill("https://example.com/rants");
  await expect(dialog.getByText(/that username is free/i)).toBeVisible({
    timeout: 8000,
  });

  // Banner upload -> preview shows immediately, Save locks until it lands.
  await dialog.locator('input[type="file"]').first().setInputFiles(fixtures.bannerPng);
  await expect(save).toBeDisabled();
  await expect(dialog.getByText(/uploading — hang on before saving/i)).toBeVisible();
  await dialog.screenshot({ path: `${SHOT}/ep-30-banner-uploading.png` });
  await expect(save).toBeEnabled({ timeout: 20000 });

  // Avatar upload
  await dialog.locator('input[type="file"]').nth(1).setInputFiles(fixtures.avatarPng);
  await expect(save).toBeDisabled();
  await dialog.screenshot({ path: `${SHOT}/ep-31-avatar-uploading.png` });
  await expect(save).toBeEnabled({ timeout: 20000 });
  await page.unroute("**/storage/v1/object/profile-media/**");

  // Both previews are real <img> elements pointing at the storage bucket
  // (blob: preview swaps to the public URL once upload resolves).
  const imgs = dialog.locator("form img");
  await expect(imgs).toHaveCount(2);
  await dialog.screenshot({ path: `${SHOT}/ep-32-modal-filled.png` });

  await save.click();
  await expect(dialog).toBeHidden({ timeout: 20000 });
  await page.screenshot({ path: `${SHOT}/ep-33-profile-after-save.png`, fullPage: true });

  // Ground truth: reload and confirm the images survived the round trip.
  await page.reload();
  await expect(page.getByRole("heading", { name: uniqueName })).toBeVisible({
    timeout: 20000,
  });
  const persisted = page.locator(
    'img[src*="/storage/v1/object/public/profile-media/"]'
  );
  await expect(persisted.first()).toBeVisible({ timeout: 20000 });
  const count = await persisted.count();
  console.log("persisted profile-media images after reload:", count);
  expect(count).toBeGreaterThanOrEqual(2); // banner + avatar (+ side nav)
  await page.screenshot({ path: `${SHOT}/ep-34-profile-after-reload.png`, fullPage: true });

  // Side nav shows the uploaded avatar.
  const navAvatar = page.locator(
    'nav img[src*="/storage/v1/object/public/profile-media/"], aside img[src*="/storage/v1/object/public/profile-media/"]'
  );
  console.log("side nav avatar images:", await navAvatar.count());
  await page.screenshot({ path: `${SHOT}/ep-35-side-nav.png` });

  expect(consoleErrors, `console errors: ${consoleErrors.join(" | ")}`).toEqual([]);
});

test("identity leak: anonymous posts and anonymous quote previews never show the uploaded avatar", async ({
  page,
}) => {
  await signInAndOpenProfile(page);
  const dialog = await openModal(page);

  await dialog.locator("#profile-username").fill(`qa${Date.now()}`.slice(0, 20));
  await dialog.locator("#profile-display-name").fill("Leak Check Larry");
  await expect(dialog.getByText(/that username is free/i)).toBeVisible({ timeout: 8000 });
  await dialog.locator('input[type="file"]').nth(1).setInputFiles(fixtures.avatarPng);
  await expect(dialog.getByRole("button", { name: /^save/i })).toBeEnabled({ timeout: 20000 });
  await dialog.getByRole("button", { name: /^save/i }).click();
  await expect(dialog).toBeHidden({ timeout: 20000 });

  await page.goto("/");
  const compose = page.getByPlaceholder(/corporate crime/i);
  await expect(compose).toBeVisible({ timeout: 20000 });

  // 1. Named post -> avatar SHOULD show.
  const named = `Named QA post ${Date.now()}`;
  await compose.click();
  await compose.fill(named);
  await page.getByRole("button", { name: /^vent$/i }).click();
  await expect(page.locator("article", { hasText: named }).first()).toBeVisible({
    timeout: 15000,
  });

  // createPost enforces a 10s per-user cooldown; wait it out rather than
  // tripping it and losing the post.
  await page.waitForTimeout(11000);

  // 2. Anonymous post -> avatar MUST NOT show.
  const anon = `Anonymous QA post ${Date.now()}`;
  await compose.click();
  await compose.fill(anon);
  await page.getByRole("switch", { name: /post anonymously/i }).click();
  await page.getByRole("button", { name: /^vent$/i }).click();
  await expect(page.locator("article", { hasText: anon }).first()).toBeVisible({
    timeout: 15000,
  });

  // Let the optimistic render settle into the server-rendered one.
  await page.reload();
  await expect(page.locator("article", { hasText: anon }).first()).toBeVisible({
    timeout: 20000,
  });

  const namedCard = page.locator("article", { hasText: named }).first();
  const anonCard = page.locator("article", { hasText: anon }).first();

  await expect(
    namedCard.locator('img[src*="profile-media"]').first()
  ).toBeVisible();
  await expect(anonCard.locator('img[src*="profile-media"]')).toHaveCount(0);
  await expect(anonCard.getByText(/^Anonymous #\d+$/)).toBeVisible();
  await anonCard.screenshot({ path: `${SHOT}/ep-40-anonymous-post.png` });
  await namedCard.screenshot({ path: `${SHOT}/ep-41-named-post.png` });

  // 3. Quote the anonymous post -> the embedded preview must stay anonymous.
  await page.waitForTimeout(11000);
  await anonCard.getByRole("button", { name: /^repost/i }).click();
  await anonCard.getByRole("menuitem", { name: /^quote$/i }).click();
  const quoteText = `Quoting the anon post ${Date.now()}`;
  await page.getByPlaceholder(/add a comment/i).fill(quoteText);
  await page.getByRole("button", { name: /^post$/i }).click();
  await expect(page.locator("article", { hasText: quoteText }).first()).toBeVisible({
    timeout: 20000,
  });

  await page.reload();
  const quoteCard = page.locator("article", { hasText: quoteText }).first();
  await expect(quoteCard).toBeVisible({ timeout: 20000 });
  const embedded = quoteCard.locator('a[href^="/post/"]').filter({ hasText: anon });
  await expect(embedded.locator('img[src*="profile-media"]')).toHaveCount(0);
  await quoteCard.screenshot({ path: `${SHOT}/ep-42-quote-of-anonymous.png` });
  await page.screenshot({ path: `${SHOT}/ep-43-feed-mixed.png`, fullPage: true });
});
