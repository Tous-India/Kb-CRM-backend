import mongoose from "mongoose";

const { Schema } = mongoose;

// ===========================
// Location Sub-Schema
// ===========================
const LocationSchema = new Schema(
  {
    location: String,
    quantity: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

// ===========================
// Specifications Sub-Schema
// ===========================
const SpecificationsSchema = new Schema(
  {
    weight: String,
    dimensions: String,
    material: String,
    volume: String,
  },
  { _id: false }
);

// ===========================
// Main Product Schema
// ===========================
const ProductSchema = new Schema(
  {
    // Auto-generated: PRD-00001, PRD-00002...
    product_id: {
      type: String,
      unique: true,
      index: true,
    },

    part_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    oem_part: {
      type: String,
      trim: true,
    },

    product_name: {
      type: String,
      required: true,
      trim: true,
    },

    // Category & Brand (stored as strings matching names)
    category: {
      type: String,
      index: true,
      default: "Uncategorized",
    },

    sub_category: String,

    brand: {
      type: String,
      index: true,
      default: "No Brand",
    },

    description: String,

    // Pricing — ADMIN ONLY (hidden from buyer API responses)
    list_price: {
      type: Number,
      default: 0,
    },

    your_price: {
      type: Number,
      default: 0,
    },

    discount_percentage: {
      type: Number,
      default: 0,
    },

    // Inventory
    stock_status: {
      type: String,
      enum: ["In Stock", "Low Stock", "Out of Stock"],
      default: "In Stock",
      index: true,
    },

    available_locations: [LocationSchema],

    total_quantity: {
      type: Number,
      default: 0,
    },

    // Images (stored with Cloudinary public_id for deletion)
    image: {
      url: String,
      public_id: String,
    },
    additional_images: [
      {
        url: String,
        public_id: String,
      },
    ],

    // Details
    specifications: SpecificationsSchema,
    manufacturer: String,

    // State
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ===========================
// Pre-save: Auto-generate product_id
// ===========================
ProductSchema.pre("save", async function () {
  if (this.product_id) return;

  const lastProduct = await mongoose
    .model("Product")
    .findOne({ product_id: /^PRD-/ })
    .sort({ product_id: -1 })
    .select("product_id");

  let nextNum = 1;
  if (lastProduct) {
    const lastNum = parseInt(lastProduct.product_id.split("-")[1], 10);
    nextNum = lastNum + 1;
  }

  this.product_id = `PRD-${String(nextNum).padStart(5, "0")}`;
});

// ===========================
// Export Model
// ===========================
const Product = mongoose.model("Product", ProductSchema);

export default Product;
