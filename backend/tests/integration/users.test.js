import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import config from '../../src/config/index.js';
import User from '../../src/modules/users/users.model.js';
import { validBuyer, validAdmin, validSubAdmin } from '../fixtures/users.fixture.js';

// Generate JWT token for authenticated requests
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    config.jwtSecret,
    { expiresIn: '1d' }
  );
};

describe('Users API Integration Tests', () => {
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
  });

  describe('GET /api/users', () => {
    it('should fetch all users (admin)', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter users by role', async () => {
      const res = await request(app)
        .get('/api/users?role=BUYER')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(u => u.role === 'BUYER')).toBe(true);
    });

    it('should filter users by is_active', async () => {
      // Deactivate buyer
      buyerUser.is_active = false;
      await buyerUser.save();

      const res = await request(app)
        .get('/api/users?is_active=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(u => u.is_active === true)).toBe(true);
    });

    it('should search users by name or email', async () => {
      const res = await request(app)
        .get(`/api/users?search=${validBuyer.email}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].email).toBe(validBuyer.email);
    });

    it('should paginate results', async () => {
      const res = await request(app)
        .get('/api/users?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(2);
    });

    it('should reject request without auth token', async () => {
      const res = await request(app).get('/api/users');

      expect(res.status).toBe(401);
    });

    it('should reject request from non-admin user', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/users/buyers', () => {
    it('should fetch all buyers (admin)', async () => {
      const res = await request(app)
        .get('/api/users/buyers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(u => u.role === 'BUYER')).toBe(true);
    });

    it('should search buyers', async () => {
      const res = await request(app)
        .get(`/api/users/buyers?search=${validBuyer.name}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should fetch user by ID (admin)', async () => {
      const res = await request(app)
        .get(`/api/users/${buyerUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(validBuyer.email);
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('not found');
    });
  });

  describe('GET /api/users/profile/me', () => {
    it('should fetch current user profile', async () => {
      const res = await request(app)
        .get('/api/users/profile/me')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(validBuyer.email);
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should reject request without auth', async () => {
      const res = await request(app).get('/api/users/profile/me');

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/users/profile/me', () => {
    it('should update current user profile', async () => {
      const res = await request(app)
        .put('/api/users/profile/me')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          name: 'Updated Name',
          phone: '1234567890',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.name).toBe('Updated Name');
      expect(res.body.data.user.phone).toBe('1234567890');
    });

    it('should update address fields', async () => {
      const res = await request(app)
        .put('/api/users/profile/me')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          address: {
            city: 'New York',
            country: 'USA',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.address.city).toBe('New York');
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .put('/api/users/profile/me')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          email: validAdmin.email, // Admin's email
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already in use');
    });
  });

  describe('PUT /api/users/profile/password', () => {
    it('should change password with correct current password', async () => {
      const res = await request(app)
        .put('/api/users/profile/password')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          currentPassword: validBuyer.password,
          newPassword: 'NewPassword@123',
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Password changed');

      // Verify new password works
      const updatedUser = await User.findById(buyerUser._id).select('+password');
      const isMatch = await updatedUser.comparePassword('NewPassword@123');
      expect(isMatch).toBe(true);
    });

    it('should reject incorrect current password', async () => {
      const res = await request(app)
        .put('/api/users/profile/password')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          currentPassword: 'WrongPassword@123',
          newPassword: 'NewPassword@123',
        });

      expect(res.status).toBe(401);
    });

    it('should reject missing fields', async () => {
      const res = await request(app)
        .put('/api/users/profile/password')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          newPassword: 'NewPassword@123',
        });

      expect(res.status).toBe(400);
    });

    it('should reject short new password', async () => {
      const res = await request(app)
        .put('/api/users/profile/password')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          currentPassword: validBuyer.password,
          newPassword: '12345',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/users', () => {
    it('should create a new buyer (admin)', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Buyer',
          email: 'newbuyer@test.com',
          password: 'Password@123',
          phone: '9876543210',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user.email).toBe('newbuyer@test.com');
      expect(res.body.data.user.role).toBe('BUYER');
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Duplicate',
          email: validBuyer.email,
          password: 'Password@123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already exists');
    });

    it('should require name, email, and password', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test',
        });

      expect(res.status).toBe(400);
    });

    it('should reject non-admin requests', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          name: 'New Buyer',
          email: 'another@test.com',
          password: 'Password@123',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/users/sub-admin', () => {
    it('should create sub-admin with permissions (super admin)', async () => {
      const res = await request(app)
        .post('/api/users/sub-admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Sub Admin',
          email: 'subadmin@test.com',
          password: 'Password@123',
          permissions: ['manage_users', 'manage_products'],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('SUB_ADMIN');
      expect(res.body.data.user.permissions).toContain('manage_users');
    });

    it('should reject invalid permissions', async () => {
      const res = await request(app)
        .post('/api/users/sub-admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Sub Admin',
          email: 'subadmin2@test.com',
          password: 'Password@123',
          permissions: ['invalid_permission'],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid permissions');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user details (admin)', async () => {
      const res = await request(app)
        .put(`/api/users/${buyerUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Buyer Name',
          phone: '1111111111',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.name).toBe('Updated Buyer Name');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated',
        });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should soft delete user (admin)', async () => {
      const res = await request(app)
        .delete(`/api/users/${buyerUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      // User should still exist but be inactive
      const user = await User.findById(buyerUser._id);
      expect(user).not.toBeNull();
      expect(user.is_active).toBe(false);
    });

    it('should prevent self-deletion', async () => {
      const res = await request(app)
        .delete(`/api/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('cannot delete your own');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/users/:id/activate', () => {
    it('should activate user (admin)', async () => {
      // First deactivate
      buyerUser.is_active = false;
      await buyerUser.save();

      const res = await request(app)
        .put(`/api/users/${buyerUser._id}/activate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.is_active).toBe(true);
    });
  });

  describe('PUT /api/users/:id/deactivate', () => {
    it('should deactivate user (admin)', async () => {
      const res = await request(app)
        .put(`/api/users/${buyerUser._id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.is_active).toBe(false);
    });

    it('should prevent self-deactivation', async () => {
      const res = await request(app)
        .put(`/api/users/${adminUser._id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('cannot deactivate your own');
    });
  });

  describe('Buyer Approval Workflow', () => {
    let pendingBuyer;

    beforeEach(async () => {
      pendingBuyer = await User.create({
        name: 'Pending Buyer',
        email: 'pending@test.com',
        password: 'Password@123',
        role: 'BUYER',
        approval_status: 'PENDING',
        is_active: false,
        user_id: 'BUY-PENDING-001',
      });
    });

    describe('GET /api/users/pending-approvals', () => {
      it('should fetch pending approvals (admin)', async () => {
        const res = await request(app)
          .get('/api/users/pending-approvals')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.some(u => u.email === 'pending@test.com')).toBe(true);
      });
    });

    describe('GET /api/users/pending-approvals/count', () => {
      it('should return count of pending approvals', async () => {
        const res = await request(app)
          .get('/api/users/pending-approvals/count')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.count).toBeGreaterThanOrEqual(1);
      });
    });

    describe('PUT /api/users/:id/approve', () => {
      it('should approve buyer registration (admin)', async () => {
        const res = await request(app)
          .put(`/api/users/${pendingBuyer._id}/approve`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.user.approval_status).toBe('APPROVED');
        expect(res.body.data.user.is_active).toBe(true);
      });

      it('should reject already approved user', async () => {
        // First approve
        pendingBuyer.approval_status = 'APPROVED';
        await pendingBuyer.save();

        const res = await request(app)
          .put(`/api/users/${pendingBuyer._id}/approve`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('already approved');
      });

      it('should reject non-buyer user', async () => {
        const res = await request(app)
          .put(`/api/users/${adminUser._id}/approve`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('Only buyer');
      });
    });

    describe('PUT /api/users/:id/reject', () => {
      it('should reject buyer registration (admin)', async () => {
        const res = await request(app)
          .put(`/api/users/${pendingBuyer._id}/reject`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            reason: 'Invalid business documentation',
          });

        expect(res.status).toBe(200);
        expect(res.body.data.user.approval_status).toBe('REJECTED');
        expect(res.body.data.user.rejection_reason).toBe('Invalid business documentation');
      });

      it('should reject already rejected user', async () => {
        pendingBuyer.approval_status = 'REJECTED';
        await pendingBuyer.save();

        const res = await request(app)
          .put(`/api/users/${pendingBuyer._id}/reject`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('already rejected');
      });
    });
  });

  describe('Sub-Admin Permissions', () => {
    let subAdminUser;
    let subAdminToken;

    beforeEach(async () => {
      subAdminUser = await User.create({
        ...validSubAdmin,
        user_id: 'SUB-TEST-001',
        permissions: ['manage_users'],
      });
      subAdminToken = generateToken(subAdminUser);
    });

    describe('PUT /api/users/:id/permissions', () => {
      it('should update sub-admin permissions (super admin)', async () => {
        const res = await request(app)
          .put(`/api/users/${subAdminUser._id}/permissions`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            permissions: ['manage_users', 'manage_products', 'manage_orders'],
          });

        expect(res.status).toBe(200);
        expect(res.body.data.user.permissions).toContain('manage_products');
      });

      it('should reject permissions for non-sub-admin', async () => {
        const res = await request(app)
          .put(`/api/users/${buyerUser._id}/permissions`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            permissions: ['manage_users'],
          });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('only be set for sub-admins');
      });

      it('should reject invalid permissions', async () => {
        const res = await request(app)
          .put(`/api/users/${subAdminUser._id}/permissions`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            permissions: ['invalid_permission'],
          });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('Invalid permissions');
      });
    });

    describe('GET /api/users/sub-admins', () => {
      it('should fetch all sub-admins (super admin)', async () => {
        const res = await request(app)
          .get('/api/users/sub-admins')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.subAdmins.some(u => u.email === validSubAdmin.email)).toBe(true);
      });
    });
  });
});
