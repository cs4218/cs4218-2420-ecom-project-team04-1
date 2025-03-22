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


test('Authentication: Login to nonexistent account and with wrong password', async ({ page }) => {
    // Use a dynamic email to ensure it's not registered
    const randomSuffix = Date.now();
    const registeredEmail = `authuser${randomSuffix}@example.com`;
    const wrongEmail = `nonexistent${randomSuffix}@example.com`;
    const password = '123456';
    const wrongPassword = 'wrongpass';
  
    // Go to homepage and register a valid account
    await page.goto('http://localhost:3000/');
    await page.getByRole('link', { name: 'Register' }).click();
  
    await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('Test User');
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(registeredEmail);
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(password);
    await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill('9876543210');
    await page.getByRole('textbox', { name: 'Enter Your Address' }).fill('123 Street');
    await page.getByPlaceholder('Enter Your DOB').fill('2024-01-01');
    await page.getByRole('textbox', { name: 'What is Your Favorite sports' }).fill('football');
    await page.getByRole('button', { name: 'REGISTER' }).click();
  
    // Assert that we are redirected to login page
    await expect(page).toHaveURL(/.*login/);
  
    // Try to login with a non-existent email
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(wrongEmail);
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(password);
    await page.getByRole('button', { name: 'LOGIN' }).click();
  
    // Assertion: should still be on login page
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByText('Something went wrong')).toBeVisible();

    // Try to login with correct email but wrong password
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(registeredEmail);
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(wrongPassword);
    await page.getByRole('button', { name: 'LOGIN' }).click();
  
    // Assertion: still on login page and error shown
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByText('Something went wrong')).toBeVisible();
  
    // Finally login with correct credentials to confirm success path works
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(registeredEmail);
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(password);
    await page.getByRole('button', { name: 'LOGIN' }).click();
  
    // Expect redirection to home page
    await expect(page).toHaveURL('http://localhost:3000/');
  });
