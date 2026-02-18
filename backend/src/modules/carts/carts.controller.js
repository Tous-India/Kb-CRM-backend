import Cart from "./carts.model.js";
import Product from "../products/products.model.js";
import PurchaseOrder from "../purchaseOrders/purchaseOrders.model.js";
import catchAsync from "../../utils/catchAsync.js";
import ApiResponse from "../../utils/apiResponse.js";
import AppError from "../../utils/AppError.js";

// ===========================
// GET /api/carts
// ===========================
// Buyer — get my cart with populated product details
export const getMyCart = catchAsync(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product",
    "product_name part_number image stock_status product_id"
  );

  // If no cart exists yet, return empty cart
  if (!cart) {
    cart = { items: [] };
  }

  return ApiResponse.success(res, { cart }, "Cart fetched successfully");
});

// ===========================
// POST /api/carts/items
// ===========================
// Buyer — add a product to cart
// Body: { product: "<product_id>", quantity: 5 }
export const addItem = catchAsync(async (req, res) => {
  const { product, quantity } = req.body;

  if (!product || !quantity) {
    throw new AppError("Product ID and quantity are required", 400);
  }

  if (quantity < 1) {
    throw new AppError("Quantity must be at least 1", 400);
  }

  // Verify product exists
  const productDoc = await Product.findById(product);
  if (!productDoc) {
    throw new AppError("Product not found", 404);
  }

  // Find or create cart for this user
  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  // Check if product already in cart — update quantity
  const existingItem = cart.items.find(
    (item) => item.product.toString() === product
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({
      product: productDoc._id,
      part_number: productDoc.part_number,
      product_name: productDoc.product_name,
      quantity,
    });
  }

  await cart.save();

  // Return populated cart
  await cart.populate(
    "items.product",
    "product_name part_number image stock_status product_id"
  );

  return ApiResponse.success(res, { cart }, "Item added to cart");
});

// ===========================
// PUT /api/carts/items/:itemId
// ===========================
// Buyer — update quantity of a cart item
// Body: { quantity: 10 }
export const updateItem = catchAsync(async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    throw new AppError("Quantity must be at least 1", 400);
  }

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  const item = cart.items.id(itemId);

  if (!item) {
    throw new AppError("Item not found in cart", 404);
  }

  item.quantity = quantity;
  await cart.save();

  await cart.populate(
    "items.product",
    "product_name part_number image stock_status product_id"
  );

  return ApiResponse.success(res, { cart }, "Cart item updated");
});

// ===========================
// DELETE /api/carts/items/:itemId
// ===========================
// Buyer — remove a single item from cart
export const removeItem = catchAsync(async (req, res) => {
  const { itemId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  const item = cart.items.id(itemId);

  if (!item) {
    throw new AppError("Item not found in cart", 404);
  }

  item.deleteOne();
  await cart.save();

  await cart.populate(
    "items.product",
    "product_name part_number image stock_status product_id"
  );

  return ApiResponse.success(res, { cart }, "Item removed from cart");
});

// ===========================
// DELETE /api/carts
// ===========================
// Buyer — clear entire cart
export const clearCart = catchAsync(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  cart.items = [];
  await cart.save();

  return ApiResponse.success(res, { cart }, "Cart cleared");
});

// ===========================
// POST /api/carts/checkout
// ===========================
// Buyer — convert cart to a Purchase Order
// Body: { title: "Q1 Restock", shipping_address: {...}, customer_notes: "..." }
// Creates a PO from cart items, then clears the cart
export const checkout = catchAsync(async (req, res) => {
  const { title, shipping_address, customer_notes } = req.body;

  if (!title) {
    throw new AppError("Purchase order title is required", 400);
  }

  // Get cart
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart || cart.items.length === 0) {
    throw new AppError("Cart is empty", 400);
  }

  // Build PO items from cart (product + quantity only, no pricing)
  const poItems = cart.items.map((item) => ({
    product: item.product,
    part_number: item.part_number,
    product_name: item.product_name,
    quantity: item.quantity,
  }));

  // Create Purchase Order
  const purchaseOrder = await PurchaseOrder.create({
    title,
    buyer: req.user._id,
    buyer_name: req.user.name,
    items: poItems,
    shipping_address,
    customer_notes,
  });

  // Clear cart after successful PO creation
  cart.items = [];
  await cart.save();

  return ApiResponse.created(
    res,
    { purchaseOrder },
    "Order placed successfully. Purchase order created."
  );
});
