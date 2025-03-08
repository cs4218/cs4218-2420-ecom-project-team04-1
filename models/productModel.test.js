import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import ProductModel from './productModel';
import CategoryModel from './categoryModel';

let mongoServer;

// Connect to the in-memory database before tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Clear all test data after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Disconnect and close the server after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Product Model Test Suite', () => {
  let testCategory;

  beforeEach(async () => {
    // Create a test category to use in product tests
    const category = new CategoryModel({ name: 'Test Category' });
    testCategory = await category.save();
  });

  it('should create & save product successfully', async () => {
    const validProduct = {
      name: 'Test Product',
      slug: 'test-product',
      description: 'Test Description',
      price: 99.99,
      category: testCategory._id,
      quantity: 100,
      shipping: true,
    };

    const product = new ProductModel(validProduct);
    const savedProduct = await product.save();

    expect(savedProduct._id).toBeDefined();
    expect(savedProduct.name).toBe(validProduct.name);
    expect(savedProduct.slug).toBe(validProduct.slug);
    expect(savedProduct.description).toBe(validProduct.description);
    expect(savedProduct.price).toBe(validProduct.price);
    expect(savedProduct.category.toString()).toBe(testCategory._id.toString());
    expect(savedProduct.quantity).toBe(validProduct.quantity);
    expect(savedProduct.shipping).toBe(validProduct.shipping);
    expect(savedProduct.createdAt).toBeDefined();
    expect(savedProduct.updatedAt).toBeDefined();
  });

  it('should fail to save product with missing required fields', async () => {
    const productWithMissingFields = new ProductModel({
      name: 'Test Product',
      // missing other required fields
    });

    let err;
    try {
      await productWithMissingFields.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.slug).toBeDefined();
    expect(err.errors.description).toBeDefined();
    expect(err.errors.price).toBeDefined();
    expect(err.errors.category).toBeDefined();
    expect(err.errors.quantity).toBeDefined();
  });

  it('should save product with photo', async () => {
    const productWithPhoto = {
      name: 'Test Product',
      slug: 'test-product',
      description: 'Test Description',
      price: 99.99,
      category: testCategory._id,
      quantity: 100,
      photo: {
        data: Buffer.from('test image data'),
        contentType: 'image/jpeg',
      },
    };

    const product = new ProductModel(productWithPhoto);
    const savedProduct = await product.save();

    expect(savedProduct.photo.data).toBeDefined();
    expect(savedProduct.photo.contentType).toBe('image/jpeg');
  });

  it('should save product without optional fields', async () => {
    const productWithoutOptional = {
      name: 'Test Product',
      slug: 'test-product',
      description: 'Test Description',
      price: 99.99,
      category: testCategory._id,
      quantity: 100,
      // shipping and photo are optional
    };

    const product = new ProductModel(productWithoutOptional);
    const savedProduct = await product.save();

    expect(savedProduct._id).toBeDefined();
    expect(savedProduct.shipping).toBeUndefined();
    expect(savedProduct.photo.data).toBeUndefined();
    expect(savedProduct.photo.contentType).toBeUndefined();
  });

  it('should populate category field', async () => {
    const product = new ProductModel({
      name: 'Test Product',
      slug: 'test-product',
      description: 'Test Description',
      price: 99.99,
      category: testCategory._id,
      quantity: 100,
    });

    await product.save();

    const populatedProduct = await ProductModel.findById(product._id).populate(
      'category'
    );

    expect(populatedProduct.category).toBeDefined();
    expect(populatedProduct.category.name).toBe('Test Category');
  });
});
