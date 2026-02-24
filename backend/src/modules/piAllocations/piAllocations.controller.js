import PIAllocation from "./piAllocations.model.js";
import catchAsync from "../../utils/catchAsync.js";
import ApiResponse from "../../utils/apiResponse.js";
import AppError from "../../utils/AppError.js";

// ===========================
// GET /api/pi-allocations
// ===========================
export const getAll = catchAsync(async (req, res) => {
  const { proforma_invoice, supplier, status, page = 1, limit = 100 } = req.query;

  const filter = {};
  if (proforma_invoice) filter.proforma_invoice = proforma_invoice;
  if (supplier) filter.supplier = supplier;
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [allocations, total] = await Promise.all([
    PIAllocation.find(filter)
      .populate("proforma_invoice", "pi_number")
      .populate("supplier", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    PIAllocation.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, allocations, page, limit, total, "Allocations fetched");
});

// ===========================
// GET /api/pi-allocations/:id
// ===========================
export const getById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const allocation = await PIAllocation.findById(id)
    .populate("proforma_invoice")
    .populate("supplier");

  if (!allocation) {
    throw new AppError("Allocation not found", 404);
  }

  return ApiResponse.success(res, { allocation }, "Allocation fetched");
});

// ===========================
// GET /api/pi-allocations/by-pi/:piId
// ===========================
export const getByPI = catchAsync(async (req, res) => {
  const { piId } = req.params;

  const allocations = await PIAllocation.find({ proforma_invoice: piId })
    .populate("supplier", "name");

  return ApiResponse.success(res, { allocations }, "Allocations fetched");
});

// ===========================
// POST /api/pi-allocations
// ===========================
export const create = catchAsync(async (req, res) => {
  const allocation = await PIAllocation.create(req.body);
  return ApiResponse.created(res, { allocation }, "Allocation created");
});

// ===========================
// POST /api/pi-allocations/bulk
// ===========================
export const bulkSave = catchAsync(async (req, res) => {
  const { allocations } = req.body;

  if (!allocations || !Array.isArray(allocations)) {
    throw new AppError("Allocations array is required", 400);
  }

  // First, delete existing allocations for this PI to avoid duplicates
  const piIds = [...new Set(allocations.map(a => a.proforma_invoice).filter(Boolean))];
  if (piIds.length > 0) {
    await PIAllocation.deleteMany({ proforma_invoice: { $in: piIds } });
  }

  // Then insert all new allocations
  const result = await PIAllocation.insertMany(allocations);
  return ApiResponse.created(res, { allocations: result, saved: result.length }, "Allocations saved");
});

// ===========================
// PUT /api/pi-allocations/:id
// ===========================
export const update = catchAsync(async (req, res) => {
  const { id } = req.params;

  const allocation = await PIAllocation.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!allocation) {
    throw new AppError("Allocation not found", 404);
  }

  return ApiResponse.success(res, { allocation }, "Allocation updated");
});

// ===========================
// DELETE /api/pi-allocations/:id
// ===========================
export const remove = catchAsync(async (req, res) => {
  const { id } = req.params;

  const allocation = await PIAllocation.findByIdAndDelete(id);

  if (!allocation) {
    throw new AppError("Allocation not found", 404);
  }

  return ApiResponse.success(res, null, "Allocation deleted");
});

// ===========================
// GET /api/pi-allocations/summary/stats
// ===========================
export const getSummary = catchAsync(async (req, res) => {
  const stats = await PIAllocation.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        total_cost: { $sum: "$total_cost" },
      },
    },
  ]);

  return ApiResponse.success(res, { stats }, "Summary fetched");
});
