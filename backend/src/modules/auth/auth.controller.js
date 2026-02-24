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

  // Check if email is verified (for buyers)
  if (user.role === "BUYER" && !user.email_verified) {
    throw new AppError("Please verify your email first", 401);
  }

  // Check approval status (for buyers)
  if (user.role === "BUYER") {
    if (user.approval_status === "PENDING") {
      throw new AppError("Your registration is pending admin approval. You will receive an email once approved.", 401);
    }
    if (user.approval_status === "REJECTED") {
      throw new AppError("Your registration was not approved. Please contact support for assistance.", 401);
    }
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

// ===========================
// Helper: Generate 6-digit OTP
// ===========================
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ===========================
// Helper: Validate strong password
// ===========================
const validateStrongPassword = (password) => {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const errors = [];
  if (!requirements.minLength) errors.push("at least 8 characters");
  if (!requirements.hasUppercase) errors.push("at least 1 uppercase letter");
  if (!requirements.hasLowercase) errors.push("at least 1 lowercase letter");
  if (!requirements.hasNumber) errors.push("at least 1 number");
  if (!requirements.hasSpecial) errors.push("at least 1 special character");

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ===========================
// POST /api/auth/register/initiate
// ===========================
// Step 1: User provides basic info, system sends OTP to email
export const initiateRegistration = catchAsync(async (req, res) => {
  const { name, email, phone, company_name } = req.body;

  // Validate required fields
  if (!name || !email || !phone || !company_name) {
    throw new AppError("Name, email, phone, and company name are required", 400);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError("Please provide a valid email address", 400);
  }

  // Check if email already exists with verified and approved status
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    // If user exists and is fully registered, reject
    if (existingUser.email_verified && existingUser.password) {
      throw new AppError("Email already registered. Please login or use forgot password.", 400);
    }
    // If user exists but registration incomplete, we'll update them
  }

  // Generate OTP
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Create or update user with OTP
  let user;
  if (existingUser) {
    existingUser.name = name;
    existingUser.phone = phone;
    existingUser.company_details = { company_name };
    existingUser.email_otp = otp;
    existingUser.email_otp_expires = otpExpires;
    user = await existingUser.save({ validateModifiedOnly: true });
  } else {
    user = await User.create({
      name,
      email,
      phone,
      role: "BUYER",
      company_details: { company_name },
      email_otp: otp,
      email_otp_expires: otpExpires,
      email_verified: false,
      is_active: false, // Cannot login until approved
      approval_status: "PENDING",
      password: crypto.randomBytes(32).toString("hex"), // Temporary password, will be set later
    });
  }

  // Send OTP email
  try {
    const { sendRegistrationOTP } = await import("../../utils/emailService.js");
    await sendRegistrationOTP(email, name, otp);
  } catch (emailError) {
    console.error("[Auth] Failed to send registration OTP email:", emailError.message);
    // In dev mode, continue anyway
    if (!config.isDev) {
      throw new AppError("Failed to send verification email. Please try again.", 500);
    }
  }

  // In dev mode, include OTP in response for testing
  const responseData = config.isDev ? { otp, email } : { email };

  return ApiResponse.success(
    res,
    responseData,
    "Verification code sent to your email. Please check your inbox."
  );
});

// ===========================
// POST /api/auth/register/verify-otp
// ===========================
// Step 2: User verifies OTP
export const verifyRegistrationOTP = catchAsync(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new AppError("Email and OTP are required", 400);
  }

  const user = await User.findOne({
    email,
    email_otp: otp,
    email_otp_expires: { $gt: new Date() },
  });

  if (!user) {
    throw new AppError("Invalid or expired verification code", 400);
  }

  // Mark email as verified
  user.email_verified = true;
  user.email_otp = undefined;
  user.email_otp_expires = undefined;
  await user.save({ validateModifiedOnly: true });

  // Generate verification token for password step (valid 15 min)
  const verificationToken = jwt.sign(
    { id: user._id, purpose: "registration" },
    config.jwtSecret,
    { expiresIn: "15m" }
  );

  return ApiResponse.success(
    res,
    { verification_token: verificationToken, email },
    "Email verified successfully. Please create your password."
  );
});

