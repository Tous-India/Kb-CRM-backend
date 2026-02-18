import mongoose from "mongoose";

const { Schema } = mongoose;

// ===========================
// PI Allocation Schema
// ===========================
const PIAllocationSchema = new Schema(
  {
    proforma_invoice: {
      type: Schema.Types.ObjectId,
      ref: "ProformaInvoice",
      required: true,
    },

    supplier: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
    },

    item_index: Number,
    part_number: String,
    product_name: String,

    quantity_total: {
      type: Number,
      default: 0,
    },
    quantity_allocated: {
      type: Number,
      default: 0,
    },
    quantity_received: {
      type: Number,
      default: 0,
    },

    unit_cost: {
      type: Number,
      default: 0,
    },
    total_cost: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["PENDING", "ALLOCATED", "PARTIAL_RECEIVED", "RECEIVED", "CANCELLED"],
      default: "PENDING",
    },

    notes: String,
  },
  {
    timestamps: true,
  }
);

const PIAllocation = mongoose.model("PIAllocation", PIAllocationSchema);

export default PIAllocation;
