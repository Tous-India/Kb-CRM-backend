import Invoice from "./invoices.model.js";
import Order from "../orders/orders.model.js";
import ProformaInvoice from "../proformaInvoices/proformaInvoices.model.js";
import catchAsync from "../../utils/catchAsync.js";
import ApiResponse from "../../utils/apiResponse.js";
import AppError from "../../utils/AppError.js";
import { ROLES } from "../../constants/index.js";
import { generateInvoicePDF } from "../../utils/pdfGenerator.js";
import { sendInvoiceEmail } from "../../utils/emailService.js";

// Helper function to convert number to words (INR)
const numberToWordsINR = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = Math.floor(num / 100);
  num %= 100;
  const ten = Math.floor(num / 10);
  const one = num % 10;

  let words = '';
  if (crore) words += `${numberToWordsINR(crore)} Crore `;
  if (lakh) words += `${numberToWordsINR(lakh)} Lakh `;
  if (thousand) words += `${numberToWordsINR(thousand)} Thousand `;
  if (hundred) words += `${ones[hundred]} Hundred `;
  if (ten >= 2) {
    words += `${tens[ten]} `;
    if (one) words += `${ones[one]} `;
  } else if (ten === 1 || one) {
    words += `${ones[ten * 10 + one]} `;
  }

  return words.trim();
};

// ===========================
// GET /api/invoices
// ===========================
// Admin only — fetch all invoices
export const getAll = catchAsync(async (req, res) => {
  const { status, invoice_type, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (invoice_type) filter.invoice_type = invoice_type;

  const skip = (Number(page) - 1) * Number(limit);

  const [invoices, total] = await Promise.all([
    Invoice.find(filter)
      .populate("buyer", "name email user_id")
      .populate("order", "order_id title")
      .populate("proforma_invoice", "proforma_number")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Invoice.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, invoices, page, limit, total, "Invoices fetched");
});

// ===========================
// GET /api/invoices/my
// ===========================
// Buyer only — fetch my invoices
export const getMyInvoices = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  // Match by buyer ID or by buyer_email (for invoices created before buyer was linked)
  const filter = {
    $or: [
      { buyer: req.user._id },
      { buyer_email: req.user.email },
    ],
  };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [invoices, total] = await Promise.all([
    Invoice.find(filter)
      .populate("order", "order_id title")
      .populate("proforma_invoice", "proforma_number")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Invoice.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, invoices, page, limit, total, "My invoices fetched");
});

// ===========================
// GET /api/invoices/:id
// ===========================
// Buyer sees own, Admin sees any
export const getById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const invoice = await Invoice.findById(id)
    .populate("buyer", "name email user_id phone address company_details")
    .populate("order", "order_id title")
    .populate("proforma_invoice", "proforma_number")
    .populate("items.product", "product_name part_number image");

  if (!invoice) {
    throw new AppError("Invoice not found", 404);
  }

  const isAdminUser =
    req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.SUB_ADMIN;

  if (!isAdminUser && invoice.buyer._id.toString() !== req.user._id.toString()) {
    throw new AppError("You can only view your own invoices", 403);
  }

  return ApiResponse.success(res, { invoice }, "Invoice fetched");
});

// ===========================
// POST /api/invoices
// ===========================
// Admin only — create invoice from order
export const create = catchAsync(async (req, res) => {
  const { order: orderId, due_date, billing_address, notes } = req.body;

  if (!orderId) {
    throw new AppError("Order ID is required", 400);
  }

  const order = await Order.findById(orderId).populate("buyer", "name");

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  const invoiceItems = order.items.map((item) => ({
    product: item.product,
    part_number: item.part_number,
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.total_price,
  }));

  const invoice = await Invoice.create({
    order: order._id,
    buyer: order.buyer._id,
    buyer_name: order.buyer.name || order.buyer_name,
    items: invoiceItems,
    subtotal: order.subtotal,
    tax: order.tax,
    shipping: order.shipping,
    total_amount: order.total_amount,
    balance_due: order.total_amount,
    due_date,
    billing_address,
    notes,
    created_by: req.user._id,
  });

  return ApiResponse.created(res, { invoice }, "Invoice created from order");
});

