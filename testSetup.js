import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import UserModel from './models/userModel';
import CategoryModel from './models/categoryModel';
import bcrypt from 'bcrypt';

let mongoServer;
let testAdminUser;

export const createTestAdminUser = async () => {
  // First check if admin user already exists
  const existingAdmin = await UserModel.findOne({
    email: 'testadmin@example.com',
  });
  if (existingAdmin) {
    return existingAdmin;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('test123', salt);
  const hashedAnswer = await bcrypt.hash('Test Answer', salt);

  testAdminUser = await UserModel.create({
    name: 'Test Admin',
    email: 'testadmin@example.com',
    password: hashedPassword,
    phone: '1234567890',
    address: 'Test Address',
    answer: hashedAnswer,
    role: 1,
  });

  return testAdminUser;
};

export const setupTestDB = () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.disconnect(); // Ensure no existing connections
    await mongoose.connect(mongoUri);

    // Drop existing collections and indexes
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
      await collection.dropIndexes().catch(() => {});
    }

    // Create indexes and wait for them to be ready
    await UserModel.createCollection();
    await CategoryModel.createCollection();
    await UserModel.syncIndexes();
    await CategoryModel.syncIndexes();

    // Create test admin user
    await createTestAdminUser();
  }, 30000);

  afterEach(async () => {
    // Clean up all collections except users
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      if (key !== 'users') {
        const collection = collections[key];
        await collection.deleteMany({});
      }
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        const collection = collections[key];
        await collection.dropIndexes().catch(() => {});
      }
      await mongoose.disconnect();
    }
    await mongoServer.stop();
    await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay to ensure cleanup
  }, 30000);
};
