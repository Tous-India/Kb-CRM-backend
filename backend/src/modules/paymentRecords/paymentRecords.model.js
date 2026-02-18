import mongoose from "mongoose";
const { Schema } = mongoose;

/**
 * PaymentRecords Model
 * Stores payment submissions from buyers OR direct collections by admin
 * Once verified, the payment is recorded in the ProformaInvoice
 */

const PaymentRecordSchema = new Schema(
  {
    // Reference to the proforma invoice
    proforma_invoice: {
      type: Schema.Types.ObjectId,
      ref: "ProformaInvoice",
      required: true,
    },
    proforma_number: {
      type: String,
      required: true,
    },

    // Reference to the buyer (required for buyer submissions, optional for admin collections)
    buyer: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    buyer_name: String,
    buyer_email: String,

    // Collection source - how the payment info was received
    collection_source: {
      type: String,
      enum: ["BUYER_PORTAL", "ADMIN_DIRECT", "EMAIL", "PHONE_CALL", "IN_PERSON", "OTHER"],
      default: "BUYER_PORTAL",
    },

    // Admin who collected the payment (for admin-initiated collections)
    collected_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    collected_by_name: String,

    // Payment details
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    transaction_id: {
      type: String,
      default: "",
    },
    payment_method: {
      type: String,
      enum: ["BANK_TRANSFER", "WIRE_TRANSFER", "CREDIT_CARD", "DEBIT_CARD", "UPI", "CHECK", "CASH", "OTHER"],
      default: "BANK_TRANSFER",
    },
    payment_date: {
      type: Date,
      required: true,
    },
    notes: String,

    // Payment proof file (filename/path)
    proof_file: String,
    proof_file_url: String,

    // Verification status
    status: {
      type: String,
      enum: ["PENDING", "VERIFIED", "REJECTED"],
      default: "PENDING",
    },

    // Admin verification details
    verified_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    verified_at: Date,
    verification_notes: String,

    // Amount actually recorded (admin can adjust if needed)
    recorded_amount: {
      type: Number,
      min: 0,
    },

    // Edit tracking
    last_edited_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    last_edited_at: Date,
    edit_history: [{
      edited_by: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      edited_at: Date,
      previous_amount: Number,
      new_amount: Number,
      notes: String,
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
PaymentRecordSchema.index({ proforma_invoice: 1 });
PaymentRecordSchema.index({ buyer: 1 });
PaymentRecordSchema.index({ status: 1 });
PaymentRecordSchema.index({ createdAt: -1 });

const PaymentRecord = mongoose.model("PaymentRecord", PaymentRecordSchema);

export default PaymentRecord;