// ===========================
// POST /api/invoices/manual
// ===========================
// Admin only — create manual invoice with all fields
export const createManual = catchAsync(async (req, res) => {
  const {
    // Basic info
    buyer,
    buyer_name,
    buyer_email,
    invoice_type,
    custom_invoice_number,

    // References
    quote_reference,
    hsn_sac,
    awb_number,
    po_number,

    // Company details (FROM)
    company_details,

    // Bill To / Ship To
    bill_to,
    ship_to,

    // Dates
    invoice_date,
    due_date,
    shipping_date,

    // Items
    items,

    // Financial details
    tax,
    tax_rate,
    tax_type,
    tax_breakdown,
    shipping,
    freight,
    custom_duty,
    bank_charges,
    logistic_charges,
    discount,
    discount_type,
    discount_value,
    round_off,

    // Currency
    currency,
    exchange_rate,
    exchange_rate_source,

    // Payment
    amount_paid,
    payment_method,
    payment_date,
    payment_terms,

    // Shipping
    shipping_method,
    shipping_carrier,
    tracking_number,

    // Bank details
    bank_details,

    // Terms and notes
    terms_and_conditions,
    notes,
    internal_notes,

    // Legacy addresses (backward compatibility)
    billing_address,
    shipping_address,
  } = req.body;

  if (!buyer) {
    throw new AppError("Buyer ID is required", 400);
  }

  // Calculate subtotal from items (items are optional for manual invoices)
  let subtotal = 0;
  const invoiceItems = (items || []).map((item, index) => {
    const totalPrice = item.quantity * item.unit_price;
    subtotal += totalPrice;
    return {
      sn: index + 1,
      product: item.product || undefined,
      product_id: item.product_id,
      part_number: item.part_number,
      product_name: item.product_name,
      description: item.description,
      hsn_sac_code: item.hsn_sac_code,
      qty_ordered: item.qty_ordered || item.quantity,
      qty_delivered: item.qty_delivered || 0,
      qty_pending: item.qty_pending || item.quantity,
      quantity: item.quantity,
      uom: item.uom || "EA",
      delivery_status: item.delivery_status || "PENDING",
      unit_price: item.unit_price,
      total_price: totalPrice,
    };
  });

  // Calculate additional charges
  const additionalCharges = (shipping || 0) + (freight || 0) + (custom_duty || 0) + (bank_charges || 0) + (logistic_charges || 0);

  // Calculate total amount
  const totalAmount = subtotal - (discount || 0) + (tax || 0) + additionalCharges + (round_off || 0);

  // Calculate balance due
  const balanceDue = totalAmount - (amount_paid || 0);

  // Determine payment status
  let status = "UNPAID";
  if (amount_paid >= totalAmount) {
    status = "PAID";
  } else if (amount_paid > 0) {
    status = "PARTIAL";
  }

  // Calculate INR amounts
  const rate = exchange_rate || 83.5;
  const totalAmountINR = Math.round(totalAmount * rate * 100) / 100;

  // Generate amount in words
  const amountInWordsINR = `${numberToWordsINR(Math.floor(totalAmountINR))} Rupees Only`;

  const invoice = await Invoice.create({
    // Type and source
    invoice_type: invoice_type || "TAX_INVOICE",
    source: "MANUAL",
    custom_invoice_number,

    // References
    quote_reference,
    hsn_sac,
    awb_number,
    po_number,

    // Company details
    company_details,

    // Bill To / Ship To
    bill_to,
    ship_to,

    // Buyer info
    buyer,
    buyer_name: buyer_name || null,
    buyer_email: buyer_email || null,

    // Items
    items: invoiceItems,

    // Dates
    invoice_date: invoice_date ? new Date(invoice_date) : new Date(),
    due_date: due_date ? new Date(due_date) : null,
    shipping_date: shipping_date ? new Date(shipping_date) : null,

    // Status
    status,
    payment_date: payment_date ? new Date(payment_date) : null,

    // Financial details
    subtotal,
    discount: discount || 0,
    discount_type: discount_type || "fixed",
    discount_value: discount_value || 0,
    tax: tax || 0,
    tax_rate: tax_rate || 0,
    tax_type: tax_type || "IGST",
    tax_breakdown: tax_breakdown || null,
    shipping: shipping || 0,
    freight: freight || 0,
    custom_duty: custom_duty || 0,
    bank_charges: bank_charges || 0,
    logistic_charges: logistic_charges || 0,
    round_off: round_off || 0,
    total_amount: totalAmount,
    amount_paid: amount_paid || 0,
    balance_due: balanceDue,

    // INR amounts
    total_amount_inr: totalAmountINR,
    grand_total_inr: totalAmountINR,
    amount_in_words_inr: amountInWordsINR,

    // Currency and exchange rate
    currency: currency || "USD",
    exchange_rate: rate,
    exchange_rate_source: exchange_rate_source || "CUSTOM",

    // Payment
    payment_method: payment_method || null,
    payment_terms: payment_terms || "NET_30",

    // Shipping
    shipping_method: shipping_method || "BYAIR",
    shipping_carrier,
    tracking_number,

    // Bank details
    bank_details: bank_details || null,

    // Terms and notes
    terms_and_conditions: terms_and_conditions || [],
    notes: notes || null,
    internal_notes: internal_notes || null,

    // Legacy addresses (backward compatibility)
    billing_address: billing_address || null,
    shipping_address: shipping_address || billing_address || null,

    // Flags
    is_manual: true,
    is_editable: true,

    // Created by
    created_by: req.user._id,
  });

  // Populate buyer for response
  await invoice.populate("buyer", "name email user_id");

  return ApiResponse.created(res, { invoice }, "Manual invoice created");
});

