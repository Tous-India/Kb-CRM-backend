import mongoose from 'mongoose';
import PurchaseOrder from '../../../src/modules/purchaseOrders/purchaseOrders.model.js';

describe('PurchaseOrder Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid purchase order with required fields', async () => {
      const po = new PurchaseOrder({
        title: 'Urgent Parts Request',
        buyer: new mongoose.Types.ObjectId(),
        items: [{
          product: new mongoose.Types.ObjectId(),
          quantity: 10
        }]
      });

      await po.validate();
      expect(po.title).toBe('Urgent Parts Request');
    });

    it('should require title field', async () => {
      const po = new PurchaseOrder({
        buyer: new mongoose.Types.ObjectId(),
        items: [{
          product: new mongoose.Types.ObjectId(),
          quantity: 10
        }]
      });

      await expect(po.validate()).rejects.toThrow();
    });

    it('should require buyer field', async () => {
      const po = new PurchaseOrder({
        title: 'Urgent Parts Request',
        items: [{
          product: new mongoose.Types.ObjectId(),
          quantity: 10
        }]
      });

      await expect(po.validate()).rejects.toThrow();
    });

    it('should trim title field', async () => {
      const po = new PurchaseOrder({
        title: '  Urgent Parts Request  ',
        buyer: new mongoose.Types.ObjectId()
      });

      expect(po.title).toBe('Urgent Parts Request');
    });
  });

  describe('Default Values', () => {
    it('should default status to PENDING', () => {
      const po = new PurchaseOrder({
        title: 'Test PO',
        buyer: new mongoose.Types.ObjectId()
      });

      expect(po.status).toBe('PENDING');
    });

    it('should have po_date default to now', () => {
      const po = new PurchaseOrder({
        title: 'Test PO',
        buyer: new mongoose.Types.ObjectId()
      });

      expect(po.po_date).toBeDefined();
      expect(po.po_date instanceof Date).toBe(true);
    });
  });

  describe('Status Validation', () => {
    const validStatuses = ['PENDING', 'CONVERTED', 'REJECTED', 'CANCELLED'];

    validStatuses.forEach(status => {
      it(`should accept ${status} status`, async () => {
        const po = new PurchaseOrder({
          title: 'Test PO',
          buyer: new mongoose.Types.ObjectId(),
          status
        });

        await po.validate();
        expect(po.status).toBe(status);
      });
    });

    it('should reject invalid status', async () => {
      const po = new PurchaseOrder({
        title: 'Test PO',
        buyer: new mongoose.Types.ObjectId(),
        status: 'INVALID'
      });

      await expect(po.validate()).rejects.toThrow();
    });
  });

  describe('Auto-generated po_number', () => {
    it('should generate po_number with PO prefix', async () => {
      const po = new PurchaseOrder({
        title: 'Test PO',
        buyer: new mongoose.Types.ObjectId()
      });

      await po.save();

      expect(po.po_number).toMatch(/^PO-\d{5}$/);
    });

    it('should increment po_number for subsequent orders', async () => {
      const po1 = new PurchaseOrder({
        title: 'Test PO 1',
        buyer: new mongoose.Types.ObjectId()
      });
      await po1.save();

      const po2 = new PurchaseOrder({
        title: 'Test PO 2',
        buyer: new mongoose.Types.ObjectId()
      });
      await po2.save();

      const num1 = parseInt(po1.po_number.split('-')[1], 10);
      const num2 = parseInt(po2.po_number.split('-')[1], 10);

      expect(num2).toBe(num1 + 1);
    });
  });

  describe('Items', () => {
    it('should store items with product details', async () => {
      const productId = new mongoose.Types.ObjectId();
      const po = new PurchaseOrder({
        title: 'Test PO',
        buyer: new mongoose.Types.ObjectId(),
        items: [{
          product: productId,
          part_number: 'PN-001',
          product_name: 'Test Product',
          quantity: 100
        }]
      });

      await po.validate();
      expect(po.items[0].part_number).toBe('PN-001');
      expect(po.items[0].quantity).toBe(100);
    });

    it('should require product in items', async () => {
      const po = new PurchaseOrder({
        title: 'Test PO',
        buyer: new mongoose.Types.ObjectId(),
        items: [{
          quantity: 10
        }]
      });

      await expect(po.validate()).rejects.toThrow();
    });

    it('should require quantity in items', async () => {
      const po = new PurchaseOrder({
        title: 'Test PO',
        buyer: new mongoose.Types.ObjectId(),
        items: [{
          product: new mongoose.Types.ObjectId()
        }]
      });

      await expect(po.validate()).rejects.toThrow();
    });

    it('should require minimum quantity of 1', async () => {
      const po = new PurchaseOrder({
        title: 'Test PO',
        buyer: new mongoose.Types.ObjectId(),
        items: [{
          product: new mongoose.Types.ObjectId(),
          quantity: 0
        }]
      });

      await expect(po.validate()).rejects.toThrow();
    });

    it('should not allow negative quantity', async () => {
      const po = new PurchaseOrder({
        title: 'Test PO',
        buyer: new mongoose.Types.ObjectId(),
        items: [{
          product: new mongoose.Types.ObjectId(),
          quantity: -5
        }]
      });

      await expect(po.validate()).rejects.toThrow();
    });

    it('should store multiple items', async () => {
      const po = new PurchaseOrder({
        title: 'Test PO',
        buyer: new mongoose.Types.ObjectId(),
        items: [
          { product: new mongoose.Types.ObjectId(), quantity: 10 },
          { product: new mongoose.Types.ObjectId(), quantity: 20 },
          { product: new mongoose.Types.ObjectId(), quantity: 30 }
        ]
      });

      await po.validate();
      expect(po.items).toHaveLength(3);
    });
  });

  describe('Shipping Address', () => {
    it('should store shipping address', async () => {
      const po = new PurchaseOrder({
        title: 'Test PO',
        buyer: new mongoose.Types.ObjectId(),
        shipping_address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'USA'
        }
      });

      await po.validate();
      expect(po.shipping_address.city).toBe('New York');
      expect(po.shipping_address.country).toBe('USA');
    });
  });

  describe('Notes', () => {
    it('should store customer_notes', async () => {
      const po = new PurchaseOrder({
        title: 'Test PO',
        buyer: new mongoose.Types.ObjectId(),
        customer_notes: 'Please deliver by Friday'
      });

      await po.validate();
      expect(po.customer_notes).toBe('Please deliver by Friday');
    });

    it('should store admin_notes', async () => {
      const po = new PurchaseOrder({
        title: 'Test PO',
        buyer: new mongoose.Types.ObjectId(),
        admin_notes: 'Priority customer'
      });

      await po.validate();
      expect(po.admin_notes).toBe('Priority customer');
    });
  });

  describe('References', () => {
    it('should accept buyer reference', async () => {
      const buyerId = new mongoose.Types.ObjectId();
      const po = new PurchaseOrder({
        title: 'Test PO',
        buyer: buyerId,
        buyer_name: 'John Doe'
      });

      await po.validate();
      expect(po.buyer.toString()).toBe(buyerId.toString());
      expect(po.buyer_name).toBe('John Doe');
    });

    it('should accept converted_to_quote reference', async () => {
      const quoteId = new mongoose.Types.ObjectId();
      const po = new PurchaseOrder({
        title: 'Test PO',
        buyer: new mongoose.Types.ObjectId(),
        converted_to_quote: quoteId,
        status: 'CONVERTED'
      });

      await po.validate();
      expect(po.converted_to_quote.toString()).toBe(quoteId.toString());
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt and updatedAt after save', async () => {
      const po = new PurchaseOrder({
        title: 'Test PO',
        buyer: new mongoose.Types.ObjectId()
      });

      await po.save();

      expect(po.createdAt).toBeDefined();
      expect(po.updatedAt).toBeDefined();
    });
  });
});
