import request from 'supertest';
import app from '../app.js';
import productModel from '../models/productModel.js';

jest.mock('../models/productModel.js');

describe('Product Photo Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return the image data for a valid product ID', async () => {
    productModel.findById.mockImplementation(() => ({
        select: jest.fn().mockResolvedValue({
          photo: {
            data: Buffer.from('image-data'),
            contentType: 'image/jpeg',
          },
        }),
      }));

    const response = await request(app)
      .get('/api/v1/product/product-photo/valid-product-id')
      .expect(200);

    expect(response.headers['content-type']).toBe('image/jpeg');
    expect(response.body).toEqual(Buffer.from('image-data'));
    expect(productModel.findById).toHaveBeenCalledWith('valid-product-id');
  });

  test('should return 500 if the product ID is invalid', async () => {
    productModel.findById.mockImplementation(() => ({
        select: jest.fn().mockRejectedValue(new Error('Database error')),
      }));

    const response = await request(app)
      .get('/api/v1/product/product-photo/invalid-product-id')
      .expect(500);

    expect(response.body).toEqual({
      success: false,
      message: 'Error while getting photo',
      error: expect.anything(),
    });
    expect(productModel.findById).toHaveBeenCalledWith('invalid-product-id');
  });
});