// ===========================
// PUT /api/invoices/:id
// ===========================
// Admin only — comprehensive update for all invoice fields
export const update = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const invoice = await Invoice.findById(id);

  if (!invoice) {
    throw new AppError("Invoice not found", 404);
  }

  // Check if invoice is editable
  if (invoice.is_editable === false) {
    throw new AppError("This invoice is locked and cannot be edited", 400);
  }

  // List of updatable fields
  const updatableFields = [
    // Basic info
    'invoice_type', 'custom_invoice_number',
    // References
    'quote_reference', 'hsn_sac', 'awb_number', 'bol_number', 'po_number',
    // Company details
    'company_details',
    // Bill To / Ship To
    'bill_to', 'ship_to',
    // Buyer info
    'buyer_name', 'buyer_email',
    // Dates
    'invoice_date', 'due_date', 'shipping_date', 'delivery_date',
    // Status
    'status', 'delivery_status',
    // Items
    'items',
    // Financial details
    'subtotal', 'discount', 'discount_type', 'discount_value',
    'tax', 'tax_rate', 'tax_type', 'tax_breakdown',
    'shipping', 'freight', 'custom_duty', 'bank_charges', 'logistic_charges',
    'round_off', 'total_amount', 'amount_paid', 'balance_due',
    // INR amounts
    'subtotal_inr', 'total_amount_inr', 'grand_total_inr',
    'amount_in_words_usd', 'amount_in_words_inr',
    // Currency
    'currency', 'exchange_rate', 'exchange_rate_source',
    // Payment
    'payment_method', 'payment_date', 'payment_terms',
    // Shipping
    'shipping_method', 'shipping_carrier', 'tracking_number',
    // Bank details
    'bank_details', 'bank_account_type',
    // Dispatch
    'dispatch_info', 'include_dispatch_info',
    // Terms and notes
    'terms_and_conditions', 'terms_preset', 'notes', 'internal_notes', 'remarks',
    // Legacy addresses
    'billing_address', 'shipping_address',
    // Flags
    'is_draft', 'is_editable',
  ];

  // Update only allowed fields
  updatableFields.forEach(field => {
    if (updateData[field] !== undefined) {
      // Handle date fields
      if (['invoice_date', 'due_date', 'shipping_date', 'delivery_date', 'payment_date'].includes(field)) {
        invoice[field] = updateData[field] ? new Date(updateData[field]) : null;
      } else {
        invoice[field] = updateData[field];
      }
    }
  });

  // Recalculate if items are updated
  if (updateData.items) {
    let subtotal = 0;
    invoice.items = updateData.items.map((item, index) => {
      const totalPrice = item.quantity * item.unit_price;
      subtotal += totalPrice;
      return {
        sn: index + 1,
        product: item.product || undefined,
        product_id: item.product_id,
        part_number: item.part_number,
        product_name: item.product_name,
        description: item.description,
        hsn_sac_code: item.hsn_sac_code,
        qty_ordered: item.qty_ordered || item.quantity,
        qty_delivered: item.qty_delivered || 0,
        qty_pending: item.qty_pending || (item.qty_ordered || item.quantity) - (item.qty_delivered || 0),
        quantity: item.quantity,
        uom: item.uom || "EA",
        delivery_status: item.delivery_status || "PENDING",
        unit_price: item.unit_price,
        total_price: totalPrice,
      };
    });
    invoice.subtotal = subtotal;

    // Recalculate total
    const additionalCharges = (invoice.shipping || 0) + (invoice.freight || 0) +
      (invoice.custom_duty || 0) + (invoice.bank_charges || 0) + (invoice.logistic_charges || 0);
    invoice.total_amount = subtotal - (invoice.discount || 0) + (invoice.tax || 0) + additionalCharges + (invoice.round_off || 0);
    invoice.balance_due = invoice.total_amount - (invoice.amount_paid || 0);
  }

  // Update status based on payment
  if (updateData.amount_paid !== undefined) {
    if (invoice.amount_paid >= invoice.total_amount) {
      invoice.status = "PAID";
    } else if (invoice.amount_paid > 0) {
      invoice.status = "PARTIAL";
    } else {
      invoice.status = "UNPAID";
    }
  }

  // Update audit trail
  invoice.updated_by = req.user._id;

  await invoice.save();

  // Populate for response
  await invoice.populate("buyer", "name email user_id");

  return ApiResponse.success(res, { invoice }, "Invoice updated");
});

