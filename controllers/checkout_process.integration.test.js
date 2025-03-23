import request from 'supertest';
import app from '../app.js';
import orderModel from '../models/orderModel.js';
import userModel from '../models/userModel.js';
import braintree from 'braintree';
import JWT from 'jsonwebtoken';

// Mock the models and braintree
jest.mock('../models/orderModel');
jest.mock('../models/userModel');
jest.mock('braintree');

describe('Checkout Integration Tests', () => {
  let userToken;
  const mockUser = {
    _id: 'user123',
    name: 'Test User',
    email: 'test@example.com',
  };

  const mockCart = [
    {
      _id: 'product1',
      name: 'Laptop',
      price: 1499.99,
      description: 'A powerful laptop',
    },
    {
      _id: 'product2',
      name: 'Mouse',
      price: 29.99,
      description: 'A wireless mouse',
    },
  ];

  const mockToken = 'fake_client_token';
  const mockNonce = 'fake_payment_nonce';

  beforeAll(async () => {
    // Setup fake token
    userToken = JWT.sign(
      { _id: mockUser._id },
      process.env.JWT_SECRET || 'testsecret'
    );

    // Mock JWT.verify
    jest.spyOn(JWT, 'verify').mockImplementation((token) => {
      if (!token) throw new Error('No token provided');

      // Handle Bearer token format
      const tokenParts = token.split(' ');
      const actualToken = tokenParts.length === 2 ? tokenParts[1] : token;

      if (actualToken === userToken) return { _id: mockUser._id };
      if (actualToken === 'invalid-token') throw new Error('Invalid token');
      throw new Error('Invalid token');
    });

    // Mock user model
    userModel.findById = jest.fn(async (id) => {
      if (id === mockUser._id) return mockUser;
      return null;
    });

    // Setup Braintree mock
    const mockGateway = new braintree.BraintreeGateway();
    mockGateway.clientToken.generate = jest
      .fn()
      .mockImplementation((params, callback) => {
        callback(null, { clientToken: mockToken });
      });
    mockGateway.transaction.sale = jest
      .fn()
      .mockImplementation((params, callback) => {
        if (params.paymentMethodNonce === 'invalid-nonce') {
          callback(new Error('Payment failed'), null);
        } else {
          callback(null, {
            success: true,
            transaction: { id: 'fake_txn_id' },
          });
        }
      });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** 1. Get Braintree Token */
  test('should get Braintree token successfully', async () => {
    const response = await request(app)
      .get('/api/v1/product/braintree/token')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    // Verify response
    expect(response.body).toEqual({
      clientToken: mockToken,
    });

    // Verify Braintree was called correctly
    const mockGateway = new braintree.BraintreeGateway();
    expect(mockGateway.clientToken.generate).toHaveBeenCalledWith(
      {},
      expect.any(Function)
    );
  });

  /** 2. Handle Braintree Token Error */
  test('should handle Braintree token generation error', async () => {
    // Mock token generation error
    const mockGateway = new braintree.BraintreeGateway();
    mockGateway.clientToken.generate = jest
      .fn()
      .mockImplementation((params, callback) => {
        callback(new Error('Token generation failed'), null);
      });

    const response = await request(app)
      .get('/api/v1/product/braintree/token')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(500);

    // Verify error response
    expect(response.body).toEqual({ error: 'Failed to generate token' });
  });

  /** 3. Process Payment Successfully */
  test('should process payment and create order successfully', async () => {
    // Create a spy for the save method
    const saveSpy = jest.fn().mockResolvedValue({
      products: mockCart,
      payment: {
        success: true,
        transaction: { id: 'fake_txn_id' },
      },
      buyer: mockUser._id,
    });

    // Mock the order model constructor to properly handle the data
    orderModel.mockImplementation((data) => ({
      ...data,
      save: saveSpy,
    }));

    // Mock the Braintree transaction
    const mockGateway = new braintree.BraintreeGateway();
    mockGateway.transaction.sale = jest
      .fn()
      .mockImplementation((params, callback) => {
        callback(null, {
          success: true,
          transaction: { id: 'fake_txn_id' },
        });
      });

    const response = await request(app)
      .post('/api/v1/product/braintree/payment')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        nonce: mockNonce,
        cart: mockCart,
      })
      .expect(200);

    // Verify response
    expect(response.body).toEqual({
      ok: true,
    });

    // Verify order was created with correct data
    const orderInstance = orderModel({
      products: mockCart,
      payment: {
        success: true,
        transaction: { id: 'fake_txn_id' },
      },
      buyer: mockUser._id,
    });
    expect(orderInstance.save).toHaveBeenCalled();
  }, 10000);

  /** 4. Handle Payment Failure */
  test('should handle payment failure gracefully', async () => {
    // Mock the Braintree transaction to fail
    const mockGateway = new braintree.BraintreeGateway();
    mockGateway.transaction.sale = jest
      .fn()
      .mockImplementation((params, callback) => {
        callback(new Error('Payment failed'), null);
      });

    const response = await request(app)
      .post('/api/v1/product/braintree/payment')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        nonce: 'invalid-nonce',
        cart: mockCart,
      })
      .expect(500);

    // Verify error response
    expect(response.body).toEqual({ error: 'Payment processing failed' });

    // Verify no order was created
    const orderInstance = orderModel();
    expect(orderInstance.save).not.toHaveBeenCalled();
  });

  /** 5. Calculate Total Correctly */
  test('should calculate total price correctly', async () => {
    // Create a spy for the save method
    const saveSpy = jest.fn().mockResolvedValue({
      _id: 'order123',
      products: mockCart,
      payment: {
        success: true,
        transaction: { id: 'fake_txn_id' },
      },
      buyer: mockUser._id,
    });

    // Mock the order model constructor
    orderModel.mockImplementation(() => ({
      save: saveSpy,
    }));

    // Mock the Braintree transaction
    const mockGateway = new braintree.BraintreeGateway();
    mockGateway.transaction.sale = jest
      .fn()
      .mockImplementation((params, callback) => {
        callback(null, {
          success: true,
          transaction: { id: 'fake_txn_id' },
        });
      });

    const response = await request(app)
      .post('/api/v1/product/braintree/payment')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        nonce: mockNonce,
        cart: mockCart,
      })
      .expect(200);

    // Verify total calculation
    const expectedTotal = mockCart.reduce((sum, item) => sum + item.price, 0);
    expect(mockGateway.transaction.sale).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: expectedTotal,
        paymentMethodNonce: mockNonce,
        options: {
          submitForSettlement: true,
        },
      }),
      expect.any(Function)
    );
  });

  /** 6. Handle Invalid Cart */
  test('should handle empty cart gracefully', async () => {
    const response = await request(app)
      .post('/api/v1/product/braintree/payment')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        nonce: mockNonce,
        cart: [],
      })
      .expect(500);

    // Verify error response
    expect(response.body).toEqual({
      error: 'Cart is empty',
    });

    // Verify no transaction was attempted
    const mockGateway = new braintree.BraintreeGateway();
    expect(mockGateway.transaction.sale).not.toHaveBeenCalled();
  });

  /** 7. Handle Invalid Token */
  test('should handle invalid authentication token', async () => {
    const response = await request(app)
      .post('/api/v1/product/braintree/payment')
      .set('Authorization', 'Bearer invalid-token')
      .send({
        nonce: mockNonce,
        cart: mockCart,
      })
      .expect(401);

    // Verify error response
    expect(response.body).toEqual({
      success: false,
      message: 'Unauthorized: Invalid or expired token',
    });

    // Verify no transaction was attempted
    const mockGateway = new braintree.BraintreeGateway();
    expect(mockGateway.transaction.sale).not.toHaveBeenCalled();
  });

  /** 8. Handle Missing Authorization Header */
  test('should handle missing authorization header', async () => {
    const response = await request(app)
      .post('/api/v1/product/braintree/payment')
      .send({
        nonce: mockNonce,
        cart: mockCart,
      })
      .expect(401);

    // Verify error response
    expect(response.body).toEqual({
      success: false,
      message: 'Unauthorized: No token provided',
    });

    // Verify no transaction was attempted
    const mockGateway = new braintree.BraintreeGateway();
    expect(mockGateway.transaction.sale).not.toHaveBeenCalled();
  });
});
