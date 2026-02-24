import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import config from '../../src/config/index.js';
import User from '../../src/modules/users/users.model.js';
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

describe('Quotations API Integration Tests', () => {
  let adminUser;
  let adminToken;
  let buyerUser;
  let buyerToken;
  let testProduct;
  let testQuotation;

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

    // Create test quotation
    testQuotation = await Quotation.create({
      buyer: buyerUser._id,
      buyer_name: buyerUser.name,
      customer_email: buyerUser.email,
      status: 'SENT',
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
      expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    });
  });

  describe('GET /api/quotations', () => {
    it('should fetch all quotations (admin)', async () => {
      const res = await request(app)
        .get('/api/quotations')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter quotations by status', async () => {
      const res = await request(app)
        .get('/api/quotations?status=SENT')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(q => q.status === 'SENT')).toBe(true);
    });

    it('should filter quotations by buyer', async () => {
      const res = await request(app)
        .get(`/api/quotations?buyer=${buyerUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should paginate results', async () => {
      // Create more quotations
      for (let i = 0; i < 5; i++) {
        await Quotation.create({
          buyer: buyerUser._id,
          buyer_name: buyerUser.name,
          status: 'SENT',
          items: [],
          total_amount: 100 * i,
        });
      }

      const res = await request(app)
        .get('/api/quotations?page=1&limit=3')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(6);
    });

    it('should reject buyer requests', async () => {
      const res = await request(app)
        .get('/api/quotations')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/quotations/my', () => {
    it('should fetch buyer own quotations', async () => {
      const res = await request(app)
        .get('/api/quotations/my')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/quotations/my?status=SENT')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(q => q.status === 'SENT')).toBe(true);
    });

    it('should not return other buyer quotations', async () => {
      // Create another buyer with quotation
      const anotherBuyer = await User.create({
        name: 'Another Buyer',
        email: 'another@test.com',
        password: 'Password@123',
        role: 'BUYER',
        user_id: 'BUY-OTHER-001',
      });
      await Quotation.create({
        buyer: anotherBuyer._id,
        buyer_name: anotherBuyer.name,
        customer_email: anotherBuyer.email,
        status: 'SENT',
        items: [],
        total_amount: 500,
      });

      const res = await request(app)
        .get('/api/quotations/my')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(q =>
        q.buyer?.toString() === buyerUser._id.toString() ||
        q.buyer?._id?.toString() === buyerUser._id.toString() ||
        q.customer_email === buyerUser.email
      )).toBe(true);
    });
  });

  describe('GET /api/quotations/:id', () => {
    it('should fetch quotation by ID (admin)', async () => {
      const res = await request(app)
        .get(`/api/quotations/${testQuotation._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.quotation.quote_number).toBe(testQuotation.quote_number);
    });

    it('should return 404 for non-existent quotation', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/quotations/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/quotations/:id/view', () => {
    it('should fetch own quotation (buyer)', async () => {
      const res = await request(app)
        .get(`/api/quotations/${testQuotation._id}/view`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.quotation.quote_number).toBe(testQuotation.quote_number);
    });

    it('should reject other buyer quotation access', async () => {
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
        .get(`/api/quotations/${testQuotation._id}/view`)
        .set('Authorization', `Bearer ${anotherToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow admin to view any quotation', async () => {
      const res = await request(app)
        .get(`/api/quotations/${testQuotation._id}/view`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/quotations', () => {
    it('should create quotation (admin)', async () => {
      const res = await request(app)
        .post('/api/quotations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          buyer: buyerUser._id,
          buyer_name: buyerUser.name,
          customer_email: buyerUser.email,
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

      expect(res.status).toBe(201);
      expect(res.body.data.quotation.quote_number).toBeDefined();
    });

    it('should reject buyer requests', async () => {
      const res = await request(app)
        .post('/api/quotations')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          buyer: buyerUser._id,
          items: [],
          total_amount: 500,
        });

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/quotations/:id', () => {
    it('should update quotation (admin)', async () => {
      const res = await request(app)
        .put(`/api/quotations/${testQuotation._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          admin_notes: 'Updated notes',
          shipping: 50,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.quotation.admin_notes).toBe('Updated notes');
      expect(res.body.data.quotation.shipping).toBe(50);
    });

    it('should return 404 for non-existent quotation', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/quotations/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          admin_notes: 'Test',
        });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/quotations/:id', () => {
    it('should delete quotation (admin)', async () => {
      const res = await request(app)
        .delete(`/api/quotations/${testQuotation._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      // Verify quotation is deleted
      const deletedQuotation = await Quotation.findById(testQuotation._id);
      expect(deletedQuotation).toBeNull();
    });

    it('should return 404 for non-existent quotation', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/quotations/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should reject buyer requests', async () => {
      const res = await request(app)
        .delete(`/api/quotations/${testQuotation._id}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/quotations/:id/accept', () => {
    it('should accept quotation (buyer)', async () => {
      const res = await request(app)
        .put(`/api/quotations/${testQuotation._id}/accept`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          shipping_address: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'USA',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.quotation.status).toBe('ACCEPTED');
      expect(res.body.data.quotation.shipping_address.city).toBe('New York');
    });

    it('should reject non-SENT quotation', async () => {
      testQuotation.status = 'DRAFT';
      await testQuotation.save();

      const res = await request(app)
        .put(`/api/quotations/${testQuotation._id}/accept`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Only SENT quotations');
    });

    it('should reject expired quotation', async () => {
      testQuotation.expiry_date = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      await testQuotation.save();

      const res = await request(app)
        .put(`/api/quotations/${testQuotation._id}/accept`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('expired');
    });

    it('should reject other buyer quotation', async () => {
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
        .put(`/api/quotations/${testQuotation._id}/accept`)
        .set('Authorization', `Bearer ${anotherToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow admin to accept any quotation', async () => {
      const res = await request(app)
        .put(`/api/quotations/${testQuotation._id}/accept`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.quotation.status).toBe('ACCEPTED');
    });
  });

  describe('PUT /api/quotations/:id/reject', () => {
    it('should reject quotation (buyer)', async () => {
      const res = await request(app)
        .put(`/api/quotations/${testQuotation._id}/reject`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          reason: 'Price too high',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.quotation.status).toBe('REJECTED');
      expect(res.body.data.quotation.rejection_reason).toBe('Price too high');
    });

    it('should reject non-SENT quotation', async () => {
      testQuotation.status = 'ACCEPTED';
      await testQuotation.save();

      const res = await request(app)
        .put(`/api/quotations/${testQuotation._id}/reject`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Only SENT quotations');
    });

    it('should reject other buyer quotation', async () => {
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
        .put(`/api/quotations/${testQuotation._id}/reject`)
        .set('Authorization', `Bearer ${anotherToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/quotations/:id/inquiry', () => {
    it('should send inquiry (buyer)', async () => {
      const res = await request(app)
        .post(`/api/quotations/${testQuotation._id}/inquiry`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          subject: 'Question about pricing',
          message: 'Can you provide a discount for bulk orders?',
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('inquiry has been sent');
    });

    it('should require subject and message', async () => {
      const res = await request(app)
        .post(`/api/quotations/${testQuotation._id}/inquiry`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          subject: 'Question',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('required');
    });

    it('should reject other buyer inquiry', async () => {
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
        .post(`/api/quotations/${testQuotation._id}/inquiry`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({
          subject: 'Question',
          message: 'Test message',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('Quotation Data Integrity', () => {
    it('should auto-generate quote_number on create', async () => {
      const quotation = await Quotation.create({
        buyer: buyerUser._id,
        buyer_name: buyerUser.name,
        status: 'DRAFT',
        items: [],
        total_amount: 0,
      });

      expect(quotation.quote_number).toBeDefined();
      expect(quotation.quote_number).toMatch(/^Q\d{4}/);
    });

    it('should default status to DRAFT', async () => {
      const quotation = await Quotation.create({
        buyer: buyerUser._id,
        buyer_name: buyerUser.name,
        items: [],
        total_amount: 0,
      });

      expect(quotation.status).toBe('DRAFT');
    });

    it('should track email status', async () => {
      const quotation = await Quotation.create({
        buyer: buyerUser._id,
        buyer_name: buyerUser.name,
        items: [],
        total_amount: 0,
      });

      expect(quotation.is_emailed).toBe(false);
      expect(quotation.email_count).toBe(0);
    });
  });
});
