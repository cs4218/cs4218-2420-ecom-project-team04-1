import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import ProductModel from '../models/productModel.js';
import CategoryModel from '../models/categoryModel.js';
import { setupTestDB } from '../testSetup.js';
import JWT from 'jsonwebtoken';
import slugify from "slugify";

// Setup test database
setupTestDB();

describe('Admin Product Management API', () => {
    const generateAdminToken = () => {
        const adminUser = {
            _id: new mongoose.Types.ObjectId(),
            role: 1 // Admin role
        };
        return JWT.sign(adminUser, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1d' });
    };

    // Test data
    const timestamp = Date.now();
    let adminToken;
    let categoryId;
    let productId;
    let testProductData;
    let updateProductData;

    // Setup before tests
    beforeAll(async () => {
        // Set NODE_ENV to test to enable admin bypass
        process.env.NODE_ENV = 'test';

        // Create a test category first, as products require a category
        const category = await new CategoryModel({
            name: `Test Category ${timestamp}`,
            slug: `test-category-${timestamp}`
        }).save();

        categoryId = category._id.toString(); // Convert to string for request body

        // Test product data
        testProductData = {
            name: `Test Product ${timestamp}`,
            description: 'Test product description',
            price: 999,
            category: categoryId,
            quantity: 10,
            shipping: true,
            slug: slugify(`Test Product ${timestamp}`)
        };

        updateProductData = {
            name: `Updated Product ${timestamp}`,
            description: 'Updated product description',
            price: 1299,
            category: categoryId,
            quantity: 15,
            shipping: false
        };
    });

    beforeEach(() => {
        adminToken = generateAdminToken();
    });

    // Clean up after tests
    afterAll(async () => {
        await ProductModel.deleteMany({});
        await CategoryModel.deleteMany({});
        delete process.env.NODE_ENV;
    });

    // ===== CREATION TESTS =====
    describe('Product Creation', () => {
        // Set test timeout to 30000ms (30 seconds) for all tests in this block
        jest.setTimeout(30000);

        it('should create a new product successfully', async () => {
            // Using form data to work with formidable middleware
            const res = await request(app)
                .post('/api/v1/product/create-product')
                .set('Authorization', adminToken)
                .field('name', testProductData.name)
                .field('description', testProductData.description)
                .field('price', testProductData.price)
                .field('category', testProductData.category)
                .field('quantity', testProductData.quantity)
                .field('shipping', testProductData.shipping);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Product Created Successfully');
            expect(res.body.products.name).toBe(testProductData.name);
            expect(res.body.products.slug).toBe(testProductData.slug);

            // Save product ID for later tests
            productId = res.body.products._id;

            // Verify product was saved in database
            const savedProduct = await ProductModel.findById(productId);
            expect(savedProduct).not.toBeNull();
            expect(savedProduct.name).toBe(testProductData.name);
        });

        it('should prevent duplicate product creation', async () => {
            const res1 = await request(app)
                .post('/api/v1/product/create-product')
                .set('Authorization', adminToken)
                .field('name', testProductData.name)
                .field('description', testProductData.description)
                .field('price', testProductData.price)
                .field('category', testProductData.category)
                .field('quantity', testProductData.quantity)
                .field('shipping', testProductData.shipping);

            // Create product with the same name
            const res2 = await request(app)
                .post('/api/v1/product/create-product')
                .set('Authorization', adminToken)
                .field('name', testProductData.name)
                .field('description', testProductData.description)
                .field('price', testProductData.price)
                .field('category', testProductData.category)
                .field('quantity', testProductData.quantity)
                .field('shipping', testProductData.shipping);

            expect(res2.statusCode).toBe(400);
            expect(res2.body.success).toBe(false);
            expect(res2.body.error).toBe('Product with this name already exists');
        });

        it('should require all mandatory fields for product creation', async () => {
            // Test missing name
            let res = await request(app)
                .post('/api/v1/product/create-product')
                .set('Authorization', adminToken)
                .field('description', testProductData.description)
                .field('price', testProductData.price)
                .field('category', testProductData.category)
                .field('quantity', testProductData.quantity)
                .field('shipping', testProductData.shipping);

            expect(res.statusCode).toBe(500);
            expect(res.body.error).toBe('Name is Required');

            // Test missing description
            res = await request(app)
                .post('/api/v1/product/create-product')
                .set('Authorization', adminToken)
                .field('name', `Missing Description ${timestamp}`)
                .field('price', testProductData.price)
                .field('category', testProductData.category)
                .field('quantity', testProductData.quantity)
                .field('shipping', testProductData.shipping);

            expect(res.statusCode).toBe(500);
            expect(res.body.error).toBe('Description is Required');

            // Test missing price
            res = await request(app)
                .post('/api/v1/product/create-product')
                .set('Authorization', adminToken)
                .field('name', `Missing Price ${timestamp}`)
                .field('description', testProductData.description)
                .field('category', testProductData.category)
                .field('quantity', testProductData.quantity)
                .field('shipping', testProductData.shipping);

            expect(res.statusCode).toBe(500);
            expect(res.body.error).toBe('Price is Required');
        });

        it('should require authentication for product creation', async () => {
            const res = await request(app)
                .post('/api/v1/product/create-product')
                .send({
                    name: `Unauthenticated Product ${timestamp}`,
                    description: testProductData.description,
                    price: testProductData.price,
                    category: testProductData.category,
                    quantity: testProductData.quantity,
                    shipping: testProductData.shipping
                });

            // Expecting an authentication error
            expect(res.statusCode).toBe(401);
        });
    });

    // ===== RETRIEVAL TESTS =====
    describe('Product Retrieval', () => {
        it('should get all products', async () => {
            const products = [
                {
                    name: `Product A ${timestamp}`,
                    description: 'Description A',
                    price: 100,
                    category: categoryId,
                    quantity: 5,
                    shipping: true,
                    slug: `product-a-${timestamp}`
                },
                {
                    name: `Product B ${timestamp}`,
                    description: 'Description B',
                    price: 200,
                    category: categoryId,
                    quantity: 10,
                    shipping: false,
                    slug: `product-b-${timestamp}`
                }
            ];

            await ProductModel.insertMany(products);

            const res = await request(app).get('/api/v1/product/get-product');

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('All Products');
            expect(Array.isArray(res.body.products)).toBe(true);

            // Verify test products are in the response
            products.forEach(prod => {
                const found = res.body.products.some(p => p.name === prod.name);
                expect(found).toBe(true);
            });
        });

        it('should get a single product by slug', async () => {
            const uniqueTimestamp = Date.now();
            const slug = `test-product-${uniqueTimestamp}`;
            const product = await new ProductModel({
                name: `Test Product ${uniqueTimestamp}`,
                slug: slug,
                description: 'Test product description',
                price: 999,
                category: categoryId,
                quantity: 10,
                shipping: true
            }).save();

            const res = await request(app).get(`/api/v1/product/get-product/${slug}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Single Product Fetched');
            expect(res.body.product.name).toBe(`Test Product ${uniqueTimestamp}`);
            expect(res.body.product.slug).toBe(slug);
        });

        it('should handle non-existent product slug', async () => {
            const res = await request(app).get('/api/v1/product/get-product/non-existent-product');

            // The current implementation returns a null product instead of an error
            expect(res.statusCode).toBe(200);
            expect(res.body.product).toBeNull();
        });
    });

    // ===== UPDATE TESTS =====
    describe('Product Update', () => {
        // Set timeout for all tests in this block
        jest.setTimeout(30000);

        it('should update a product successfully', async () => {
            const uniqueTimestamp = Date.now();
            const product = await new ProductModel({
                name: `Product to Update ${uniqueTimestamp}`,
                slug: `product-to-update-${uniqueTimestamp}`,
                description: 'Original description',
                price: 1000,
                category: categoryId,
                quantity: 20,
                shipping: true
            }).save();

            const res = await request(app)
                .put(`/api/v1/product/update-product/${product._id}`)
                .set('Authorization', adminToken)
                .field('name', updateProductData.name)
                .field('description', updateProductData.description)
                .field('price', updateProductData.price)
                .field('category', updateProductData.category)
                .field('quantity', updateProductData.quantity)
                .field('shipping', updateProductData.shipping);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Product Updated Successfully');
            expect(res.body.products.name).toBe(updateProductData.name);

            // Verify database was updated
            const updatedProduct = await ProductModel.findById(product._id);
            expect(updatedProduct.name).toBe(updateProductData.name);
            expect(updatedProduct.description).toBe(updateProductData.description);
            expect(updatedProduct.price).toBe(updateProductData.price);
            expect(updatedProduct.quantity).toBe(updateProductData.quantity);
        });

        it('should prevent update with duplicate product name', async () => {
            const uniqueTimestamp = Date.now();
            const product1 = await new ProductModel({
                name: `Product One ${uniqueTimestamp}`,
                slug: `product-one-${uniqueTimestamp}`,
                description: 'Product one description',
                price: 100,
                category: categoryId,
                quantity: 5,
                shipping: true
            }).save();

            const product2 = await new ProductModel({
                name: `Product Two ${uniqueTimestamp}`,
                slug: `product-two-${uniqueTimestamp}`,
                description: 'Product two description',
                price: 200,
                category: categoryId,
                quantity: 10,
                shipping: false
            }).save();

            // Try to update product2 with product1's name
            const res = await request(app)
                .put(`/api/v1/product/update-product/${product2._id}`)
                .set('Authorization', adminToken)
                .field('name', product1.name)
                .field('description', 'Updated description')
                .field('price', 250)
                .field('category', categoryId)
                .field('quantity', 15)
                .field('shipping', true);

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBe('Another product with this name already exists');
        });

        it('should require authentication for product update', async () => {
            const res = await request(app)
                .put(`/api/v1/product/update-product/${productId}`)
                .send({
                    name: updateProductData.name,
                    description: updateProductData.description,
                    price: updateProductData.price,
                    category: updateProductData.category,
                    quantity: updateProductData.quantity,
                    shipping: updateProductData.shipping
                });

            // Expecting an authentication error
            expect(res.statusCode).toBe(401);
        });

        it('should require all mandatory fields for product update', async () => {
            // Test missing name
            const res = await request(app)
                .put(`/api/v1/product/update-product/${productId}`)
                .set('Authorization', adminToken)
                .field('description', updateProductData.description)
                .field('price', updateProductData.price)
                .field('category', updateProductData.category)
                .field('quantity', updateProductData.quantity)
                .field('shipping', updateProductData.shipping);

            expect(res.statusCode).toBe(500);
            expect(res.body.error).toBe('Name is Required');
        });
    });

    // ===== DELETION TESTS =====
    describe('Product Deletion', () => {
        it('should delete a product successfully', async () => {
            const uniqueTimestamp = Date.now();
            const product = await new ProductModel({
                name: `Product to Delete ${uniqueTimestamp}`,
                slug: `product-to-delete-${uniqueTimestamp}`,
                description: 'Product to delete description',
                price: 500,
                category: categoryId,
                quantity: 5,
                shipping: true
            }).save();

            const res = await request(app)
                .delete(`/api/v1/product/delete-product/${product._id}`)
                .set('Authorization', adminToken);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Product Deleted successfully');

            // Verify product was deleted from database
            const deletedProduct = await ProductModel.findById(product._id);
            expect(deletedProduct).toBeNull();
        });

        it('should validate product deletion requires authentication', async () => {
            const uniqueTimestamp = Date.now();
            const product = await new ProductModel({
                name: `Auth Test Delete ${uniqueTimestamp}`,
                slug: `auth-test-delete-${uniqueTimestamp}`,
                description: 'Auth test description',
                price: 300,
                category: categoryId,
                quantity: 3,
                shipping: true
            }).save();

            const res = await request(app)
                .delete(`/api/v1/product/delete-product/${product._id}`);

            expect(res.statusCode).toBe(401);

            // Verify product still exists
            const existingProduct = await ProductModel.findById(product._id);
            expect(existingProduct).not.toBeNull();
        });

        it('should handle deletion of non-existent product', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .delete(`/api/v1/product/delete-product/${nonExistentId}`)
                .set('Authorization', adminToken);

            // The implementation doesn't check for existence before deletion,
            // so we expect a 200 response even though no product was deleted
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
}); 