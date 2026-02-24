import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import config from '../../src/config/index.js';
import User from '../../src/modules/users/users.model.js';
import Cart from '../../src/modules/carts/carts.model.js';
import Product from '../../src/modules/products/products.model.js';
import { validAdmin, validBuyer } from '../fixtures/users.fixture.js';
import { validProduct } from '../fixtures/products.fixture.js';

// Generate JWT token for authenticated requests
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    config.jwtSecret,
    { expiresIn: '1d' }
  );
};

describe('Carts API Integration Tests', () => {
  let adminUser;
  let adminToken;
  let buyerUser;
  let buyerToken;
  let testProduct;
  let testCart;

  beforeEach(async () => {
    // Create admin user
    adminUser = await User.create({
      ...validAdmin,
      user_id: 'ADM-TEST-001',
    });
    adminToken = generateToken(adminUser);

    // Create buyer user
    buyerUser = await User.create({
      ...validBuyer,
      user_id: 'BUY-TEST-001',
    });
    buyerToken = generateToken(buyerUser);

    // Create test product
    testProduct = await Product.create({
      ...validProduct,
      product_id: 'PRD-TEST-001',
    });

    // Create test cart with item
    testCart = await Cart.create({
      user: buyerUser._id,
      items: [
        {
          product: testProduct._id,
          quantity: 5,
        },
      ],
    });
  });

  describe('GET /api/carts', () => {
    it('should fetch buyer cart', async () => {
      const res = await request(app)
        .get('/api/carts')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/carts');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/carts/items', () => {
    it('should add item to cart', async () => {
      // Create another product
      const newProduct = await Product.create({
        part_number: 'PN-NEW-001',
        product_name: 'New Product',
        product_id: 'PRD-NEW-001',
      });

      const res = await request(app)
        .post('/api/carts/items')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          product: newProduct._id,
          quantity: 3,
        });

      expect(res.status).toBe(200);
    });

    it('should increment quantity for existing item', async () => {
      const res = await request(app)
        .post('/api/carts/items')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          product: testProduct._id,
          quantity: 2,
        });

      expect(res.status).toBe(200);
    });
  });

  describe('PUT /api/carts/items/:itemId', () => {
    it('should update item quantity', async () => {
      // Get the item ID from the cart
      const cart = await Cart.findOne({ user: buyerUser._id });
      const itemId = cart.items[0]._id;

      const res = await request(app)
        .put(`/api/carts/items/${itemId}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          quantity: 10,
        });

      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/carts/items/:itemId', () => {
    it('should remove item from cart', async () => {
      // Get the item ID from the cart
      const cart = await Cart.findOne({ user: buyerUser._id });
      const itemId = cart.items[0]._id;

      const res = await request(app)
        .delete(`/api/carts/items/${itemId}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/carts', () => {
    it('should clear entire cart', async () => {
      const res = await request(app)
        .delete('/api/carts')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
    });
  });
});
