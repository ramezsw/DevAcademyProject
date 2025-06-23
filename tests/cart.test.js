const request = require('supertest');
const express = require('express');
const cartRoutes = require('../src/routes/cart.routes');
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
app.use('/api/cart', cartRoutes);
app.use(errorHandler);

describe('Cart API', () => {
  let userToken;
  let testProduct1;
  let testProduct2;
  let userId;

  beforeAll(async () => {
    await setupTestDb();

    // Create test user
    const regularUser = await User.create({
      name: 'Cart User',
      email: 'cart@example.com',
      password: 'cart123',
      role: 'user'
    });

    userId = regularUser.id;

    // Generate token
    userToken = jwt.sign(
      { id: regularUser.id, email: regularUser.email, role: regularUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create test products
    testProduct1 = await Product.create({
      name: 'Test Product 1',
      description: 'This is the first test product for the cart',
      price: 19.99,
      stock: 10,
      category: 'Test Category'
    });

    testProduct2 = await Product.create({
      name: 'Test Product 2',
      description: 'This is the second test product for the cart',
      price: 29.99,
      stock: 5,
      category: 'Test Category'
    });
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe('Cart Operations', () => {
    it('should get an empty cart for a new user', async () => {
      const res = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-user-data', JSON.stringify({ id: userId, role: 'user' }));

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.data).toHaveProperty('items');
      expect(res.body.data.items).toHaveLength(0);
      expect(res.body.data).toHaveProperty('total', 0);
    });

    it('should add an item to the cart', async () => {
      const cartItem = {
        productId: testProduct1.id,
        quantity: 2
      };

      const res = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-user-data', JSON.stringify({ id: userId, role: 'user' }))
        .send(cartItem);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.data).toHaveProperty('items');
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0]).toHaveProperty('productId', testProduct1.id);
      expect(res.body.data.items[0]).toHaveProperty('quantity', 2);
      expect(res.body.data).toHaveProperty('total', 39.98); // 19.99 * 2
    });

    it('should add another item to the cart', async () => {
      const cartItem = {
        productId: testProduct2.id,
        quantity: 1
      };

      const res = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-user-data', JSON.stringify({ id: userId, role: 'user' }))
        .send(cartItem);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.data).toHaveProperty('items');
      expect(res.body.data.items).toHaveLength(2);
      expect(res.body.data).toHaveProperty('total', 69.97); // 19.99 * 2 + 29.99
    });

    it('should update item quantity in the cart', async () => {
      const updateItem = {
        quantity: 3
      };

      const res = await request(app)
        .put(`/api/cart/items/${testProduct1.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-user-data', JSON.stringify({ id: userId, role: 'user' }))
        .send(updateItem);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.data.items.find(item => item.productId === testProduct1.id))
        .toHaveProperty('quantity', 3);
      expect(res.body.data).toHaveProperty('total', 89.96); // 19.99 * 3 + 29.99
    });

    it('should not allow updating to invalid quantity', async () => {
      const updateItem = {
        quantity: 0
      };

      const res = await request(app)
        .put(`/api/cart/items/${testProduct1.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-user-data', JSON.stringify({ id: userId, role: 'user' }))
        .send(updateItem);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('status', 'error');
    });

    it('should not allow adding more items than available in stock', async () => {
      const cartItem = {
        productId: testProduct2.id,
        quantity: 10 // Only 5 in stock
      };

      const res = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-user-data', JSON.stringify({ id: userId, role: 'user' }))
        .send(cartItem);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('status', 'error');
    });

    it('should remove an item from the cart', async () => {
      const res = await request(app)
        .delete(`/api/cart/items/${testProduct2.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-user-data', JSON.stringify({ id: userId, role: 'user' }));

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0]).toHaveProperty('productId', testProduct1.id);
      expect(res.body.data).toHaveProperty('total', 59.97); // 19.99 * 3
    });

    it('should clear the entire cart', async () => {
      const res = await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-user-data', JSON.stringify({ id: userId, role: 'user' }));

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.data).toHaveProperty('items');
      expect(res.body.data.items).toHaveLength(0);
      expect(res.body.data).toHaveProperty('total', 0);
    });
  });
});