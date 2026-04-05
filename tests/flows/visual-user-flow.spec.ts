import { test, expect } from "@playwright/test";
import { loginAs, INVENTORY_URL, CART_URL } from "../flow-helpers";

const user = process.env.SAUCE_VISUAL_USERNAME ?? "visual_user";

test.describe("visual_user flow", () => {
  test("inventory shows visual defect markers and misaligned cart", async ({ page }) => {
    await loginAs(page, user);
    await expect(page.locator(".shopping_cart_container")).toHaveClass(/visual_failure/);
    await expect(page.locator(".bm-burger-button .bm-icon")).toHaveClass(/visual_failure/);
    const cartBox = await page.locator('[data-test="shopping-cart-link"]').boundingBox();
    const headerBox = await page.locator(".header_container").boundingBox();
    expect(cartBox && headerBox).toBeTruthy();
    if (cartBox && headerBox) {
      const cartRight = cartBox.x + cartBox.width;
      expect(headerBox.x + headerBox.width - cartRight).toBeGreaterThan(40);
    }
  });

  test("cart pins checkout control in header instead of footer", async ({ page }) => {
    await loginAs(page, user);
    await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    await page.locator('[data-test="add-to-cart-sauce-labs-bike-light"]').click();
    await page.locator('[data-test="shopping-cart-link"]').click();
    await expect(page).toHaveURL(CART_URL);
    const checkoutBox = await page.locator('[data-test="checkout"]').boundingBox();
    const headerBox = await page.locator(".header_container").boundingBox();
    expect(checkoutBox && headerBox).toBeTruthy();
    if (checkoutBox && headerBox) {
      expect(checkoutBox.y + checkoutBox.height).toBeLessThanOrEqual(headerBox.y + headerBox.height + 2);
    }
    await expect(page.locator('[data-test="continue-shopping"]')).toBeVisible();
    await page.locator('[data-test="continue-shopping"]').click();
    await expect(page).toHaveURL(INVENTORY_URL);
  });
});
