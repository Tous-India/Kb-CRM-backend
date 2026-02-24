import mongoose from 'mongoose';
import Cart from '../../../src/modules/carts/carts.model.js';

describe('Cart Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid cart with user and items', async () => {
      const userId = new mongoose.Types.ObjectId();
      const productId = new mongoose.Types.ObjectId();

      const cart = new Cart({
        user: userId,
        items: [{
          product: productId,
          part_number: 'PN-001',
          product_name: 'Test Product',
          quantity: 5
        }]
      });

      await cart.validate();
      expect(cart.items).toHaveLength(1);
    });

    it('should require user field', async () => {
      const cart = new Cart({
        items: [{
          product: new mongoose.Types.ObjectId(),
          quantity: 5
        }]
      });

      await expect(cart.validate()).rejects.toThrow();
    });

    it('should require product in items', async () => {
      const cart = new Cart({
        user: new mongoose.Types.ObjectId(),
        items: [{
          quantity: 5
        }]
      });

      await expect(cart.validate()).rejects.toThrow();
    });

    it('should require quantity in items', async () => {
      const cart = new Cart({
        user: new mongoose.Types.ObjectId(),
        items: [{
          product: new mongoose.Types.ObjectId()
        }]
      });

      await expect(cart.validate()).rejects.toThrow();
    });

    it('should require minimum quantity of 1', async () => {
      const cart = new Cart({
        user: new mongoose.Types.ObjectId(),
        items: [{
          product: new mongoose.Types.ObjectId(),
          quantity: 0
        }]
      });

      await expect(cart.validate()).rejects.toThrow();
    });

    it('should not allow negative quantity', async () => {
      const cart = new Cart({
        user: new mongoose.Types.ObjectId(),
        items: [{
          product: new mongoose.Types.ObjectId(),
          quantity: -5
        }]
      });

      await expect(cart.validate()).rejects.toThrow();
    });
  });

  describe('Cart Items', () => {
    it('should store multiple items', async () => {
      const userId = new mongoose.Types.ObjectId();
      const cart = new Cart({
        user: userId,
        items: [
          { product: new mongoose.Types.ObjectId(), quantity: 5 },
          { product: new mongoose.Types.ObjectId(), quantity: 3 },
          { product: new mongoose.Types.ObjectId(), quantity: 10 }
        ]
      });

      await cart.validate();
      expect(cart.items).toHaveLength(3);
    });

    it('should have _id for each cart item', () => {
      const cart = new Cart({
        user: new mongoose.Types.ObjectId(),
        items: [{
          product: new mongoose.Types.ObjectId(),
          quantity: 5
        }]
      });

      expect(cart.items[0]._id).toBeDefined();
    });

    it('should store product details in item', async () => {
      const productId = new mongoose.Types.ObjectId();
      const cart = new Cart({
        user: new mongoose.Types.ObjectId(),
        items: [{
          product: productId,
          part_number: 'MS20426AD3-4',
          product_name: 'Solid Rivet',
          quantity: 100
        }]
      });

      await cart.validate();

      expect(cart.items[0].part_number).toBe('MS20426AD3-4');
      expect(cart.items[0].product_name).toBe('Solid Rivet');
      expect(cart.items[0].quantity).toBe(100);
    });

    it('should have added_at default to now', () => {
      const cart = new Cart({
        user: new mongoose.Types.ObjectId(),
        items: [{
          product: new mongoose.Types.ObjectId(),
          quantity: 5
        }]
      });

      expect(cart.items[0].added_at).toBeDefined();
      expect(cart.items[0].added_at instanceof Date).toBe(true);
    });
  });

  describe('One Cart Per User', () => {
    it('should create cart with unique user reference', async () => {
      const userId = new mongoose.Types.ObjectId();
      const cart = new Cart({
        user: userId,
        items: [{
          product: new mongoose.Types.ObjectId(),
          quantity: 1
        }]
      });

      await cart.save();
      expect(cart.user.toString()).toBe(userId.toString());
    });

    it('should not allow duplicate users', async () => {
      const userId = new mongoose.Types.ObjectId();

      const cart1 = new Cart({
        user: userId,
        items: [{
          product: new mongoose.Types.ObjectId(),
          quantity: 1
        }]
      });
      await cart1.save();

      const cart2 = new Cart({
        user: userId,
        items: [{
          product: new mongoose.Types.ObjectId(),
          quantity: 2
        }]
      });

      await expect(cart2.save()).rejects.toThrow();
    });
  });

  describe('Empty Cart', () => {
    it('should allow cart with empty items array', async () => {
      const cart = new Cart({
        user: new mongoose.Types.ObjectId(),
        items: []
      });

      await cart.validate();
      expect(cart.items).toHaveLength(0);
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt and updatedAt after save', async () => {
      const cart = new Cart({
        user: new mongoose.Types.ObjectId(),
        items: [{
          product: new mongoose.Types.ObjectId(),
          quantity: 1
        }]
      });

      await cart.save();

      expect(cart.createdAt).toBeDefined();
      expect(cart.updatedAt).toBeDefined();
    });
  });

  describe('References', () => {
    it('should accept valid user ObjectId', async () => {
      const userId = new mongoose.Types.ObjectId();
      const cart = new Cart({
        user: userId,
        items: [{
          product: new mongoose.Types.ObjectId(),
          quantity: 1
        }]
      });

      await cart.validate();
      expect(cart.user.toString()).toBe(userId.toString());
    });

    it('should accept valid product ObjectId in items', async () => {
      const productId = new mongoose.Types.ObjectId();
      const cart = new Cart({
        user: new mongoose.Types.ObjectId(),
        items: [{
          product: productId,
          quantity: 1
        }]
      });

      await cart.validate();
      expect(cart.items[0].product.toString()).toBe(productId.toString());
    });
  });
});
