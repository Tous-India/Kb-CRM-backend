import mongoose from "mongoose";

const { Schema } = mongoose;

const BrandSchema = new Schema(
  {
    // Auto-generated: BRD-001, BRD-002...
    brand_id: {
      type: String,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    logo: {
      url: String,
      public_id: String,
    },

    description: String,
    website: String,

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
// Pre-save: Auto-generate brand_id
// ===========================
BrandSchema.pre("save", async function () {
  if (this.brand_id) return;

  const last = await mongoose
    .model("Brand")
    .findOne({ brand_id: /^BRD-/ })
    .sort({ brand_id: -1 })
    .select("brand_id");

  let nextNum = 1;
  if (last) {
    const lastNum = parseInt(last.brand_id.split("-")[1], 10);
    nextNum = lastNum + 1;
  }

  this.brand_id = `BRD-${String(nextNum).padStart(3, "0")}`;
});

const Brand = mongoose.model("Brand", BrandSchema);

export default Brand;
