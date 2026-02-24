import mongoose from 'mongoose';
import Supplier from '../../../src/modules/suppliers/suppliers.model.js';

describe('Supplier Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid supplier with required fields', async () => {
      const supplier = new Supplier({
        supplier_code: 'SUP001',
        supplier_name: 'ABC Supplies'
      });

      await supplier.validate();
      expect(supplier.supplier_name).toBe('ABC Supplies');
    });

    it('should require supplier_code field', async () => {
      const supplier = new Supplier({
        supplier_name: 'ABC Supplies'
      });

      await expect(supplier.validate()).rejects.toThrow();
    });

    it('should require supplier_name field', async () => {
      const supplier = new Supplier({
        supplier_code: 'SUP001'
      });

      await expect(supplier.validate()).rejects.toThrow();
    });

    it('should trim supplier_code', async () => {
      const supplier = new Supplier({
        supplier_code: '  SUP001  ',
        supplier_name: 'ABC Supplies'
      });

      expect(supplier.supplier_code).toBe('SUP001');
    });

    it('should trim supplier_name', async () => {
      const supplier = new Supplier({
        supplier_code: 'SUP001',
        supplier_name: '  ABC Supplies  '
      });

      expect(supplier.supplier_name).toBe('ABC Supplies');
    });
  });

  describe('Default Values', () => {
    it('should default supplier_type to DISTRIBUTOR', () => {
      const supplier = new Supplier({
        supplier_code: 'SUP001',
        supplier_name: 'ABC Supplies'
      });

      expect(supplier.supplier_type).toBe('DISTRIBUTOR');
    });

    it('should default status to ACTIVE', () => {
      const supplier = new Supplier({
        supplier_code: 'SUP001',
        supplier_name: 'ABC Supplies'
      });

      expect(supplier.status).toBe('ACTIVE');
    });

    it('should default notes to empty string', () => {
      const supplier = new Supplier({
        supplier_code: 'SUP001',
        supplier_name: 'ABC Supplies'
      });

      expect(supplier.notes).toBe('');
    });
  });

  describe('Supplier Type Validation', () => {
    const validTypes = ['MANUFACTURER', 'DISTRIBUTOR', 'WHOLESALER'];

    validTypes.forEach(type => {
      it(`should accept ${type} supplier type`, async () => {
        const supplier = new Supplier({
          supplier_code: 'SUP001',
          supplier_name: 'ABC Supplies',
          supplier_type: type
        });

        await supplier.validate();
        expect(supplier.supplier_type).toBe(type);
      });
    });

    it('should reject invalid supplier_type', async () => {
      const supplier = new Supplier({
        supplier_code: 'SUP001',
        supplier_name: 'ABC Supplies',
        supplier_type: 'INVALID'
      });

      await expect(supplier.validate()).rejects.toThrow();
    });
  });

  describe('Auto-generated supplier_id', () => {
    it('should generate supplier_id with SUP prefix', async () => {
      const supplier = new Supplier({
        supplier_code: 'SUP001',
        supplier_name: 'ABC Supplies'
      });

      await supplier.save();

      expect(supplier.supplier_id).toMatch(/^SUP-\d{5}$/);
    });

    it('should increment supplier_id for subsequent suppliers', async () => {
      const supplier1 = new Supplier({
        supplier_code: 'SUP001',
        supplier_name: 'ABC Supplies'
      });
      await supplier1.save();

      const supplier2 = new Supplier({
        supplier_code: 'SUP002',
        supplier_name: 'XYZ Supplies'
      });
      await supplier2.save();

      const num1 = parseInt(supplier1.supplier_id.split('-')[1], 10);
      const num2 = parseInt(supplier2.supplier_id.split('-')[1], 10);

      expect(num2).toBe(num1 + 1);
    });
  });

  describe('Contact Information', () => {
    it('should store contact information', async () => {
      const supplier = new Supplier({
        supplier_code: 'SUP001',
        supplier_name: 'ABC Supplies',
        contact: {
          primary_name: 'John Doe',
          email: 'john@abc.com',
          phone: '+1234567890',
          secondary_email: 'support@abc.com'
        }
      });

      await supplier.validate();
      expect(supplier.contact.primary_name).toBe('John Doe');
      expect(supplier.contact.email).toBe('john@abc.com');
    });
  });

  describe('Address', () => {
    it('should store address information', async () => {
      const supplier = new Supplier({
        supplier_code: 'SUP001',
        supplier_name: 'ABC Supplies',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'USA'
        }
      });

      await supplier.validate();
      expect(supplier.address.city).toBe('New York');
      expect(supplier.address.country).toBe('USA');
    });

    it('should default address country to USA', () => {
      const supplier = new Supplier({
        supplier_code: 'SUP001',
        supplier_name: 'ABC Supplies',
        address: {
          city: 'New York'
        }
      });

      expect(supplier.address.country).toBe('USA');
    });
  });

  describe('Business Information', () => {
    it('should store business information', async () => {
      const supplier = new Supplier({
        supplier_code: 'SUP001',
        supplier_name: 'ABC Supplies',
        business_info: {
          tax_id: 'TAX123456',
          gstin: 'GSTIN123',
          pan: 'PAN12345',
          registration_no: 'REG001'
        }
      });

      await supplier.validate();
      expect(supplier.business_info.tax_id).toBe('TAX123456');
    });
  });

  describe('Bank Details', () => {
    it('should store bank details', async () => {
      const supplier = new Supplier({
        supplier_code: 'SUP001',
        supplier_name: 'ABC Supplies',
        bank_details: {
          bank_name: 'Chase Bank',
          account_name: 'ABC Supplies Inc',
          account_number: '1234567890',
          ifsc_code: 'CHASUS33',
          swift_code: 'CHASUS33XXX',
          branch: 'Main Branch'
        }
      });

      await supplier.validate();
      expect(supplier.bank_details.bank_name).toBe('Chase Bank');
      expect(supplier.bank_details.swift_code).toBe('CHASUS33XXX');
    });
  });

  describe('Terms', () => {
    it('should store terms information', async () => {
      const supplier = new Supplier({
        supplier_code: 'SUP001',
        supplier_name: 'ABC Supplies',
        terms: {
          payment_terms: 'Net 30',
          currency: 'USD',
          credit_limit: 50000,
          credit_used: 10000,
          delivery_terms: 'FOB Origin',
          lead_time_days: 7,
          minimum_order: 100
        }
      });

      await supplier.validate();
      expect(supplier.terms.payment_terms).toBe('Net 30');
      expect(supplier.terms.credit_limit).toBe(50000);
    });

    it('should default terms currency to USD', () => {
      const supplier = new Supplier({
        supplier_code: 'SUP001',
        supplier_name: 'ABC Supplies'
      });

      expect(supplier.terms.currency).toBe('USD');
    });

    it('should default terms lead_time_days to 14', () => {
      const supplier = new Supplier({
        supplier_code: 'SUP001',
        supplier_name: 'ABC Supplies'
      });

      expect(supplier.terms.lead_time_days).toBe(14);
    });
  });

  describe('Performance Metrics', () => {
    it('should store performance metrics', async () => {
      const supplier = new Supplier({
        supplier_code: 'SUP001',
        supplier_name: 'ABC Supplies',
        performance: {
          total_orders: 100,
          total_value: 500000,
          on_time_delivery_rate: 95,
          quality_rating: 4.5,
          last_order_date: new Date('2024-01-15')
        }
      });

      await supplier.validate();
      expect(supplier.performance.total_orders).toBe(100);
      expect(supplier.performance.on_time_delivery_rate).toBe(95);
    });

    it('should default performance total_orders to 0', () => {
      const supplier = new Supplier({
        supplier_code: 'SUP001',
        supplier_name: 'ABC Supplies'
      });

      expect(supplier.performance.total_orders).toBe(0);
    });

    it('should default performance on_time_delivery_rate to 100', () => {
      const supplier = new Supplier({
        supplier_code: 'SUP001',
        supplier_name: 'ABC Supplies'
      });

      expect(supplier.performance.on_time_delivery_rate).toBe(100);
    });

    it('should default performance quality_rating to 5', () => {
      const supplier = new Supplier({
        supplier_code: 'SUP001',
        supplier_name: 'ABC Supplies'
      });

      expect(supplier.performance.quality_rating).toBe(5);
    });
  });

  describe('Products Supplied', () => {
    it('should store products_supplied array', async () => {
      const supplier = new Supplier({
        supplier_code: 'SUP001',
        supplier_name: 'ABC Supplies',
        products_supplied: ['Rivets', 'Bolts', 'Screws']
      });

      await supplier.validate();
      expect(supplier.products_supplied).toHaveLength(3);
      expect(supplier.products_supplied).toContain('Rivets');
    });

    it('should default products_supplied to empty array', () => {
      const supplier = new Supplier({
        supplier_code: 'SUP001',
        supplier_name: 'ABC Supplies'
      });

      expect(supplier.products_supplied).toEqual([]);
    });
  });

  describe('Unique Constraints', () => {
    it('should not allow duplicate supplier_code', async () => {
      const supplier1 = new Supplier({
        supplier_code: 'UNIQUE001',
        supplier_name: 'ABC Supplies'
      });
      await supplier1.save();

      const supplier2 = new Supplier({
        supplier_code: 'UNIQUE001',
        supplier_name: 'XYZ Supplies'
      });

      await expect(supplier2.save()).rejects.toThrow();
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt and updatedAt after save', async () => {
      const supplier = new Supplier({
        supplier_code: 'SUP001',
        supplier_name: 'ABC Supplies'
      });

      await supplier.save();

      expect(supplier.createdAt).toBeDefined();
      expect(supplier.updatedAt).toBeDefined();
    });
  });
});
