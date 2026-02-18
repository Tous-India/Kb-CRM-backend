import Brand from "./brands.model.js";
import catchAsync from "../../utils/catchAsync.js";
import ApiResponse from "../../utils/apiResponse.js";
import AppError from "../../utils/AppError.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/cloudinaryUpload.js";

// ===========================
// GET /api/brands
// ===========================
// Public — fetch all active brands
export const getAll = catchAsync(async (req, res) => {
  const brands = await Brand.find({ is_active: true }).sort({ name: 1 });
  return ApiResponse.success(res, { brands }, "Brands fetched");
});

// ===========================
// GET /api/brands/:id
// ===========================
// Public
export const getById = catchAsync(async (req, res) => {
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    throw new AppError("Brand not found", 404);
  }

  return ApiResponse.success(res, { brand }, "Brand fetched");
});

// ===========================
// POST /api/brands
// ===========================
// Admin only — create brand (optional logo upload)
export const create = catchAsync(async (req, res) => {
  const { name, description, website } = req.body;

  if (!name) {
    throw new AppError("Brand name is required", 400);
  }

  const brandData = { name, description, website };

  // Upload logo if provided
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, "kb-crm/brands");
    brandData.logo = { url: result.secure_url, public_id: result.public_id };
  }

  const brand = await Brand.create(brandData);

  return ApiResponse.created(res, { brand }, "Brand created");
});

// ===========================
// PUT /api/brands/:id
// ===========================
// Admin only — update brand
export const update = catchAsync(async (req, res) => {
  const { name, description, website } = req.body;

  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    throw new AppError("Brand not found", 404);
  }

  if (name !== undefined) brand.name = name;
  if (description !== undefined) brand.description = description;
  if (website !== undefined) brand.website = website;

  // Replace logo if new file uploaded
  if (req.file) {
    if (brand.logo?.public_id) {
      await deleteFromCloudinary(brand.logo.public_id);
    }
    const result = await uploadToCloudinary(req.file.buffer, "kb-crm/brands");
    brand.logo = { url: result.secure_url, public_id: result.public_id };
  }

  await brand.save();

  return ApiResponse.success(res, { brand }, "Brand updated");
});

// ===========================
// DELETE /api/brands/:id
// ===========================
// Admin only — soft delete
export const remove = catchAsync(async (req, res) => {
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    throw new AppError("Brand not found", 404);
  }

  brand.is_active = false;
  await brand.save();

  return ApiResponse.success(res, null, "Brand deactivated");
});
