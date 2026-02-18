import mongoose from "mongoose";

const { Schema } = mongoose;

// ===========================
// Transaction Entry (embedded)
// ===========================
const TransactionSchema = new Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: ["INVOICE", "PAYMENT", "CREDIT", "DEBIT"],
      required: true,
    },
    reference: String, // e.g. INV-00001, PAY-00001
    description: String,
    charges: {
      type: Number,
      default: 0,
    },
    payments: {
      type: Number,
      default: 0,
    },
    balance: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

// ===========================
// Main Statement Schema
// ===========================
const StatementSchema = new Schema(
  {
    // Auto-generated: STM-00001, STM-00002...
    statement_id: {
      type: String,
      unique: true,
      index: true,
    },

    // Buyer
    buyer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    statement_date: {
      type: Date,
      default: Date.now,
    },

    period_start: {
      type: Date,
      required: true,
    },

    period_end: {
      type: Date,
      required: true,
    },

    opening_balance: {
      type: Number,
      default: 0,
    },
    total_charges: {
      type: Number,
      default: 0,
    },
    total_payments: {
      type: Number,
      default: 0,
    },
    closing_balance: {
      type: Number,
      default: 0,
    },

    // Aging buckets
    current_due: {
      type: Number,
      default: 0,
    },
    past_due_30: {
      type: Number,
      default: 0,
    },
    past_due_60: {
      type: Number,
      default: 0,
    },
    past_due_90: {
      type: Number,
      default: 0,
    },

    transactions: [TransactionSchema],

    // Admin who generated this
    generated_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// ===========================
// Pre-save: Auto-generate statement_id
// ===========================
StatementSchema.pre("save", async function () {
  if (this.statement_id) return;

  const last = await mongoose
    .model("Statement")
    .findOne({ statement_id: /^STM-/ })
    .sort({ statement_id: -1 })
    .select("statement_id");

  let nextNum = 1;
  if (last) {
    const lastNum = parseInt(last.statement_id.split("-")[1], 10);
    nextNum = lastNum + 1;
  }

  this.statement_id = `STM-${String(nextNum).padStart(5, "0")}`;
});

// ===========================
// Export Model
// ===========================
const Statement = mongoose.model("Statement", StatementSchema);

export default Statement;
