import jwt from "jsonwebtoken";
import User from "../modules/users/users.model.js";
import AppError from "../utils/AppError.js";
import config from "../config/index.js";
import { ROLES, ALL_PERMISSIONS } from "../constants/index.js";

// ===========================
// 1. Protect — verify JWT token
// ===========================
// Use this on any route that requires login
// After this runs, req.user contains the logged-in user
export const protect = async (req, res, next) => {
  try {
    // Get token from header: "Bearer <token>"
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(new AppError("Please log in to access this route", 401));
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Find user by ID from token
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new AppError("User no longer exists", 401));
    }

    if (!user.is_active) {
      return next(new AppError("Your account has been deactivated", 401));
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// ===========================
// 1b. Optional Auth — try to verify JWT but don't fail if missing
// ===========================
// Use on routes that work for both logged-in and anonymous users
export const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      // No token - continue without user
      req.user = null;
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Find user by ID from token
    const user = await User.findById(decoded.id);

    if (user && user.is_active) {
      req.user = user;
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    // Token invalid - continue without user
    req.user = null;
    next();
  }
};

// ===========================
// 2. Authorize — check roles
// ===========================
// Use after protect middleware
// Example: authorize(ROLES.SUPER_ADMIN, ROLES.SUB_ADMIN)
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action", 403));
    }
    next();
  };
};

// ===========================
// 3. Check Permission — for sub-admins
// ===========================
// Use after protect middleware
// Example: checkPermission("manage_orders")
export const checkPermission = (permission) => {
  return (req, res, next) => {
    // SUPER_ADMIN has all permissions automatically
    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    // SUB_ADMIN must have the specific permission
    if (req.user.role === ROLES.SUB_ADMIN) {
      if (req.user.permissions.includes(permission)) {
        return next();
      }
      return next(new AppError("You do not have the required permission: " + permission, 403));
    }

    // BUYER should not reach permission-protected routes
    return next(new AppError("You do not have permission to perform this action", 403));
  };
};
