import request from "supertest";
import app from "../app.js";
import userModel from "../models/userModel.js";
import * as authHelper from "../helpers/authHelper.js";
import braintree from "braintree";

process.env.JWT_SECRET = "testsecret";

jest.mock("braintree");
jest.mock("../models/userModel");
jest.mock("../helpers/authHelper.js", () => ({
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

// Test Variables
let registeredUser;
let userToken;
const userEmail = "testuser@example.com";
const userPassword = "SecurePass123";

beforeAll(async () => {
  // Setup proper mock implementations
  authHelper.hashPassword.mockImplementation(async (pw) => "hashed_" + pw);
  authHelper.comparePassword.mockImplementation(async (pw, hashed) => hashed === "hashed_" + pw);

  registeredUser = {
    _id: "mockedUserId",
    name: "Test User",
    email: userEmail,
    password: "hashed_" + userPassword,
    phone: "1234567890",
    address: "123 Test Street",
    answer: "hashed_testAnswer",
    role: 0,
  };

  userModel.findOne.mockResolvedValue(null);
  userModel.create.mockResolvedValue(registeredUser);

  const registerRes = await request(app).post("/api/v1/auth/register").send({
    name: "Test User",
    email: userEmail,
    password: userPassword,
    phone: "1234567890",
    address: "123 Test Street",
    answer: "testAnswer",
  });

  expect(registerRes.status).toBe(201);
});

afterAll(() => {
  jest.clearAllMocks();
});

// Registration Tests

/** 1️. Register another user with valid input */
test("should successfully register a user with valid input", async () => {
  userModel.findOne.mockResolvedValueOnce(null);
  userModel.create.mockResolvedValueOnce({
    _id: "anotherMockedUserId",
    name: "Another Test User",
    email: "anotheruser@example.com",
  });

  const res = await request(app).post("/api/v1/auth/register").send({
    name: "Another Test User",
    email: "anotheruser@example.com",
    password: "AnotherPass123",
    phone: "9876543210",
    address: "456 Test Street",
    answer: "anotherAnswer",
  });

  expect(res.status).toBe(201);
  expect(res.body.success).toBe(true);
  expect(res.body.message).toBe("User registered successfully");
});

/** 2️. Duplicate email registration */
test("should return 409 when registering with an already existing email", async () => {
  userModel.findOne.mockResolvedValueOnce(registeredUser);

  const res = await request(app).post("/api/v1/auth/register").send({
    name: "Duplicate User",
    email: userEmail,
    password: "AnotherPass123",
    phone: "9876543210",
    address: "456 New Street",
    answer: "testAnswer",
  });

  expect(res.status).toBe(409);
  expect(res.body.success).toBe(false);
  expect(res.body.message).toBe("Email already registered. Please log in.");
});

/** 3️. Invalid email format registration */
test("should return 400 for invalid email format", async () => {
  const res = await request(app).post("/api/v1/auth/register").send({
    name: "Invalid Email User",
    email: "invalid-email",
    password: "SecurePass123",
    phone: "1234567890",
    address: "123 Invalid Street",
    answer: "testAnswer",
  });

  expect(res.status).toBe(400);
  expect(res.body.success).toBe(false);
  expect(res.body.message).toBe("Invalid Email Format");
});

/** 4️. Missing required fields during registration */
test("should return 400 for missing required fields", async () => {
  const res = await request(app).post("/api/v1/auth/register").send({
    name: "User Without Email",
    password: "NoEmailPass123",
    phone: "1234567890",
    address: "No Email Street",
    answer: "testAnswer",
  });

  expect(res.status).toBe(400);
  expect(res.body.success).toBe(false);
  expect(res.body.message).toBe("Email is required");
});

// Login Tests

/** 5️. Successful login */
test("should successfully login with correct credentials", async () => {
  userModel.findOne.mockResolvedValueOnce(registeredUser);
  authHelper.comparePassword.mockResolvedValueOnce(true);

  const res = await request(app).post("/api/v1/auth/login").send({
    email: userEmail,
    password: userPassword,
  });

  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.token).toBeDefined();
  userToken = res.body.token;
});

/** 6️. Incorrect password */
test("should return 401 for incorrect password", async () => {
  userModel.findOne.mockResolvedValueOnce(registeredUser);
  authHelper.comparePassword.mockResolvedValueOnce(false);

  const res = await request(app).post("/api/v1/auth/login").send({
    email: userEmail,
    password: "WrongPass456",
  });

  expect(res.status).toBe(401);
  expect(res.body.success).toBe(false);
  expect(res.body.message).toBe("Invalid password");
});

/** 7️. Login with non-existent email */
test("should return 404 for non-existent email", async () => {
  userModel.findOne.mockResolvedValueOnce(null);

  const res = await request(app).post("/api/v1/auth/login").send({
    email: "nonexistent@example.com",
    password: "SomePass123",
  });

  expect(res.status).toBe(404);
  expect(res.body.success).toBe(false);
  expect(res.body.message).toBe("Email is not registered");
});

// Token Verification

/** 8️. JWT contains correct user ID */
test("should return a JWT token containing user ID", async () => {
  userModel.findOne.mockResolvedValueOnce(registeredUser);
  authHelper.comparePassword.mockResolvedValueOnce(true);

  const res = await request(app).post("/api/v1/auth/login").send({
    email: userEmail,
    password: userPassword,
  });

  expect(res.status).toBe(200);
  expect(res.body.token).toBeDefined();

  const decodedToken = JSON.parse(
    Buffer.from(res.body.token.split(".")[1], "base64").toString()
  );
  expect(decodedToken).toHaveProperty("_id", registeredUser._id);
});
