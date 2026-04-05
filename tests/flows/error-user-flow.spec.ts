import { test, expect } from "@playwright/test";
import {
  loginAs,
  INVENTORY_URL,
  CHECKOUT_ONE_URL,
  CHECKOUT_TWO_URL,
  CHECKOUT_COMPLETE_URL,
} from "../flow-helpers";

const user = process.env.SAUCE_ERROR_USERNAME ?? "error_user";

test.describe("error_user flow", () => {
  test("last name field does not retain input", async ({ page }) => {
    await loginAs(page, user);
    await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    await page.locator('[data-test="shopping-cart-link"]').click();
    await page.locator('[data-test="checkout"]').click();
    await expect(page).toHaveURL(CHECKOUT_ONE_URL);
    await page.locator('[data-test="lastName"]').fill("ShouldNotStick");
    expect(await page.locator('[data-test="lastName"]').inputValue()).toBe("");
  });

  test("advances to overview without last name when first and postal provided", async ({ page }) => {
    await loginAs(page, user);
    await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    await page.locator('[data-test="add-to-cart-sauce-labs-bike-light"]').click();
    await page.locator('[data-test="shopping-cart-link"]').click();
    await page.locator('[data-test="checkout"]').click();
    await page.locator('[data-test="firstName"]').fill("Morgan");
    await page.locator('[data-test="postalCode"]').fill("80202");
    await page.locator('[data-test="continue"]').click();
    await expect(page).toHaveURL(CHECKOUT_TWO_URL);
    await expect(page.locator(".cart_item")).toHaveCount(2);
  });

  test("finish never reaches order complete", async ({ page }) => {
    await loginAs(page, user);
    await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    await page.locator('[data-test="add-to-cart-sauce-labs-bike-light"]').click();
    await page.locator('[data-test="shopping-cart-link"]').click();
    await page.locator('[data-test="checkout"]').click();
    await page.locator('[data-test="firstName"]').fill("Ada");
    await page.locator('[data-test="postalCode"]').fill("10115");
    await page.locator('[data-test="continue"]').click();
    await expect(page).toHaveURL(CHECKOUT_TWO_URL);
    await page.locator('[data-test="finish"]').click();
    await expect(page.locator('[data-test="complete-header"]')).not.toBeVisible({ timeout: 8000 });
    await expect(page).toHaveURL(CHECKOUT_TWO_URL);
    await expect(page).not.toHaveURL(CHECKOUT_COMPLETE_URL);
  });

  test("product sort selection does not reorder list", async ({ page }) => {
    await loginAs(page, user);
    await expect(page.locator('[data-test="inventory-item-name"]').first()).toHaveText("Sauce Labs Backpack");
    await page.locator("select.product_sort_container").selectOption("za");
    await expect(page.locator('[data-test="inventory-item-name"]').first()).toHaveText("Sauce Labs Backpack");
    await expect(page.locator('[data-test="inventory-item-name"]').first()).not.toHaveText(
      "Test.allTheThings() T-Shirt (Red)"
    );
  });

  test("can remove in cart continue shopping and add another sku", async ({ page }) => {
    await loginAs(page, user);
    await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    await page.locator('[data-test="add-to-cart-sauce-labs-bike-light"]').click();
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText("2");
    await page.locator('[data-test="shopping-cart-link"]').click();
    await page.locator('[data-test="remove-sauce-labs-backpack"]').click();
    await expect(page.locator(".cart_item")).toHaveCount(1);
    await page.locator('[data-test="continue-shopping"]').click();
    await expect(page).toHaveURL(INVENTORY_URL);
    await expect(page.locator('[data-test="remove-sauce-labs-bike-light"]')).toBeVisible();
    await page.locator('[data-test="add-to-cart-sauce-labs-onesie"]').click();
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText("2");
  });
});
