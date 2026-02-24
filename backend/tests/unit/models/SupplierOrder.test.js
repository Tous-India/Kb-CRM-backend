import mongoose from 'mongoose';
import SupplierOrder from '../../../src/modules/supplierOrders/supplierOrders.model.js';

describe('SupplierOrder Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid supplier order with required fields', async () => {
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId(),
        items: [{
          quantity: 100
        }]
      });

      await order.validate();
      expect(order.items).toHaveLength(1);
    });

    it('should require supplier field', async () => {
      const order = new SupplierOrder({
        items: [{
          quantity: 100
        }]
      });

      await expect(order.validate()).rejects.toThrow();
    });
  });

  describe('Default Values', () => {
    it('should default status to DRAFT', () => {
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId()
      });

      expect(order.status).toBe('DRAFT');
    });

    it('should default currency to USD', () => {
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId()
      });

      expect(order.currency).toBe('USD');
    });

    it('should default exchange_rate to 1', () => {
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId()
      });

      expect(order.exchange_rate).toBe(1);
    });

    it('should default payment_status to UNPAID', () => {
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId()
      });

      expect(order.payment_status).toBe('UNPAID');
    });

    it('should default receiving_status to PENDING', () => {
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId()
      });

      expect(order.receiving_status).toBe('PENDING');
    });

    it('should default subtotal to 0', () => {
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId()
      });

      expect(order.subtotal).toBe(0);
    });

    it('should default total_amount to 0', () => {
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId()
      });

      expect(order.total_amount).toBe(0);
    });

    it('should default amount_paid to 0', () => {
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId()
      });

      expect(order.amount_paid).toBe(0);
    });

    it('should default balance_due to 0', () => {
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId()
      });

      expect(order.balance_due).toBe(0);
    });

    it('should have order_date default to now', () => {
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId()
      });

      expect(order.order_date).toBeDefined();
      expect(order.order_date instanceof Date).toBe(true);
    });
  });

  describe('Status Validation', () => {
    const validStatuses = ['DRAFT', 'ORDERED', 'PARTIAL_RECEIVED', 'RECEIVED', 'CANCELLED'];

    validStatuses.forEach(status => {
      it(`should accept ${status} status`, async () => {
        const order = new SupplierOrder({
          supplier: new mongoose.Types.ObjectId(),
          status
        });

        await order.validate();
        expect(order.status).toBe(status);
      });
    });

    it('should reject invalid status', async () => {
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId(),
        status: 'INVALID'
      });

      await expect(order.validate()).rejects.toThrow();
    });
  });

  describe('Payment Status Validation', () => {
    const validStatuses = ['UNPAID', 'PARTIAL', 'PAID'];

    validStatuses.forEach(status => {
      it(`should accept ${status} payment status`, async () => {
        const order = new SupplierOrder({
          supplier: new mongoose.Types.ObjectId(),
          payment_status: status
        });

        await order.validate();
        expect(order.payment_status).toBe(status);
      });
    });

    it('should reject invalid payment_status', async () => {
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId(),
        payment_status: 'INVALID'
      });

      await expect(order.validate()).rejects.toThrow();
    });
  });

  describe('Receiving Status Validation', () => {
    const validStatuses = ['PENDING', 'PARTIAL', 'COMPLETE'];

    validStatuses.forEach(status => {
      it(`should accept ${status} receiving status`, async () => {
        const order = new SupplierOrder({
          supplier: new mongoose.Types.ObjectId(),
          receiving_status: status
        });

        await order.validate();
        expect(order.receiving_status).toBe(status);
      });
    });

    it('should reject invalid receiving_status', async () => {
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId(),
        receiving_status: 'INVALID'
      });

      await expect(order.validate()).rejects.toThrow();
    });
  });

  describe('Auto-generated spo_id', () => {
    it('should generate spo_id with SPO-YYYY prefix', async () => {
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId()
      });

      await order.save();

      const year = new Date().getFullYear();
      expect(order.spo_id).toMatch(new RegExp(`^SPO-${year}-\\d{3}$`));
    });

    it('should generate spo_number', async () => {
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId()
      });

      await order.save();

      expect(order.spo_number).toMatch(/^SP\d{6}$/);
    });
  });

  describe('Items', () => {
    it('should store items with product details', async () => {
      const productId = new mongoose.Types.ObjectId();
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId(),
        items: [{
          product: productId,
          part_number: 'PN-001',
          product_name: 'Test Product',
          quantity: 100,
          unit_cost: 50,
          total_cost: 5000
        }]
      });

      await order.validate();
      expect(order.items[0].part_number).toBe('PN-001');
      expect(order.items[0].quantity).toBe(100);
    });

    it('should require minimum quantity of 1', async () => {
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId(),
        items: [{
          quantity: 0
        }]
      });

      await expect(order.validate()).rejects.toThrow();
    });

    it('should default unit_cost to 0', () => {
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId(),
        items: [{
          quantity: 10
        }]
      });

      expect(order.items[0].unit_cost).toBe(0);
    });

    it('should default received_qty to 0', () => {
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId(),
        items: [{
          quantity: 10
        }]
      });

      expect(order.items[0].received_qty).toBe(0);
    });

    it('should store pi_allocations', async () => {
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId(),
        items: [{
          quantity: 100,
          pi_allocations: [{
            pi_id: 'PI-00001',
            pi_number: 'PI-2024-001',
            pi_item_id: 'ITEM-001',
            allocated_qty: 50
          }]
        }]
      });

      await order.validate();
      expect(order.items[0].pi_allocations).toHaveLength(1);
    });
  });

  describe('Payment History', () => {
    it('should store payment history', async () => {
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId(),
        payment_history: [{
          amount: 1000,
          payment_date: new Date(),
          payment_method: 'WIRE_TRANSFER',
          reference: 'TXN123',
          notes: 'First payment'
        }]
      });

      await order.validate();
      expect(order.payment_history).toHaveLength(1);
      expect(order.payment_history[0].amount).toBe(1000);
    });

    const validMethods = ['WIRE_TRANSFER', 'CHECK', 'CASH', 'CREDIT_CARD', 'OTHER'];

    validMethods.forEach(method => {
      it(`should accept ${method} payment method in history`, async () => {
        const order = new SupplierOrder({
          supplier: new mongoose.Types.ObjectId(),
          payment_history: [{
            amount: 1000,
            payment_method: method
          }]
        });

        await order.validate();
        expect(order.payment_history[0].payment_method).toBe(method);
      });
    });
  });

  describe('Received Items', () => {
    it('should store received items', async () => {
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId(),
        received_items: [{
          received_date: new Date(),
          item_id: 'ITEM-001',
          quantity_received: 50,
          condition: 'GOOD',
          notes: 'All items in good condition'
        }]
      });

      await order.validate();
      expect(order.received_items).toHaveLength(1);
    });

    const validConditions = ['GOOD', 'DAMAGED', 'PARTIAL'];

    validConditions.forEach(condition => {
      it(`should accept ${condition} condition`, async () => {
        const order = new SupplierOrder({
          supplier: new mongoose.Types.ObjectId(),
          received_items: [{
            received_date: new Date(),
            quantity_received: 10,
            condition
          }]
        });

        await order.validate();
        expect(order.received_items[0].condition).toBe(condition);
      });
    });
  });

  describe('Shipping Address', () => {
    it('should store shipping address', async () => {
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId(),
        shipping_address: {
          street: '123 Main St',
          city: 'Mumbai',
          state: 'Maharashtra',
          zip: '400001',
          country: 'India'
        }
      });

      await order.validate();
      expect(order.shipping_address.city).toBe('Mumbai');
    });

    it('should default shipping country to India', () => {
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId(),
        shipping_address: {
          city: 'Mumbai'
        }
      });

      expect(order.shipping_address.country).toBe('India');
    });
  });

  describe('Pre-save Calculations', () => {
    it('should calculate item total_cost', async () => {
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId(),
        items: [{
          quantity: 10,
          unit_cost: 100
        }]
      });

      await order.save();

      expect(order.items[0].total_cost).toBe(1000);
    });

    it('should calculate subtotal from items', async () => {
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId(),
        items: [
          { quantity: 10, unit_cost: 100 },
          { quantity: 5, unit_cost: 200 }
        ]
      });

      await order.save();

      expect(order.subtotal).toBe(2000);
    });

    it('should calculate total_amount including tax and shipping', async () => {
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId(),
        items: [{ quantity: 10, unit_cost: 100 }],
        tax: 100,
        shipping: 50
      });

      await order.save();

      expect(order.total_amount).toBe(1150);
    });

    it('should calculate balance_due', async () => {
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId(),
        items: [{ quantity: 10, unit_cost: 100 }],
        amount_paid: 500
      });

      await order.save();

      expect(order.balance_due).toBe(500);
    });

    it('should update payment_status to PAID when fully paid', async () => {
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId(),
        items: [{ quantity: 10, unit_cost: 100 }],
        amount_paid: 1000
      });

      await order.save();

      expect(order.payment_status).toBe('PAID');
    });

    it('should update payment_status to PARTIAL when partially paid', async () => {
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId(),
        items: [{ quantity: 10, unit_cost: 100 }],
        amount_paid: 500
      });

      await order.save();

      expect(order.payment_status).toBe('PARTIAL');
    });
  });

  describe('References', () => {
    it('should accept created_by reference', async () => {
      const userId = new mongoose.Types.ObjectId();
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId(),
        created_by: userId
      });

      await order.validate();
      expect(order.created_by.toString()).toBe(userId.toString());
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt and updatedAt after save', async () => {
      const order = new SupplierOrder({
        supplier: new mongoose.Types.ObjectId()
      });

      await order.save();

      expect(order.createdAt).toBeDefined();
      expect(order.updatedAt).toBeDefined();
    });
  });
});
