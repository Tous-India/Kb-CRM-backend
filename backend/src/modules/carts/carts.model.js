import mongoose from "mongoose";

const { Schema } = mongoose;

// ===========================
// Cart Item (embedded)
// Buyer adds product + quantity only — no pricing (hidden from buyers)
// ===========================
const CartItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    part_number: String,
    product_name: String,
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    added_at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true } // keep _id so we can target individual items
);

// ===========================
// Main Cart Schema
// One cart per user (upsert pattern)
// ===========================
const CartSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one cart per user
      index: true,
    },

    items: [CartItemSchema],
  },
  {
    timestamps: true,
  }
);

// ===========================
// Export Model
// ===========================
const Cart = mongoose.model("Cart", CartSchema);

export default Cart;
