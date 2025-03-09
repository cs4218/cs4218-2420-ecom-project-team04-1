import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import OrderModel from './orderModel';
import ProductModel from './productModel';
import UserModel from './userModel';
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

describe('Order Model Test Suite', () => {
  let testUser;
  let testProduct;

  beforeEach(async () => {
    // Create a test user
    const user = new UserModel({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      phone: '1234567890',
      address: { street: '123 Test St' },
      answer: 'blue',
    });
    testUser = await user.save();

    // Create a test category
    const category = new CategoryModel({ name: 'Test Category' });
    const testCategory = await category.save();

    // Create a test product
    const product = new ProductModel({
      name: 'Test Product',
      slug: 'test-product',
      description: 'Test Description',
      price: 99.99,
      category: testCategory._id,
      quantity: 100,
    });
    testProduct = await product.save();
  });

  it('should create & save order successfully', async () => {
    const validOrder = {
      products: [testProduct._id],
      payment: { id: 'test_payment', amount: 99.99 },
      buyer: testUser._id,
      status: 'Not Process',
    };

    const order = new OrderModel(validOrder);
    const savedOrder = await order.save();

    expect(savedOrder._id).toBeDefined();
    expect(savedOrder.products[0].toString()).toBe(testProduct._id.toString());
    expect(savedOrder.payment).toEqual(validOrder.payment);
    expect(savedOrder.buyer.toString()).toBe(testUser._id.toString());
    expect(savedOrder.status).toBe('Not Process');
    expect(savedOrder.createdAt).toBeDefined();
    expect(savedOrder.updatedAt).toBeDefined();
  });

  it('should save order with default status', async () => {
    const orderWithoutStatus = {
      products: [testProduct._id],
      payment: { id: 'test_payment', amount: 99.99 },
      buyer: testUser._id,
    };

    const order = new OrderModel(orderWithoutStatus);
    const savedOrder = await order.save();

    expect(savedOrder.status).toBe('Not Process');
  });

  it('should fail to save order with invalid status', async () => {
    const orderWithInvalidStatus = {
      products: [testProduct._id],
      payment: { id: 'test_payment', amount: 99.99 },
      buyer: testUser._id,
      status: 'Invalid Status',
    };

    let err;
    try {
      const order = new OrderModel(orderWithInvalidStatus);
      await order.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors.status).toBeDefined();
  });

  it('should populate products and buyer', async () => {
    const order = new OrderModel({
      products: [testProduct._id],
      payment: { id: 'test_payment', amount: 99.99 },
      buyer: testUser._id,
    });

    await order.save();

    const populatedOrder = await OrderModel.findById(order._id)
      .populate('products')
      .populate('buyer');

    expect(populatedOrder.products[0].name).toBe('Test Product');
    expect(populatedOrder.buyer.name).toBe('Test User');
  });

  it('should update order status', async () => {
    const order = new OrderModel({
      products: [testProduct._id],
      payment: { id: 'test_payment', amount: 99.99 },
      buyer: testUser._id,
    });

    const savedOrder = await order.save();
    savedOrder.status = 'Processing';
    const updatedOrder = await savedOrder.save();

    expect(updatedOrder.status).toBe('Processing');
  });
});
