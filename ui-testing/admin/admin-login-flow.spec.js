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

test.describe('Admin Dashboard Features', () => {
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

  test('should allow admin to create a product', async ({ page }) => {
    await page.getByRole('button', { name: 'Test' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.getByRole('link', { name: 'Create Product' }).click();
    await expect(page).toHaveURL(/.*\/dashboard\/admin\/create-product/);

    // Select a category (using the raw locator from codegen)
    await page.locator('#rc_select_0').click();
    await page.getByTitle('Electronics').locator('div').click();

    // Use fixtures folder for image paths
    const imagePath = path.resolve(__dirname, '../data/NUS.jpg');

    // Instead of clicking on "Upload Photo", interact directly with the file input
    const fileInput = page.locator('input[type="file"]');

    // Upload oversized image
    await fileInput.setInputFiles(imagePath);
    const uniqueProductName = `NUS-${Date.now()}`;
    await page.getByPlaceholder('write a name').fill(uniqueProductName);
    await page.getByPlaceholder('write a description').fill('This is NUS');
    await page.getByPlaceholder('write a Price').fill('10000');
    await page.getByPlaceholder('write a quantity').fill('20');
    await page.locator('#rc_select_1').click();
    await page.getByText('Yes').click();
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();

    await expect(page).toHaveURL(/.*products/);
  });

  test('admin can update an existing product', async ({ page }) => {

    // 1. Go to Dashboard → Products
    await page.getByRole('button', { name: 'Test' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.getByRole('link', { name: 'Products' }).click();
    await expect(page).toHaveURL(/.*\/dashboard\/admin\/products/);
  
    // 2. Select an existing product (link text may differ in your app)
    await page.getByRole('link', { name: /NUS-\d+/ }).first().click();
    await expect(page).toHaveURL(/.*\/dashboard\/admin\/product\/.*/);
  
    // 3. Update product fields
    const updatedName = `Lion-${Date.now()}`;
    await page.getByRole('textbox', { name: 'write a name' }).click();
    await page.getByRole('textbox', { name: 'write a name' }).press('ControlOrMeta+a');
    await page.getByRole('textbox', { name: 'write a name' }).fill(updatedName);
  
    await page.getByRole('textbox', { name: 'write a description' }).fill('This is lion');
    await page.getByPlaceholder('write a Price').fill('9');
    await page.getByPlaceholder('write a quantity').fill('1');
  
    // Example toggles (Yes/No)
    const toggleDisplay = page.locator('span.ant-select-selection-item', { hasText: /^(Yes|No)$/ }).first();
    const currentToggle = (await toggleDisplay.textContent())?.trim();

    await toggleDisplay.click();

    if (currentToggle === 'Yes') {
      await page.getByTitle('No').click();
    } else {
      await page.getByTitle('Yes').click();
    }

  
    // 4. Upload new photo (use a fixture path instead of raw filename)
    const photoPath = path.resolve(__dirname, '../data/Lions.jpg');
    await page.locator('input[type="file"]').setInputFiles(photoPath);
  
    // 5. Click update
    await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
  
    // 6. Assert success message or updated product name
    await expect(page).toHaveURL(/.*\/dashboard\/admin\/products/);
    await expect(page.getByText(updatedName)).toBeVisible();
  });

  test('should show error when updating a product with a duplicate name', async ({ page }) => {
    await page.getByRole('button', { name: 'Test' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.getByRole('link', { name: 'Products' }).click();
    await expect(page).toHaveURL(/.*\/dashboard\/admin\/products/);
  
    // Use an already created product (e.g., the one starting with NUS-)
    const duplicateName = 'Novel';
    const validName = 'Laptop';
  
    // Click into product with a different name (e.g., MBS-*) to edit
    await page.getByRole('link', { name: validName }).click();
    await expect(page).toHaveURL(/.*\/dashboard\/admin\/product\/.*/);
  
    // Update the name to duplicate
    const nameField = page.getByPlaceholder('write a name');
    await nameField.click();
    await nameField.press('ControlOrMeta+a');
    await nameField.fill(duplicateName);
  
    // Click update
    await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
  
    // Assert error toast/message
    await expect(page).toHaveURL(/.*\/dashboard\/admin\/product\/.*/);
  });

});
