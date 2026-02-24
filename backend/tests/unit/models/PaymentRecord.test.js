import mongoose from 'mongoose';
import PaymentRecord from '../../../src/modules/paymentRecords/paymentRecords.model.js';

describe('PaymentRecord Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid payment record with required fields', async () => {
      const record = new PaymentRecord({
        proforma_invoice: new mongoose.Types.ObjectId(),
        proforma_number: 'PI-00001',
        amount: 5000,
        payment_date: new Date()
      });

      await record.validate();
      expect(record.amount).toBe(5000);
    });

    it('should require proforma_invoice field', async () => {
      const record = new PaymentRecord({
        proforma_number: 'PI-00001',
        amount: 5000,
        payment_date: new Date()
      });

      await expect(record.validate()).rejects.toThrow();
    });

    it('should require proforma_number field', async () => {
      const record = new PaymentRecord({
        proforma_invoice: new mongoose.Types.ObjectId(),
        amount: 5000,
        payment_date: new Date()
      });

      await expect(record.validate()).rejects.toThrow();
    });

    it('should require amount field', async () => {
      const record = new PaymentRecord({
        proforma_invoice: new mongoose.Types.ObjectId(),
        proforma_number: 'PI-00001',
        payment_date: new Date()
      });

      await expect(record.validate()).rejects.toThrow();
    });

    it('should require payment_date field', async () => {
      const record = new PaymentRecord({
        proforma_invoice: new mongoose.Types.ObjectId(),
        proforma_number: 'PI-00001',
        amount: 5000
      });

      await expect(record.validate()).rejects.toThrow();
    });

    it('should not allow negative amount', async () => {
      const record = new PaymentRecord({
        proforma_invoice: new mongoose.Types.ObjectId(),
        proforma_number: 'PI-00001',
        amount: -100,
        payment_date: new Date()
      });

      await expect(record.validate()).rejects.toThrow();
    });

    it('should allow zero amount', async () => {
      const record = new PaymentRecord({
        proforma_invoice: new mongoose.Types.ObjectId(),
        proforma_number: 'PI-00001',
        amount: 0,
        payment_date: new Date()
      });

      await record.validate();
      expect(record.amount).toBe(0);
    });
  });

  describe('Default Values', () => {
    it('should default collection_source to BUYER_PORTAL', () => {
      const record = new PaymentRecord({
        proforma_invoice: new mongoose.Types.ObjectId(),
        proforma_number: 'PI-00001',
        amount: 5000,
        payment_date: new Date()
      });

      expect(record.collection_source).toBe('BUYER_PORTAL');
    });

    it('should default currency to USD', () => {
      const record = new PaymentRecord({
        proforma_invoice: new mongoose.Types.ObjectId(),
        proforma_number: 'PI-00001',
        amount: 5000,
        payment_date: new Date()
      });

      expect(record.currency).toBe('USD');
    });

    it('should default status to PENDING', () => {
      const record = new PaymentRecord({
        proforma_invoice: new mongoose.Types.ObjectId(),
        proforma_number: 'PI-00001',
        amount: 5000,
        payment_date: new Date()
      });

      expect(record.status).toBe('PENDING');
    });

    it('should default payment_method to BANK_TRANSFER', () => {
      const record = new PaymentRecord({
        proforma_invoice: new mongoose.Types.ObjectId(),
        proforma_number: 'PI-00001',
        amount: 5000,
        payment_date: new Date()
      });

      expect(record.payment_method).toBe('BANK_TRANSFER');
    });

    it('should default transaction_id to empty string', () => {
      const record = new PaymentRecord({
        proforma_invoice: new mongoose.Types.ObjectId(),
        proforma_number: 'PI-00001',
        amount: 5000,
        payment_date: new Date()
      });

      expect(record.transaction_id).toBe('');
    });
  });

  describe('Collection Source Validation', () => {
    const validSources = ['BUYER_PORTAL', 'ADMIN_DIRECT', 'EMAIL', 'PHONE_CALL', 'IN_PERSON', 'OTHER'];

    validSources.forEach(source => {
      it(`should accept ${source} collection source`, async () => {
        const record = new PaymentRecord({
          proforma_invoice: new mongoose.Types.ObjectId(),
          proforma_number: 'PI-00001',
          amount: 5000,
          payment_date: new Date(),
          collection_source: source
        });

        await record.validate();
        expect(record.collection_source).toBe(source);
      });
    });

    it('should reject invalid collection_source', async () => {
      const record = new PaymentRecord({
        proforma_invoice: new mongoose.Types.ObjectId(),
        proforma_number: 'PI-00001',
        amount: 5000,
        payment_date: new Date(),
        collection_source: 'INVALID'
      });

      await expect(record.validate()).rejects.toThrow();
    });
  });

  describe('Payment Method Validation', () => {
    const validMethods = ['BANK_TRANSFER', 'WIRE_TRANSFER', 'CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'CHECK', 'CASH', 'OTHER'];

    validMethods.forEach(method => {
      it(`should accept ${method} payment method`, async () => {
        const record = new PaymentRecord({
          proforma_invoice: new mongoose.Types.ObjectId(),
          proforma_number: 'PI-00001',
          amount: 5000,
          payment_date: new Date(),
          payment_method: method
        });

        await record.validate();
        expect(record.payment_method).toBe(method);
      });
    });

    it('should reject invalid payment_method', async () => {
      const record = new PaymentRecord({
        proforma_invoice: new mongoose.Types.ObjectId(),
        proforma_number: 'PI-00001',
        amount: 5000,
        payment_date: new Date(),
        payment_method: 'INVALID'
      });

      await expect(record.validate()).rejects.toThrow();
    });
  });

  describe('Status Validation', () => {
    const validStatuses = ['PENDING', 'VERIFIED', 'REJECTED'];

    validStatuses.forEach(status => {
      it(`should accept ${status} status`, async () => {
        const record = new PaymentRecord({
          proforma_invoice: new mongoose.Types.ObjectId(),
          proforma_number: 'PI-00001',
          amount: 5000,
          payment_date: new Date(),
          status
        });

        await record.validate();
        expect(record.status).toBe(status);
      });
    });

    it('should reject invalid status', async () => {
      const record = new PaymentRecord({
        proforma_invoice: new mongoose.Types.ObjectId(),
        proforma_number: 'PI-00001',
        amount: 5000,
        payment_date: new Date(),
        status: 'INVALID'
      });

      await expect(record.validate()).rejects.toThrow();
    });
  });

  describe('References', () => {
    it('should accept buyer reference', async () => {
      const buyerId = new mongoose.Types.ObjectId();
      const record = new PaymentRecord({
        proforma_invoice: new mongoose.Types.ObjectId(),
        proforma_number: 'PI-00001',
        buyer: buyerId,
        buyer_name: 'John Doe',
        buyer_email: 'john@example.com',
        amount: 5000,
        payment_date: new Date()
      });

      await record.validate();
      expect(record.buyer.toString()).toBe(buyerId.toString());
    });

    it('should accept collected_by reference', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const record = new PaymentRecord({
        proforma_invoice: new mongoose.Types.ObjectId(),
        proforma_number: 'PI-00001',
        collected_by: adminId,
        collected_by_name: 'Admin User',
        amount: 5000,
        payment_date: new Date()
      });

      await record.validate();
      expect(record.collected_by.toString()).toBe(adminId.toString());
    });

    it('should accept verified_by reference', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const record = new PaymentRecord({
        proforma_invoice: new mongoose.Types.ObjectId(),
        proforma_number: 'PI-00001',
        verified_by: adminId,
        verified_at: new Date(),
        amount: 5000,
        payment_date: new Date()
      });

      await record.validate();
      expect(record.verified_by.toString()).toBe(adminId.toString());
    });
  });

  describe('Additional Fields', () => {
    it('should store transaction_id', async () => {
      const record = new PaymentRecord({
        proforma_invoice: new mongoose.Types.ObjectId(),
        proforma_number: 'PI-00001',
        amount: 5000,
        payment_date: new Date(),
        transaction_id: 'TXN123456789'
      });

      await record.validate();
      expect(record.transaction_id).toBe('TXN123456789');
    });

    it('should store notes', async () => {
      const record = new PaymentRecord({
        proforma_invoice: new mongoose.Types.ObjectId(),
        proforma_number: 'PI-00001',
        amount: 5000,
        payment_date: new Date(),
        notes: 'Payment for order'
      });

      await record.validate();
      expect(record.notes).toBe('Payment for order');
    });

    it('should store proof_file and proof_file_url', async () => {
      const record = new PaymentRecord({
        proforma_invoice: new mongoose.Types.ObjectId(),
        proforma_number: 'PI-00001',
        amount: 5000,
        payment_date: new Date(),
        proof_file: 'proof.pdf',
        proof_file_url: 'https://example.com/proof.pdf'
      });

      await record.validate();
      expect(record.proof_file).toBe('proof.pdf');
      expect(record.proof_file_url).toBe('https://example.com/proof.pdf');
    });

    it('should store verification_notes', async () => {
      const record = new PaymentRecord({
        proforma_invoice: new mongoose.Types.ObjectId(),
        proforma_number: 'PI-00001',
        amount: 5000,
        payment_date: new Date(),
        verification_notes: 'Verified against bank statement'
      });

      await record.validate();
      expect(record.verification_notes).toBe('Verified against bank statement');
    });

    it('should store recorded_amount', async () => {
      const record = new PaymentRecord({
        proforma_invoice: new mongoose.Types.ObjectId(),
        proforma_number: 'PI-00001',
        amount: 5000,
        payment_date: new Date(),
        recorded_amount: 4800
      });

      await record.validate();
      expect(record.recorded_amount).toBe(4800);
    });
  });

  describe('Edit History', () => {
    it('should store edit history', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const record = new PaymentRecord({
        proforma_invoice: new mongoose.Types.ObjectId(),
        proforma_number: 'PI-00001',
        amount: 5000,
        payment_date: new Date(),
        last_edited_by: adminId,
        last_edited_at: new Date(),
        edit_history: [{
          edited_by: adminId,
          edited_at: new Date(),
          previous_amount: 4500,
          new_amount: 5000,
          notes: 'Corrected amount'
        }]
      });

      await record.validate();
      expect(record.edit_history).toHaveLength(1);
      expect(record.edit_history[0].previous_amount).toBe(4500);
      expect(record.edit_history[0].new_amount).toBe(5000);
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt and updatedAt after save', async () => {
      const record = new PaymentRecord({
        proforma_invoice: new mongoose.Types.ObjectId(),
        proforma_number: 'PI-00001',
        amount: 5000,
        payment_date: new Date()
      });

      await record.save();

      expect(record.createdAt).toBeDefined();
      expect(record.updatedAt).toBeDefined();
    });
  });
});
