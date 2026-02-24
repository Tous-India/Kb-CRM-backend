import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import config from '../../src/config/index.js';
import User from '../../src/modules/users/users.model.js';
import Dispatch from '../../src/modules/dispatches/dispatches.model.js';
import Order from '../../src/modules/orders/orders.model.js';
import ProformaInvoice from '../../src/modules/proformaInvoices/proformaInvoices.model.js';
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

describe('Dispatches API Integration Tests', () => {
  let adminUser;
  let adminToken;
  let buyerUser;
  let buyerToken;
  let testProduct;
  let testOrder;
  let testDispatch;

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

    // Create test order
    testOrder = await Order.create({
      title: 'Test Order',
      buyer: buyerUser._id,
      buyer_name: buyerUser.name,
      status: 'OPEN',
      items: [
        {
          product: testProduct._id,
          product_id: testProduct.product_id,
          part_number: testProduct.part_number,
          product_name: testProduct.product_name,
          quantity: 10,
          unit_price: 100,
          total_price: 1000,
        },
      ],
      subtotal: 1000,
      total_amount: 1000,
    });

    // Create test dispatch
    testDispatch = await Dispatch.create({
      buyer: buyerUser._id,
      buyer_name: buyerUser.name,
      source_type: 'ORDER',
      source_id: testOrder._id,
      status: 'PENDING',
      items: [
        {
          product: testProduct._id,
          part_number: testProduct.part_number,
          product_name: testProduct.product_name,
          quantity: 5,
          unit_price: 100,
        },
      ],
      total_quantity: 5,
      total_amount: 500,
      courier_service: 'FedEx',
      tracking_number: 'FX123456',
    });
  });

  describe('GET /api/dispatches', () => {
    it('should fetch all dispatches (admin)', async () => {
      const res = await request(app)
        .get('/api/dispatches')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter dispatches by status', async () => {
      const res = await request(app)
        .get('/api/dispatches?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(d => d.status === 'PENDING')).toBe(true);
    });

    it('should reject buyer requests', async () => {
      const res = await request(app)
        .get('/api/dispatches')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/dispatches/my', () => {
    it('should fetch buyer own dispatches', async () => {
      const res = await request(app)
        .get('/api/dispatches/my')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/dispatches/:id', () => {
    it('should fetch dispatch by ID (admin)', async () => {
      const res = await request(app)
        .get(`/api/dispatches/${testDispatch._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.dispatch.dispatch_id).toBe(testDispatch.dispatch_id);
    });

    it('should return 404 for non-existent dispatch', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/dispatches/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/dispatches', () => {
    it('should create dispatch (admin)', async () => {
      const res = await request(app)
        .post('/api/dispatches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          buyer: buyerUser._id,
          buyer_name: buyerUser.name,
          source_type: 'ORDER',
          source_id: testOrder._id,
          items: [
            {
              product: testProduct._id,
              part_number: testProduct.part_number,
              product_name: testProduct.product_name,
              quantity: 3,
              unit_price: 100,
            },
          ],
          courier_service: 'DHL',
          tracking_number: 'DHL789',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.dispatch.dispatch_id).toBeDefined();
    });
  });

  describe('PUT /api/dispatches/:id', () => {
    it('should update dispatch (admin)', async () => {
      const res = await request(app)
        .put(`/api/dispatches/${testDispatch._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tracking_number: 'FX999999',
          notes: 'Updated tracking',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.dispatch.tracking_number).toBe('FX999999');
    });
  });

  describe('PUT /api/dispatches/:id/status', () => {
    it('should update dispatch status (admin)', async () => {
      const res = await request(app)
        .put(`/api/dispatches/${testDispatch._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'IN_TRANSIT',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.dispatch.status).toBe('IN_TRANSIT');
    });
  });

  describe('DELETE /api/dispatches/:id', () => {
    it('should delete dispatch (admin)', async () => {
      const res = await request(app)
        .delete(`/api/dispatches/${testDispatch._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      // Verify dispatch is deleted
      const deletedDispatch = await Dispatch.findById(testDispatch._id);
      expect(deletedDispatch).toBeNull();
    });
  });

  describe('GET /api/dispatches/summary', () => {
    it('should fetch dispatch summary (admin)', async () => {
      const res = await request(app)
        .get('/api/dispatches/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('Dispatch Data Integrity', () => {
    it('should auto-generate dispatch_id on create', async () => {
      const dispatch = await Dispatch.create({
        buyer: buyerUser._id,
        buyer_name: buyerUser.name,
        source_type: 'ORDER',
        source_id: testOrder._id,
        status: 'PENDING',
        items: [],
        total_amount: 0,
      });

      expect(dispatch.dispatch_id).toBeDefined();
      expect(dispatch.dispatch_id).toMatch(/^DSP-/);
    });

    it('should default status to PENDING', async () => {
      const dispatch = await Dispatch.create({
        buyer: buyerUser._id,
        buyer_name: buyerUser.name,
        source_type: 'ORDER',
        source_id: testOrder._id,
        items: [],
        total_amount: 0,
      });

      expect(dispatch.status).toBe('PENDING');
    });
  });
});
