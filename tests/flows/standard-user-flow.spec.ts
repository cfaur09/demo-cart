import { test, expect } from "@playwright/test";
import {
  loginAs,
  openMenuAndLogout,
  INVENTORY_URL,
  CART_URL,
  CHECKOUT_ONE_URL,
  CHECKOUT_TWO_URL,
  CHECKOUT_COMPLETE_URL,
} from "../flow-helpers";

const user = process.env.SAUCE_STANDARD_USERNAME ?? process.env.SAUCE_USERNAME ?? "standard_user";

const CATALOG: { name: string; desc: string; price: string }[] = [
  {
    name: "Sauce Labs Backpack",
    desc: "carry.allTheThings() with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection.",
    price: "$29.99",
  },
  {
    name: "Sauce Labs Bike Light",
    desc: "A red light isn't the desired state in testing but it sure helps when riding your bike at night. Water-resistant with 3 lighting modes, 1 AAA battery included.",
    price: "$9.99",
  },
  {
    name: "Sauce Labs Bolt T-Shirt",
    desc: "Get your testing superhero on with the Sauce Labs bolt T-shirt. From American Apparel, 100% ringspun combed cotton, heather gray with red bolt.",
    price: "$15.99",
  },
  {
    name: "Sauce Labs Fleece Jacket",
    desc: "It's not every day that you come across a midweight quarter-zip fleece jacket capable of handling everything from a relaxing day outdoors to a busy day at the office.",
    price: "$49.99",
  },
  {
    name: "Sauce Labs Onesie",
    desc: "Rib snap infant onesie for the junior automation engineer in development. Reinforced 3-snap bottom closure, two-needle hemmed sleeved and bottom won't unravel.",
    price: "$7.99",
  },
  {
    name: "Test.allTheThings() T-Shirt (Red)",
    desc: "This classic Sauce Labs t-shirt is perfect to wear when cozying up to your keyboard to automate a few tests. Super-soft and comfy ringspun combed cotton.",
    price: "$15.99",
  },
];

const SORT_NAMES: Record<string, string[]> = {
  az: [
    "Sauce Labs Backpack",
    "Sauce Labs Bike Light",
    "Sauce Labs Bolt T-Shirt",
    "Sauce Labs Fleece Jacket",
    "Sauce Labs Onesie",
    "Test.allTheThings() T-Shirt (Red)",
  ],
  za: [
    "Test.allTheThings() T-Shirt (Red)",
    "Sauce Labs Onesie",
    "Sauce Labs Fleece Jacket",
    "Sauce Labs Bolt T-Shirt",
    "Sauce Labs Bike Light",
    "Sauce Labs Backpack",
  ],
  lohi: [
    "Sauce Labs Onesie",
    "Sauce Labs Bike Light",
    "Sauce Labs Bolt T-Shirt",
    "Test.allTheThings() T-Shirt (Red)",
    "Sauce Labs Backpack",
    "Sauce Labs Fleece Jacket",
  ],
  hilo: [
    "Sauce Labs Fleece Jacket",
    "Sauce Labs Backpack",
    "Sauce Labs Bolt T-Shirt",
    "Test.allTheThings() T-Shirt (Red)",
    "Sauce Labs Bike Light",
    "Sauce Labs Onesie",
  ],
};

