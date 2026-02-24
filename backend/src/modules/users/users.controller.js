import User from "./users.model.js";
import catchAsync from "../../utils/catchAsync.js";
import ApiResponse from "../../utils/apiResponse.js";
import AppError from "../../utils/AppError.js";
import { ROLES, ALL_PERMISSIONS } from "../../constants/index.js";
import {
  sendBuyerInquiryEmail,
  sendBuyerApprovalEmail,
  sendBuyerRejectionEmail,
} from "../../utils/emailService.js";

// ===========================
// GET /api/users
// ===========================
// Admin only — fetch all users with optional filters
// No pagination needed: max ~150 users (100 buyers + 50 admins)
export const getAll = catchAsync(async (req, res) => {
  const { role, is_active, search } = req.query;

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

  const users = await User.find(filter)
    .select("-password")
    .sort({ createdAt: -1 });

  return ApiResponse.success(res, { users }, "Users fetched");
});

// ===========================
// GET /api/users/buyers
// ===========================
// Admin only — fetch all buyers
// No pagination needed: max 100 buyers (fixed business limit)
export const getBuyers = catchAsync(async (req, res) => {
  const { search } = req.query;

  const filter = { role: ROLES.BUYER };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const buyers = await User.find(filter)
    .select("-password")
    .sort({ createdAt: -1 });

  return ApiResponse.success(res, { buyers }, "Buyers fetched");
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
// GET /api/users/profile/me
// ===========================
// Get current user's profile (any authenticated user)
export const getProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return ApiResponse.success(res, { user }, "Profile fetched");
});

// ===========================
// PUT /api/users/profile/me
// ===========================
// Update current user's profile (any authenticated user)
export const updateProfile = catchAsync(async (req, res) => {
  const {
    name,
    email,
    phone,
    fax,
    website,
    address,
    company_details,
  } = req.body;

  const user = await User.findById(req.user._id).select("-password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // If email is being changed, check for duplicates
  if (email !== undefined && email !== user.email) {
    const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
    if (existingUser) {
      throw new AppError("Email is already in use by another account", 400);
    }
    user.email = email;
  }

  // Update allowed fields
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (fax !== undefined) user.fax = fax;
  if (website !== undefined) user.website = website;

  // Update address fields
  if (address !== undefined) {
    user.address = {
      ...user.address?.toObject?.() || {},
      ...address,
    };
  }

  // Update company details
  if (company_details !== undefined) {
    user.company_details = {
      ...user.company_details?.toObject?.() || {},
      ...company_details,
    };
  }

  await user.save();

  return ApiResponse.success(res, { user }, "Profile updated successfully");
});

// ===========================
// PUT /api/users/profile/password
// ===========================
// Change current user's password
export const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError("Current password and new password are required", 400);
  }

  if (newPassword.length < 6) {
    throw new AppError("New password must be at least 6 characters", 400);
  }

  const user = await User.findById(req.user._id).select("+password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError("Current password is incorrect", 401);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  return ApiResponse.success(res, null, "Password changed successfully");
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
  const { name, email, phone, address, company_details } = req.body;

  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // If email is being changed, check for duplicates
  if (email !== undefined && email !== user.email) {
    const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
    if (existingUser) {
      throw new AppError("Email is already in use by another account", 400);
    }
    user.email = email;
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

// ===========================
// POST /api/users/contact
// ===========================
// Any authenticated user can send a contact message to admin
export const sendContactMessage = catchAsync(async (req, res) => {
  const { subject, message } = req.body;

  if (!subject || !message) {
    throw new AppError("Subject and message are required", 400);
  }

  const user = req.user;

  // Build inquiry object for email template
  const inquiry = {
    subject,
    message,
    buyer: {
      name: user.name,
      email: user.email,
      company_name: user.company_details?.company_name || user.name,
      phone: user.phone,
    },
    // No documentType/documentNumber for general contact
  };

  // Send email via CRM
  try {
    await sendBuyerInquiryEmail(inquiry);
  } catch (emailError) {
    console.error("[Users] Contact email failed:", emailError.message);
    throw new AppError("Failed to send message. Please try again later.", 500);
  }

  return ApiResponse.success(res, null, "Your message has been sent to our team. We will respond shortly.");
});

// =====================================================
// BUYER REGISTRATION APPROVAL ENDPOINTS
// =====================================================

// ===========================
// GET /api/users/pending-approvals
// ===========================
// Admin only — fetch all buyers pending approval
// No pagination needed: max 100 buyers (fixed business limit)
export const getPendingApprovals = catchAsync(async (req, res) => {
  const filter = {
    role: ROLES.BUYER,
    approval_status: "PENDING",
  };

  const users = await User.find(filter)
    .select("-password")
    .sort({ createdAt: -1 });

  return ApiResponse.success(res, { users }, "Pending approvals fetched");
});

// ===========================
// GET /api/users/pending-approvals/count
// ===========================
// Admin only — get count of pending approvals (for badge)
export const getPendingApprovalsCount = catchAsync(async (req, res) => {
  const count = await User.countDocuments({
    role: ROLES.BUYER,
    approval_status: "PENDING",
  });

  return ApiResponse.success(res, { count }, "Pending approvals count fetched");
});

// ===========================
// PUT /api/users/:id/approve
// ===========================
// Admin only — approve a buyer's registration
export const approveUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.role !== ROLES.BUYER) {
    throw new AppError("Only buyer registrations can be approved", 400);
  }

  if (user.approval_status === "APPROVED") {
    throw new AppError("User is already approved", 400);
  }

  // Update approval status
  user.approval_status = "APPROVED";
  user.approval_date = new Date();
  user.approved_by = req.user._id;
  user.is_active = true;
  user.rejection_reason = undefined;

  await user.save();

  // Send approval email to buyer
  try {
    await sendBuyerApprovalEmail(user);
  } catch (emailError) {
    console.error("[Users] Approval email failed:", emailError.message);
    // Don't fail the request if email fails
  }

  return ApiResponse.success(res, { user }, "User approved successfully. They can now log in.");
});

// ===========================
// PUT /api/users/:id/reject
// ===========================
// Admin only — reject a buyer's registration
export const rejectUser = catchAsync(async (req, res) => {
  const { reason } = req.body;
  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.role !== ROLES.BUYER) {
    throw new AppError("Only buyer registrations can be rejected", 400);
  }

  if (user.approval_status === "REJECTED") {
    throw new AppError("User is already rejected", 400);
  }

  // Update rejection status
  user.approval_status = "REJECTED";
  user.rejection_reason = reason || "";
  user.is_active = false;

  await user.save();

  // Send rejection email to buyer
  try {
    await sendBuyerRejectionEmail(user, reason);
  } catch (emailError) {
    console.error("[Users] Rejection email failed:", emailError.message);
    // Don't fail the request if email fails
  }

  return ApiResponse.success(res, { user }, "User registration rejected");
});
