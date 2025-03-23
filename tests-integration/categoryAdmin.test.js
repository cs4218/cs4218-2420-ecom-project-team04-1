import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import CategoryModel from '../models/categoryModel.js';
import { setupTestDB, createTestAdminUser } from '../testSetup.js';
import JWT from 'jsonwebtoken';

// Setup test database
setupTestDB();

describe('Admin Category Management API', () => {
  // Generate admin token for authentication
  const generateAdminToken = async () => {
    const adminUser = await createTestAdminUser();
    return JWT.sign(
      { _id: adminUser._id },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1d' }
    );
  };

  // Timestamp to ensure unique category names
  const timestamp = Date.now();
  const testCategory = { name: `Test Category ${timestamp}` };
  const updateCategory = { name: `Updated Category ${timestamp}` };

  let adminToken;
  let categoryId;

  beforeEach(async () => {
    adminToken = await generateAdminToken();
  });

  // ===== CREATION TESTS =====
  describe('Category Creation', () => {
    it('should create a new category successfully', async () => {
      const res = await request(app)
        .post('/api/v1/category/create-category')
        .set('Authorization', adminToken)
        .send(testCategory);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('New category created');
      expect(res.body.category.name).toBe(testCategory.name);
      expect(res.body.category.slug).toBe(
        testCategory.name.toLowerCase().replace(/\s+/g, '-')
      );

      // Save ID for later tests
      categoryId = res.body.category._id;

      // Verify category was saved in database
      const savedCategory = await CategoryModel.findById(categoryId);
      expect(savedCategory).not.toBeNull();
      expect(savedCategory.name).toBe(testCategory.name);
    });

    it('should prevent duplicate category creation', async () => {
      await new CategoryModel(testCategory).save();

      // Try to create the same category again
      const res = await request(app)
        .post('/api/v1/category/create-category')
        .set('Authorization', adminToken)
        .send(testCategory);

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Category already exists');
    });

    it('should require a name for category creation', async () => {
      const res = await request(app)
        .post('/api/v1/category/create-category')
        .set('Authorization', adminToken)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Name is required');
    });

    it('should require authentication for category creation', async () => {
      const res = await request(app)
        .post('/api/v1/category/create-category')
        .send(testCategory);

      // Expecting an authentication error
      expect(res.statusCode).toBe(401);
    });
  });

  // ===== RETRIEVAL TESTS =====
  describe('Category Retrieval', () => {
    it('should get all categories', async () => {
      const categories = [
        { name: `Category A ${timestamp}` },
        { name: `Category B ${timestamp}` },
        { name: `Category C ${timestamp}` },
      ];

      await CategoryModel.insertMany(categories);

      const res = await request(app).get('/api/v1/category/get-category');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('All Categories List');
      expect(Array.isArray(res.body.category)).toBe(true);
      expect(res.body.category.length).toBeGreaterThanOrEqual(3);

      // Verify all test categories are in the response
      categories.forEach((cat) => {
        const found = res.body.category.some((c) => c.name === cat.name);
        expect(found).toBe(true);
      });
    });

    it('should get a single category by slug', async () => {
      // Create a test category with a manually generated slug
      const slug = testCategory.name.toLowerCase().replace(/\s+/g, '-');
      const category = await new CategoryModel({
        ...testCategory,
        slug: slug,
      }).save();

      const res = await request(app).get(
        `/api/v1/category/single-category/${slug}`
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Get Single Category Successfully');
      expect(res.body.category.name).toBe(testCategory.name);
      expect(res.body.category.slug).toBe(slug);
    });

    it('should handle non-existent category slug', async () => {
      const res = await request(app).get(
        '/api/v1/category/single-category/non-existent-category'
      );

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Category not found');
    });
  });

  // ===== UPDATE TESTS =====
  describe('Category Update', () => {
    it('should update a category successfully', async () => {
      const category = await new CategoryModel(testCategory).save();

      const res = await request(app)
        .put(`/api/v1/category/update-category/${category._id}`)
        .set('Authorization', adminToken)
        .send(updateCategory);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.messsage).toBe('Category Updated Successfully');
      expect(res.body.category.name).toBe(updateCategory.name);

      // Verify database was updated
      const updatedCategory = await CategoryModel.findById(category._id);
      expect(updatedCategory.name).toBe(updateCategory.name);
      expect(updatedCategory.slug).toBe(
        updateCategory.name.toLowerCase().replace(/\s+/g, '-')
      );
    });

    it('should require authentication for category update', async () => {
      const category = await new CategoryModel(testCategory).save();

      const res = await request(app)
        .put(`/api/v1/category/update-category/${category._id}`)
        .send(updateCategory);

      // Expecting an authentication error
      expect(res.statusCode).toBe(401);
    });

    it('should require category ID for update', async () => {
      const res = await request(app)
        .put('/api/v1/category/update-category/')
        .set('Authorization', adminToken)
        .send(updateCategory);

      // Expect a 404 for the missing ID in the URL
      expect(res.statusCode).toBe(404);
    });

    it('should require a name for category update', async () => {
      const category = await new CategoryModel(testCategory).save();

      const res = await request(app)
        .put(`/api/v1/category/update-category/${category._id}`)
        .set('Authorization', adminToken)
        .send({});

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Category name is required');
    });
  });

  // ===== DELETION TESTS =====
  describe('Category Deletion', () => {
    it('should delete a category successfully', async () => {
      const category = await new CategoryModel(testCategory).save();

      const res = await request(app)
        .delete(`/api/v1/category/delete-category/${category._id}`)
        .set('Authorization', adminToken);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Category Deleted Successfully');

      // Verify category was deleted from database
      const deletedCategory = await CategoryModel.findById(category._id);
      expect(deletedCategory).toBeNull();
    });

    it('should require authentication for category deletion', async () => {
      const category = await new CategoryModel(testCategory).save();

      const res = await request(app).delete(
        `/api/v1/category/delete-category/${category._id}`
      );

      // Expecting an authentication error
      expect(res.statusCode).toBe(401);
    });

    it('should require a valid category ID for deletion', async () => {
      const res = await request(app)
        .delete('/api/v1/category/delete-category/invalid-id')
        .set('Authorization', adminToken);

      // Expect error for invalid ID format
      expect(res.statusCode).toBe(500);
    });

    it('should handle deletion of non-existent category', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`/api/v1/category/delete-category/${nonExistentId}`)
        .set('Authorization', adminToken);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Category not found');
    });
  });
});
