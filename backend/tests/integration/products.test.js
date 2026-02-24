import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import config from '../../src/config/index.js';
import User from '../../src/modules/users/users.model.js';
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

describe('Products API Integration Tests', () => {
  let adminUser;
  let adminToken;
  let buyerUser;
  let buyerToken;
  let testProduct;

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
  });

  describe('GET /api/products', () => {
    it('should fetch all products', async () => {
      const res = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      // Note: GET /api/products is public, pricing is not exposed
    });

    it('should fetch all products (buyer - without pricing)', async () => {
      const res = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      // Buyer should NOT see pricing
      expect(res.body.data[0].list_price).toBeUndefined();
      expect(res.body.data[0].your_price).toBeUndefined();
    });

    it('should fetch products without auth (without pricing)', async () => {
      const res = await request(app).get('/api/products');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      // Unauthenticated should NOT see pricing
      expect(res.body.data[0].list_price).toBeUndefined();
    });

    it('should filter products by category', async () => {
      const res = await request(app)
        .get(`/api/products?category=${validProduct.category}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(p => p.category === validProduct.category)).toBe(true);
    });

    it('should filter products by brand', async () => {
      const res = await request(app)
        .get(`/api/products?brand=${validProduct.brand}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(p => p.brand === validProduct.brand)).toBe(true);
    });

    it('should filter products by stock_status', async () => {
      const res = await request(app)
        .get('/api/products?stock_status=IN_STOCK')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(p => p.stock_status === 'In Stock')).toBe(true);
    });

    it('should paginate results', async () => {
      // Create more products
      for (let i = 0; i < 5; i++) {
        await Product.create({
          part_number: `PN-PAG-${i}`,
          product_name: `Pagination Test ${i}`,
          product_id: `PRD-PAG-${i}`,
        });
      }

      const res = await request(app)
        .get('/api/products?page=1&limit=3')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(6);
    });
  });

  describe('GET /api/products/search', () => {
    it('should search products by name', async () => {
      const res = await request(app)
        .get(`/api/products/search?q=${validProduct.product_name.substring(0, 5)}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should search products by part_number', async () => {
      const res = await request(app)
        .get(`/api/products/search?q=${validProduct.part_number}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.some(p => p.part_number === validProduct.part_number)).toBe(true);
    });

    it('should require search query', async () => {
      const res = await request(app)
        .get('/api/products/search')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('required');
    });

    it('should return empty array for no matches', async () => {
      const res = await request(app)
        .get('/api/products/search?q=nonexistentproduct12345')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/products/category/:categoryName', () => {
    it('should fetch products by category', async () => {
      const res = await request(app)
        .get(`/api/products/category/${validProduct.category}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.products.every(p => p.category === validProduct.category)).toBe(true);
    });

    it('should return empty array for non-existent category', async () => {
      const res = await request(app)
        .get('/api/products/category/NonExistentCategory')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.products).toHaveLength(0);
    });
  });

  describe('GET /api/products/brand/:brandName', () => {
    it('should fetch products by brand', async () => {
      const res = await request(app)
        .get(`/api/products/brand/${validProduct.brand}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.products.every(p => p.brand === validProduct.brand)).toBe(true);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should fetch product by MongoDB _id', async () => {
      const res = await request(app)
        .get(`/api/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.product.part_number).toBe(validProduct.part_number);
    });

    it('should fetch product by product_id', async () => {
      const res = await request(app)
        .get('/api/products/PRD-TEST-001')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.product.part_number).toBe(validProduct.part_number);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/products/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('not found');
    });

    it('should hide pricing from buyer', async () => {
      const res = await request(app)
        .get(`/api/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.product.list_price).toBeUndefined();
      expect(res.body.data.product.your_price).toBeUndefined();
    });
  });

  describe('POST /api/products', () => {
    it('should create product (admin)', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          part_number: 'PN-NEW-001',
          product_name: 'New Test Product',
          category: 'Electronics',
          brand: 'TestBrand',
          list_price: 100,
          your_price: 80,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.product.part_number).toBe('PN-NEW-001');
      expect(res.body.data.product.product_id).toBeDefined();
    });

    it('should require part_number and product_name', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          category: 'Electronics',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('required');
    });

    it('should reject buyer requests', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          part_number: 'PN-BUYER-001',
          product_name: 'Buyer Product',
        });

      expect(res.status).toBe(403);
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({
          part_number: 'PN-UNAUTH-001',
          product_name: 'Unauthorized Product',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update product (admin)', async () => {
      const res = await request(app)
        .put(`/api/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          product_name: 'Updated Product Name',
          list_price: 200,
          stock_status: 'Low Stock',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.product.product_name).toBe('Updated Product Name');
      expect(res.body.data.product.list_price).toBe(200);
      expect(res.body.data.product.stock_status).toBe('Low Stock');
    });

    it('should update product by product_id', async () => {
      const res = await request(app)
        .put('/api/products/PRD-TEST-001')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Updated description',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.product.description).toBe('Updated description');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/products/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          product_name: 'Updated',
        });

      expect(res.status).toBe(404);
    });

    it('should reject buyer requests', async () => {
      const res = await request(app)
        .put(`/api/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          product_name: 'Buyer Update',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete product (admin)', async () => {
      const res = await request(app)
        .delete(`/api/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      // Verify product is deleted
      const deletedProduct = await Product.findById(testProduct._id);
      expect(deletedProduct).toBeNull();
    });

    it('should delete product by product_id', async () => {
      const res = await request(app)
        .delete('/api/products/PRD-TEST-001')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/products/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should reject buyer requests', async () => {
      const res = await request(app)
        .delete(`/api/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/products/:id/inventory', () => {
    it('should update product inventory (admin)', async () => {
      const res = await request(app)
        .put(`/api/products/${testProduct._id}/inventory`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          total_quantity: 500,
          stock_status: 'In Stock',
          available_locations: ['Warehouse A', 'Warehouse B'],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.product.total_quantity).toBe(500);
      expect(res.body.data.product.stock_status).toBe('In Stock');
      expect(res.body.data.product.available_locations).toContain('Warehouse A');
    });

    it('should update partial inventory fields', async () => {
      const res = await request(app)
        .put(`/api/products/${testProduct._id}/inventory`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          total_quantity: 100,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.product.total_quantity).toBe(100);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/products/${fakeId}/inventory`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          total_quantity: 100,
        });

      expect(res.status).toBe(404);
    });

    it('should reject buyer requests', async () => {
      const res = await request(app)
        .put(`/api/products/${testProduct._id}/inventory`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          total_quantity: 100,
        });

      expect(res.status).toBe(403);
    });
  });

  describe('Product Data Integrity', () => {
    it('should auto-generate product_id on create', async () => {
      const product = await Product.create({
        part_number: 'PN-AUTO-001',
        product_name: 'Auto ID Product',
      });

      expect(product.product_id).toBeDefined();
      expect(product.product_id).toMatch(/^PRD-/);
    });

    it('should default stock_status to IN_STOCK', async () => {
      const product = await Product.create({
        part_number: 'PN-DEFAULT-001',
        product_name: 'Default Status Product',
      });

      expect(product.stock_status).toBe('In Stock');
    });

    it('should default is_active to true', async () => {
      const product = await Product.create({
        part_number: 'PN-ACTIVE-001',
        product_name: 'Active Product',
      });

      expect(product.is_active).toBe(true);
    });
  });
});
