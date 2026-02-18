import config from "../config/index.js";

/**
 * Global error handling middleware.
 * This is the LAST middleware in the chain — catches all errors.
 *
 * How it works:
 * 1. Any error thrown or passed to next(error) ends up here
 * 2. Known errors (AppError) return clean messages to the client
 * 3. Unknown errors (bugs) return generic "Something went wrong"
 * 4. Mongoose-specific errors are converted to friendly messages
 */

// ---- Mongoose Error Handlers ----

// Bad ObjectId format (e.g., /api/users/invalid-id)
const handleCastError = (err) => ({
  statusCode: 400,
  message: `Invalid ${err.path}: ${err.value}`,
});

// Duplicate field value (e.g., email already exists)
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return {
    statusCode: 400,
    message: `${field} already exists: "${err.keyValue[field]}"`,
  };
};

// Validation errors (e.g., required field missing)
const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return {
    statusCode: 400,
    message: "Validation failed: " + messages.join(". "),
  };
};

// JWT invalid token
const handleJWTError = () => ({
  statusCode: 401,
  message: "Invalid token. Please log in again.",
});

// JWT expired token
const handleJWTExpiredError = () => ({
  statusCode: 401,
  message: "Token has expired. Please log in again.",
});

// ---- Main Error Handler ----

const errorMiddleware = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong";
  const status = statusCode >= 500 ? "error" : "fail";

  // Handle specific error types
  if (err.name === "CastError") {
    const handled = handleCastError(err);
    statusCode = handled.statusCode;
    message = handled.message;
  }

  if (err.code === 11000) {
    const handled = handleDuplicateKeyError(err);
    statusCode = handled.statusCode;
    message = handled.message;
  }

  if (err.name === "ValidationError") {
    const handled = handleValidationError(err);
    statusCode = handled.statusCode;
    message = handled.message;
  }

  if (err.name === "JsonWebTokenError") {
    const handled = handleJWTError();
    statusCode = handled.statusCode;
    message = handled.message;
  }

  if (err.name === "TokenExpiredError") {
    const handled = handleJWTExpiredError();
    statusCode = handled.statusCode;
    message = handled.message;
  }

  // Log error in development
  if (config.isDev) {
    console.error("ERROR:", err);
  }

  // Build response
  const response = {
    status,
    message,
  };

  // Include stack trace only in development
  if (config.isDev) {
    response.stack = err.stack;
  }

  // Hide internal error details in production
  if (config.isProd && statusCode === 500) {
    response.message = "Something went wrong. Please try again later.";
  }

  res.status(statusCode).json(response);
};

export default errorMiddleware;
