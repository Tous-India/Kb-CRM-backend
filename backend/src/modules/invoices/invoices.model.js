import mongoose from "mongoose";

const { Schema } = mongoose;

// ===========================
// Company Details (FROM - Seller)
// ===========================
const CompanyDetailsSchema = new Schema(
  {
    company_name: String,
    address_line1: String,
    address_line2: String,
    city: String,
    state: String,
    zip: String,
    country: String,
    gstin: String,
    pan: String,
    attention: String,
    phone: String,
    email: String,
  },
  { _id: false }
);

// ===========================
// Bill To / Ship To Details
// ===========================
const PartyDetailsSchema = new Schema(
  {
    company_name: String,
    address_line1: String,
    address_line2: String,
    city: String,
    state: String,
    zip: String,
    country: String,
    gstin: String,
    pan: String,
    attention: String,
    contact: String,
    email: String,
  },
  { _id: false }
);

// ===========================
// Invoice Item (embedded)
// ===========================
const InvoiceItemSchema = new Schema(
  {
    sn: Number, // Serial number
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
    product_id: String,
    part_number: String,
    product_name: String,
    description: String,
    hsn_sac_code: String, // HSN/SAC code for GST

    // Quantities
    qty_ordered: {
      type: Number,
      default: 0,
    },
    qty_delivered: {
      type: Number,
      default: 0,
    },
    qty_pending: {
      type: Number,
      default: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    // Unit of Measure
    uom: {
      type: String,
      default: "EA", // EA, PCS, KG, LTR, MTR, SET, BOX, etc.
    },

    // Delivery Status
    delivery_status: {
      type: String,
      enum: ["PENDING", "PARTIAL", "DELIVERED"],
      default: "PENDING",
    },

    // Pricing in USD
    unit_price: {
      type: Number,
      required: true,
      min: 0,
    },
    total_price: {
      type: Number,
      required: true,
      min: 0,
    },

    // Pricing in INR
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
// Bank Details (embedded)
// ===========================
const BankDetailsSchema = new Schema(
  {
    bank_name: String,
    account_name: String,
    account_number: String,
    ifsc_code: String,
    swift_code: String,
    branch: String,
    account_type: String,
  },
  { _id: false }
);

// ===========================
// Dispatch Info (embedded)
// ===========================
const DispatchInfoSchema = new Schema(
  {
    dispatch_date: Date,
    courier_service: String,
    tracking_number: String,
    dispatch_notes: String,
  },
  { _id: false }
);

// ===========================
// Tax Breakdown (embedded)
// ===========================
const TaxBreakdownSchema = new Schema(
  {
    // IGST rates (Inter-state)
    igst_5: { type: Number, default: 0 },
    igst_12: { type: Number, default: 0 },
    igst_18: { type: Number, default: 0 },
    igst_28: { type: Number, default: 0 },

    // CGST + SGST rates (Intra-state)
    cgst_2_5: { type: Number, default: 0 },
    cgst_6: { type: Number, default: 0 },
    cgst_9: { type: Number, default: 0 },
    cgst_14: { type: Number, default: 0 },
    sgst_2_5: { type: Number, default: 0 },
    sgst_6: { type: Number, default: 0 },
    sgst_9: { type: Number, default: 0 },
    sgst_14: { type: Number, default: 0 },

    // Total tax amounts
    total_igst: { type: Number, default: 0 },
    total_cgst: { type: Number, default: 0 },
    total_sgst: { type: Number, default: 0 },
    total_tax: { type: Number, default: 0 },
  },
  { _id: false }
);

// ===========================
// Main Invoice Schema
// ===========================
const InvoiceSchema = new Schema(
  {
    // ===========================
    // Invoice Identification
    // ===========================
    invoice_number: {
      type: String,
      unique: true,
      index: true,
    },

    // Custom invoice number (can be edited)
    custom_invoice_number: String,

    // Invoice type
    invoice_type: {
      type: String,
      enum: ["TAX_INVOICE", "PROFORMA", "COMMERCIAL", "EXPORT", "REIMBURSEMENT", "BILL_OF_SUPPLY"],
      default: "TAX_INVOICE",
    },

    // Source - where this invoice came from
    source: {
      type: String,
      enum: ["ORDER", "PROFORMA_INVOICE", "MANUAL"],
      default: "MANUAL",
    },

    // ===========================
    // References
    // ===========================
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
    proforma_invoice: {
      type: Schema.Types.ObjectId,
      ref: "ProformaInvoice",
    },
    proforma_invoice_number: String,
    quotation: {
      type: Schema.Types.ObjectId,
      ref: "Quotation",
    },
    quote_reference: String, // QuoteRef - can be "BYMAIL", quotation number, etc.

    // ===========================
    // Document References (Header)
    // ===========================
    hsn_sac: String, // HSS/HSN/SAC Code (e.g., IN-DL42659961966116Y)
    awb_number: String, // Air Waybill Number
    bol_number: String, // Bill of Lading Number
    po_number: String, // Purchase Order Number

    // ===========================
    // Company Details (FROM - Seller)
    // ===========================
    company_details: CompanyDetailsSchema,

    // ===========================
    // Bill To Details
    // ===========================
    bill_to: PartyDetailsSchema,

    // ===========================
    // Ship To Details
    // ===========================
    ship_to: PartyDetailsSchema,

    // ===========================
    // Buyer Reference (for system linking)
    // ===========================
    buyer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
      // Note: Not required - invoice can be created with just buyer_name/buyer_email
      // when PI/Order was created before buyer was linked
    },
    buyer_name: String,
    buyer_email: String,

    // ===========================
    // Dates
    // ===========================
    invoice_date: {
      type: Date,
      default: Date.now,
    },
    due_date: Date,
    shipping_date: Date,
    delivery_date: Date,

    // ===========================
    // Status
    // ===========================
    status: {
      type: String,
      enum: ["DRAFT", "UNPAID", "PARTIAL", "PAID", "OVERDUE", "CANCELLED", "REFUNDED"],
      default: "UNPAID",
      index: true,
    },

    // Delivery status
    delivery_status: {
      type: String,
      enum: ["PENDING", "PARTIAL", "DELIVERED", "RETURNED"],
      default: "PENDING",
    },

    // ===========================
    // Shipping & Payment Details
    // ===========================
    shipping_method: {
      type: String,
      enum: ["BYAIR", "BY_SEA", "BY_ROAD", "BY_RAIL", "COURIER", "HAND_DELIVERY", "OTHER"],
      default: "BYAIR",
    },
    shipping_carrier: String,
    tracking_number: String,

    payment_terms: {
      type: String,
      default: "NET_30", // 100%PREPAID, 50%_ADVANCE, NET_30, NET_60, etc.
    },
    payment_method: String,
    payment_date: Date,

    // ===========================
    // Currency & Exchange Rate
    // ===========================
    currency: {
      type: String,
      default: "USD",
    },
    exchange_rate: {
      type: Number,
      default: 83.5,
    },
    exchange_rate_source: {
      type: String,
      default: "CUSTOM", // AS_PER_BOE, RBI, CUSTOM, etc.
    },
    pi_exchange_rate: Number,

    // ===========================
    // Items
    // ===========================
    items: [InvoiceItemSchema],

    // ===========================
    // Financial Details (USD)
    // ===========================
    subtotal: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    discount_type: {
      type: String,
      enum: ["fixed", "percentage"],
      default: "fixed",
    },
    discount_value: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    tax_rate: {
      type: Number,
      default: 0,
    },
    shipping: {
      type: Number,
      default: 0,
    },
    freight: {
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
    logistic_charges: {
      type: Number,
      default: 0,
    },
    round_off: {
      type: Number,
      default: 0,
    },
    total_amount: {
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

    // ===========================
    // Financial Details (INR)
    // ===========================
    subtotal_inr: {
      type: Number,
      default: 0,
    },
    discount_inr: {
      type: Number,
      default: 0,
    },
    tax_inr: {
      type: Number,
      default: 0,
    },
    shipping_inr: {
      type: Number,
      default: 0,
    },
    freight_inr: {
      type: Number,
      default: 0,
    },
    round_off_inr: {
      type: Number,
      default: 0,
    },
    total_amount_inr: {
      type: Number,
      default: 0,
    },
    grand_total_inr: {
      type: Number,
      default: 0,
    },

    // ===========================
    // Tax Breakdown (GST)
    // ===========================
    tax_breakdown: TaxBreakdownSchema,

    // Tax type
    tax_type: {
      type: String,
      enum: ["IGST", "CGST_SGST", "EXEMPT", "NONE"],
      default: "IGST",
    },

    // ===========================
    // Amount in Words
    // ===========================
    amount_in_words_usd: String,
    amount_in_words_inr: String,

    // ===========================
    // Addresses (Legacy - for backward compatibility)
    // ===========================
    billing_address: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String,
    },
    shipping_address: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String,
    },

    // ===========================
    // Bank Details
    // ===========================
    bank_details: BankDetailsSchema,
    bank_account_type: String,

    // ===========================
    // Dispatch Information
    // ===========================
    dispatch_info: DispatchInfoSchema,
    include_dispatch_info: {
      type: Boolean,
      default: false,
    },

    // ===========================
    // Terms and Conditions
    // ===========================
    terms_and_conditions: [String],

    // Default terms preset
    terms_preset: {
      type: String,
      default: "STANDARD", // STANDARD, EXPORT, DOMESTIC, CUSTOM
    },

    // ===========================
    // Notes & Remarks
    // ===========================
    notes: String,
    internal_notes: String,
    remarks: String,

    // ===========================
    // Flags
    // ===========================
    is_manual: {
      type: Boolean,
      default: false,
    },
    is_editable: {
      type: Boolean,
      default: true,
    },
    is_draft: {
      type: Boolean,
      default: false,
    },
    is_printed: {
      type: Boolean,
      default: false,
    },
    is_emailed: {
      type: Boolean,
      default: false,
    },

    // ===========================
    // Audit Trail
    // ===========================
    created_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    updated_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    last_printed_at: Date,
    last_emailed_at: Date,
  },
  {
    timestamps: true,
  }
);

// ===========================
// Pre-save: Auto-generate invoice_number
// ===========================
InvoiceSchema.pre("save", async function () {
  if (this.invoice_number) return;

  const last = await mongoose
    .model("Invoice")
    .findOne({ invoice_number: /^INV-/ })
    .sort({ invoice_number: -1 })
    .select("invoice_number");

  let nextNum = 1;
  if (last) {
    const lastNum = parseInt(last.invoice_number.split("-")[1], 10);
    nextNum = lastNum + 1;
  }

  this.invoice_number = `INV-${String(nextNum).padStart(5, "0")}`;
});

// ===========================
// Pre-save: Calculate INR amounts
// ===========================
InvoiceSchema.pre("save", function () {
  const rate = this.exchange_rate || 83.5;

  // Calculate INR amounts
  this.subtotal_inr = Math.round((this.subtotal || 0) * rate * 100) / 100;
  this.discount_inr = Math.round((this.discount || 0) * rate * 100) / 100;
  this.tax_inr = Math.round((this.tax || 0) * rate * 100) / 100;
  this.shipping_inr = Math.round((this.shipping || 0) * rate * 100) / 100;
  this.freight_inr = Math.round((this.freight || 0) * rate * 100) / 100;
  this.total_amount_inr = Math.round((this.total_amount || 0) * rate * 100) / 100;

  // Calculate grand total in INR (with tax breakdown if applicable)
  if (this.tax_breakdown) {
    this.grand_total_inr = this.total_amount_inr + (this.tax_breakdown.total_tax || 0);
  } else {
    this.grand_total_inr = this.total_amount_inr;
  }

  // Update item INR prices
  if (this.items && this.items.length > 0) {
    this.items.forEach(item => {
      item.unit_price_inr = Math.round((item.unit_price || 0) * rate * 100) / 100;
      item.total_price_inr = Math.round((item.total_price || 0) * rate * 100) / 100;

      // Calculate pending quantity
      item.qty_pending = (item.qty_ordered || item.quantity || 0) - (item.qty_delivered || 0);
    });
  }
});

// ===========================
// Virtual: Display Invoice Number
// ===========================
InvoiceSchema.virtual("display_invoice_number").get(function () {
  return this.custom_invoice_number || this.invoice_number;
});

// ===========================
// Export Model
// ===========================
const Invoice = mongoose.model("Invoice", InvoiceSchema);

export default Invoice;
