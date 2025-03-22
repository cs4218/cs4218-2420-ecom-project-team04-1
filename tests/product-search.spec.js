// @ts-check
import { test, expect } from '@playwright/test';

// Test data matching actual products in the database
const TEST_PRODUCTS = [
  {
    name: 'Novel',
    description: 'A bestselling novel',
    price: 14.99,
  },
  {
    name: 'NUS T-shirt',
    description: 'Plain NUS T-shirt for sale',
    price: 4.99,
  },
];

test.beforeEach(async ({ page }) => {
  // Navigate to the home page before each test
  await page.goto('http://localhost:3000');
});

test.describe('Product Search UI', () => {
  test('should allow me to search for products', async ({ page }) => {
    // Get the search input
    const searchInput = page.getByPlaceholder('Search');
    const searchButton = page.getByRole('button', { name: 'Search' });

    // Type a search term and submit
    await searchInput.fill('novel');
    await searchButton.click();

    // Wait for results to load
    await page.waitForSelector('.card');

    // Verify search results are displayed
    const productCards = page.locator('.card');
    await expect(productCards).toHaveCount(1);

    // Verify product details are displayed correctly
    const firstProduct = productCards.nth(0);
    await expect(firstProduct.locator('.card-title')).toHaveText(
      TEST_PRODUCTS[0].name
    );

    // Check description and price separately
    const cardTexts = firstProduct.locator('.card-text').all();
    const texts = await cardTexts;
    await expect(texts[0]).toContainText(TEST_PRODUCTS[0].description);
    await expect(texts[1]).toContainText(`$ ${TEST_PRODUCTS[0].price}`);
  });

  test('should clear search input after search', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search');
    const searchButton = page.getByRole('button', { name: 'Search' });

    // Perform a search
    await searchInput.fill('novel');
    await searchButton.click();

    // Navigate back to home
    await page.goto('http://localhost:3000');

    // Verify search input is empty
    await expect(searchInput).toBeEmpty();
  });

  test('should display "No Products Found" when search has no results', async ({
    page,
  }) => {
    const searchInput = page.getByPlaceholder('Search');
    const searchButton = page.getByRole('button', { name: 'Search' });

    // Search for a non-existent product
    await searchInput.fill('nonexistentproduct');
    await searchButton.click();

    // Verify "No Products Found" message
    await expect(page.getByText('No Products Found')).toBeVisible();
  });

  test('should allow adding products to cart from search results', async ({
    page,
  }) => {
    const searchInput = page.getByPlaceholder('Search');
    const searchButton = page.getByRole('button', { name: 'Search' });

    // Perform a search
    await searchInput.fill('novel');
    await searchButton.click();

    // Wait for results to load
    await page.waitForSelector('.card');

    // Add first product to cart
    const firstProduct = page.locator('.card').nth(0);
    await firstProduct.getByRole('button', { name: 'ADD TO CART' }).click();

    // Verify success toast message
    await expect(page.getByText('Item Added to cart')).toBeVisible();
  });

  test('should navigate to product details from search results', async ({
    page,
  }) => {
    const searchInput = page.getByPlaceholder('Search');
    const searchButton = page.getByRole('button', { name: 'Search' });

    // Perform a search
    await searchInput.fill('novel');
    await searchButton.click();

    // Wait for results to load
    await page.waitForSelector('.card');

    // Click "More Details" on first product
    const firstProduct = page.locator('.card').nth(0);
    await firstProduct.getByRole('button', { name: 'More Details' }).click();

    // Verify navigation to product details page
    await expect(page).toHaveURL(/.*\/product\/.*/);
  });

  test('should handle special characters in search', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search');
    const searchButton = page.getByRole('button', { name: 'Search' });

    // Search with special characters
    await searchInput.fill('novel@#$%');
    await searchButton.click();

    // Wait for "No Products Found" message
    await expect(page.getByText('No Products Found')).toBeVisible();

    // Verify no product cards are displayed
    const productCards = page.locator('.card');
    await expect(productCards).toHaveCount(0);
  });

  test('should perform case-insensitive search', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search');
    const searchButton = page.getByRole('button', { name: 'Search' });

    // Search with uppercase
    await searchInput.fill('NOVEL');
    await searchButton.click();

    // Wait for results to load
    await page.waitForSelector('.card');

    // Verify results are displayed
    const productCards = page.locator('.card');
    await expect(productCards).toHaveCount(1);
  });

  test('should display correct number of results found', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search');
    const searchButton = page.getByRole('button', { name: 'Search' });

    // Perform a search
    await searchInput.fill('novel');
    await searchButton.click();

    // Wait for results to load
    await page.waitForSelector('.card');

    // Verify the number of results is displayed correctly
    await expect(page.getByText('Found 1')).toBeVisible();
  });
});
