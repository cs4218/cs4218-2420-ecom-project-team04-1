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

test.describe('Admin Category Features', () => {
  // Shared login for every test
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should allow admin to create, edit, and delete a category', async ({ page }) => {
    await page.getByRole('button', { name: 'Test' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.getByRole('link', { name: 'Create Category' }).click();
    await expect(page).toHaveURL(/.*\/dashboard\/admin\/create-category/);

    const newCategory = 'Car';
    await page.getByPlaceholder('Enter new category').fill(newCategory);
    await page.getByRole('button', { name: 'Submit' }).click();
    // Assert the category appears in the table using a cell role selector
    await expect(page.getByRole('cell', { name: newCategory,  exact: true })).toBeVisible();
    await expect(page.getByText(`${newCategory} is created`)).toBeVisible();

    // Edit "Car" to "Bus"
    const updatedCategory = 'Bus';
    // Locate the row in which the category appears
    const categoryRow = page.locator('tr', { hasText: newCategory });
    await categoryRow.getByRole('button', { name: 'Edit' }).click();

    const modal = page.getByRole('dialog');
    await modal.getByPlaceholder('Enter new category').fill(updatedCategory);
    await modal.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText(`${updatedCategory} is updated`)).toBeVisible();

    // Assert the updated category appears and the old one is gone
    await expect(page.getByRole('cell', { name: updatedCategory })).toBeVisible();
    await expect(page.locator('tr', { hasText: newCategory })).toHaveCount(0);

    // Delete the updated category
    const updatedRow = page.locator('tr', { hasText: updatedCategory });
    await updatedRow.getByRole('button', { name: 'Delete' }).click();
    // Verify deletion by asserting no table cell with updated category text remains
    await expect(page.getByRole('cell', { name: updatedCategory })).toHaveCount(0);
    await expect(page.getByText('category is deleted')).toBeVisible();
  });

});