// ===========================
// POST /api/auth/register/complete
// ===========================
// Step 3: User creates password and completes registration
export const completeRegistration = catchAsync(async (req, res) => {
  const { email, verification_token, password, confirm_password } = req.body;

  if (!email || !verification_token || !password) {
    throw new AppError("Email, verification token, and password are required", 400);
  }

  if (password !== confirm_password) {
    throw new AppError("Passwords do not match", 400);
  }

  // Validate strong password
  const passwordValidation = validateStrongPassword(password);
  if (!passwordValidation.isValid) {
    throw new AppError(
      `Password must contain ${passwordValidation.errors.join(", ")}`,
      400
    );
  }

  // Verify token
  let decoded;
  try {
    decoded = jwt.verify(verification_token, config.jwtSecret);
    if (decoded.purpose !== "registration") {
      throw new Error("Invalid token purpose");
    }
  } catch (err) {
    throw new AppError("Invalid or expired verification token. Please restart registration.", 400);
  }

  // Find user
  const user = await User.findOne({ _id: decoded.id, email, email_verified: true });
  if (!user) {
    throw new AppError("User not found or email not verified", 400);
  }

  // Check if already completed registration
  if (user.approval_status === "APPROVED" && user.is_active) {
    throw new AppError("Registration already completed. Please login.", 400);
  }

  // Set password and update status
  user.password = password;
  user.approval_status = "PENDING";
  user.is_active = false; // Will be activated when admin approves
  await user.save();

  // Send admin notification
  try {
    const { sendAdminNewRegistrationEmail } = await import("../../utils/emailService.js");
    await sendAdminNewRegistrationEmail(user);
  } catch (emailError) {
    console.error("[Auth] Failed to send admin notification email:", emailError.message);
  }

  return ApiResponse.success(
    res,
    { email: user.email, user_id: user.user_id },
    "Registration submitted successfully! Your account is pending admin approval. You will receive an email once approved."
  );
});

// ===========================
// POST /api/auth/register/resend-otp
// ===========================
// Resend OTP for registration
export const resendRegistrationOTP = catchAsync(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError("Email is required", 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("No registration found for this email", 404);
  }

  if (user.email_verified) {
    throw new AppError("Email already verified. Please complete registration.", 400);
  }

  // Rate limiting: check if OTP was sent recently (within 60 seconds)
  if (user.email_otp_expires) {
    const timeSinceLastOTP = user.email_otp_expires.getTime() - Date.now() + 10 * 60 * 1000;
    const cooldownRemaining = 60 * 1000 - (10 * 60 * 1000 - timeSinceLastOTP);
    if (cooldownRemaining > 0) {
      throw new AppError(
        `Please wait ${Math.ceil(cooldownRemaining / 1000)} seconds before requesting another code`,
        429
      );
    }
  }

  // Generate new OTP
  const otp = generateOTP();
  user.email_otp = otp;
  user.email_otp_expires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save({ validateModifiedOnly: true });

  // Send OTP email
  try {
    const { sendRegistrationOTP } = await import("../../utils/emailService.js");
    await sendRegistrationOTP(email, user.name, otp);
  } catch (emailError) {
    console.error("[Auth] Failed to resend OTP email:", emailError.message);
    if (!config.isDev) {
      throw new AppError("Failed to send verification email. Please try again.", 500);
    }
  }

  const responseData = config.isDev ? { otp, email } : { email };

  return ApiResponse.success(
    res,
    responseData,
    "New verification code sent to your email."
  );
});

// ===========================
// POST /api/auth/forgot-password/initiate
// ===========================
// Step 1: Send OTP to email for password reset
export const forgotPasswordInitiate = catchAsync(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError("Email is required", 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if email exists for security
    return ApiResponse.success(
      res,
      { email },
      "If this email is registered, you will receive a verification code."
    );
  }

  // Only allow password reset for approved users
  if (user.role === "BUYER" && user.approval_status !== "APPROVED") {
    throw new AppError("Your account is not yet approved. Please wait for admin approval.", 400);
  }

  // Generate OTP
  const otp = generateOTP();
  user.password_reset_otp = otp;
  user.password_reset_otp_expires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save({ validateModifiedOnly: true });

  // Send OTP email
  try {
    const { sendPasswordResetOTP } = await import("../../utils/emailService.js");
    await sendPasswordResetOTP(email, user.name, otp);
  } catch (emailError) {
    console.error("[Auth] Failed to send password reset OTP:", emailError.message);
    if (!config.isDev) {
      throw new AppError("Failed to send verification email. Please try again.", 500);
    }
  }

  const responseData = config.isDev ? { otp, email } : { email };

  return ApiResponse.success(
    res,
    responseData,
    "Verification code sent to your email."
  );
});

