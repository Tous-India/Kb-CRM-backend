import User from "./users.model.js";
import catchAsync from "../../utils/catchAsync.js";
import ApiResponse from "../../utils/apiResponse.js";
import AppError from "../../utils/AppError.js";
import { ROLES, ALL_PERMISSIONS } from "../../constants/index.js";

// ===========================
// GET /api/users
// ===========================
// Admin only — fetch all users with optional filters
export const getAll = catchAsync(async (req, res) => {
  const { role, is_active, page = 1, limit = 20, search } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (is_active !== undefined) filter.is_active = is_active === "true";
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { user_id: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, users, page, limit, total, "Users fetched");
});

// ===========================
// GET /api/users/buyers
// ===========================
// Admin only — fetch all buyers
export const getBuyers = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;

  const filter = { role: ROLES.BUYER };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [buyers, total] = await Promise.all([
    User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, buyers, page, limit, total, "Buyers fetched");
});

// ===========================
// GET /api/users/sub-admins
// ===========================
// SUPER_ADMIN only — fetch all sub-admins
export const getSubAdmins = catchAsync(async (req, res) => {
  const subAdmins = await User.find({ role: ROLES.SUB_ADMIN })
    .select("-password")
    .sort({ createdAt: -1 });

  return ApiResponse.success(res, { subAdmins }, "Sub-admins fetched");
});

// ===========================
// GET /api/users/:id
// ===========================
// Admin only
export const getById = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return ApiResponse.success(res, { user }, "User fetched");
});

// ===========================
// POST /api/users
// ===========================
// Admin only — create a buyer account
export const create = catchAsync(async (req, res) => {
  const { name, email, password, phone, address, company_details } = req.body;

  if (!name || !email || !password) {
    throw new AppError("Name, email and password are required", 400);
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError("Email already exists", 400);
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    address,
    company_details,
    role: ROLES.BUYER,
  });

  // Remove password from response
  const userObj = user.toObject();
  delete userObj.password;

  return ApiResponse.created(res, { user: userObj }, "Buyer created");
});

// ===========================
// POST /api/users/sub-admin
// ===========================
// SUPER_ADMIN only — create sub-admin with permissions
export const createSubAdmin = catchAsync(async (req, res) => {
  const { name, email, password, phone, permissions } = req.body;

  if (!name || !email || !password) {
    throw new AppError("Name, email and password are required", 400);
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError("Email already exists", 400);
  }

  // Validate permissions
  if (permissions && Array.isArray(permissions)) {
    const invalid = permissions.filter((p) => !ALL_PERMISSIONS.includes(p));
    if (invalid.length > 0) {
      throw new AppError(`Invalid permissions: ${invalid.join(", ")}`, 400);
    }
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: ROLES.SUB_ADMIN,
    permissions: permissions || [],
  });

  const userObj = user.toObject();
  delete userObj.password;

  return ApiResponse.created(res, { user: userObj }, "Sub-admin created");
});

// ===========================
// PUT /api/users/:id
// ===========================
// Admin only — update user details
export const update = catchAsync(async (req, res) => {
  const { name, phone, address, company_details } = req.body;

  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (address !== undefined) user.address = address;
  if (company_details !== undefined) user.company_details = company_details;

  await user.save();

  return ApiResponse.success(res, { user }, "User updated");
});

// ===========================
// PUT /api/users/:id/permissions
// ===========================
// SUPER_ADMIN only — update sub-admin permissions
export const updatePermissions = catchAsync(async (req, res) => {
  const { permissions } = req.body;

  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.role !== ROLES.SUB_ADMIN) {
    throw new AppError("Permissions can only be set for sub-admins", 400);
  }

  if (!permissions || !Array.isArray(permissions)) {
    throw new AppError("Permissions array is required", 400);
  }

  const invalid = permissions.filter((p) => !ALL_PERMISSIONS.includes(p));
  if (invalid.length > 0) {
    throw new AppError(`Invalid permissions: ${invalid.join(", ")}`, 400);
  }

  user.permissions = permissions;
  await user.save();

  return ApiResponse.success(res, { user }, "Permissions updated");
});

// ===========================
// DELETE /api/users/:id
// ===========================
// Admin only — soft delete
export const remove = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Prevent deleting yourself
  if (user._id.toString() === req.user._id.toString()) {
    throw new AppError("You cannot delete your own account", 400);
  }

  user.is_active = false;
  await user.save();

  return ApiResponse.success(res, null, "User deactivated");
});

// ===========================
// PUT /api/users/:id/activate
// ===========================
// Admin only
export const activate = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.is_active = true;
  await user.save();

  return ApiResponse.success(res, { user }, "User activated");
});

// ===========================
// PUT /api/users/:id/deactivate
// ===========================
// Admin only
export const deactivate = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user._id.toString() === req.user._id.toString()) {
    throw new AppError("You cannot deactivate your own account", 400);
  }

  user.is_active = false;
  await user.save();

  return ApiResponse.success(res, { user }, "User deactivated");
});
