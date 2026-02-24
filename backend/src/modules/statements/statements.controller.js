import Statement from "./statements.model.js";
import Invoice from "../invoices/invoices.model.js";
import Payment from "../payments/payments.model.js";
import ProformaInvoice from "../proformaInvoices/proformaInvoices.model.js";
import PaymentRecord from "../paymentRecords/paymentRecords.model.js";
import catchAsync from "../../utils/catchAsync.js";
import ApiResponse from "../../utils/apiResponse.js";
import AppError from "../../utils/AppError.js";
import { ROLES } from "../../constants/index.js";
import { generateStatementPDF } from "../../utils/pdfGenerator.js";

// ===========================
// GET /api/statements
// ===========================
// Admin only — fetch all statements
// No pagination needed: ~100 statements per reporting period
export const getAll = catchAsync(async (req, res) => {
  const statements = await Statement.find()
    .populate("buyer", "name email user_id")
    .sort({ createdAt: -1 });

  return ApiResponse.success(res, { statements }, "Statements fetched");
});

// ===========================
// GET /api/statements/my
// ===========================
// Buyer only — fetch my statement based on PIs and payments
export const getMyStatement = catchAsync(async (req, res) => {
  const buyerId = req.user._id;

  // Fetch all PIs for this buyer
  const pis = await ProformaInvoice.find({ buyer: buyerId })
    .select("proforma_number total_amount payment_received payment_status exchange_rate createdAt updatedAt items")
    .sort({ createdAt: -1 });

  // Fetch all verified payment records for this buyer
  const payments = await PaymentRecord.find({
    buyer: buyerId,
    status: "VERIFIED",
  })
    .populate("proforma_invoice", "proforma_number")
    .select("proforma_number amount recorded_amount currency payment_date payment_method transaction_id notes createdAt")
    .sort({ payment_date: -1 });

  // Build transactions list
  const transactions = [];

  // Add PI entries as charges
  pis.forEach((pi) => {
    transactions.push({
      date: pi.createdAt,
      type: "PI",
      reference: pi.proforma_number,
      description: "Invoice raised",
      charges: pi.total_amount,
      payments: 0,
      pi_total: pi.total_amount,
      pi_paid: pi.payment_received || 0,
      pi_balance: pi.total_amount - (pi.payment_received || 0),
      payment_status: pi.payment_status,
      exchange_rate: pi.exchange_rate,
    });
  });

  // Add payment entries
  payments.forEach((pay) => {
    const amount = pay.recorded_amount || pay.amount;
    const methodLabel = pay.payment_method === "BANK_TRANSFER" ? "Bank Transfer" :
                        pay.payment_method === "WIRE_TRANSFER" ? "Wire Transfer" :
                        pay.payment_method === "UPI" ? "UPI" :
                        pay.payment_method === "CASH" ? "Cash" :
                        pay.payment_method || "Payment";
    transactions.push({
      date: pay.payment_date,
      type: "PAYMENT",
      reference: pay.proforma_number,
      description: pay.transaction_id ? `${methodLabel} - ${pay.transaction_id}` : methodLabel,
      charges: 0,
      payments: amount,
      payment_method: pay.payment_method,
      proforma_number: pay.proforma_number,
    });
  });

  // Sort all transactions by date (newest first)
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Calculate running balance (oldest to newest)
  const sortedForBalance = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
  let runningBalance = 0;
  sortedForBalance.forEach((txn) => {
    runningBalance += txn.charges - txn.payments;
    txn.balance = runningBalance;
  });

  // Now update the original sorted array with balances
  const transactionMap = new Map();
  sortedForBalance.forEach((txn, idx) => {
    const key = `${txn.reference}-${txn.date}`;
    transactionMap.set(key, txn.balance);
  });
  transactions.forEach((txn) => {
    const key = `${txn.reference}-${txn.date}`;
    txn.balance = transactionMap.get(key) || 0;
  });

  // Calculate summary
  const totalPIAmount = pis.reduce((sum, pi) => sum + (pi.total_amount || 0), 0);
  const totalPayments = payments.reduce((sum, pay) => sum + (pay.recorded_amount || pay.amount || 0), 0);
  const balanceDue = totalPIAmount - totalPayments;

  // Summary by PI
  const piSummary = pis.map((pi) => ({
    proforma_number: pi.proforma_number,
    total_amount: pi.total_amount,
    payment_received: pi.payment_received || 0,
    balance: pi.total_amount - (pi.payment_received || 0),
    payment_status: pi.payment_status,
    exchange_rate: pi.exchange_rate,
    date: pi.createdAt,
  }));

  return ApiResponse.success(res, {
    transactions,
    summary: {
      total_pi_amount: totalPIAmount,
      total_payments: totalPayments,
      balance_due: balanceDue,
      total_pis: pis.length,
      total_payment_records: payments.length,
    },
    pi_summary: piSummary,
  }, "My statement fetched");
});

