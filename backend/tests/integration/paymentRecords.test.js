import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import config from '../../src/config/index.js';
import User from '../../src/modules/users/users.model.js';
import PaymentRecord from '../../src/modules/paymentRecords/paymentRecords.model.js';
import ProformaInvoice from '../../src/modules/proformaInvoices/proformaInvoices.model.js';
import { validAdmin, validBuyer } from '../fixtures/users.fixture.js';

// Generate JWT token for authenticated requests
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    config.jwtSecret,
    { expiresIn: '1d' }
  );
};

describe('Payment Records API Integration Tests', () => {
  let adminUser;
  let adminToken;
  let buyerUser;
  let buyerToken;
  let testPI;
  let testPayment;

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

    // Create test proforma invoice
    testPI = await ProformaInvoice.create({
      buyer: buyerUser._id,
      buyer_name: buyerUser.name,
      status: 'APPROVED',
      items: [],
      total_amount: 5000,
    });

    // Create test payment record
    testPayment = await PaymentRecord.create({
      buyer: buyerUser._id,
      proforma_invoice: testPI._id,
      amount: 2500,
      payment_method: 'BANK_TRANSFER',
      status: 'PENDING',
      transaction_id: 'TXN123456',
    });
  });

  describe('GET /api/payment-records', () => {
    it('should fetch all payment records (admin)', async () => {
      const res = await request(app)
        .get('/api/payment-records')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/payment-records?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(p => p.status === 'PENDING')).toBe(true);
    });

    it('should reject buyer requests', async () => {
      const res = await request(app)
        .get('/api/payment-records')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/payment-records/pending', () => {
    it('should fetch pending payment records (admin)', async () => {
      const res = await request(app)
        .get('/api/payment-records/pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(p => p.status === 'PENDING')).toBe(true);
    });
  });

  describe('GET /api/payment-records/my', () => {
    it('should fetch buyer own payment records', async () => {
      const res = await request(app)
        .get('/api/payment-records/my')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/payment-records/:id', () => {
    it('should fetch payment record by ID (admin)', async () => {
      const res = await request(app)
        .get(`/api/payment-records/${testPayment._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.payment_id).toBe(testPayment.payment_id);
    });

    it('should return 404 for non-existent payment', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/payment-records/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/payment-records', () => {
    it('should create payment record (buyer)', async () => {
      const res = await request(app)
        .post('/api/payment-records')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          proforma_invoice_id: testPI._id,
          amount: 1000,
          payment_method: 'BANK_TRANSFER',
          transaction_id: 'TXN789',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.payment_id).toBeDefined();
    });
  });

  describe('PUT /api/payment-records/:id/verify', () => {
    it('should verify payment record (admin)', async () => {
      const res = await request(app)
        .put(`/api/payment-records/${testPayment._id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          recorded_amount: 2500,
          verification_notes: 'Verified successfully',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('VERIFIED');
    });
  });

  describe('PUT /api/payment-records/:id/reject', () => {
    it('should reject payment record (admin)', async () => {
      const res = await request(app)
        .put(`/api/payment-records/${testPayment._id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          verification_notes: 'Invalid proof',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('REJECTED');
    });
  });

  describe('Payment Record Data Integrity', () => {
    it('should auto-generate payment_id on create', async () => {
      const payment = await PaymentRecord.create({
        buyer: buyerUser._id,
        proforma_invoice: testPI._id,
        amount: 1000,
        payment_method: 'CASH',
        status: 'PENDING',
      });

      expect(payment.payment_id).toBeDefined();
      expect(payment.payment_id).toMatch(/^PAY-/);
    });

    it('should default status to PENDING', async () => {
      const payment = await PaymentRecord.create({
        buyer: buyerUser._id,
        proforma_invoice: testPI._id,
        amount: 1000,
        payment_method: 'CASH',
      });

      expect(payment.status).toBe('PENDING');
    });
  });
});
