import mongoose from "mongoose";
import Supplier from "./suppliers.model.js";
import catchAsync from "../../utils/catchAsync.js";
import ApiResponse from "../../utils/apiResponse.js";
import AppError from "../../utils/AppError.js";
import { SUPPLIER_STATUS } from "../../constants/index.js";

// Helper to check if string is valid ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ===========================
// GET /api/suppliers
// ===========================
// Admin — fetch all suppliers with search/filter
// No pagination needed: max 100 suppliers (fixed business limit)
export const getAll = catchAsync(async (req, res) => {
  const { search, status } = req.query;

  const query = {};

  // Filter by status
  if (status && Object.values(SUPPLIER_STATUS).includes(status)) {
    query.status = status;
  }

  // Search by name, code, or email
  if (search) {
    query.$or = [
      { supplier_name: { $regex: search, $options: "i" } },
      { supplier_code: { $regex: search, $options: "i" } },
      { "contact.email": { $regex: search, $options: "i" } },
    ];
  }

  const suppliers = await Supplier.find(query).sort({ createdAt: -1 });

  return ApiResponse.success(res, { suppliers }, "Suppliers fetched");
});

// ===========================
// GET /api/suppliers/active
// ===========================
// Admin — fetch only active suppliers (for dropdowns)
export const getActive = catchAsync(async (req, res) => {
  const suppliers = await Supplier.find({ status: SUPPLIER_STATUS.ACTIVE })
    .select("supplier_id supplier_code supplier_name contact.email contact.phone")
    .sort({ supplier_name: 1 });

  return ApiResponse.success(res, { suppliers }, "Active suppliers fetched");
});

// ===========================
// GET /api/suppliers/:id
// ===========================
// Admin — get supplier by ID
export const getById = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Build query based on whether ID is valid ObjectId
  const query = isValidObjectId(id)
    ? { $or: [{ _id: id }, { supplier_id: id }] }
    : { supplier_id: id };

  const supplier = await Supplier.findOne(query);

  if (!supplier) {
    throw new AppError("Supplier not found", 404);
  }

  return ApiResponse.success(res, { supplier }, "Supplier fetched");
});

// ===========================
// POST /api/suppliers
// ===========================
// Admin — create new supplier
export const create = catchAsync(async (req, res) => {
  const {
    supplier_code,
    supplier_name,
    status,
    contact,
    address,
    business_info,
    bank_details,
    products_supplied,
  } = req.body;

  if (!supplier_code || !supplier_name) {
    throw new AppError("Supplier code and name are required", 400);
  }

  // Check for duplicate code
  const existingSupplier = await Supplier.findOne({ supplier_code });
  if (existingSupplier) {
    throw new AppError("Supplier with this code already exists", 400);
  }

  const supplierData = {
    supplier_code,
    supplier_name,
    status: status || SUPPLIER_STATUS.ACTIVE,
    contact: contact || {},
    address: address || {},
    business_info: business_info || {},
    bank_details: bank_details || {},
    products_supplied: products_supplied || [],
  };

  const supplier = await Supplier.create(supplierData);

  return ApiResponse.created(res, { supplier }, "Supplier created");
});

// ===========================
// PUT /api/suppliers/:id
// ===========================
// Admin — update supplier
export const update = catchAsync(async (req, res) => {
  const {
    supplier_code,
    supplier_name,
    status,
    contact,
    address,
    business_info,
    bank_details,
    products_supplied,
  } = req.body;

  const { id } = req.params;
  const query = isValidObjectId(id)
    ? { $or: [{ _id: id }, { supplier_id: id }] }
    : { supplier_id: id };

  const supplier = await Supplier.findOne(query);

  if (!supplier) {
    throw new AppError("Supplier not found", 404);
  }

  // Check for duplicate code if changing
  if (supplier_code && supplier_code !== supplier.supplier_code) {
    const existingSupplier = await Supplier.findOne({ supplier_code });
    if (existingSupplier) {
      throw new AppError("Supplier with this code already exists", 400);
    }
    supplier.supplier_code = supplier_code;
  }

  if (supplier_name !== undefined) supplier.supplier_name = supplier_name;
  if (status !== undefined) supplier.status = status;
  if (contact !== undefined) supplier.contact = { ...supplier.contact, ...contact };
  if (address !== undefined) supplier.address = { ...supplier.address, ...address };
  if (business_info !== undefined) supplier.business_info = { ...supplier.business_info, ...business_info };
  if (bank_details !== undefined) supplier.bank_details = { ...supplier.bank_details, ...bank_details };
  if (products_supplied !== undefined) supplier.products_supplied = products_supplied;

  await supplier.save();

  return ApiResponse.success(res, { supplier }, "Supplier updated");
});

// ===========================
// PUT /api/suppliers/:id/status
// ===========================
// Admin — toggle supplier status
export const updateStatus = catchAsync(async (req, res) => {
  const { status } = req.body;

  if (!status || !Object.values(SUPPLIER_STATUS).includes(status)) {
    throw new AppError("Valid status is required (ACTIVE or INACTIVE)", 400);
  }

  const { id } = req.params;
  const query = isValidObjectId(id)
    ? { $or: [{ _id: id }, { supplier_id: id }] }
    : { supplier_id: id };

  const supplier = await Supplier.findOne(query);

  if (!supplier) {
    throw new AppError("Supplier not found", 404);
  }

  supplier.status = status;
  await supplier.save();

  return ApiResponse.success(
    res,
    { supplier },
    `Supplier ${status === SUPPLIER_STATUS.ACTIVE ? "activated" : "deactivated"}`
  );
});

// ===========================
// DELETE /api/suppliers/:id
// ===========================
// Admin — delete supplier (soft delete by setting INACTIVE)
export const remove = catchAsync(async (req, res) => {
  const { id } = req.params;
  const query = isValidObjectId(id)
    ? { $or: [{ _id: id }, { supplier_id: id }] }
    : { supplier_id: id };

  const supplier = await Supplier.findOne(query);

  if (!supplier) {
    throw new AppError("Supplier not found", 404);
  }

  // Soft delete - set to inactive
  supplier.status = SUPPLIER_STATUS.INACTIVE;
  await supplier.save();

  return ApiResponse.success(res, null, "Supplier deactivated");
});

// ===========================
// PUT /api/suppliers/:id/performance
// ===========================
// Admin — update supplier performance metrics
export const updatePerformance = catchAsync(async (req, res) => {
  const { total_orders, total_value, on_time_delivery_rate, quality_rating, last_order_date } = req.body;

  const { id } = req.params;
  const query = isValidObjectId(id)
    ? { $or: [{ _id: id }, { supplier_id: id }] }
    : { supplier_id: id };

  const supplier = await Supplier.findOne(query);

  if (!supplier) {
    throw new AppError("Supplier not found", 404);
  }

  if (total_orders !== undefined) supplier.performance.total_orders = total_orders;
  if (total_value !== undefined) supplier.performance.total_value = total_value;
  if (on_time_delivery_rate !== undefined) supplier.performance.on_time_delivery_rate = on_time_delivery_rate;
  if (quality_rating !== undefined) supplier.performance.quality_rating = quality_rating;
  if (last_order_date !== undefined) supplier.performance.last_order_date = last_order_date;

  await supplier.save();

  return ApiResponse.success(res, { supplier }, "Performance updated");
});