// ===========================
// GET /api/statements/customer/:customerId
// ===========================
// Admin only — fetch statements for a customer
// No pagination needed: bounded by customer statement history
export const getByCustomer = catchAsync(async (req, res) => {
  const { customerId } = req.params;

  const statements = await Statement.find({ buyer: customerId })
    .sort({ createdAt: -1 });

  return ApiResponse.success(res, { statements }, "Customer statements fetched");
});

// ===========================
// GET /api/statements/transactions
// ===========================
// Admin only — aggregate all invoices + payments as transactions
export const getTransactions = catchAsync(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;

  // Get recent invoices and payments as transaction entries
  const [invoices, payments] = await Promise.all([
    Invoice.find()
      .populate("buyer", "name user_id")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .select("invoice_number buyer buyer_name total_amount createdAt"),
    Payment.find({ status: "COMPLETED" })
      .populate("buyer", "name user_id")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .select("payment_id buyer buyer_name amount payment_date"),
  ]);

  const transactions = [];

  invoices.forEach((inv) => {
    transactions.push({
      date: inv.createdAt,
      type: "INVOICE",
      reference: inv.invoice_number,
      description: `Invoice ${inv.invoice_number}`,
      buyer: inv.buyer,
      charges: inv.total_amount,
      payments: 0,
    });
  });

  payments.forEach((pay) => {
    transactions.push({
      date: pay.payment_date,
      type: "PAYMENT",
      reference: pay.payment_id,
      description: `Payment ${pay.payment_id}`,
      buyer: pay.buyer,
      charges: 0,
      payments: pay.amount,
    });
  });

  // Sort by date descending
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  return ApiResponse.success(res, { transactions }, "Transactions fetched");
});

// ===========================
// GET /api/statements/transactions/by-month
// ===========================
// Admin only — filter transactions by month
// Query: ?year=2026&month=1
export const getTransactionsByMonth = catchAsync(async (req, res) => {
  const { year, month } = req.query;

  if (!year || !month) {
    throw new AppError("Year and month are required", 400);
  }

  const startDate = new Date(Number(year), Number(month) - 1, 1);
  const endDate = new Date(Number(year), Number(month), 1);

  const [invoices, payments] = await Promise.all([
    Invoice.find({ createdAt: { $gte: startDate, $lt: endDate } })
      .populate("buyer", "name user_id")
      .sort({ createdAt: -1 })
      .select("invoice_number buyer buyer_name total_amount createdAt"),
    Payment.find({
      status: "COMPLETED",
      payment_date: { $gte: startDate, $lt: endDate },
    })
      .populate("buyer", "name user_id")
      .sort({ payment_date: -1 })
      .select("payment_id buyer buyer_name amount payment_date"),
  ]);

  const transactions = [];

  invoices.forEach((inv) => {
    transactions.push({
      date: inv.createdAt,
      type: "INVOICE",
      reference: inv.invoice_number,
      buyer: inv.buyer,
      charges: inv.total_amount,
      payments: 0,
    });
  });

  payments.forEach((pay) => {
    transactions.push({
      date: pay.payment_date,
      type: "PAYMENT",
      reference: pay.payment_id,
      buyer: pay.buyer,
      charges: 0,
      payments: pay.amount,
    });
  });

  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  return ApiResponse.success(res, { transactions, year, month }, "Monthly transactions fetched");
});

