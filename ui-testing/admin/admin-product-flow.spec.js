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

test.describe('Admin Product Features', () => {
  // Shared login for every test
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
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
    const uniqueProductName = 'NUS Logo';
    await page.getByPlaceholder('write a name').fill(uniqueProductName);
    await page.getByPlaceholder('write a description').fill('This is NUS Logo');
    await page.getByPlaceholder('write a Price').fill('1000');
    await page.getByPlaceholder('write a quantity').fill('1');
    await page.locator('#rc_select_1').click();
    await page.getByText('Yes').click();
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();

    await expect(page).toHaveURL(/.*\/dashboard\/admin\/products/);
  });

  test('admin can update an existing product', async ({ page }) => {
    // 2. Navigate to Dashboard → Products
    await page.getByRole('button', { name: 'Test' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.getByRole('link', { name: 'Products' }).click();
    await expect(page).toHaveURL(/.*\/dashboard\/admin\/products/);
  
    // 3. Select the product to update.
    // Here we select a product using its full visible text from codegen.
    await page.getByRole('link', { name: 'NUS Logo' }).click();
    // Wait until the product details page is loaded
    await expect(page).toHaveURL(/.*\/dashboard\/admin\/product\/.*/);
  
    // 4. Update product details
    await page.getByPlaceholder('write a description').fill('This is lion');
    await page.getByPlaceholder('write a Price').fill('9');
    await page.getByPlaceholder('write a quantity').fill('1');

    const toggleDisplay = page.locator('span.ant-select-selection-item', { hasText: /^(Yes|No)$/ }).first();
    const currentToggle = (await toggleDisplay.textContent())?.trim();
    await toggleDisplay.click();
    if (currentToggle === 'Yes') {
      await page.getByTitle('No').click();
    } else {
      await page.getByTitle('Yes').first().click();
    }

    const photoPath = path.resolve(__dirname, '../data/Lions.jpg');
    await page.locator('input[type="file"]').setInputFiles(photoPath);
  
    // 5. Click the "UPDATE PRODUCT" button to submit the changes
    await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
  
    // 6. Assert that the update was successful by checking:
    await expect(page).toHaveURL(/.*\/dashboard\/admin\/products/);
  });

  test('should show error when updating a product with a duplicate name', async ({ page }) => {
    await page.getByRole('button', { name: 'Test' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.getByRole('link', { name: 'Products' }).click();
    await expect(page).toHaveURL(/.*\/dashboard\/admin\/products/);
  
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

  test('admin can delete a product from the dashboard', async ({ page }) => {
    // Navigate to products list
    await page.getByRole('button', { name: 'Test' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.getByRole('link', { name: 'Products' }).click();
    await expect(page).toHaveURL(/.*\/dashboard\/admin\/products/);
  
    // Select the product to delete
    const productLink = page.getByRole('link', { name: 'NUS Logo' });
    await expect(productLink).toBeVisible();
  
    // Go into the product details page
    await productLink.click();
    await expect(page).toHaveURL(/.*\/dashboard\/admin\/product\/.*/);
    await page.getByRole('button', { name: 'DELETE PRODUCT' }).click();
  
    // Handle the deletion prompt (it requires input text)
    page.once('dialog', async (dialog) => {
      // Provide required text and accept the dialog
      await dialog.accept('confirm');
      await page.keyboard.type('yes');
      await page.keyboard.press('Enter');
    });

    // Click DELETE PRODUCT to trigger the prompt
    await page.getByRole('button', { name: 'DELETE PRODUCT' }).click();
    await page.keyboard.type('yes');
    await page.keyboard.press('Enter');
    // Now manually navigate back to the products list
    await expect(page).toHaveURL(/.*\/dashboard\/admin\/products/);
    // Finally, assert the deleted product is no longer visible
    await expect(page.getByText('NUS Logo')).toHaveCount(0);
  });

});
