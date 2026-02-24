import mongoose from 'mongoose';
import Order from '../../../src/modules/orders/orders.model.js';

describe('Order Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid order with minimal fields', async () => {
      const order = new Order({
        items: [{
          part_number: 'PN-001',
          product_name: 'Test Product',
          quantity: 5,
          unit_price: 10,
          total_price: 50
        }]
      });

      await order.validate();
      expect(order.items).toHaveLength(1);
    });

    it('should require quantity in items', async () => {
      const order = new Order({
        items: [{
          part_number: 'PN-001',
          product_name: 'Test Product',
          unit_price: 10
        }]
      });

      await expect(order.validate()).rejects.toThrow();
    });

    it('should require minimum quantity of 1', async () => {
      const order = new Order({
        items: [{
          part_number: 'PN-001',
          product_name: 'Test Product',
          quantity: 0
        }]
      });

      await expect(order.validate()).rejects.toThrow();
    });
  });

  describe('Default Values', () => {
    it('should default status to OPEN', () => {
      const order = new Order({
        items: [{ quantity: 1 }]
      });

      expect(order.status).toBe('OPEN');
    });

    it('should default order_type to ORDER', () => {
      const order = new Order({
        items: [{ quantity: 1 }]
      });

      expect(order.order_type).toBe('ORDER');
    });

    it('should default priority to NORMAL', () => {
      const order = new Order({
        items: [{ quantity: 1 }]
      });

      expect(order.priority).toBe('NORMAL');
    });

    it('should default payment_status to UNPAID', () => {
      const order = new Order({
        items: [{ quantity: 1 }]
      });

      expect(order.payment_status).toBe('UNPAID');
    });

    it('should default subtotal to 0', () => {
      const order = new Order({
        items: [{ quantity: 1 }]
      });

      expect(order.subtotal).toBe(0);
    });

    it('should default total_amount to 0', () => {
      const order = new Order({
        items: [{ quantity: 1 }]
      });

      expect(order.total_amount).toBe(0);
    });

    it('should default payment_received to 0', () => {
      const order = new Order({
        items: [{ quantity: 1 }]
      });

      expect(order.payment_received).toBe(0);
    });

    it('should default total_quantity to 0', () => {
      const order = new Order({
        items: [{ quantity: 1 }]
      });

      expect(order.total_quantity).toBe(0);
    });

    it('should default dispatched_quantity to 0', () => {
      const order = new Order({
        items: [{ quantity: 1 }]
      });

      expect(order.dispatched_quantity).toBe(0);
    });

    it('should default pending_quantity to 0', () => {
      const order = new Order({
        items: [{ quantity: 1 }]
      });

      expect(order.pending_quantity).toBe(0);
    });
  });

  describe('Status Validation', () => {
    const validStatuses = ['PENDING', 'QUOTED', 'CONVERTED', 'OPEN', 'PROCESSING', 'DISPATCHED', 'DELIVERED', 'CANCELLED'];

    validStatuses.forEach(status => {
      it(`should accept ${status} status`, async () => {
        const order = new Order({
          items: [{ quantity: 1 }],
          status
        });

        await order.validate();
        expect(order.status).toBe(status);
      });
    });

    it('should reject invalid status', async () => {
      const order = new Order({
        items: [{ quantity: 1 }],
        status: 'INVALID_STATUS'
      });

      await expect(order.validate()).rejects.toThrow();
    });
  });

  describe('Order Type Validation', () => {
    it('should accept ORDER type', async () => {
      const order = new Order({
        items: [{ quantity: 1 }],
        order_type: 'ORDER'
      });

      await order.validate();
      expect(order.order_type).toBe('ORDER');
    });

    it('should accept QUOTE_REQUEST type', async () => {
      const order = new Order({
        items: [{ quantity: 1 }],
        order_type: 'QUOTE_REQUEST'
      });

      await order.validate();
      expect(order.order_type).toBe('QUOTE_REQUEST');
    });

    it('should reject invalid order_type', async () => {
      const order = new Order({
        items: [{ quantity: 1 }],
        order_type: 'INVALID'
      });

      await expect(order.validate()).rejects.toThrow();
    });
  });

  describe('Priority Validation', () => {
    it('should accept LOW priority', async () => {
      const order = new Order({
        items: [{ quantity: 1 }],
        priority: 'LOW'
      });

      await order.validate();
      expect(order.priority).toBe('LOW');
    });

    it('should accept NORMAL priority', async () => {
      const order = new Order({
        items: [{ quantity: 1 }],
        priority: 'NORMAL'
      });

      await order.validate();
      expect(order.priority).toBe('NORMAL');
    });

    it('should accept HIGH priority', async () => {
      const order = new Order({
        items: [{ quantity: 1 }],
        priority: 'HIGH'
      });

      await order.validate();
      expect(order.priority).toBe('HIGH');
    });

    it('should reject invalid priority', async () => {
      const order = new Order({
        items: [{ quantity: 1 }],
        priority: 'URGENT'
      });

      await expect(order.validate()).rejects.toThrow();
    });
  });

  describe('Payment Status Validation', () => {
    it('should accept UNPAID status', async () => {
      const order = new Order({
        items: [{ quantity: 1 }],
        payment_status: 'UNPAID'
      });

      await order.validate();
      expect(order.payment_status).toBe('UNPAID');
    });

    it('should accept PARTIAL status', async () => {
      const order = new Order({
        items: [{ quantity: 1 }],
        payment_status: 'PARTIAL'
      });

      await order.validate();
      expect(order.payment_status).toBe('PARTIAL');
    });

    it('should accept PAID status', async () => {
      const order = new Order({
        items: [{ quantity: 1 }],
        payment_status: 'PAID'
      });

      await order.validate();
      expect(order.payment_status).toBe('PAID');
    });

    it('should reject invalid payment_status', async () => {
      const order = new Order({
        items: [{ quantity: 1 }],
        payment_status: 'INVALID'
      });

      await expect(order.validate()).rejects.toThrow();
    });
  });

  describe('Auto-generated IDs', () => {
    it('should generate order_id with ORD prefix', async () => {
      const order = new Order({
        items: [{ quantity: 1 }]
      });

      await order.save();

      expect(order.order_id).toMatch(/^ORD-\d{5}$/);
    });

    it('should generate po_number with PO and year prefix', async () => {
      const order = new Order({
        items: [{ quantity: 1 }]
      });

      await order.save();

      const year = new Date().getFullYear();
      expect(order.po_number).toMatch(new RegExp(`^PO${year}\\d{4}$`));
    });

    it('should increment order_id for subsequent orders', async () => {
      const order1 = new Order({
        items: [{ quantity: 1 }]
      });
      await order1.save();

      const order2 = new Order({
        items: [{ quantity: 2 }]
      });
      await order2.save();

      const num1 = parseInt(order1.order_id.split('-')[1], 10);
      const num2 = parseInt(order2.order_id.split('-')[1], 10);

      expect(num2).toBe(num1 + 1);
    });
  });

  describe('Order Items', () => {
    it('should store multiple items', async () => {
      const order = new Order({
        items: [
          { part_number: 'PN-001', quantity: 5, unit_price: 10 },
          { part_number: 'PN-002', quantity: 3, unit_price: 20 }
        ]
      });

      await order.validate();
      expect(order.items).toHaveLength(2);
    });

    it('should default unit_price to 0', () => {
      const order = new Order({
        items: [{ quantity: 1 }]
      });

      expect(order.items[0].unit_price).toBe(0);
    });

    it('should default total_price to 0', () => {
      const order = new Order({
        items: [{ quantity: 1 }]
      });

      expect(order.items[0].total_price).toBe(0);
    });

    it('should not allow negative unit_price', async () => {
      const order = new Order({
        items: [{ quantity: 1, unit_price: -10 }]
      });

      await expect(order.validate()).rejects.toThrow();
    });
  });

  describe('Shipping Address', () => {
    it('should store shipping_address correctly', async () => {
      const order = new Order({
        items: [{ quantity: 1 }],
        shipping_address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'USA'
        }
      });

      await order.validate();

      expect(order.shipping_address.street).toBe('123 Main St');
      expect(order.shipping_address.city).toBe('New York');
    });
  });

  describe('Dispatch Info', () => {
    it('should store dispatch_info correctly', async () => {
      const order = new Order({
        items: [{ quantity: 1 }],
        dispatch_info: {
          dispatch_date: new Date(),
          courier_service: 'FedEx',
          tracking_number: 'TRACK123456',
          dispatch_notes: 'Handle with care'
        }
      });

      await order.validate();

      expect(order.dispatch_info.courier_service).toBe('FedEx');
      expect(order.dispatch_info.tracking_number).toBe('TRACK123456');
    });
  });

  describe('Payment History', () => {
    it('should store payment_history correctly', async () => {
      const order = new Order({
        items: [{ quantity: 1 }],
        payment_history: [
          {
            amount: 500,
            payment_method: 'WIRE TRANSFER',
            payment_date: new Date(),
            notes: 'First payment'
          }
        ]
      });

      await order.validate();

      expect(order.payment_history).toHaveLength(1);
      expect(order.payment_history[0].amount).toBe(500);
    });
  });

  describe('Dispatch History', () => {
    it('should store dispatch_history correctly', async () => {
      const order = new Order({
        items: [{ quantity: 10 }],
        dispatch_history: [
          {
            dispatch_id: 'DSP-001',
            dispatch_date: new Date(),
            items: [
              { product_id: 'PRD-001', quantity: 5, unit_price: 10 }
            ],
            total_quantity: 5,
            total_amount: 50,
            invoice_number: 'INV-001',
            invoice_generated: true
          }
        ]
      });

      await order.validate();

      expect(order.dispatch_history).toHaveLength(1);
      expect(order.dispatch_history[0].dispatch_id).toBe('DSP-001');
    });
  });

  describe('Customer Info', () => {
    it('should store customer info for quote requests', async () => {
      const order = new Order({
        items: [{ quantity: 1 }],
        order_type: 'QUOTE_REQUEST',
        customer_id: 'USR-001',
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        customer_notes: 'Urgent requirement'
      });

      await order.validate();

      expect(order.customer_name).toBe('John Doe');
      expect(order.customer_email).toBe('john@example.com');
    });
  });

  describe('References', () => {
    it('should accept buyer reference', async () => {
      const buyerId = new mongoose.Types.ObjectId();
      const order = new Order({
        items: [{ quantity: 1 }],
        buyer: buyerId
      });

      await order.validate();
      expect(order.buyer.toString()).toBe(buyerId.toString());
    });

    it('should accept quotation reference', async () => {
      const quotationId = new mongoose.Types.ObjectId();
      const order = new Order({
        items: [{ quantity: 1 }],
        quotation: quotationId
      });

      await order.validate();
      expect(order.quotation.toString()).toBe(quotationId.toString());
    });

    it('should accept proforma_invoice reference', async () => {
      const piId = new mongoose.Types.ObjectId();
      const order = new Order({
        items: [{ quantity: 1 }],
        proforma_invoice: piId,
        pi_number: 'PI2024001'
      });

      await order.validate();
      expect(order.proforma_invoice.toString()).toBe(piId.toString());
    });
  });

  describe('Timestamps', () => {
    it('should have order_date default to now', () => {
      const order = new Order({
        items: [{ quantity: 1 }]
      });

      expect(order.order_date).toBeDefined();
      expect(order.order_date instanceof Date).toBe(true);
    });
  });
});