// ===========================
// GET /api/statements/transactions/by-buyer/:buyerId
// ===========================
// Admin only — transactions for a specific buyer
export const getTransactionsByBuyer = catchAsync(async (req, res) => {
  const { buyerId } = req.params;

  const [invoices, payments] = await Promise.all([
    Invoice.find({ buyer: buyerId })
      .sort({ createdAt: -1 })
      .select("invoice_number total_amount createdAt"),
    Payment.find({ buyer: buyerId, status: "COMPLETED" })
      .sort({ payment_date: -1 })
      .select("payment_id amount payment_date"),
  ]);

  const transactions = [];

  invoices.forEach((inv) => {
    transactions.push({
      date: inv.createdAt,
      type: "INVOICE",
      reference: inv.invoice_number,
      charges: inv.total_amount,
      payments: 0,
    });
  });

  payments.forEach((pay) => {
    transactions.push({
      date: pay.payment_date,
      type: "PAYMENT",
      reference: pay.payment_id,
      charges: 0,
      payments: pay.amount,
    });
  });

  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  return ApiResponse.success(res, { transactions }, "Buyer transactions fetched");
});

// ===========================
// POST /api/statements/generate
// ===========================
// Admin only — generate statement for a buyer for a period
// Body: { buyer, period_start, period_end }
export const generate = catchAsync(async (req, res) => {
  const { buyer, period_start, period_end } = req.body;

  if (!buyer || !period_start || !period_end) {
    throw new AppError("Buyer, period_start, and period_end are required", 400);
  }

  const startDate = new Date(period_start);
  const endDate = new Date(period_end);

  // Get invoices and payments in the period
  const [invoices, payments] = await Promise.all([
    Invoice.find({
      buyer,
      createdAt: { $gte: startDate, $lte: endDate },
    }).select("invoice_number total_amount createdAt"),
    Payment.find({
      buyer,
      status: "COMPLETED",
      payment_date: { $gte: startDate, $lte: endDate },
    }).select("payment_id amount payment_date"),
  ]);

  // Get previous statement for opening balance
  const lastStatement = await Statement.findOne({ buyer })
    .sort({ period_end: -1 })
    .select("closing_balance");

  const openingBalance = lastStatement ? lastStatement.closing_balance : 0;

  // Build transaction entries
  const transactionEntries = [];
  let totalCharges = 0;
  let totalPayments = 0;
  let runningBalance = openingBalance;

  // Combine and sort by date
  const allEntries = [];

  invoices.forEach((inv) => {
    allEntries.push({
      date: inv.createdAt,
      type: "INVOICE",
      reference: inv.invoice_number,
      description: `Invoice ${inv.invoice_number}`,
      charges: inv.total_amount,
      payments: 0,
    });
  });

  payments.forEach((pay) => {
    allEntries.push({
      date: pay.payment_date,
      type: "PAYMENT",
      reference: pay.payment_id,
      description: `Payment ${pay.payment_id}`,
      charges: 0,
      payments: pay.amount,
    });
  });

  allEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

  allEntries.forEach((entry) => {
    totalCharges += entry.charges;
    totalPayments += entry.payments;
    runningBalance += entry.charges - entry.payments;

    transactionEntries.push({
      ...entry,
      balance: runningBalance,
    });
  });

  const closingBalance = openingBalance + totalCharges - totalPayments;

  const statement = await Statement.create({
    buyer,
    period_start: startDate,
    period_end: endDate,
    opening_balance: openingBalance,
    total_charges: totalCharges,
    total_payments: totalPayments,
    closing_balance: closingBalance,
    transactions: transactionEntries,
    generated_by: req.user._id,
  });

  return ApiResponse.created(res, { statement }, "Statement generated");
});

// ===========================
// GET /api/statements/:id/pdf
// ===========================
// Placeholder — PDF generation
export const downloadPdf = catchAsync(async (req, res) => {
  const { id } = req.params;

  const statement = await Statement.findById(id)
    .populate("buyer", "name email phone address company_details");

  if (!statement) {
    throw new AppError("Statement not found", 404);
  }

  const isAdminUser =
    req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.SUB_ADMIN;

  if (!isAdminUser && statement.buyer._id.toString() !== req.user._id.toString()) {
    throw new AppError("You can only download your own statements", 403);
  }

  const pdfBuffer = await generateStatementPDF(statement.toObject());

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename=statement-${statement.statement_id}.pdf`,
    "Content-Length": pdfBuffer.length,
  });

  return res.send(pdfBuffer);
});
