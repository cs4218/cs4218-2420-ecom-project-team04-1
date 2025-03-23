import request from "supertest";
import app from "../app"; // Ensure correct path
import userModel from "../models/userModel";
import { hashPassword, comparePassword } from "../helpers/authHelper";
import JWT from "jsonwebtoken";
import braintree from "braintree";

jest.mock("braintree");
jest.mock("../models/userModel");
jest.mock("../helpers/authHelper");

// Mock JWT Secret
process.env.JWT_SECRET = "testsecret";

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

// Variables for tokens
let validToken, adminToken, deletedUserToken, expiredToken;
const testUserId = "testUserId123";
const adminUserId = "adminUserId123";
const deletedUserId = "deletedUserId123";

beforeAll(async () => {
  // Mock hashPassword
  hashPassword.mockResolvedValue("hashedSecurePass123");

  // Mock comparePassword
  comparePassword.mockImplementation(async (inputPass, storedPass) => inputPass === "SecurePass123");

  // Mock userModel.create
  userModel.create.mockImplementation(async (userData) => ({
    _id: userData.email === "admin@example.com" ? adminUserId :
         userData.email === "deleted@example.com" ? deletedUserId :
         testUserId,
    ...userData,
    role: userData.email === "admin@example.com" ? 1 : 0,
    password: "hashedSecurePass123"
  }));

  // Mock userModel.findOne
  userModel.findOne.mockImplementation(async ({ email }) => {
    if (email === "deleted@example.com") {
      return { _id: deletedUserId, role: 0, password: "hashedSecurePass123" };
    } else if (email === "admin@example.com") {
      return { _id: adminUserId, role: 1, password: "hashedSecurePass123" };
    } else if (email === "authtest@example.com") {
      return { _id: testUserId, role: 0, password: "hashedSecurePass123" };
    }
    return null;
  });

  // Mock findOneAndUpdate
  userModel.findOneAndUpdate.mockResolvedValue({ _id: adminUserId, role: 1 });

  // Mock findById (✅ This Fixes the Issue)
  userModel.findById.mockImplementation(async (id) => {
    if (id === adminUserId) return { _id: adminUserId, role: 1 };
    if (id === testUserId) return { _id: testUserId, role: 0 };
    return null;
  });

  // Mock findByIdAndDelete
  userModel.findByIdAndDelete.mockResolvedValue({});

  // Register and Login Test User
  await request(app).post("/api/v1/auth/register").send({
    name: "Auth Test User",
    email: "authtest@example.com",
    password: "SecurePass123",
    phone: "1234567890",
    address: "123 Test Street",
    answer: "Test Answer",
  });

  const userLoginRes = await request(app).post("/api/v1/auth/login").send({
    email: "authtest@example.com",
    password: "SecurePass123",
  });
  validToken = userLoginRes.body.token;

  // Register and Login Admin User
  await request(app).post("/api/v1/auth/register").send({
    name: "Admin User",
    email: "admin@example.com",
    password: "SecurePass123",
    phone: "9876543210",
    address: "Admin Office",
    answer: "Admin Answer",
  });

  const adminLoginRes = await request(app).post("/api/v1/auth/login").send({
    email: "admin@example.com",
    password: "SecurePass123",
  });
  adminToken = adminLoginRes.body.token;

  // Register Deleted User
  await request(app).post("/api/v1/auth/register").send({
    name: "Deleted User",
    email: "deleted@example.com",
    password: "SecurePass123",
    phone: "9876543210",
    address: "456 Fake St",
    answer: "Deleted Answer",
  });

  deletedUserToken = JWT.sign({ _id: deletedUserId }, process.env.JWT_SECRET, { expiresIn: "7d" });

  // Generate Expired Token
  expiredToken = JWT.sign({ _id: testUserId }, process.env.JWT_SECRET, { expiresIn: "-1s" });
});

afterAll(() => {
  jest.clearAllMocks();
});

/** 1️⃣ Verify Access with Valid Token */
test("should allow access to protected route with valid token", async () => {
  const res = await request(app)
    .get("/api/v1/auth/test")
    .set("Authorization", `${adminToken}`);

  expect(res.status).toBe(200);
  expect(res.body.message).toBe("Protected Routes");
});

/** 2️⃣ Verify Access with Missing Token */
test("should deny access to protected route without token", async () => {
  const res = await request(app).get("/api/v1/auth/user-auth");
  expect(res.status).toBe(401);
});

/** 3️⃣ Verify Access with Invalid Token */
test("should deny access with invalid token", async () => {
  const res = await request(app)
    .get("/api/v1/auth/user-auth")
    .set("Authorization", "Invalid.Token.String");
  expect(res.status).toBe(401);
});

/** 4️⃣ Verify Access with Expired Token */
test("should deny access with expired token", async () => {
  const res = await request(app)
    .get("/api/v1/auth/user-auth")
    .set("Authorization", expiredToken);
  expect(res.status).toBe(401);
});

/** 5️⃣ Verify Access with Deleted User Token */
test("should deny access if user no longer exists", async () => {
  userModel.findById.mockResolvedValueOnce(null);
  const res = await request(app)
    .get("/api/v1/auth/user-auth")
    .set("Authorization", deletedUserToken);
  expect(res.status).toBe(401);
});

/** 6️⃣ Allow Admin Route with Admin Token */
test("should allow admin route access with admin token", async () => {
  const res = await request(app)
    .get("/api/v1/auth/admin-auth")
    .set("Authorization", adminToken);
  expect(res.status).toBe(200);
});

/** 7️⃣ Deny Admin Route with Non-Admin Token */
test("should deny admin route access with user token", async () => {
  const res = await request(app)
    .get("/api/v1/auth/admin-auth")
    .set("Authorization", validToken);
  expect(res.status).toBe(403);
});

/** 8️⃣ Deny Admin Route Without Token */
test("should deny admin route without token", async () => {
  const res = await request(app).get("/api/v1/auth/admin-auth");
  expect(res.status).toBe(401);
});

/** 9️⃣ Deny Admin Route with Invalid Token */
test("should deny admin route with invalid token", async () => {
  const res = await request(app)
    .get("/api/v1/auth/admin-auth")
    .set("Authorization", "Invalid.Token");
  expect(res.status).toBe(401);
});
