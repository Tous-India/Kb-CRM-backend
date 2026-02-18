import PurchaseOrder from "./purchaseOrders.model.js";
import Product from "../products/products.model.js";
import catchAsync from "../../utils/catchAsync.js";
import ApiResponse from "../../utils/apiResponse.js";
import AppError from "../../utils/AppError.js";
import { ROLES } from "../../constants/index.js";

// ===========================
// GET /api/purchase-orders
// ===========================
// Admin only — fetch all POs with optional filters
// Supports: ?status, ?page, ?limit
// Includes product prices and calculates total amount for admin view
export const getAll = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [purchaseOrders, total] = await Promise.all([
    PurchaseOrder.find(filter)
      .populate("buyer", "name email user_id")
      .populate("items.product", "product_name part_number image list_price your_price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    PurchaseOrder.countDocuments(filter),
  ]);

  // Calculate total amount for each PO based on product prices
  const purchaseOrdersWithTotals = purchaseOrders.map(po => {
    const poObj = po.toObject();
    let totalAmount = 0;

    poObj.items = poObj.items.map(item => {
      const unitPrice = item.product?.your_price || item.product?.list_price || 0;
      const itemTotal = unitPrice * item.quantity;
      totalAmount += itemTotal;

      return {
        ...item,
        unit_price: unitPrice,
        total_price: itemTotal,
      };
    });

    poObj.estimated_total = totalAmount;
    return poObj;
  });

  return ApiResponse.paginated(res, purchaseOrdersWithTotals, page, limit, total, "Purchase orders fetched");
});

// ===========================
// GET /api/purchase-orders/my
// ===========================
// Buyer only — fetch my own POs
export const getMyPurchaseOrders = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const filter = { buyer: req.user._id };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [purchaseOrders, total] = await Promise.all([
    PurchaseOrder.find(filter)
      .populate("items.product", "product_name part_number image")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    PurchaseOrder.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, purchaseOrders, page, limit, total, "My purchase orders fetched");
});

// ===========================
// GET /api/purchase-orders/:id
// ===========================
// Buyer sees own PO, Admin sees any PO
export const getById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const purchaseOrder = await PurchaseOrder.findById(id)
    .populate("buyer", "name email user_id phone")
    .populate("items.product", "product_name part_number image");

  if (!purchaseOrder) {
    throw new AppError("Purchase order not found", 404);
  }

  // Buyers can only view their own POs
  const isAdminUser =
    req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.SUB_ADMIN;

  if (!isAdminUser && purchaseOrder.buyer._id.toString() !== req.user._id.toString()) {
    throw new AppError("You can only view your own purchase orders", 403);
  }

  return ApiResponse.success(res, { purchaseOrder }, "Purchase order fetched");
});

// ===========================
// POST /api/purchase-orders
// ===========================
// Buyer only — create a new purchase order
// Body: { title, items: [{ product, quantity }], shipping_address, customer_notes }
// No pricing — buyer sends product + quantity only
// No stock validation — buyer can order out-of-stock products
export const create = catchAsync(async (req, res) => {
  const { title, items, shipping_address, customer_notes } = req.body;

  if (!title) {
    throw new AppError("Purchase order title is required", 400);
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError("At least one item is required", 400);
  }

  // Build items with product details
  const poItems = [];
  for (const item of items) {
    if (!item.product || !item.quantity) {
      throw new AppError("Each item must have a product ID and quantity", 400);
    }

    const product = await Product.findById(item.product);
    if (!product) {
      throw new AppError("Product not found: " + item.product, 404);
    }

    poItems.push({
      product: product._id,
      part_number: product.part_number,
      product_name: product.product_name,
      quantity: item.quantity,
    });
  }

  const purchaseOrder = await PurchaseOrder.create({
    title,
    buyer: req.user._id,
    buyer_name: req.user.name,
    items: poItems,
    shipping_address,
    customer_notes,
  });

  return ApiResponse.created(res, { purchaseOrder }, "Purchase order created successfully");
});

