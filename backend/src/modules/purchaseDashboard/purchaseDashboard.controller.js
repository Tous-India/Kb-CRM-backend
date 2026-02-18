import catchAsync from "../../utils/catchAsync.js";
import ApiResponse from "../../utils/apiResponse.js";

// ===========================
// GET /api/purchase-dashboard/summary
// ===========================
export const getSummary = catchAsync(async (req, res) => {
  // Placeholder - will be implemented when purchase modules are complete
  const summary = {
    pending_orders: 0,
    ordered_value: 0,
    received_this_month: 0,
    total_suppliers: 0,
  };

  return ApiResponse.success(res, { summary }, "Summary fetched");
});

// ===========================
// GET /api/purchase-dashboard/supplier-stats
// ===========================
export const getSupplierStats = catchAsync(async (req, res) => {
  const stats = [];
  return ApiResponse.success(res, { stats }, "Supplier stats fetched");
});

// ===========================
// GET /api/purchase-dashboard/pending-allocations
// ===========================
export const getPendingAllocations = catchAsync(async (req, res) => {
  const allocations = [];
  return ApiResponse.success(res, { allocations }, "Pending allocations fetched");
});

// ===========================
// GET /api/purchase-dashboard/allocation-progress
// ===========================
export const getAllocationProgress = catchAsync(async (req, res) => {
  const progress = [];
  return ApiResponse.success(res, { progress }, "Allocation progress fetched");
});

// ===========================
// GET /api/purchase-dashboard/recent-activity
// ===========================
export const getRecentActivity = catchAsync(async (req, res) => {
  const activity = [];
  return ApiResponse.success(res, { activity }, "Recent activity fetched");
});
