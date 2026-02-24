import mongoose from "mongoose";

const { Schema } = mongoose;

// ===========================
// Proforma Item (embedded)
// ===========================
const ProformaItemSchema = new Schema(
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
    // Allocation tracking fields
    allocation_status: {
      type: String,
      enum: ["UNALLOCATED", "PARTIAL", "ALLOCATED"],
      default: "UNALLOCATED",
    },
    allocated_qty: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

// ===========================
// Address (embedded)
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
// Main Proforma Invoice Schema
// ===========================
const ProformaInvoiceSchema = new Schema(
  {
    // Auto-generated: PI-00001, PI-00002...
    proforma_number: {
      type: String,
      unique: true,
      index: true,
    },

    // Source quotation
    quotation: {
      type: Schema.Types.ObjectId,
      ref: "Quotation",
    },

    // Buyer
    buyer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    buyer_id: String, // String buyer ID (e.g., "USR-00001")

    buyer_name: String,
    buyer_email: String,

    // Source quotation number for reference
    quote_number: String,

    issue_date: {
      type: Date,
      default: Date.now,
    },

    valid_until: Date,

    // Currency and exchange rate
    currency: {
      type: String,
      enum: ["USD", "INR", "EUR", "GBP"],
      default: "USD",
    },

    // Exchange rate at time of PI creation (1 USD = X INR)
    exchange_rate: {
      type: Number,
      default: 83.5,
    },

    // Terms
    delivery_terms: {
      type: String,
      default: "Ex-Works",
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "EXPIRED", "SENT"],
      default: "PENDING",
      index: true,
    },

    items: [ProformaItemSchema],

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

    // Additional charges
    logistic_charges: {
      type: Number,
      default: 0,
    },
    custom_duty: {
      type: Number,
      default: 0,
    },
    bank_charges: {
      type: Number,
      default: 0,
    },
    other_charges: {
      type: Number,
      default: 0,
    },

    // Debit Note (deduction from total)
    debit_note: {
      type: Number,
      default: 0,
    },
    debit_note_reason: {
      type: String,
      default: "",
    },

    total_amount: {
      type: Number,
      default: 0,
    },

    billing_address: AddressSchema,
    shipping_address: AddressSchema,

    payment_terms: {
      type: String,
      default: "100% Advance",
    },
    notes: String,

    // Admin who created this
    created_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    approved_date: Date,

    // Payment tracking
    payment_received: {
      type: Number,
      default: 0,
    },
    payment_status: {
      type: String,
      enum: ["UNPAID", "PARTIAL", "PAID"],
      default: "UNPAID",
    },
    payment_history: [
      {
        payment_id: String,
        amount: Number,
        currency: String,
        amount_usd: Number,
        exchange_rate_at_payment: Number,
        payment_method: String,
        transaction_id: String,
        payment_date: Date,
        notes: String,
        recorded_at: Date,
      },
    ],

    // Dispatch tracking
    dispatched: {
      type: Boolean,
      default: false,
    },
    dispatch_date: Date,
    dispatch_details: {
      tracking_number: String,
      courier: String,
      notes: String,
    },

    // Quantity tracking for partial dispatches
    total_quantity: {
      type: Number,
      default: 0,
    },
    dispatched_quantity: {
      type: Number,
      default: 0,
    },
    pending_quantity: {
      type: Number,
      default: 0,
    },
    dispatch_status: {
      type: String,
      enum: ["NONE", "PARTIAL", "FULL"],
      default: "NONE",
      index: true,
    },
    dispatch_count: {
      type: Number,
      default: 0,
    },

    // Allocation tracking
    allocation_complete: {
      type: Boolean,
      default: false,
    },

    // Invoice generation tracking
    invoice_generated: {
      type: Boolean,
      default: false,
    },
    invoice: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
    },
    invoice_number: String,

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
// Pre-save: Auto-generate proforma_number and calculate quantities
// ===========================
ProformaInvoiceSchema.pre("save", async function () {
  // Auto-generate proforma_number if not set
  if (!this.proforma_number) {
    const last = await mongoose
      .model("ProformaInvoice")
      .findOne({ proforma_number: /^PI-/ })
      .sort({ proforma_number: -1 })
      .select("proforma_number");

    let nextNum = 1;
    if (last) {
      const lastNum = parseInt(last.proforma_number.split("-")[1], 10);
      nextNum = lastNum + 1;
    }

    this.proforma_number = `PI-${String(nextNum).padStart(5, "0")}`;
  }

  // Calculate total_quantity from items
  if (this.items && this.items.length > 0) {
    this.total_quantity = this.items.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );
  }

  // Set pending_quantity if not already set (for new PIs)
  if (this.isNew || this.pending_quantity === undefined) {
    this.pending_quantity = this.total_quantity - (this.dispatched_quantity || 0);
  }

  // Update dispatch_status based on quantities
  if (this.dispatched_quantity === 0) {
    this.dispatch_status = "NONE";
  } else if (this.dispatched_quantity >= this.total_quantity) {
    this.dispatch_status = "FULL";
    this.dispatched = true;
  } else {
    this.dispatch_status = "PARTIAL";
  }
});

// ===========================
// Export Model
// ===========================
const ProformaInvoice = mongoose.model("ProformaInvoice", ProformaInvoiceSchema);

export default ProformaInvoice;
