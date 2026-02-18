import ProformaInvoice from "./proformaInvoices.model.js";
import Quotation from "../quotations/quotations.model.js";
import Invoice from "../invoices/invoices.model.js";
import catchAsync from "../../utils/catchAsync.js";
import ApiResponse from "../../utils/apiResponse.js";
import AppError from "../../utils/AppError.js";
import { ROLES } from "../../constants/index.js";

// ===========================
// GET /api/proforma-invoices
// ===========================
// Admin only — fetch all proformas
export const getAll = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [proformas, total] = await Promise.all([
    ProformaInvoice.find(filter)
      .populate("buyer", "name email user_id")
      .populate("quotation", "quote_number")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    ProformaInvoice.countDocuments(filter),
  ]);

  // Check for existing invoices for each PI that doesn't have invoice_generated flag
  const piIds = proformas
    .filter(pi => !pi.invoice_generated)
    .map(pi => pi._id);

  if (piIds.length > 0) {
    const existingInvoices = await Invoice.find({
      proforma_invoice: { $in: piIds }
    }).select("proforma_invoice invoice_number");

    // Create a map of PI ID to invoice info
    const invoiceMap = {};
    existingInvoices.forEach(inv => {
      invoiceMap[inv.proforma_invoice.toString()] = inv.invoice_number;
    });

    // Update proformas with invoice info and save to DB
    for (const pi of proformas) {
      const piIdStr = pi._id.toString();
      if (!pi.invoice_generated && invoiceMap[piIdStr]) {
        pi.invoice_generated = true;
        pi.invoice_number = invoiceMap[piIdStr];
        // Save the update to database
        await ProformaInvoice.updateOne(
          { _id: pi._id },
          { invoice_generated: true, invoice_number: invoiceMap[piIdStr] }
        );
      }
    }
  }

  return ApiResponse.paginated(res, proformas, page, limit, total, "Proforma invoices fetched");
});

// ===========================
// GET /api/proforma-invoices/my
// ===========================
// Buyer only — fetch my proformas
export const getMyProformas = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const filter = { buyer: req.user._id };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [proformas, total] = await Promise.all([
    ProformaInvoice.find(filter)
      .populate("items.product", "product_name part_number image")
      .populate("quotation", "quote_number")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    ProformaInvoice.countDocuments(filter),
  ]);

  // Check for existing invoices for each PI that doesn't have invoice_generated flag
  const piIds = proformas
    .filter(pi => !pi.invoice_generated)
    .map(pi => pi._id);

  if (piIds.length > 0) {
    const existingInvoices = await Invoice.find({
      proforma_invoice: { $in: piIds }
    }).select("proforma_invoice invoice_number");

    // Create a map of PI ID to invoice info
    const invoiceMap = {};
    existingInvoices.forEach(inv => {
      invoiceMap[inv.proforma_invoice.toString()] = inv.invoice_number;
    });

    // Update proformas with invoice info
    for (const pi of proformas) {
      const piIdStr = pi._id.toString();
      if (!pi.invoice_generated && invoiceMap[piIdStr]) {
        pi.invoice_generated = true;
        pi.invoice_number = invoiceMap[piIdStr];
        // Save the update to database
        await ProformaInvoice.updateOne(
          { _id: pi._id },
          { invoice_generated: true, invoice_number: invoiceMap[piIdStr] }
        );
      }
    }
  }

  return ApiResponse.paginated(res, proformas, page, limit, total, "My proforma invoices fetched");
});

// ===========================
// GET /api/proforma-invoices/:id
// ===========================
// Buyer sees own, Admin sees any
export const getById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const proforma = await ProformaInvoice.findById(id)
    .populate("buyer", "name email user_id phone")
    .populate("quotation", "quote_number")
    .populate("items.product", "product_name part_number image");

  if (!proforma) {
    throw new AppError("Proforma invoice not found", 404);
  }

  const isAdminUser =
    req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.SUB_ADMIN;

  if (!isAdminUser && proforma.buyer._id.toString() !== req.user._id.toString()) {
    throw new AppError("You can only view your own proforma invoices", 403);
  }

  return ApiResponse.success(res, { proforma }, "Proforma invoice fetched");
});

