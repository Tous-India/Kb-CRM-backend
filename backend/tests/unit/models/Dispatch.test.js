import mongoose from 'mongoose';
import Dispatch from '../../../src/modules/dispatches/dispatches.model.js';

describe('Dispatch Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid dispatch with minimal fields', async () => {
      const dispatch = new Dispatch({
        source_type: 'ORDER',
        source_id: new mongoose.Types.ObjectId(),
        items: [{
          product_id: 'PRD-00001',
          product_name: 'Test Product',
          quantity: 5,
          unit_price: 100,
          total_price: 500
        }]
      });

      await dispatch.validate();
      expect(dispatch.items).toHaveLength(1);
    });

    it('should require source_type', async () => {
      const dispatch = new Dispatch({
        source_id: new mongoose.Types.ObjectId(),
        items: [{ quantity: 5 }]
      });

      await expect(dispatch.validate()).rejects.toThrow();
    });

    it('should require source_id', async () => {
      const dispatch = new Dispatch({
        source_type: 'ORDER',
        items: [{ quantity: 5 }]
      });

      await expect(dispatch.validate()).rejects.toThrow();
    });
  });

  describe('Default Values', () => {
    it('should default total_quantity to 0', () => {
      const dispatch = new Dispatch({
        source_type: 'ORDER',
        source_id: new mongoose.Types.ObjectId()
      });

      expect(dispatch.total_quantity).toBe(0);
    });

    it('should default total_amount to 0', () => {
      const dispatch = new Dispatch({
        source_type: 'ORDER',
        source_id: new mongoose.Types.ObjectId()
      });

      expect(dispatch.total_amount).toBe(0);
    });

    it('should default exchange_rate to 83.5', () => {
      const dispatch = new Dispatch({
        source_type: 'ORDER',
        source_id: new mongoose.Types.ObjectId()
      });

      expect(dispatch.exchange_rate).toBe(83.5);
    });

    it('should default dispatch_type to STANDARD', () => {
      const dispatch = new Dispatch({
        source_type: 'ORDER',
        source_id: new mongoose.Types.ObjectId()
      });

      expect(dispatch.dispatch_type).toBe('STANDARD');
    });

    it('should default invoice_generated to false', () => {
      const dispatch = new Dispatch({
        source_type: 'ORDER',
        source_id: new mongoose.Types.ObjectId()
      });

      expect(dispatch.invoice_generated).toBe(false);
    });

    it('should default is_partial to false', () => {
      const dispatch = new Dispatch({
        source_type: 'ORDER',
        source_id: new mongoose.Types.ObjectId()
      });

      expect(dispatch.is_partial).toBe(false);
    });

    it('should default dispatch_sequence to 1', () => {
      const dispatch = new Dispatch({
        source_type: 'ORDER',
        source_id: new mongoose.Types.ObjectId()
      });

      expect(dispatch.dispatch_sequence).toBe(1);
    });

    it('should default is_emailed to false', () => {
      const dispatch = new Dispatch({
        source_type: 'ORDER',
        source_id: new mongoose.Types.ObjectId()
      });

      expect(dispatch.is_emailed).toBe(false);
    });

    it('should default email_count to 0', () => {
      const dispatch = new Dispatch({
        source_type: 'ORDER',
        source_id: new mongoose.Types.ObjectId()
      });

      expect(dispatch.email_count).toBe(0);
    });

    it('should have dispatch_date default to now', () => {
      const dispatch = new Dispatch({
        source_type: 'ORDER',
        source_id: new mongoose.Types.ObjectId()
      });

      expect(dispatch.dispatch_date).toBeDefined();
      expect(dispatch.dispatch_date instanceof Date).toBe(true);
    });
  });

  describe('Source Type Validation', () => {
    it('should accept PROFORMA_INVOICE source type', async () => {
      const dispatch = new Dispatch({
        source_type: 'PROFORMA_INVOICE',
        source_id: new mongoose.Types.ObjectId()
      });

      await dispatch.validate();
      expect(dispatch.source_type).toBe('PROFORMA_INVOICE');
    });

    it('should accept ORDER source type', async () => {
      const dispatch = new Dispatch({
        source_type: 'ORDER',
        source_id: new mongoose.Types.ObjectId()
      });

      await dispatch.validate();
      expect(dispatch.source_type).toBe('ORDER');
    });

    it('should reject invalid source_type', async () => {
      const dispatch = new Dispatch({
        source_type: 'INVALID',
        source_id: new mongoose.Types.ObjectId()
      });

      await expect(dispatch.validate()).rejects.toThrow();
    });
  });

  describe('Dispatch Type Validation', () => {
    const validTypes = ['STANDARD', 'PROJECT', 'CREDIT', 'PARTIAL', 'HALF', 'PERCENTAGE'];

    validTypes.forEach(type => {
      it(`should accept ${type} dispatch type`, async () => {
        const dispatch = new Dispatch({
          source_type: 'ORDER',
          source_id: new mongoose.Types.ObjectId(),
          dispatch_type: type
        });

        await dispatch.validate();
        expect(dispatch.dispatch_type).toBe(type);
      });
    });

    it('should reject invalid dispatch_type', async () => {
      const dispatch = new Dispatch({
        source_type: 'ORDER',
        source_id: new mongoose.Types.ObjectId(),
        dispatch_type: 'INVALID'
      });

      await expect(dispatch.validate()).rejects.toThrow();
    });
  });

  describe('Source Type Ref Validation', () => {
    it('should accept ProformaInvoice source_type_ref', async () => {
      const dispatch = new Dispatch({
        source_type: 'PROFORMA_INVOICE',
        source_id: new mongoose.Types.ObjectId(),
        source_type_ref: 'ProformaInvoice'
      });

      await dispatch.validate();
      expect(dispatch.source_type_ref).toBe('ProformaInvoice');
    });

    it('should accept Order source_type_ref', async () => {
      const dispatch = new Dispatch({
        source_type: 'ORDER',
        source_id: new mongoose.Types.ObjectId(),
        source_type_ref: 'Order'
      });

      await dispatch.validate();
      expect(dispatch.source_type_ref).toBe('Order');
    });

    it('should reject invalid source_type_ref', async () => {
      const dispatch = new Dispatch({
        source_type: 'ORDER',
        source_id: new mongoose.Types.ObjectId(),
        source_type_ref: 'INVALID'
      });

      await expect(dispatch.validate()).rejects.toThrow();
    });
  });

  describe('Auto-generated dispatch_id', () => {
    it('should generate dispatch_id with DSP prefix', async () => {
      const dispatch = new Dispatch({
        source_type: 'ORDER',
        source_id: new mongoose.Types.ObjectId()
      });

      await dispatch.save();

      expect(dispatch.dispatch_id).toMatch(/^DSP-\d{5}$/);
    });

    it('should increment dispatch_id for subsequent dispatches', async () => {
      const dispatch1 = new Dispatch({
        source_type: 'ORDER',
        source_id: new mongoose.Types.ObjectId()
      });
      await dispatch1.save();

      const dispatch2 = new Dispatch({
        source_type: 'PROFORMA_INVOICE',
        source_id: new mongoose.Types.ObjectId()
      });
      await dispatch2.save();

      const num1 = parseInt(dispatch1.dispatch_id.split('-')[1], 10);
      const num2 = parseInt(dispatch2.dispatch_id.split('-')[1], 10);

      expect(num2).toBe(num1 + 1);
    });
  });

  describe('Dispatch Items', () => {
    it('should store multiple items', async () => {
      const dispatch = new Dispatch({
        source_type: 'ORDER',
        source_id: new mongoose.Types.ObjectId(),
        items: [
          { product_id: 'PRD-001', quantity: 5, unit_price: 100, total_price: 500 },
          { product_id: 'PRD-002', quantity: 3, unit_price: 200, total_price: 600 }
        ]
      });

      await dispatch.validate();
      expect(dispatch.items).toHaveLength(2);
    });

    it('should store item with all fields', async () => {
      const dispatch = new Dispatch({
        source_type: 'ORDER',
        source_id: new mongoose.Types.ObjectId(),
        items: [{
          product_id: 'PRD-00001',
          product_name: 'Test Product',
          part_number: 'PN-001',
          quantity: 10,
          unit_price: 50,
          total_price: 500,
          hsn_code: 'HSN123'
        }]
      });

      await dispatch.validate();

      expect(dispatch.items[0].product_id).toBe('PRD-00001');
      expect(dispatch.items[0].hsn_code).toBe('HSN123');
    });
  });

  describe('Shipping Info', () => {
    it('should store shipping_info correctly', async () => {
      const dispatch = new Dispatch({
        source_type: 'ORDER',
        source_id: new mongoose.Types.ObjectId(),
        shipping_info: {
          hsn_code: 'HSN123',
          awb_number: 'AWB456789',
          shipping_by: 'FedEx',
          notes: 'Handle with care'
        }
      });

      await dispatch.validate();

      expect(dispatch.shipping_info.hsn_code).toBe('HSN123');
      expect(dispatch.shipping_info.awb_number).toBe('AWB456789');
      expect(dispatch.shipping_info.shipping_by).toBe('FedEx');
    });
  });

  describe('References', () => {
    it('should accept buyer reference', async () => {
      const buyerId = new mongoose.Types.ObjectId();
      const dispatch = new Dispatch({
        source_type: 'ORDER',
        source_id: new mongoose.Types.ObjectId(),
        buyer: buyerId,
        buyer_name: 'John Doe',
        buyer_email: 'john@example.com'
      });

      await dispatch.validate();
      expect(dispatch.buyer.toString()).toBe(buyerId.toString());
    });

    it('should accept invoice reference', async () => {
      const invoiceId = new mongoose.Types.ObjectId();
      const dispatch = new Dispatch({
        source_type: 'ORDER',
        source_id: new mongoose.Types.ObjectId(),
        invoice_id: invoiceId,
        invoice_number: 'INV-00001',
        invoice_generated: true
      });

      await dispatch.validate();
      expect(dispatch.invoice_id.toString()).toBe(invoiceId.toString());
    });

    it('should accept created_by reference', async () => {
      const userId = new mongoose.Types.ObjectId();
      const dispatch = new Dispatch({
        source_type: 'ORDER',
        source_id: new mongoose.Types.ObjectId(),
        created_by: userId
      });

      await dispatch.validate();
      expect(dispatch.created_by.toString()).toBe(userId.toString());
    });
  });

  describe('Partial Dispatch Tracking', () => {
    it('should mark dispatch as partial', async () => {
      const dispatch = new Dispatch({
        source_type: 'ORDER',
        source_id: new mongoose.Types.ObjectId(),
        is_partial: true,
        dispatch_sequence: 2
      });

      await dispatch.validate();

      expect(dispatch.is_partial).toBe(true);
      expect(dispatch.dispatch_sequence).toBe(2);
    });
  });

  describe('Project Dispatch', () => {
    it('should store project name for PROJECT type dispatch', async () => {
      const dispatch = new Dispatch({
        source_type: 'ORDER',
        source_id: new mongoose.Types.ObjectId(),
        dispatch_type: 'PROJECT',
        project_name: 'Alpha Project'
      });

      await dispatch.validate();

      expect(dispatch.dispatch_type).toBe('PROJECT');
      expect(dispatch.project_name).toBe('Alpha Project');
    });
  });

  describe('Email Tracking', () => {
    it('should track email status', async () => {
      const dispatch = new Dispatch({
        source_type: 'ORDER',
        source_id: new mongoose.Types.ObjectId(),
        is_emailed: true,
        last_emailed_at: new Date(),
        email_count: 2
      });

      await dispatch.validate();

      expect(dispatch.is_emailed).toBe(true);
      expect(dispatch.email_count).toBe(2);
    });
  });

  describe('Source Number', () => {
    it('should store source_number for reference', async () => {
      const dispatch = new Dispatch({
        source_type: 'ORDER',
        source_id: new mongoose.Types.ObjectId(),
        source_number: 'ORD-00123'
      });

      await dispatch.validate();

      expect(dispatch.source_number).toBe('ORD-00123');
    });

    it('should store PI source_number', async () => {
      const dispatch = new Dispatch({
        source_type: 'PROFORMA_INVOICE',
        source_id: new mongoose.Types.ObjectId(),
        source_number: 'PI-00456'
      });

      await dispatch.validate();

      expect(dispatch.source_number).toBe('PI-00456');
    });
  });

  describe('Notes', () => {
    it('should store dispatch notes', async () => {
      const dispatch = new Dispatch({
        source_type: 'ORDER',
        source_id: new mongoose.Types.ObjectId(),
        notes: 'Special handling required. Fragile items.'
      });

      await dispatch.validate();

      expect(dispatch.notes).toBe('Special handling required. Fragile items.');
    });
  });

  describe('Exchange Rate', () => {
    it('should store custom exchange rate', async () => {
      const dispatch = new Dispatch({
        source_type: 'ORDER',
        source_id: new mongoose.Types.ObjectId(),
        exchange_rate: 85.0
      });

      await dispatch.validate();

      expect(dispatch.exchange_rate).toBe(85.0);
    });
  });

  describe('Financial Calculations', () => {
    it('should store total_quantity and total_amount', async () => {
      const dispatch = new Dispatch({
        source_type: 'ORDER',
        source_id: new mongoose.Types.ObjectId(),
        items: [
          { quantity: 10, unit_price: 100, total_price: 1000 },
          { quantity: 5, unit_price: 200, total_price: 1000 }
        ],
        total_quantity: 15,
        total_amount: 2000
      });

      await dispatch.validate();

      expect(dispatch.total_quantity).toBe(15);
      expect(dispatch.total_amount).toBe(2000);
    });
  });
});
