import mongoose from "mongoose";
import { SUPPLIER_STATUS } from "../../constants/index.js";

const { Schema } = mongoose;

/**
 * Contact Sub-Schema
 */
const ContactSchema = new Schema(
  {
    primary_name: String,
    email: String,
    phone: String,
    secondary_email: String,
  },
  { _id: false }
);

/**
 * Address Sub-Schema
 */
const AddressSchema = new Schema(
  {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: {
      type: String,
      default: "USA",
    },
  },
  { _id: false }
);

/**
 * Business Info Sub-Schema
 */
const BusinessInfoSchema = new Schema(
  {
    tax_id: String,
    gstin: String,
    pan: String,
    registration_no: String,
  },
  { _id: false }
);

/**
 * Bank Details Sub-Schema
 */
const BankDetailsSchema = new Schema(
  {
    bank_name: String,
    account_name: String,
    account_number: String,
    ifsc_code: String,
    swift_code: String,
    branch: String,
  },
  { _id: false }
);

/**
 * Terms Sub-Schema
 */
const TermsSchema = new Schema(
  {
    payment_terms: String, // e.g., "Net 30", "50% Advance"
    currency: {
      type: String,
      default: "USD",
    },
    credit_limit: {
      type: Number,
      default: 0,
    },
    credit_used: {
      type: Number,
      default: 0,
    },
    delivery_terms: String, // e.g., "FOB Origin", "CIF"
    lead_time_days: {
      type: Number,
      default: 14,
    },
    minimum_order: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

/**
 * Performance Metrics Sub-Schema
 */
const PerformanceSchema = new Schema(
  {
    total_orders: {
      type: Number,
      default: 0,
    },
    total_value: {
      type: Number,
      default: 0,
    },
    on_time_delivery_rate: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    quality_rating: {
      type: Number,
      default: 5,
      min: 0,
      max: 5,
    },
    last_order_date: Date,
  },
  { _id: false }
);

/**
 * Main Supplier Schema
 */
const SupplierSchema = new Schema(
  {
    // Custom readable ID (SUP-XXXXX)
    supplier_id: {
      type: String,
      unique: true,
      index: true,
    },

    // Unique code for quick reference
    supplier_code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    // Supplier name
    supplier_name: {
      type: String,
      required: true,
      trim: true,
    },

    // Supplier type
    supplier_type: {
      type: String,
      enum: ["MANUFACTURER", "DISTRIBUTOR", "WHOLESALER"],
      default: "DISTRIBUTOR",
    },

    // Status
    status: {
      type: String,
      enum: Object.values(SUPPLIER_STATUS),
      default: SUPPLIER_STATUS.ACTIVE,
      index: true,
    },

    // Contact information
    contact: ContactSchema,

    // Address
    address: AddressSchema,

    // Business information
    business_info: BusinessInfoSchema,

    // Bank details
    bank_details: BankDetailsSchema,

    // Products/categories supplied
    products_supplied: {
      type: [String],
      default: [],
    },

    // Terms and conditions
    terms: {
      type: TermsSchema,
      default: () => ({}),
    },

    // Performance metrics
    performance: {
      type: PerformanceSchema,
      default: () => ({}),
    },

    // Additional notes
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// ===========================
// Pre-save: Auto-generate supplier_id
// ===========================
SupplierSchema.pre("save", async function () {
  if (this.supplier_id) return;

  const prefix = "SUP";

  // Find the last supplier to get the next number
  const lastSupplier = await mongoose
    .model("Supplier")
    .findOne({ supplier_id: new RegExp(`^${prefix}-`) })
    .sort({ supplier_id: -1 })
    .select("supplier_id");

  let nextNum = 1;
  if (lastSupplier) {
    const lastNum = parseInt(lastSupplier.supplier_id.split("-")[1], 10);
    nextNum = lastNum + 1;
  }

  // Format: SUP-00001
  this.supplier_id = `${prefix}-${String(nextNum).padStart(5, "0")}`;
});

// ===========================
// Index for text search
// ===========================
SupplierSchema.index({
  supplier_name: "text",
  supplier_code: "text",
  "contact.email": "text",
});

// ===========================
// Export Model
// ===========================
const Supplier = mongoose.model("Supplier", SupplierSchema);

export default Supplier;
