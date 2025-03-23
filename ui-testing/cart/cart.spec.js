// @ts-check
import { test, expect } from '@playwright/test';

// Test data matching actual product structure
const TEST_PRODUCT = {
  name: 'Laptop',
  description: 'A powerful laptop',
  price: 1499.99,
  category: {
    name: 'Electronics',
    slug: 'electronics',
  },
};

test.describe('Cart Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('http://localhost:3000');
  });

  test('should add product to cart', async ({ page }) => {
    // Navigate to a product page
    await page.goto('http://localhost:3000/product/laptop');

    // Wait for product details to load
    await page.waitForSelector('.product-details-info');

    // Verify product details are displayed
    await expect(
      page.getByRole('heading', { name: `Name : ${TEST_PRODUCT.name}` })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: `Description : ${TEST_PRODUCT.description}`,
      })
    ).toBeVisible();
    await expect(
      page.getByText(
        TEST_PRODUCT.price.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
        })
      )
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: `Category : ${TEST_PRODUCT.category.name}`,
      })
    ).toBeVisible();

    // Click Add to Cart button
    const addToCartButton = page.getByRole('button', { name: 'ADD TO CART' });
    await addToCartButton.click();

    // Verify success toast message
    await expect(page.getByText('Item Added to cart')).toBeVisible();

    // Navigate to cart page
    await page.goto('http://localhost:3000/cart');

    // Verify product is in cart
    await expect(
      page.getByText(TEST_PRODUCT.name, { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText(TEST_PRODUCT.description, { exact: true })
    ).toBeVisible();
    await expect(page.getByText(`Price : ${TEST_PRODUCT.price}`)).toBeVisible();
  });

  test('should add multiple products to cart', async ({ page }) => {
    // Navigate to a product page
    await page.goto('http://localhost:3000/product/laptop');

    // Wait for product details to load
    await page.waitForSelector('.product-details-info');

    // Verify product details are displayed
    await expect(
      page.getByRole('heading', { name: `Name : ${TEST_PRODUCT.name}` })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: `Description : ${TEST_PRODUCT.description}`,
      })
    ).toBeVisible();
    await expect(
      page.getByText(
        TEST_PRODUCT.price.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
        })
      )
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: `Category : ${TEST_PRODUCT.category.name}`,
      })
    ).toBeVisible();

    // Click Add to Cart button twice
    const addToCartButton = page.getByRole('button', { name: 'ADD TO CART' });
    await addToCartButton.click();
    await addToCartButton.click();

    // Verify both success toast messages
    await expect(page.getByText('Item Added to cart')).toHaveCount(2);

    // Navigate to cart page
    await page.goto('http://localhost:3000/cart');

    // Wait for cart items to be visible
    await page.waitForSelector('.card');

    // Verify two products are in cart
    const productCards = page.locator('.card');
    await expect(productCards).toHaveCount(2);

    // Verify both products have correct details
    for (let i = 0; i < 2; i++) {
      await expect(
        page
          .locator('.card')
          .nth(i)
          .getByText(TEST_PRODUCT.name, { exact: true })
      ).toBeVisible();
      await expect(
        page
          .locator('.card')
          .nth(i)
          .getByText(TEST_PRODUCT.description, { exact: true })
      ).toBeVisible();
      await expect(
        page.locator('.card').nth(i).getByText(`${TEST_PRODUCT.price}`)
      ).toBeVisible();
    }

    // Verify total price (should be double the product price)
    const expectedTotal = (TEST_PRODUCT.price * 2).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
    await expect(page.getByText(`Total : ${expectedTotal}`)).toBeVisible();
  });

  test('should remove product from cart', async ({ page }) => {
    // First add a product to cart
    await page.goto('http://localhost:3000/product/laptop');

    // Wait for product details to load
    await page.waitForSelector('.product-details-info');

    // Verify product details are displayed
    await expect(
      page.getByRole('heading', { name: `Name : ${TEST_PRODUCT.name}` })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: `Description : ${TEST_PRODUCT.description}`,
      })
    ).toBeVisible();
    await expect(
      page.getByText(
        TEST_PRODUCT.price.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
        })
      )
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: `Category : ${TEST_PRODUCT.category.name}`,
      })
    ).toBeVisible();

    // Click Add to Cart button
    const addToCartButton = page.getByRole('button', { name: 'ADD TO CART' });
    await addToCartButton.click();

    // Navigate to cart page
    await page.goto('http://localhost:3000/cart');

    // Click remove button
    const removeButton = page.getByRole('button', { name: 'Remove' });
    await removeButton.click();

    // Verify product is removed
    await expect(page.getByText(TEST_PRODUCT.name)).not.toBeVisible();
  });

  test('should persist cart data after page refresh', async ({ page }) => {
     // First add a product to cart
     await page.goto('http://localhost:3000/product/laptop');

     // Wait for product details to load
     await page.waitForSelector('.product-details-info');
 
     // Verify product details are displayed
     await expect(
       page.getByRole('heading', { name: `Name : ${TEST_PRODUCT.name}` })
     ).toBeVisible();
     await expect(
       page.getByRole('heading', {
         name: `Description : ${TEST_PRODUCT.description}`,
       })
     ).toBeVisible();
     await expect(
       page.getByText(
         TEST_PRODUCT.price.toLocaleString('en-US', {
           style: 'currency',
           currency: 'USD',
         })
       )
     ).toBeVisible();
     await expect(
       page.getByRole('heading', {
         name: `Category : ${TEST_PRODUCT.category.name}`,
       })
     ).toBeVisible();
 
     // Click Add to Cart button
     const addToCartButton = page.getByRole('button', { name: 'ADD TO CART' });
     await addToCartButton.click();
 
     // Navigate to cart page
     await page.goto('http://localhost:3000/cart');

    // Verify product is in cart
    await expect(page.getByText(TEST_PRODUCT.name, { exact: true })).toBeVisible();

    // Refresh the page
    await page.reload();

    // Verify product is still in cart
    await expect(page.getByText(TEST_PRODUCT.name, { exact: true })).toBeVisible();
  });

  test('should show empty cart message when no items', async ({ page }) => {
    // Navigate to cart page
    await page.goto('http://localhost:3000/cart');

    // Verify empty cart message
    await expect(page.getByText('Your Cart Is Empty')).toBeVisible();
  });

  test('should show correct total price', async ({ page }) => {
     // First add a product to cart
     await page.goto('http://localhost:3000/product/laptop');

     // Wait for product details to load
     await page.waitForSelector('.product-details-info');
 
     // Verify product details are displayed
     await expect(
       page.getByRole('heading', { name: `Name : ${TEST_PRODUCT.name}` })
     ).toBeVisible();
     await expect(
       page.getByRole('heading', {
         name: `Description : ${TEST_PRODUCT.description}`,
       })
     ).toBeVisible();
     await expect(
       page.getByText(
         TEST_PRODUCT.price.toLocaleString('en-US', {
           style: 'currency',
           currency: 'USD',
         })
       )
     ).toBeVisible();
     await expect(
       page.getByRole('heading', {
         name: `Category : ${TEST_PRODUCT.category.name}`,
       })
     ).toBeVisible();
 
     // Click Add to Cart button
     const addToCartButton = page.getByRole('button', { name: 'ADD TO CART' });
     await addToCartButton.click();
     await addToCartButton.click();
 
     // Navigate to cart page
     await page.goto('http://localhost:3000/cart');

    // Verify total price
    const expectedTotal = (2 * TEST_PRODUCT.price).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
    
    await expect(page.getByText(`Total : ${expectedTotal}`)).toBeVisible();
  });
});