// ===========================
// PUT /api/purchase-orders/:id
// ===========================
// Buyer can update their own PENDING PO (title, items, notes, address)
export const update = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { title, items, shipping_address, customer_notes } = req.body;

  const purchaseOrder = await PurchaseOrder.findById(id);

  if (!purchaseOrder) {
    throw new AppError("Purchase order not found", 404);
  }

  // Only the buyer who created it can update
  if (purchaseOrder.buyer.toString() !== req.user._id.toString()) {
    throw new AppError("You can only update your own purchase orders", 403);
  }

  // Can only update PENDING POs
  if (purchaseOrder.status !== "PENDING") {
    throw new AppError("Only pending purchase orders can be updated", 400);
  }

  if (title !== undefined) purchaseOrder.title = title;
  if (customer_notes !== undefined) purchaseOrder.customer_notes = customer_notes;
  if (shipping_address !== undefined) purchaseOrder.shipping_address = shipping_address;

  // Rebuild items if provided
  if (items && Array.isArray(items) && items.length > 0) {
    const poItems = [];
    for (const item of items) {
      if (!item.product || !item.quantity) {
        throw new AppError("Each item must have a product ID and quantity", 400);
      }

      const product = await Product.findById(item.product);
      if (!product) {
        throw new AppError("Product not found: " + item.product, 404);
      }

      poItems.push({
        product: product._id,
        part_number: product.part_number,
        product_name: product.product_name,
        quantity: item.quantity,
      });
    }
    purchaseOrder.items = poItems;
  }

  await purchaseOrder.save();

  return ApiResponse.success(res, { purchaseOrder }, "Purchase order updated successfully");
});

// ===========================
// PUT /api/purchase-orders/:id/cancel
// ===========================
// Buyer can cancel their own PENDING PO
export const cancel = catchAsync(async (req, res) => {
  const { id } = req.params;

  const purchaseOrder = await PurchaseOrder.findById(id);

  if (!purchaseOrder) {
    throw new AppError("Purchase order not found", 404);
  }

  if (purchaseOrder.buyer.toString() !== req.user._id.toString()) {
    throw new AppError("You can only cancel your own purchase orders", 403);
  }

  if (purchaseOrder.status !== "PENDING") {
    throw new AppError("Only pending purchase orders can be cancelled", 400);
  }

  purchaseOrder.status = "CANCELLED";
  await purchaseOrder.save();

  return ApiResponse.success(res, { purchaseOrder }, "Purchase order cancelled");
});

// ===========================
// PUT /api/purchase-orders/:id/reject
// ===========================
// Admin only — reject a pending PO
export const reject = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { admin_notes } = req.body;

  const purchaseOrder = await PurchaseOrder.findById(id);

  if (!purchaseOrder) {
    throw new AppError("Purchase order not found", 404);
  }

  if (purchaseOrder.status !== "PENDING") {
    throw new AppError("Only pending purchase orders can be rejected", 400);
  }

  purchaseOrder.status = "REJECTED";
  if (admin_notes) purchaseOrder.admin_notes = admin_notes;
  await purchaseOrder.save();

  return ApiResponse.success(res, { purchaseOrder }, "Purchase order rejected");
});

// ===========================
// POST /api/purchase-orders/:id/convert-to-quotation
// ===========================
// Admin only — mark PO as converted (actual quotation creation is in quotations module)
// This just updates PO status and links the quote ID
export const convertToQuotation = catchAsync(async (req, res) => {
  const { id } = req.params;

  const purchaseOrder = await PurchaseOrder.findById(id);

  if (!purchaseOrder) {
    throw new AppError("Purchase order not found", 404);
  }

  if (purchaseOrder.status !== "PENDING") {
    throw new AppError("Only pending purchase orders can be converted", 400);
  }

  purchaseOrder.status = "CONVERTED";
  await purchaseOrder.save();

  return ApiResponse.success(res, { purchaseOrder }, "Purchase order converted to quotation");
});
