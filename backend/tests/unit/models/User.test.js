import User from '../../../src/modules/users/users.model.js';

describe('User Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid user with required fields', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password@123',
        role: 'BUYER'
      };

      const user = new User(userData);
      await user.validate();

      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.role).toBe(userData.role);
    });

    it('should require name field', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'Password@123',
        role: 'BUYER'
      });

      await expect(user.validate()).rejects.toThrow();
    });

    it('should require email field', async () => {
      const user = new User({
        name: 'Test User',
        password: 'Password@123',
        role: 'BUYER'
      });

      await expect(user.validate()).rejects.toThrow();
    });

    it('should require password field', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        role: 'BUYER'
      });

      await expect(user.validate()).rejects.toThrow();
    });

    it('should require role field', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password@123'
      });

      await expect(user.validate()).rejects.toThrow();
    });
  });

  describe('Role Validation', () => {
    it('should accept BUYER role', async () => {
      const user = new User({
        name: 'Buyer User',
        email: 'buyer@example.com',
        password: 'Password@123',
        role: 'BUYER'
      });

      await user.validate();
      expect(user.role).toBe('BUYER');
    });

    it('should accept SUPER_ADMIN role', async () => {
      const user = new User({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'Password@123',
        role: 'SUPER_ADMIN'
      });

      await user.validate();
      expect(user.role).toBe('SUPER_ADMIN');
    });

    it('should accept SUB_ADMIN role', async () => {
      const user = new User({
        name: 'Sub Admin User',
        email: 'subadmin@example.com',
        password: 'Password@123',
        role: 'SUB_ADMIN'
      });

      await user.validate();
      expect(user.role).toBe('SUB_ADMIN');
    });

    it('should reject invalid role', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password@123',
        role: 'INVALID_ROLE'
      });

      await expect(user.validate()).rejects.toThrow();
    });
  });

  describe('Default Values', () => {
    it('should default is_active to true', () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password@123',
        role: 'BUYER'
      });

      expect(user.is_active).toBe(true);
    });

    it('should default email_verified to false', () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password@123',
        role: 'BUYER'
      });

      expect(user.email_verified).toBe(false);
    });

    it('should default approval_status to APPROVED', () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password@123',
        role: 'BUYER'
      });

      expect(user.approval_status).toBe('APPROVED');
    });

    it('should default status_quote to false', () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password@123',
        role: 'BUYER'
      });

      expect(user.status_quote).toBe(false);
    });

    it('should default payment_status to UNPAID', () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password@123',
        role: 'BUYER'
      });

      expect(user.payment_status).toBe('UNPAID');
    });

    it('should default permissions to empty array', () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password@123',
        role: 'SUB_ADMIN'
      });

      expect(user.permissions).toEqual([]);
    });
  });

  describe('Approval Status', () => {
    it('should accept PENDING status', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password@123',
        role: 'BUYER',
        approval_status: 'PENDING'
      });

      await user.validate();
      expect(user.approval_status).toBe('PENDING');
    });

    it('should accept APPROVED status', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password@123',
        role: 'BUYER',
        approval_status: 'APPROVED'
      });

      await user.validate();
      expect(user.approval_status).toBe('APPROVED');
    });

    it('should accept REJECTED status', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password@123',
        role: 'BUYER',
        approval_status: 'REJECTED'
      });

      await user.validate();
      expect(user.approval_status).toBe('REJECTED');
    });

    it('should reject invalid approval_status', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password@123',
        role: 'BUYER',
        approval_status: 'INVALID'
      });

      await expect(user.validate()).rejects.toThrow();
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const plainPassword = 'Password@123';
      const user = new User({
        name: 'Test User',
        email: 'hashtest@example.com',
        password: plainPassword,
        role: 'BUYER'
      });

      await user.save();

      expect(user.password).not.toBe(plainPassword);
      expect(user.password.length).toBeGreaterThan(plainPassword.length);
    });

    it('should compare password correctly', async () => {
      const plainPassword = 'Password@123';
      const user = new User({
        name: 'Test User',
        email: 'compare@example.com',
        password: plainPassword,
        role: 'BUYER'
      });

      await user.save();

      const isMatch = await user.comparePassword(plainPassword);
      expect(isMatch).toBe(true);
    });

    it('should reject wrong password', async () => {
      const user = new User({
        name: 'Test User',
        email: 'wrongpass@example.com',
        password: 'Password@123',
        role: 'BUYER'
      });

      await user.save();

      const isMatch = await user.comparePassword('WrongPassword@123');
      expect(isMatch).toBe(false);
    });
  });

  describe('Auto-generated user_id', () => {
    it('should generate user_id with USR prefix for BUYER', async () => {
      const user = new User({
        name: 'Buyer User',
        email: 'buyerid@example.com',
        password: 'Password@123',
        role: 'BUYER'
      });

      await user.save();

      expect(user.user_id).toMatch(/^USR-\d{5}$/);
    });

    it('should generate user_id with ADM prefix for SUPER_ADMIN', async () => {
      const user = new User({
        name: 'Admin User',
        email: 'adminid@example.com',
        password: 'Password@123',
        role: 'SUPER_ADMIN'
      });

      await user.save();

      expect(user.user_id).toMatch(/^ADM-\d{5}$/);
    });

    it('should generate user_id with ADM prefix for SUB_ADMIN', async () => {
      const user = new User({
        name: 'Sub Admin User',
        email: 'subadminid@example.com',
        password: 'Password@123',
        role: 'SUB_ADMIN'
      });

      await user.save();

      expect(user.user_id).toMatch(/^ADM-\d{5}$/);
    });
  });

  describe('Company Details', () => {
    it('should store company_details for BUYER', async () => {
      const user = new User({
        name: 'Company User',
        email: 'company@example.com',
        password: 'Password@123',
        role: 'BUYER',
        company_details: {
          company_name: 'Test Company Pvt Ltd',
          tax_id: 'TAX123456',
          phone: '1234567890',
          billing_email: 'billing@test.com'
        }
      });

      await user.validate();

      expect(user.company_details.company_name).toBe('Test Company Pvt Ltd');
      expect(user.company_details.tax_id).toBe('TAX123456');
    });
  });

  describe('Credit Info', () => {
    it('should have default credit_info values when initialized', () => {
      const user = new User({
        name: 'Credit User',
        email: 'credit@example.com',
        password: 'Password@123',
        role: 'BUYER',
        credit_info: {} // Initialize empty to get defaults
      });

      expect(user.credit_info.payment_terms).toBe('WIRE TRANSFER');
      expect(user.credit_info.credit_days).toBe(0);
      expect(user.credit_info.credit_limit).toBe(0);
      expect(user.credit_info.credit_used).toBe(0);
    });

    it('should accept custom credit_info values', async () => {
      const user = new User({
        name: 'Credit User',
        email: 'customcredit@example.com',
        password: 'Password@123',
        role: 'BUYER',
        credit_info: {
          payment_terms: 'NET 30',
          credit_days: 30,
          credit_limit: 50000,
          credit_used: 10000
        }
      });

      await user.validate();

      expect(user.credit_info.payment_terms).toBe('NET 30');
      expect(user.credit_info.credit_days).toBe(30);
      expect(user.credit_info.credit_limit).toBe(50000);
      expect(user.credit_info.credit_used).toBe(10000);
    });
  });

  describe('Address Schema', () => {
    it('should store address correctly', async () => {
      const user = new User({
        name: 'Address User',
        email: 'address@example.com',
        password: 'Password@123',
        role: 'BUYER',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'USA'
        }
      });

      await user.validate();

      expect(user.address.street).toBe('123 Main St');
      expect(user.address.city).toBe('New York');
      expect(user.address.country).toBe('USA');
    });
  });

  describe('Unique Constraints', () => {
    it('should not allow duplicate emails', async () => {
      const user1 = new User({
        name: 'User 1',
        email: 'duplicate@example.com',
        password: 'Password@123',
        role: 'BUYER'
      });

      await user1.save();

      const user2 = new User({
        name: 'User 2',
        email: 'duplicate@example.com',
        password: 'Password@456',
        role: 'BUYER'
      });

      await expect(user2.save()).rejects.toThrow();
    });
  });
});
