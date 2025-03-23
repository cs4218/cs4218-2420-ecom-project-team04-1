import request from 'supertest';
import app from '../app.js';
import productModel from '../models/productModel.js';

jest.mock('../models/productModel.js');

describe('Product Count Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return the total product count', async () => {
    productModel.find.mockReturnValue({
      estimatedDocumentCount: jest.fn().mockResolvedValue(5),
    });

    const response = await request(app)
      .get('/api/v1/product/product-count')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      total: 5,
    });

    expect(productModel.find).toHaveBeenCalled();
  });

  test('should handle errors in product count', async () => {
    productModel.find.mockReturnValue({
      estimatedDocumentCount: jest.fn().mockRejectedValue(new Error('Database error')),
    });

    const response = await request(app)
      .get('/api/v1/product/product-count')
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      message: 'Error in product count',
      error: expect.anything(),
    });
  });

  test('should return a paginated list of products', async () => {
    productModel.find.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([
          { _id: '1', name: 'Product 1', price: 100 },
          { _id: '2', name: 'Product 2', price: 200 },
        ]),
      }));

    const response = await request(app)
      .get('/api/v1/product/product-list/1')
      .expect(200);

      expect(response.body).toEqual({
      success: true,
      products: [
        { _id: '1', name: 'Product 1', price: 100 },
        { _id: '2', name: 'Product 2', price: 200 },
      ],
    });

    expect(productModel.find).toHaveBeenCalledWith({});
  });

  test('should handle errors in product list', async () => {
    productModel.find.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(new Error('Database error')),
      }));

    const response = await request(app)
      .get('/api/v1/product/product-list/1')
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      message: 'error in per page ctrl',
      error: expect.anything(),
    });
  });
});