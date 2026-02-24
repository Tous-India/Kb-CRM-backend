import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import config from '../../src/config/index.js';
import User from '../../src/modules/users/users.model.js';
import Invoice from '../../src/modules/invoices/invoices.model.js';
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

describe('Invoices API Integration Tests', () => {
  let adminUser;
  let adminToken;
  let buyerUser;
  let buyerToken;
  let testProduct;
  let testOrder;
  let testInvoice;

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
      status: 'DISPATCHED',
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

    // Create test invoice
    testInvoice = await Invoice.create({
      buyer: buyerUser._id,
      buyer_name: buyerUser.name,
      buyer_email: buyerUser.email,
      order: testOrder._id,
      status: 'UNPAID',
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
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  });

  describe('GET /api/invoices', () => {
    it('should fetch all invoices (admin)', async () => {
      const res = await request(app)
        .get('/api/invoices')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter invoices by status', async () => {
      const res = await request(app)
        .get('/api/invoices?status=UNPAID')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(i => i.status === 'UNPAID')).toBe(true);
    });

    it('should filter invoices by invoice_type', async () => {
      testInvoice.invoice_type = 'PROFORMA';
      await testInvoice.save();

      const res = await request(app)
        .get('/api/invoices?invoice_type=PROFORMA')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(i => i.invoice_type === 'PROFORMA')).toBe(true);
    });

    it('should paginate results', async () => {
      // Create more invoices
      for (let i = 0; i < 5; i++) {
        await Invoice.create({
          buyer: buyerUser._id,
          buyer_name: buyerUser.name,
          status: 'UNPAID',
          items: [],
          total_amount: 100 * i,
        });
      }

      const res = await request(app)
        .get('/api/invoices?page=1&limit=3')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(6);
    });

    it('should reject buyer requests', async () => {
      const res = await request(app)
        .get('/api/invoices')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/invoices/my', () => {
    it('should fetch buyer own invoices', async () => {
      const res = await request(app)
        .get('/api/invoices/my')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/invoices/my?status=UNPAID')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(i => i.status === 'UNPAID')).toBe(true);
    });

    it('should not return other buyer invoices', async () => {
      // Create another buyer with invoice
      const anotherBuyer = await User.create({
        name: 'Another Buyer',
        email: 'another@test.com',
        password: 'Password@123',
        role: 'BUYER',
        user_id: 'BUY-OTHER-001',
      });
      await Invoice.create({
        buyer: anotherBuyer._id,
        buyer_name: anotherBuyer.name,
        buyer_email: anotherBuyer.email,
        status: 'UNPAID',
        items: [],
        total_amount: 500,
      });

      const res = await request(app)
        .get('/api/invoices/my')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(i =>
        i.buyer?.toString() === buyerUser._id.toString() ||
        i.buyer?._id?.toString() === buyerUser._id.toString() ||
        i.buyer_email === buyerUser.email
      )).toBe(true);
    });
  });

  describe('GET /api/invoices/:id', () => {
    it('should fetch invoice by ID (admin)', async () => {
      const res = await request(app)
        .get(`/api/invoices/${testInvoice._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.invoice.invoice_number).toBe(testInvoice.invoice_number);
    });

    it('should fetch own invoice (buyer)', async () => {
      const res = await request(app)
        .get(`/api/invoices/${testInvoice._id}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.invoice.invoice_number).toBe(testInvoice.invoice_number);
    });

    it('should reject other buyer invoice access', async () => {
      // Create another buyer
      const anotherBuyer = await User.create({
        name: 'Another Buyer',
        email: 'another@test.com',
        password: 'Password@123',
        role: 'BUYER',
        user_id: 'BUY-OTHER-001',
      });
      const anotherToken = generateToken(anotherBuyer);

      const res = await request(app)
        .get(`/api/invoices/${testInvoice._id}`)
        .set('Authorization', `Bearer ${anotherToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent invoice', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/invoices/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/invoices', () => {
    it('should create invoice from order (admin)', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          order: testOrder._id,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          notes: 'Test invoice',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.invoice.invoice_number).toBeDefined();
      expect(res.body.data.invoice.items.length).toBe(testOrder.items.length);
    });

    it('should require order ID', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notes: 'Test',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('required');
    });

    it('should return 404 for non-existent order', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          order: fakeId,
        });

      expect(res.status).toBe(404);
    });

    it('should reject buyer requests', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          order: testOrder._id,
        });

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/invoices/:id', () => {
    it('should update invoice (admin)', async () => {
      const res = await request(app)
        .put(`/api/invoices/${testInvoice._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notes: 'Updated notes',
          status: 'PARTIAL',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.invoice.notes).toBe('Updated notes');
    });

    it('should return 404 for non-existent invoice', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/invoices/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notes: 'Test',
        });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/invoices/:id', () => {
    it('should delete invoice (admin)', async () => {
      const res = await request(app)
        .delete(`/api/invoices/${testInvoice._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      // Verify invoice is deleted
      const deletedInvoice = await Invoice.findById(testInvoice._id);
      expect(deletedInvoice).toBeNull();
    });

    it('should return 404 for non-existent invoice', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/invoices/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should reject buyer requests', async () => {
      const res = await request(app)
        .delete(`/api/invoices/${testInvoice._id}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/invoices/:id/status', () => {
    it('should update invoice status (admin)', async () => {
      const res = await request(app)
        .put(`/api/invoices/${testInvoice._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'PAID',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.invoice.status).toBe('PAID');
    });
  });

  describe('Invoice Data Integrity', () => {
    it('should auto-generate invoice_number on create', async () => {
      const invoice = await Invoice.create({
        buyer: buyerUser._id,
        buyer_name: buyerUser.name,
        status: 'UNPAID',
        items: [],
        total_amount: 0,
      });

      expect(invoice.invoice_number).toBeDefined();
      expect(invoice.invoice_number).toMatch(/^INV-/);
    });

    it('should default status to UNPAID', async () => {
      const invoice = await Invoice.create({
        buyer: buyerUser._id,
        buyer_name: buyerUser.name,
        items: [],
        total_amount: 0,
      });

      expect(invoice.status).toBe('UNPAID');
    });

    it('should default invoice_type to STANDARD', async () => {
      const invoice = await Invoice.create({
        buyer: buyerUser._id,
        buyer_name: buyerUser.name,
        items: [],
        total_amount: 0,
      });

      expect(invoice.invoice_type).toBe('STANDARD');
    });
  });
});
