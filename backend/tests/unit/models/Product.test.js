import Product from '../../../src/modules/products/products.model.js';

describe('Product Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid product with required fields', async () => {
      const productData = {
        part_number: 'MS20426AD3-4',
        product_name: 'Solid Rivet MS20426AD3-4'
      };

      const product = new Product(productData);
      await product.validate();

      expect(product.part_number).toBe(productData.part_number);
      expect(product.product_name).toBe(productData.product_name);
    });

    it('should require part_number field', async () => {
      const product = new Product({
        product_name: 'Test Product'
      });

      await expect(product.validate()).rejects.toThrow();
    });

    it('should require product_name field', async () => {
      const product = new Product({
        part_number: 'PN-001'
      });

      await expect(product.validate()).rejects.toThrow();
    });
  });

  describe('Default Values', () => {
    it('should default is_active to true', () => {
      const product = new Product({
        part_number: 'PN-001',
        product_name: 'Test Product'
      });

      expect(product.is_active).toBe(true);
    });

    it('should default stock_status to In Stock', () => {
      const product = new Product({
        part_number: 'PN-001',
        product_name: 'Test Product'
      });

      expect(product.stock_status).toBe('In Stock');
    });

    it('should default total_quantity to 0', () => {
      const product = new Product({
        part_number: 'PN-001',
        product_name: 'Test Product'
      });

      expect(product.total_quantity).toBe(0);
    });

    it('should default list_price to 0', () => {
      const product = new Product({
        part_number: 'PN-001',
        product_name: 'Test Product'
      });

      expect(product.list_price).toBe(0);
    });

    it('should default your_price to 0', () => {
      const product = new Product({
        part_number: 'PN-001',
        product_name: 'Test Product'
      });

      expect(product.your_price).toBe(0);
    });

    it('should default discount_percentage to 0', () => {
      const product = new Product({
        part_number: 'PN-001',
        product_name: 'Test Product'
      });

      expect(product.discount_percentage).toBe(0);
    });
  });

  describe('Stock Status Validation', () => {
    it('should accept "In Stock" status', async () => {
      const product = new Product({
        part_number: 'PN-001',
        product_name: 'Test Product',
        stock_status: 'In Stock'
      });

      await product.validate();
      expect(product.stock_status).toBe('In Stock');
    });

    it('should accept "Low Stock" status', async () => {
      const product = new Product({
        part_number: 'PN-002',
        product_name: 'Test Product',
        stock_status: 'Low Stock'
      });

      await product.validate();
      expect(product.stock_status).toBe('Low Stock');
    });

    it('should accept "Out of Stock" status', async () => {
      const product = new Product({
        part_number: 'PN-003',
        product_name: 'Test Product',
        stock_status: 'Out of Stock'
      });

      await product.validate();
      expect(product.stock_status).toBe('Out of Stock');
    });

    it('should reject invalid stock_status', async () => {
      const product = new Product({
        part_number: 'PN-004',
        product_name: 'Test Product',
        stock_status: 'Invalid Status'
      });

      await expect(product.validate()).rejects.toThrow();
    });
  });

  describe('Auto-generated product_id', () => {
    it('should generate product_id with PRD prefix', async () => {
      const product = new Product({
        part_number: 'AUTO-PN-001',
        product_name: 'Auto ID Product'
      });

      await product.save();

      expect(product.product_id).toMatch(/^PRD-\d{5}$/);
    });

    it('should increment product_id for subsequent products', async () => {
      const product1 = new Product({
        part_number: 'SEQ-PN-001',
        product_name: 'Sequential Product 1'
      });
      await product1.save();

      const product2 = new Product({
        part_number: 'SEQ-PN-002',
        product_name: 'Sequential Product 2'
      });
      await product2.save();

      const num1 = parseInt(product1.product_id.split('-')[1], 10);
      const num2 = parseInt(product2.product_id.split('-')[1], 10);

      expect(num2).toBe(num1 + 1);
    });
  });

  describe('Pricing Fields', () => {
    it('should store pricing information correctly', async () => {
      const product = new Product({
        part_number: 'PRICE-001',
        product_name: 'Priced Product',
        list_price: 100,
        your_price: 85,
        discount_percentage: 15
      });

      await product.validate();

      expect(product.list_price).toBe(100);
      expect(product.your_price).toBe(85);
      expect(product.discount_percentage).toBe(15);
    });
  });

  describe('Category and Brand', () => {
    it('should store category correctly', async () => {
      const product = new Product({
        part_number: 'CAT-001',
        product_name: 'Categorized Product',
        category: 'Rivets'
      });

      await product.validate();
      expect(product.category).toBe('Rivets');
    });

    it('should store brand correctly', async () => {
      const product = new Product({
        part_number: 'BRAND-001',
        product_name: 'Branded Product',
        brand: 'Aviation Standard'
      });

      await product.validate();
      expect(product.brand).toBe('Aviation Standard');
    });

    it('should store sub_category correctly', async () => {
      const product = new Product({
        part_number: 'SUBCAT-001',
        product_name: 'Subcategorized Product',
        category: 'Fasteners',
        sub_category: 'Bolts'
      });

      await product.validate();
      expect(product.sub_category).toBe('Bolts');
    });
  });

  describe('Locations Schema', () => {
    it('should store available_locations correctly', async () => {
      const product = new Product({
        part_number: 'LOC-001',
        product_name: 'Multi-location Product',
        available_locations: [
          { location: 'Warehouse A', quantity: 100 },
          { location: 'Warehouse B', quantity: 50 }
        ]
      });

      await product.validate();

      expect(product.available_locations).toHaveLength(2);
      expect(product.available_locations[0].location).toBe('Warehouse A');
      expect(product.available_locations[0].quantity).toBe(100);
    });

    it('should default location quantity to 0', () => {
      const product = new Product({
        part_number: 'LOC-002',
        product_name: 'Default Location Product',
        available_locations: [
          { location: 'Warehouse C' }
        ]
      });

      expect(product.available_locations[0].quantity).toBe(0);
    });
  });

  describe('Specifications Schema', () => {
    it('should store specifications correctly', async () => {
      const product = new Product({
        part_number: 'SPEC-001',
        product_name: 'Specified Product',
        specifications: {
          weight: '0.5kg',
          dimensions: '10x20x30mm',
          material: 'Aluminum',
          volume: '6000mm³'
        }
      });

      await product.validate();

      expect(product.specifications.weight).toBe('0.5kg');
      expect(product.specifications.material).toBe('Aluminum');
    });
  });

  describe('Image Fields', () => {
    it('should store main image correctly', async () => {
      const product = new Product({
        part_number: 'IMG-001',
        product_name: 'Image Product',
        image: {
          url: 'https://example.com/image.jpg',
          public_id: 'products/image123'
        }
      });

      await product.validate();

      expect(product.image.url).toBe('https://example.com/image.jpg');
      expect(product.image.public_id).toBe('products/image123');
    });

    it('should store additional images correctly', async () => {
      const product = new Product({
        part_number: 'IMG-002',
        product_name: 'Multi-image Product',
        additional_images: [
          { url: 'https://example.com/img1.jpg', public_id: 'products/img1' },
          { url: 'https://example.com/img2.jpg', public_id: 'products/img2' }
        ]
      });

      await product.validate();

      expect(product.additional_images).toHaveLength(2);
    });
  });

  describe('Unique Constraints', () => {
    it('should not allow duplicate part_numbers', async () => {
      const product1 = new Product({
        part_number: 'UNIQUE-001',
        product_name: 'Product 1'
      });
      await product1.save();

      const product2 = new Product({
        part_number: 'UNIQUE-001',
        product_name: 'Product 2'
      });

      await expect(product2.save()).rejects.toThrow();
    });
  });

  describe('Trimming', () => {
    it('should trim part_number', async () => {
      const product = new Product({
        part_number: '  TRIM-001  ',
        product_name: 'Trimmed Product'
      });

      await product.validate();
      expect(product.part_number).toBe('TRIM-001');
    });

    it('should trim product_name', async () => {
      const product = new Product({
        part_number: 'TRIM-002',
        product_name: '  Trimmed Product Name  '
      });

      await product.validate();
      expect(product.product_name).toBe('Trimmed Product Name');
    });
  });
});
