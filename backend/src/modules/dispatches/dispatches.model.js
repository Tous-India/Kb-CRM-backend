import mongoose from "mongoose";

const { Schema } = mongoose;

// ===========================
// Dispatch Item (embedded)
// ===========================
const DispatchItemSchema = new Schema(
  {
    product_id: String,
    product_name: String,
    part_number: String,
    quantity: Number,
    unit_price: Number,
    total_price: Number,
    hsn_code: String,
  },
  { _id: false }
);

// ===========================
// Shipping Info (embedded)
// ===========================
const ShippingInfoSchema = new Schema(
  {
    hsn_code: String,
    awb_number: String,
    shipping_by: String,
    notes: String,
  },
  { _id: false }
);

// ===========================
// Main Dispatch Record Schema
// ===========================
const DispatchSchema = new Schema(
  {
    // Auto-generated: DSP-00001, DSP-00002...
    dispatch_id: {
      type: String,
      unique: true,
      index: true,
    },

    // Reference to source document
    source_type: {
      type: String,
      enum: ["PROFORMA_INVOICE", "ORDER"],
      required: true,
      index: true,
    },
    source_id: {
      type: Schema.Types.ObjectId,
      refPath: "source_type_ref",
      required: true,
      index: true,
    },
    source_type_ref: {
      type: String,
      enum: ["ProformaInvoice", "Order"],
    },
    source_number: String, // PI number or Order number

    // Buyer info (denormalized for quick access)
    buyer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    buyer_name: String,
    buyer_email: String,

    // Dispatch details
    dispatch_date: {
      type: Date,
      default: Date.now,
    },
    dispatch_type: {
      type: String,
      enum: ["STANDARD", "PROJECT", "CREDIT", "PARTIAL", "HALF", "PERCENTAGE"],
      default: "STANDARD",
    },
    project_name: String, // For PROJECT type dispatch

    // Items dispatched
    items: [DispatchItemSchema],
    total_quantity: {
      type: Number,
      default: 0,
    },
    total_amount: {
      type: Number,
      default: 0,
    },
    exchange_rate: {
      type: Number,
      default: 83.5,
    },

    // Shipping info
    shipping_info: ShippingInfoSchema,

    // Invoice generation
    invoice_generated: {
      type: Boolean,
      default: false,
    },
    invoice_id: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
    },
    invoice_number: String,

    // Partial dispatch tracking
    is_partial: {
      type: Boolean,
      default: false,
    },
    dispatch_sequence: {
      type: Number,
      default: 1,
    }, // 1st, 2nd, 3rd dispatch for same source

    // Admin who created this
    created_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    notes: String,

    // Email tracking
    is_emailed: {
      type: Boolean,
      default: false,
    },
    last_emailed_at: Date,
    email_count: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ===========================
// Pre-save: Auto-generate dispatch_id
// ===========================
DispatchSchema.pre("save", async function () {
  if (this.dispatch_id) return;

  const last = await mongoose
    .model("Dispatch")
    .findOne({ dispatch_id: /^DSP-/ })
    .sort({ dispatch_id: -1 })
    .select("dispatch_id");

  let nextNum = 1;
  if (last) {
    const lastNum = parseInt(last.dispatch_id.split("-")[1], 10);
    nextNum = lastNum + 1;
  }

  this.dispatch_id = `DSP-${String(nextNum).padStart(5, "0")}`;
});

// ===========================
// Export Model
// ===========================
const Dispatch = mongoose.model("Dispatch", DispatchSchema);

export default Dispatch;
