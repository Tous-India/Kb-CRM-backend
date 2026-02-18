import mongoose from "mongoose";

const { Schema } = mongoose;

// ===========================
// PO Item (embedded) — buyer submits product + quantity only
// No pricing — admin sets pricing in quotation stage
// ===========================
const POItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    part_number: String,
    product_name: String,
    quantity: {
      type: Number,
      required: true,
      min: 1,
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
// Main Purchase Order Schema
// ===========================
const PurchaseOrderSchema = new Schema(
  {
    // Auto-generated: PO-00001, PO-00002...
    po_number: {
      type: String,
      unique: true,
      index: true,
    },

    // Title given by buyer (e.g. "Urgent Parts Request")
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Buyer who raised this PO
    buyer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    buyer_name: String,

    po_date: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["PENDING", "CONVERTED", "REJECTED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },

    // Set when PO is converted to a quotation
    converted_to_quote: {
      type: Schema.Types.ObjectId,
      ref: "Quotation",
    },

    // Items — product + quantity only (no pricing from buyer)
    items: [POItemSchema],

    shipping_address: ShippingAddressSchema,

    customer_notes: String,
    admin_notes: String,
  },
  {
    timestamps: true,
  }
);

// ===========================
// Pre-save: Auto-generate po_number
// ===========================
PurchaseOrderSchema.pre("save", async function () {
  if (this.po_number) return;

  const lastPO = await mongoose
    .model("PurchaseOrder")
    .findOne({ po_number: /^PO-/ })
    .sort({ po_number: -1 })
    .select("po_number");

  let nextNum = 1;
  if (lastPO) {
    const lastNum = parseInt(lastPO.po_number.split("-")[1], 10);
    nextNum = lastNum + 1;
  }

  this.po_number = `PO-${String(nextNum).padStart(5, "0")}`;
});

// ===========================
// Export Model
// ===========================
const PurchaseOrder = mongoose.model("PurchaseOrder", PurchaseOrderSchema);

export default PurchaseOrder;
