import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000/');
        await page.evaluate(() => localStorage.clear());
        await page.context().clearCookies();
      });

    test('should filter products by price range', async ({ page }) => {
        await page.getByRole('radio', { name: '$0 to' }).check();
        await expect(page.getByRole('main')).toContainText('$14.99');
    await expect(page.getByRole('main')).toContainText('$4.99');
    });


    test('should filter products by one category', async ({ page }) => {
        await page.getByRole('checkbox', { name: 'Electronics' }).check();
        await expect(page.getByRole('main')).toContainText('Smartphone');
        await expect(page.getByRole('main')).toContainText('Laptop');
    });

    test('should filter products by multiple categories', async ({ page }) => {
        await page.getByRole('checkbox', { name: 'Book' }).check();
        await page.getByRole('checkbox', { name: 'Clothing' }).check();
        await expect(page.getByRole('main')).toContainText('The Law of Contract in Singapore');
        await expect(page.getByRole('main')).toContainText('NUS T-shirt');
        await expect(page.getByRole('main')).toContainText('Textbook');
        await expect(page.getByRole('main')).toContainText('Novel');
    });

    test('should filter products by both category and price range', async ({ page }) => {
        await page.getByRole('checkbox', { name: 'Book' }).check();
        await page.getByText('$40 to').click();
        await expect(page.getByRole('main')).toContainText('The Law of Contract in Singapore');
    });

    test('should reset filters and show all products', async ({ page }) => {
        await page.getByRole('checkbox', { name: 'Electronics' }).check();
        await page.getByRole('radio', { name: '$0 to' }).check();
        await page.getByRole('button', { name: 'Reset Filters' }).click();

        await expect(page.getByRole('main')).toContainText('Smartphone');
        await expect(page.getByRole('main')).toContainText('Laptop');
        await expect(page.getByRole('main')).toContainText('NUS T-shirt');
        await expect(page.getByRole('main')).toContainText('Novel');
        await expect(page.getByRole('main')).toContainText('Textbook');
        await expect(page.getByRole('main')).toContainText('The Law of Contract in Singapore');
    });

    test('should add a product to the cart', async ({ page }) => {
        await page.locator('.card-name-price > button:nth-child(2)').first().click();
        await page.getByRole('link', { name: 'Cart' }).click();
        await expect(page.locator('h1')).toContainText('You have 1 items in your cart. Please login to checkout!');
        await expect(page.getByRole('main')).toContainText('NovelA bestselling novelPrice : 14.99Remove');
    });

    test('should navigate to product details page from home page', async ({ page }) => {
        await page.locator('.card-name-price > button').first().click();
        await expect(page).toHaveURL(/\/product\/novel/);
        await expect(page.getByRole('heading', { name: 'Product Details' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Name : Novel' })).toBeVisible();
    });
});
