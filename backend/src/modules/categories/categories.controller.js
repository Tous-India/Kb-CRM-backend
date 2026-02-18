import mongoose from "mongoose";
import Category from "./categories.model.js";
import catchAsync from "../../utils/catchAsync.js";
import ApiResponse from "../../utils/apiResponse.js";
import AppError from "../../utils/AppError.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/cloudinaryUpload.js";

// ===========================
// GET /api/categories
// ===========================
// Public — returns active categories
// Admin can pass ?all=true to include inactive
export const getAll = catchAsync(async (req, res) => {
  const filter = {};

  // By default, only show active categories
  // Admin can pass ?all=true to see everything
  if (req.query.all !== "true") {
    filter.is_active = true;
  }

  const categories = await Category.find(filter).sort({ display_order: 1 });

  return ApiResponse.success(res, { categories }, "Categories fetched successfully");
});

// ===========================
// GET /api/categories/:id
// ===========================
// Public — fetch by _id or category_id
export const getById = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Support both MongoDB _id and custom category_id
  const query = mongoose.Types.ObjectId.isValid(id)
    ? { _id: id }
    : { category_id: id };

  const category = await Category.findOne(query);

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  return ApiResponse.success(res, { category }, "Category fetched successfully");
});

// ===========================
// POST /api/categories
// ===========================
// Admin only — create a new category
// Send as form-data with optional "image" file field
export const create = catchAsync(async (req, res) => {
  const { name, description, display_order } = req.body;

  if (!name) {
    throw new AppError("Category name is required", 400);
  }

  const categoryData = { name, description, display_order };

  // Upload icon if file is provided
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, "categories");
    categoryData.icon = { url: result.secure_url, public_id: result.public_id };
  }

  const category = await Category.create(categoryData);

  return ApiResponse.created(res, { category }, "Category created successfully");
});

// ===========================
// PUT /api/categories/:id
// ===========================
// Admin only — update category
// Send as form-data with optional "image" file field
export const update = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, description, display_order, is_active } = req.body;

  const category = await Category.findById(id);

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  // Update only provided fields
  if (name !== undefined) category.name = name;
  if (description !== undefined) category.description = description;
  if (display_order !== undefined) category.display_order = display_order;
  if (is_active !== undefined) category.is_active = is_active;

  // Upload new icon if file is provided
  if (req.file) {
    // Delete old icon from Cloudinary if it exists
    if (category.icon && category.icon.public_id) {
      await deleteFromCloudinary(category.icon.public_id);
    }
    const result = await uploadToCloudinary(req.file.buffer, "categories");
    category.icon = { url: result.secure_url, public_id: result.public_id };
  }

  await category.save();

  return ApiResponse.success(res, { category }, "Category updated successfully");
});

// ===========================
// DELETE /api/categories/:id
// ===========================
// Admin only — soft delete (set is_active: false)
export const remove = catchAsync(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findById(id);

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  category.is_active = false;
  await category.save();

  return ApiResponse.success(res, null, "Category deleted successfully");
});

// ===========================
// POST /api/categories/:id/subcategories
// ===========================
// Admin only — add a subcategory
export const addSubCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!name) {
    throw new AppError("Sub-category name is required", 400);
  }

  const category = await Category.findById(id);

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  // Auto-generate sub_category_id
  let nextNum = 1;
  if (category.sub_categories.length > 0) {
    const lastSub = category.sub_categories[category.sub_categories.length - 1];
    const lastNum = parseInt(lastSub.sub_category_id.split("-")[1], 10);
    nextNum = lastNum + 1;
  }
  const sub_category_id = `SCAT-${String(nextNum).padStart(3, "0")}`;

  category.sub_categories.push({ sub_category_id, name, description });
  await category.save();

  return ApiResponse.created(res, { category }, "Sub-category added successfully");
});

// ===========================
// PUT /api/categories/:id/subcategories/:subId
// ===========================
// Admin only — update a subcategory
export const updateSubCategory = catchAsync(async (req, res) => {
  const { id, subId } = req.params;
  const { name, description } = req.body;

  const category = await Category.findById(id);

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  const subCategory = category.sub_categories.find(
    (sc) => sc.sub_category_id === subId
  );

  if (!subCategory) {
    throw new AppError("Sub-category not found", 404);
  }

  if (name !== undefined) subCategory.name = name;
  if (description !== undefined) subCategory.description = description;

  await category.save();

  return ApiResponse.success(res, { category }, "Sub-category updated successfully");
});

// ===========================
// DELETE /api/categories/:id/subcategories/:subId
// ===========================
// Admin only — remove a subcategory
export const removeSubCategory = catchAsync(async (req, res) => {
  const { id, subId } = req.params;

  const category = await Category.findById(id);

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  const subIndex = category.sub_categories.findIndex(
    (sc) => sc.sub_category_id === subId
  );

  if (subIndex === -1) {
    throw new AppError("Sub-category not found", 404);
  }

  category.sub_categories.splice(subIndex, 1);
  await category.save();

  return ApiResponse.success(res, null, "Sub-category removed successfully");
});
