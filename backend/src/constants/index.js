// ===========================
// Roles
// ===========================
export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  SUB_ADMIN: "SUB_ADMIN",
  BUYER: "BUYER",
};

// ===========================
// Sub-Admin Permissions
// ===========================
export const PERMISSIONS = {
  MANAGE_USERS: "manage_users",
  MANAGE_ORDERS: "manage_orders",
  MANAGE_PRODUCTS: "manage_products",
  VIEW_ANALYTICS: "view_analytics",
  MANAGE_QUOTES: "manage_quotes",
  MANAGE_PAYMENTS: "manage_payments",
  MANAGE_INVOICES: "manage_invoices",
  MANAGE_DISPATCH: "manage_dispatch",
  MANAGE_SUPPLIERS: "manage_suppliers",
  MANAGE_ALLOCATIONS: "manage_allocations",
};

// All available permissions as an array
export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

// ===========================
// Order Status
// ===========================
export const ORDER_STATUS = {
  OPEN: "OPEN",
  PROCESSING: "PROCESSING",
  DISPATCHED: "DISPATCHED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

// ===========================
// Payment Status
// ===========================
export const PAYMENT_STATUS = {
  UNPAID: "UNPAID",
  PARTIAL: "PARTIAL",
  PAID: "PAID",
};

// ===========================
// Invoice Status
// ===========================
export const INVOICE_STATUS = {
  UNPAID: "UNPAID",
  PARTIAL: "PARTIAL",
  PAID: "PAID",
  OVERDUE: "OVERDUE",
};

// ===========================
// Purchase Order Status
// ===========================
export const PO_STATUS = {
  PENDING: "PENDING",
  CONVERTED: "CONVERTED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
};

// ===========================
// Quotation Status
// ===========================
export const QUOTE_STATUS = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
  CONVERTED: "CONVERTED",
};

// ===========================
// Proforma Invoice Status
// ===========================
export const PROFORMA_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
};

// ===========================
// Supplier Status
// ===========================
export const SUPPLIER_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

// ===========================
// PI Item Allocation Status
// ===========================
export const PI_ALLOCATION_STATUS = {
  UNALLOCATED: "UNALLOCATED",
  PARTIAL: "PARTIAL",
  ALLOCATED: "ALLOCATED",
};

// ===========================
// Supplier Allocation Status
// ===========================
export const ALLOCATION_STATUS = {
  PENDING: "PENDING",
  ORDERED: "ORDERED",
  RECEIVED: "RECEIVED",
  PARTIAL_RECEIVED: "PARTIAL_RECEIVED",
};
