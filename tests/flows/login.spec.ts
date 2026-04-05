import { test, expect, type Page } from "@playwright/test";

const pass = process.env.SAUCE_PASSWORD ?? "secret_sauce";
const invalidPass = process.env.SAUCE_INVALID_PASSWORD ?? "wrong_password";
const invalidUser = process.env.SAUCE_INVALID_USERNAME ?? "invalid_user";

const u = {
  standard: process.env.SAUCE_STANDARD_USERNAME ?? "standard_user",
  locked: process.env.SAUCE_LOCKED_USERNAME ?? "locked_out_user",
  problem: process.env.SAUCE_PROBLEM_USERNAME ?? "problem_user",
  glitch: process.env.SAUCE_PERFORMANCE_GLITCH_USERNAME ?? "performance_glitch_user",
  error: process.env.SAUCE_ERROR_USERNAME ?? "error_user",
  visual: process.env.SAUCE_VISUAL_USERNAME ?? "visual_user",
};

async function attemptLogin(page: Page, username: string) {
  await page.goto("/");
  await page.locator('[data-test="username"]').fill(username);
  await page.locator('[data-test="password"]').fill(pass);
  await page.locator('[data-test="login-button"]').click();
}

test.describe("standard_user", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("logs in and shows catalog with correct cart chrome", async ({ page }) => {
    await attemptLogin(page, u.standard);
    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(page.locator('[data-test="title"]')).toHaveText("Products");
    await expect(page.locator(".inventory_item").first()).toBeVisible();
    await expect(page.locator(".shopping_cart_container")).not.toHaveClass(/visual_failure/);
    await expect(page.locator(".inventory_item img").first()).not.toHaveAttribute("src", /sl-404/);
  });
});

test.describe("locked_out_user", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("blocks login with locked out message", async ({ page }) => {
    await attemptLogin(page, u.locked);
    await expect(page.locator('[data-test="error"]')).toContainText(
      "Sorry, this user has been locked out"
    );
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe("problem_user", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("logs in but product images show broken placeholder", async ({ page }) => {
    await attemptLogin(page, u.problem);
    await expect(page).toHaveURL(/\/inventory\.html$/);
    const imgs = page.locator(".inventory_item img");
    const count = await imgs.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      await expect(imgs.nth(i)).toHaveAttribute("src", /sl-404/);
    }
  });
});

test.describe("performance_glitch_user", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("logs in after noticeably slow transition", async ({ page }) => {
    const started = Date.now();
    await page.locator('[data-test="username"]').fill(u.glitch);
    await page.locator('[data-test="password"]').fill(pass);
    await page.locator('[data-test="login-button"]').click();
    await page.waitForURL(/\/inventory\.html$/, { timeout: 20_000 });
    expect(Date.now() - started).toBeGreaterThanOrEqual(2500);
    await expect(page.locator('[data-test="title"]')).toHaveText("Products");
  });
});

test.describe("error_user", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("logs in to a normal inventory view", async ({ page }) => {
    await attemptLogin(page, u.error);
    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(page.locator(".inventory_item").first()).toBeVisible();
    await expect(page.locator(".inventory_item img").first()).not.toHaveAttribute("src", /sl-404/);
  });
});

test.describe("visual_user", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("logs in with cart container marked as visual defect", async ({ page }) => {
    await attemptLogin(page, u.visual);
    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(page.locator(".shopping_cart_container")).toHaveClass(/visual_failure/);
  });

  test("offsets cart link from standard header alignment", async ({ page }) => {
    await attemptLogin(page, u.visual);
    const cartBox = await page.locator('[data-test="shopping-cart-link"]').boundingBox();
    const headerBox = await page.locator(".header_container").boundingBox();
    expect(cartBox && headerBox).toBeTruthy();
    if (!cartBox || !headerBox) return;
    const cartRight = cartBox.x + cartBox.width;
    const headerRight = headerBox.x + headerBox.width;
    expect(headerRight - cartRight).toBeGreaterThan(40);
  });
});

test.describe("credential validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("rejects wrong password for standard user", async ({ page }) => {
    await page.locator('[data-test="username"]').fill(u.standard);
    await page.locator('[data-test="password"]').fill(invalidPass);
    await page.locator('[data-test="login-button"]').click();
    await expect(page.locator('[data-test="error"]')).toContainText(
      "Username and password do not match any user in this service"
    );
    await expect(page).toHaveURL(/\/$/);
  });

  test("rejects unknown username", async ({ page }) => {
    await page.locator('[data-test="username"]').fill(invalidUser);
    await page.locator('[data-test="password"]').fill(pass);
    await page.locator('[data-test="login-button"]').click();
    await expect(page.locator('[data-test="error"]')).toContainText(
      "Username and password do not match any user in this service"
    );
  });

  test("requires username", async ({ page }) => {
    await page.locator('[data-test="password"]').fill(pass);
    await page.locator('[data-test="login-button"]').click();
    await expect(page.locator('[data-test="error"]')).toContainText("Username is required");
  });

  test("requires password", async ({ page }) => {
    await page.locator('[data-test="username"]').fill(u.standard);
    await page.locator('[data-test="login-button"]').click();
    await expect(page.locator('[data-test="error"]')).toContainText("Password is required");
  });
});
