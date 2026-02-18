import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../users/users.model.js";
import catchAsync from "../../utils/catchAsync.js";
import ApiResponse from "../../utils/apiResponse.js";
import AppError from "../../utils/AppError.js";
import config from "../../config/index.js";

// ===========================
// Helper: Generate JWT token
// ===========================
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

// ===========================
// POST /api/auth/register
// ===========================
// Creates a new BUYER account
export const register = catchAsync(async (req, res) => {
  const { name, email, password, phone } = req.body;

  // Check required fields
  if (!name || !email || !password) {
    throw new AppError("Name, email and password are required", 400);
  }

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("Email already registered", 400);
  }

  // Create user (role is always BUYER for self-registration)
  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: "BUYER",
  });

  // Generate token
  const token = generateToken(user._id);

  // Remove password from response
  const userResponse = user.toObject();
  delete userResponse.password;

  return ApiResponse.created(res, { user: userResponse, token }, "User registered successfully");
});

// ===========================
// POST /api/auth/login
// ===========================
export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  // Check required fields
  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  // Find user and include password field (normally hidden)
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  // Check if account is active
  if (!user.is_active) {
    throw new AppError("Your account has been deactivated. Contact admin.", 401);
  }

  // Compare password
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new AppError("Invalid email or password", 401);
  }

  // Update last login
  user.last_login = new Date();
  await user.save({ validateModifiedOnly: true });

  // Generate token
  const token = generateToken(user._id);

  // Remove password from response
  const userResponse = user.toObject();
  delete userResponse.password;

  return ApiResponse.success(res, { user: userResponse, token }, "Login successful");
});

// ===========================
// POST /api/auth/logout
// ===========================
// Note: With JWT, logout is handled on the client side by removing the token.
// This endpoint is here for consistency and future token blacklisting.
export const logout = catchAsync(async (req, res) => {
  return ApiResponse.success(res, null, "Logged out successfully");
});

// ===========================
// GET /api/auth/me
// ===========================
// Returns the currently logged-in user (requires protect middleware)
export const getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return ApiResponse.success(res, { user }, "Current user fetched");
});

// ===========================
// POST /api/auth/forgot-password
// ===========================
// Generates a reset token and (in production) sends email
export const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError("Email is required", 400);
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError("No user found with that email", 404);
  }

  // Generate reset token (random hex string)
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash token and save to user (we don't store plain token in DB)
  user.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour

  await user.save({ validateModifiedOnly: true });

  // TODO: Send email with resetToken
  // For now, return the token in response (dev only)
  const responseData = config.isDev ? { resetToken } : null;

  return ApiResponse.success(res, responseData, "Password reset email sent");
});

// ===========================
// POST /api/auth/reset-password/:token
// ===========================
// Verifies reset token and updates password
export const resetPassword = catchAsync(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    throw new AppError("New password is required", 400);
  }

  // Hash the token from URL to match what's stored in DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  // Find user with valid (non-expired) reset token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new AppError("Token is invalid or has expired", 400);
  }

  // Update password and clear reset fields
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Generate new login token
  const loginToken = generateToken(user._id);

  return ApiResponse.success(res, { token: loginToken }, "Password reset successful");
});
