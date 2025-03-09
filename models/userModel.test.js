import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import UserModel from './userModel';

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

describe('User Model Test Suite', () => {
  it('should create & save user successfully', async () => {
    const validUser = {
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: 'password123',
      phone: '1234567890',
      address: {
        street: '123 Main St',
        city: 'Test City',
        country: 'Test Country',
      },
      answer: 'blue',
      role: 0,
    };

    const user = new UserModel(validUser);
    const savedUser = await user.save();

    // Object Id should be defined when successfully saved to MongoDB
    expect(savedUser._id).toBeDefined();
    expect(savedUser.name).toBe(validUser.name);
    expect(savedUser.email).toBe(validUser.email);
    expect(savedUser.password).toBe(validUser.password);
    expect(savedUser.phone).toBe(validUser.phone);
    expect(savedUser.address).toEqual(validUser.address);
    expect(savedUser.answer).toBe(validUser.answer);
    expect(savedUser.role).toBe(validUser.role);
    expect(savedUser.createdAt).toBeDefined();
    expect(savedUser.updatedAt).toBeDefined();
  });

  it('should fail to save user with missing required fields', async () => {
    const userWithMissingFields = new UserModel({
      name: 'John Doe',
      // missing other required fields
    });

    let err;
    try {
      await userWithMissingFields.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.email).toBeDefined();
    expect(err.errors.password).toBeDefined();
    expect(err.errors.phone).toBeDefined();
    expect(err.errors.address).toBeDefined();
    expect(err.errors.answer).toBeDefined();
  });

  it('should fail to save user with duplicate email', async () => {
    const userData = {
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: 'password123',
      phone: '1234567890',
      address: {
        street: '123 Main St',
      },
      answer: 'blue',
      role: 0,
    };

    // Save the first user
    const firstUser = new UserModel(userData);
    await firstUser.save();

    // Try to save another user with the same email
    const duplicateUser = new UserModel(userData);

    let err;
    try {
      await duplicateUser.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.code).toBe(11000); // MongoDB duplicate key error code
  });

  it('should save user with default role value', async () => {
    const userWithoutRole = {
      name: 'Jane Doe',
      email: 'janedoe@example.com',
      password: 'password123',
      phone: '1234567890',
      address: {
        street: '123 Main St',
      },
      answer: 'blue',
      // role is not specified
    };

    const user = new UserModel(userWithoutRole);
    const savedUser = await user.save();

    expect(savedUser.role).toBe(0); // default value should be 0
  });

  it('should trim whitespace from name field', async () => {
    const userWithWhitespace = {
      name: '  John Doe  ',
      email: 'johndoe@example.com',
      password: 'password123',
      phone: '1234567890',
      address: {
        street: '123 Main St',
      },
      answer: 'blue',
    };

    const user = new UserModel(userWithWhitespace);
    const savedUser = await user.save();

    expect(savedUser.name).toBe('John Doe'); // whitespace should be trimmed
  });

  it('should include timestamps in the document', async () => {
    const userData = {
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: 'password123',
      phone: '1234567890',
      address: {
        street: '123 Main St',
      },
      answer: 'blue',
    };

    const user = new UserModel(userData);
    const savedUser = await user.save();

    expect(savedUser.createdAt).toBeInstanceOf(Date);
    expect(savedUser.updatedAt).toBeInstanceOf(Date);
  });
});
