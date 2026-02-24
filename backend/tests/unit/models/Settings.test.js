import mongoose from 'mongoose';
import Setting from '../../../src/modules/settings/settings.model.js';

describe('Settings Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid setting with required fields', async () => {
      const setting = new Setting({
        key: 'company_name',
        value: 'KB Aviation'
      });

      await setting.validate();
      expect(setting.key).toBe('company_name');
      expect(setting.value).toBe('KB Aviation');
    });

    it('should require key field', async () => {
      const setting = new Setting({
        value: 'Test Value'
      });

      await expect(setting.validate()).rejects.toThrow();
    });

    it('should require value field', async () => {
      const setting = new Setting({
        key: 'test_key'
      });

      await expect(setting.validate()).rejects.toThrow();
    });

    it('should trim key field', async () => {
      const setting = new Setting({
        key: '  company_name  ',
        value: 'KB Aviation'
      });

      expect(setting.key).toBe('company_name');
    });
  });

  describe('Default Values', () => {
    it('should default category to general', () => {
      const setting = new Setting({
        key: 'test_key',
        value: 'test_value'
      });

      expect(setting.category).toBe('general');
    });
  });

  describe('Mixed Value Types', () => {
    it('should accept string value', async () => {
      const setting = new Setting({
        key: 'company_name',
        value: 'KB Aviation'
      });

      await setting.validate();
      expect(setting.value).toBe('KB Aviation');
      expect(typeof setting.value).toBe('string');
    });

    it('should accept number value', async () => {
      const setting = new Setting({
        key: 'exchange_rate',
        value: 83.5
      });

      await setting.validate();
      expect(setting.value).toBe(83.5);
      expect(typeof setting.value).toBe('number');
    });

    it('should accept boolean value', async () => {
      const setting = new Setting({
        key: 'email_notifications',
        value: true
      });

      await setting.validate();
      expect(setting.value).toBe(true);
      expect(typeof setting.value).toBe('boolean');
    });

    it('should accept array value', async () => {
      const setting = new Setting({
        key: 'allowed_currencies',
        value: ['USD', 'INR', 'EUR']
      });

      await setting.validate();
      expect(setting.value).toEqual(['USD', 'INR', 'EUR']);
      expect(Array.isArray(setting.value)).toBe(true);
    });

    it('should accept object value', async () => {
      const setting = new Setting({
        key: 'company_address',
        value: {
          street: '123 Main St',
          city: 'New York',
          country: 'USA'
        }
      });

      await setting.validate();
      expect(setting.value.city).toBe('New York');
      expect(typeof setting.value).toBe('object');
    });

    it('should accept nested object value', async () => {
      const setting = new Setting({
        key: 'email_config',
        value: {
          smtp: {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false
          },
          from: {
            name: 'KB Enterprises',
            email: 'noreply@kb.com'
          }
        }
      });

      await setting.validate();
      expect(setting.value.smtp.host).toBe('smtp.gmail.com');
      expect(setting.value.from.email).toBe('noreply@kb.com');
    });

    it('should reject null value since value is required', async () => {
      const setting = new Setting({
        key: 'optional_setting',
        value: null
      });

      await expect(setting.validate()).rejects.toThrow();
    });
  });

  describe('Categories', () => {
    it('should accept custom category', async () => {
      const setting = new Setting({
        key: 'smtp_host',
        value: 'smtp.gmail.com',
        category: 'email'
      });

      await setting.validate();
      expect(setting.category).toBe('email');
    });

    it('should store various categories', async () => {
      const categories = ['general', 'email', 'payment', 'display', 'security'];

      for (const category of categories) {
        const setting = new Setting({
          key: `${category}_setting`,
          value: 'test',
          category
        });

        await setting.validate();
        expect(setting.category).toBe(category);
      }
    });
  });

  describe('Description', () => {
    it('should store description', async () => {
      const setting = new Setting({
        key: 'exchange_rate',
        value: 83.5,
        description: 'Current USD to INR exchange rate'
      });

      await setting.validate();
      expect(setting.description).toBe('Current USD to INR exchange rate');
    });
  });

  describe('Unique Constraints', () => {
    it('should not allow duplicate keys', async () => {
      const setting1 = new Setting({
        key: 'unique_setting',
        value: 'value1'
      });
      await setting1.save();

      const setting2 = new Setting({
        key: 'unique_setting',
        value: 'value2'
      });

      await expect(setting2.save()).rejects.toThrow();
    });
  });

  describe('Common Settings Examples', () => {
    it('should store company information', async () => {
      const setting = new Setting({
        key: 'company_info',
        value: {
          name: 'KB Enterprises',
          tagline: 'Aviation Parts Supplier',
          phone: '+1-234-567-8900',
          email: 'info@kb.com',
          website: 'https://www.kb.com'
        },
        category: 'general',
        description: 'Company information displayed on documents'
      });

      await setting.validate();
      expect(setting.value.name).toBe('KB Enterprises');
    });

    it('should store tax settings', async () => {
      const setting = new Setting({
        key: 'tax_settings',
        value: {
          gst_rate: 18,
          cgst_rate: 9,
          sgst_rate: 9,
          igst_rate: 18,
          tax_number: 'GSTIN123456789'
        },
        category: 'payment',
        description: 'Tax configuration for invoices'
      });

      await setting.validate();
      expect(setting.value.gst_rate).toBe(18);
    });

    it('should store invoice settings', async () => {
      const setting = new Setting({
        key: 'invoice_settings',
        value: {
          prefix: 'INV',
          start_number: 1,
          terms_and_conditions: 'Payment due within 30 days',
          footer_text: 'Thank you for your business'
        },
        category: 'display',
        description: 'Invoice generation settings'
      });

      await setting.validate();
      expect(setting.value.prefix).toBe('INV');
    });

    it('should store notification settings', async () => {
      const setting = new Setting({
        key: 'notification_settings',
        value: {
          email_on_new_order: true,
          email_on_payment: true,
          email_on_dispatch: true,
          admin_email: 'admin@kb.com'
        },
        category: 'email',
        description: 'Email notification preferences'
      });

      await setting.validate();
      expect(setting.value.email_on_new_order).toBe(true);
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt and updatedAt after save', async () => {
      const setting = new Setting({
        key: 'test_setting',
        value: 'test_value'
      });

      await setting.save();

      expect(setting.createdAt).toBeDefined();
      expect(setting.updatedAt).toBeDefined();
    });

    it('should update updatedAt on modification', async () => {
      const setting = new Setting({
        key: 'modifiable_setting',
        value: 'initial_value'
      });

      await setting.save();
      const initialUpdatedAt = setting.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      setting.value = 'updated_value';
      await setting.save();

      expect(setting.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    });
  });
});
