import mongoose from 'mongoose';
import User from '../../src/modules/users/users.model.js';
import { validBuyer, validAdmin } from '../fixtures/users.fixture.js';

describe('Auth Module', () => {
  describe('User Model', () => {
    it('should create a user with valid data', async () => {
      const user = await User.create({
        ...validBuyer,
        user_id: 'USR-TEST-001'
      });

      expect(user).toBeDefined();
      expect(user.name).toBe(validBuyer.name);
      expect(user.email).toBe(validBuyer.email);
      expect(user.role).toBe(validBuyer.role);
    });

    it('should hash password before saving', async () => {
      const user = await User.create({
        ...validBuyer,
        user_id: 'USR-TEST-002'
      });

      expect(user.password).not.toBe(validBuyer.password);
      expect(user.password.length).toBeGreaterThan(10);
    });

    it('should not allow duplicate emails', async () => {
      await User.create({
        ...validBuyer,
        user_id: 'USR-TEST-003'
      });

      await expect(
        User.create({
          ...validBuyer,
          user_id: 'USR-TEST-004'
        })
      ).rejects.toThrow();
    });

    it('should require name field', async () => {
      const userWithoutName = {
        email: 'test@test.com',
        password: 'Password@123',
        role: 'BUYER',
        user_id: 'USR-TEST-006'
      };

      await expect(User.create(userWithoutName)).rejects.toThrow();
    });

    it('should compare password correctly', async () => {
      const user = await User.create({
        ...validBuyer,
        user_id: 'USR-TEST-007'
      });

      const isMatch = await user.comparePassword(validBuyer.password);
      const isNotMatch = await user.comparePassword('WrongPassword@123');

      expect(isMatch).toBe(true);
      expect(isNotMatch).toBe(false);
    });
  });

  describe('User Roles', () => {
    it('should accept valid roles', async () => {
      // Actual valid roles from the model
      const roles = ['BUYER', 'SUPER_ADMIN', 'SUB_ADMIN'];

      for (let i = 0; i < roles.length; i++) {
        const user = await User.create({
          name: `Test User ${i}`,
          email: `test${i}@test.com`,
          password: 'Password@123',
          role: roles[i],
          user_id: `USR-ROLE-${i}`
        });

        expect(user.role).toBe(roles[i]);
      }
    });

    it('should reject invalid roles', async () => {
      const invalidUser = {
        name: 'Test User',
        email: 'invalid-role@test.com',
        password: 'Password@123',
        role: 'INVALID_ROLE',
        user_id: 'USR-INVALID'
      };

      await expect(User.create(invalidUser)).rejects.toThrow();
    });
  });

  describe('Approval Status', () => {
    it('should default approval_status to APPROVED when not specified', async () => {
      // The model defaults to APPROVED (registration flow sets it to PENDING)
      const user = await User.create({
        name: 'New Buyer',
        email: 'newbuyer@test.com',
        password: 'Password@123',
        role: 'BUYER',
        user_id: 'USR-APPROVAL-001'
      });

      expect(user.approval_status).toBe('APPROVED');
    });

    it('should accept PENDING approval status when explicitly set', async () => {
      const user = await User.create({
        name: 'Pending Buyer',
        email: 'pending@test.com',
        password: 'Password@123',
        role: 'BUYER',
        approval_status: 'PENDING',
        user_id: 'USR-APPROVAL-002'
      });

      expect(user.approval_status).toBe('PENDING');
    });

    it('should accept all valid approval statuses', async () => {
      const statuses = ['PENDING', 'APPROVED', 'REJECTED'];

      for (let i = 0; i < statuses.length; i++) {
        const user = await User.create({
          name: `Status User ${i}`,
          email: `status${i}@test.com`,
          password: 'Password@123',
          role: 'BUYER',
          approval_status: statuses[i],
          user_id: `USR-STATUS-${i}`
        });

        expect(user.approval_status).toBe(statuses[i]);
      }
    });
  });
});
