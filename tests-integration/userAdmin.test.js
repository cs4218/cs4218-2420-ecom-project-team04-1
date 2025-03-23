import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import UserModel from '../models/userModel.js';
import { setupTestDB, createTestAdminUser } from '../testSetup.js';
import JWT from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Setup test database
setupTestDB();

describe('Admin User Management API', () => {
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
  const generateUserToken = async () => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    const hashedAnswer = await bcrypt.hash('Test Answer', salt);
    const timestamp = Date.now();

    const regularUser = await new UserModel({
      name: 'Test Regular User',
      email: `testregular${timestamp}@example.com`,
      password: hashedPassword,
      phone: '1234567890',
      address: 'Test Address',
      answer: hashedAnswer,
      role: 0, // Regular user role
    }).save();

    return JWT.sign(
      { _id: regularUser._id },
      process.env.JWT_SECRET || 'test-secret',
      {
        expiresIn: '1d',
      }
    );
  };

  let adminToken;
  let userToken;
  let testUsers = [];

  beforeAll(async () => {
    // Clean up any existing test users
    await UserModel.deleteMany({
      email: { $regex: /^testuser/ },
    });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    const hashedAnswer1 = await bcrypt.hash('Test Answer', salt);
    const hashedAnswer2 = await bcrypt.hash('Test Answer 1', salt);
    const hashedAnswer3 = await bcrypt.hash('Test Answer 2', salt);

    const regularUser1 = await new UserModel({
      name: 'Test User 1',
      email: 'testuser1@example.com',
      password: hashedPassword,
      phone: '0987654321',
      address: 'Test User Address 1',
      answer: hashedAnswer2,
      role: 0, // Regular user
    }).save();

    const regularUser2 = await new UserModel({
      name: 'Test User 2',
      email: 'testuser2@example.com',
      password: hashedPassword,
      phone: '5555555555',
      address: 'Test User Address 2',
      answer: hashedAnswer3,
      role: 0, // Regular user
    }).save();

    testUsers.push(regularUser1);
    testUsers.push(regularUser2);
  });

  beforeEach(async () => {
    adminToken = await generateAdminToken();
    userToken = await generateUserToken();
  });

  afterAll(async () => {
    // Clean up test users
    await UserModel.deleteMany({
      email: { $regex: /^test/ },
    });
  });

  // ===== USER RETRIEVAL TESTS =====
  describe('User Retrieval', () => {
    it('should fetch all users as admin', async () => {
      // Verify users exist in the database before test
      const dbUsers = await UserModel.find({});

      const res = await request(app)
        .get('/api/v1/auth/users')
        .set('Authorization', adminToken);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(testUsers.length);

      // Check if test users are in the response
      const testUserEmails = testUsers.map((user) => user.email);
      const responseUserEmails = res.body.map((user) => user.email);

      testUserEmails.forEach((email) => {
        expect(responseUserEmails).toContain(email);
      });

      // Verify user fields - should not include password
      const firstUser = res.body[0];
      expect(firstUser).toHaveProperty('_id');
      expect(firstUser).toHaveProperty('name');
      expect(firstUser).toHaveProperty('email');
      expect(firstUser).toHaveProperty('phone');
      expect(firstUser).toHaveProperty('address');
      expect(firstUser).toHaveProperty('role');
      expect(firstUser).toHaveProperty('createdAt');
      expect(firstUser).not.toHaveProperty('password');
    });

    it('should deny user retrieval to non-admin users', async () => {
      const res = await request(app)
        .get('/api/v1/auth/users')
        .set('Authorization', userToken);

      // Expecting an authorization error
      expect(res.statusCode).toBe(403); // Valid credentials but not admin
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeTruthy();
    });

    it('should require authentication for user retrieval', async () => {
      const res = await request(app).get('/api/v1/auth/users');

      // Expecting an authentication error
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeTruthy(); // Some error message should be present
    });

    // IMPORTANT: This test should be at the end since it manipulates the database
    it('should handle empty users array', async () => {
      // Create a snapshot of test users for restoration
      const initialUserCount = await UserModel.countDocuments({});
      const existingUsers = await UserModel.find({});

      try {
        // Temporarily remove all users except admin
        await UserModel.deleteMany({
          email: { $ne: 'testadmin@example.com' },
        });

        const emptyRes = await request(app)
          .get('/api/v1/auth/users')
          .set('Authorization', adminToken);

        expect(emptyRes.statusCode).toBe(200);
        expect(Array.isArray(emptyRes.body)).toBe(true);
        expect(emptyRes.body.length).toBe(1); // Should only contain admin user
      } finally {
        // Always restore users, even if the test fails
        if (existingUsers.length > 0) {
          const usersToRestore = existingUsers.map((user) => {
            const userObj = user.toObject();
            return userObj;
          });
          await UserModel.deleteMany({}); // Clear all users
          await UserModel.insertMany(usersToRestore);

          // Verify restoration
          const restoredCount = await UserModel.countDocuments({});
          expect(restoredCount).toBe(initialUserCount);
        }
      }
    });
  });

  // ===== DATA VALIDATION TESTS =====
  describe('User Data Validation', () => {
    it('should include all user fields except password', async () => {
      // Verify users exist in the database
      const dbUsers = await UserModel.find({});

      // If no users, recreate test users
      if (dbUsers.length === 0) {
        const hashedPassword = await bcrypt.hash('password123', 10);

        await new UserModel({
          name: 'Test Admin',
          email: 'testadmin@example.com',
          password: hashedPassword,
          phone: '1234567890',
          address: 'Test Admin Address',
          answer: 'Test Answer',
          role: 1, // Admin
        }).save();
      }

      const res = await request(app)
        .get('/api/v1/auth/users')
        .set('Authorization', adminToken);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      // Check first user structure
      const user = res.body[0];

      // Required fields
      expect(user).toBeDefined();
      expect(user).toHaveProperty('_id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('phone');
      expect(user).toHaveProperty('address');
      expect(user).toHaveProperty('role');

      // Should not include password
      expect(user).not.toHaveProperty('password');
    });

    it('should handle special characters in user data', async () => {
      // Create a user with special characters
      const specialUser = await new UserModel({
        name: 'Special User !@#$%^&*()',
        email: 'special.user@example.com',
        password: await bcrypt.hash('password123', 10),
        phone: '+1-555-123-4567',
        address: 'Address with special chars: #123 Bldg. 4, Floor 5!',
        answer: 'Special @ns*er',
        role: 0,
      }).save();

      const res = await request(app)
        .get('/api/v1/auth/users')
        .set('Authorization', adminToken);

      // Find the special user in response
      const foundUser = res.body.find(
        (u) => u.email === 'special.user@example.com'
      );

      expect(foundUser).toBeDefined();
      expect(foundUser.name).toBe('Special User !@#$%^&*()');
      expect(foundUser.phone).toBe('+1-555-123-4567');

      // Clean up
      await UserModel.findByIdAndDelete(specialUser._id);
    });

    it('should handle users with empty non-required fields', async () => {
      // The model requires all fields, so we'll test with minimal valid data
      const minimalUser = await new UserModel({
        name: 'Minimal User',
        email: 'minimal@example.com',
        password: await bcrypt.hash('password123', 10),
        phone: '1234567890',
        address: '', // Empty but still provided
        answer: 'Answer',
        role: 0,
      }).save();

      const res = await request(app)
        .get('/api/v1/auth/users')
        .set('Authorization', adminToken);

      // Find the minimal user in response
      const foundUser = res.body.find((u) => u.email === 'minimal@example.com');

      expect(foundUser).toBeDefined();
      expect(foundUser.address).toBe('');

      // Clean up
      await UserModel.findByIdAndDelete(minimalUser._id);
    });
  });

  // ===== ADMIN ACCESS TESTS =====
  describe('Admin Authorization', () => {
    it('should verify admin auth endpoint', async () => {
      const res = await request(app)
        .get('/api/v1/auth/admin-auth')
        .set('Authorization', adminToken);

      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('should deny admin access to regular users', async () => {
      const res = await request(app)
        .get('/api/v1/auth/admin-auth')
        .set('Authorization', userToken);

      expect(res.statusCode).toBe(403);
      expect(res.body.ok).toBeFalsy();
    });
  });
});
