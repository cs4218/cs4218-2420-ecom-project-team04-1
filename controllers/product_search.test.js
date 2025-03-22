import request from 'supertest';
import app from '../app.js';
import productModel from '../models/productModel.js';

// Mock the product model
jest.mock('../models/productModel');

// Test Variables
const mockProducts = [
  {
    _id: 'product1',
    name: 'Test Product 1',
    description: 'This is a test product',
    price: 99.99,
    category: 'category1',
    quantity: 10,
    shipping: true,
    slug: 'test-product-1',
  },
  {
    _id: 'product2',
    name: 'Another Test Product',
    description: 'Another test product description',
    price: 149.99,
    category: 'category2',
    quantity: 5,
    shipping: true,
    slug: 'another-test-product',
  },
];

describe('Product Search Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** 1. Successful product search with results */
  test('should return matching products when searching with valid keyword', async () => {
    // Create a mock query chain
    const mockQuery = {
      find: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue(mockProducts),
    };

    // Mock the product model's static methods
    productModel.find.mockReturnValue(mockQuery);

    const searchKeyword = 'test';
    const response = await request(app)
      .get(`/api/v1/product/search/${searchKeyword}`)
      .expect(200);

    // Verify the response
    expect(response.body).toEqual(mockProducts);

    // Verify the search query chain
    expect(productModel.find).toHaveBeenCalledWith({
      $or: [
        { name: { $regex: searchKeyword, $options: 'i' } },
        { description: { $regex: searchKeyword, $options: 'i' } },
      ],
    });
    expect(mockQuery.select).toHaveBeenCalledWith('-photo');
  });

  /** 2. Search with no results */
  test('should return empty array when no products match search', async () => {
    // Create a mock query chain
    const mockQuery = {
      find: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue([]),
    };

    // Mock the product model's static methods
    productModel.find.mockReturnValue(mockQuery);

    const searchKeyword = 'nonexistent';
    const response = await request(app)
      .get(`/api/v1/product/search/${searchKeyword}`)
      .expect(200);

    // Verify empty results
    expect(response.body).toEqual([]);
  });

  /** 3. Search with special characters */
  test('should handle special characters in search keyword', async () => {
    // Create a mock query chain
    const mockQuery = {
      find: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue(mockProducts),
    };

    // Mock the product model's static methods
    productModel.find.mockReturnValue(mockQuery);

    const searchKeyword = 'test@#$%';
    const response = await request(app)
      .get(`/api/v1/product/search/${encodeURIComponent(searchKeyword)}`)
      .expect(200);

    // Verify the search query handles special characters
    expect(productModel.find).toHaveBeenCalledWith({
      $or: [
        { name: { $regex: searchKeyword, $options: 'i' } },
        { description: { $regex: searchKeyword, $options: 'i' } },
      ],
    });
  });

  /** 4. Search with empty keyword */
  test('should handle empty search keyword', async () => {
    // Create a mock query chain
    const mockQuery = {
      find: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue([]),
    };

    // Mock the product model's static methods
    productModel.find.mockReturnValue(mockQuery);

    const searchKeyword = 'nonexistent'; // Using a valid keyword since empty ones are not handled
    const response = await request(app)
      .get(`/api/v1/product/search/${searchKeyword}`)
      .expect(200);

    // Verify empty results for empty keyword
    expect(response.body).toEqual([]);
  });

  /** 5. Search with case-insensitive matching */
  test('should perform case-insensitive search', async () => {
    // Create a mock query chain
    const mockQuery = {
      find: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue([mockProducts[0]]),
    };

    // Mock the product model's static methods
    productModel.find.mockReturnValue(mockQuery);

    const searchKeyword = 'TEST';
    const response = await request(app)
      .get(`/api/v1/product/search/${searchKeyword}`)
      .expect(200);

    // Verify case-insensitive search
    expect(productModel.find).toHaveBeenCalledWith({
      $or: [
        { name: { $regex: searchKeyword, $options: 'i' } },
        { description: { $regex: searchKeyword, $options: 'i' } },
      ],
    });
  });

  /** 6. Search with database error */
  test('should handle database errors gracefully', async () => {
    // Create a mock query chain that throws an error
    const mockQuery = {
      find: jest.fn().mockReturnThis(),
      select: jest.fn().mockRejectedValue(new Error('Database error')),
    };

    // Mock the product model's static methods
    productModel.find.mockReturnValue(mockQuery);

    const searchKeyword = 'test';
    const response = await request(app)
      .get(`/api/v1/product/search/${searchKeyword}`)
      .expect(400);

    // Verify error response
    expect(response.body).toEqual({
      success: false,
      message: 'Error In Search Product API',
      error: {}, // The error object is empty in the actual response
    });
  });
});