// ===========================
// PUT /api/invoices/:id/status
// ===========================
// Admin only — update invoice status
export const updateStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status, delivery_status } = req.body;

  const invoice = await Invoice.findById(id);

  if (!invoice) {
    throw new AppError("Invoice not found", 404);
  }

  if (status) {
    invoice.status = status;
  }

  if (delivery_status) {
    invoice.delivery_status = delivery_status;
  }

  invoice.updated_by = req.user._id;
  await invoice.save();

  return ApiResponse.success(res, { invoice }, "Invoice status updated");
});

// ===========================
// PUT /api/invoices/:id/items
// ===========================
// Admin only — update invoice items with delivery tracking
export const updateItems = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { items } = req.body;

  const invoice = await Invoice.findById(id);

  if (!invoice) {
    throw new AppError("Invoice not found", 404);
  }

  // Update items (items are optional for manual invoices)
  let subtotal = 0;
  let allDelivered = true;
  let anyDelivered = false;

  invoice.items = (items || []).map((item, index) => {
    const totalPrice = item.quantity * item.unit_price;
    subtotal += totalPrice;

    const qtyDelivered = item.qty_delivered || 0;
    const qtyOrdered = item.qty_ordered || item.quantity;

    if (qtyDelivered < qtyOrdered) allDelivered = false;
    if (qtyDelivered > 0) anyDelivered = true;

    return {
      sn: index + 1,
      product: item.product,
      product_id: item.product_id,
      part_number: item.part_number,
      product_name: item.product_name,
      description: item.description,
      hsn_sac_code: item.hsn_sac_code,
      qty_ordered: qtyOrdered,
      qty_delivered: qtyDelivered,
      qty_pending: qtyOrdered - qtyDelivered,
      quantity: item.quantity,
      uom: item.uom || "EA",
      delivery_status: qtyDelivered >= qtyOrdered ? "DELIVERED" : qtyDelivered > 0 ? "PARTIAL" : "PENDING",
      unit_price: item.unit_price,
      total_price: totalPrice,
    };
  });

  // Update delivery status
  if (allDelivered) {
    invoice.delivery_status = "DELIVERED";
  } else if (anyDelivered) {
    invoice.delivery_status = "PARTIAL";
  } else {
    invoice.delivery_status = "PENDING";
  }

  // Recalculate totals
  invoice.subtotal = subtotal;
  const additionalCharges = (invoice.shipping || 0) + (invoice.freight || 0) +
    (invoice.custom_duty || 0) + (invoice.bank_charges || 0) + (invoice.logistic_charges || 0);
  invoice.total_amount = subtotal - (invoice.discount || 0) + (invoice.tax || 0) + additionalCharges + (invoice.round_off || 0);
  invoice.balance_due = invoice.total_amount - (invoice.amount_paid || 0);

  invoice.updated_by = req.user._id;
  await invoice.save();

  return ApiResponse.success(res, { invoice }, "Invoice items updated");
});