test.describe("standard_user flow", () => {
  test("inventory lists every product with name description price image and action", async ({ page }) => {
    await loginAs(page, user);
    await expect(page.locator('[data-test="title"]')).toHaveText("Products");
    await expect(page.locator(".inventory_item")).toHaveCount(CATALOG.length);
    for (const row of CATALOG) {
      const card = page.locator(".inventory_item").filter({ has: page.getByText(row.name, { exact: true }) });
      await expect(card).toHaveCount(1);
      await expect(card.locator('[data-test="inventory-item-name"]')).toHaveText(row.name);
      await expect(card.locator('[data-test="inventory-item-desc"]')).toHaveText(row.desc);
      await expect(card.locator('[data-test="inventory-item-price"]')).toHaveText(row.price);
      await expect(card.locator("img")).toBeVisible();
      await expect(card.getByRole("button")).toBeVisible();
    }
  });

  test("inventory sort applies for each option", async ({ page }) => {
    await loginAs(page, user);
    const sort = page.locator("select.product_sort_container");
    for (const [value, expected] of Object.entries(SORT_NAMES)) {
      await sort.selectOption(value);
      await expect(page.locator('[data-test="inventory-item-name"]')).toHaveText(expected);
    }
  });

  test("add to cart increments cart badge", async ({ page }) => {
    await loginAs(page, user);
    await expect(page.locator('[data-test="shopping-cart-badge"]')).not.toBeVisible();
    await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText("1");
    await page.locator('[data-test="add-to-cart-sauce-labs-bike-light"]').click();
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText("2");
  });

  test("cart shows lines remove continue shopping and checkout", async ({ page }) => {
    await loginAs(page, user);
    await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    await page.locator('[data-test="add-to-cart-sauce-labs-bike-light"]').click();
    await page.locator('[data-test="shopping-cart-link"]').click();
    await expect(page).toHaveURL(CART_URL);
    await expect(page.locator('[data-test="title"]')).toHaveText("Your Cart");
    await expect(page.locator(".cart_item")).toHaveCount(2);
    const backpackRow = page.locator(".cart_item").filter({ hasText: "Sauce Labs Backpack" });
    const bikeRow = page.locator(".cart_item").filter({ hasText: "Sauce Labs Bike Light" });
    await expect(backpackRow.locator('[data-test="inventory-item-name"]')).toHaveText("Sauce Labs Backpack");
    await expect(backpackRow.locator('[data-test="inventory-item-price"]')).toHaveText("$29.99");
    await expect(bikeRow.locator('[data-test="inventory-item-name"]')).toHaveText("Sauce Labs Bike Light");
    await expect(bikeRow.locator('[data-test="inventory-item-price"]')).toHaveText("$9.99");
    await expect(page.locator('[data-test="continue-shopping"]')).toBeVisible();
    await expect(page.locator('[data-test="checkout"]')).toBeVisible();
    await page.locator('[data-test="remove-sauce-labs-backpack"]').click();
    await expect(page.locator(".cart_item")).toHaveCount(1);
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText("1");
    await page.locator('[data-test="continue-shopping"]').click();
    await expect(page).toHaveURL(INVENTORY_URL);
    await page.locator('[data-test="shopping-cart-link"]').click();
    await expect(page.locator(".cart_item")).toHaveCount(1);
    await expect(page.locator('[data-test="checkout"]')).toBeVisible();
  });

  test("checkout step one requires fields and accepts non letter names", async ({ page }) => {
    await loginAs(page, user);
    await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    await page.locator('[data-test="shopping-cart-link"]').click();
    await page.locator('[data-test="checkout"]').click();
    await expect(page).toHaveURL(CHECKOUT_ONE_URL);
    await page.locator('[data-test="continue"]').click();
    await expect(page.locator('[data-test="error"]')).toContainText("Error: First Name is required");
    await page.locator('[data-test="firstName"]').fill("1");
    await page.locator('[data-test="continue"]').click();
    await expect(page.locator('[data-test="error"]')).toContainText("Error: Last Name is required");
    await page.locator('[data-test="lastName"]').fill("2");
    await page.locator('[data-test="continue"]').click();
    await expect(page.locator('[data-test="error"]')).toContainText("Error: Postal Code is required");
    await page.locator('[data-test="postalCode"]').fill("90210");
    await page.locator('[data-test="continue"]').click();
    await expect(page).toHaveURL(CHECKOUT_TWO_URL);
  });

  test("purchase completes through overview and thank you with expected totals", async ({ page }) => {
    await loginAs(page, user);
    await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    await page.locator('[data-test="add-to-cart-sauce-labs-bike-light"]').click();
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText("2");
    await page.locator('[data-test="shopping-cart-link"]').click();
    await page.locator('[data-test="checkout"]').click();
    await page.locator('[data-test="firstName"]').fill("Ada");
    await page.locator('[data-test="lastName"]').fill("Lovelace");
    await page.locator('[data-test="postalCode"]').fill("10115");
    await page.locator('[data-test="continue"]').click();
    await expect(page).toHaveURL(CHECKOUT_TWO_URL);
    await expect(page.locator('[data-test="title"]')).toHaveText("Checkout: Overview");
    await expect(page.locator(".cart_item")).toHaveCount(2);
    await expect(page.locator('[data-test="payment-info-label"]')).toContainText("Payment Information:");
    await expect(page.locator('[data-test="shipping-info-label"]')).toContainText("Shipping Information:");
    await expect(page.locator('[data-test="subtotal-label"]')).toContainText("Item total: $39.98");
    await expect(page.locator('[data-test="tax-label"]')).toContainText("Tax: $3.20");
    await expect(page.locator('[data-test="total-label"]')).toContainText("Total: $43.18");
    await page.locator('[data-test="finish"]').click();
    await expect(page).toHaveURL(CHECKOUT_COMPLETE_URL);
    await expect(page.locator('[data-test="title"]')).toHaveText("Checkout: Complete!");
    await expect(page.locator('[data-test="complete-header"]')).toHaveText("Thank you for your order!");
    await expect(page.locator('[data-test="complete-text"]')).toBeVisible();
    await expect(page.locator('[data-test="shopping-cart-badge"]')).not.toBeVisible();
    await page.locator('[data-test="back-to-products"]').click();
    await expect(page).toHaveURL(INVENTORY_URL);
  });

  // Ive checked also this scenario with what happens when there are no items in the cart - BUG
  test("checkout can finish with zero line items in cart", async ({ page }) => {
    await loginAs(page, user);
    await page.goto("/cart.html");
    await expect(page.locator(".cart_item")).toHaveCount(0);
    await page.locator('[data-test="checkout"]').click();
    await expect(page).toHaveURL(CHECKOUT_ONE_URL);
    await page.locator('[data-test="firstName"]').fill("No");
    await page.locator('[data-test="lastName"]').fill("Items");
    await page.locator('[data-test="postalCode"]').fill("00000");
    await page.locator('[data-test="continue"]').click();
    await expect(page).toHaveURL(CHECKOUT_TWO_URL);
    await expect(page.locator(".cart_item")).toHaveCount(0);
    await expect(page.locator('[data-test="subtotal-label"]')).toContainText("Item total: $0");
    await expect(page.locator('[data-test="tax-label"]')).toContainText("Tax: $0.00");
    await expect(page.locator('[data-test="total-label"]')).toContainText("Total: $0.00");
    await page.locator('[data-test="finish"]').click();
    await expect(page).toHaveURL(CHECKOUT_COMPLETE_URL);
    await expect(page.locator('[data-test="complete-header"]')).toHaveText("Thank you for your order!");
  });

  test("logout from menu returns to login", async ({ page }) => {
    await loginAs(page, user);
    await openMenuAndLogout(page);
    await expect(page.locator('[data-test="username"]')).toBeVisible();
  });
});
