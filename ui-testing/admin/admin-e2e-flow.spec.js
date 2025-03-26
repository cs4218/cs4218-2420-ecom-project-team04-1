import { test, expect } from '@playwright/test';

test('admin can create category and product with proper association', async ({ page }) => {
  // Log in as admin
  await page.goto('http://localhost:3000/login');
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test@admin.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('test@admin.com');
  await page.getByRole('button', { name: 'LOGIN' }).click();

  // Navigate to Dashboard
  await page.getByRole('button', { name: 'Test' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();

  // Create new category
  await page.getByRole('link', { name: 'Create Category' }).click();
  await page.getByRole('textbox', { name: 'Enter new category' }).click();
  await page.getByRole('textbox', { name: 'Enter new category' }).fill('Test Category');
  await page.getByRole('button', { name: 'Submit' }).click();

  // Verify new category is created
  await expect(page.getByRole('cell', { name: 'Test Category', exact: true })).toBeVisible();

  // Create new product
  await page.getByRole('link', { name: 'Create Product' }).click();
  await page.locator('#rc_select_0').click();
  await page.getByTitle('Test Category').locator('div').click();
  await page.getByRole('textbox', { name: 'write a name' }).click();
  await page.getByRole('textbox', { name: 'write a name' }).fill('Test Product');
  await page.getByRole('textbox', { name: 'write a description' }).click();
  await page.getByRole('textbox', { name: 'write a description' }).fill('Creating a test product with test category');
  await page.getByPlaceholder('write a Price').click();
  await page.getByPlaceholder('write a Price').fill('10');
  await page.getByPlaceholder('write a quantity').click();
  await page.getByPlaceholder('write a quantity').fill('20');
  await page.locator('#rc_select_1').click();
  await page.getByText('No').click();
  await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();

  // Navigate to Products page
  await page.getByRole('link', { name: 'Products' }).click();

  await expect(page).toHaveURL(/.*\/dashboard\/admin\/products/);

  await expect(page.getByRole('heading', { name: 'All Products List' })).toBeVisible();

  // Verify new product card is created and displayed
  const productCard = page.locator('.card').filter({ hasText: 'Test Product' });
  await expect(productCard).toBeVisible();

  // Verify product details in the card
  await expect(productCard.getByRole('heading', { name: 'Test Product' })).toBeVisible();
  await expect(productCard.getByText('Creating a test product with test category')).toBeVisible();

  await productCard.click();

  await expect(page).toHaveURL(/.*\/dashboard\/admin\/product\/.*/);
  await expect(page.getByRole('heading', { name: 'Update Product' })).toBeVisible();

  // Verify all product details are loaded in the form
  await expect(page.getByRole('textbox', { name: 'write a name' })).toHaveValue('Test Product');
  await expect(page.getByRole('textbox', { name: 'write a description' })).toHaveValue('Creating a test product with test category');
  await expect(page.getByPlaceholder('write a Price')).toHaveValue('10');
  await expect(page.getByPlaceholder('write a quantity')).toHaveValue('20');
  await expect(page.getByTitle('Test Category')).toBeVisible();
  await expect(page.getByText('No')).toBeVisible();

  // Verify update and delete buttons are present
  await expect(page.getByRole('button', { name: 'UPDATE PRODUCT' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'DELETE PRODUCT' })).toBeVisible();

  // Verify navigation back to products list
  await page.getByRole('link', { name: 'Products' }).click();
  await expect(page).toHaveURL(/.*\/dashboard\/admin\/products/);
  await expect(page.getByRole('heading', { name: 'All Products List' })).toBeVisible();
}); 