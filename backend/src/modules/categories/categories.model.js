import mongoose from "mongoose";

const { Schema } = mongoose;

// ===========================
// Sub-Category (embedded)
// ===========================
const SubCategorySchema = new Schema(
  {
    sub_category_id: {
      type: String,
      // Note: uniqueness is enforced at application level in controller
      // Using unique:true on embedded docs creates collection-level index issues
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
  },
  { _id: false }
);

// ===========================
// Main Category Schema
// ===========================
const CategorySchema = new Schema(
  {
    // Auto-generated: CAT-001, CAT-002, etc.
    category_id: {
      type: String,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    description: String,

    sub_categories: [SubCategorySchema],

    icon: {
      url: String,
      public_id: String,
    },

    display_order: {
      type: Number,
      default: 0,
    },

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
// Pre-save: Auto-generate category_id
// ===========================
CategorySchema.pre("save", async function () {
  if (this.category_id) return;

  const lastCategory = await mongoose
    .model("Category")
    .findOne({ category_id: /^CAT-/ })
    .sort({ category_id: -1 })
    .select("category_id");

  let nextNum = 1;
  if (lastCategory) {
    const lastNum = parseInt(lastCategory.category_id.split("-")[1], 10);
    nextNum = lastNum + 1;
  }

  this.category_id = `CAT-${String(nextNum).padStart(3, "0")}`;
});

// ===========================
// Export Model
// ===========================
const Category = mongoose.model("Category", CategorySchema);

export default Category;
