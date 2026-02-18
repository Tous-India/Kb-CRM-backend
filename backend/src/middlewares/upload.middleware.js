import multer from "multer";
import AppError from "../utils/AppError.js";

// ===========================
// Multer config (memory storage)
// ===========================
// Files are stored in memory as Buffer, then streamed to Cloudinary
const storage = multer.memoryStorage();

// Only allow image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new AppError("Only image files are allowed", 400), false);
  }
};

// Single image upload (for category icon)
export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
}).single("image");

// Multiple images upload (for product images, max 10)
export const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).array("images", 10);

// Payment proof upload (single image or PDF)
const paymentProofFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new AppError("Only image or PDF files are allowed", 400), false);
  }
};

export const uploadPaymentProof = multer({
  storage,
  fileFilter: paymentProofFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
}).single("proof_file");
