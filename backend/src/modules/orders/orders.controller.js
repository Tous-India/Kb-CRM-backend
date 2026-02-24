import Order from "./orders.model.js";
import Quotation from "../quotations/quotations.model.js";
import User from "../users/users.model.js";
import catchAsync from "../../utils/catchAsync.js";
import ApiResponse from "../../utils/apiResponse.js";
import AppError from "../../utils/AppError.js";
import { ROLES } from "../../constants/index.js";
import { sendAdminNewOrderEmail } from "../../utils/emailService.js";

// ===========================
// GET /api/orders
// ===========================
// Admin only — fetch all orders with optional filters
export const getAll = catchAsync(async (req, res) => {
  const { status, payment_status, customer_id, order_type, page = 1, limit = 100 } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (payment_status) filter.payment_status = payment_status;
  if (customer_id) filter.customer_id = customer_id;
  if (order_type) filter.order_type = order_type;

  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("buyer", "name email user_id")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Order.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, orders, page, limit, total, "Orders fetched");
});

// ===========================
// GET /api/orders/my
// ===========================
// Buyer only — fetch my orders
export const getMyOrders = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const filter = { buyer: req.user._id };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("items.product", "product_name part_number image")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Order.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, orders, page, limit, total, "My orders fetched");
});

// ===========================
// GET /api/orders/open
// ===========================
// Admin only — all non-closed orders
export const getOpen = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const filter = { status: { $in: ["OPEN", "PROCESSING"] } };
  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("buyer", "name email user_id")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Order.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, orders, page, limit, total, "Open orders fetched");
});

// ===========================
// GET /api/orders/dispatched
// ===========================
// Admin only — all dispatched orders
export const getDispatched = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const filter = { status: "DISPATCHED" };
  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("buyer", "name email user_id")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Order.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, orders, page, limit, total, "Dispatched orders fetched");
});

// ===========================
// GET /api/orders/:id
// ===========================
// Buyer sees own, Admin sees any
export const getById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id)
    .populate("buyer", "name email user_id phone")
    .populate("quotation", "quote_number")
    .populate("purchase_order", "po_number title")
    .populate("items.product", "product_name part_number image");

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  const isAdminUser =
    req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.SUB_ADMIN;

  if (!isAdminUser && order.buyer._id.toString() !== req.user._id.toString()) {
    throw new AppError("You can only view your own orders", 403);
  }

  return ApiResponse.success(res, { order }, "Order fetched");
});

// ===========================
// POST /api/orders
// ===========================
// Admin only — create order from accepted/converted quotation
// Body: { quotation, shipping_address, notes, estimated_delivery }
export const create = catchAsync(async (req, res) => {
  const { quotation: quotationId, shipping_address, notes, estimated_delivery } = req.body;

  if (!quotationId) {
    throw new AppError("Quotation ID is required", 400);
  }

  const quotation = await Quotation.findById(quotationId)
    .populate("buyer", "name")
    .populate("purchase_order", "po_number title shipping_address");

  if (!quotation) {
    throw new AppError("Quotation not found", 404);
  }

  if (quotation.status !== "ACCEPTED" && quotation.status !== "CONVERTED") {
    throw new AppError("Only accepted quotations can be converted to orders", 400);
  }

  // Copy items from quotation
  const orderItems = quotation.items.map((item) => ({
    product: item.product,
    part_number: item.part_number,
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.total_price,
  }));

  const order = await Order.create({
    title: quotation.purchase_order?.title || "Order",
    buyer: quotation.buyer._id,
    buyer_name: quotation.buyer.name || quotation.buyer_name,
    quotation: quotation._id,
    purchase_order: quotation.purchase_order?._id,
    items: orderItems,
    subtotal: quotation.subtotal,
    tax: quotation.tax,
    shipping: quotation.shipping,
    total_amount: quotation.total_amount,
    shipping_address: shipping_address || quotation.purchase_order?.shipping_address,
    notes,
    estimated_delivery,
  });

  // Mark quotation as converted and link the order
  quotation.status = "CONVERTED";
  quotation.converted_to_order = order._id;
  await quotation.save();

  return ApiResponse.created(res, { order }, "Order created from quotation");
});

// ===========================
// PUT /api/orders/:id
// ===========================
// Admin only — update order fields
export const update = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { notes, admin_notes, estimated_delivery, shipping_address } = req.body;

  const order = await Order.findById(id);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (notes !== undefined) order.notes = notes;
  if (admin_notes !== undefined) order.admin_notes = admin_notes;
  if (estimated_delivery !== undefined) order.estimated_delivery = estimated_delivery;
  if (shipping_address !== undefined) order.shipping_address = shipping_address;

  await order.save();

  return ApiResponse.success(res, { order }, "Order updated");
});

