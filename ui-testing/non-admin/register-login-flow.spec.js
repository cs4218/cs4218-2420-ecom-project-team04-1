import { test, expect } from '@playwright/test';

test('E2E - Register and Login Flow', async ({ page }) => {
  const uniqueId = Date.now(); // generates unique number each run
  const testEmail = `testuser${uniqueId}@example.com`;
  const testPassword = 'TestPass123';

  // Visit homepage
  await page.goto('http://localhost:3000/');
  await page.getByRole('link', { name: 'Register' }).click();

  // Fill registration form
  await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('Test User');
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(testEmail);
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(testPassword);
  await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill('1234567890');
  await page.getByRole('textbox', { name: 'Enter Your Address' }).fill('1 Test Street');
  await page.getByPlaceholder('Enter Your DOB').fill('2025-03-14');
  await page.getByRole('textbox', { name: 'What is Your Favorite sports' }).fill('football');
  await page.getByRole('button', { name: 'REGISTER' }).click();

  // Wait for redirection to login
  await expect(page).toHaveURL(/.*login/);

  // Fill login form
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(testEmail);
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(testPassword);
  await page.getByRole('button', { name: 'LOGIN' }).click();

  // Assert user is redirected to homepage after login
  await expect(page).toHaveURL('http://localhost:3000/');
});
