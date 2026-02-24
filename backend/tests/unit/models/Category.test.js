import mongoose from 'mongoose';
import Category from '../../../src/modules/categories/categories.model.js';

describe('Category Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid category with required fields', async () => {
      const category = new Category({
        name: 'Electronics'
      });

      await category.validate();
      expect(category.name).toBe('Electronics');
    });

    it('should require name field', async () => {
      const category = new Category({
        description: 'Test description'
      });

      await expect(category.validate()).rejects.toThrow();
    });

    it('should trim name field', async () => {
      const category = new Category({
        name: '  Electronics  '
      });

      expect(category.name).toBe('Electronics');
    });
  });

  describe('Default Values', () => {
    it('should default display_order to 0', () => {
      const category = new Category({
        name: 'Electronics'
      });

      expect(category.display_order).toBe(0);
    });

    it('should default is_active to true', () => {
      const category = new Category({
        name: 'Electronics'
      });

      expect(category.is_active).toBe(true);
    });
  });

  describe('Auto-generated category_id', () => {
    it('should generate category_id with CAT prefix', async () => {
      const category = new Category({
        name: 'Electronics'
      });

      await category.save();

      expect(category.category_id).toMatch(/^CAT-\d{3}$/);
    });

    it('should increment category_id for subsequent categories', async () => {
      const category1 = new Category({
        name: 'Electronics'
      });
      await category1.save();

      const category2 = new Category({
        name: 'Aviation'
      });
      await category2.save();

      const num1 = parseInt(category1.category_id.split('-')[1], 10);
      const num2 = parseInt(category2.category_id.split('-')[1], 10);

      expect(num2).toBe(num1 + 1);
    });
  });

  describe('Sub-Categories', () => {
    it('should store sub-categories array', async () => {
      const category = new Category({
        name: 'Electronics',
        sub_categories: [
          {
            sub_category_id: 'SUB-001',
            name: 'Smartphones',
            description: 'Mobile phones and accessories'
          }
        ]
      });

      await category.validate();
      expect(category.sub_categories).toHaveLength(1);
      expect(category.sub_categories[0].name).toBe('Smartphones');
    });

    it('should require sub-category name', async () => {
      const category = new Category({
        name: 'Electronics',
        sub_categories: [
          {
            sub_category_id: 'SUB-001',
            description: 'Mobile phones'
          }
        ]
      });

      await expect(category.validate()).rejects.toThrow();
    });

    it('should trim sub-category name', async () => {
      const category = new Category({
        name: 'Electronics',
        sub_categories: [
          {
            sub_category_id: 'SUB-001',
            name: '  Smartphones  '
          }
        ]
      });

      expect(category.sub_categories[0].name).toBe('Smartphones');
    });

    it('should store multiple sub-categories', async () => {
      const category = new Category({
        name: 'Electronics',
        sub_categories: [
          { sub_category_id: 'SUB-001', name: 'Smartphones' },
          { sub_category_id: 'SUB-002', name: 'Laptops' },
          { sub_category_id: 'SUB-003', name: 'Tablets' }
        ]
      });

      await category.validate();
      expect(category.sub_categories).toHaveLength(3);
    });
  });

  describe('Icon', () => {
    it('should store icon url and public_id', async () => {
      const category = new Category({
        name: 'Electronics',
        icon: {
          url: 'https://example.com/icon.png',
          public_id: 'categories/electronics_icon'
        }
      });

      await category.validate();
      expect(category.icon.url).toBe('https://example.com/icon.png');
      expect(category.icon.public_id).toBe('categories/electronics_icon');
    });
  });

  describe('Additional Fields', () => {
    it('should store description', async () => {
      const category = new Category({
        name: 'Electronics',
        description: 'Electronic products and accessories'
      });

      await category.validate();
      expect(category.description).toBe('Electronic products and accessories');
    });

    it('should store display_order', async () => {
      const category = new Category({
        name: 'Electronics',
        display_order: 5
      });

      await category.validate();
      expect(category.display_order).toBe(5);
    });

    it('should allow setting is_active to false', async () => {
      const category = new Category({
        name: 'Electronics',
        is_active: false
      });

      await category.validate();
      expect(category.is_active).toBe(false);
    });
  });

  describe('Unique Constraints', () => {
    it('should not allow duplicate category names', async () => {
      const category1 = new Category({
        name: 'UniqueCategory'
      });
      await category1.save();

      const category2 = new Category({
        name: 'UniqueCategory'
      });

      await expect(category2.save()).rejects.toThrow();
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt and updatedAt after save', async () => {
      const category = new Category({
        name: 'Electronics'
      });

      await category.save();

      expect(category.createdAt).toBeDefined();
      expect(category.updatedAt).toBeDefined();
    });
  });
});
