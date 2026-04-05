import { test, expect } from "@playwright/test";
import {
  saucePassword,
  CHECKOUT_TWO_URL,
  CHECKOUT_COMPLETE_URL,
} from "../flow-helpers";

const user = process.env.SAUCE_PERFORMANCE_GLITCH_USERNAME ?? "performance_glitch_user";

test.describe("performance_glitch_user flow", () => {
  test("login is slow then full purchase still completes", async ({ page }) => {
    const started = Date.now();
    await page.goto("/");
    await page.locator('[data-test="username"]').fill(user);
    await page.locator('[data-test="password"]').fill(saucePassword());
    await page.locator('[data-test="login-button"]').click();
    await page.waitForURL(/\/inventory\.html$/, { timeout: 25_000 });
    expect(Date.now() - started).toBeGreaterThanOrEqual(2500);
    await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    await page.locator('[data-test="add-to-cart-sauce-labs-bike-light"]').click();
    await page.locator('[data-test="shopping-cart-link"]').click();
    await page.locator('[data-test="checkout"]').click();
    await page.locator('[data-test="firstName"]').fill("Slow");
    await page.locator('[data-test="lastName"]').fill("Lane");
    await page.locator('[data-test="postalCode"]').fill("10001");
    await page.locator('[data-test="continue"]').click();
    await expect(page).toHaveURL(CHECKOUT_TWO_URL, { timeout: 15_000 });
    await page.locator('[data-test="finish"]').click();
    await expect(page).toHaveURL(CHECKOUT_COMPLETE_URL, { timeout: 15_000 });
    await expect(page.locator('[data-test="complete-header"]')).toHaveText("Thank you for your order!");
  });
});
