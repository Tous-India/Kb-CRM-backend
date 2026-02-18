import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * SPO Item Schema
 */
const SPOItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
    part_number: String,
    product_name: String,
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unit_cost: {
      type: Number,
      default: 0,
      min: 0,
    },
    total_cost: {
      type: Number,
      default: 0,
      min: 0,
    },
    received_qty: {
      type: Number,
      default: 0,
      min: 0,
    },
    pi_allocations: [
      {
        pi_id: String,
        pi_number: String,
        pi_item_id: String,
        allocated_qty: Number,
      },
    ],
  },
  { _id: true }
);

/**
 * Payment History Schema
 */
const PaymentHistorySchema = new Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    payment_date: Date,
    payment_method: {
      type: String,
      enum: ["WIRE_TRANSFER", "CHECK", "CASH", "CREDIT_CARD", "OTHER"],
      default: "WIRE_TRANSFER",
    },
    reference: String,
    notes: String,
  },
  { _id: true }
);

/**
 * Received Item Schema
 */
const ReceivedItemSchema = new Schema(
  {
    received_date: Date,
    item_id: String,
    quantity_received: Number,
    condition: {
      type: String,
      enum: ["GOOD", "DAMAGED", "PARTIAL"],
      default: "GOOD",
    },
    notes: String,
  },
  { _id: true }
);

/**
 * Shipping Address Schema
 */
const ShippingAddressSchema = new Schema(
  {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: {
      type: String,
      default: "India",
    },
  },
  { _id: false }
);

/**
 * Main Supplier Order Schema
 */
const SupplierOrderSchema = new Schema(
  {
    // Custom readable ID (SPO-YYYY-XXXXX)
    spo_id: {
      type: String,
      unique: true,
      index: true,
    },
    spo_number: {
      type: String,
      unique: true,
      index: true,
    },

    // Supplier reference
    supplier: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    supplier_name: String,

    // Order details
    order_date: {
      type: Date,
      default: Date.now,
    },
    expected_delivery: Date,

    // Status
    status: {
      type: String,
      enum: ["DRAFT", "ORDERED", "PARTIAL_RECEIVED", "RECEIVED", "CANCELLED"],
      default: "DRAFT",
      index: true,
    },

    // Currency and exchange
    currency: {
      type: String,
      default: "USD",
    },
    exchange_rate: {
      type: Number,
      default: 1,
    },

    // Items
    items: [SPOItemSchema],

    // Totals
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
    total_amount_inr: {
      type: Number,
      default: 0,
    },

    // Payment tracking
    payment_status: {
      type: String,
      enum: ["UNPAID", "PARTIAL", "PAID"],
      default: "UNPAID",
      index: true,
    },
    amount_paid: {
      type: Number,
      default: 0,
    },
    balance_due: {
      type: Number,
      default: 0,
    },
    payment_history: [PaymentHistorySchema],

    // Receiving tracking
    receiving_status: {
      type: String,
      enum: ["PENDING", "PARTIAL", "COMPLETE"],
      default: "PENDING",
    },
    received_items: [ReceivedItemSchema],

    // Shipping
    shipping_address: ShippingAddressSchema,

    // Notes and metadata
    notes: String,
    created_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save: Auto-generate spo_id and spo_number
SupplierOrderSchema.pre("save", async function () {
  if (this.spo_id) return;

  const year = new Date().getFullYear();
  const prefix = `SPO-${year}`;

  const last = await mongoose
    .model("SupplierOrder")
    .findOne({ spo_id: new RegExp(`^${prefix}-`) })
    .sort({ spo_id: -1 })
    .select("spo_id");

  let nextNum = 1;
  if (last) {
    const lastNum = parseInt(last.spo_id.split("-")[2], 10);
    nextNum = lastNum + 1;
  }

  this.spo_id = `${prefix}-${String(nextNum).padStart(3, "0")}`;
  this.spo_number = `SP${String(year).slice(2)}${String(nextNum).padStart(4, "0")}`;
});

// Pre-save: Calculate totals
SupplierOrderSchema.pre("save", function () {
  // Calculate item totals
  this.items.forEach((item) => {
    item.total_cost = item.quantity * item.unit_cost;
  });

  // Calculate order totals
  this.subtotal = this.items.reduce((sum, item) => sum + item.total_cost, 0);
  this.total_amount = this.subtotal + this.tax + this.shipping;
  this.total_amount_inr = this.total_amount * this.exchange_rate;
  this.balance_due = this.total_amount - this.amount_paid;

  // Update payment status
  if (this.amount_paid >= this.total_amount) {
    this.payment_status = "PAID";
  } else if (this.amount_paid > 0) {
    this.payment_status = "PARTIAL";
  } else {
    this.payment_status = "UNPAID";
  }

  // Update receiving status
  const totalQty = this.items.reduce((sum, item) => sum + item.quantity, 0);
  const receivedQty = this.items.reduce((sum, item) => sum + item.received_qty, 0);

  if (receivedQty >= totalQty) {
    this.receiving_status = "COMPLETE";
    if (this.status === "ORDERED") {
      this.status = "RECEIVED";
    }
  } else if (receivedQty > 0) {
    this.receiving_status = "PARTIAL";
    if (this.status === "ORDERED") {
      this.status = "PARTIAL_RECEIVED";
    }
  } else {
    this.receiving_status = "PENDING";
  }
});

// Index for searching
SupplierOrderSchema.index({
  spo_number: "text",
  supplier_name: "text",
});

const SupplierOrder = mongoose.model("SupplierOrder", SupplierOrderSchema);

export default SupplierOrder;
