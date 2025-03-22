import request from 'supertest';
import app from '../app.js';
import productModel from '../models/productModel.js';

// Mock the product model
jest.mock('../models/productModel');

// Test Variables
const mockProducts = [
  {
    _id: 'product1',
    name: 'Textbook',
    description: 'A comprehensive textbook',
    price: 79.99,
    category: {
      _id: 'category1',
      name: 'Book',
    },
    quantity: 5,
    shipping: true,
    slug: 'textbook',
  },
  {
    _id: 'product2',
    name: 'Law Book',
    description: 'The Law of Contract in Singapore',
    price: 89.99,
    category: {
      _id: 'category1',
      name: 'Book',
    },
    quantity: 3,
    shipping: true,
    slug: 'law-book',
  },
];

describe('Related Products Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** 1. Successful related products retrieval */
  test('should return related products when valid product ID and category ID are provided', async () => {
    // Create a mock query chain
    const mockQuery = {
      find: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(mockProducts),
    };

    // Mock the product model's static methods
    productModel.find.mockReturnValue(mockQuery);

    const pid = 'product1';
    const cid = 'category1';
    const response = await request(app)
      .get(`/api/v1/product/related-product/${pid}/${cid}`)
      .expect(200);

    // Verify the response
    expect(response.body).toEqual({
      success: true,
      products: mockProducts,
    });

    // Verify the query chain
    expect(productModel.find).toHaveBeenCalledWith({
      category: cid,
      _id: { $ne: pid },
    });
    expect(mockQuery.select).toHaveBeenCalledWith('-photo');
    expect(mockQuery.limit).toHaveBeenCalledWith(3);
    expect(mockQuery.populate).toHaveBeenCalledWith('category');
  });

  /** 2. No related products found */
  test('should return empty array when no related products found', async () => {
    // Create a mock query chain
    const mockQuery = {
      find: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue([]),
    };

    // Mock the product model's static methods
    productModel.find.mockReturnValue(mockQuery);

    const pid = 'product1';
    const cid = 'category1';
    const response = await request(app)
      .get(`/api/v1/product/related-product/${pid}/${cid}`)
      .expect(200);

    // Verify empty results
    expect(response.body).toEqual({
      success: true,
      products: [],
    });
  });

  /** 3. Database error handling */
  test('should handle database errors gracefully', async () => {
    // Create a mock query chain that throws an error
    const mockQuery = {
      find: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockRejectedValue(new Error('Database error')),
    };

    // Mock the product model's static methods
    productModel.find.mockReturnValue(mockQuery);

    const pid = 'product1';
    const cid = 'category1';
    const response = await request(app)
      .get(`/api/v1/product/related-product/${pid}/${cid}`)
      .expect(400);

    // Verify error response
    expect(response.body).toEqual({
      success: false,
      message: 'error while getting related product',
      error: {},
    });
  });

  /** 4. Verify limit of 3 products */
  test('should limit results to 3 products', async () => {
    // Create a mock query chain
    const mockQuery = {
      find: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(mockProducts),
    };

    // Mock the product model's static methods
    productModel.find.mockReturnValue(mockQuery);

    const pid = 'product1';
    const cid = 'category1';
    await request(app)
      .get(`/api/v1/product/related-product/${pid}/${cid}`)
      .expect(200);

    // Verify limit was called with 3
    expect(mockQuery.limit).toHaveBeenCalledWith(3);
  });

  /** 5. Verify photo exclusion */
  test('should exclude photo field from results', async () => {
    // Create a mock query chain
    const mockQuery = {
      find: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(mockProducts),
    };

    // Mock the product model's static methods
    productModel.find.mockReturnValue(mockQuery);

    const pid = 'product1';
    const cid = 'category1';
    await request(app)
      .get(`/api/v1/product/related-product/${pid}/${cid}`)
      .expect(200);

    // Verify photo field was excluded
    expect(mockQuery.select).toHaveBeenCalledWith('-photo');
  });

  /** 6. Verify category population */
  test('should populate category information', async () => {
    // Create a mock query chain
    const mockQuery = {
      find: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(mockProducts),
    };

    // Mock the product model's static methods
    productModel.find.mockReturnValue(mockQuery);

    const pid = 'product1';
    const cid = 'category1';
    await request(app)
      .get(`/api/v1/product/related-product/${pid}/${cid}`)
      .expect(200);

    // Verify category was populated
    expect(mockQuery.populate).toHaveBeenCalledWith('category');
  });
});
