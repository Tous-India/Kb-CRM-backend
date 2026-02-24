import mongoose from 'mongoose';
import Payment from '../../../src/modules/payments/payments.model.js';

describe('Payment Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid payment with required fields', async () => {
      const payment = new Payment({
        invoice: new mongoose.Types.ObjectId(),
        buyer: new mongoose.Types.ObjectId(),
        amount: 5000
      });

      await payment.validate();
      expect(payment.amount).toBe(5000);
    });

    it('should require invoice field', async () => {
      const payment = new Payment({
        buyer: new mongoose.Types.ObjectId(),
        amount: 5000
      });

      await expect(payment.validate()).rejects.toThrow();
    });

    it('should require buyer field', async () => {
      const payment = new Payment({
        invoice: new mongoose.Types.ObjectId(),
        amount: 5000
      });

      await expect(payment.validate()).rejects.toThrow();
    });

    it('should require amount field', async () => {
      const payment = new Payment({
        invoice: new mongoose.Types.ObjectId(),
        buyer: new mongoose.Types.ObjectId()
      });

      await expect(payment.validate()).rejects.toThrow();
    });

    it('should not allow negative amount', async () => {
      const payment = new Payment({
        invoice: new mongoose.Types.ObjectId(),
        buyer: new mongoose.Types.ObjectId(),
        amount: -100
      });

      await expect(payment.validate()).rejects.toThrow();
    });

    it('should allow zero amount', async () => {
      const payment = new Payment({
        invoice: new mongoose.Types.ObjectId(),
        buyer: new mongoose.Types.ObjectId(),
        amount: 0
      });

      await payment.validate();
      expect(payment.amount).toBe(0);
    });
  });

  describe('Default Values', () => {
    it('should default status to PENDING', () => {
      const payment = new Payment({
        invoice: new mongoose.Types.ObjectId(),
        buyer: new mongoose.Types.ObjectId(),
        amount: 5000
      });

      expect(payment.status).toBe('PENDING');
    });

    it('should default currency to USD', () => {
      const payment = new Payment({
        invoice: new mongoose.Types.ObjectId(),
        buyer: new mongoose.Types.ObjectId(),
        amount: 5000
      });

      expect(payment.currency).toBe('USD');
    });

    it('should have payment_date default to now', () => {
      const payment = new Payment({
        invoice: new mongoose.Types.ObjectId(),
        buyer: new mongoose.Types.ObjectId(),
        amount: 5000
      });

      expect(payment.payment_date).toBeDefined();
      expect(payment.payment_date instanceof Date).toBe(true);
    });
  });

  describe('Status Validation', () => {
    const validStatuses = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'];

    validStatuses.forEach(status => {
      it(`should accept ${status} status`, async () => {
        const payment = new Payment({
          invoice: new mongoose.Types.ObjectId(),
          buyer: new mongoose.Types.ObjectId(),
          amount: 5000,
          status
        });

        await payment.validate();
        expect(payment.status).toBe(status);
      });
    });

    it('should reject invalid status', async () => {
      const payment = new Payment({
        invoice: new mongoose.Types.ObjectId(),
        buyer: new mongoose.Types.ObjectId(),
        amount: 5000,
        status: 'INVALID'
      });

      await expect(payment.validate()).rejects.toThrow();
    });
  });

  describe('Currency Validation', () => {
    it('should accept USD currency', async () => {
      const payment = new Payment({
        invoice: new mongoose.Types.ObjectId(),
        buyer: new mongoose.Types.ObjectId(),
        amount: 5000,
        currency: 'USD'
      });

      await payment.validate();
      expect(payment.currency).toBe('USD');
    });

    it('should accept INR currency', async () => {
      const payment = new Payment({
        invoice: new mongoose.Types.ObjectId(),
        buyer: new mongoose.Types.ObjectId(),
        amount: 400000,
        currency: 'INR'
      });

      await payment.validate();
      expect(payment.currency).toBe('INR');
    });

    it('should reject invalid currency', async () => {
      const payment = new Payment({
        invoice: new mongoose.Types.ObjectId(),
        buyer: new mongoose.Types.ObjectId(),
        amount: 5000,
        currency: 'EUR'
      });

      await expect(payment.validate()).rejects.toThrow();
    });
  });

  describe('Payment Method Validation', () => {
    const validMethods = ['Credit Card', 'Wire Transfer', 'Check', 'UPI', 'BANK_TRANSFER'];

    validMethods.forEach(method => {
      it(`should accept ${method} payment method`, async () => {
        const payment = new Payment({
          invoice: new mongoose.Types.ObjectId(),
          buyer: new mongoose.Types.ObjectId(),
          amount: 5000,
          payment_method: method
        });

        await payment.validate();
        expect(payment.payment_method).toBe(method);
      });
    });

    it('should reject invalid payment_method', async () => {
      const payment = new Payment({
        invoice: new mongoose.Types.ObjectId(),
        buyer: new mongoose.Types.ObjectId(),
        amount: 5000,
        payment_method: 'INVALID'
      });

      await expect(payment.validate()).rejects.toThrow();
    });
  });

  describe('Auto-generated payment_id', () => {
    it('should generate payment_id with PAY prefix', async () => {
      const payment = new Payment({
        invoice: new mongoose.Types.ObjectId(),
        buyer: new mongoose.Types.ObjectId(),
        amount: 5000
      });

      await payment.save();

      expect(payment.payment_id).toMatch(/^PAY-\d{5}$/);
    });

    it('should increment payment_id for subsequent payments', async () => {
      const payment1 = new Payment({
        invoice: new mongoose.Types.ObjectId(),
        buyer: new mongoose.Types.ObjectId(),
        amount: 5000
      });
      await payment1.save();

      const payment2 = new Payment({
        invoice: new mongoose.Types.ObjectId(),
        buyer: new mongoose.Types.ObjectId(),
        amount: 3000
      });
      await payment2.save();

      const num1 = parseInt(payment1.payment_id.split('-')[1], 10);
      const num2 = parseInt(payment2.payment_id.split('-')[1], 10);

      expect(num2).toBe(num1 + 1);
    });
  });

  describe('References', () => {
    it('should accept invoice reference', async () => {
      const invoiceId = new mongoose.Types.ObjectId();
      const payment = new Payment({
        invoice: invoiceId,
        buyer: new mongoose.Types.ObjectId(),
        amount: 5000,
        invoice_number: 'INV-00001'
      });

      await payment.validate();
      expect(payment.invoice.toString()).toBe(invoiceId.toString());
    });

    it('should accept buyer reference', async () => {
      const buyerId = new mongoose.Types.ObjectId();
      const payment = new Payment({
        invoice: new mongoose.Types.ObjectId(),
        buyer: buyerId,
        buyer_name: 'John Doe',
        amount: 5000
      });

      await payment.validate();
      expect(payment.buyer.toString()).toBe(buyerId.toString());
    });

    it('should accept recorded_by reference', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const payment = new Payment({
        invoice: new mongoose.Types.ObjectId(),
        buyer: new mongoose.Types.ObjectId(),
        amount: 5000,
        recorded_by: adminId
      });

      await payment.validate();
      expect(payment.recorded_by.toString()).toBe(adminId.toString());
    });
  });

  describe('Additional Fields', () => {
    it('should store transaction_id', async () => {
      const payment = new Payment({
        invoice: new mongoose.Types.ObjectId(),
        buyer: new mongoose.Types.ObjectId(),
        amount: 5000,
        transaction_id: 'TXN123456789'
      });

      await payment.validate();
      expect(payment.transaction_id).toBe('TXN123456789');
    });

    it('should store notes', async () => {
      const payment = new Payment({
        invoice: new mongoose.Types.ObjectId(),
        buyer: new mongoose.Types.ObjectId(),
        amount: 5000,
        notes: 'Payment received via wire transfer'
      });

      await payment.validate();
      expect(payment.notes).toBe('Payment received via wire transfer');
    });

    it('should store amount_usd for INR payments', async () => {
      const payment = new Payment({
        invoice: new mongoose.Types.ObjectId(),
        buyer: new mongoose.Types.ObjectId(),
        amount: 417500,
        currency: 'INR',
        amount_usd: 5000
      });

      await payment.validate();
      expect(payment.amount_usd).toBe(5000);
    });

    it('should store buyer_name', async () => {
      const payment = new Payment({
        invoice: new mongoose.Types.ObjectId(),
        buyer: new mongoose.Types.ObjectId(),
        amount: 5000,
        buyer_name: 'Acme Corporation'
      });

      await payment.validate();
      expect(payment.buyer_name).toBe('Acme Corporation');
    });

    it('should store invoice_number', async () => {
      const payment = new Payment({
        invoice: new mongoose.Types.ObjectId(),
        buyer: new mongoose.Types.ObjectId(),
        amount: 5000,
        invoice_number: 'INV-00123'
      });

      await payment.validate();
      expect(payment.invoice_number).toBe('INV-00123');
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt and updatedAt after save', async () => {
      const payment = new Payment({
        invoice: new mongoose.Types.ObjectId(),
        buyer: new mongoose.Types.ObjectId(),
        amount: 5000
      });

      await payment.save();

      expect(payment.createdAt).toBeDefined();
      expect(payment.updatedAt).toBeDefined();
    });
  });
});
