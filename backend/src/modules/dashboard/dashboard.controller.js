import Order from "../orders/orders.model.js";
import Invoice from "../invoices/invoices.model.js";
import Payment from "../payments/payments.model.js";
import Product from "../products/products.model.js";
import User from "../users/users.model.js";
import PurchaseOrder from "../purchaseOrders/purchaseOrders.model.js";
import Quotation from "../quotations/quotations.model.js";
import ProformaInvoice from "../proformaInvoices/proformaInvoices.model.js";
import PaymentRecord from "../paymentRecords/paymentRecords.model.js";
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

// ===========================
// GET /api/dashboard/buyer-stats
// ===========================
// Dashboard stats for logged-in buyer
export const getBuyerStats = catchAsync(async (req, res) => {
  const buyerId = req.user._id;

  // Fetch all stats in parallel
  const [
    pendingQuotations,
    openOrders,
    totalInvoicesData,
    recentOrders,
    pendingPIs,
    buyerInfo,
  ] = await Promise.all([
    // Pending quotations sent to this buyer
    Quotation.countDocuments({
      buyer: buyerId,
      status: { $in: ["SENT", "PENDING"] },
    }),

    // Open orders for this buyer
    Order.countDocuments({
      buyer: buyerId,
      status: { $in: ["OPEN", "PROCESSING", "PENDING", "QUOTED"] },
    }),

    // Total invoice amount for this buyer
    Invoice.aggregate([
      { $match: { buyer: buyerId } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$total_amount" },
          count: { $sum: 1 },
          unpaidAmount: {
            $sum: {
              $cond: [
                { $in: ["$status", ["UNPAID", "PARTIAL", "OVERDUE"]] },
                "$balance_due",
                0,
              ],
            },
          },
        },
      },
    ]),

    // Recent orders for this buyer
    Order.find({ buyer: buyerId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
        "order_id po_number status payment_status total_amount total_quantity dispatched_quantity createdAt items"
      ),

    // Pending Proforma Invoices (requiring payment)
    ProformaInvoice.countDocuments({
      buyer: buyerId,
      status: { $in: ["SENT", "PENDING"] },
    }),

    // Get buyer info with credit details
    User.findById(buyerId).select("credit_info company_details user_id"),
  ]);

  const invoiceStats =
    totalInvoicesData.length > 0
      ? totalInvoicesData[0]
      : { totalAmount: 0, count: 0, unpaidAmount: 0 };

  // Format recent orders
  const formattedOrders = recentOrders.map((order) => ({
    order_id: order.order_id,
    po_number: order.po_number || "-",
    date: order.createdAt,
    status: order.status,
    payment_status: order.payment_status,
    total_amount: order.total_amount || 0,
    total_items: order.items?.length || 0,
    total_quantity: order.total_quantity || 0,
    dispatched_quantity: order.dispatched_quantity || 0,
    remaining_quantity:
      (order.total_quantity || 0) - (order.dispatched_quantity || 0),
  }));

  return ApiResponse.success(
    res,
    {
      stats: {
        pendingQuotations,
        openOrders,
        pendingPIs,
        totalInvoices: invoiceStats.count,
        totalInvoiceAmount: invoiceStats.totalAmount,
        unpaidAmount: invoiceStats.unpaidAmount,
      },
      creditInfo: buyerInfo?.credit_info || {
        payment_terms: "WIRE TRANSFER",
        credit_days: 0,
        discount_code: "",
        credit_limit: 0,
        credit_used: 0,
      },
      customerId: buyerInfo?.user_id || "N/A",
      recentOrders: formattedOrders,
    },
    "Buyer dashboard stats fetched"
  );
});

// ===========================
// GET /api/dashboard/buyer-recent-orders
// ===========================
// Recent orders for logged-in buyer with more details
export const getBuyerRecentOrders = catchAsync(async (req, res) => {
  const buyerId = req.user._id;
  const limit = Number(req.query.limit) || 10;

  const orders = await Order.find({ buyer: buyerId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select(
      "order_id po_number status payment_status total_amount total_quantity dispatched_quantity pending_quantity createdAt items"
    );

  const formattedOrders = orders.map((order) => {
    const totalQty = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    const deliveredQty = order.dispatched_quantity || 0;

    return {
      order_id: order.order_id,
      po_number: order.po_number || "-",
      date: order.createdAt,
      status: order.status,
      payment_status: order.payment_status,
      total_amount: order.total_amount || 0,
      total_items: order.items?.length || 0,
      total_quantity: totalQty,
      delivered: deliveredQty,
      remaining: totalQty - deliveredQty,
    };
  });

  return ApiResponse.success(
    res,
    { orders: formattedOrders },
    "Buyer recent orders fetched"
  );
});
