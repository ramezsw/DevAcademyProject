const request = require('supertest');
const express = require('express');
const productRoutes = require('../src/routes/product.routes');
const { setupTestDb, teardownTestDb } = require('./setup');
const errorHandler = require('../src/middleware/errorHandler');
const { authenticate, isAdmin } = require('../src/middleware/authMiddleware');
const jwt = require('jsonwebtoken');
const { User, Product } = require('../src/models');
require('dotenv').config();

jest.mock('../src/middleware/authMiddleware', () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = req.headers['x-user-data'] ? JSON.parse(req.headers['x-user-data']) : { id: 1, role: 'user' };
    next();
  }),
  isAdmin: jest.fn((req, res, next) => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ status: 'error', message: 'Access denied' });
    }
  })
}));

const app = express();
app.use(express.json());
app.use('/api/products', productRoutes);
app.use(errorHandler);

describe('Product API', () => {
  let adminToken;
  let userToken;

  beforeAll(async () => {
    await setupTestDb();

    // Create test users
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    });

    const regularUser = await User.create({
      name: 'Regular User',
      email: 'user@example.com',
      password: 'user123',
      role: 'user'
    });

    // Generate tokens
    adminToken = jwt.sign(
      { id: adminUser.id, email: adminUser.email, role: adminUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    userToken = jwt.sign(
      { id: regularUser.id, email: regularUser.email, role: regularUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  const testProduct = {
    name: 'Test Product',
    description: 'This is a test product description that is long enough',
    price: 29.99,
    stock: 10,
    category: 'Test Category'
  };

  describe('Product CRUD Operations', () => {
    let productId;

    it('should create a new product when admin is authenticated', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-user-data', JSON.stringify({ id: 1, role: 'admin' }))
        .send(testProduct);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('name', testProduct.name);
      
      productId = res.body.data.id;
    });

    it('should not allow regular user to create a product', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-user-data', JSON.stringify({ id: 2, role: 'user' }))
        .send(testProduct);

      expect(res.statusCode).toEqual(403);
    });

    it('should get all products', async () => {
      const res = await request(app)
        .get('/api/products');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should get a product by id', async () => {
      const res = await request(app)
        .get(`/api/products/${productId}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.data).toHaveProperty('id', productId);
    });

    it('should update a product when admin is authenticated', async () => {
      const updateData = { price: 39.99, stock: 20 };
      
      const res = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-user-data', JSON.stringify({ id: 1, role: 'admin' }))
        .send(updateData);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.data).toHaveProperty('price', updateData.price.toString());
      expect(res.body.data).toHaveProperty('stock', updateData.stock);
    });

    it('should delete a product when admin is authenticated', async () => {
      const res = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-user-data', JSON.stringify({ id: 1, role: 'admin' }));

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'success');
    });
  });

  describe('Product Search and Filtering', () => {
    beforeAll(async () => {
      // Create test products for search and filtering
      await Product.bulkCreate([
        {
          name: 'Laptop',
          description: 'High-performance laptop with 16GB RAM',
          price: 1299.99,
          stock: 5,
          category: 'Electronics'
        },
        {
          name: 'Smartphone',
          description: 'Latest smartphone with advanced camera',
          price: 899.99,
          stock: 10,
          category: 'Electronics'
        },
        {
          name: 'Coffee Maker',
          description: 'Automatic coffee machine for home use',
          price: 99.99,
          stock: 15,
          category: 'Kitchen'
        }
      ]);
    });

    it('should search products by query', async () => {
      const res = await request(app)
        .get('/api/products/search?q=laptop');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('name', 'Laptop');
    });

    it('should filter products by category', async () => {
      const res = await request(app)
        .get('/api/products/category/Electronics');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.every(product => product.category === 'Electronics')).toBe(true);
    });

    it('should get products with low stock', async () => {
      const res = await request(app)
        .get('/api/products/low-stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-user-data', JSON.stringify({ id: 1, role: 'admin' }));

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});