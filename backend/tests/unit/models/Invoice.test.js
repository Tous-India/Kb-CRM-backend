import mongoose from 'mongoose';
import Invoice from '../../../src/modules/invoices/invoices.model.js';

describe('Invoice Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid invoice with minimal fields', async () => {
      const invoice = new Invoice({
        items: [{
          part_number: 'PN-001',
          product_name: 'Test Product',
          quantity: 5,
          unit_price: 100,
          total_price: 500
        }]
      });

      await invoice.validate();
      expect(invoice.items).toHaveLength(1);
    });

    it('should require quantity in items', async () => {
      const invoice = new Invoice({
        items: [{
          part_number: 'PN-001',
          product_name: 'Test Product',
          unit_price: 100,
          total_price: 500
        }]
      });

      await expect(invoice.validate()).rejects.toThrow();
    });

    it('should require minimum quantity of 1', async () => {
      const invoice = new Invoice({
        items: [{
          part_number: 'PN-001',
          quantity: 0,
          unit_price: 100,
          total_price: 0
        }]
      });

      await expect(invoice.validate()).rejects.toThrow();
    });

    it('should require unit_price in items', async () => {
      const invoice = new Invoice({
        items: [{
          part_number: 'PN-001',
          quantity: 5
        }]
      });

      await expect(invoice.validate()).rejects.toThrow();
    });

    it('should require total_price in items', async () => {
      const invoice = new Invoice({
        items: [{
          part_number: 'PN-001',
          quantity: 5,
          unit_price: 100
        }]
      });

      await expect(invoice.validate()).rejects.toThrow();
    });
  });

  describe('Default Values', () => {
    it('should default invoice_type to TAX_INVOICE', () => {
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }]
      });

      expect(invoice.invoice_type).toBe('TAX_INVOICE');
    });

    it('should default source to MANUAL', () => {
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }]
      });

      expect(invoice.source).toBe('MANUAL');
    });

    it('should default status to UNPAID', () => {
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }]
      });

      expect(invoice.status).toBe('UNPAID');
    });

    it('should default delivery_status to PENDING', () => {
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }]
      });

      expect(invoice.delivery_status).toBe('PENDING');
    });

    it('should default shipping_method to BYAIR', () => {
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }]
      });

      expect(invoice.shipping_method).toBe('BYAIR');
    });

    it('should default payment_terms to NET_30', () => {
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }]
      });

      expect(invoice.payment_terms).toBe('NET_30');
    });

    it('should default currency to USD', () => {
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }]
      });

      expect(invoice.currency).toBe('USD');
    });

    it('should default exchange_rate to 83.5', () => {
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }]
      });

      expect(invoice.exchange_rate).toBe(83.5);
    });

    it('should default financial values to 0', () => {
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }]
      });

      expect(invoice.subtotal).toBe(0);
      expect(invoice.discount).toBe(0);
      expect(invoice.tax).toBe(0);
      expect(invoice.shipping).toBe(0);
      expect(invoice.total_amount).toBe(0);
      expect(invoice.amount_paid).toBe(0);
      expect(invoice.balance_due).toBe(0);
    });

    it('should default flags to appropriate values', () => {
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }]
      });

      expect(invoice.is_manual).toBe(false);
      expect(invoice.is_editable).toBe(true);
      expect(invoice.is_draft).toBe(false);
      expect(invoice.is_printed).toBe(false);
      expect(invoice.is_emailed).toBe(false);
    });

    it('should default tax_type to IGST', () => {
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }]
      });

      expect(invoice.tax_type).toBe('IGST');
    });
  });

  describe('Invoice Type Validation', () => {
    const validTypes = ['TAX_INVOICE', 'PROFORMA', 'COMMERCIAL', 'EXPORT', 'REIMBURSEMENT', 'BILL_OF_SUPPLY'];

    validTypes.forEach(type => {
      it(`should accept ${type} invoice type`, async () => {
        const invoice = new Invoice({
          items: [{ quantity: 1, unit_price: 100, total_price: 100 }],
          invoice_type: type
        });

        await invoice.validate();
        expect(invoice.invoice_type).toBe(type);
      });
    });

    it('should reject invalid invoice_type', async () => {
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }],
        invoice_type: 'INVALID'
      });

      await expect(invoice.validate()).rejects.toThrow();
    });
  });

  describe('Status Validation', () => {
    const validStatuses = ['DRAFT', 'UNPAID', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED'];

    validStatuses.forEach(status => {
      it(`should accept ${status} status`, async () => {
        const invoice = new Invoice({
          items: [{ quantity: 1, unit_price: 100, total_price: 100 }],
          status
        });

        await invoice.validate();
        expect(invoice.status).toBe(status);
      });
    });

    it('should reject invalid status', async () => {
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }],
        status: 'INVALID'
      });

      await expect(invoice.validate()).rejects.toThrow();
    });
  });

  describe('Delivery Status Validation', () => {
    const validStatuses = ['PENDING', 'PARTIAL', 'DELIVERED', 'RETURNED'];

    validStatuses.forEach(status => {
      it(`should accept ${status} delivery status`, async () => {
        const invoice = new Invoice({
          items: [{ quantity: 1, unit_price: 100, total_price: 100 }],
          delivery_status: status
        });

        await invoice.validate();
        expect(invoice.delivery_status).toBe(status);
      });
    });

    it('should reject invalid delivery_status', async () => {
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }],
        delivery_status: 'INVALID'
      });

      await expect(invoice.validate()).rejects.toThrow();
    });
  });

  describe('Source Validation', () => {
    const validSources = ['ORDER', 'PROFORMA_INVOICE', 'MANUAL'];

    validSources.forEach(source => {
      it(`should accept ${source} source`, async () => {
        const invoice = new Invoice({
          items: [{ quantity: 1, unit_price: 100, total_price: 100 }],
          source
        });

        await invoice.validate();
        expect(invoice.source).toBe(source);
      });
    });

    it('should reject invalid source', async () => {
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }],
        source: 'INVALID'
      });

      await expect(invoice.validate()).rejects.toThrow();
    });
  });

  describe('Shipping Method Validation', () => {
    const validMethods = ['BYAIR', 'BY_SEA', 'BY_ROAD', 'BY_RAIL', 'COURIER', 'HAND_DELIVERY', 'OTHER'];

    validMethods.forEach(method => {
      it(`should accept ${method} shipping method`, async () => {
        const invoice = new Invoice({
          items: [{ quantity: 1, unit_price: 100, total_price: 100 }],
          shipping_method: method
        });

        await invoice.validate();
        expect(invoice.shipping_method).toBe(method);
      });
    });

    it('should reject invalid shipping_method', async () => {
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }],
        shipping_method: 'INVALID'
      });

      await expect(invoice.validate()).rejects.toThrow();
    });
  });

  describe('Auto-generated invoice_number', () => {
    it('should generate invoice_number with INV prefix', async () => {
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }]
      });

      await invoice.save();

      expect(invoice.invoice_number).toMatch(/^INV-\d{5}$/);
    });

    it('should increment invoice_number for subsequent invoices', async () => {
      const invoice1 = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }]
      });
      await invoice1.save();

      const invoice2 = new Invoice({
        items: [{ quantity: 2, unit_price: 200, total_price: 400 }]
      });
      await invoice2.save();

      const num1 = parseInt(invoice1.invoice_number.split('-')[1], 10);
      const num2 = parseInt(invoice2.invoice_number.split('-')[1], 10);

      expect(num2).toBe(num1 + 1);
    });
  });

  describe('Invoice Items', () => {
    it('should store multiple items', async () => {
      const invoice = new Invoice({
        items: [
          { part_number: 'PN-001', quantity: 5, unit_price: 100, total_price: 500 },
          { part_number: 'PN-002', quantity: 3, unit_price: 200, total_price: 600 }
        ]
      });

      await invoice.validate();
      expect(invoice.items).toHaveLength(2);
    });

    it('should default item UOM to EA', () => {
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }]
      });

      expect(invoice.items[0].uom).toBe('EA');
    });

    it('should default item delivery_status to PENDING', () => {
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }]
      });

      expect(invoice.items[0].delivery_status).toBe('PENDING');
    });

    it('should accept valid item delivery_status', async () => {
      const invoice = new Invoice({
        items: [{
          quantity: 1,
          unit_price: 100,
          total_price: 100,
          delivery_status: 'DELIVERED'
        }]
      });

      await invoice.validate();
      expect(invoice.items[0].delivery_status).toBe('DELIVERED');
    });

    it('should not allow negative unit_price', async () => {
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: -100, total_price: 100 }]
      });

      await expect(invoice.validate()).rejects.toThrow();
    });

    it('should not allow negative total_price', async () => {
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: -100 }]
      });

      await expect(invoice.validate()).rejects.toThrow();
    });
  });

  describe('INR Calculation on Save', () => {
    it('should calculate INR amounts using exchange rate', async () => {
      const invoice = new Invoice({
        items: [{ quantity: 10, unit_price: 100, total_price: 1000 }],
        subtotal: 1000,
        total_amount: 1000,
        exchange_rate: 83.5
      });

      await invoice.save();

      expect(invoice.subtotal_inr).toBe(83500);
      expect(invoice.total_amount_inr).toBe(83500);
    });

    it('should calculate item INR prices', async () => {
      const invoice = new Invoice({
        items: [{
          quantity: 10,
          unit_price: 100,
          total_price: 1000
        }],
        exchange_rate: 83.5
      });

      await invoice.save();

      expect(invoice.items[0].unit_price_inr).toBe(8350);
      expect(invoice.items[0].total_price_inr).toBe(83500);
    });

    it('should use custom exchange rate', async () => {
      const invoice = new Invoice({
        items: [{ quantity: 10, unit_price: 100, total_price: 1000 }],
        subtotal: 1000,
        exchange_rate: 85.0
      });

      await invoice.save();

      expect(invoice.subtotal_inr).toBe(85000);
    });
  });

  describe('Company Details', () => {
    it('should store company details correctly', async () => {
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }],
        company_details: {
          company_name: 'Test Company',
          gstin: 'GSTIN123456',
          pan: 'ABCDE1234F',
          city: 'Mumbai',
          country: 'India'
        }
      });

      await invoice.validate();

      expect(invoice.company_details.company_name).toBe('Test Company');
      expect(invoice.company_details.gstin).toBe('GSTIN123456');
    });
  });

  describe('Bill To / Ship To', () => {
    it('should store bill_to details correctly', async () => {
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }],
        bill_to: {
          company_name: 'Customer Corp',
          address_line1: '123 Main St',
          city: 'New York',
          country: 'USA'
        }
      });

      await invoice.validate();

      expect(invoice.bill_to.company_name).toBe('Customer Corp');
      expect(invoice.bill_to.city).toBe('New York');
    });

    it('should store ship_to details correctly', async () => {
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }],
        ship_to: {
          company_name: 'Warehouse Inc',
          address_line1: '456 Port Road',
          city: 'Los Angeles',
          country: 'USA'
        }
      });

      await invoice.validate();

      expect(invoice.ship_to.company_name).toBe('Warehouse Inc');
    });
  });

  describe('Bank Details', () => {
    it('should store bank details correctly', async () => {
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }],
        bank_details: {
          bank_name: 'Test Bank',
          account_number: '1234567890',
          ifsc_code: 'TEST0001234',
          swift_code: 'TESTUS33'
        }
      });

      await invoice.validate();

      expect(invoice.bank_details.bank_name).toBe('Test Bank');
      expect(invoice.bank_details.swift_code).toBe('TESTUS33');
    });
  });

  describe('Tax Type Validation', () => {
    const validTypes = ['IGST', 'CGST_SGST', 'EXEMPT', 'NONE'];

    validTypes.forEach(type => {
      it(`should accept ${type} tax type`, async () => {
        const invoice = new Invoice({
          items: [{ quantity: 1, unit_price: 100, total_price: 100 }],
          tax_type: type
        });

        await invoice.validate();
        expect(invoice.tax_type).toBe(type);
      });
    });
  });

  describe('Discount Type Validation', () => {
    it('should accept fixed discount type', async () => {
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }],
        discount_type: 'fixed',
        discount_value: 50
      });

      await invoice.validate();
      expect(invoice.discount_type).toBe('fixed');
    });

    it('should accept percentage discount type', async () => {
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }],
        discount_type: 'percentage',
        discount_value: 10
      });

      await invoice.validate();
      expect(invoice.discount_type).toBe('percentage');
    });
  });

  describe('References', () => {
    it('should accept order reference', async () => {
      const orderId = new mongoose.Types.ObjectId();
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }],
        order: orderId
      });

      await invoice.validate();
      expect(invoice.order.toString()).toBe(orderId.toString());
    });

    it('should accept proforma_invoice reference', async () => {
      const piId = new mongoose.Types.ObjectId();
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }],
        proforma_invoice: piId,
        proforma_invoice_number: 'PI-00001'
      });

      await invoice.validate();
      expect(invoice.proforma_invoice.toString()).toBe(piId.toString());
    });

    it('should accept buyer reference', async () => {
      const buyerId = new mongoose.Types.ObjectId();
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }],
        buyer: buyerId,
        buyer_name: 'John Doe',
        buyer_email: 'john@example.com'
      });

      await invoice.validate();
      expect(invoice.buyer.toString()).toBe(buyerId.toString());
    });
  });

  describe('Dispatch Info', () => {
    it('should store dispatch_info correctly', async () => {
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }],
        dispatch_info: {
          dispatch_date: new Date(),
          courier_service: 'FedEx',
          tracking_number: 'TRACK123',
          dispatch_notes: 'Handle with care'
        },
        include_dispatch_info: true
      });

      await invoice.validate();

      expect(invoice.dispatch_info.courier_service).toBe('FedEx');
      expect(invoice.include_dispatch_info).toBe(true);
    });
  });

  describe('Terms and Conditions', () => {
    it('should store terms_and_conditions array', async () => {
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }],
        terms_and_conditions: [
          'Payment due within 30 days',
          'All sales are final',
          'Shipping charges apply'
        ]
      });

      await invoice.validate();

      expect(invoice.terms_and_conditions).toHaveLength(3);
    });
  });

  describe('Timestamps', () => {
    it('should have invoice_date default to now', () => {
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }]
      });

      expect(invoice.invoice_date).toBeDefined();
      expect(invoice.invoice_date instanceof Date).toBe(true);
    });
  });

  describe('Virtual Fields', () => {
    it('should return custom_invoice_number as display_invoice_number when set', () => {
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }],
        invoice_number: 'INV-00001',
        custom_invoice_number: 'CUSTOM-123'
      });

      expect(invoice.display_invoice_number).toBe('CUSTOM-123');
    });

    it('should return invoice_number as display_invoice_number when custom not set', () => {
      const invoice = new Invoice({
        items: [{ quantity: 1, unit_price: 100, total_price: 100 }],
        invoice_number: 'INV-00001'
      });

      expect(invoice.display_invoice_number).toBe('INV-00001');
    });
  });
});
