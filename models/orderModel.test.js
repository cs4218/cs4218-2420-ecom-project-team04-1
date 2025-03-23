import mongoose from 'mongoose';
import OrderModel from './orderModel';
import ProductModel from './productModel';
import UserModel from './userModel';
import CategoryModel from './categoryModel';
import { setupTestDB } from '../testSetup';
import bcrypt from 'bcrypt';

setupTestDB();

describe('Order Model Test Suite', () => {
  let testUser;
  let testProduct;
  let validOrder;

  beforeEach(async () => {
    // Create a test user with unique email
    const timestamp = Date.now();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    const hashedAnswer = await bcrypt.hash('blue', salt);

    const user = new UserModel({
      name: 'Test User',
      email: `test${timestamp}@example.com`,
      password: hashedPassword,
      phone: '1234567890',
      address: { street: '123 Test St' },
      answer: hashedAnswer,
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

    validOrder = {
      products: [testProduct._id],
      payment: { id: 'test_payment', amount: 99.99 },
      buyer: testUser._id,
      status: 'Not Process',
    };
  }, 20000); // Longer timeout for beforeEach since it creates multiple entities

  afterEach(async () => {
    // Clean up test data
    await OrderModel.deleteMany({});
    await ProductModel.deleteMany({});
    await CategoryModel.deleteMany({});
    await UserModel.deleteMany({
      email: { $regex: /^test/ },
    });
  });

  it('should create & save order successfully', async () => {
    const order = new OrderModel(validOrder);
    const savedOrder = await order.save();

    expect(savedOrder._id).toBeDefined();
    expect(savedOrder.products[0].toString()).toBe(testProduct._id.toString());
    expect(savedOrder.payment).toEqual(validOrder.payment);
    expect(savedOrder.buyer.toString()).toBe(testUser._id.toString());
    expect(savedOrder.status).toBe('Not Process');
    expect(savedOrder.createdAt).toBeDefined();
    expect(savedOrder.updatedAt).toBeDefined();
  }, 15000);

  it('should save order with default status', async () => {
    const orderWithoutStatus = {
      ...validOrder,
      status: undefined,
    };

    const order = new OrderModel(orderWithoutStatus);
    const savedOrder = await order.save();

    expect(savedOrder.status).toBe('Not Process');
  }, 15000);

  it('should fail to save order with invalid status', async () => {
    const orderWithInvalidStatus = {
      ...validOrder,
      status: 'Invalid Status',
    };

    const order = new OrderModel(orderWithInvalidStatus);
    await expect(order.save()).rejects.toThrow();
  }, 15000);

  it('should populate products and buyer', async () => {
    const order = new OrderModel(validOrder);
    await order.save();

    const populatedOrder = await OrderModel.findById(order._id)
      .populate('products')
      .populate('buyer')
      .exec();

    expect(populatedOrder.products[0].name).toBe('Test Product');
    expect(populatedOrder.buyer.name).toBe('Test User');
  }, 15000);

  it('should update order status', async () => {
    const order = new OrderModel(validOrder);
    const savedOrder = await order.save();

    savedOrder.status = 'Processing';
    const updatedOrder = await savedOrder.save();

    expect(updatedOrder.status).toBe('Processing');
  }, 15000);
}, 60000); // Higher timeout for the entire test suite