// ===========================
// PUT /api/orders/:id/status
// ===========================
// Admin only — update order status
export const updateStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    throw new AppError("Status is required", 400);
  }

  const order = await Order.findById(id);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  order.status = status;
  await order.save();

  return ApiResponse.success(res, { order }, "Order status updated");
});

// ===========================
// PUT /api/orders/:id/dispatch
// ===========================
// Admin only — dispatch an order (must have payment)
export const dispatch = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { courier_service, tracking_number, dispatch_notes } = req.body;

  const order = await Order.findById(id);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.status === "DISPATCHED" || order.status === "DELIVERED") {
    throw new AppError("Order is already dispatched or delivered", 400);
  }

  if (order.status === "CANCELLED") {
    throw new AppError("Cannot dispatch a cancelled order", 400);
  }

  order.status = "DISPATCHED";
  order.dispatch_info = {
    dispatch_date: new Date(),
    courier_service,
    tracking_number,
    dispatch_notes,
  };

  await order.save();

  return ApiResponse.success(res, { order }, "Order dispatched");
});

// ===========================
// PUT /api/orders/:id/partial-dispatch
// ===========================
// Admin only — partial dispatch with tracking
// Body: { items: [...], hsn_code, awb_number, shipping_by, shipping_notes, generate_invoice, invoice_number }
export const partialDispatch = catchAsync(async (req, res) => {
  const { id } = req.params;
  const {
    items,
    hsn_code,
    awb_number,
    shipping_by,
    shipping_notes,
    generate_invoice,
    invoice_number,
  } = req.body;

  if (!items || items.length === 0) {
    throw new AppError("At least one item is required for dispatch", 400);
  }

  const order = await Order.findById(id);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.status === "DISPATCHED" || order.status === "DELIVERED") {
    throw new AppError("Order is already fully dispatched", 400);
  }

  if (order.status === "CANCELLED") {
    throw new AppError("Cannot dispatch a cancelled order", 400);
  }

  // Calculate dispatched quantity and amount
  const dispatchedQty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const dispatchTotal = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0);

  // Create dispatch record
  const dispatchRecord = {
    dispatch_id: `DSP-${Date.now()}`,
    dispatch_date: new Date(),
    items: items.map(item => ({
      product_id: item.product_id,
      product_name: item.product_name,
      part_number: item.part_number,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })),
    total_quantity: dispatchedQty,
    total_amount: dispatchTotal,
    hsn_code,
    awb_number,
    shipping_by,
    shipping_notes,
    invoice_number: invoice_number || null,
    invoice_generated: generate_invoice || false,
  };

  // Calculate remaining items after dispatch
  const remainingItems = [];
  let totalOrderQuantity = 0;

  order.items.forEach((orderItem) => {
    totalOrderQuantity += orderItem.quantity;

    // Find if this item was dispatched
    const dispatchedItem = items.find(
      (di) => di.product_id === orderItem.product_id || di.part_number === orderItem.part_number
    );

    if (dispatchedItem) {
      const remaining = orderItem.quantity - (dispatchedItem.quantity || 0);
      if (remaining > 0) {
        remainingItems.push({
          ...orderItem.toObject(),
          quantity: remaining,
          total_price: (orderItem.unit_price || 0) * remaining,
        });
      }
    } else {
      // Item was not dispatched, keep as is
      remainingItems.push(orderItem.toObject());
    }
  });

  // Update order quantities
  const newDispatchedQty = (order.dispatched_quantity || 0) + dispatchedQty;
  const newPendingQty = totalOrderQuantity - newDispatchedQty;

  // Initialize total_quantity if not set
  if (!order.total_quantity) {
    order.total_quantity = totalOrderQuantity;
  }

  order.dispatched_quantity = newDispatchedQty;
  order.pending_quantity = newPendingQty;

  // Add to dispatch history
  if (!order.dispatch_history) {
    order.dispatch_history = [];
  }
  order.dispatch_history.push(dispatchRecord);

  // Update order status and items based on remaining
  if (remainingItems.length === 0 || newPendingQty <= 0) {
    // Fully dispatched
    order.status = "DISPATCHED";
    order.dispatch_info = {
      dispatch_date: new Date(),
      courier_service: shipping_by,
      tracking_number: awb_number,
      dispatch_notes: shipping_notes,
    };
  } else {
    // Partial dispatch - update items to remaining
    order.items = remainingItems;
    order.total_amount = remainingItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
    order.status = "OPEN"; // Keep open for more dispatches
  }

  await order.save();

  return ApiResponse.success(res, {
    order,
    dispatch_record: dispatchRecord,
    remaining_items: remainingItems,
    fully_dispatched: remainingItems.length === 0 || newPendingQty <= 0,
  }, "Order dispatched successfully");
});

