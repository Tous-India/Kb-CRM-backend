import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/AppError.js";
import { generateReportPDF, REPORT_CONFIGS } from "../../utils/reportPdfGenerator.js";

// Models
import Invoice from "../invoices/invoices.model.js";
import Order from "../orders/orders.model.js";
import Quotation from "../quotations/quotations.model.js";
import Payment from "../payments/payments.model.js";
import Product from "../products/products.model.js";
import User from "../users/users.model.js";
import PurchaseOrder from "../purchaseOrders/purchaseOrders.model.js";
import Statement from "../statements/statements.model.js";

// ===========================
// Model + query config per report type
// ===========================
const REPORT_QUERY_MAP = {
  invoices: {
    model: Invoice,
    populate: [
      { path: "buyer", select: "name email user_id" },
      { path: "order", select: "order_id" },
    ],
    filterMap: {
      status: "status",
      buyer: "buyer",
    },
    dateField: "invoice_date",
    sort: { createdAt: -1 },
  },
  orders: {
    model: Order,
    populate: [{ path: "buyer", select: "name email user_id" }],
    filterMap: {
      status: "status",
      buyer: "buyer",
    },
    dateField: "createdAt",
    sort: { createdAt: -1 },
  },
  quotations: {
    model: Quotation,
    populate: [{ path: "buyer", select: "name email user_id" }],
    filterMap: {
      status: "status",
      buyer: "buyer",
    },
    dateField: "quote_date",
    sort: { createdAt: -1 },
  },
  payments: {
    model: Payment,
    populate: [
      { path: "buyer", select: "name email user_id" },
      { path: "invoice", select: "invoice_number" },
    ],
    filterMap: {
      status: "status",
      buyer: "buyer",
      payment_method: "payment_method",
    },
    dateField: "payment_date",
    sort: { createdAt: -1 },
  },
  products: {
    model: Product,
    populate: [],
    filterMap: {
      category: "category",
      brand: "brand",
      stock_status: "stock_status",
    },
    dateField: "createdAt",
    sort: { createdAt: -1 },
  },
  users: {
    model: User,
    populate: [],
    filterMap: {
      role: "role",
      is_active: "is_active",
    },
    dateField: "createdAt",
    sort: { createdAt: -1 },
    select: "-password",
  },
  purchaseOrders: {
    model: PurchaseOrder,
    populate: [{ path: "buyer", select: "name email user_id" }],
    filterMap: {
      status: "status",
      buyer: "buyer",
    },
    dateField: "po_date",
    sort: { createdAt: -1 },
  },
  statements: {
    model: Statement,
    populate: [{ path: "buyer", select: "name email user_id" }],
    filterMap: {
      buyer: "buyer",
    },
    dateField: "period_start",
    sort: { createdAt: -1 },
  },
};

// ===========================
// GET /api/reports/download-pdf
// ===========================
// Query params:
//   type     (required) - invoices, orders, quotations, payments, products, users, purchaseOrders, statements
//   status   (optional) - filter by status
//   buyer    (optional) - filter by buyer ID
//   category (optional) - filter by category (products)
//   brand    (optional) - filter by brand (products)
//   role     (optional) - filter by role (users)
//   from     (optional) - date range start (ISO string)
//   to       (optional) - date range end (ISO string)
//   limit    (optional) - max records (default 5000)
export const downloadReport = catchAsync(async (req, res) => {
  const { type, from, to, limit = 5000, ...filterParams } = req.query;

  // Validate report type
  if (!type || !REPORT_CONFIGS[type]) {
    throw new AppError(
      `Invalid report type. Supported: ${Object.keys(REPORT_CONFIGS).join(", ")}`,
      400
    );
  }

  const queryConfig = REPORT_QUERY_MAP[type];
  if (!queryConfig) {
    throw new AppError(`Report type '${type}' is not configured`, 400);
  }

  // Build MongoDB filter
  const filter = {};
  const appliedFilters = {};

  // Map query params to MongoDB fields
  for (const [param, value] of Object.entries(filterParams)) {
    if (value && queryConfig.filterMap[param]) {
      const dbField = queryConfig.filterMap[param];
      if (param === "is_active") {
        filter[dbField] = value === "true";
        appliedFilters[param] = value;
      } else {
        filter[dbField] = value;
        appliedFilters[param] = value;
      }
    }
  }

  // Date range filter
  if (from || to) {
    const dateField = queryConfig.dateField;
    filter[dateField] = {};
    if (from) {
      filter[dateField].$gte = new Date(from);
      appliedFilters.from = from;
    }
    if (to) {
      filter[dateField].$lte = new Date(to);
      appliedFilters.to = to;
    }
  }

  // Query data
  let query = queryConfig.model
    .find(filter)
    .sort(queryConfig.sort)
    .limit(Math.min(Number(limit), 10000)); // hard cap at 10k

  // Apply select
  if (queryConfig.select) {
    query = query.select(queryConfig.select);
  }

  // Apply populates
  for (const pop of queryConfig.populate) {
    query = query.populate(pop);
  }

  const data = await query.lean();

  // Generate PDF
  const pdfBuffer = await generateReportPDF(type, data, appliedFilters);

  // Set response headers
  const filename = `${type}-report-${new Date().toISOString().slice(0, 10)}.pdf`;

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Content-Length": pdfBuffer.length,
    "Cache-Control": "no-cache, no-store",
  });

  return res.send(pdfBuffer);
});

// ===========================
// GET /api/reports/types
// ===========================
// Returns available report types
export const getReportTypes = catchAsync(async (req, res) => {
  const types = Object.keys(REPORT_CONFIGS).map((key) => ({
    type: key,
    title: REPORT_CONFIGS[key].title,
    filters: Object.keys(REPORT_QUERY_MAP[key]?.filterMap || {}),
  }));

  res.json({
    status: "success",
    data: { types },
  });
});
