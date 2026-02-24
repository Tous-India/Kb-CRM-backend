import mongoose from "mongoose";
import Product from "./products.model.js";
import catchAsync from "../../utils/catchAsync.js";
import ApiResponse from "../../utils/apiResponse.js";
import AppError from "../../utils/AppError.js";
import { ROLES } from "../../constants/index.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/cloudinaryUpload.js";

// Fields hidden from BUYER responses
const ADMIN_ONLY_FIELDS = ["list_price", "your_price", "discount_percentage"];

// Helper: strip pricing fields for buyers
const stripPricing = (product) => {
  const obj = product.toObject();
  ADMIN_ONLY_FIELDS.forEach((field) => delete obj[field]);
  return obj;
};

// Check if current user is admin
const isAdmin = (req) => {
  return (
    req.user &&
    (req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.SUB_ADMIN)
  );
};

// Helper: find product by _id or product_id
const findProductById = async (id) => {
  const query = mongoose.Types.ObjectId.isValid(id)
    ? { _id: id }
    : { product_id: id };
  return Product.findOne(query);
};

// ===========================
// GET /api/products
// ===========================
// Public — buyers see no pricing, admins see everything
// Supports: ?page, ?limit, ?category, ?brand, ?stock_status
export const getAll = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, category, brand, stock_status } = req.query;

  const filter = {};

  if (category) filter.category = category;
  if (brand) filter.brand = brand;
  if (stock_status) filter.stock_status = stock_status;

  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Product.countDocuments(filter),
  ]);

  const data = isAdmin(req) ? products : products.map(stripPricing);

  return ApiResponse.paginated(res, data, page, limit, total, "Products fetched successfully");
});

// ===========================
// GET /api/products/search
// ===========================
// Public — search by product_name, part_number, oem_part
export const search = catchAsync(async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;

  if (!q) {
    throw new AppError("Search query (q) is required", 400);
  }

  const regex = new RegExp(q, "i");
  const filter = {
    $or: [
      { product_name: regex },
      { part_number: regex },
      { oem_part: regex },
      { manufacturer: regex },
    ],
  };

  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    Product.find(filter).skip(skip).limit(Number(limit)),
    Product.countDocuments(filter),
  ]);

  const data = isAdmin(req) ? products : products.map(stripPricing);

  return ApiResponse.paginated(res, data, page, limit, total, "Search results fetched");
});

// ===========================
// GET /api/products/category/:categoryName
// ===========================
export const getByCategory = catchAsync(async (req, res) => {
  const { categoryName } = req.params;

  const products = await Product.find({
    category: categoryName,
  }).sort({ createdAt: -1 });

  const data = isAdmin(req) ? products : products.map(stripPricing);

  return ApiResponse.success(res, { products: data }, "Products by category fetched");
});

// ===========================
// GET /api/products/brand/:brandName
// ===========================
export const getByBrand = catchAsync(async (req, res) => {
  const { brandName } = req.params;

  const products = await Product.find({
    brand: brandName,
  }).sort({ createdAt: -1 });

  const data = isAdmin(req) ? products : products.map(stripPricing);

  return ApiResponse.success(res, { products: data }, "Products by brand fetched");
});

// ===========================
// GET /api/products/:id
// ===========================
export const getById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const query = mongoose.Types.ObjectId.isValid(id)
    ? { _id: id }
    : { product_id: id };

  const product = await Product.findOne(query);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const data = isAdmin(req) ? product : stripPricing(product);

  return ApiResponse.success(res, { product: data }, "Product fetched successfully");
});

// ===========================
// POST /api/products
// ===========================
// Admin only — create product (JSON body, no images)
export const create = catchAsync(async (req, res) => {
  const {
    part_number, oem_part, product_name, category, sub_category,
    brand, description, list_price, your_price, discount_percentage,
    stock_status, available_locations, total_quantity,
    specifications, manufacturer,
  } = req.body;

  if (!part_number || !product_name) {
    throw new AppError("Part number and product name are required", 400);
  }

  // Use defaults if category/brand are empty or not provided
  const productCategory = category && category.trim() ? category : "Uncategorized";
  const productBrand = brand && brand.trim() ? brand : "No Brand";

  const product = await Product.create({
    part_number, oem_part, product_name, category: productCategory, sub_category,
    brand: productBrand, description, list_price, your_price, discount_percentage,
    stock_status, available_locations, total_quantity,
    specifications, manufacturer,
  });

  return ApiResponse.created(res, { product }, "Product created successfully");
});

