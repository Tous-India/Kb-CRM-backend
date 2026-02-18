import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import AppError from "./AppError.js";

/**
 * Upload a single image buffer to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer from multer
 * @param {String} folder - Cloudinary folder (e.g. "categories", "products")
 * @param {Object} options - Optional upload options
 * @param {String} options.resource_type - "image", "raw", or "auto" (default: "image")
 * @returns {Object} { public_id, secure_url }
 */
export const uploadToCloudinary = (fileBuffer, folder, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `kb-crm/${folder}`,
        resource_type: options.resource_type || "image",
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(new AppError("File upload failed: " + error.message, 500));
        } else {
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
          });
        }
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

/**
 * Delete a single image from Cloudinary by public_id
 * @param {String} publicId - Cloudinary public_id
 */
export const deleteFromCloudinary = async (publicId) => {
  const result = await cloudinary.uploader.destroy(publicId);
  return result;
};
