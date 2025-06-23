const request = require('supertest');
const express = require('express');
const orderRoutes = require('../src/routes/order.routes');
const { setupTestDb, teardownTestDb } = require('./setup');
const errorHandler = require('../src/middleware/errorHandler');
const { User, Product } = require('../src/models');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Mock authentication middleware
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

// Setup test app
const app = express();
app.use(express.json());
app.use('/api/orders', orderRoutes);
app.use(errorHandler);

describe('Order API', () => {
  let adminToken;
  let userToken;
  let testProduct;
  let userId;

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

    userId = regularUser.id;

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

    // Create test products
    testProduct = await Product.create({
      name: 'Test Product',
      description: 'This is a test product for orders',
      price: 29.99,
      stock: 10,
      category: 'Test Category'
    });
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe('Order CRUD Operations', () => {
    let orderId;

    it('should create a new order', async () => {
      // Mock the cart service by injecting the cart items directly
      const orderData = {
        items: [
          {
            productId: testProduct.id,
            quantity: 2
          }
        ]
      };

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-user-data', JSON.stringify({ id: userId, role: 'user' }))
        .send(orderData);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('userId', userId);
      expect(res.body.data).toHaveProperty('status', 'pending');
      
      orderId = res.body.data.id;
    });

    it('should get order by ID for the user who created it', async () => {
      const res = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-user-data', JSON.stringify({ id: userId, role: 'user' }));

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.data).toHaveProperty('id', orderId);
    });

    it('should get user orders', async () => {
      const res = await request(app)
        .get('/api/orders/my-orders')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-user-data', JSON.stringify({ id: userId, role: 'user' }));

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should allow admin to update order status', async () => {
      const res = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-user-data', JSON.stringify({ id: 1, role: 'admin' }))
        .send({ status: 'shipped' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.data).toHaveProperty('status', 'shipped');
    });

    it('should not allow regular user to update order status', async () => {
      const res = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-user-data', JSON.stringify({ id: userId, role: 'user' }))
        .send({ status: 'delivered' });

      expect(res.statusCode).toEqual(403);
    });

    it('should allow user to cancel their own order', async () => {
      // Create a new order to cancel
      const orderData = {
        items: [
          {
            productId: testProduct.id,
            quantity: 1
          }
        ]
      };

      const createRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-user-data', JSON.stringify({ id: userId, role: 'user' }))
        .send(orderData);
      
      const newOrderId = createRes.body.data.id;

      // Cancel the order
      const res = await request(app)
        .post(`/api/orders/${newOrderId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-user-data', JSON.stringify({ id: userId, role: 'user' }));

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.data).toHaveProperty('status', 'cancelled');
    });

    it('should allow admin to get all orders', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-user-data', JSON.stringify({ id: 1, role: 'admin' }));

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should not allow regular user to get all orders', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-user-data', JSON.stringify({ id: userId, role: 'user' }));

      expect(res.statusCode).toEqual(403);
    });
  });

  describe('Sales Reporting', () => {
    it('should allow admin to get sales report', async () => {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1); // 1 month ago
      
      const endDate = new Date();
      
      const res = await request(app)
        .get(`/api/orders/reports/sales?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-user-data', JSON.stringify({ id: 1, role: 'admin' }));

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'success');
    });

    it('should not allow regular user to get sales report', async () => {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      
      const endDate = new Date();
      
      const res = await request(app)
        .get(`/api/orders/reports/sales?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-user-data', JSON.stringify({ id: userId, role: 'user' }));

      expect(res.statusCode).toEqual(403);
    });
  });
});