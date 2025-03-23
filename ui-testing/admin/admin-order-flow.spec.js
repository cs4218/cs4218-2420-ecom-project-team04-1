import { test, expect } from '@playwright/test';

test('admin can change order status', async ({ page }) => {
  // 1. Log in as admin
  await page.goto('http://localhost:3000/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByPlaceholder('Enter Your Email').fill('test@admin.com');
  await page.getByPlaceholder('Enter Your Password').fill('test@admin.com');
  await page.getByRole('button', { name: 'LOGIN' }).click();

  // 2. Go to Dashboard → Orders
  await page.getByRole('button', { name: 'Test' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Orders' }).click();
  await expect(page).toHaveURL(/.*\/dashboard\/admin\/orders/);

  // 3. Locate the row for the order with the product "Laptop"
  //    (or use buyer name, order ID, etc. as needed)
  const laptopOrderRow = page.locator('tr', { hasText: '1' });
  await expect(laptopOrderRow).toBeVisible();

  // 4. Click the current status dropdown (Ant Design .ant-select-selector)
  await laptopOrderRow.locator('.ant-select-selector').click();

  // 5. Change status to "Shipped"
  await page.getByTitle('Shipped').click();
  // Assert "Shipped" is now displayed in that row
  await expect(laptopOrderRow).toContainText('Shipped');

  // 6. Change status to "cancel"
  await laptopOrderRow.locator('.ant-select-selector').click();
  await page.getByTitle('cancel').click();
  await expect(laptopOrderRow).toContainText('cancel');

  // 7. Change status to "Processing"
  await laptopOrderRow.locator('.ant-select-selector').click();
  await page.getByTitle('Processing').click();
  await expect(laptopOrderRow).toContainText('Processing');
});