// ===========================
// GET /api/invoices/:id/pdf
// ===========================
export const downloadPdf = catchAsync(async (req, res) => {
  const { id } = req.params;

  const invoice = await Invoice.findById(id)
    .populate("buyer", "name email phone address company_details")
    .populate("items.product", "product_name part_number");

  if (!invoice) {
    throw new AppError("Invoice not found", 404);
  }

  const isAdminUser =
    req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.SUB_ADMIN;

  if (!isAdminUser && invoice.buyer._id.toString() !== req.user._id.toString()) {
    throw new AppError("You can only download your own invoices", 403);
  }

  // Mark as printed
  invoice.is_printed = true;
  invoice.last_printed_at = new Date();
  await invoice.save();

  const pdfBuffer = await generateInvoicePDF(invoice.toObject());

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename=invoice-${invoice.invoice_number}.pdf`,
    "Content-Length": pdfBuffer.length,
  });

  return res.send(pdfBuffer);
});

// ===========================
// POST /api/invoices/from-pi
// ===========================
// Admin only — create invoice from Proforma Invoice
export const createFromPI = catchAsync(async (req, res) => {
  const {
    proforma_invoice_id,
    invoice_type,
    invoice_date,
    due_date,
    exchange_rate,
    bank_details,
    bank_account_type,
    include_dispatch_info,
    notes,
    company_details,
    terms_and_conditions,
  } = req.body;

  if (!proforma_invoice_id) {
    throw new AppError("Proforma Invoice ID is required", 400);
  }

  const pi = await ProformaInvoice.findById(proforma_invoice_id)
    .populate("buyer", "name email")
    .populate("quotation");

  if (!pi) {
    throw new AppError("Proforma Invoice not found", 404);
  }

  if (pi.payment_status !== "PAID") {
    throw new AppError("Invoice can only be generated for fully paid Proforma Invoices", 400);
  }

  const existingInvoice = await Invoice.findOne({ proforma_invoice: proforma_invoice_id });
  if (existingInvoice) {
    throw new AppError(`Invoice ${existingInvoice.invoice_number} already exists for this PI`, 400);
  }

  const invoiceItems = pi.items.map((item, index) => ({
    sn: index + 1,
    product: item.product,
    part_number: item.part_number,
    product_name: item.product_name,
    quantity: item.quantity,
    qty_ordered: item.quantity,
    qty_delivered: item.quantity,
    qty_pending: 0,
    uom: item.uom || "EA",
    delivery_status: "DELIVERED",
    unit_price: item.unit_price,
    total_price: item.unit_price * item.quantity,
  }));

  const subtotal = invoiceItems.reduce((sum, item) => sum + item.total_price, 0);
  const rate = exchange_rate || pi.exchange_rate || 83.5;
  const totalAmountINR = Math.round((pi.total_amount || subtotal) * rate * 100) / 100;

  const invoice = await Invoice.create({
    invoice_type: invoice_type || "TAX_INVOICE",
    source: "PROFORMA_INVOICE",
    proforma_invoice: pi._id,
    proforma_invoice_number: pi.proforma_number,
    quotation: pi.quotation?._id,
    quote_reference: pi.quote_number,

    company_details,

    buyer: pi.buyer._id || pi.buyer,
    buyer_name: pi.buyer?.name || pi.buyer_name || pi.customer_name,
    buyer_email: pi.buyer?.email || pi.buyer_email,

    invoice_date: invoice_date ? new Date(invoice_date) : new Date(),
    due_date: due_date ? new Date(due_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),

    status: "PAID",
    delivery_status: "DELIVERED",
    payment_date: new Date(),

    items: invoiceItems,

    subtotal,
    discount: pi.discount || 0,
    discount_type: pi.discount_type || "fixed",
    discount_value: pi.discount_value || 0,
    tax: pi.tax || 0,
    tax_rate: pi.tax_rate || 0,
    shipping: pi.shipping_cost || 0,
    custom_duty: pi.custom_duty || 0,
    bank_charges: pi.bank_charges || 0,
    logistic_charges: pi.logistic_charges || 0,
    total_amount: pi.total_amount,
    amount_paid: pi.payment_received || pi.total_amount,
    balance_due: 0,

    total_amount_inr: totalAmountINR,
    grand_total_inr: totalAmountINR,
    amount_in_words_inr: `${numberToWordsINR(Math.floor(totalAmountINR))} Rupees Only`,

    currency: pi.currency || "USD",
    exchange_rate: rate,
    pi_exchange_rate: pi.exchange_rate,

    billing_address: pi.billing_address,
    shipping_address: pi.shipping_address,

    bank_details: bank_details || null,
    bank_account_type: bank_account_type || null,

    include_dispatch_info: include_dispatch_info || false,
    dispatch_info: include_dispatch_info && pi.dispatched ? {
      dispatch_date: pi.dispatch_history?.[0]?.dispatch_date,
      courier_service: pi.dispatch_history?.[0]?.courier_service,
      tracking_number: pi.dispatch_history?.[0]?.tracking_number,
    } : null,

    payment_method: pi.payment_history?.[0]?.payment_method || "BANK_TRANSFER",
    payment_terms: "100%PREPAID",

    terms_and_conditions: terms_and_conditions || [],
    notes: notes || `Generated from PI: ${pi.proforma_number}`,

    created_by: req.user._id,
  });

  pi.invoice_generated = true;
  pi.invoice = invoice._id;
  pi.invoice_number = invoice.invoice_number;
  await pi.save();

  await invoice.populate("buyer", "name email user_id");
  await invoice.populate("proforma_invoice", "proforma_number");

  return ApiResponse.created(res, { invoice, proforma_invoice: pi }, "Invoice created from Proforma Invoice");
});

// ===========================
// GET /api/invoices/by-pi/:piId
// ===========================
export const getByPI = catchAsync(async (req, res) => {
  const { piId } = req.params;

  const invoice = await Invoice.findOne({ proforma_invoice: piId })
    .populate("buyer", "name email user_id")
    .populate("proforma_invoice", "proforma_number");

  if (!invoice) {
    return ApiResponse.success(res, { invoice: null }, "No invoice found for this PI");
  }

  return ApiResponse.success(res, { invoice }, "Invoice fetched");
});

// ===========================
// DELETE /api/invoices/:id
// ===========================
// Admin only — delete invoice (soft delete or cancel)
export const remove = catchAsync(async (req, res) => {
  const { id } = req.params;

  const invoice = await Invoice.findById(id);

  if (!invoice) {
    throw new AppError("Invoice not found", 404);
  }

  // Instead of hard delete, mark as cancelled
  invoice.status = "CANCELLED";
  invoice.updated_by = req.user._id;
  await invoice.save();

  return ApiResponse.success(res, null, "Invoice cancelled");
});

// ===========================
// POST /api/invoices/:id/duplicate
// ===========================
// Admin only — duplicate an invoice
export const duplicate = catchAsync(async (req, res) => {
  const { id } = req.params;

  const original = await Invoice.findById(id);

  if (!original) {
    throw new AppError("Invoice not found", 404);
  }

  // Create a copy without _id and invoice_number
  const duplicateData = original.toObject();
  delete duplicateData._id;
  delete duplicateData.invoice_number;
  delete duplicateData.createdAt;
  delete duplicateData.updatedAt;

  // Reset status and flags
  duplicateData.status = "DRAFT";
  duplicateData.is_draft = true;
  duplicateData.amount_paid = 0;
  duplicateData.balance_due = duplicateData.total_amount;
  duplicateData.created_by = req.user._id;

  const newInvoice = await Invoice.create(duplicateData);
  await newInvoice.populate("buyer", "name email user_id");

  return ApiResponse.created(res, { invoice: newInvoice }, "Invoice duplicated");
});

// ===========================
// POST /api/invoices/:id/send-email
// ===========================
// Admin only — send invoice via email to buyer
export const sendEmail = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { recipientEmail, customMessage } = req.body;

  const invoice = await Invoice.findById(id)
    .populate("buyer", "name email user_id");

  if (!invoice) {
    throw new AppError("Invoice not found", 404);
  }

  // Determine recipient email
  const emailTo = recipientEmail || invoice.buyer_email || invoice.bill_to?.email || invoice.buyer?.email;

  if (!emailTo) {
    throw new AppError("No recipient email address available", 400);
  }

  // Generate PDF
  let pdfBuffer = null;
  try {
    pdfBuffer = await generateInvoicePDF(invoice.toObject());
  } catch (pdfError) {
    console.error("[InvoicesController] PDF generation failed:", pdfError.message);
    // Continue without PDF attachment
  }

  // Send email
  try {
    await sendInvoiceEmail(invoice, emailTo, {
      customMessage,
      pdfBuffer,
    });
  } catch (emailError) {
    console.error("[InvoicesController] Email send failed:", emailError.message);
    throw new AppError(`Failed to send email: ${emailError.message}`, 500);
  }

  // Update invoice tracking
  invoice.is_emailed = true;
  invoice.last_emailed_at = new Date();
  await invoice.save();

  return ApiResponse.success(
    res,
    { invoice, emailSentTo: emailTo },
    `Invoice sent successfully to ${emailTo}`
  );
});
