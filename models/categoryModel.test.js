import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import CategoryModel from './categoryModel';

let mongoServer;

// Connect to the in-memory database before tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Ensure indexes are created
  await CategoryModel.createIndexes();
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

describe('Category Model Test Suite', () => {
  it('should create & save category successfully', async () => {
    const validCategory = {
      name: 'Electronics',
      slug: 'electronics',
    };

    const category = new CategoryModel(validCategory);
    const savedCategory = await category.save();

    expect(savedCategory._id).toBeDefined();
    expect(savedCategory.name).toBe(validCategory.name);
    expect(savedCategory.slug).toBe(validCategory.slug);
  });

  it('should fail to save category without name', async () => {
    const categoryWithoutName = new CategoryModel({
      slug: 'test-category',
    });

    let err;
    try {
      await categoryWithoutName.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.name).toBeDefined();
  });

  it('should fail to save category with duplicate name', async () => {
    // Save the first category
    const firstCategory = new CategoryModel({
      name: 'Test Category',
      slug: 'test-category',
    });
    await firstCategory.save();

    // Try to save another category with the same name
    const duplicateCategory = new CategoryModel({
      name: 'Test Category',
      slug: 'test-category-2',
    });

    let err;
    try {
      await duplicateCategory.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.code).toBe(11000); // MongoDB duplicate key error code
  });

  it('should convert slug to lowercase', async () => {
    const category = new CategoryModel({
      name: 'Test Category',
      slug: 'TEST-CATEGORY',
    });

    const savedCategory = await category.save();
    expect(savedCategory.slug).toBe('test-category');
  });

  it('should save category without slug', async () => {
    const category = new CategoryModel({
      name: 'Test Category',
    });

    const savedCategory = await category.save();
    expect(savedCategory.name).toBe('Test Category');
    expect(savedCategory.slug).toBeUndefined();
  });
});
