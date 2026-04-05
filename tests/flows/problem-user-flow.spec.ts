import { test, expect } from "@playwright/test";
import { loginAs, CHECKOUT_ONE_URL } from "../flow-helpers";

const user = process.env.SAUCE_PROBLEM_USERNAME ?? "problem_user";

test.describe("problem_user flow", () => {
  test("inventory uses broken dog placeholder for every product image", async ({ page }) => {
    await loginAs(page, user);
    const imgs = page.locator(".inventory_item img");
    const count = await imgs.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      await expect(imgs.nth(i)).toHaveAttribute("src", /sl-404/);
    }
  });

  test("checkout step one rejects missing last name and never reaches overview", async ({ page }) => {
    await loginAs(page, user);
    await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    await page.locator('[data-test="shopping-cart-link"]').click();
    await page.locator('[data-test="checkout"]').click();
    await expect(page).toHaveURL(CHECKOUT_ONE_URL);
    await page.locator('[data-test="firstName"]').fill("Casey");
    await page.locator('[data-test="lastName"]').fill("Jones");
    expect(await page.locator('[data-test="lastName"]').inputValue()).toBe("");
    await page.locator('[data-test="postalCode"]').fill("73301");
    await page.locator('[data-test="continue"]').click();
    await expect(page).toHaveURL(CHECKOUT_ONE_URL);
    await expect(page.locator('[data-test="error"]')).toContainText("Error: Last Name is required");
  });

  test("cannot reach overview without last name even with first and postal", async ({ page }) => {
    await loginAs(page, user);
    await page.locator('[data-test="add-to-cart-sauce-labs-bike-light"]').click();
    await page.locator('[data-test="shopping-cart-link"]').click();
    await page.locator('[data-test="checkout"]').click();
    await page.locator('[data-test="firstName"]').fill("River");
    await page.locator('[data-test="postalCode"]').fill("73301");
    await page.locator('[data-test="continue"]').click();
    await expect(page).toHaveURL(CHECKOUT_ONE_URL);
    await expect(page.locator('[data-test="error"]')).toContainText("Error: Last Name is required");
  });
});
