import { Router } from "express";

// ===========================
// Import All Module Routes
// ===========================
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/users.routes.js";
import productRoutes from "./modules/products/products.routes.js";
import categoryRoutes from "./modules/categories/categories.routes.js";
import brandRoutes from "./modules/brands/brands.routes.js";
import orderRoutes from "./modules/orders/orders.routes.js";
import purchaseOrderRoutes from "./modules/purchaseOrders/purchaseOrders.routes.js";
import quotationRoutes from "./modules/quotations/quotations.routes.js";
import proformaRoutes from "./modules/proformaInvoices/proformaInvoices.routes.js";
import paymentRecordRoutes from "./modules/paymentRecords/paymentRecords.routes.js";
import invoiceRoutes from "./modules/invoices/invoices.routes.js";
import paymentRoutes from "./modules/payments/payments.routes.js";
import statementRoutes from "./modules/statements/statements.routes.js";
import cartRoutes from "./modules/carts/carts.routes.js";
import settingRoutes from "./modules/settings/settings.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import reportRoutes from "./modules/reports/reports.routes.js";

// Purchase Management Module Routes
import supplierRoutes from "./modules/suppliers/suppliers.routes.js";
import piAllocationRoutes from "./modules/piAllocations/piAllocations.routes.js";
import purchaseDashboardRoutes from "./modules/purchaseDashboard/purchaseDashboard.routes.js";
import supplierOrderRoutes from "./modules/supplierOrders/supplierOrders.routes.js";

// Dispatch Module
import dispatchRoutes from "./modules/dispatches/dispatches.routes.js";

// Archive Module
import archiveRoutes from "./modules/archives/archives.routes.js";

const router = Router();

// ===========================
// Health Check
// ===========================
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "KB CRM API is running",
    timestamp: new Date().toISOString(),
  });
});

// ===========================
// Register Module Routes
// ===========================
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/brands", brandRoutes);
router.use("/orders", orderRoutes);
router.use("/purchase-orders", purchaseOrderRoutes);
router.use("/quotations", quotationRoutes);
router.use("/proforma-invoices", proformaRoutes);
router.use("/payment-records", paymentRecordRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/payments", paymentRoutes);
router.use("/statements", statementRoutes);
router.use("/carts", cartRoutes);
router.use("/settings", settingRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/reports", reportRoutes);

// Purchase Management Routes
router.use("/suppliers", supplierRoutes);
router.use("/pi-allocations", piAllocationRoutes);
router.use("/purchase-dashboard", purchaseDashboardRoutes);
router.use("/supplier-orders", supplierOrderRoutes);

// Dispatch Routes
router.use("/dispatches", dispatchRoutes);

// Archive Routes
router.use("/archives", archiveRoutes);

export default router;
