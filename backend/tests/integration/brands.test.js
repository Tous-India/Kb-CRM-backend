import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import config from '../../src/config/index.js';
import User from '../../src/modules/users/users.model.js';
import Brand from '../../src/modules/brands/brands.model.js';
import { validAdmin, validBuyer } from '../fixtures/users.fixture.js';

// Generate JWT token for authenticated requests
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    config.jwtSecret,
    { expiresIn: '1d' }
  );
};

describe('Brands API Integration Tests', () => {
  let adminUser;
  let adminToken;
  let buyerUser;
  let buyerToken;
  let testBrand;

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

    // Create test brand
    testBrand = await Brand.create({
      name: 'TestBrand',
      description: 'A test brand',
      is_active: true,
    });
  });

  describe('GET /api/brands', () => {
    it('should fetch all brands', async () => {
      const res = await request(app)
        .get('/api/brands')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data.brands)).toBe(true);
    });

    it('should be accessible by buyers', async () => {
      const res = await request(app)
        .get('/api/brands')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/brands/:id', () => {
    it('should fetch brand by ID', async () => {
      const res = await request(app)
        .get(`/api/brands/${testBrand._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.brand.name).toBe('TestBrand');
    });

    it('should return 404 for non-existent brand', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/brands/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/brands', () => {
    it('should create brand (admin)', async () => {
      const res = await request(app)
        .post('/api/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'NewBrand',
          description: 'A new brand',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.brand.name).toBe('NewBrand');
    });

    it('should reject buyer requests', async () => {
      const res = await request(app)
        .post('/api/brands')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          name: 'Test',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/brands/:id', () => {
    it('should update brand (admin)', async () => {
      const res = await request(app)
        .put(`/api/brands/${testBrand._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Updated description',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.brand.description).toBe('Updated description');
    });
  });

  describe('DELETE /api/brands/:id', () => {
    it('should soft delete brand (admin)', async () => {
      const res = await request(app)
        .delete(`/api/brands/${testBrand._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      // Verify brand is soft deleted (is_active = false)
      const deletedBrand = await Brand.findById(testBrand._id);
      expect(deletedBrand.is_active).toBe(false);
    });
  });
});
