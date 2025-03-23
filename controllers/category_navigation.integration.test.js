import request from 'supertest';
import app from '../app.js';
import categoryModel from '../models/categoryModel.js';
import productModel from '../models/productModel.js';

// Mock the models
jest.mock('../models/categoryModel');
jest.mock('../models/productModel');

// Test Variables
const mockCategories = [
  {
    _id: 'category1',
    name: 'Books',
    slug: 'books',
    description: 'All types of books',
  },
  {
    _id: 'category2',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Electronic devices and accessories',
  },
];

const mockProducts = [
  {
    _id: 'product1',
    name: 'Novel',
    description: 'A bestselling novel',
    price: 14.99,
    category: {
      _id: 'category1',
      name: 'Books',
      slug: 'books',
    },
    quantity: 5,
    shipping: true,
    slug: 'novel',
  },
  {
    _id: 'product2',
    name: 'Textbook',
    description: 'A comprehensive textbook',
    price: 79.99,
    category: {
      _id: 'category1',
      name: 'Books',
      slug: 'books',
    },
    quantity: 3,
    shipping: true,
    slug: 'textbook',
  },
];

describe('Category Navigation Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** 1. Get all categories */
  test('should return all categories', async () => {
    // Mock the category model's find method
    categoryModel.find.mockResolvedValue(mockCategories);

    const response = await request(app)
      .get('/api/v1/category/get-category')
      .expect(200);

    // Verify the response
    expect(response.body).toEqual({
      success: true,
      message: 'All Categories List',
      category: mockCategories,
    });

    // Verify the query
    expect(categoryModel.find).toHaveBeenCalled();
  });

  /** 2. Get products by category */
  test('should return products for a valid category', async () => {
    // Mock the category model's findOne method
    categoryModel.findOne.mockResolvedValue(mockCategories[0]);

    // Mock the product model's find method
    productModel.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockProducts),
    });

    const response = await request(app)
      .get(`/api/v1/product/product-category/${mockCategories[0].slug}`)
      .expect(200);

    // Verify the response
    expect(response.body).toEqual({
      success: true,
      category: mockCategories[0],
      products: mockProducts,
    });

    // Verify the queries
    expect(categoryModel.findOne).toHaveBeenCalledWith({
      slug: mockCategories[0].slug,
    });
    expect(productModel.find).toHaveBeenCalledWith({
      category: mockCategories[0],
    });
    expect(productModel.find().populate).toHaveBeenCalledWith('category');
  });

  /** 3. Handle non-existent category */
  test('should handle non-existent category gracefully', async () => {
    // Mock the category model's findOne method to return null
    categoryModel.findOne.mockResolvedValue(null);

    // Mock the product model's find method
    productModel.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue([]),
    });

    const response = await request(app)
      .get('/api/v1/product/product-category/non-existent-category')
      .expect(200);

    // Verify empty results
    expect(response.body).toEqual({
      success: true,
      category: null,
      products: [],
    });
  });

  /** 4. Database error handling for categories */
  test('should handle database errors when getting categories', async () => {
    // Mock the category model's find method to throw an error
    categoryModel.find.mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .get('/api/v1/category/get-category')
      .expect(500);

    // Verify error response
    expect(response.body).toEqual({
      success: false,
      message: 'Error while getting all categories',
      error: {},
    });
  });

  /** 5. Database error handling for category products */
  test('should handle database errors when getting category products', async () => {
    // Mock the category model's findOne method
    categoryModel.findOne.mockResolvedValue(mockCategories[0]);

    // Mock the product model's find method to throw an error
    productModel.find.mockReturnValue({
      populate: jest.fn().mockRejectedValue(new Error('Database error')),
    });

    const response = await request(app)
      .get(`/api/v1/product/product-category/${mockCategories[0].slug}`)
      .expect(400);

    // Verify error response
    expect(response.body).toEqual({
      success: false,
      error: {},
      message: 'Error While Getting products',
    });
  });

  /** 6. Verify category population in products */
  test('should properly populate category information in products', async () => {
    // Mock the category model's findOne method
    categoryModel.findOne.mockResolvedValue(mockCategories[0]);

    // Mock the product model's find method
    productModel.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockProducts),
    });

    await request(app)
      .get(`/api/v1/product/product-category/${mockCategories[0].slug}`)
      .expect(200);

    // Verify category population
    expect(productModel.find().populate).toHaveBeenCalledWith('category');
  });
});
