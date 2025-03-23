import request from 'supertest';
import app from '../app.js';
import productModel from '../models/productModel.js';

jest.mock('../models/productModel');

const mockProducts = [
  { _id: '1', name: 'Laptop', price: 1000, category: 'Electronics' },
  { _id: '2', name: 'Smartphone', price: 800, category: 'Electronics' },
  { _id: '3', name: 'T-shirt', price: 20, category: 'Clothing' },
  { _id: '4', name: 'Jeans', price: 50, category: 'Clothing' },
  { _id: '5', name: 'Book', price: 15, category: 'Books' },
];

describe('Product Filters Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should filter products by category', async () => {
    productModel.find.mockResolvedValue(
      mockProducts.filter((product) => product.category === 'Electronics')
    );

    const response = await request(app)
      .post('/api/v1/product/product-filters')
      .send({
        checked: ['Electronics'],
        radio: [],
      })
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      products: [
        { _id: '1', name: 'Laptop', price: 1000, category: 'Electronics' },
        { _id: '2', name: 'Smartphone', price: 800, category: 'Electronics' },
      ],
    });

    expect(productModel.find).toHaveBeenCalledWith({
        category: ['Electronics'],
      });
  });

  test('should filter products by price range', async () => {
    productModel.find.mockResolvedValue(
      mockProducts.filter((product) => product.price >= 10 && product.price <= 50)
    );

    const response = await request(app)
      .post('/api/v1/product/product-filters')
      .send({
        checked: [],
        radio: [10, 50],
      })
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      products: [
        { _id: '3', name: 'T-shirt', price: 20, category: 'Clothing' },
        { _id: '4', name: 'Jeans', price: 50, category: 'Clothing' },
        { _id: '5', name: 'Book', price: 15, category: 'Books' },
      ],
    });

    expect(productModel.find).toHaveBeenCalledWith({
      price: { $gte: 10, $lte: 50 },
    });
  });

  test('should filter products by category and price range', async () => {
    productModel.find.mockResolvedValue(
      mockProducts.filter(
        (product) =>
          product.category === 'Clothing' && product.price >= 10 && product.price <= 30
      )
    );

    const response = await request(app)
      .post('/api/v1/product/product-filters')
      .send({
        checked: ['Clothing'],
        radio: [10, 30],
      })
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      products: [{ _id: '3', name: 'T-shirt', price: 20, category: 'Clothing' }],
    });

    expect(productModel.find).toHaveBeenCalledWith({
      category: ['Clothing'],
      price: { $gte: 10, $lte: 30 },
    });
  });

  test('should return all products when no filters are applied', async () => {
    productModel.find.mockResolvedValue(mockProducts);

    const response = await request(app)
      .post('/api/v1/product/product-filters')
      .send({
        checked: [],
        radio: [],
      })
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      products: mockProducts,
    });

    expect(productModel.find).toHaveBeenCalledWith({});
  });

  test('should handle database errors gracefully', async () => {
    productModel.find.mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .post('/api/v1/product/product-filters')
      .send({
        checked: ['Electronics'],
        radio: [],
      })
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      message: 'Error While Filtering Products',
      error: {},
    });
  });
});