import mongoose from 'mongoose';
import Quotation from '../../../src/modules/quotations/quotations.model.js';

describe('Quotation Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid quotation with minimal fields', async () => {
      const quotation = new Quotation({
        items: [{
          part_number: 'PN-001',
          product_name: 'Test Product',
          quantity: 5,
          unit_price: 10,
          total_price: 50
        }]
      });

      await quotation.validate();
      expect(quotation.items).toHaveLength(1);
    });

    it('should require quantity in items', async () => {
      const quotation = new Quotation({
        items: [{
          part_number: 'PN-001',
          product_name: 'Test Product',
          unit_price: 10
        }]
      });

      await expect(quotation.validate()).rejects.toThrow();
    });

    it('should require minimum quantity of 1', async () => {
      const quotation = new Quotation({
        items: [{
          part_number: 'PN-001',
          product_name: 'Test Product',
          quantity: 0
        }]
      });

      await expect(quotation.validate()).rejects.toThrow();
    });
  });

  describe('Default Values', () => {
    it('should default status to DRAFT', () => {
      const quotation = new Quotation({
        items: [{ quantity: 1 }]
      });

      expect(quotation.status).toBe('DRAFT');
    });

    it('should default subtotal to 0', () => {
      const quotation = new Quotation({
        items: [{ quantity: 1 }]
      });

      expect(quotation.subtotal).toBe(0);
    });

    it('should default tax to 0', () => {
      const quotation = new Quotation({
        items: [{ quantity: 1 }]
      });

      expect(quotation.tax).toBe(0);
    });

    it('should default shipping to 0', () => {
      const quotation = new Quotation({
        items: [{ quantity: 1 }]
      });

      expect(quotation.shipping).toBe(0);
    });

    it('should default total_amount to 0', () => {
      const quotation = new Quotation({
        items: [{ quantity: 1 }]
      });

      expect(quotation.total_amount).toBe(0);
    });

    it('should default is_emailed to false', () => {
      const quotation = new Quotation({
        items: [{ quantity: 1 }]
      });

      expect(quotation.is_emailed).toBe(false);
    });

    it('should default email_count to 0', () => {
      const quotation = new Quotation({
        items: [{ quantity: 1 }]
      });

      expect(quotation.email_count).toBe(0);
    });

    it('should default logistic_charges to 0', () => {
      const quotation = new Quotation({
        items: [{ quantity: 1 }]
      });

      expect(quotation.logistic_charges).toBe(0);
    });

    it('should default custom_duty to 0', () => {
      const quotation = new Quotation({
        items: [{ quantity: 1 }]
      });

      expect(quotation.custom_duty).toBe(0);
    });

    it('should default bank_charges to 0', () => {
      const quotation = new Quotation({
        items: [{ quantity: 1 }]
      });

      expect(quotation.bank_charges).toBe(0);
    });
  });

  describe('Status Validation', () => {
    const validStatuses = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED'];

    validStatuses.forEach(status => {
      it(`should accept ${status} status`, async () => {
        const quotation = new Quotation({
          items: [{ quantity: 1 }],
          status
        });

        await quotation.validate();
        expect(quotation.status).toBe(status);
      });
    });

    it('should reject invalid status', async () => {
      const quotation = new Quotation({
        items: [{ quantity: 1 }],
        status: 'INVALID_STATUS'
      });

      await expect(quotation.validate()).rejects.toThrow();
    });
  });

  describe('Auto-generated quote_number', () => {
    it('should generate quote_number with Q and year prefix', async () => {
      const quotation = new Quotation({
        items: [{ quantity: 1 }]
      });

      await quotation.save();

      const year = new Date().getFullYear();
      expect(quotation.quote_number).toMatch(new RegExp(`^Q${year}\\d{4}$`));
    });

    it('should increment quote_number for subsequent quotations', async () => {
      const quotation1 = new Quotation({
        items: [{ quantity: 1 }]
      });
      await quotation1.save();

      const quotation2 = new Quotation({
        items: [{ quantity: 2 }]
      });
      await quotation2.save();

      const year = new Date().getFullYear();
      const num1 = parseInt(quotation1.quote_number.replace(`Q${year}`, ''), 10);
      const num2 = parseInt(quotation2.quote_number.replace(`Q${year}`, ''), 10);

      expect(num2).toBe(num1 + 1);
    });
  });

  describe('Quotation Items', () => {
    it('should store multiple items', async () => {
      const quotation = new Quotation({
        items: [
          { part_number: 'PN-001', quantity: 5, unit_price: 10 },
          { part_number: 'PN-002', quantity: 3, unit_price: 20 }
        ]
      });

      await quotation.validate();
      expect(quotation.items).toHaveLength(2);
    });

    it('should default unit_price to 0', () => {
      const quotation = new Quotation({
        items: [{ quantity: 1 }]
      });

      expect(quotation.items[0].unit_price).toBe(0);
    });

    it('should default total_price to 0', () => {
      const quotation = new Quotation({
        items: [{ quantity: 1 }]
      });

      expect(quotation.items[0].total_price).toBe(0);
    });

    it('should not allow negative unit_price', async () => {
      const quotation = new Quotation({
        items: [{ quantity: 1, unit_price: -10 }]
      });

      await expect(quotation.validate()).rejects.toThrow();
    });

    it('should not allow negative total_price', async () => {
      const quotation = new Quotation({
        items: [{ quantity: 1, total_price: -50 }]
      });

      await expect(quotation.validate()).rejects.toThrow();
    });
  });

  describe('References', () => {
    it('should accept buyer reference', async () => {
      const buyerId = new mongoose.Types.ObjectId();
      const quotation = new Quotation({
        items: [{ quantity: 1 }],
        buyer: buyerId
      });

      await quotation.validate();
      expect(quotation.buyer.toString()).toBe(buyerId.toString());
    });

    it('should accept source_order reference', async () => {
      const orderId = new mongoose.Types.ObjectId();
      const quotation = new Quotation({
        items: [{ quantity: 1 }],
        source_order: orderId
      });

      await quotation.validate();
      expect(quotation.source_order.toString()).toBe(orderId.toString());
    });

    it('should accept converted_to_order reference', async () => {
      const orderId = new mongoose.Types.ObjectId();
      const quotation = new Quotation({
        items: [{ quantity: 1 }],
        converted_to_order: orderId
      });

      await quotation.validate();
      expect(quotation.converted_to_order.toString()).toBe(orderId.toString());
    });

    it('should accept purchase_order reference', async () => {
      const poId = new mongoose.Types.ObjectId();
      const quotation = new Quotation({
        items: [{ quantity: 1 }],
        purchase_order: poId
      });

      await quotation.validate();
      expect(quotation.purchase_order.toString()).toBe(poId.toString());
    });
  });

  describe('Customer Info', () => {
    it('should store customer info correctly', async () => {
      const quotation = new Quotation({
        items: [{ quantity: 1 }],
        customer_id: 'USR-001',
        customer_name: 'John Doe',
        customer_email: 'john@example.com'
      });

      await quotation.validate();

      expect(quotation.customer_name).toBe('John Doe');
      expect(quotation.customer_email).toBe('john@example.com');
    });
  });

  describe('Shipping Address', () => {
    it('should store shipping_address correctly', async () => {
      const quotation = new Quotation({
        items: [{ quantity: 1 }],
        shipping_address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'USA'
        }
      });

      await quotation.validate();

      expect(quotation.shipping_address.street).toBe('123 Main St');
      expect(quotation.shipping_address.city).toBe('New York');
    });
  });

  describe('Additional Charges', () => {
    it('should store additional charges correctly', async () => {
      const quotation = new Quotation({
        items: [{ quantity: 1 }],
        logistic_charges: 500,
        custom_duty: 200,
        debet_note: 50,
        bank_charges: 25
      });

      await quotation.validate();

      expect(quotation.logistic_charges).toBe(500);
      expect(quotation.custom_duty).toBe(200);
      expect(quotation.debet_note).toBe(50);
      expect(quotation.bank_charges).toBe(25);
    });
  });

  describe('Status Timestamps', () => {
    it('should store accepted_at date', async () => {
      const acceptedDate = new Date();
      const quotation = new Quotation({
        items: [{ quantity: 1 }],
        status: 'ACCEPTED',
        accepted_at: acceptedDate
      });

      await quotation.validate();
      expect(quotation.accepted_at).toEqual(acceptedDate);
    });

    it('should store rejected_at date and reason', async () => {
      const rejectedDate = new Date();
      const quotation = new Quotation({
        items: [{ quantity: 1 }],
        status: 'REJECTED',
        rejected_at: rejectedDate,
        rejection_reason: 'Price too high'
      });

      await quotation.validate();

      expect(quotation.rejected_at).toEqual(rejectedDate);
      expect(quotation.rejection_reason).toBe('Price too high');
    });

    it('should store converted_date', async () => {
      const convertedDate = new Date();
      const quotation = new Quotation({
        items: [{ quantity: 1 }],
        status: 'CONVERTED',
        converted_date: convertedDate
      });

      await quotation.validate();
      expect(quotation.converted_date).toEqual(convertedDate);
    });
  });

  describe('Email Tracking', () => {
    it('should track email status correctly', async () => {
      const emailDate = new Date();
      const quotation = new Quotation({
        items: [{ quantity: 1 }],
        is_emailed: true,
        last_emailed_at: emailDate,
        email_count: 3
      });

      await quotation.validate();

      expect(quotation.is_emailed).toBe(true);
      expect(quotation.last_emailed_at).toEqual(emailDate);
      expect(quotation.email_count).toBe(3);
    });
  });

  describe('Expiry Date', () => {
    it('should store expiry_date correctly', async () => {
      const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      const quotation = new Quotation({
        items: [{ quantity: 1 }],
        expiry_date: expiryDate
      });

      await quotation.validate();
      expect(quotation.expiry_date).toEqual(expiryDate);
    });
  });

  describe('Exchange Rate', () => {
    it('should store exchange_rate correctly', async () => {
      const quotation = new Quotation({
        items: [{ quantity: 1 }],
        exchange_rate: 83.5
      });

      await quotation.validate();
      expect(quotation.exchange_rate).toBe(83.5);
    });
  });

  describe('Notes', () => {
    it('should store notes correctly', async () => {
      const quotation = new Quotation({
        items: [{ quantity: 1 }],
        notes: 'Customer specific notes',
        admin_notes: 'Internal admin notes'
      });

      await quotation.validate();

      expect(quotation.notes).toBe('Customer specific notes');
      expect(quotation.admin_notes).toBe('Internal admin notes');
    });
  });

  describe('Unique Constraints', () => {
    it('should not allow duplicate quote_numbers', async () => {
      const quotation1 = new Quotation({
        items: [{ quantity: 1 }]
      });
      await quotation1.save();

      const quotation2 = new Quotation({
        items: [{ quantity: 2 }],
        quote_number: quotation1.quote_number
      });

      await expect(quotation2.save()).rejects.toThrow();
    });
  });
});