// ===========================
// PUT /api/orders/:id/dispatch-info
// ===========================
// Admin only — update dispatch tracking info
export const updateDispatchInfo = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { courier_service, tracking_number, dispatch_notes } = req.body;

  const order = await Order.findById(id);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (!order.dispatch_info) {
    throw new AppError("Order has not been dispatched yet", 400);
  }

  if (courier_service !== undefined) order.dispatch_info.courier_service = courier_service;
  if (tracking_number !== undefined) order.dispatch_info.tracking_number = tracking_number;
  if (dispatch_notes !== undefined) order.dispatch_info.dispatch_notes = dispatch_notes;

  await order.save();

  return ApiResponse.success(res, { order }, "Dispatch info updated");
});

// ===========================
// POST /api/orders/:id/payment
// ===========================
// Admin only — record a payment against an order
// Body: { amount, payment_method, notes }
export const recordPayment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { amount, payment_method, notes } = req.body;

  if (!amount || amount <= 0) {
    throw new AppError("Valid payment amount is required", 400);
  }

  const order = await Order.findById(id);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.status === "CANCELLED") {
    throw new AppError("Cannot record payment for a cancelled order", 400);
  }

  order.payment_received += amount;
  order.payment_history.push({
    amount,
    payment_method,
    payment_date: new Date(),
    notes,
  });

  // Update payment status
  if (order.payment_received >= order.total_amount) {
    order.payment_status = "PAID";
  } else if (order.payment_received > 0) {
    order.payment_status = "PARTIAL";
  }

  await order.save();

  return ApiResponse.success(res, { order }, "Payment recorded");
});

// ===========================
// POST /api/orders/quote-request
// ===========================
// Buyer only — submit a quote request (creates order with PENDING status)
export const submitQuoteRequest = catchAsync(async (req, res) => {
  const {
    customer_id,
    customer_name,
    customer_email,
    priority,
    customer_notes,
    items,
    total_items,
    unique_products,
    subtotal,
    tax,
    shipping,
    total_amount,
  } = req.body;

  if (!items || items.length === 0) {
    throw new AppError("At least one item is required", 400);
  }

  // Create the order with PENDING status
  const order = await Order.create({
    title: `Quote Request - ${customer_name || "Customer"}`,
    buyer: req.user?._id, // May be null if not logged in
    buyer_name: customer_name,
    customer_id: customer_id || req.user?.user_id,
    customer_name,
    customer_email: customer_email || req.user?.email,
    customer_notes,
    status: "PENDING",
    order_type: "QUOTE_REQUEST",
    priority: priority || "NORMAL",
    items: items.map((item) => ({
      product_id: item.product_id,
      part_number: item.part_number,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price || 0,
      requested_unit_price: item.requested_unit_price || item.unit_price || 0,
      total_price: item.total_price || 0,
    })),
    subtotal: subtotal || 0,
    tax: tax || 0,
    shipping: shipping || 0,
    total_amount: total_amount || 0,
  });

  // Send email notification to admin
  try {
    await sendAdminNewOrderEmail(order, {
      name: customer_name,
      email: customer_email || req.user?.email,
      company_name: customer_name,
      phone: req.user?.phone,
    });
  } catch (emailError) {
    console.error("[Orders] Admin notification email failed:", emailError.message);
    // Don't fail the request if email fails
  }

  return ApiResponse.created(res, { order }, "Quote request submitted successfully");
});

