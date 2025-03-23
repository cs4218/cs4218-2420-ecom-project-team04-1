// @ts-check
import { test, expect } from '@playwright/test';

// Test data matching actual categories and products in the database
const TEST_CATEGORIES = [
  {
    name: 'Electronics',
    slug: 'electronics',
  },
  {
    name: 'Book',
    slug: 'book',
  },
  {
    name: 'Clothing',
    slug: 'clothing',
  },
];

const TEST_PRODUCTS = [
  {
    name: 'Laptop',
    description: 'A powerful laptop',
    price: 1499.99,
    slug: 'laptop',
  },
  {
    name: 'Smartphone',
    description: 'A high-end smartphone',
    price: 999.99,
    slug: 'smartphone',
  },
];

test.beforeEach(async ({ page }) => {
  // Navigate to the home page before each test
  await page.goto('http://localhost:3000');
});

test.describe('Category Navigation UI', () => {
  test('should display all categories', async ({ page }) => {
    // Navigate to categories page
    await page.goto('http://localhost:3000/categories');

    // Wait for categories to load
    await page.waitForSelector('.btn-primary');

    // Verify all categories are displayed
    const categoryButtons = page.locator('.btn-primary');
    await expect(categoryButtons).toHaveCount(TEST_CATEGORIES.length);

    // Verify category names and links
    for (let i = 0; i < TEST_CATEGORIES.length; i++) {
      const button = categoryButtons.nth(i);
      await expect(button).toHaveText(TEST_CATEGORIES[i].name);
      await expect(button).toHaveAttribute(
        'href',
        `/category/${TEST_CATEGORIES[i].slug}`
      );
    }
  });

  test('should navigate to category products page', async ({ page }) => {
    // Navigate to categories page
    await page.goto('http://localhost:3000/categories');

    // Wait for categories to load
    await page.waitForSelector('.btn-primary');

    // Click on first category
    const firstCategory = page.locator('.btn-primary').nth(0);
    await firstCategory.click();

    // Verify navigation to category products page
    await expect(page).toHaveURL(/.*\/category\/electronics/);

    // Verify category name is displayed
    await expect(page.getByText('Category - Electronics')).toBeVisible();

    // Verify products count is displayed
    await expect(page.getByText('2 result found')).toBeVisible();
  });

  test('should display products in category page', async ({ page }) => {
    // Navigate to category products page
    await page.goto('http://localhost:3000/category/electronics');

    // Wait for products to load
    await page.waitForSelector('.card');

    // Verify products are displayed
    const productCards = page.locator('.card');
    await expect(productCards).toHaveCount(TEST_PRODUCTS.length);

    // Verify first product details
    const firstProduct = productCards.nth(0);
    await expect(
      firstProduct.locator('.card-title:not(.card-price)')
    ).toHaveText(TEST_PRODUCTS[0].name);
    await expect(firstProduct.locator('.card-text')).toContainText(
      TEST_PRODUCTS[0].description
    );
    await expect(firstProduct.locator('.card-title.card-price')).toContainText(
      TEST_PRODUCTS[0].price.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      })
    );

    // Verify second product details
    const secondProduct = productCards.nth(1);
    await expect(
      secondProduct.locator('.card-title:not(.card-price)')
    ).toHaveText(TEST_PRODUCTS[1].name);
    await expect(secondProduct.locator('.card-text')).toContainText(
      TEST_PRODUCTS[1].description
    );
    await expect(secondProduct.locator('.card-title.card-price')).toContainText(
      TEST_PRODUCTS[1].price.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      })
    );
  });

  test('should navigate to product details from category page', async ({
    page,
  }) => {
    // Navigate to category products page
    await page.goto('http://localhost:3000/category/electronics');

    // Wait for products to load
    await page.waitForSelector('.card');

    // Click "More Details" on first product
    const firstProduct = page.locator('.card').nth(0);
    await firstProduct.getByRole('button', { name: 'More Details' }).click();

    // Verify navigation to product details page
    await expect(page).toHaveURL(/.*\/product\/laptop/);
  });

  test('should handle empty category gracefully', async ({ page }) => {
    // Navigate to category with no products
    await page.goto('http://localhost:3000/category/empty-category');

    // Wait for category page to load
    await page.waitForSelector('.category');

    // Verify category name is displayed
    await expect(page.getByText('Category -')).toBeVisible();

    // Verify "0 result found" is displayed
    await expect(page.getByText('0 result found')).toBeVisible();

    // Verify no product cards are displayed
    const productCards = page.locator('.card');
    await expect(productCards).toHaveCount(0);
  });

  test('should display product images in category page', async ({ page }) => {
    // Navigate to category products page
    await page.goto('http://localhost:3000/category/electronics');

    // Wait for products to load
    await page.waitForSelector('.card');

    // Verify images for all products
    const productCards = page.locator('.card');
    for (let i = 0; i < TEST_PRODUCTS.length; i++) {
      const productCard = productCards.nth(i);
      const productImage = productCard.locator('.card-img-top');

      // Verify image is visible and has correct alt text
      await expect(productImage).toBeVisible();
      await expect(productImage).toHaveAttribute('alt', TEST_PRODUCTS[i].name);
    }
  });
});