// ===========================
// POST /api/proforma-invoices
// ===========================
// Admin only — create proforma from accepted quotation
// Body: { quotation_id, items, exchange_rate, payment_terms, delivery_terms, valid_until,
//         subtotal, logistic_charges, custom_duty, bank_charges, other_charges, total_amount, notes }
export const create = catchAsync(async (req, res) => {
  const {
    quotation_id,
    quote_number,
    buyer,
    customer_name,
    customer_email,
    items,
    exchange_rate,
    payment_terms,
    delivery_terms,
    validity_days,
    valid_until,
    subtotal,
    logistic_charges,
    custom_duty,
    bank_charges,
    other_charges,
    total_amount,
    notes,
    billing_address,
    shipping_address,
    status,
  } = req.body;

  if (!quotation_id) {
    throw new AppError("Quotation ID is required", 400);
  }

  const quotation = await Quotation.findById(quotation_id).populate("buyer", "name email");

  if (!quotation) {
    throw new AppError("Quotation not found", 404);
  }

  // Allow both PENDING and ACCEPTED quotations to be converted to proforma invoice
  // PENDING: buyer pays outside system and informs admin
  // ACCEPTED: buyer accepts quotation through the system
  if (!["PENDING", "ACCEPTED", "SENT"].includes(quotation.status)) {
    throw new AppError("Only pending, sent or accepted quotations can be converted to proforma invoice", 400);
  }

  // Use provided items or copy from quotation
  const proformaItems = items && items.length > 0
    ? items.map((item) => ({
        product_id: item.product_id,
        product: item.product, // ObjectId if available
        part_number: item.part_number,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price || item.unit_price * item.quantity,
      }))
    : quotation.items.map((item) => ({
        product_id: item.product_id,
        product: item.product,
        part_number: item.part_number,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

  // Calculate valid_until date from validity_days if not directly provided
  let expiryDate = valid_until;
  if (!expiryDate && validity_days) {
    expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + validity_days);
  }

  const proforma = await ProformaInvoice.create({
    quotation: quotation._id,
    quote_number: quote_number || quotation.quote_number,
    buyer: buyer || quotation.buyer._id,
    buyer_name: customer_name || quotation.buyer?.name || quotation.buyer_name,
    buyer_email: customer_email || quotation.buyer?.email || quotation.customer_email,
    items: proformaItems,
    exchange_rate: exchange_rate || quotation.exchange_rate || 83.5,
    payment_terms: payment_terms || "100% Advance",
    delivery_terms: delivery_terms || "Ex-Works",
    subtotal: subtotal ?? quotation.subtotal,
    logistic_charges: logistic_charges || 0,
    custom_duty: custom_duty || 0,
    bank_charges: bank_charges || 0,
    other_charges: other_charges || 0,
    total_amount: total_amount ?? quotation.total_amount,
    valid_until: expiryDate,
    notes,
    billing_address,
    shipping_address,
    status: status || "PENDING",
    created_by: req.user._id,
  });

  // Update quotation status to CONVERTED
  quotation.status = "CONVERTED";
  quotation.converted_date = new Date();
  await quotation.save();

  return ApiResponse.created(res, { proforma }, "Proforma invoice created");
});

// ===========================
// PUT /api/proforma-invoices/:id
// ===========================
// Admin only — update proforma fields
export const update = catchAsync(async (req, res) => {
  const { id } = req.params;
  const {
    valid_until,
    payment_terms,
    delivery_terms,
    billing_address,
    shipping_address,
    notes,
    items,
    subtotal,
    total_amount,
    exchange_rate,
    // Payment tracking fields
    payment_received,
    payment_status,
    payment_history,
    // Dispatch tracking fields
    dispatched,
    dispatch_date,
    dispatch_details,
  } = req.body;

  const proforma = await ProformaInvoice.findById(id);

  if (!proforma) {
    throw new AppError("Proforma invoice not found", 404);
  }

  // Allow updates to payment and dispatch fields regardless of status
  // Only restrict core field updates for non-PENDING status
  const isPaymentOrDispatchUpdate = payment_received !== undefined ||
    payment_status !== undefined ||
    payment_history !== undefined ||
    dispatched !== undefined ||
    dispatch_date !== undefined ||
    dispatch_details !== undefined;

  if (!isPaymentOrDispatchUpdate && !["PENDING", "SENT"].includes(proforma.status)) {
    throw new AppError("Only pending or sent proforma invoices can be updated", 400);
  }

  // Update core fields
  if (valid_until !== undefined) proforma.valid_until = valid_until;
  if (payment_terms !== undefined) proforma.payment_terms = payment_terms;
  if (delivery_terms !== undefined) proforma.delivery_terms = delivery_terms;
  if (billing_address !== undefined) proforma.billing_address = billing_address;
  if (shipping_address !== undefined) proforma.shipping_address = shipping_address;
  if (notes !== undefined) proforma.notes = notes;
  if (items !== undefined) proforma.items = items;
  if (subtotal !== undefined) proforma.subtotal = subtotal;
  if (total_amount !== undefined) proforma.total_amount = total_amount;
  if (exchange_rate !== undefined) proforma.exchange_rate = exchange_rate;

  // Update payment tracking fields
  if (payment_received !== undefined) proforma.payment_received = payment_received;
  if (payment_status !== undefined) proforma.payment_status = payment_status;
  if (payment_history !== undefined) proforma.payment_history = payment_history;

  // Update dispatch tracking fields
  if (dispatched !== undefined) proforma.dispatched = dispatched;
  if (dispatch_date !== undefined) proforma.dispatch_date = dispatch_date;
  if (dispatch_details !== undefined) proforma.dispatch_details = dispatch_details;

  await proforma.save();

  return ApiResponse.success(res, { proforma }, "Proforma invoice updated");
});

// ===========================
// PUT /api/proforma-invoices/:id/approve
// ===========================
// Admin only — approve proforma
export const approve = catchAsync(async (req, res) => {
  const { id } = req.params;

  const proforma = await ProformaInvoice.findById(id);

  if (!proforma) {
    throw new AppError("Proforma invoice not found", 404);
  }

  if (proforma.status !== "PENDING") {
    throw new AppError("Only pending proforma invoices can be approved", 400);
  }

  proforma.status = "APPROVED";
  proforma.approved_date = new Date();
  await proforma.save();

  return ApiResponse.success(res, { proforma }, "Proforma invoice approved");
});

// ===========================
// PUT /api/proforma-invoices/:id/reject
// ===========================
// Admin only — reject proforma
export const reject = catchAsync(async (req, res) => {
  const { id } = req.params;

  const proforma = await ProformaInvoice.findById(id);

  if (!proforma) {
    throw new AppError("Proforma invoice not found", 404);
  }

  if (proforma.status !== "PENDING") {
    throw new AppError("Only pending proforma invoices can be rejected", 400);
  }

  proforma.status = "REJECTED";
  await proforma.save();

  return ApiResponse.success(res, { proforma }, "Proforma invoice rejected");
});

// ===========================
// POST /api/proforma-invoices/:id/convert-to-order
// ===========================
// Admin only — just returns guidance (order creation via /api/orders)
export const convertToOrder = catchAsync(async (req, res) => {
  const { id } = req.params;

  const proforma = await ProformaInvoice.findById(id);

  if (!proforma) {
    throw new AppError("Proforma invoice not found", 404);
  }

  if (proforma.status !== "APPROVED") {
    throw new AppError("Only approved proforma invoices can be converted to order", 400);
  }

  return ApiResponse.success(
    res,
    { proforma },
    "Use POST /api/orders with the quotation ID to create the order"
  );
});

// ===========================
// GET /api/proforma-invoices/open
// ===========================
// Admin only — fetch PIs with pending quantities (for Open Orders page)
export const getOpenPIs = catchAsync(async (req, res) => {
  const { page = 1, limit = 50, payment_status } = req.query;

  // Build filter for PIs that are NOT fully dispatched
  // This includes: unmigrated PIs (no dispatch fields), partially dispatched, and not dispatched at all
  const filter = {
    $and: [
      // Only active PIs (APPROVED, SENT, or PENDING status)
      { status: { $in: ["APPROVED", "SENT", "PENDING"] } },
      // Exclude fully dispatched PIs
      {
        $or: [
          // Unmigrated PIs (dispatch_status doesn't exist or is null)
          { dispatch_status: { $exists: false } },
          { dispatch_status: null },
          // Not dispatched at all
          { dispatch_status: "NONE" },
          // Partially dispatched
          { dispatch_status: "PARTIAL" },
          // Or dispatched flag is false/undefined (for backwards compatibility)
          { dispatched: { $ne: true } },
        ],
      },
    ],
  };

  // Optional filter by payment status
  if (payment_status) {
    filter.$and.push({ payment_status });
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [proformas, total] = await Promise.all([
    ProformaInvoice.find(filter)
      .populate("buyer", "name email user_id")
      .populate("quotation", "quote_number")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    ProformaInvoice.countDocuments(filter),
  ]);

  // For each PI, calculate quantities if not set (backwards compatibility)
  const enrichedProformas = proformas.map((pi) => {
    const piObj = pi.toObject();

    // Calculate total if not set
    if (!piObj.total_quantity || piObj.total_quantity === 0) {
      piObj.total_quantity = piObj.items.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0
      );
    }

    // Set dispatched_quantity to 0 if not set
    if (piObj.dispatched_quantity === undefined || piObj.dispatched_quantity === null) {
      piObj.dispatched_quantity = 0;
    }

    // Calculate pending quantity
    piObj.pending_quantity = piObj.total_quantity - piObj.dispatched_quantity;

    // Set dispatch status if not set
    if (!piObj.dispatch_status) {
      if (piObj.dispatched_quantity === 0) {
        piObj.dispatch_status = "NONE";
      } else if (piObj.dispatched_quantity < piObj.total_quantity) {
        piObj.dispatch_status = "PARTIAL";
      } else {
        piObj.dispatch_status = "FULL";
      }
    }

    return piObj;
  });

  // Filter out fully dispatched (in case DB filter didn't catch all)
  const openPIs = enrichedProformas.filter(
    (pi) => pi.pending_quantity > 0
  );

  return ApiResponse.paginated(
    res,
    openPIs,
    Number(page),
    Number(limit),
    total,
    "Open proforma invoices fetched"
  );
});

// ===========================
// GET /api/proforma-invoices/completed
// ===========================
// Get fully dispatched PIs (for Completed tab in Open Orders page)
export const getCompletedPIs = catchAsync(async (req, res) => {
  const { page = 1, limit = 50, payment_status } = req.query;

  // Build filter for PIs that ARE fully dispatched
  const filter = {
    $or: [
      { dispatch_status: "FULL" },
      { dispatched: true },
    ],
  };

  // Optional filter by payment status
  if (payment_status) {
    filter.payment_status = payment_status;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [proformas, total] = await Promise.all([
    ProformaInvoice.find(filter)
      .populate("buyer", "name email user_id")
      .populate("quotation", "quote_number")
      .sort({ dispatch_date: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    ProformaInvoice.countDocuments(filter),
  ]);

  // Enrich with calculated quantities
  const enrichedProformas = proformas.map((pi) => {
    const piObj = pi.toObject();

    // Calculate total if not set
    if (!piObj.total_quantity || piObj.total_quantity === 0) {
      piObj.total_quantity = piObj.items.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0
      );
    }

    // For completed PIs, dispatched = total
    if (piObj.dispatched_quantity === undefined || piObj.dispatched_quantity === null) {
      piObj.dispatched_quantity = piObj.total_quantity;
    }

    piObj.pending_quantity = 0;
    piObj.dispatch_status = "FULL";

    return piObj;
  });

  return ApiResponse.paginated(
    res,
    enrichedProformas,
    Number(page),
    Number(limit),
    total,
    "Completed proforma invoices fetched"
  );
});
