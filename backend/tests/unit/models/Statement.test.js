import mongoose from 'mongoose';
import Statement from '../../../src/modules/statements/statements.model.js';

describe('Statement Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid statement with required fields', async () => {
      const statement = new Statement({
        buyer: new mongoose.Types.ObjectId(),
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31')
      });

      await statement.validate();
      expect(statement.buyer).toBeDefined();
    });

    it('should require buyer field', async () => {
      const statement = new Statement({
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31')
      });

      await expect(statement.validate()).rejects.toThrow();
    });

    it('should require period_start field', async () => {
      const statement = new Statement({
        buyer: new mongoose.Types.ObjectId(),
        period_end: new Date('2024-01-31')
      });

      await expect(statement.validate()).rejects.toThrow();
    });

    it('should require period_end field', async () => {
      const statement = new Statement({
        buyer: new mongoose.Types.ObjectId(),
        period_start: new Date('2024-01-01')
      });

      await expect(statement.validate()).rejects.toThrow();
    });
  });

  describe('Default Values', () => {
    it('should default opening_balance to 0', () => {
      const statement = new Statement({
        buyer: new mongoose.Types.ObjectId(),
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31')
      });

      expect(statement.opening_balance).toBe(0);
    });

    it('should default total_charges to 0', () => {
      const statement = new Statement({
        buyer: new mongoose.Types.ObjectId(),
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31')
      });

      expect(statement.total_charges).toBe(0);
    });

    it('should default total_payments to 0', () => {
      const statement = new Statement({
        buyer: new mongoose.Types.ObjectId(),
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31')
      });

      expect(statement.total_payments).toBe(0);
    });

    it('should default closing_balance to 0', () => {
      const statement = new Statement({
        buyer: new mongoose.Types.ObjectId(),
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31')
      });

      expect(statement.closing_balance).toBe(0);
    });

    it('should default current_due to 0', () => {
      const statement = new Statement({
        buyer: new mongoose.Types.ObjectId(),
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31')
      });

      expect(statement.current_due).toBe(0);
    });

    it('should default past_due_30 to 0', () => {
      const statement = new Statement({
        buyer: new mongoose.Types.ObjectId(),
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31')
      });

      expect(statement.past_due_30).toBe(0);
    });

    it('should default past_due_60 to 0', () => {
      const statement = new Statement({
        buyer: new mongoose.Types.ObjectId(),
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31')
      });

      expect(statement.past_due_60).toBe(0);
    });

    it('should default past_due_90 to 0', () => {
      const statement = new Statement({
        buyer: new mongoose.Types.ObjectId(),
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31')
      });

      expect(statement.past_due_90).toBe(0);
    });

    it('should have statement_date default to now', () => {
      const statement = new Statement({
        buyer: new mongoose.Types.ObjectId(),
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31')
      });

      expect(statement.statement_date).toBeDefined();
      expect(statement.statement_date instanceof Date).toBe(true);
    });
  });

  describe('Auto-generated statement_id', () => {
    it('should generate statement_id with STM prefix', async () => {
      const statement = new Statement({
        buyer: new mongoose.Types.ObjectId(),
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31')
      });

      await statement.save();

      expect(statement.statement_id).toMatch(/^STM-\d{5}$/);
    });

    it('should increment statement_id for subsequent statements', async () => {
      const statement1 = new Statement({
        buyer: new mongoose.Types.ObjectId(),
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31')
      });
      await statement1.save();

      const statement2 = new Statement({
        buyer: new mongoose.Types.ObjectId(),
        period_start: new Date('2024-02-01'),
        period_end: new Date('2024-02-28')
      });
      await statement2.save();

      const num1 = parseInt(statement1.statement_id.split('-')[1], 10);
      const num2 = parseInt(statement2.statement_id.split('-')[1], 10);

      expect(num2).toBe(num1 + 1);
    });
  });

  describe('Transactions', () => {
    it('should store transactions array', async () => {
      const statement = new Statement({
        buyer: new mongoose.Types.ObjectId(),
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31'),
        transactions: [
          {
            date: new Date('2024-01-15'),
            type: 'INVOICE',
            reference: 'INV-00001',
            description: 'Invoice for order',
            charges: 5000,
            payments: 0,
            balance: 5000
          }
        ]
      });

      await statement.validate();
      expect(statement.transactions).toHaveLength(1);
    });

    it('should require transaction date', async () => {
      const statement = new Statement({
        buyer: new mongoose.Types.ObjectId(),
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31'),
        transactions: [
          {
            type: 'INVOICE',
            reference: 'INV-00001'
          }
        ]
      });

      await expect(statement.validate()).rejects.toThrow();
    });

    it('should require transaction type', async () => {
      const statement = new Statement({
        buyer: new mongoose.Types.ObjectId(),
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31'),
        transactions: [
          {
            date: new Date('2024-01-15'),
            reference: 'INV-00001'
          }
        ]
      });

      await expect(statement.validate()).rejects.toThrow();
    });

    const validTypes = ['INVOICE', 'PAYMENT', 'CREDIT', 'DEBIT'];

    validTypes.forEach(type => {
      it(`should accept ${type} transaction type`, async () => {
        const statement = new Statement({
          buyer: new mongoose.Types.ObjectId(),
          period_start: new Date('2024-01-01'),
          period_end: new Date('2024-01-31'),
          transactions: [
            {
              date: new Date('2024-01-15'),
              type,
              reference: 'REF-00001'
            }
          ]
        });

        await statement.validate();
        expect(statement.transactions[0].type).toBe(type);
      });
    });

    it('should reject invalid transaction type', async () => {
      const statement = new Statement({
        buyer: new mongoose.Types.ObjectId(),
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31'),
        transactions: [
          {
            date: new Date('2024-01-15'),
            type: 'INVALID',
            reference: 'REF-00001'
          }
        ]
      });

      await expect(statement.validate()).rejects.toThrow();
    });

    it('should default transaction charges to 0', () => {
      const statement = new Statement({
        buyer: new mongoose.Types.ObjectId(),
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31'),
        transactions: [
          {
            date: new Date('2024-01-15'),
            type: 'INVOICE',
            reference: 'INV-00001'
          }
        ]
      });

      expect(statement.transactions[0].charges).toBe(0);
    });

    it('should default transaction payments to 0', () => {
      const statement = new Statement({
        buyer: new mongoose.Types.ObjectId(),
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31'),
        transactions: [
          {
            date: new Date('2024-01-15'),
            type: 'PAYMENT',
            reference: 'PAY-00001'
          }
        ]
      });

      expect(statement.transactions[0].payments).toBe(0);
    });

    it('should default transaction balance to 0', () => {
      const statement = new Statement({
        buyer: new mongoose.Types.ObjectId(),
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31'),
        transactions: [
          {
            date: new Date('2024-01-15'),
            type: 'INVOICE',
            reference: 'INV-00001'
          }
        ]
      });

      expect(statement.transactions[0].balance).toBe(0);
    });
  });

  describe('Financial Calculations', () => {
    it('should store opening and closing balances', async () => {
      const statement = new Statement({
        buyer: new mongoose.Types.ObjectId(),
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31'),
        opening_balance: 1000,
        total_charges: 5000,
        total_payments: 3000,
        closing_balance: 3000
      });

      await statement.validate();

      expect(statement.opening_balance).toBe(1000);
      expect(statement.total_charges).toBe(5000);
      expect(statement.total_payments).toBe(3000);
      expect(statement.closing_balance).toBe(3000);
    });

    it('should store aging buckets', async () => {
      const statement = new Statement({
        buyer: new mongoose.Types.ObjectId(),
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31'),
        current_due: 1000,
        past_due_30: 500,
        past_due_60: 300,
        past_due_90: 200
      });

      await statement.validate();

      expect(statement.current_due).toBe(1000);
      expect(statement.past_due_30).toBe(500);
      expect(statement.past_due_60).toBe(300);
      expect(statement.past_due_90).toBe(200);
    });
  });

  describe('References', () => {
    it('should accept buyer reference', async () => {
      const buyerId = new mongoose.Types.ObjectId();
      const statement = new Statement({
        buyer: buyerId,
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31')
      });

      await statement.validate();
      expect(statement.buyer.toString()).toBe(buyerId.toString());
    });

    it('should accept generated_by reference', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const statement = new Statement({
        buyer: new mongoose.Types.ObjectId(),
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31'),
        generated_by: adminId
      });

      await statement.validate();
      expect(statement.generated_by.toString()).toBe(adminId.toString());
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt and updatedAt after save', async () => {
      const statement = new Statement({
        buyer: new mongoose.Types.ObjectId(),
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31')
      });

      await statement.save();

      expect(statement.createdAt).toBeDefined();
      expect(statement.updatedAt).toBeDefined();
    });
  });
});
