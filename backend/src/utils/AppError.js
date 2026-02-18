/**
 * Custom error class for handling operational errors.
 *
 * Usage:
 *   throw new AppError("User not found", 404);
 *   throw new AppError("Email already exists", 400);
 *   throw new AppError("Not authorized", 401);
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = statusCode >= 500 ? "error" : "fail";

    // Operational errors are expected errors (bad input, not found, etc.)
    // Programming errors are bugs (undefined variable, wrong type, etc.)
    this.isOperational = true;

    // Capture where the error was created (clean stack trace)
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
