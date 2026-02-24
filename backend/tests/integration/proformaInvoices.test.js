import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import config from '../../src/config/index.js';
import User from '../../src/modules/users/users.model.js';
import ProformaInvoice from '../../src/modules/proformaInvoices/proformaInvoices.model.js';
import Quotation from '../../src/modules/quotations/quotations.model.js';
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

describe('Proforma Invoices API Integration Tests', () => {
  let adminUser;
  let adminToken;
  let buyerUser;
  let buyerToken;
  let testProduct;
  let testPI;

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

    // Create test proforma invoice
    testPI = await ProformaInvoice.create({
      buyer: buyerUser._id,
      buyer_name: buyerUser.name,
      buyer_email: buyerUser.email,
      status: 'APPROVED',
      items: [
        {
          product: testProduct._id,
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
  });

  describe('GET /api/proforma-invoices', () => {
    it('should fetch all proforma invoices (admin)', async () => {
      const res = await request(app)
        .get('/api/proforma-invoices')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/proforma-invoices?status=APPROVED')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(pi => pi.status === 'APPROVED')).toBe(true);
    });

    it('should reject buyer requests', async () => {
      const res = await request(app)
        .get('/api/proforma-invoices')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/proforma-invoices/my', () => {
    it('should fetch buyer own proforma invoices', async () => {
      const res = await request(app)
        .get('/api/proforma-invoices/my')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/proforma-invoices/:id', () => {
    it('should fetch proforma invoice by ID (admin)', async () => {
      const res = await request(app)
        .get(`/api/proforma-invoices/${testPI._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.proformaInvoice.proforma_number).toBe(testPI.proforma_number);
    });

    it('should fetch own proforma invoice (buyer)', async () => {
      const res = await request(app)
        .get(`/api/proforma-invoices/${testPI._id}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
    });

    it('should return 404 for non-existent PI', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/proforma-invoices/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/proforma-invoices', () => {
    let acceptedQuotation;

    beforeEach(async () => {
      acceptedQuotation = await Quotation.create({
        buyer: buyerUser._id,
        buyer_name: buyerUser.name,
        status: 'ACCEPTED',
        items: [
          {
            product: testProduct._id,
            part_number: testProduct.part_number,
            product_name: testProduct.product_name,
            quantity: 5,
            unit_price: 200,
            total_price: 1000,
          },
        ],
        subtotal: 1000,
        total_amount: 1000,
      });
    });

    it('should create proforma invoice from quotation (admin)', async () => {
      const res = await request(app)
        .post('/api/proforma-invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          quotation: acceptedQuotation._id,
          payment_terms: 'NET30',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.proformaInvoice.proforma_number).toBeDefined();
    });
  });

  describe('PUT /api/proforma-invoices/:id', () => {
    it('should update proforma invoice (admin)', async () => {
      const res = await request(app)
        .put(`/api/proforma-invoices/${testPI._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          payment_terms: 'NET60',
          notes: 'Updated notes',
        });

      expect(res.status).toBe(200);
    });
  });

  describe('PUT /api/proforma-invoices/:id/approve', () => {
    it('should approve proforma invoice (admin)', async () => {
      testPI.status = 'PENDING';
      await testPI.save();

      const res = await request(app)
        .put(`/api/proforma-invoices/${testPI._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.proformaInvoice.status).toBe('APPROVED');
    });
  });

  describe('Proforma Invoice Data Integrity', () => {
    it('should auto-generate proforma_number on create', async () => {
      const pi = await ProformaInvoice.create({
        buyer: buyerUser._id,
        buyer_name: buyerUser.name,
        status: 'PENDING',
        items: [],
        total_amount: 0,
      });

      expect(pi.proforma_number).toBeDefined();
      expect(pi.proforma_number).toMatch(/^PI-/);
    });

    it('should default status to PENDING', async () => {
      const pi = await ProformaInvoice.create({
        buyer: buyerUser._id,
        buyer_name: buyerUser.name,
        items: [],
        total_amount: 0,
      });

      expect(pi.status).toBe('PENDING');
    });
  });
});
