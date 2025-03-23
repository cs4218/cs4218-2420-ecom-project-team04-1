import { test, expect } from '@playwright/test';

const loginNonAdmin = async (page) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('cs4218@test.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('cs4218@test.com');
  await page.getByRole('button', { name: 'LOGIN' }).click();
};

// For testing update profile purposes
const originalName = 'CS 4218 Test Account';
const updatedName = 'CS 4218 Test Updated Account';
const originalAddress = '1 Computing Drive';
const updatedAddress = '1 New Computing Drive';

test.describe('E2E User Flow - Checkout and Orders', () => {
  // This test is for a non-admin user to test the user interface of the website
  // The user will login, add items to cart, make payment, and verify the items are added into orders page
  test('E2E - Login -> Payment -> Order Page', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    // Login as a non-admin user
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('cs4218@test.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('cs4218@test.com');
    await page.getByRole('button', { name: 'LOGIN' }).click();

    // Add items to cart
    await page.locator('div:nth-child(4) > .card-body > div:nth-child(3) > button:nth-child(2)').click();
    await page.locator('div:nth-child(2) > .card-body > div:nth-child(3) > button:nth-child(2)').click();

    // Navigate to Cart Page
    await page.getByRole('link', { name: 'Cart' }).click();

    // Make Payment with dummy credit card details. 
    await page.getByRole('button', { name: 'Paying with Card' }).click();
    await page.locator('iframe[name="braintree-hosted-field-number"]').contentFrame().getByRole('textbox', { name: 'Credit Card Number' }).click();
    await page.locator('iframe[name="braintree-hosted-field-number"]').contentFrame().getByRole('textbox', { name: 'Credit Card Number' }).fill('4242424242424242'); 
    await page.locator('iframe[name="braintree-hosted-field-expirationDate"]').contentFrame().getByRole('textbox', { name: 'Expiration Date' }).click();
    await page.locator('iframe[name="braintree-hosted-field-expirationDate"]').contentFrame().getByRole('textbox', { name: 'Expiration Date' }).fill('0230');
    await page.locator('iframe[name="braintree-hosted-field-cvv"]').contentFrame().getByRole('textbox', { name: 'CVV' }).click();
    await page.locator('iframe[name="braintree-hosted-field-cvv"]').contentFrame().getByRole('textbox', { name: 'CVV' }).fill('888');
    await page.getByRole('button', { name: 'Make Payment' }).click();

    // Automatically redirected to Orders Page
    await expect(page).toHaveURL(/orders/);
    await expect(page.getByRole('heading', { name: 'All Orders' })).toBeVisible();
    // Verify items are added into Orders Page
    // await expect(page.locator('#root div').filter({ hasText: 'IDStatusBuyerDatePaymentQuantity1Not ProcessCS 4218 Test Accounta few seconds' }).nth(4)).toBeVisible();
    await expect(page.getByRole('img', { name: 'Novel' }).first()).toBeVisible();
    await expect(page.locator('div:nth-child(2) > .col-md-3 > .card-img-top').first()).toBeVisible();
    await expect(page.getByText('Novel', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('A bestselling novel for').first()).toBeVisible();
    await expect(page.locator('div:nth-child(2) > .col-md-8 > p').first()).toBeVisible();
    await expect(page.locator('div:nth-child(2) > .col-md-8 > p:nth-child(2)').first()).toBeVisible();
  });
})

test.describe('User Profile - Changing Profile Credentials', () => {
  // Reset fields.
  test.afterEach(async ({ page }) => {
      await page.getByRole('button', { name: updatedName }).click();
      await page.getByRole('link', { name: 'Dashboard' }).click();
      await page.getByRole('link', { name: 'Profile' }).click();
      await page.getByRole('textbox', { name: 'Enter Your Name' }).click();
      await page.getByRole('textbox', { name: 'Enter Your Name' }).fill(originalName);
      await page.getByRole('textbox', { name: 'Enter Your Address' }).click();
      await page.getByRole('textbox', { name: 'Enter Your Address' }).fill(originalAddress);
      await page.getByRole('button', { name: 'UPDATE', exact: true }).click();
      // Updated back Successfully
    await expect(page.getByText('Profile Updated Successfully').first()).toBeVisible();

  })
  
  test('Allow users to see their updated credentials immediately at Dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    // Login as a non-admin user
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('cs4218@test.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('cs4218@test.com');
    await page.getByRole('button', { name: 'LOGIN' }).click();

    // Go to user Dashboard
    await page.getByRole('button', { name: originalName }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();

    // Verify Original Profile name and address
    await expect(page.getByRole('main')).toContainText(originalName);
    await expect(page.getByRole('main')).toContainText(originalAddress);

    // Go to User Profile Page
    await page.getByRole('link', { name: 'Profile' }).click();

    // Update User Name and address.
    await page.getByRole('textbox', { name: 'Enter Your Name' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Name' }).fill(updatedName);
    await page.getByRole('textbox', { name: 'Enter Your Address' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Address' }).fill(updatedAddress);

    // Click Update Button
    await page.getByRole('button', { name: 'UPDATE' }).click();

    // Updated Successfully
    await expect(page.getByText('Profile Updated Successfully').first()).toBeVisible();

    // Go back to Dashboard
    await page.getByRole('button', { name: updatedName }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();

    // Verify Updated Profile name and address
    await expect(page.getByRole('main')).toContainText(updatedName);
    await expect(page.getByRole('main')).toContainText(updatedAddress);
  });

  test('Allow users to see their updated name immediately at Order', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    // Login as a non-admin user
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('cs4218@test.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('cs4218@test.com');
    await page.getByRole('button', { name: 'LOGIN' }).click();

    // Go to user Orders Page
    await page.getByRole('button', { name: originalName }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.waitForURL('**/dashboard/user');
    await page.getByRole('link', { name: 'Orders' }).click();

    // Verify Original Profile name
    await expect(page.getByRole('main')).toContainText(originalName);

    // Go to Profile Page
    await page.getByRole('link', { name: 'Profile' }).click();

    // Update User Name
    await page.getByRole('textbox', { name: 'Enter Your Name' }).fill(updatedName);
    await page.getByRole('button', { name: 'UPDATE' }).click();

    // Verify successful update 
    await expect(page.getByText('Profile Updated Successfully').first()).toBeVisible();

    // Go back to Orders Page and Verify updated name
    await page.getByRole('link', { name: 'Orders' }).click();
    await expect(page.getByRole('main')).toContainText(updatedName);
  }, );

});

test.describe('Search Component and Search Page', () => {
  test('returns product(s) found if exists, and can be added to Cart.', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.getByRole('searchbox', { name: 'Search' }).click();
    await page.getByRole('searchbox', { name: 'Search' }).fill('T-shirt'); // Valid Product substring name
    await page.getByRole('button', { name: 'Search' }).click();

    // Assert that the search results page is visible
    await expect(page.getByRole('heading', { name: 'Search Results' })).toBeVisible();

    // Assert that there exist products with the substring 'T-shirt' in the name
    await expect(page.getByRole('heading', { name: 'Found' })).toBeVisible();

    // UI Check on the rendering of the products
    await expect(page.locator('div').filter({ hasText: /^NUS T-shirtPlain NUS T-shirt for sale \$ 4\.99More DetailsADD TO CART$/ }).first()).toBeVisible();
    
    // Verify that Searched products can be added to cart
    await page.getByRole('button', { name: 'ADD TO CART' }).click();
    await expect(page.getByText('Item Added to cart')).toBeVisible();
    await expect(page.locator('div').filter({ hasText: /^Item Added to cart$/ }).nth(2)).toBeVisible();

    // Verify that the product is added to the cart at cart page
    await page.getByRole('link', { name: 'Cart' }).click();
    await expect(page.getByText('NUS T-shirtPlain NUS T-shirt for salePrice : 4.99Remove')).toBeVisible();
  });

  test('returns a valid product and "More Details" button navigates to Product Detail Page', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.getByRole('searchbox', { name: 'Search' }).click();
    await page.getByRole('searchbox', { name: 'Search' }).fill('Phone'); // ANother valid Product substring name
    await page.getByRole('button', { name: 'Search' }).click();

    // Assert that the search results page is visible
    await expect(page.getByRole('heading', { name: 'Search Results' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Found' })).toBeVisible();

    // UI Check on the rendering of the products
    await expect(page.getByText('SmartphoneA high-end')).toBeVisible();
    await expect(page.getByRole('main')).toContainText('A high-end smartphone. Good for daily usage. Affor...');
    await page.getByRole('button', { name: 'More Details' }).click();

    // Navigate to Product Details Page
    // Automatically redirected to Product detail Page
    await expect(page).toHaveURL(/product/);
    await expect(page.getByRole('heading', { name: 'Product Details' })).toBeVisible();
  });

  test('returns "No Products Found" if the product name searched does not exist', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.getByRole('searchbox', { name: 'Search' }).click();
    await page.getByRole('searchbox', { name: 'Search' }).fill('abcdefghxxxx'); // Random string where no products would have this name.
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByRole('heading', { name: 'Search Results' })).toBeVisible();
    await expect(page.locator('h6')).toContainText('No Products Found');
  });
})