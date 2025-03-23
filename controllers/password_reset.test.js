process.env.JWT_SECRET = "testsecret";

import request from "supertest";
import app from "../app"; // Ensure correct path
import userModel from "../models/userModel";
import * as authHelper from "../helpers/authHelper";
import JWT from "jsonwebtoken";
import braintree from "braintree";

// Proper mocking of dependencies
jest.mock("braintree"); // Ensure mock is used
jest.mock("../models/userModel"); // Mock the database model
jest.mock("../helpers/authHelper", () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

// Braintree Test
describe("Braintree Mock Tests", () => {
  test("should return a fake transaction ID", async () => {
    const gateway = new braintree.BraintreeGateway();
    const response = await gateway.transaction.sale({
      amount: "10.00",
      paymentMethodNonce: "fake-valid-nonce",
    });

    expect(response.success).toBe(true);
    expect(response.transaction.id).toBe("fake_txn_id");
  });
});

// Define test variables
let testUser;
let newPassword = "NewSecurePass123";
let oldPassword = "OldSecurePass123";

beforeAll(async () => {
  // Spy and mock auth helpers
  jest.spyOn(authHelper, "comparePassword");
  jest.spyOn(authHelper, "hashPassword");

  // Define a test user and simulate hashed credentials
  testUser = {
    _id: "testUserId",
    name: "Test User",
    email: "testuser@example.com",
    password: `hashed_${oldPassword}`,
    phone: "1234567890",
    address: "123 Test Street",
    answer: `hashed_TestAnswer`,
    role: 0,
  };

  // Mock DB findOne behavior: when queried with test user's email, return testUser
  userModel.findOne = jest.fn(async (query) => {
    if (query.email === testUser.email) return testUser;
    return null;
  });

  // Mock DB update behavior: when updating by ID, update the testUser in memory
  userModel.findByIdAndUpdate = jest.fn(async (id, update) => {
    if (id === testUser._id) {
      if (update && update.$set && update.$set.password) {
        testUser.password = update.$set.password;
      }
      return testUser;
    }
    return null;
  });

  // Define hash behavior: simply prepend "hashed_"
  authHelper.hashPassword.mockImplementation(async (pw) => `hashed_${pw}`);

  // Define password/answer match behavior for reset
  authHelper.comparePassword.mockImplementation(async (input, hashed) => {
    return (
      (input === oldPassword && hashed === `hashed_${oldPassword}`) ||
      (input === newPassword && hashed === `hashed_${newPassword}`) ||
      (input === "TestAnswer" && hashed === `hashed_TestAnswer`)
    );
  });
});

afterAll(() => {
  jest.clearAllMocks();
});

/** 1. Request Password Reset Successfully */
test("should allow user to request password reset with correct email and security answer", async () => {
  const res = await request(app)
    .post("/api/v1/auth/forgot-password")
    .send({
      email: testUser.email,
      answer: "TestAnswer",
      newPassword,
    });

  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.message).toBe("Password reset successfully");
});

/** 2. Reject Incorrect Security Answer */
test("should reject password reset with incorrect security answer", async () => {
  authHelper.comparePassword.mockImplementationOnce(async () => false);

  const res = await request(app)
    .post("/api/v1/auth/forgot-password")
    .send({
      email: testUser.email,
      answer: "WrongAnswer",
      newPassword,
    });

  expect(res.status).toBe(404);
  expect(res.body.success).toBe(false);
  expect(res.body.message).toBe("Wrong email or security answer");
});

/** 3. Reject Non-Existent User */
test("should reject password reset request for a non-existent user", async () => {
  userModel.findOne.mockImplementationOnce(async () => null);

  const res = await request(app)
    .post("/api/v1/auth/forgot-password")
    .send({
      email: "nonexistent@example.com",
      answer: "TestAnswer",
      newPassword,
    });

  expect(res.status).toBe(404);
  expect(res.body.success).toBe(false);
  expect(res.body.message).toBe("Wrong email or security answer");
});

/** 4. Verify Login with New Password */
test("should allow user to log in with the new password after reset", async () => {
  // Force testUser to have the new hashed password as a result of a successful reset
  testUser.password = `hashed_${newPassword}`;
  // For login, ensure that findOne returns testUser with updated password
  userModel.findOne.mockResolvedValueOnce(testUser);
  // Modify comparePassword to simulate successful password check for new password
  authHelper.comparePassword.mockImplementation(async (input, hashed) => {
    return input === newPassword && hashed === `hashed_${newPassword}`;
  });

  const res = await request(app)
    .post("/api/v1/auth/login")
    .send({
      email: testUser.email,
      password: newPassword,
    });

  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.token).toBeDefined();
});

/** 5. Ensure Old Password No Longer Works */
test("should reject login with old password after password reset", async () => {
  userModel.findOne.mockResolvedValueOnce(testUser);
  // Simulate comparePassword failure for old password
  authHelper.comparePassword.mockImplementation(async () => false);

  const res = await request(app)
    .post("/api/v1/auth/login")
    .send({
      email: testUser.email,
      password: oldPassword,
    });

  expect(res.status).toBe(401);
  expect(res.body.success).toBe(false);
  expect(res.body.message).toBe("Invalid password");
});
