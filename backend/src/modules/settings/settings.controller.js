import Setting from "./settings.model.js";
import catchAsync from "../../utils/catchAsync.js";
import ApiResponse from "../../utils/apiResponse.js";
import AppError from "../../utils/AppError.js";

// ===========================
// GET /api/settings
// ===========================
// Admin only — fetch all settings
export const getAll = catchAsync(async (req, res) => {
  const settings = await Setting.find().sort({ category: 1, key: 1 });
  return ApiResponse.success(res, { settings }, "Settings fetched");
});

// ===========================
// GET /api/settings/category/:category
// ===========================
// Admin only — fetch settings by category
export const getByCategory = catchAsync(async (req, res) => {
  const settings = await Setting.find({ category: req.params.category }).sort({ key: 1 });
  return ApiResponse.success(res, { settings }, "Settings fetched by category");
});

// ===========================
// GET /api/settings/:key
// ===========================
// Admin only — fetch setting by key
export const getByKey = catchAsync(async (req, res) => {
  const setting = await Setting.findOne({ key: req.params.key });

  if (!setting) {
    throw new AppError("Setting not found", 404);
  }

  return ApiResponse.success(res, { setting }, "Setting fetched");
});

// ===========================
// POST /api/settings
// ===========================
// SUPER_ADMIN only — create a setting
export const create = catchAsync(async (req, res) => {
  const { key, value, category, description } = req.body;

  if (!key || value === undefined) {
    throw new AppError("Key and value are required", 400);
  }

  const existing = await Setting.findOne({ key });
  if (existing) {
    throw new AppError("Setting with this key already exists", 400);
  }

  const setting = await Setting.create({ key, value, category, description });

  return ApiResponse.created(res, { setting }, "Setting created");
});

// ===========================
// PUT /api/settings/:key
// ===========================
// SUPER_ADMIN only — update a setting by key
export const update = catchAsync(async (req, res) => {
  const { value, description } = req.body;

  const setting = await Setting.findOne({ key: req.params.key });

  if (!setting) {
    throw new AppError("Setting not found", 404);
  }

  if (value !== undefined) setting.value = value;
  if (description !== undefined) setting.description = description;

  await setting.save();

  return ApiResponse.success(res, { setting }, "Setting updated");
});

// ===========================
// PUT /api/settings/bulk
// ===========================
// SUPER_ADMIN only — update multiple settings at once
// Body: { settings: [{ key, value }] }
export const bulkUpdate = catchAsync(async (req, res) => {
  const { settings } = req.body;

  if (!settings || !Array.isArray(settings)) {
    throw new AppError("Settings array is required", 400);
  }

  const results = [];

  for (const { key, value } of settings) {
    const setting = await Setting.findOneAndUpdate(
      { key },
      { value },
      { new: true, upsert: true }
    );
    results.push(setting);
  }

  return ApiResponse.success(res, { settings: results }, "Settings updated");
});

// ===========================
// DELETE /api/settings/:key
// ===========================
// SUPER_ADMIN only — delete a setting
export const remove = catchAsync(async (req, res) => {
  const setting = await Setting.findOneAndDelete({ key: req.params.key });

  if (!setting) {
    throw new AppError("Setting not found", 404);
  }

  return ApiResponse.success(res, null, "Setting deleted");
});
