import mongoose from "mongoose";

const { Schema } = mongoose;

// ===========================
// Main Payment Schema
// ===========================
const PaymentSchema = new Schema(
  {
    // Auto-generated: PAY-00001, PAY-00002...
    payment_id: {
      type: String,
      unique: true,
      index: true,
    },

    // Source invoice
    invoice: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },

    invoice_number: String,

    // Buyer
    buyer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    buyer_name: String,

    payment_date: {
      type: Date,
      default: Date.now,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      enum: ["USD", "INR"],
      default: "USD",
    },

    // If paid in INR, store USD equivalent
    amount_usd: Number,

    payment_method: {
      type: String,
      enum: ["Credit Card", "Wire Transfer", "Check", "UPI", "BANK_TRANSFER"],
    },

    transaction_id: String,

    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
      default: "PENDING",
      index: true,
    },

    notes: String,

    // Admin who recorded this
    recorded_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// ===========================
// Pre-save: Auto-generate payment_id
// ===========================
PaymentSchema.pre("save", async function () {
  if (this.payment_id) return;

  const last = await mongoose
    .model("Payment")
    .findOne({ payment_id: /^PAY-/ })
    .sort({ payment_id: -1 })
    .select("payment_id");

  let nextNum = 1;
  if (last) {
    const lastNum = parseInt(last.payment_id.split("-")[1], 10);
    nextNum = lastNum + 1;
  }

  this.payment_id = `PAY-${String(nextNum).padStart(5, "0")}`;
});

// ===========================
// Export Model
// ===========================
const Payment = mongoose.model("Payment", PaymentSchema);

export default Payment;
