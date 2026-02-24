import mongoose from 'mongoose';
import ProformaInvoice from '../../../src/modules/proformaInvoices/proformaInvoices.model.js';

describe('ProformaInvoice Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid proforma invoice with minimal fields', async () => {
      const pi = new ProformaInvoice({
        items: [{
          part_number: 'PN-001',
          product_name: 'Test Product',
          quantity: 5,
          unit_price: 100,
          total_price: 500
        }]
      });

      await pi.validate();
      expect(pi.items).toHaveLength(1);
    });

    it('should require quantity in items', async () => {
      const pi = new ProformaInvoice({
        items: [{
          part_number: 'PN-001',
          product_name: 'Test Product',
          unit_price: 100
        }]
      });

      await expect(pi.validate()).rejects.toThrow();
    });

    it('should require minimum quantity of 1', async () => {
      const pi = new ProformaInvoice({
        items: [{
          part_number: 'PN-001',
          quantity: 0,
          unit_price: 100
        }]
      });

      await expect(pi.validate()).rejects.toThrow();
    });
  });

  describe('Default Values', () => {
    it('should default status to PENDING', () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 1 }]
      });

      expect(pi.status).toBe('PENDING');
    });

    it('should default currency to USD', () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 1 }]
      });

      expect(pi.currency).toBe('USD');
    });

    it('should default exchange_rate to 83.5', () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 1 }]
      });

      expect(pi.exchange_rate).toBe(83.5);
    });

    it('should default delivery_terms to Ex-Works', () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 1 }]
      });

      expect(pi.delivery_terms).toBe('Ex-Works');
    });

    it('should default payment_terms to 100% Advance', () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 1 }]
      });

      expect(pi.payment_terms).toBe('100% Advance');
    });

    it('should default financial values to 0', () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 1 }]
      });

      expect(pi.subtotal).toBe(0);
      expect(pi.tax).toBe(0);
      expect(pi.shipping).toBe(0);
      expect(pi.total_amount).toBe(0);
      expect(pi.payment_received).toBe(0);
    });

    it('should default payment_status to UNPAID', () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 1 }]
      });

      expect(pi.payment_status).toBe('UNPAID');
    });

    it('should default dispatch_status to NONE', () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 1 }]
      });

      expect(pi.dispatch_status).toBe('NONE');
    });

    it('should default dispatched to false', () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 1 }]
      });

      expect(pi.dispatched).toBe(false);
    });

    it('should default invoice_generated to false', () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 1 }]
      });

      expect(pi.invoice_generated).toBe(false);
    });

    it('should default allocation_complete to false', () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 1 }]
      });

      expect(pi.allocation_complete).toBe(false);
    });

    it('should default is_emailed to false', () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 1 }]
      });

      expect(pi.is_emailed).toBe(false);
    });

    it('should default quantity tracking fields to 0', () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 1 }]
      });

      expect(pi.total_quantity).toBe(0);
      expect(pi.dispatched_quantity).toBe(0);
      expect(pi.pending_quantity).toBe(0);
      expect(pi.dispatch_count).toBe(0);
    });

    it('should default additional charges to 0', () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 1 }]
      });

      expect(pi.logistic_charges).toBe(0);
      expect(pi.custom_duty).toBe(0);
      expect(pi.bank_charges).toBe(0);
      expect(pi.other_charges).toBe(0);
      expect(pi.debit_note).toBe(0);
    });
  });

  describe('Status Validation', () => {
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'SENT'];

    validStatuses.forEach(status => {
      it(`should accept ${status} status`, async () => {
        const pi = new ProformaInvoice({
          items: [{ quantity: 1 }],
          status
        });

        await pi.validate();
        expect(pi.status).toBe(status);
      });
    });

    it('should reject invalid status', async () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 1 }],
        status: 'INVALID'
      });

      await expect(pi.validate()).rejects.toThrow();
    });
  });

  describe('Currency Validation', () => {
    const validCurrencies = ['USD', 'INR', 'EUR', 'GBP'];

    validCurrencies.forEach(currency => {
      it(`should accept ${currency} currency`, async () => {
        const pi = new ProformaInvoice({
          items: [{ quantity: 1 }],
          currency
        });

        await pi.validate();
        expect(pi.currency).toBe(currency);
      });
    });

    it('should reject invalid currency', async () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 1 }],
        currency: 'INVALID'
      });

      await expect(pi.validate()).rejects.toThrow();
    });
  });

  describe('Payment Status Validation', () => {
    const validStatuses = ['UNPAID', 'PARTIAL', 'PAID'];

    validStatuses.forEach(status => {
      it(`should accept ${status} payment status`, async () => {
        const pi = new ProformaInvoice({
          items: [{ quantity: 1 }],
          payment_status: status
        });

        await pi.validate();
        expect(pi.payment_status).toBe(status);
      });
    });

    it('should reject invalid payment_status', async () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 1 }],
        payment_status: 'INVALID'
      });

      await expect(pi.validate()).rejects.toThrow();
    });
  });

  describe('Dispatch Status Validation', () => {
    const validStatuses = ['NONE', 'PARTIAL', 'FULL'];

    validStatuses.forEach(status => {
      it(`should accept ${status} dispatch status`, async () => {
        const pi = new ProformaInvoice({
          items: [{ quantity: 1 }],
          dispatch_status: status
        });

        await pi.validate();
        expect(pi.dispatch_status).toBe(status);
      });
    });

    it('should reject invalid dispatch_status', async () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 1 }],
        dispatch_status: 'INVALID'
      });

      await expect(pi.validate()).rejects.toThrow();
    });
  });

  describe('Auto-generated proforma_number', () => {
    it('should generate proforma_number with PI prefix', async () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 1 }]
      });

      await pi.save();

      expect(pi.proforma_number).toMatch(/^PI-\d{5}$/);
    });

    it('should increment proforma_number for subsequent PIs', async () => {
      const pi1 = new ProformaInvoice({
        items: [{ quantity: 1 }]
      });
      await pi1.save();

      const pi2 = new ProformaInvoice({
        items: [{ quantity: 2 }]
      });
      await pi2.save();

      const num1 = parseInt(pi1.proforma_number.split('-')[1], 10);
      const num2 = parseInt(pi2.proforma_number.split('-')[1], 10);

      expect(num2).toBe(num1 + 1);
    });
  });

  describe('Item Allocation Status', () => {
    const validStatuses = ['UNALLOCATED', 'PARTIAL', 'ALLOCATED'];

    validStatuses.forEach(status => {
      it(`should accept ${status} allocation status`, async () => {
        const pi = new ProformaInvoice({
          items: [{
            quantity: 1,
            allocation_status: status
          }]
        });

        await pi.validate();
        expect(pi.items[0].allocation_status).toBe(status);
      });
    });

    it('should default item allocation_status to UNALLOCATED', () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 1 }]
      });

      expect(pi.items[0].allocation_status).toBe('UNALLOCATED');
    });

    it('should default item allocated_qty to 0', () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 1 }]
      });

      expect(pi.items[0].allocated_qty).toBe(0);
    });
  });

  describe('Total Quantity Calculation', () => {
    it('should calculate total_quantity from items on save', async () => {
      const pi = new ProformaInvoice({
        items: [
          { quantity: 10 },
          { quantity: 20 },
          { quantity: 15 }
        ]
      });

      await pi.save();

      expect(pi.total_quantity).toBe(45);
    });

    it('should calculate pending_quantity on save', async () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 50 }],
        dispatched_quantity: 20
      });

      await pi.save();

      expect(pi.pending_quantity).toBe(30);
    });
  });

  describe('Dispatch Status Auto-Update', () => {
    it('should set dispatch_status to NONE when dispatched_quantity is 0', async () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 50 }],
        dispatched_quantity: 0
      });

      await pi.save();

      expect(pi.dispatch_status).toBe('NONE');
    });

    it('should set dispatch_status to PARTIAL when partially dispatched', async () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 50 }],
        dispatched_quantity: 25
      });

      await pi.save();

      expect(pi.dispatch_status).toBe('PARTIAL');
    });

    it('should set dispatch_status to FULL when fully dispatched', async () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 50 }],
        dispatched_quantity: 50
      });

      await pi.save();

      expect(pi.dispatch_status).toBe('FULL');
      expect(pi.dispatched).toBe(true);
    });
  });

  describe('Proforma Items', () => {
    it('should store multiple items', async () => {
      const pi = new ProformaInvoice({
        items: [
          { part_number: 'PN-001', quantity: 5, unit_price: 100, total_price: 500 },
          { part_number: 'PN-002', quantity: 3, unit_price: 200, total_price: 600 }
        ]
      });

      await pi.validate();
      expect(pi.items).toHaveLength(2);
    });

    it('should default item unit_price to 0', () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 1 }]
      });

      expect(pi.items[0].unit_price).toBe(0);
    });

    it('should default item total_price to 0', () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 1 }]
      });

      expect(pi.items[0].total_price).toBe(0);
    });

    it('should not allow negative unit_price', async () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 1, unit_price: -100 }]
      });

      await expect(pi.validate()).rejects.toThrow();
    });

    it('should not allow negative total_price', async () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 1, total_price: -100 }]
      });

      await expect(pi.validate()).rejects.toThrow();
    });
  });

  describe('Address Schema', () => {
    it('should store billing_address correctly', async () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 1 }],
        billing_address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'USA'
        }
      });

      await pi.validate();

      expect(pi.billing_address.street).toBe('123 Main St');
      expect(pi.billing_address.city).toBe('New York');
    });

    it('should store shipping_address correctly', async () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 1 }],
        shipping_address: {
          street: '456 Port Road',
          city: 'Los Angeles',
          state: 'CA',
          zip: '90001',
          country: 'USA'
        }
      });

      await pi.validate();

      expect(pi.shipping_address.city).toBe('Los Angeles');
    });
  });

  describe('References', () => {
    it('should accept quotation reference', async () => {
      const quotationId = new mongoose.Types.ObjectId();
      const pi = new ProformaInvoice({
        items: [{ quantity: 1 }],
        quotation: quotationId,
        quote_number: 'QT-00001'
      });

      await pi.validate();
      expect(pi.quotation.toString()).toBe(quotationId.toString());
    });

    it('should accept buyer reference', async () => {
      const buyerId = new mongoose.Types.ObjectId();
      const pi = new ProformaInvoice({
        items: [{ quantity: 1 }],
        buyer: buyerId,
        buyer_name: 'John Doe',
        buyer_email: 'john@example.com'
      });

      await pi.validate();
      expect(pi.buyer.toString()).toBe(buyerId.toString());
    });

    it('should accept invoice reference', async () => {
      const invoiceId = new mongoose.Types.ObjectId();
      const pi = new ProformaInvoice({
        items: [{ quantity: 1 }],
        invoice: invoiceId,
        invoice_number: 'INV-00001',
        invoice_generated: true
      });

      await pi.validate();
      expect(pi.invoice.toString()).toBe(invoiceId.toString());
    });
  });

  describe('Payment History', () => {
    it('should store payment_history correctly', async () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 1 }],
        payment_history: [{
          payment_id: 'PAY-001',
          amount: 5000,
          currency: 'USD',
          amount_usd: 5000,
          exchange_rate_at_payment: 83.5,
          payment_method: 'WIRE',
          transaction_id: 'TXN123',
          payment_date: new Date(),
          notes: 'First payment'
        }]
      });

      await pi.validate();

      expect(pi.payment_history).toHaveLength(1);
      expect(pi.payment_history[0].amount).toBe(5000);
    });
  });

  describe('Dispatch Details', () => {
    it('should store dispatch_details correctly', async () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 1 }],
        dispatch_details: {
          tracking_number: 'TRACK123',
          courier: 'FedEx',
          notes: 'Handle with care'
        }
      });

      await pi.validate();

      expect(pi.dispatch_details.tracking_number).toBe('TRACK123');
      expect(pi.dispatch_details.courier).toBe('FedEx');
    });
  });

  describe('Timestamps', () => {
    it('should have issue_date default to now', () => {
      const pi = new ProformaInvoice({
        items: [{ quantity: 1 }]
      });

      expect(pi.issue_date).toBeDefined();
      expect(pi.issue_date instanceof Date).toBe(true);
    });
  });
});
