import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import config from '../../src/config/index.js';
import User from '../../src/modules/users/users.model.js';
import Category from '../../src/modules/categories/categories.model.js';
import { validAdmin, validBuyer } from '../fixtures/users.fixture.js';

// Generate JWT token for authenticated requests
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    config.jwtSecret,
    { expiresIn: '1d' }
  );
};

describe('Categories API Integration Tests', () => {
  let adminUser;
  let adminToken;
  let buyerUser;
  let buyerToken;
  let testCategory;

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

    // Create test category
    testCategory = await Category.create({
      name: 'Electronics',
      description: 'Electronic products',
      sub_categories: [
        { name: 'Computers', description: 'Computer equipment' },
        { name: 'Phones', description: 'Mobile phones' },
      ],
    });
  });

  describe('GET /api/categories', () => {
    it('should fetch all categories', async () => {
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data.categories)).toBe(true);
    });

    it('should be accessible by buyers', async () => {
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/categories/:id', () => {
    it('should fetch category by ID', async () => {
      const res = await request(app)
        .get(`/api/categories/${testCategory._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.category.name).toBe('Electronics');
    });

    it('should return 404 for non-existent category', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/categories/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/categories', () => {
    it('should create category (admin)', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Automotive',
          description: 'Automotive parts',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.category.name).toBe('Automotive');
    });

    it('should reject buyer requests', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          name: 'Test',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('should update category (admin)', async () => {
      const res = await request(app)
        .put(`/api/categories/${testCategory._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Updated description',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.category.description).toBe('Updated description');
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should soft delete category (admin)', async () => {
      const res = await request(app)
        .delete(`/api/categories/${testCategory._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      // Verify category is soft deleted (is_active = false)
      const deletedCategory = await Category.findById(testCategory._id);
      expect(deletedCategory.is_active).toBe(false);
    });
  });

  describe('POST /api/categories/:id/subcategories', () => {
    it('should add sub-category (admin)', async () => {
      const res = await request(app)
        .post(`/api/categories/${testCategory._id}/subcategories`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Tablets',
          description: 'Tablet devices',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.category.sub_categories.some(s => s.name === 'Tablets')).toBe(true);
    });
  });

  describe('PUT /api/categories/:id/subcategories/:subId', () => {
    it('should update sub-category (admin)', async () => {
      const subId = testCategory.sub_categories[0]._id;
      const res = await request(app)
        .put(`/api/categories/${testCategory._id}/subcategories/${subId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Desktop Computers',
        });

      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/categories/:id/subcategories/:subId', () => {
    it('should delete sub-category (admin)', async () => {
      const subId = testCategory.sub_categories[0]._id;
      const res = await request(app)
        .delete(`/api/categories/${testCategory._id}/subcategories/${subId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });
});
