import { test, expect } from '@playwright/test';

test('admin user management view displays correctly', async ({ page }) => {
  // Login as admin
  await page.goto('http://localhost:3000/login');
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test@admin.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('test@admin.com');
  await page.getByRole('button', { name: 'LOGIN' }).click();

  // Navigate to users page
  await page.getByRole('button', { name: 'Test' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Users' }).click();

  // Verify page title and heading
  await expect(page).toHaveTitle(/Users/);
  await expect(page.getByRole('heading', { name: 'All Users' })).toBeVisible();

  // Verify table headers
  const expectedHeaders = ['Name', 'Email', 'Phone', 'Address', 'Role', '#'];
  for (const header of expectedHeaders) {
    await expect(page.getByRole('columnheader', { name: header })).toBeVisible();
  }

  // Verify table structure
  const table = page.getByRole('table');
  await expect(table).toBeVisible();
  
  // Verify table has rows (at least header row)
  const rows = table.getByRole('row');
  const rowsCount = await rows.count();
  await expect(rowsCount).toBeGreaterThanOrEqual(1);

  // Verify data cells are present and have content
  const firstDataRow = rows.nth(1); // First row after header
  if (await firstDataRow.isVisible()) {
    // Check if cells in the first data row have content
    const cells = firstDataRow.getByRole('cell');
    const cellCount = await cells.count();
    for (let i = 0; i < cellCount; i++) {
      const cell = cells.nth(i);
      const cellText = await cell.textContent();
      expect(cellText).toBeTruthy();
    }
  }

  // Verify role column contains valid roles
  const roleCells = page.getByRole('cell', { name: /^(Admin|User)$/ });
  const roleCellsCount = await roleCells.count();
  await expect(roleCellsCount).toBeGreaterThanOrEqual(1);

  // Verify email format in the table
  const emailCells = page.getByRole('cell', { name: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ });
  const emailCellsCount = await emailCells.count();
  await expect(emailCellsCount).toBeGreaterThanOrEqual(1);

  // Verify phone number format
  const phoneCells = page.getByRole('cell', { name: /^\+?[\d\s-()]+$/ });
  const phoneCellsCount = await phoneCells.count();
  await expect(phoneCellsCount).toBeGreaterThanOrEqual(1);
});