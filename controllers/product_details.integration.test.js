import request from 'supertest';
import app from '../app.js';
import productModel from '../models/productModel.js';

// Mock the product model
jest.mock('../models/productModel');

// Test Variables
const mockProduct = {
  _id: 'product1',
  name: 'Test Product',
  description: 'This is a test product description',
  price: 99.99,
  category: {
    _id: 'category1',
    name: 'Test Category',
  },
  quantity: 10,
  shipping: true,
  slug: 'test-product',
  photo: {
    data: Buffer.from('fake-image-data'),
    contentType: 'image/jpeg',
  },
};

describe('Product Details Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** 1. Successful product details retrieval */
  test('should return product details when valid slug is provided', async () => {
    // Create a product without photo for the response
    const productWithoutPhoto = { ...mockProduct };
    delete productWithoutPhoto.photo;

    // Mock the product model's findOne method
    productModel.findOne.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(productWithoutPhoto),
    });

    const response = await request(app)
      .get(`/api/v1/product/get-product/${mockProduct.slug}`)
      .expect(200);

    // Verify the response
    expect(response.body).toEqual({
      success: true,
      message: 'Single Product Fetched',
      product: productWithoutPhoto,
    });

    // Verify the query chain
    expect(productModel.findOne).toHaveBeenCalledWith({
      slug: mockProduct.slug,
    });
    expect(productModel.findOne().select).toHaveBeenCalledWith('-photo');
    expect(productModel.findOne().select().populate).toHaveBeenCalledWith(
      'category'
    );
  });

  /** 2. Product not found */
  test('should handle non-existent product slug', async () => {
    // Mock the product model's findOne method to return null
    productModel.findOne.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(null),
    });

    const response = await request(app)
      .get('/api/v1/product/get-product/non-existent-slug')
      .expect(200);

    // Verify empty product in response
    expect(response.body.product).toBeNull();
  });

  /** 3. Successful product photo retrieval */
  test('should return product photo when valid product ID is provided', async () => {
    // Mock the product model's findById method
    productModel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockProduct),
    });

    const response = await request(app)
      .get(`/api/v1/product/product-photo/${mockProduct._id}`)
      .expect(200);

    // Verify the response headers
    expect(response.headers['content-type']).toBe(
      mockProduct.photo.contentType
    );
    expect(response.body).toEqual(mockProduct.photo.data);

    // Verify the query chain
    expect(productModel.findById).toHaveBeenCalledWith(mockProduct._id);
    expect(productModel.findById().select).toHaveBeenCalledWith('photo');
  });

  /** 4. Product photo not found */
  test('should handle product with no photo', async () => {
    const productWithoutPhoto = { ...mockProduct, photo: null };

    // Mock the product model's findById method
    productModel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(productWithoutPhoto),
    });

    const response = await request(app)
      .get(`/api/v1/product/product-photo/${productWithoutPhoto._id}`)
      .expect(500);

    // Verify error response
    expect(response.body).toEqual({
      success: false,
      message: 'Error while getting photo',
      error: {},
    });
  });

  /** 5. Database error handling */
  test('should handle database errors gracefully', async () => {
    // Mock the product model's findOne method to throw an error
    productModel.findOne.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockRejectedValue(new Error('Database error')),
    });

    const response = await request(app)
      .get(`/api/v1/product/get-product/${mockProduct.slug}`)
      .expect(500);

    // Verify error response
    expect(response.body).toEqual({
      success: false,
      message: 'Error while getting single product',
      error: {},
    });
  });

  /** 6. Photo retrieval database error */
  test('should handle database errors when retrieving photo', async () => {
    // Mock the product model's findById method to throw an error
    productModel.findById.mockReturnValue({
      select: jest.fn().mockRejectedValue(new Error('Database error')),
    });

    const response = await request(app)
      .get(`/api/v1/product/product-photo/${mockProduct._id}`)
      .expect(500);

    // Verify error response
    expect(response.body).toEqual({
      success: false,
      message: 'Error while getting photo',
      error: {},
    });
  });
});
