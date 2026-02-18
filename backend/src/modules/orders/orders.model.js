import mongoose from "mongoose";

const { Schema } = mongoose;

// ===========================
// Order Item (embedded) — carries pricing from quotation
// ===========================
const OrderItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
    product_id: String, // For quote requests before product ObjectId is resolved
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
    requested_unit_price: {
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
// Shipping Address (embedded)
// ===========================
const ShippingAddressSchema = new Schema(
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
// Dispatch History Item (embedded)
// ===========================
const DispatchHistoryItemSchema = new Schema(
  {
    product_id: String,
    product_name: String,
    part_number: String,
    quantity: Number,
    unit_price: Number,
  },
  { _id: false }
);

// ===========================
// Dispatch History Entry (embedded)
// ===========================
const DispatchHistorySchema = new Schema(
  {
    dispatch_id: String,
    dispatch_date: Date,
    items: [DispatchHistoryItemSchema],
    total_quantity: Number,
    total_amount: Number,
    // Shipping details
    hsn_code: String,
    awb_number: String,
    shipping_by: String,
    shipping_notes: String,
    // Invoice reference
    invoice_number: String,
    invoice_generated: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

// ===========================
// Payment History Entry (embedded)
// ===========================
const PaymentEntrySchema = new Schema(
  {
    payment: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
    },
    amount: Number,
    payment_method: String,
    payment_date: Date,
    notes: String,
  },
  { _id: false }
);

// ===========================
// Main Order Schema
// ===========================
const OrderSchema = new Schema(
  {
    // Auto-generated: ORD-00001, ORD-00002...
    order_id: {
      type: String,
      unique: true,
      index: true,
    },

    title: {
      type: String,
      trim: true,
    },

    // Buyer (optional for quote requests)
    buyer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    buyer_name: String,

    // Source references
    quotation: {
      type: Schema.Types.ObjectId,
      ref: "Quotation",
    },
    purchase_order: {
      type: Schema.Types.ObjectId,
      ref: "PurchaseOrder",
    },

    // For tracking quote conversion
    converted_to_quote_id: String,

    order_date: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["PENDING", "QUOTED", "CONVERTED", "OPEN", "PROCESSING", "DISPATCHED", "DELIVERED", "CANCELLED"],
      default: "OPEN",
      index: true,
    },

    // Order type - for quote requests vs regular orders
    order_type: {
      type: String,
      enum: ["ORDER", "QUOTE_REQUEST"],
      default: "ORDER",
    },

    // Priority for quote requests
    priority: {
      type: String,
      enum: ["LOW", "NORMAL", "HIGH"],
      default: "NORMAL",
    },

    // PO number for display (different from order_id)
    po_number: {
      type: String,
      index: true,
    },

    // Customer info for quote requests (before buyer user is linked)
    customer_id: String,
    customer_name: String,
    customer_email: String,
    customer_notes: String,

    payment_status: {
      type: String,
      enum: ["UNPAID", "PARTIAL", "PAID"],
      default: "UNPAID",
      index: true,
    },

    // Items with pricing (copied from quotation)
    items: [OrderItemSchema],

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

    // Payment tracking
    payment_received: {
      type: Number,
      default: 0,
    },
    payment_history: [PaymentEntrySchema],

    shipping_address: ShippingAddressSchema,
    dispatch_info: DispatchInfoSchema,

    // Dispatch tracking fields
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
    dispatch_history: [DispatchHistorySchema],

    // PI reference for linking order to PI
    proforma_invoice: {
      type: Schema.Types.ObjectId,
      ref: "ProformaInvoice",
    },
    pi_number: String,

    notes: String,
    admin_notes: String,
    estimated_delivery: Date,
  },
  {
    timestamps: true,
  }
);

// ===========================
// Pre-save: Auto-generate order_id and po_number
// ===========================
OrderSchema.pre("save", async function () {
  // Generate order_id if not exists
  if (!this.order_id) {
    const last = await mongoose
      .model("Order")
      .findOne({ order_id: /^ORD-/ })
      .sort({ order_id: -1 })
      .select("order_id");

    let nextNum = 1;
    if (last) {
      const lastNum = parseInt(last.order_id.split("-")[1], 10);
      nextNum = lastNum + 1;
    }

    this.order_id = `ORD-${String(nextNum).padStart(5, "0")}`;
  }

  // Generate po_number if not exists (for quote requests)
  if (!this.po_number) {
    const year = new Date().getFullYear();
    const lastPO = await mongoose
      .model("Order")
      .findOne({ po_number: new RegExp(`^PO${year}`) })
      .sort({ po_number: -1 })
      .select("po_number");

    let nextPONum = 1;
    if (lastPO && lastPO.po_number) {
      const numPart = lastPO.po_number.replace(`PO${year}`, "");
      nextPONum = parseInt(numPart, 10) + 1;
    }

    this.po_number = `PO${year}${String(nextPONum).padStart(4, "0")}`;
  }
});

// ===========================
// Export Model
// ===========================
const Order = mongoose.model("Order", OrderSchema);

export default Order;
