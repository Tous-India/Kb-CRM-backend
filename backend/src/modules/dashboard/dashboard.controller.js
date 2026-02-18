import Order from "../orders/orders.model.js";
import Invoice from "../invoices/invoices.model.js";
import Payment from "../payments/payments.model.js";
import Product from "../products/products.model.js";
import User from "../users/users.model.js";
import PurchaseOrder from "../purchaseOrders/purchaseOrders.model.js";
import Quotation from "../quotations/quotations.model.js";
import catchAsync from "../../utils/catchAsync.js";
import ApiResponse from "../../utils/apiResponse.js";
import { ROLES } from "../../constants/index.js";

// ===========================
// GET /api/dashboard/summary
// ===========================
// Overall counts and totals
export const getSummary = catchAsync(async (req, res) => {
  const [
    totalOrders,
    openOrders,
    dispatchedOrders,
    totalBuyers,
    totalProducts,
    activeProducts,
    pendingPOs,
    pendingQuotations,
    totalRevenue,
    unpaidInvoices,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: { $in: ["OPEN", "PROCESSING"] } }),
    Order.countDocuments({ status: "DISPATCHED" }),
    User.countDocuments({ role: ROLES.BUYER, is_active: true }),
    Product.countDocuments(),
    Product.countDocuments({ is_active: true }),
    PurchaseOrder.countDocuments({ status: "PENDING" }),
    Quotation.countDocuments({ status: "PENDING" }),
    Payment.aggregate([
      { $match: { status: "COMPLETED" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Invoice.countDocuments({ status: { $in: ["UNPAID", "PARTIAL", "OVERDUE"] } }),
  ]);

  const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

  return ApiResponse.success(
    res,
    {
      summary: {
        totalOrders,
        openOrders,
        dispatchedOrders,
        totalBuyers,
        totalProducts,
        activeProducts,
        pendingPOs,
        pendingQuotations,
        totalRevenue: revenue,
        unpaidInvoices,
      },
    },
    "Dashboard summary fetched"
  );
});

// ===========================
// GET /api/dashboard/sales-overview
// ===========================
// Monthly sales for the current year
export const getSalesOverview = catchAsync(async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();

  const monthlySales = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${year + 1}-01-01`),
        },
        status: { $ne: "CANCELLED" },
      },
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        totalAmount: { $sum: "$total_amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Fill all 12 months
  const months = Array.from({ length: 12 }, (_, i) => {
    const found = monthlySales.find((m) => m._id === i + 1);
    return {
      month: i + 1,
      totalAmount: found ? found.totalAmount : 0,
      count: found ? found.count : 0,
    };
  });

  return ApiResponse.success(res, { year, months }, "Sales overview fetched");
});

// ===========================
// GET /api/dashboard/recent-orders
// ===========================
// Latest 10 orders
export const getRecentOrders = catchAsync(async (req, res) => {
  const limit = Number(req.query.limit) || 10;

  const orders = await Order.find()
    .populate("buyer", "name email user_id")
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("order_id title buyer buyer_name status payment_status total_amount createdAt");

  return ApiResponse.success(res, { orders }, "Recent orders fetched");
});

// ===========================
// GET /api/dashboard/pending-payments
// ===========================
// Invoices that are unpaid or partial
export const getPendingPayments = catchAsync(async (req, res) => {
  const limit = Number(req.query.limit) || 10;

  const invoices = await Invoice.find({
    status: { $in: ["UNPAID", "PARTIAL", "OVERDUE"] },
  })
    .populate("buyer", "name email user_id")
    .populate("order", "order_id title")
    .sort({ due_date: 1 })
    .limit(limit)
    .select("invoice_number buyer order status total_amount amount_paid balance_due due_date");

  return ApiResponse.success(res, { invoices }, "Pending payments fetched");
});

// ===========================
// GET /api/dashboard/inventory-alerts
// ===========================
// Products with low stock or out of stock
export const getInventoryAlerts = catchAsync(async (req, res) => {
  const threshold = Number(req.query.threshold) || 10;

  const products = await Product.find({
    is_active: true,
    $or: [
      { stock_status: "OUT_OF_STOCK" },
      { total_quantity: { $lte: threshold } },
    ],
  })
    .sort({ total_quantity: 1 })
    .limit(20)
    .select("product_id part_number product_name stock_status total_quantity");

  return ApiResponse.success(res, { products, threshold }, "Inventory alerts fetched");
});

// ===========================
// GET /api/dashboard/top-products
// ===========================
// Most ordered products (by quantity across all orders)
export const getTopProducts = catchAsync(async (req, res) => {
  const limit = Number(req.query.limit) || 10;

  const topProducts = await Order.aggregate([
    { $match: { status: { $ne: "CANCELLED" } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        product_name: { $first: "$items.product_name" },
        part_number: { $first: "$items.part_number" },
        totalQuantity: { $sum: "$items.quantity" },
        totalRevenue: { $sum: "$items.total_price" },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: limit },
  ]);

  return ApiResponse.success(res, { products: topProducts }, "Top products fetched");
});

// ===========================
// GET /api/dashboard/top-buyers
// ===========================
// Buyers with most orders and highest spend
export const getTopBuyers = catchAsync(async (req, res) => {
  const limit = Number(req.query.limit) || 10;

  const topBuyers = await Order.aggregate([
    { $match: { status: { $ne: "CANCELLED" } } },
    {
      $group: {
        _id: "$buyer",
        buyer_name: { $first: "$buyer_name" },
        totalOrders: { $sum: 1 },
        totalSpend: { $sum: "$total_amount" },
      },
    },
    { $sort: { totalSpend: -1 } },
    { $limit: limit },
  ]);

  // Populate buyer details
  const buyerIds = topBuyers.map((b) => b._id);
  const buyers = await User.find({ _id: { $in: buyerIds } }).select("name email user_id");
  const buyerMap = {};
  buyers.forEach((b) => {
    buyerMap[b._id.toString()] = b;
  });

  const result = topBuyers.map((b) => ({
    buyer: buyerMap[b._id.toString()] || { name: b.buyer_name },
    totalOrders: b.totalOrders,
    totalSpend: b.totalSpend,
  }));

  return ApiResponse.success(res, { buyers: result }, "Top buyers fetched");
});

// ===========================
// GET /api/dashboard/order-status-breakdown
// ===========================
// Count of orders by status
export const getOrderStatusBreakdown = catchAsync(async (req, res) => {
  const breakdown = await Order.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const result = {};
  breakdown.forEach((b) => {
    result[b._id] = b.count;
  });

  return ApiResponse.success(res, { breakdown: result }, "Order status breakdown fetched");
});

// ===========================
// GET /api/dashboard/revenue-by-month
// ===========================
// Payments received per month
export const getRevenueByMonth = catchAsync(async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();

  const monthlyRevenue = await Payment.aggregate([
    {
      $match: {
        status: "COMPLETED",
        payment_date: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${year + 1}-01-01`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$payment_date" },
        totalAmount: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const months = Array.from({ length: 12 }, (_, i) => {
    const found = monthlyRevenue.find((m) => m._id === i + 1);
    return {
      month: i + 1,
      totalAmount: found ? found.totalAmount : 0,
      count: found ? found.count : 0,
    };
  });

  return ApiResponse.success(res, { year, months }, "Revenue by month fetched");
});
