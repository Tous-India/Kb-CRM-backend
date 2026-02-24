import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import config from '../../src/config/index.js';
import User from '../../src/modules/users/users.model.js';
import Order from '../../src/modules/orders/orders.model.js';
import Invoice from '../../src/modules/invoices/invoices.model.js';
import Quotation from '../../src/modules/quotations/quotations.model.js';
import { validAdmin, validBuyer } from '../fixtures/users.fixture.js';

// Generate JWT token for authenticated requests
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    config.jwtSecret,
    { expiresIn: '1d' }
  );
};

describe('Dashboard API Integration Tests', () => {
  let adminUser;
  let adminToken;
  let buyerUser;
  let buyerToken;

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

    // Create some test data
    await Order.create({
      title: 'Test Order 1',
      buyer: buyerUser._id,
      buyer_name: buyerUser.name,
      status: 'OPEN',
      items: [],
      total_amount: 1000,
    });

    await Order.create({
      title: 'Test Order 2',
      buyer: buyerUser._id,
      buyer_name: buyerUser.name,
      status: 'DISPATCHED',
      items: [],
      total_amount: 2000,
    });

    await Invoice.create({
      buyer: buyerUser._id,
      buyer_name: buyerUser.name,
      status: 'UNPAID',
      items: [],
      total_amount: 1000,
    });

    await Quotation.create({
      buyer: buyerUser._id,
      buyer_name: buyerUser.name,
      status: 'SENT',
      items: [],
      total_amount: 3000,
    });
  });

  describe('GET /api/dashboard', () => {
    it('should fetch admin dashboard summary', async () => {
      const res = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toBeDefined();
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/dashboard');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/dashboard/buyer', () => {
    it('should fetch buyer dashboard stats', async () => {
      const res = await request(app)
        .get('/api/dashboard/buyer')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
    });
  });

  describe('GET /api/dashboard/buyer/recent-orders', () => {
    it('should fetch buyer recent orders', async () => {
      const res = await request(app)
        .get('/api/dashboard/buyer/recent-orders')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/dashboard/summary', () => {
    it('should fetch admin summary (admin)', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it('should reject buyer requests', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(403);
    });
  });
});
