import mongoose from 'mongoose';
import PIAllocation from '../../../src/modules/piAllocations/piAllocations.model.js';

describe('PIAllocation Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid PI allocation with required fields', async () => {
      const allocation = new PIAllocation({
        proforma_invoice: new mongoose.Types.ObjectId()
      });

      await allocation.validate();
      expect(allocation.proforma_invoice).toBeDefined();
    });

    it('should require proforma_invoice field', async () => {
      const allocation = new PIAllocation({
        part_number: 'PN-001'
      });

      await expect(allocation.validate()).rejects.toThrow();
    });
  });

  describe('Default Values', () => {
    it('should default quantity_total to 0', () => {
      const allocation = new PIAllocation({
        proforma_invoice: new mongoose.Types.ObjectId()
      });

      expect(allocation.quantity_total).toBe(0);
    });

    it('should default quantity_allocated to 0', () => {
      const allocation = new PIAllocation({
        proforma_invoice: new mongoose.Types.ObjectId()
      });

      expect(allocation.quantity_allocated).toBe(0);
    });

    it('should default quantity_received to 0', () => {
      const allocation = new PIAllocation({
        proforma_invoice: new mongoose.Types.ObjectId()
      });

      expect(allocation.quantity_received).toBe(0);
    });

    it('should default unit_cost to 0', () => {
      const allocation = new PIAllocation({
        proforma_invoice: new mongoose.Types.ObjectId()
      });

      expect(allocation.unit_cost).toBe(0);
    });

    it('should default total_cost to 0', () => {
      const allocation = new PIAllocation({
        proforma_invoice: new mongoose.Types.ObjectId()
      });

      expect(allocation.total_cost).toBe(0);
    });

    it('should default status to PENDING', () => {
      const allocation = new PIAllocation({
        proforma_invoice: new mongoose.Types.ObjectId()
      });

      expect(allocation.status).toBe('PENDING');
    });
  });

  describe('Status Validation', () => {
    const validStatuses = ['PENDING', 'ALLOCATED', 'PARTIAL_RECEIVED', 'RECEIVED', 'CANCELLED'];

    validStatuses.forEach(status => {
      it(`should accept ${status} status`, async () => {
        const allocation = new PIAllocation({
          proforma_invoice: new mongoose.Types.ObjectId(),
          status
        });

        await allocation.validate();
        expect(allocation.status).toBe(status);
      });
    });

    it('should reject invalid status', async () => {
      const allocation = new PIAllocation({
        proforma_invoice: new mongoose.Types.ObjectId(),
        status: 'INVALID'
      });

      await expect(allocation.validate()).rejects.toThrow();
    });
  });

  describe('Product Details', () => {
    it('should store item_index', async () => {
      const allocation = new PIAllocation({
        proforma_invoice: new mongoose.Types.ObjectId(),
        item_index: 0
      });

      await allocation.validate();
      expect(allocation.item_index).toBe(0);
    });

    it('should store part_number', async () => {
      const allocation = new PIAllocation({
        proforma_invoice: new mongoose.Types.ObjectId(),
        part_number: 'MS20426AD3-4'
      });

      await allocation.validate();
      expect(allocation.part_number).toBe('MS20426AD3-4');
    });

    it('should store product_name', async () => {
      const allocation = new PIAllocation({
        proforma_invoice: new mongoose.Types.ObjectId(),
        product_name: 'Solid Rivet'
      });

      await allocation.validate();
      expect(allocation.product_name).toBe('Solid Rivet');
    });
  });

  describe('Quantity Tracking', () => {
    it('should store quantity_total', async () => {
      const allocation = new PIAllocation({
        proforma_invoice: new mongoose.Types.ObjectId(),
        quantity_total: 100
      });

      await allocation.validate();
      expect(allocation.quantity_total).toBe(100);
    });

    it('should store quantity_allocated', async () => {
      const allocation = new PIAllocation({
        proforma_invoice: new mongoose.Types.ObjectId(),
        quantity_allocated: 50
      });

      await allocation.validate();
      expect(allocation.quantity_allocated).toBe(50);
    });

    it('should store quantity_received', async () => {
      const allocation = new PIAllocation({
        proforma_invoice: new mongoose.Types.ObjectId(),
        quantity_received: 25
      });

      await allocation.validate();
      expect(allocation.quantity_received).toBe(25);
    });
  });

  describe('Cost Tracking', () => {
    it('should store unit_cost', async () => {
      const allocation = new PIAllocation({
        proforma_invoice: new mongoose.Types.ObjectId(),
        unit_cost: 50
      });

      await allocation.validate();
      expect(allocation.unit_cost).toBe(50);
    });

    it('should store total_cost', async () => {
      const allocation = new PIAllocation({
        proforma_invoice: new mongoose.Types.ObjectId(),
        total_cost: 5000
      });

      await allocation.validate();
      expect(allocation.total_cost).toBe(5000);
    });
  });

  describe('References', () => {
    it('should accept proforma_invoice reference', async () => {
      const piId = new mongoose.Types.ObjectId();
      const allocation = new PIAllocation({
        proforma_invoice: piId
      });

      await allocation.validate();
      expect(allocation.proforma_invoice.toString()).toBe(piId.toString());
    });

    it('should accept supplier reference', async () => {
      const supplierId = new mongoose.Types.ObjectId();
      const allocation = new PIAllocation({
        proforma_invoice: new mongoose.Types.ObjectId(),
        supplier: supplierId
      });

      await allocation.validate();
      expect(allocation.supplier.toString()).toBe(supplierId.toString());
    });
  });

  describe('Notes', () => {
    it('should store notes', async () => {
      const allocation = new PIAllocation({
        proforma_invoice: new mongoose.Types.ObjectId(),
        notes: 'Priority order - expedite shipping'
      });

      await allocation.validate();
      expect(allocation.notes).toBe('Priority order - expedite shipping');
    });
  });

  describe('Full Allocation Example', () => {
    it('should create a complete allocation record', async () => {
      const piId = new mongoose.Types.ObjectId();
      const supplierId = new mongoose.Types.ObjectId();

      const allocation = new PIAllocation({
        proforma_invoice: piId,
        supplier: supplierId,
        item_index: 0,
        part_number: 'MS20426AD3-4',
        product_name: 'Solid Rivet',
        quantity_total: 1000,
        quantity_allocated: 500,
        quantity_received: 250,
        unit_cost: 0.50,
        total_cost: 500,
        status: 'PARTIAL_RECEIVED',
        notes: 'First batch received'
      });

      await allocation.validate();

      expect(allocation.proforma_invoice.toString()).toBe(piId.toString());
      expect(allocation.supplier.toString()).toBe(supplierId.toString());
      expect(allocation.quantity_total).toBe(1000);
      expect(allocation.status).toBe('PARTIAL_RECEIVED');
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt and updatedAt after save', async () => {
      const allocation = new PIAllocation({
        proforma_invoice: new mongoose.Types.ObjectId()
      });

      await allocation.save();

      expect(allocation.createdAt).toBeDefined();
      expect(allocation.updatedAt).toBeDefined();
    });
  });
});