// ===========================
// POST /api/auth/forgot-password/verify-otp
// ===========================
// Step 2: Verify OTP and return reset token
export const forgotPasswordVerifyOTP = catchAsync(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new AppError("Email and OTP are required", 400);
  }

  const user = await User.findOne({
    email,
    password_reset_otp: otp,
    password_reset_otp_expires: { $gt: new Date() },
  });

  if (!user) {
    throw new AppError("Invalid or expired verification code", 400);
  }

  // Clear OTP (one-time use)
  user.password_reset_otp = undefined;
  user.password_reset_otp_expires = undefined;
  await user.save({ validateModifiedOnly: true });

  // Generate reset token (valid 15 min)
  const resetToken = jwt.sign(
    { id: user._id, purpose: "password_reset" },
    config.jwtSecret,
    { expiresIn: "15m" }
  );

  return ApiResponse.success(
    res,
    { reset_token: resetToken, email },
    "Verification successful. Please create your new password."
  );
});

// ===========================
// POST /api/auth/forgot-password/reset
// ===========================
// Step 3: Reset password with token
export const forgotPasswordReset = catchAsync(async (req, res) => {
  const { email, reset_token, new_password, confirm_password } = req.body;

  if (!email || !reset_token || !new_password) {
    throw new AppError("Email, reset token, and new password are required", 400);
  }

  if (new_password !== confirm_password) {
    throw new AppError("Passwords do not match", 400);
  }

  // Validate strong password
  const passwordValidation = validateStrongPassword(new_password);
  if (!passwordValidation.isValid) {
    throw new AppError(
      `Password must contain ${passwordValidation.errors.join(", ")}`,
      400
    );
  }

  // Verify token
  let decoded;
  try {
    decoded = jwt.verify(reset_token, config.jwtSecret);
    if (decoded.purpose !== "password_reset") {
      throw new Error("Invalid token purpose");
    }
  } catch (err) {
    throw new AppError("Invalid or expired reset token. Please restart the process.", 400);
  }

  // Find user
  const user = await User.findOne({ _id: decoded.id, email });
  if (!user) {
    throw new AppError("User not found", 400);
  }

  // Update password
  user.password = new_password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return ApiResponse.success(
    res,
    null,
    "Password reset successful! You can now login with your new password."
  );
});

// ===========================
// POST /api/auth/forgot-password/resend-otp
// ===========================
// Resend OTP for password reset
export const forgotPasswordResendOTP = catchAsync(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError("Email is required", 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    return ApiResponse.success(
      res,
      { email },
      "If this email is registered, you will receive a new verification code."
    );
  }

  // Rate limiting
  if (user.password_reset_otp_expires) {
    const timeSinceLastOTP = user.password_reset_otp_expires.getTime() - Date.now() + 10 * 60 * 1000;
    const cooldownRemaining = 60 * 1000 - (10 * 60 * 1000 - timeSinceLastOTP);
    if (cooldownRemaining > 0) {
      throw new AppError(
        `Please wait ${Math.ceil(cooldownRemaining / 1000)} seconds before requesting another code`,
        429
      );
    }
  }

  // Generate new OTP
  const otp = generateOTP();
  user.password_reset_otp = otp;
  user.password_reset_otp_expires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save({ validateModifiedOnly: true });

  // Send OTP email
  try {
    const { sendPasswordResetOTP } = await import("../../utils/emailService.js");
    await sendPasswordResetOTP(email, user.name, otp);
  } catch (emailError) {
    console.error("[Auth] Failed to resend password reset OTP:", emailError.message);
    if (!config.isDev) {
      throw new AppError("Failed to send verification email. Please try again.", 500);
    }
  }

  const responseData = config.isDev ? { otp, email } : { email };

  return ApiResponse.success(
    res,
    responseData,
    "New verification code sent to your email."
  );
});