// ===========================
// PUT /api/products/:id
// ===========================
// Admin only — update product fields (JSON body, no images)
export const update = catchAsync(async (req, res) => {
  const { id } = req.params;

  const product = await findProductById(id);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // Handle main image update - delete old from Cloudinary if changed
  if (req.body.image !== undefined) {
    const oldImage = product.image;
    const newImage = req.body.image;

    // If old image exists and is different from new image, delete from Cloudinary
    if (oldImage?.public_id && oldImage.url !== newImage?.url) {
      try {
        await deleteFromCloudinary(oldImage.public_id);
      } catch (err) {
        console.error("Failed to delete old main image from Cloudinary:", err);
      }
    }
    product.image = newImage;
  }

  // Handle additional images update - delete removed images from Cloudinary
  if (req.body.additional_images !== undefined) {
    const oldImages = product.additional_images || [];
    const newImages = req.body.additional_images || [];

    // Find images that are being removed (exist in old but not in new)
    const newUrls = newImages.map((img) => img?.url).filter(Boolean);
    const imagesToDelete = oldImages.filter(
      (oldImg) => oldImg?.public_id && !newUrls.includes(oldImg.url)
    );

    // Delete removed images from Cloudinary
    for (const img of imagesToDelete) {
      try {
        await deleteFromCloudinary(img.public_id);
      } catch (err) {
        console.error("Failed to delete additional image from Cloudinary:", err);
      }
    }
    product.additional_images = newImages;
  }

  // Update other fields
  const fields = [
    "part_number", "oem_part", "product_name", "sub_category",
    "description", "list_price", "your_price", "discount_percentage",
    "stock_status", "available_locations", "total_quantity",
    "specifications", "manufacturer", "is_active",
  ];

  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  });

  // Handle category and brand with defaults for empty values
  if (req.body.category !== undefined) {
    product.category = req.body.category && req.body.category.trim() ? req.body.category : "Uncategorized";
  }
  if (req.body.brand !== undefined) {
    product.brand = req.body.brand && req.body.brand.trim() ? req.body.brand : "No Brand";
  }

  await product.save();

  return ApiResponse.success(res, { product }, "Product updated successfully");
});

// ===========================
// DELETE /api/products/:id
// ===========================
// Admin only — hard delete (permanently removes from database)
export const remove = catchAsync(async (req, res) => {
  const { id } = req.params;

  const product = await findProductById(id);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // Delete images from Cloudinary if they exist
  if (product.image?.public_id) {
    try {
      await deleteFromCloudinary(product.image.public_id);
    } catch (err) {
      console.error("Failed to delete main image from Cloudinary:", err);
    }
  }

  // Delete additional images from Cloudinary
  if (product.additional_images?.length > 0) {
    for (const img of product.additional_images) {
      if (img.public_id) {
        try {
          await deleteFromCloudinary(img.public_id);
        } catch (err) {
          console.error("Failed to delete additional image from Cloudinary:", err);
        }
      }
    }
  }

  // Permanently delete from database
  await Product.deleteOne({ _id: product._id });

  return ApiResponse.success(res, null, "Product deleted successfully");
});

// ===========================
// PUT /api/products/:id/inventory
// ===========================
// Admin only — update stock
export const updateInventory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { available_locations, total_quantity, stock_status } = req.body;

  const product = await findProductById(id);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (available_locations !== undefined) product.available_locations = available_locations;
  if (total_quantity !== undefined) product.total_quantity = total_quantity;
  if (stock_status !== undefined) product.stock_status = stock_status;

  await product.save();

  return ApiResponse.success(res, { product }, "Inventory updated successfully");
});

// ===========================
// POST /api/products/:id/images
// ===========================
// Admin only — upload main image + additional images via Cloudinary
// Send as form-data, field name: "images" (supports multiple files)
// First file becomes main image if product has no main image
export const uploadImages = catchAsync(async (req, res) => {
  const { id } = req.params;

  const product = await findProductById(id);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (!req.files || req.files.length === 0) {
    throw new AppError("No images provided", 400);
  }

  // Upload all files to Cloudinary
  const uploadResults = await Promise.all(
    req.files.map((file) => uploadToCloudinary(file.buffer, "products"))
  );

  // If product has no main image, set the first uploaded image as main
  if (!product.image || !product.image.url) {
    const first = uploadResults.shift();
    product.image = { url: first.secure_url, public_id: first.public_id };
  }

  // Remaining images go to additional_images
  uploadResults.forEach((result) => {
    product.additional_images.push({
      url: result.secure_url,
      public_id: result.public_id,
    });
  });

  await product.save();

  return ApiResponse.success(res, { product }, "Images uploaded successfully");
});

// ===========================
// PUT /api/products/:id/main-image
// ===========================
// Admin only — replace the main product image
// Send as form-data, field name: "images" (single file)
export const updateMainImage = catchAsync(async (req, res) => {
  const { id } = req.params;

  const product = await findProductById(id);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (!req.files || req.files.length === 0) {
    throw new AppError("No image provided", 400);
  }

  // Delete old main image from Cloudinary (don't fail if deletion fails)
  if (product.image && product.image.public_id) {
    try {
      await deleteFromCloudinary(product.image.public_id);
    } catch (err) {
      console.error("Failed to delete old main image from Cloudinary:", err);
    }
  }

  // Upload new main image
  const result = await uploadToCloudinary(req.files[0].buffer, "products");
  product.image = { url: result.secure_url, public_id: result.public_id };

  await product.save();

  return ApiResponse.success(res, { product }, "Main image updated successfully");
});

// ===========================
// DELETE /api/products/:id/images/:imageIndex
// ===========================
// Admin only — delete a single additional image by index
// Also deletes from Cloudinary
export const deleteImage = catchAsync(async (req, res) => {
  const { id, imageId } = req.params;

  const product = await findProductById(id);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const index = parseInt(imageId, 10);

  if (isNaN(index) || index < 0 || index >= product.additional_images.length) {
    throw new AppError("Invalid image index", 400);
  }

  // Delete from Cloudinary (don't fail if deletion fails)
  const imageToDelete = product.additional_images[index];
  if (imageToDelete && imageToDelete.public_id) {
    try {
      await deleteFromCloudinary(imageToDelete.public_id);
    } catch (err) {
      console.error("Failed to delete image from Cloudinary:", err);
    }
  }

  // Remove from array
  product.additional_images.splice(index, 1);
  await product.save();

  return ApiResponse.success(res, { product }, "Image deleted successfully");
});
