import { expect, type Page } from "@playwright/test";

export const saucePassword = () => process.env.SAUCE_PASSWORD ?? "secret_sauce";

export const INVENTORY_URL = /\/inventory\.html$/;
export const CART_URL = /\/cart\.html$/;
export const CHECKOUT_ONE_URL = /\/checkout-step-one\.html$/;
export const CHECKOUT_TWO_URL = /\/checkout-step-two\.html$/;
export const CHECKOUT_COMPLETE_URL = /\/checkout-complete\.html$/;

export async function loginAs(page: Page, username: string) {
  await page.goto("/");
  await page.locator('[data-test="username"]').fill(username);
  await page.locator('[data-test="password"]').fill(saucePassword());
  await page.locator('[data-test="login-button"]').click();
  await expect(page).toHaveURL(INVENTORY_URL);
}

export async function openMenuAndLogout(page: Page) {
  await page.locator("#react-burger-menu-btn").click();
  await page.locator('[data-test="logout-sidebar-link"]').click();
  await expect(page.locator('[data-test="login-button"]')).toBeVisible();
  await expect(page).not.toHaveURL(/inventory\.html/);
}
