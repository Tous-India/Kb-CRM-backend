import mongoose from 'mongoose';
import Brand from '../../../src/modules/brands/brands.model.js';

describe('Brand Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid brand with required fields', async () => {
      const brand = new Brand({
        name: 'Apple'
      });

      await brand.validate();
      expect(brand.name).toBe('Apple');
    });

    it('should require name field', async () => {
      const brand = new Brand({
        description: 'Test description'
      });

      await expect(brand.validate()).rejects.toThrow();
    });

    it('should trim name field', async () => {
      const brand = new Brand({
        name: '  Apple  '
      });

      expect(brand.name).toBe('Apple');
    });
  });

  describe('Default Values', () => {
    it('should default is_active to true', () => {
      const brand = new Brand({
        name: 'Apple'
      });

      expect(brand.is_active).toBe(true);
    });
  });

  describe('Auto-generated brand_id', () => {
    it('should generate brand_id with BRD prefix', async () => {
      const brand = new Brand({
        name: 'Apple'
      });

      await brand.save();

      expect(brand.brand_id).toMatch(/^BRD-\d{3}$/);
    });

    it('should increment brand_id for subsequent brands', async () => {
      const brand1 = new Brand({
        name: 'Apple'
      });
      await brand1.save();

      const brand2 = new Brand({
        name: 'Samsung'
      });
      await brand2.save();

      const num1 = parseInt(brand1.brand_id.split('-')[1], 10);
      const num2 = parseInt(brand2.brand_id.split('-')[1], 10);

      expect(num2).toBe(num1 + 1);
    });
  });

  describe('Logo', () => {
    it('should store logo url and public_id', async () => {
      const brand = new Brand({
        name: 'Apple',
        logo: {
          url: 'https://example.com/apple-logo.png',
          public_id: 'brands/apple_logo'
        }
      });

      await brand.validate();
      expect(brand.logo.url).toBe('https://example.com/apple-logo.png');
      expect(brand.logo.public_id).toBe('brands/apple_logo');
    });
  });

  describe('Additional Fields', () => {
    it('should store description', async () => {
      const brand = new Brand({
        name: 'Apple',
        description: 'Technology company known for innovative products'
      });

      await brand.validate();
      expect(brand.description).toBe('Technology company known for innovative products');
    });

    it('should store website', async () => {
      const brand = new Brand({
        name: 'Apple',
        website: 'https://www.apple.com'
      });

      await brand.validate();
      expect(brand.website).toBe('https://www.apple.com');
    });

    it('should allow setting is_active to false', async () => {
      const brand = new Brand({
        name: 'Apple',
        is_active: false
      });

      await brand.validate();
      expect(brand.is_active).toBe(false);
    });
  });

  describe('Unique Constraints', () => {
    it('should not allow duplicate brand names', async () => {
      const brand1 = new Brand({
        name: 'UniqueBrand'
      });
      await brand1.save();

      const brand2 = new Brand({
        name: 'UniqueBrand'
      });

      await expect(brand2.save()).rejects.toThrow();
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt and updatedAt after save', async () => {
      const brand = new Brand({
        name: 'Apple'
      });

      await brand.save();

      expect(brand.createdAt).toBeDefined();
      expect(brand.updatedAt).toBeDefined();
    });
  });
});
