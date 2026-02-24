import mongoose from "mongoose";

const { Schema } = mongoose;

// ===========================
// Address Sub-Schema (for shipping)
// ===========================
const AddressSchema = new Schema(
  {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String,
  },
  { _id: false }
);

// ===========================
// Quotation Item (embedded)
// ===========================
const QuotationItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
    product_id: String, // String product ID (e.g., "PRD-00002")
    part_number: String,
    product_name: String,
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unit_price: {
      type: Number,
      default: 0,
      min: 0,
    },
    total_price: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

// ===========================
// Main Quotation Schema
// ===========================
const QuotationSchema = new Schema(
  {
    quote_number: {
      type: String,
      unique: true,
      index: true,
    },

    buyer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    buyer_name: String,

    purchase_order: {
      type: Schema.Types.ObjectId,
      ref: "PurchaseOrder",
    },

    status: {
      type: String,
      enum: ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED", "CONVERTED"],
      default: "DRAFT",
      index: true,
    },

    items: [QuotationItemSchema],

    subtotal: {
      type: Number,
      default: 0,
    },
    tax: {
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
    },

    // Link to source order (the original PENDING order)
    source_order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },

    // Link to converted order (after buyer accepts)
    converted_to_order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },

    // Customer info (copied from source order)
    customer_id: String,
    customer_name: String,
    customer_email: String,

    notes: String,
    admin_notes: String,

    expiry_date: Date,
    exchange_rate: Number,

    // Additional charges
    logistic_charges: {
      type: Number,
      default: 0,
    },
    custom_duty: {
      type: Number,
      default: 0,
    },
    debet_note: {
      type: Number,
      default: 0,
    },
    bank_charges: {
      type: Number,
      default: 0,
    },

    // Status timestamps
    accepted_at: Date,
    rejected_at: Date,
    rejection_reason: String,
    converted_date: Date,

    // Shipping address (provided by buyer on acceptance)
    shipping_address: AddressSchema,

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
// Pre-save: Auto-generate quote_number
// ===========================
QuotationSchema.pre("save", async function () {
  if (!this.quote_number) {
    const year = new Date().getFullYear();
    const last = await mongoose
      .model("Quotation")
      .findOne({ quote_number: new RegExp(`^Q${year}`) })
      .sort({ quote_number: -1 })
      .select("quote_number");

    let nextNum = 1;
    if (last && last.quote_number) {
      const numPart = last.quote_number.replace(`Q${year}`, "");
      nextNum = parseInt(numPart, 10) + 1;
    }

    this.quote_number = `Q${year}${String(nextNum).padStart(4, "0")}`;
  }
});

// ===========================
// Export Model
// ===========================
const Quotation = mongoose.model("Quotation", QuotationSchema);

export default Quotation;
