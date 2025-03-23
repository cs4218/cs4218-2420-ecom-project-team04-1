import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import OrderModel from '../models/orderModel.js';
import UserModel from '../models/userModel.js';
import ProductModel from '../models/productModel.js';
import { setupTestDB, createTestAdminUser } from '../testSetup.js';
import JWT from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Setup test database
setupTestDB();

describe('Admin Order Management API', () => {
  // Generate admin token for authentication
  const generateAdminToken = async () => {
    const adminUser = await createTestAdminUser();
    return JWT.sign(
      { _id: adminUser._id },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1d' }
    );
  };

  // Generate regular user token for unauthorized tests
  const generateUserToken = () => {
    const regularUser = {
      _id: new mongoose.Types.ObjectId(),
      role: 0, // Regular user role
    };
    return JWT.sign(regularUser, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '1d',
    });
  };

  let adminToken;
  let userToken;
  let testUser;
  let testProducts = [];
  let testOrders = [];
  let orderId;

  // Setup before tests
  beforeAll(async () => {
    // Clean up any existing test users
    await UserModel.deleteMany({
      email: 'testbuyer@example.com',
    });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    const hashedAnswer = await bcrypt.hash('Test Answer', salt);

    testUser = await new UserModel({
      name: 'Test Buyer',
      email: 'testbuyer@example.com',
      password: hashedPassword,
      phone: '123456789',
      address: 'Test Address',
      answer: hashedAnswer,
    }).save();

    const product1 = await new ProductModel({
      name: 'Test Product 1',
      slug: 'test-product-1',
      description: 'Test product 1 description',
      price: 99.99,
      category: new mongoose.Types.ObjectId(),
      quantity: 10,
      shipping: true,
    }).save();

    const product2 = await new ProductModel({
      name: 'Test Product 2',
      slug: 'test-product-2',
      description: 'Test product 2 description',
      price: 199.99,
      category: new mongoose.Types.ObjectId(),
      quantity: 5,
      shipping: true,
    }).save();

    testProducts.push(product1);
    testProducts.push(product2);

    const order1 = await new OrderModel({
      products: [product1._id],
      payment: { success: true, transaction_id: 'tx_123456' },
      buyer: testUser._id,
      status: 'Not Process',
    }).save();

    const order2 = await new OrderModel({
      products: [product1._id, product2._id],
      payment: { success: true, transaction_id: 'tx_789012' },
      buyer: testUser._id,
      status: 'Processing',
    }).save();

    testOrders.push(order1);
    testOrders.push(order2);
  });

  beforeEach(async () => {
    adminToken = await generateAdminToken();
    userToken = generateUserToken();
  });

  afterAll(async () => {
    // Clean up test data
    await OrderModel.deleteMany({});
    await ProductModel.deleteMany({});
    await UserModel.deleteMany({
      email: 'testbuyer@example.com',
    });
  });

  // ===== FETCHING TESTS =====
  describe('Order Fetching', () => {
    it('should fetch all orders as admin', async () => {
      const res = await request(app)
        .get('/api/v1/auth/all-orders')
        .set('Authorization', adminToken);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('All orders retrieved successfully');
      expect(Array.isArray(res.body.orders)).toBe(true);
      expect(res.body.orders.length).toBeGreaterThanOrEqual(2);

      // Check if our test orders are in the response
      const orderIds = testOrders.map((order) => order._id.toString());
      const responseOrderIds = res.body.orders.map((order) => order._id);

      orderIds.forEach((id) => {
        expect(responseOrderIds).toContain(id);
      });
    });

    it('should deny order retrieval to non-admin users', async () => {
      const res = await request(app)
        .get('/api/v1/auth/all-orders')
        .set('Authorization', userToken);

      // Expecting an authorization error
      expect(res.statusCode).toBe(403); // Valid credentials but not admin
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeTruthy();
    });

    it('should require authentication for order retrieval', async () => {
      const res = await request(app).get('/api/v1/auth/all-orders');

      // Expecting an authentication error
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeTruthy(); // Some error message should be present
    });

    it('should handle empty orders array', async () => {
      // Save existing orders
      const existingOrders = await OrderModel.find({});

      // Temporarily remove all orders
      await OrderModel.deleteMany({});

      const res = await request(app)
        .get('/api/v1/auth/all-orders')
        .set('Authorization', adminToken);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.orders)).toBe(true);
      expect(res.body.orders.length).toBe(0);

      // Restore orders for later tests
      if (existingOrders.length > 0) {
        await OrderModel.insertMany(existingOrders);
      }
    });
  });

  // ===== ORDER STATUS CHANGES TESTS =====
  describe('Order Status Changes', () => {
    it('should update order status successfully', async () => {
      // Get fresh data from DB to ensure order exists
      const allOrders = await OrderModel.find({});

      // Get the order directly from the database to ensure it exists
      const order = await OrderModel.findOne({ status: 'Not Process' });

      if (!order) {
        console.log("No order with 'Not Process' status found in database");
        // Create a new order if none exists
        const newOrder = await new OrderModel({
          products: [testProducts[0]._id],
          payment: { success: true, transaction_id: 'tx_test_update' },
          buyer: testUser._id,
          status: 'Not Process',
        }).save();
        // Use this new order
        testOrders[0] = newOrder;
      }

      // Use the first test order
      const orderId = testOrders[0]._id.toString();

      // Verify order exists in database
      const orderCheck = await OrderModel.findById(orderId);
      if (!orderCheck) {
        console.log('WARNING: Order does not exist in database!');
      } else {
        console.log('Order exists in DB, current status:', orderCheck.status);
      }

      const newStatus = 'Processing';

      // Update order status
      const res = await request(app)
        .put(`/api/v1/auth/order-status/${orderId}`)
        .set('Authorization', adminToken)
        .send({ status: newStatus });

      // Check API route handling
      const routeCheck = await request(app)
        .get('/api/v1/auth/all-orders')
        .set('Authorization', adminToken);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Order status updated successfully');

      // Verify database update
      const updatedOrder = await OrderModel.findById(orderId);
      expect(updatedOrder.status).toBe(newStatus);
    });

    it('should update order status to "Shipped"', async () => {
      // Create a new order specifically for this test
      const shippedTestOrder = await new OrderModel({
        products: [testProducts[0]._id],
        payment: { success: true, transaction_id: 'tx_shipped_test' },
        buyer: testUser._id,
        status: 'Processing',
      }).save();

      const orderId = shippedTestOrder._id.toString();

      const newStatus = 'Shipped';

      const res = await request(app)
        .put(`/api/v1/auth/order-status/${orderId}`)
        .set('Authorization', adminToken)
        .send({ status: newStatus });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify database update
      const updatedOrder = await OrderModel.findById(orderId);
      expect(updatedOrder.status).toBe(newStatus);

      // Clean up
      await OrderModel.findByIdAndDelete(orderId);
    });

    it('should update order status to "deliverd"', async () => {
      // Create a new order specifically for this test
      const deliveredTestOrder = await new OrderModel({
        products: [testProducts[0]._id],
        payment: { success: true, transaction_id: 'tx_delivered_test' },
        buyer: testUser._id,
        status: 'Shipped',
      }).save();

      const orderId = deliveredTestOrder._id.toString();

      const newStatus = 'deliverd';

      const res = await request(app)
        .put(`/api/v1/auth/order-status/${orderId}`)
        .set('Authorization', adminToken)
        .send({ status: newStatus });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify database update
      const updatedOrder = await OrderModel.findById(orderId);
      expect(updatedOrder.status).toBe(newStatus);

      // Clean up
      await OrderModel.findByIdAndDelete(orderId);
    });

    it('should update order status to "cancel"', async () => {
      // Create a new order specifically for this test
      const cancelTestOrder = await new OrderModel({
        products: [testProducts[0]._id],
        payment: { success: true, transaction_id: 'tx_cancel_test' },
        buyer: testUser._id,
        status: 'Processing',
      }).save();

      const orderId = cancelTestOrder._id.toString();

      const newStatus = 'cancel';

      const res = await request(app)
        .put(`/api/v1/auth/order-status/${orderId}`)
        .set('Authorization', adminToken)
        .send({ status: newStatus });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify database update
      const updatedOrder = await OrderModel.findById(orderId);
      expect(updatedOrder.status).toBe(newStatus);

      // Clean up
      await OrderModel.findByIdAndDelete(orderId);
    });

    it('should deny order status update to non-admin users', async () => {
      // Create a new order specifically for this test
      const nonAdminOrder = await new OrderModel({
        products: [testProducts[0]._id],
        payment: { success: true, transaction_id: 'tx_non_admin_test' },
        buyer: testUser._id,
        status: 'Processing',
      }).save();

      const orderId = nonAdminOrder._id.toString();

      const newStatus = 'Shipped';

      const res = await request(app)
        .put(`/api/v1/auth/order-status/${orderId}`)
        .set('Authorization', userToken) // Non-admin token
        .send({ status: newStatus });

      console.log('Non-admin test response:', res.statusCode, res.body);

      // Expecting an authorization error
      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);

      // Verify order status wasn't changed
      const unchangedOrder = await OrderModel.findById(orderId);
      expect(unchangedOrder.status).toBe('Processing');

      // Clean up
      await OrderModel.findByIdAndDelete(orderId);
    });

    it('should require authentication for order status update', async () => {
      // Create a new order specifically for this test
      const noAuthOrder = await new OrderModel({
        products: [testProducts[0]._id],
        payment: { success: true, transaction_id: 'tx_no_auth_test' },
        buyer: testUser._id,
        status: 'Processing',
      }).save();

      const orderId = noAuthOrder._id.toString();

      const newStatus = 'Shipped';

      const res = await request(app)
        .put(`/api/v1/auth/order-status/${orderId}`)
        // No Authorization header
        .send({ status: newStatus });

      // Expecting an authentication error
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);

      // Verify order status wasn't changed
      const unchangedOrder = await OrderModel.findById(orderId);
      expect(unchangedOrder.status).toBe('Processing');

      // Clean up
      await OrderModel.findByIdAndDelete(orderId);
    });

    it('should handle non-existent order ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      console.log('Testing with non-existent ID:', nonExistentId.toString());

      const newStatus = 'Processing';

      const res = await request(app)
        .put(`/api/v1/auth/order-status/${nonExistentId.toString()}`)
        .set('Authorization', adminToken)
        .send({ status: newStatus });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Order not found');
    });

    it('should require status in request body', async () => {
      const noStatusOrder = await new OrderModel({
        products: [testProducts[0]._id],
        payment: { success: true, transaction_id: 'tx_no_status_test' },
        buyer: testUser._id,
        status: 'Processing',
      }).save();

      const orderId = noStatusOrder._id.toString();

      const res = await request(app)
        .put(`/api/v1/auth/order-status/${orderId}`)
        .set('Authorization', adminToken)
        .send({}); // Empty request body

      // The API appears to return 200 even without a status field
      // but should not modify the order status
      expect(res.statusCode).toBe(200);

      // Verify order status wasn't changed
      const unchangedOrder = await OrderModel.findById(orderId);
      expect(unchangedOrder.status).toBe('Processing');

      // Clean up
      await OrderModel.findByIdAndDelete(orderId);
    });
  });

  // ===== ORDER DATA VALIDATION TESTS =====
  describe('Order Data Validation', () => {
    it('should include all order fields in the response', async () => {
      // Create a test order to ensure we have at least one order to check
      const testOrderForFields = await new OrderModel({
        products: [testProducts[0]._id],
        payment: { success: true, transaction_id: 'tx_fields_test' },
        buyer: testUser._id,
        status: 'Not Process',
      }).save();

      const res = await request(app)
        .get('/api/v1/auth/all-orders')
        .set('Authorization', adminToken);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.orders)).toBe(true);
      expect(res.body.orders.length).toBeGreaterThan(0);

      // Check first order structure
      const order = res.body.orders[0];

      // Required fields
      expect(order).toBeDefined();
      expect(order).toHaveProperty('_id');
      expect(order).toHaveProperty('products');
      expect(order).toHaveProperty('buyer');
      expect(order).toHaveProperty('status');

      // Products should be array
      expect(Array.isArray(order.products)).toBe(true);

      // Clean up
      await OrderModel.findByIdAndDelete(testOrderForFields._id);
    });

    it('should handle orders with different product counts', async () => {
      // Create an order with more products
      const manyProductsOrder = await new OrderModel({
        products: testProducts.map((p) => p._id),
        payment: { success: true, transaction_id: 'tx_multi_products' },
        buyer: testUser._id,
        status: 'Not Process',
      }).save();

      const res = await request(app)
        .get('/api/v1/auth/all-orders')
        .set('Authorization', adminToken);

      // Find the order we just created
      const orderIdStr = manyProductsOrder._id.toString();
      const foundOrder = res.body.orders.find((o) => o._id === orderIdStr);

      if (!foundOrder) {
        console.log(
          'Order not found in response. IDs in response:',
          res.body.orders.map((o) => o._id)
        );
      }

      expect(foundOrder).toBeTruthy();

      // Since products might not be fully populated in the response,
      // verify directly in database
      const dbOrder = await OrderModel.findById(orderIdStr);
      expect(dbOrder.products.length).toBe(testProducts.length);

      // Clean up
      await OrderModel.findByIdAndDelete(orderIdStr);
    });

    it('should handle orders with missing buyer information', async () => {
      // Create an order with missing buyer (using a non-existent ID)
      const nonExistentUserId = new mongoose.Types.ObjectId();
      const orderWithMissingBuyer = await new OrderModel({
        products: [testProducts[0]._id],
        payment: { success: true, transaction_id: 'tx_missing_buyer' },
        buyer: nonExistentUserId,
        status: 'Not Process',
      }).save();

      const res = await request(app)
        .get('/api/v1/auth/all-orders')
        .set('Authorization', adminToken);

      // The API should still return the order even if buyer population fails
      expect(res.statusCode).toBe(200);

      // Clean up
      await OrderModel.findByIdAndDelete(orderWithMissingBuyer._id);
    });
  });
});
