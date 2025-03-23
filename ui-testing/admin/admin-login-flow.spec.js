import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: Reusable admin login
const loginAsAdmin = async (page) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByPlaceholder('Enter Your Email').fill('test@admin.com');
  await page.getByPlaceholder('Enter Your Password').fill('test@admin.com');
  await page.getByRole('button', { name: 'LOGIN' }).click();
};

test.describe('Admin Login Features', () => {
  // Shared login for every test
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should allow admin to access dashboard', async ({ page }) => {
    // Click on the user menu button ("Test") and then Dashboard link
    await page.getByRole('button', { name: 'Test' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    // Assert we are on the dashboard by URL and that a known element is visible.
    await expect(page).toHaveURL(/.*\/dashboard/);
    // Instead of asserting h1 text (which shows "redirecting…" initially),
    // assert that a known dashboard element (e.g. "Create Category" link) is visible.
    await expect(page.getByRole('link', { name: 'Create Category' })).toBeVisible();
  });

});
