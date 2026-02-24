import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import config from '../../src/config/index.js';
import User from '../../src/modules/users/users.model.js';
import Order from '../../src/modules/orders/orders.model.js';
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

describe('Orders API Integration Tests', () => {
  let adminUser;
  let adminToken;
  let buyerUser;
  let buyerToken;
  let testProduct;
  let testOrder;

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
  });

  describe('GET /api/orders', () => {
    it('should fetch all orders (admin)', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter orders by status', async () => {
      const res = await request(app)
        .get('/api/orders?status=OPEN')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(o => o.status === 'OPEN')).toBe(true);
    });

    it('should filter orders by payment_status', async () => {
      testOrder.payment_status = 'PAID';
      await testOrder.save();

      const res = await request(app)
        .get('/api/orders?payment_status=PAID')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(o => o.payment_status === 'PAID')).toBe(true);
    });

    it('should paginate results', async () => {
      // Create more orders
      for (let i = 0; i < 5; i++) {
        await Order.create({
          title: `Test Order ${i}`,
          buyer: buyerUser._id,
          buyer_name: buyerUser.name,
          status: 'OPEN',
          items: [],
          total_amount: 100 * i,
        });
      }

      const res = await request(app)
        .get('/api/orders?page=1&limit=3')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(6);
    });

    it('should reject buyer requests', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/orders/my', () => {
    it('should fetch buyer own orders', async () => {
      const res = await request(app)
        .get('/api/orders/my')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].buyer.toString()).toBe(buyerUser._id.toString());
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/orders/my?status=OPEN')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(o => o.status === 'OPEN')).toBe(true);
    });

    it('should not return other buyer orders', async () => {
      // Create another buyer with order
      const anotherBuyer = await User.create({
        name: 'Another Buyer',
        email: 'another@test.com',
        password: 'Password@123',
        role: 'BUYER',
        user_id: 'BUY-OTHER-001',
      });
      await Order.create({
        title: 'Another Order',
        buyer: anotherBuyer._id,
        buyer_name: anotherBuyer.name,
        status: 'OPEN',
        items: [],
        total_amount: 500,
      });

      const res = await request(app)
        .get('/api/orders/my')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(o =>
        o.buyer.toString() === buyerUser._id.toString() ||
        o.buyer._id?.toString() === buyerUser._id.toString()
      )).toBe(true);
    });
  });

  describe('GET /api/orders/open', () => {
    it('should fetch open orders (admin)', async () => {
      const res = await request(app)
        .get('/api/orders/open')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(o =>
        o.status === 'OPEN' || o.status === 'PROCESSING'
      )).toBe(true);
    });
  });

  describe('GET /api/orders/dispatched', () => {
    it('should fetch dispatched orders (admin)', async () => {
      // Create dispatched order
      await Order.create({
        title: 'Dispatched Order',
        buyer: buyerUser._id,
        buyer_name: buyerUser.name,
        status: 'DISPATCHED',
        items: [],
        total_amount: 500,
      });

      const res = await request(app)
        .get('/api/orders/dispatched')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(o => o.status === 'DISPATCHED')).toBe(true);
    });
  });

  describe('GET /api/orders/pending', () => {
    it('should fetch pending orders (admin)', async () => {
      // Create pending order
      await Order.create({
        title: 'Pending Order',
        buyer: buyerUser._id,
        buyer_name: buyerUser.name,
        status: 'PENDING',
        items: [],
        total_amount: 500,
      });

      const res = await request(app)
        .get('/api/orders/pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(o => o.status === 'PENDING')).toBe(true);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should fetch order by ID (admin)', async () => {
      const res = await request(app)
        .get(`/api/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.order.title).toBe('Test Order');
    });

    it('should fetch own order (buyer)', async () => {
      const res = await request(app)
        .get(`/api/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.order.title).toBe('Test Order');
    });

    it('should reject other buyer order access', async () => {
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
        .get(`/api/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${anotherToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent order', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/orders/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/orders', () => {
    let acceptedQuotation;

    beforeEach(async () => {
      // Create accepted quotation
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

    it('should create order from accepted quotation (admin)', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          quotation: acceptedQuotation._id,
          shipping_address: { city: 'New York', country: 'USA' },
          notes: 'Test order notes',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.order.items.length).toBe(1);
      expect(res.body.data.order.total_amount).toBe(1000);

      // Verify quotation is marked as converted
      const updatedQuotation = await Quotation.findById(acceptedQuotation._id);
      expect(updatedQuotation.status).toBe('CONVERTED');
    });

    it('should require quotation ID', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notes: 'Test',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('required');
    });

    it('should reject non-accepted quotation', async () => {
      // Create pending quotation
      const pendingQuote = await Quotation.create({
        buyer: buyerUser._id,
        buyer_name: buyerUser.name,
        status: 'PENDING',
        items: [],
        total_amount: 500,
      });

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          quotation: pendingQuote._id,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('accepted');
    });

    it('should return 404 for non-existent quotation', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          quotation: fakeId,
        });

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/orders/:id', () => {
    it('should update order fields (admin)', async () => {
      const res = await request(app)
        .put(`/api/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notes: 'Updated notes',
          admin_notes: 'Admin notes',
          estimated_delivery: '2024-12-31',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.order.notes).toBe('Updated notes');
      expect(res.body.data.order.admin_notes).toBe('Admin notes');
    });

    it('should update shipping address', async () => {
      const res = await request(app)
        .put(`/api/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          shipping_address: {
            street: '123 Main St',
            city: 'New York',
            country: 'USA',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.order.shipping_address.city).toBe('New York');
    });

    it('should return 404 for non-existent order', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/orders/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notes: 'Test',
        });

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/orders/:id/status', () => {
    it('should update order status (admin)', async () => {
      const res = await request(app)
        .put(`/api/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'PROCESSING',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.order.status).toBe('PROCESSING');
    });

    it('should require status field', async () => {
      const res = await request(app)
        .put(`/api/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('required');
    });
  });

  describe('PUT /api/orders/:id/dispatch', () => {
    it('should dispatch order (admin)', async () => {
      const res = await request(app)
        .put(`/api/orders/${testOrder._id}/dispatch`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courier_service: 'FedEx',
          tracking_number: 'FX123456',
          dispatch_notes: 'Shipped via express',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.order.status).toBe('DISPATCHED');
      expect(res.body.data.order.dispatch_info.tracking_number).toBe('FX123456');
    });

    it('should reject already dispatched order', async () => {
      testOrder.status = 'DISPATCHED';
      await testOrder.save();

      const res = await request(app)
        .put(`/api/orders/${testOrder._id}/dispatch`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courier_service: 'FedEx',
          tracking_number: 'FX123456',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already dispatched');
    });

    it('should reject cancelled order dispatch', async () => {
      testOrder.status = 'CANCELLED';
      await testOrder.save();

      const res = await request(app)
        .put(`/api/orders/${testOrder._id}/dispatch`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courier_service: 'FedEx',
          tracking_number: 'FX123456',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('cancelled');
    });
  });

  describe('PUT /api/orders/:id/partial-dispatch', () => {
    it('should partial dispatch order (admin)', async () => {
      const res = await request(app)
        .put(`/api/orders/${testOrder._id}/partial-dispatch`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [
            {
              product_id: testProduct.product_id,
              product_name: testProduct.product_name,
              part_number: testProduct.part_number,
              quantity: 5,
              unit_price: 100,
            },
          ],
          awb_number: 'AWB123',
          shipping_by: 'FedEx',
          shipping_notes: 'Partial shipment',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.dispatch_record).toBeDefined();
      expect(res.body.data.dispatch_record.total_quantity).toBe(5);
    });

    it('should require at least one item', async () => {
      const res = await request(app)
        .put(`/api/orders/${testOrder._id}/partial-dispatch`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('At least one item');
    });
  });

  describe('POST /api/orders/:id/payment', () => {
    it('should record payment (admin)', async () => {
      const res = await request(app)
        .post(`/api/orders/${testOrder._id}/payment`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 500,
          payment_method: 'BANK_TRANSFER',
          notes: 'Partial payment',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.order.payment_received).toBe(500);
      expect(res.body.data.order.payment_status).toBe('PARTIAL');
    });

    it('should mark as PAID when full amount received', async () => {
      const res = await request(app)
        .post(`/api/orders/${testOrder._id}/payment`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 1000,
          payment_method: 'BANK_TRANSFER',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.order.payment_status).toBe('PAID');
    });

    it('should reject invalid amount', async () => {
      const res = await request(app)
        .post(`/api/orders/${testOrder._id}/payment`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 0,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Valid payment amount');
    });

    it('should reject payment for cancelled order', async () => {
      testOrder.status = 'CANCELLED';
      await testOrder.save();

      const res = await request(app)
        .post(`/api/orders/${testOrder._id}/payment`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 500,
          payment_method: 'CASH',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('cancelled');
    });
  });

  describe('POST /api/orders/quote-request', () => {
    it('should submit quote request (buyer)', async () => {
      const res = await request(app)
        .post('/api/orders/quote-request')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          customer_name: buyerUser.name,
          customer_email: buyerUser.email,
          items: [
            {
              product_id: testProduct.product_id,
              part_number: testProduct.part_number,
              product_name: testProduct.product_name,
              quantity: 20,
            },
          ],
          total_amount: 0,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.order.status).toBe('PENDING');
      expect(res.body.data.order.order_type).toBe('QUOTE_REQUEST');
    });

    it('should require at least one item', async () => {
      const res = await request(app)
        .post('/api/orders/quote-request')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          customer_name: buyerUser.name,
          items: [],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('At least one item');
    });
  });

  describe('POST /api/orders/:id/convert-to-quotation', () => {
    let pendingOrder;

    beforeEach(async () => {
      pendingOrder = await Order.create({
        title: 'Pending Order',
        buyer: buyerUser._id,
        buyer_name: buyerUser.name,
        customer_name: buyerUser.name,
        customer_email: buyerUser.email,
        status: 'PENDING',
        items: [
          {
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
    });

    it('should convert pending order to quotation (admin)', async () => {
      const res = await request(app)
        .post(`/api/orders/${pendingOrder._id}/convert-to-quotation`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          exchange_rate: 1.1,
          expiry_days: 30,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.order.status).toBe('CONVERTED');
      expect(res.body.data.quotation).toBeDefined();
      expect(res.body.data.quotation.quote_number).toBeDefined();
    });

    it('should reject non-PENDING order', async () => {
      pendingOrder.status = 'OPEN';
      await pendingOrder.save();

      const res = await request(app)
        .post(`/api/orders/${pendingOrder._id}/convert-to-quotation`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          exchange_rate: 1.1,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Only PENDING orders');
    });
  });

  describe('POST /api/orders/:id/clone', () => {
    it('should clone own order (buyer)', async () => {
      const res = await request(app)
        .post(`/api/orders/${testOrder._id}/clone`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          notes: 'Cloned order',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.order.status).toBe('PENDING');
      expect(res.body.data.order.items.length).toBe(testOrder.items.length);
      expect(res.body.data.source_order_id).toBe(testOrder.order_id);
    });

    it('should reject cloning other buyer order', async () => {
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
        .post(`/api/orders/${testOrder._id}/clone`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({});

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('only clone your own');
    });

    it('should allow admin to clone any order', async () => {
      const res = await request(app)
        .post(`/api/orders/${testOrder._id}/clone`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(201);
    });
  });

  describe('Order Data Integrity', () => {
    it('should auto-generate order_id on create', async () => {
      const order = await Order.create({
        title: 'Auto ID Order',
        buyer: buyerUser._id,
        buyer_name: buyerUser.name,
        status: 'OPEN',
        items: [],
        total_amount: 0,
      });

      expect(order.order_id).toBeDefined();
      expect(order.order_id).toMatch(/^ORD-/);
    });

    it('should default status to OPEN', async () => {
      const order = await Order.create({
        title: 'Default Status Order',
        buyer: buyerUser._id,
        buyer_name: buyerUser.name,
        items: [],
        total_amount: 0,
      });

      expect(order.status).toBe('OPEN');
    });

    it('should default payment_status to UNPAID', async () => {
      const order = await Order.create({
        title: 'Default Payment Order',
        buyer: buyerUser._id,
        buyer_name: buyerUser.name,
        items: [],
        total_amount: 0,
      });

      expect(order.payment_status).toBe('UNPAID');
    });
  });
});
