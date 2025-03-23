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

const RELATED_PRODUCTS = [
  {
    name: 'Textbook',
    description: 'A comprehensive textbook',
    price: 79.99,
    slug: 'textbook',
  },
  {
    name: 'The Law of Contract in Singapore',
    description: 'A bestselling book in Singapore',
    price: 54.99,
    slug: 'the-law-of-contract-in-singapore',
  },
];

test.beforeEach(async ({ page }) => {
  // Navigate to the home page before each test
  await page.goto('http://localhost:3000');
});

test.describe('Related Products UI', () => {
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

    // Verify first similar product details
    const firstSimilarProduct = similarProductCards.nth(0);
    await expect(
      firstSimilarProduct.locator('.card-title:not(.card-price)')
    ).toHaveText(RELATED_PRODUCTS[0].name);
    await expect(firstSimilarProduct.locator('.card-text')).toContainText(
      RELATED_PRODUCTS[0].description
    );
    await expect(
      firstSimilarProduct.locator('.card-title.card-price')
    ).toContainText(
      RELATED_PRODUCTS[0].price.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      })
    );

    // Verify second similar product details
    const secondSimilarProduct = similarProductCards.nth(1);
    await expect(
      secondSimilarProduct.locator('.card-title:not(.card-price)')
    ).toHaveText(RELATED_PRODUCTS[1].name);
    await expect(secondSimilarProduct.locator('.card-text')).toContainText(
      RELATED_PRODUCTS[1].description
    );
    await expect(
      secondSimilarProduct.locator('.card-title.card-price')
    ).toContainText(
      RELATED_PRODUCTS[1].price.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      })
    );
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

  test('should display "No Similar Products found" when none exist', async ({
    page,
  }) => {
    // Navigate to a product that has no similar products
    await page.goto('http://localhost:3000/product/unique-product');

    // Wait for similar products section to load
    await page.waitForSelector('.similar-products');

    // Verify "No Similar Products found" message
    await expect(page.getByText('No Similar Products found')).toBeVisible();

    // Verify no product cards are displayed
    const similarProductCards = page.locator('.similar-products .card');
    await expect(similarProductCards).toHaveCount(0);
  });

  test('should maintain cart state when navigating between similar products', async ({
    page,
  }) => {
    // Navigate to product details page
    await page.goto(`http://localhost:3000/product/${TEST_PRODUCT.slug}`);

    // Wait for similar products section to load
    await page.waitForSelector('.similar-products');

    // Add main product to cart
    await page.getByRole('button', { name: 'ADD TO CART' }).click();

    // Navigate to first similar product
    const firstSimilarProduct = page.locator('.similar-products .card').nth(0);
    await firstSimilarProduct
      .getByRole('button', { name: 'More Details' })
      .click();

    // Navigate back to original product
    await page.goto(`http://localhost:3000/product/${TEST_PRODUCT.slug}`);

    // Verify success toast message is not visible (indicating item is still in cart)
    await expect(page.getByText('Item Added to cart')).not.toBeVisible();
  });

  test('should display similar product images correctly', async ({ page }) => {
    // Navigate to product details page
    await page.goto(`http://localhost:3000/product/${TEST_PRODUCT.slug}`);

    // Wait for similar products section to load
    await page.waitForSelector('.similar-products');

    // Verify images for all similar products
    const similarProductCards = page.locator('.similar-products .card');
    for (let i = 0; i < RELATED_PRODUCTS.length; i++) {
      const productCard = similarProductCards.nth(i);
      const productImage = productCard.locator('.card-img-top');

      // Verify image is visible and has correct alt text
      await expect(productImage).toBeVisible();
      await expect(productImage).toHaveAttribute(
        'alt',
        RELATED_PRODUCTS[i].name
      );
    }
  });

  test('should limit similar products to 3 items', async ({ page }) => {
    // Navigate to product details page
    await page.goto(`http://localhost:3000/product/${TEST_PRODUCT.slug}`);

    // Wait for similar products section to load
    await page.waitForSelector('.similar-products');

    // Verify maximum of 3 similar products are displayed
    const similarProductCards = page.locator('.similar-products .card');
    const cardCount = await similarProductCards.count();
    expect(cardCount).toBeLessThanOrEqual(3);
  });
});