// ===========================
// POST /api/orders/:id/convert-to-quotation
// ===========================
// Admin only — convert a PENDING order to quotation
export const convertToQuotation = catchAsync(async (req, res) => {
  const { id } = req.params;
  const {
    exchange_rate,
    expiry_days,
    items,
    subtotal,
    total_amount,
    logistic_charges,
    custom_duty,
    debet_note,
    bank_charges,
    admin_notes,
  } = req.body;

  const order = await Order.findById(id);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.status !== "PENDING") {
    throw new AppError("Only PENDING orders can be converted to quotation", 400);
  }

  // If order.buyer is not set, try to find the buyer by email or customer_id
  let buyerId = order.buyer;
  if (!buyerId && order.customer_email) {
    const buyer = await User.findOne({ email: order.customer_email });
    if (buyer) {
      buyerId = buyer._id;
      // Also update the order with the buyer reference for future use
      order.buyer = buyer._id;
    }
  }
  if (!buyerId && order.customer_id) {
    const buyer = await User.findOne({ user_id: order.customer_id });
    if (buyer) {
      buyerId = buyer._id;
      order.buyer = buyer._id;
    }
  }

  // Prepare quotation items from order items (with updated pricing if provided)
  const quotationItems = (items && items.length > 0 ? items : order.items).map((item) => {
    const productRef = item.product || item.product_id;
    const isValidObjectId = productRef && /^[0-9a-fA-F]{24}$/.test(productRef.toString());

    return {
      // Only set product (ObjectId) if it's a valid 24-char hex string
      product: isValidObjectId ? productRef : undefined,
      // Store string product_id for reference
      product_id: item.product_id || (typeof productRef === 'string' ? productRef : undefined),
      part_number: item.part_number,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price || 0,
      total_price: item.total_price || 0,
    };
  });

  // Calculate expiry date
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + (expiry_days || 30));

  // Create the Quotation document in database
  const quotation = await Quotation.create({
    buyer: buyerId,
    buyer_name: order.buyer_name || order.customer_name,
    customer_id: order.customer_id,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    source_order: order._id,
    status: "SENT",
    items: quotationItems,
    subtotal: subtotal || order.subtotal || 0,
    tax: order.tax || 0,
    shipping: order.shipping || 0,
    total_amount: total_amount || order.total_amount || 0,
    exchange_rate: exchange_rate || 0,
    expiry_date: expiryDate,
    logistic_charges: logistic_charges || 0,
    custom_duty: custom_duty || 0,
    debet_note: debet_note || 0,
    bank_charges: bank_charges || 0,
    admin_notes,
    notes: order.customer_notes,
  });

  // Update order status and link to quotation
  order.status = "CONVERTED";
  order.converted_to_quote_id = quotation.quote_number;
  order.quotation = quotation._id;

  // Update items with new pricing if provided
  if (items && items.length > 0) {
    order.items = items.map((item) => ({
      ...item,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }));
    order.subtotal = subtotal;
    order.total_amount = total_amount;
  }

  order.admin_notes = admin_notes;

  await order.save();

  return ApiResponse.success(
    res,
    {
      order,
      quotation: {
        _id: quotation._id,
        quote_id: quotation._id.toString(),
        quote_number: quotation.quote_number,
        exchange_rate,
        expiry_days,
        expiry_date: expiryDate,
        logistic_charges,
        custom_duty,
        debet_note,
        bank_charges,
        status: quotation.status,
      },
    },
    "Order converted to quotation"
  );
});

// ===========================
// GET /api/orders/pending
// ===========================
// Admin only — get all PENDING orders (quote requests)
export const getPending = catchAsync(async (req, res) => {
  const { page = 1, limit = 100 } = req.query;

  const filter = { status: "PENDING" };
  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("buyer", "name email user_id")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Order.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, orders, page, limit, total, "Pending orders fetched");
});

// ===========================
// POST /api/orders/:id/clone
// ===========================
// Buyer only — clone an existing order to create a new order
// Creates a new order with PENDING status (quote request) from an existing order's items
export const cloneOrder = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  // Find the original order
  const originalOrder = await Order.findById(id)
    .populate("items.product", "product_name part_number");

  if (!originalOrder) {
    throw new AppError("Order not found", 404);
  }

  // Verify the buyer owns this order (or is admin)
  const isAdminUser =
    req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.SUB_ADMIN;

  if (!isAdminUser && originalOrder.buyer?.toString() !== req.user._id.toString()) {
    throw new AppError("You can only clone your own orders", 403);
  }

  // Clone items from original order (without pricing for quote request)
  const clonedItems = originalOrder.items.map((item) => ({
    product: item.product?._id || item.product,
    product_id: item.product_id,
    part_number: item.part_number,
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: 0, // Reset pricing for new quote request
    requested_unit_price: item.unit_price || 0,
    total_price: 0,
  }));

  // Create a new order as a quote request
  const clonedOrder = await Order.create({
    title: `Clone of ${originalOrder.title || originalOrder.order_id}`,
    buyer: req.user._id,
    buyer_name: req.user.name,
    customer_id: req.user.user_id,
    customer_name: req.user.name,
    customer_email: req.user.email,
    customer_notes: notes || `Cloned from order ${originalOrder.order_id}`,
    status: "PENDING",
    order_type: "QUOTE_REQUEST",
    priority: "NORMAL",
    items: clonedItems,
    shipping_address: originalOrder.shipping_address,
    subtotal: 0,
    tax: 0,
    shipping: 0,
    total_amount: 0,
  });

  // Populate the response
  const populatedOrder = await Order.findById(clonedOrder._id)
    .populate("buyer", "name email user_id")
    .populate("items.product", "product_name part_number image");

  return ApiResponse.created(
    res,
    { order: populatedOrder, source_order_id: originalOrder.order_id },
    `Order cloned successfully. New order: ${clonedOrder.order_id}`
  );
});
