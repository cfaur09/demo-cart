import { test, expect } from "@playwright/test";
import { saucePassword, INVENTORY_URL } from "../flow-helpers";

const user = process.env.SAUCE_LOCKED_USERNAME ?? "locked_out_user";

test.describe("locked_out_user flow", () => {
  test("cannot authenticate and sees locked message", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-test="username"]').fill(user);
    await page.locator('[data-test="password"]').fill(saucePassword());
    await page.locator('[data-test="login-button"]').click();
    await expect(page.locator('[data-test="error"]')).toContainText("Sorry, this user has been locked out");
    await expect(page).not.toHaveURL(INVENTORY_URL);
  });

  test("direct inventory request without session stays on login entry", async ({ page }) => {
    await page.goto("/inventory.html");
    await expect(page.locator('[data-test="login-button"]')).toBeVisible();
    await expect(page).not.toHaveURL(INVENTORY_URL);
  });
});
