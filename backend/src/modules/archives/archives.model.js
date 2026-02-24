import mongoose from "mongoose";

const { Schema } = mongoose;

// ===========================
// Archive Item Schema (embedded)
// ===========================
const ArchiveItemSchema = new Schema(
  {
    sn: Number,
    part_number: String,
    product_name: String,
    description: String,
    hsn_sac_code: String,
    quantity: {
      type: Number,
      default: 0,
    },
    uom: {
      type: String,
      default: "EA",
    },
    unit_price: {
      type: Number,
      default: 0,
    },
    total_price: {
      type: Number,
      default: 0,
    },
    unit_price_inr: {
      type: Number,
      default: 0,
    },
    total_price_inr: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

// ===========================
// Main Archive Schema
// ===========================
const ArchiveSchema = new Schema(
  {
    // ===========================
    // Identification
    // ===========================
    archive_id: {
      type: String,
      unique: true,
      index: true,
    },

    // Document type
    document_type: {
      type: String,
      enum: ["INVOICE", "ORDER", "QUOTATION", "PI", "PAYMENT", "OTHER"],
      default: "INVOICE",
      index: true,
    },

    // Original reference number from old system
    original_reference: {
      type: String,
      index: true,
    },

    // ===========================
    // Time Period
    // ===========================
    document_date: {
      type: Date,
      index: true,
    },

    archived_at: {
      type: Date,
      default: Date.now,
    },

    period_start: Date,
    period_end: Date,

    fiscal_year: {
      type: String,
      index: true,
    },

    // ===========================
    // Buyer/Customer Info
    // ===========================
    buyer_name: {
      type: String,
      index: true,
    },

    buyer_email: String,

    buyer_company: String,

    buyer_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    // ===========================
    // Financial
    // ===========================
    currency: {
      type: String,
      default: "USD",
    },

    exchange_rate: {
      type: Number,
      default: 83.5,
    },

    subtotal: {
      type: Number,
      default: 0,
    },

    tax: {
      type: Number,
      default: 0,
    },

    discount: {
      type: Number,
      default: 0,
    },

    shipping: {
      type: Number,
      default: 0,
    },

    total_amount: {
      type: Number,
      default: 0,
      index: true,
    },

    total_amount_inr: {
      type: Number,
      default: 0,
    },

    amount_paid: {
      type: Number,
      default: 0,
    },

    balance_due: {
      type: Number,
      default: 0,
    },

    payment_status: {
      type: String,
      enum: ["PAID", "PARTIAL", "UNPAID", "REFUNDED", "CANCELLED"],
      default: "PAID",
      index: true,
    },

    // ===========================
    // Items
    // ===========================
    items: [ArchiveItemSchema],

    // ===========================
    // Full Document Data (JSON blob)
    // ===========================
    original_data: {
      type: Schema.Types.Mixed,
      default: {},
    },

    // ===========================
    // Metadata
    // ===========================
    notes: String,

    internal_notes: String,

    tags: {
      type: [String],
      default: [],
      index: true,
    },

    // Source system info
    source_system: {
      type: String,
      default: "LEGACY",
    },

    // ===========================
    // Audit
    // ===========================
    created_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    updated_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// ===========================
// Indexes
// ===========================

// Text index for full-text search
ArchiveSchema.index({
  original_reference: "text",
  buyer_name: "text",
  buyer_company: "text",
  buyer_email: "text",
  notes: "text",
  "items.part_number": "text",
  "items.product_name": "text",
});

// Compound indexes for common queries
ArchiveSchema.index({ document_type: 1, document_date: -1 });
ArchiveSchema.index({ buyer_name: 1, document_date: -1 });
ArchiveSchema.index({ fiscal_year: 1, document_type: 1 });
ArchiveSchema.index({ payment_status: 1, document_type: 1 });

// ===========================
// Pre-save: Auto-generate archive_id
// ===========================
ArchiveSchema.pre("save", async function () {
  if (this.archive_id) return;

  const last = await mongoose
    .model("Archive")
    .findOne({ archive_id: /^ARC-/ })
    .sort({ archive_id: -1 })
    .select("archive_id");

  let nextNum = 1;
  if (last) {
    const lastNum = parseInt(last.archive_id.split("-")[1], 10);
    nextNum = lastNum + 1;
  }

  this.archive_id = `ARC-${String(nextNum).padStart(5, "0")}`;
});

// ===========================
// Pre-save: Calculate INR amounts if not provided
// ===========================
ArchiveSchema.pre("save", function () {
  const rate = this.exchange_rate || 83.5;

  // Only calculate if INR amount not already set
  if (!this.total_amount_inr && this.total_amount) {
    this.total_amount_inr = Math.round(this.total_amount * rate * 100) / 100;
  }

  // Update item INR prices if not set
  if (this.items && this.items.length > 0) {
    this.items.forEach((item) => {
      if (!item.unit_price_inr && item.unit_price) {
        item.unit_price_inr = Math.round(item.unit_price * rate * 100) / 100;
      }
      if (!item.total_price_inr && item.total_price) {
        item.total_price_inr = Math.round(item.total_price * rate * 100) / 100;
      }
    });
  }
});

// ===========================
// Export Model
// ===========================
const Archive = mongoose.model("Archive", ArchiveSchema);

export default Archive;
