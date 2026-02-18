import Quotation from "./quotations.model.js";
import catchAsync from "../../utils/catchAsync.js";
import ApiResponse from "../../utils/apiResponse.js";
import AppError from "../../utils/AppError.js";
import { ROLES } from "../../constants/index.js";

// ===========================
// GET /api/quotations
// ===========================
export const getAll = catchAsync(async (req, res) => {
  const { status, buyer, page = 1, limit = 100 } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (buyer) filter.buyer = buyer;

  const skip = (Number(page) - 1) * Number(limit);

  const [quotations, total] = await Promise.all([
    Quotation.find(filter)
      .populate("buyer", "name email user_id")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Quotation.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, quotations, page, limit, total, "Quotations fetched");
});

// ===========================
// GET /api/quotations/:id
// ===========================
export const getById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const quotation = await Quotation.findById(id)
    .populate("buyer", "name email user_id phone")
    .populate("items.product", "product_name part_number image");

  if (!quotation) {
    throw new AppError("Quotation not found", 404);
  }

  return ApiResponse.success(res, { quotation }, "Quotation fetched");
});

// ===========================
// POST /api/quotations
// ===========================
export const create = catchAsync(async (req, res) => {
  const quotation = await Quotation.create(req.body);
  return ApiResponse.created(res, { quotation }, "Quotation created");
});

// ===========================
// PUT /api/quotations/:id
// ===========================
export const update = catchAsync(async (req, res) => {
  const { id } = req.params;

  const quotation = await Quotation.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!quotation) {
    throw new AppError("Quotation not found", 404);
  }

  return ApiResponse.success(res, { quotation }, "Quotation updated");
});

// ===========================
// DELETE /api/quotations/:id
// ===========================
export const remove = catchAsync(async (req, res) => {
  const { id } = req.params;

  const quotation = await Quotation.findByIdAndDelete(id);

  if (!quotation) {
    throw new AppError("Quotation not found", 404);
  }

  return ApiResponse.success(res, null, "Quotation deleted");
});

// ===========================
// GET /api/quotations/my
// ===========================
// Buyer only — fetch my quotations
export const getMyQuotations = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  // Match by buyer ID or by customer_email (for quotations created before buyer was linked)
  const filter = {
    $or: [
      { buyer: req.user._id },
      { customer_email: req.user.email },
    ],
  };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [quotations, total] = await Promise.all([
    Quotation.find(filter)
      .populate("items.product", "product_name part_number image")
      .populate("source_order", "po_number title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Quotation.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, quotations, page, limit, total, "My quotations fetched");
});

// ===========================
// GET /api/quotations/:id/view
// ===========================
// Buyer sees own, Admin sees any
export const getByIdForBuyer = catchAsync(async (req, res) => {
  const { id } = req.params;

  const quotation = await Quotation.findById(id)
    .populate("buyer", "name email user_id phone")
    .populate("items.product", "product_name part_number image")
    .populate("source_order", "po_number title customer_notes");

  if (!quotation) {
    throw new AppError("Quotation not found", 404);
  }

  const isAdminUser =
    req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.SUB_ADMIN;

  // Buyers can only view their own quotations
  const isOwner =
    quotation.buyer?._id?.toString() === req.user._id.toString() ||
    quotation.customer_email === req.user.email;

  if (!isAdminUser && !isOwner) {
    throw new AppError("You can only view your own quotations", 403);
  }

  return ApiResponse.success(res, { quotation }, "Quotation fetched");
});

// ===========================
// PUT /api/quotations/:id/accept
// ===========================
// Buyer only — accept a quotation
export const accept = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { shipping_address } = req.body;

  const quotation = await Quotation.findById(id);

  if (!quotation) {
    throw new AppError("Quotation not found", 404);
  }

  // Check ownership (buyers can only accept their own quotations)
  const isAdminUser =
    req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.SUB_ADMIN;

  const isOwner =
    quotation.buyer?.toString() === req.user._id.toString() ||
    quotation.customer_email === req.user.email;

  if (!isAdminUser && !isOwner) {
    throw new AppError("You can only accept your own quotations", 403);
  }

  if (quotation.status !== "SENT") {
    throw new AppError("Only SENT quotations can be accepted", 400);
  }

  // Check if expired
  if (quotation.expiry_date && new Date(quotation.expiry_date) < new Date()) {
    throw new AppError("This quotation has expired", 400);
  }

  quotation.status = "ACCEPTED";
  quotation.accepted_at = new Date();

  // Save shipping address if provided
  if (shipping_address) {
    quotation.shipping_address = {
      street: shipping_address.street || "",
      city: shipping_address.city || "",
      state: shipping_address.state || "",
      zip: shipping_address.zip || "",
      country: shipping_address.country || "",
    };
  }

  await quotation.save();

  return ApiResponse.success(res, { quotation }, "Quotation accepted");
});

// ===========================
// PUT /api/quotations/:id/reject
// ===========================
// Buyer only — reject a quotation
export const reject = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const quotation = await Quotation.findById(id);

  if (!quotation) {
    throw new AppError("Quotation not found", 404);
  }

  // Check ownership (buyers can only reject their own quotations)
  const isAdminUser =
    req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.SUB_ADMIN;

  const isOwner =
    quotation.buyer?.toString() === req.user._id.toString() ||
    quotation.customer_email === req.user.email;

  if (!isAdminUser && !isOwner) {
    throw new AppError("You can only reject your own quotations", 403);
  }

  if (quotation.status !== "SENT") {
    throw new AppError("Only SENT quotations can be rejected", 400);
  }

  quotation.status = "REJECTED";
  quotation.rejection_reason = reason || "";
  quotation.rejected_at = new Date();
  await quotation.save();

  return ApiResponse.success(res, { quotation }, "Quotation rejected");
});
