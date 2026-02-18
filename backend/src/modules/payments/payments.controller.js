import Payment from "./payments.model.js";
import Invoice from "../invoices/invoices.model.js";
import catchAsync from "../../utils/catchAsync.js";
import ApiResponse from "../../utils/apiResponse.js";
import AppError from "../../utils/AppError.js";
import { ROLES } from "../../constants/index.js";

// ===========================
// GET /api/payments
// ===========================
// Admin only — fetch all payments
export const getAll = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate("buyer", "name email user_id")
      .populate("invoice", "invoice_number total_amount")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Payment.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, payments, page, limit, total, "Payments fetched");
});

// ===========================
// GET /api/payments/my
// ===========================
// Buyer only — fetch my payments
export const getMyPayments = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const filter = { buyer: req.user._id };
  const skip = (Number(page) - 1) * Number(limit);

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate("invoice", "invoice_number total_amount")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Payment.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, payments, page, limit, total, "My payments fetched");
});

// ===========================
// GET /api/payments/pending
// ===========================
// Admin only — fetch pending payments
export const getPending = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const filter = { status: "PENDING" };
  const skip = (Number(page) - 1) * Number(limit);

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate("buyer", "name email user_id")
      .populate("invoice", "invoice_number total_amount")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Payment.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, payments, page, limit, total, "Pending payments fetched");
});

// ===========================
// GET /api/payments/customer/:customerId
// ===========================
// Admin only — fetch payments by customer
export const getByCustomer = catchAsync(async (req, res) => {
  const { customerId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const filter = { buyer: customerId };
  const skip = (Number(page) - 1) * Number(limit);

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate("invoice", "invoice_number total_amount")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Payment.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, payments, page, limit, total, "Customer payments fetched");
});

// ===========================
// GET /api/payments/:id
// ===========================
// Buyer sees own, Admin sees any
export const getById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const payment = await Payment.findById(id)
    .populate("buyer", "name email user_id phone")
    .populate("invoice", "invoice_number total_amount balance_due");

  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  const isAdminUser =
    req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.SUB_ADMIN;

  if (!isAdminUser && payment.buyer._id.toString() !== req.user._id.toString()) {
    throw new AppError("You can only view your own payments", 403);
  }

  return ApiResponse.success(res, { payment }, "Payment fetched");
});

// ===========================
// POST /api/payments
// ===========================
// Admin only — record a payment against an invoice
// Body: { invoice, amount, currency, amount_usd, payment_method, transaction_id, notes }
export const create = catchAsync(async (req, res) => {
  const { invoice: invoiceId, amount, currency, amount_usd, payment_method, transaction_id, notes } = req.body;

  if (!invoiceId) {
    throw new AppError("Invoice ID is required", 400);
  }

  if (!amount || amount <= 0) {
    throw new AppError("Valid payment amount is required", 400);
  }

  const invoice = await Invoice.findById(invoiceId).populate("buyer", "name");

  if (!invoice) {
    throw new AppError("Invoice not found", 404);
  }

  const payment = await Payment.create({
    invoice: invoice._id,
    invoice_number: invoice.invoice_number,
    buyer: invoice.buyer._id,
    buyer_name: invoice.buyer.name,
    amount,
    currency: currency || "USD",
    amount_usd: currency === "INR" ? amount_usd : amount,
    payment_method,
    transaction_id,
    status: "COMPLETED",
    notes,
    recorded_by: req.user._id,
  });

  // Update invoice amounts
  invoice.amount_paid += amount;
  invoice.balance_due = invoice.total_amount - invoice.amount_paid;

  if (invoice.balance_due <= 0) {
    invoice.status = "PAID";
    invoice.payment_date = new Date();
  } else {
    invoice.status = "PARTIAL";
  }

  await invoice.save();

  return ApiResponse.created(res, { payment, invoice }, "Payment recorded");
});

// ===========================
// PUT /api/payments/:id
// ===========================
// Admin only — update payment details
export const update = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { payment_method, transaction_id, notes } = req.body;

  const payment = await Payment.findById(id);

  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  if (payment_method !== undefined) payment.payment_method = payment_method;
  if (transaction_id !== undefined) payment.transaction_id = transaction_id;
  if (notes !== undefined) payment.notes = notes;

  await payment.save();

  return ApiResponse.success(res, { payment }, "Payment updated");
});

// ===========================
// PUT /api/payments/:id/status
// ===========================
// Admin only — update payment status (e.g. mark as refunded)
export const updateStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    throw new AppError("Status is required", 400);
  }

  const payment = await Payment.findById(id);

  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  const oldStatus = payment.status;
  payment.status = status;
  await payment.save();

  // If refunded, update invoice balance
  if (status === "REFUNDED" && oldStatus === "COMPLETED") {
    const invoice = await Invoice.findById(payment.invoice);
    if (invoice) {
      invoice.amount_paid -= payment.amount;
      invoice.balance_due = invoice.total_amount - invoice.amount_paid;
      invoice.status = invoice.balance_due <= 0 ? "PAID" : invoice.balance_due < invoice.total_amount ? "PARTIAL" : "UNPAID";
      await invoice.save();
    }
  }

  return ApiResponse.success(res, { payment }, "Payment status updated");
});
