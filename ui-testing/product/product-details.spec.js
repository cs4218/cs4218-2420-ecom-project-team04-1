// @ts-check
import { test, expect } from '@playwright/test';

// Test data matching actual products in the database
const TEST_PRODUCT = {
  name: 'Novel',
  description: 'A bestselling novel',
  price: 14.99,
  category: 'Book',
  slug: 'novel',
};

test.beforeEach(async ({ page }) => {
  // Navigate to the home page before each test
  await page.goto('http://localhost:3000');
});

test.describe('Product Details UI', () => {
  test('should display product details correctly', async ({ page }) => {
    // Navigate to product details page
    await page.goto(`http://localhost:3000/product/${TEST_PRODUCT.slug}`);

    // Wait for product details to load
    await page.waitForSelector('.product-details-info');

    // Verify product details are displayed correctly
    await expect(
      page.getByRole('heading', { name: `Name : ${TEST_PRODUCT.name}` })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: `Description : ${TEST_PRODUCT.description}`,
      })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: `Price : $${TEST_PRODUCT.price.toFixed(2)}`,
      })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: `Category : ${TEST_PRODUCT.category}` })
    ).toBeVisible();

    // Verify product image is displayed
    const productImage = page.locator('.card-img-top');
    await expect(productImage).toBeVisible();
    await expect(productImage).toHaveAttribute('alt', TEST_PRODUCT.name);
  });

  test('should add product to cart from details page', async ({ page }) => {
    // Navigate to product details page
    await page.goto(`http://localhost:3000/product/${TEST_PRODUCT.slug}`);

    // Wait for product details to load
    await page.waitForSelector('.product-details-info');

    // Click "ADD TO CART" button
    await page.getByRole('button', { name: 'ADD TO CART' }).click();

    // Verify success toast message
    await expect(page.getByText('Item Added to cart')).toBeVisible();
  });

  test('should display similar products section', async ({ page }) => {
    // Navigate to product details page
    await page.goto(`http://localhost:3000/product/${TEST_PRODUCT.slug}`);

    // Wait for similar products section to load
    await page.waitForSelector('.similar-products');

    // Verify similar products section header
    await expect(page.getByText('Similar Products ➡️')).toBeVisible();

    // Verify similar products are displayed
    const similarProductCards = page.locator('.similar-products .card');
    await expect(similarProductCards).toHaveCount(2);

    // Verify similar product details
    const firstSimilarProduct = similarProductCards.nth(0);
    // Use more specific selector for the product title by excluding the price class
    await expect(firstSimilarProduct.locator('.card-title:not(.card-price)')).toHaveText(
      'Textbook'
    );
    await expect(firstSimilarProduct.locator('.card-text')).toContainText(
      'A comprehensive textbook'
    );
    await expect(
      firstSimilarProduct.locator('.card-title.card-price')
    ).toContainText('$79.99');
  });

  test('should navigate to similar product details', async ({ page }) => {
    // Navigate to product details page
    await page.goto(`http://localhost:3000/product/${TEST_PRODUCT.slug}`);

    // Wait for similar products section to load
    await page.waitForSelector('.similar-products');

    // Click "More Details" on first similar product
    const firstSimilarProduct = page.locator('.similar-products .card').nth(0);
    await firstSimilarProduct
      .getByRole('button', { name: 'More Details' })
      .click();

    // Verify navigation to new product details page
    await expect(page).toHaveURL(/.*\/product\/textbook/);
  });

  test('should handle non-existent product gracefully', async ({ page }) => {
    // Navigate to non-existent product page
    await page.goto('http://localhost:3000/product/non-existent-product');

    // Wait for product details section
    await page.waitForSelector('.product-details');

    // Verify empty product details
    await expect(page.getByText('Product Details')).toBeVisible();
    await expect(page.getByText('Name :')).toBeVisible();
    await expect(page.getByText('Description :')).toBeVisible();
    await expect(page.getByText('Price :')).toBeVisible();
    await expect(page.getByText('Category :')).toBeVisible();
  });

  test('should maintain cart state after navigation', async ({ page }) => {
    // Navigate to product details page
    await page.goto(`http://localhost:3000/product/${TEST_PRODUCT.slug}`);

    // Wait for product details to load
    await page.waitForSelector('.product-details-info');

    // Add product to cart
    await page.getByRole('button', { name: 'ADD TO CART' }).click();

    // Navigate to similar product
    const firstSimilarProduct = page.locator('.similar-products .card').nth(0);
    await firstSimilarProduct
      .getByRole('button', { name: 'More Details' })
      .click();

    // Navigate back to original product
    await page.goto(`http://localhost:3000/product/${TEST_PRODUCT.slug}`);

    // Verify product is still in cart
    await expect(page.getByText('Item Added to cart')).not.toBeVisible();
  });

  test('should display product image with correct dimensions', async ({
    page,
  }) => {
    // Navigate to product details page
    await page.goto(`http://localhost:3000/product/${TEST_PRODUCT.slug}`);

    // Wait for product image to load
    await page.waitForSelector('.product-details .card-img-top');

    // Verify image dimensions
    const productImage = page.locator('.product-details .card-img-top');
    await expect(productImage).toHaveAttribute('height', '300');
    await expect(productImage).toHaveAttribute('width', '350px');
  });
});
