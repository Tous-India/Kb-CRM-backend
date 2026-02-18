# KB CRM API — Postman Testing Guide

Base URL: `http://localhost:5000/api`

> **Setup**: For all protected routes, add header:
> `Authorization: Bearer <your_jwt_token>`
> You get the token from login response.

---

## 1. SEED ADMIN FIRST

Run in terminal:
```bash
npm run seed
```
This creates SUPER_ADMIN: `manawwar@gmail.com` / `admin123`

---

## 2. AUTH

### Register Buyer
```
POST /api/auth/register
```
```json
{
  "name": "John Buyer",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1-555-0101",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "USA"
  },
  "company_details": {
    "company_name": "Aviation Parts Inc",
    "tax_id": "TAX-12345",
    "phone": "+1-555-0102",
    "billing_email": "billing@aviationparts.com"
  }
}
```

### Login (Admin)
```
POST /api/auth/login
```
```json
{
  "email": "manawwar@gmail.com",
  "password": "admin123"
}
```
> **Copy the `token` from response — use it in all protected routes as Bearer token.**

### Login (Buyer)
```
POST /api/auth/login
```
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get My Profile
```
GET /api/auth/me
Authorization: Bearer <token>
```

### Forgot Password
```
POST /api/auth/forgot-password
```
```json
{
  "email": "john@example.com"
}
```

### Reset Password
```
POST /api/auth/reset-password/<reset_token_from_response>
```
```json
{
  "password": "newpassword123"
}
```

---

## 3. USERS (Admin Token Required)

### Get All Users
```
GET /api/users?page=1&limit=10&search=john
Authorization: Bearer <admin_token>
```

### Get All Buyers
```
GET /api/users/buyers?page=1&limit=10
Authorization: Bearer <admin_token>
```

### Get All Sub-Admins (SUPER_ADMIN only)
```
GET /api/users/sub-admins
Authorization: Bearer <admin_token>
```

### Create Buyer (Admin)
```
POST /api/users
Authorization: Bearer <admin_token>
```
```json
{
  "name": "Sarah Buyer",
  "email": "sarah@example.com",
  "password": "password123",
  "phone": "+1-555-0201",
  "address": {
    "street": "456 Oak Ave",
    "city": "Los Angeles",
    "state": "CA",
    "zip": "90001",
    "country": "USA"
  },
  "company_details": {
    "company_name": "Sky Parts LLC",
    "tax_id": "TAX-67890"
  }
}
```

### Create Sub-Admin (SUPER_ADMIN only)
```
POST /api/users/sub-admin
Authorization: Bearer <admin_token>
```
```json
{
  "name": "Mike Admin",
  "email": "mike@kbcrm.com",
  "password": "admin456",
  "phone": "+1-555-0301",
  "permissions": [
    "manage_orders",
    "manage_products",
    "manage_quotes",
    "view_analytics"
  ]
}
```

### Update User
```
PUT /api/users/<user_id>
Authorization: Bearer <admin_token>
```
```json
{
  "name": "John Buyer Updated",
  "phone": "+1-555-9999",
  "address": {
    "street": "789 New St",
    "city": "Chicago",
    "state": "IL",
    "zip": "60601",
    "country": "USA"
  }
}
```

### Update Sub-Admin Permissions (SUPER_ADMIN only)
```
PUT /api/users/<sub_admin_id>/permissions
Authorization: Bearer <admin_token>
```
```json
{
  "permissions": [
    "manage_orders",
    "manage_products",
    "manage_quotes",
    "manage_payments",
    "manage_invoices",
    "manage_dispatch",
    "view_analytics"
  ]
}
```

### Deactivate User
```
PUT /api/users/<user_id>/deactivate
Authorization: Bearer <admin_token>
```

### Activate User
```
PUT /api/users/<user_id>/activate
Authorization: Bearer <admin_token>
```

### Delete User (soft delete)
```
DELETE /api/users/<user_id>
Authorization: Bearer <admin_token>
```

---

## 4. CATEGORIES (Admin Token for write, Public for read)

### Get All Categories
```
GET /api/categories
```

### Get Category by ID
```
GET /api/categories/<category_id>
```

### Create Category (with icon — use form-data)
```
POST /api/categories
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

Fields:
  name: "Engines"
  description: "Aircraft engine parts and components"
  display_order: 1

File:
  image: <select_image_file>
```

### Create Category (without icon — use JSON)
```
POST /api/categories
Authorization: Bearer <admin_token>
```
```json
{
  "name": "Avionics",
  "description": "Electronic systems for aircraft",
  "display_order": 2
}
```

### Update Category
```
PUT /api/categories/<category_id>
Authorization: Bearer <admin_token>
```
```json
{
  "name": "Avionics Systems",
  "description": "Updated description"
}
```

### Add Sub-Category
```
POST /api/categories/<category_id>/sub-categories
Authorization: Bearer <admin_token>
```
```json
{
  "name": "Turbine Blades",
  "description": "High-performance turbine blade components"
}
```

### Update Sub-Category
```
PUT /api/categories/<category_id>/sub-categories/<sub_category_id>
Authorization: Bearer <admin_token>
```
```json
{
  "name": "Turbine Blades V2",
  "description": "Updated turbine blade description"
}
```

### Delete Sub-Category
```
DELETE /api/categories/<category_id>/sub-categories/<sub_category_id>
Authorization: Bearer <admin_token>
```

### Soft Delete Category
```
DELETE /api/categories/<category_id>
Authorization: Bearer <admin_token>
```

---

## 5. BRANDS (Admin Token for write, Public for read)

### Get All Brands
```
GET /api/brands
```

### Create Brand (with logo — use form-data)
```
POST /api/brands
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

Fields:
  name: "Pratt & Whitney"
  description: "American aerospace manufacturer"
  website: "https://www.prattwhitney.com"

File:
  image: <select_logo_file>
```

### Create Brand (without logo — use JSON)
```
POST /api/brands
Authorization: Bearer <admin_token>
```
```json
{
  "name": "Rolls-Royce",
  "description": "British aerospace engine maker",
  "website": "https://www.rolls-royce.com"
}
```

### Update Brand
```
PUT /api/brands/<brand_id>
Authorization: Bearer <admin_token>
```
```json
{
  "name": "Rolls-Royce Holdings",
  "description": "Updated description"
}
```

### Soft Delete Brand
```
DELETE /api/brands/<brand_id>
Authorization: Bearer <admin_token>
```

---

## 6. PRODUCTS (Admin Token for write, Public for read)

### Get All Products
```
GET /api/products?page=1&limit=10
```

### Search Products
```
GET /api/products/search?keyword=turbine&page=1&limit=10
```

### Get Products by Category
```
GET /api/products/category/<category_id>
```

### Get Products by Brand
```
GET /api/products/brand/Pratt%20%26%20Whitney
```

### Create Product
```
POST /api/products
Authorization: Bearer <admin_token>
```
```json
{
  "part_number": "PW-1100G-001",
  "oem_part": "OEM-PW-1100",
  "product_name": "PW1100G Turbine Blade Set",
  "category": "<category_object_id>",
  "sub_category": "<sub_category_id>",
  "brand": "Pratt & Whitney",
  "description": "High-performance turbine blade set for PW1100G-JM engine",
  "list_price": 15000,
  "your_price": 12500,
  "discount_percentage": 16.67,
  "stock_status": "IN_STOCK",
  "available_locations": [
    { "location": "Warehouse A - New York", "quantity": 25 },
    { "location": "Warehouse B - Los Angeles", "quantity": 10 }
  ],
  "total_quantity": 35,
  "specifications": {
    "weight": "2.5 kg",
    "dimensions": "30 x 10 x 5 cm",
    "material": "Nickel-based superalloy",
    "volume": "1500 cc"
  },
  "manufacturer": "Pratt & Whitney"
}
```

### Create Product 2 (for cart/PO testing)
```
POST /api/products
Authorization: Bearer <admin_token>
```
```json
{
  "part_number": "RR-T700-002",
  "oem_part": "OEM-RR-700",
  "product_name": "Trent 700 Compressor Disc",
  "category": "<category_object_id>",
  "brand": "Rolls-Royce",
  "description": "Compressor disc for Rolls-Royce Trent 700 engine",
  "list_price": 8500,
  "your_price": 7200,
  "discount_percentage": 15.29,
  "stock_status": "IN_STOCK",
  "available_locations": [
    { "location": "Warehouse A - New York", "quantity": 15 }
  ],
  "total_quantity": 15,
  "specifications": {
    "weight": "5.0 kg",
    "material": "Titanium alloy"
  },
  "manufacturer": "Rolls-Royce"
}
```

### Update Product
```
PUT /api/products/<product_id>
Authorization: Bearer <admin_token>
```
```json
{
  "product_name": "PW1100G Turbine Blade Set V2",
  "list_price": 16000,
  "your_price": 13000,
  "description": "Updated high-performance turbine blade set"
}
```

### Update Inventory
```
PUT /api/products/<product_id>/inventory
Authorization: Bearer <admin_token>
```
```json
{
  "stock_status": "IN_STOCK",
  "available_locations": [
    { "location": "Warehouse A - New York", "quantity": 50 },
    { "location": "Warehouse C - Dallas", "quantity": 20 }
  ],
  "total_quantity": 70
}
```

### Upload Product Images (form-data)
```
POST /api/products/<product_id>/images
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

File:
  images: <select_multiple_image_files>
```

### Update Main Image (form-data)
```
PUT /api/products/<product_id>/main-image
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

File:
  image: <select_image_file>
```

### Delete Product Image
```
DELETE /api/products/<product_id>/images/<image_public_id>
Authorization: Bearer <admin_token>
```

### Soft Delete Product
```
DELETE /api/products/<product_id>
Authorization: Bearer <admin_token>
```

---

## 7. CART (Buyer Token Required)

### Get My Cart
```
GET /api/carts
Authorization: Bearer <buyer_token>
```

### Add Item to Cart
```
POST /api/carts/items
Authorization: Bearer <buyer_token>
```
```json
{
  "product": "<product_object_id_1>",
  "quantity": 5
}
```

### Add Another Item
```
POST /api/carts/items
Authorization: Bearer <buyer_token>
```
```json
{
  "product": "<product_object_id_2>",
  "quantity": 3
}
```

### Update Item Quantity
```
PUT /api/carts/items/<item_id>
Authorization: Bearer <buyer_token>
```
```json
{
  "quantity": 10
}
```

### Remove Item from Cart
```
DELETE /api/carts/items/<item_id>
Authorization: Bearer <buyer_token>
```

### Clear Entire Cart
```
DELETE /api/carts
Authorization: Bearer <buyer_token>
```

### Checkout (Creates Purchase Order)
> **Add items first, then checkout.**
```
POST /api/carts/checkout
Authorization: Bearer <buyer_token>
```
```json
{
  "title": "Q1 2026 Engine Parts Restock",
  "shipping_address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "USA"
  },
  "customer_notes": "Please deliver before March 15"
}
```

---

## 8. PURCHASE ORDERS (Buyer + Admin)

### Get My Purchase Orders (Buyer)
```
GET /api/purchase-orders/my?page=1&limit=10
Authorization: Bearer <buyer_token>
```

### Create PO Directly (without cart — Buyer)
```
POST /api/purchase-orders
Authorization: Bearer <buyer_token>
```
```json
{
  "title": "Emergency Turbine Blade Order",
  "items": [
    {
      "product": "<product_object_id_1>",
      "quantity": 2
    },
    {
      "product": "<product_object_id_2>",
      "quantity": 1
    }
  ],
  "shipping_address": {
    "street": "456 Oak Ave",
    "city": "Los Angeles",
    "state": "CA",
    "zip": "90001",
    "country": "USA"
  },
  "customer_notes": "Urgent — need ASAP"
}
```

### Get All POs (Admin)
```
GET /api/purchase-orders?page=1&limit=10&status=PENDING
Authorization: Bearer <admin_token>
```

### Get PO by ID
```
GET /api/purchase-orders/<po_id>
Authorization: Bearer <token>
```

### Update PO (Buyer — PENDING only)
```
PUT /api/purchase-orders/<po_id>
Authorization: Bearer <buyer_token>
```
```json
{
  "title": "Updated Title - Q1 Parts",
  "customer_notes": "Updated notes"
}
```

### Cancel PO (Buyer)
```
PUT /api/purchase-orders/<po_id>/cancel
Authorization: Bearer <buyer_token>
```

### Reject PO (Admin)
```
PUT /api/purchase-orders/<po_id>/reject
Authorization: Bearer <admin_token>
```
```json
{
  "admin_notes": "Products currently unavailable from supplier"
}
```

---

## 9. QUOTATIONS (Admin creates, Buyer accepts/rejects)

### Create Quotation from PO (Admin)
> **Use a PENDING PO id. Admin sets pricing here.**
```
POST /api/quotations
Authorization: Bearer <admin_token>
```
```json
{
  "purchase_order": "<po_object_id>",
  "items": [
    {
      "product": "<product_object_id_1>",
      "quantity": 5,
      "unit_price": 12500
    },
    {
      "product": "<product_object_id_2>",
      "quantity": 3,
      "unit_price": 7200
    }
  ],
  "tax": 2500,
  "shipping": 500,
  "expiry_date": "2026-03-15",
  "internal_notes": "Priority customer — 10% discount applied"
}
```

### Get All Quotations (Admin)
```
GET /api/quotations?page=1&limit=10&status=PENDING
Authorization: Bearer <admin_token>
```

### Get My Quotations (Buyer)
```
GET /api/quotations/my?page=1&limit=10
Authorization: Bearer <buyer_token>
```

### Get Quotation by ID
```
GET /api/quotations/<quotation_id>
Authorization: Bearer <token>
```

### Update Quotation (Admin — PENDING only)
```
PUT /api/quotations/<quotation_id>
Authorization: Bearer <admin_token>
```
```json
{
  "items": [
    {
      "product": "<product_object_id_1>",
      "quantity": 5,
      "unit_price": 11000
    },
    {
      "product": "<product_object_id_2>",
      "quantity": 3,
      "unit_price": 6800
    }
  ],
  "tax": 2000,
  "shipping": 400,
  "expiry_date": "2026-04-01",
  "internal_notes": "Revised pricing — 15% discount"
}
```

### Accept Quotation (Buyer)
```
PUT /api/quotations/<quotation_id>/accept
Authorization: Bearer <buyer_token>
```

### Reject Quotation (Buyer)
```
PUT /api/quotations/<quotation_id>/reject
Authorization: Bearer <buyer_token>
```

### Download Quotation PDF
```
GET /api/quotations/<quotation_id>/pdf
Authorization: Bearer <token>
```
> Response: PDF file download

### Convert to Proforma (Admin — ACCEPTED only)
```
POST /api/quotations/<quotation_id>/convert-to-proforma
Authorization: Bearer <admin_token>
```

### Convert to Order (Admin — ACCEPTED only)
```
POST /api/quotations/<quotation_id>/convert-to-order
Authorization: Bearer <admin_token>
```

---

## 10. ORDERS (Admin creates from Quotation)

### Create Order from Quotation (Admin)
> **Quotation must be ACCEPTED or CONVERTED.**
```
POST /api/orders
Authorization: Bearer <admin_token>
```
```json
{
  "quotation": "<quotation_object_id>",
  "shipping_address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "USA"
  },
  "notes": "Handle with care — fragile components",
  "estimated_delivery": "2026-03-20"
}
```

### Get All Orders (Admin)
```
GET /api/orders?page=1&limit=10&status=OPEN
Authorization: Bearer <admin_token>
```

### Get Open Orders (Admin)
```
GET /api/orders/open?page=1&limit=10
Authorization: Bearer <admin_token>
```

### Get Dispatched Orders (Admin)
```
GET /api/orders/dispatched?page=1&limit=10
Authorization: Bearer <admin_token>
```

### Get My Orders (Buyer)
```
GET /api/orders/my?page=1&limit=10
Authorization: Bearer <buyer_token>
```

### Get Order by ID
```
GET /api/orders/<order_id>
Authorization: Bearer <token>
```

### Update Order (Admin)
```
PUT /api/orders/<order_id>
Authorization: Bearer <admin_token>
```
```json
{
  "notes": "Updated delivery notes",
  "admin_notes": "Parts sourced from Warehouse A",
  "estimated_delivery": "2026-03-25"
}
```

### Update Order Status (Admin)
```
PUT /api/orders/<order_id>/status
Authorization: Bearer <admin_token>
```
```json
{
  "status": "PROCESSING"
}
```

### Record Payment Against Order (Admin)
```
POST /api/orders/<order_id>/payment
Authorization: Bearer <admin_token>
```
```json
{
  "amount": 50000,
  "payment_method": "Wire Transfer",
  "notes": "First installment received"
}
```

### Dispatch Order (Admin)
```
PUT /api/orders/<order_id>/dispatch
Authorization: Bearer <admin_token>
```
```json
{
  "courier_service": "FedEx International",
  "tracking_number": "FX-9876543210",
  "dispatch_notes": "Shipped in 2 boxes — fragile items double-wrapped"
}
```

### Update Dispatch Info (Admin)
```
PUT /api/orders/<order_id>/dispatch-info
Authorization: Bearer <admin_token>
```
```json
{
  "tracking_number": "FX-9876543210-UPDATED",
  "dispatch_notes": "Updated tracking — box 2 shipped separately"
}
```

---

## 11. PROFORMA INVOICES (Admin creates from Quotation)

### Create Proforma from Quotation (Admin)
> **Quotation must be ACCEPTED.**
```
POST /api/proforma-invoices
Authorization: Bearer <admin_token>
```
```json
{
  "quotation": "<quotation_object_id>",
  "valid_until": "2026-04-01",
  "payment_terms": "Net 30 — Full payment before dispatch",
  "billing_address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "USA"
  },
  "shipping_address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "USA"
  },
  "notes": "Payment required before shipment"
}
```

### Get All Proformas (Admin)
```
GET /api/proforma-invoices?page=1&limit=10
Authorization: Bearer <admin_token>
```

### Get My Proformas (Buyer)
```
GET /api/proforma-invoices/my?page=1&limit=10
Authorization: Bearer <buyer_token>
```

### Get Proforma by ID
```
GET /api/proforma-invoices/<proforma_id>
Authorization: Bearer <token>
```

### Update Proforma (Admin — PENDING only)
```
PUT /api/proforma-invoices/<proforma_id>
Authorization: Bearer <admin_token>
```
```json
{
  "valid_until": "2026-05-01",
  "payment_terms": "Net 45",
  "notes": "Extended validity per customer request"
}
```

### Approve Proforma (Admin)
```
PUT /api/proforma-invoices/<proforma_id>/approve
Authorization: Bearer <admin_token>
```

### Reject Proforma (Admin)
```
PUT /api/proforma-invoices/<proforma_id>/reject
Authorization: Bearer <admin_token>
```

---

## 12. INVOICES (Admin creates from Order)

### Create Invoice from Order (Admin)
```
POST /api/invoices
Authorization: Bearer <admin_token>
```
```json
{
  "order": "<order_object_id>",
  "due_date": "2026-04-15",
  "billing_address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "USA"
  },
  "notes": "Payment due within 30 days"
}
```

### Create Manual Invoice (Admin — not from order)
```
POST /api/invoices/manual
Authorization: Bearer <admin_token>
```
```json
{
  "buyer": "<buyer_object_id>",
  "items": [
    {
      "product_name": "Consulting Fee — Engine Inspection",
      "part_number": "SVC-001",
      "quantity": 1,
      "unit_price": 5000
    },
    {
      "product_name": "Shipping & Handling",
      "quantity": 1,
      "unit_price": 250
    }
  ],
  "tax": 525,
  "shipping": 0,
  "due_date": "2026-04-30",
  "billing_address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "USA"
  },
  "notes": "Manual invoice for service charges"
}
```

### Get All Invoices (Admin)
```
GET /api/invoices?page=1&limit=10&status=UNPAID
Authorization: Bearer <admin_token>
```

### Get My Invoices (Buyer)
```
GET /api/invoices/my?page=1&limit=10
Authorization: Bearer <buyer_token>
```

### Get Invoice by ID
```
GET /api/invoices/<invoice_id>
Authorization: Bearer <token>
```

### Update Invoice (Admin)
```
PUT /api/invoices/<invoice_id>
Authorization: Bearer <admin_token>
```
```json
{
  "due_date": "2026-05-15",
  "notes": "Extended due date per customer request"
}
```

### Update Invoice Status (Admin)
```
PUT /api/invoices/<invoice_id>/status
Authorization: Bearer <admin_token>
```
```json
{
  "status": "OVERDUE"
}
```

### Download Invoice PDF
```
GET /api/invoices/<invoice_id>/pdf
Authorization: Bearer <token>
```
> Response: PDF file download — set Postman to "Send and Download"

---

## 13. PAYMENTS (Admin records against Invoice)

### Record Payment (Admin)
```
POST /api/payments
Authorization: Bearer <admin_token>
```
```json
{
  "invoice": "<invoice_object_id>",
  "amount": 50000,
  "currency": "USD",
  "payment_method": "Wire Transfer",
  "transaction_id": "TXN-2026-001234",
  "notes": "Full payment received via wire transfer"
}
```

### Record Payment in INR (Admin)
```
POST /api/payments
Authorization: Bearer <admin_token>
```
```json
{
  "invoice": "<invoice_object_id>",
  "amount": 420000,
  "currency": "INR",
  "amount_usd": 5000,
  "payment_method": "BANK_TRANSFER",
  "transaction_id": "NEFT-2026-005678",
  "notes": "INR payment — equivalent to $5,000 USD"
}
```

### Get All Payments (Admin)
```
GET /api/payments?page=1&limit=10&status=COMPLETED
Authorization: Bearer <admin_token>
```

### Get Pending Payments (Admin)
```
GET /api/payments/pending?page=1&limit=10
Authorization: Bearer <admin_token>
```

### Get Payments by Customer (Admin)
```
GET /api/payments/customer/<buyer_object_id>?page=1&limit=10
Authorization: Bearer <admin_token>
```

### Get My Payments (Buyer)
```
GET /api/payments/my?page=1&limit=10
Authorization: Bearer <buyer_token>
```

### Get Payment by ID
```
GET /api/payments/<payment_id>
Authorization: Bearer <token>
```

### Update Payment (Admin)
```
PUT /api/payments/<payment_id>
Authorization: Bearer <admin_token>
```
```json
{
  "payment_method": "Check",
  "transaction_id": "CHK-2026-0099",
  "notes": "Updated — payment was via check not wire"
}
```

### Refund Payment (Admin)
```
PUT /api/payments/<payment_id>/status
Authorization: Bearer <admin_token>
```
```json
{
  "status": "REFUNDED"
}
```
> This auto-reverses the invoice balance.

---

## 14. STATEMENTS (Admin generates per buyer)

### Generate Statement (Admin)
```
POST /api/statements/generate
Authorization: Bearer <admin_token>
```
```json
{
  "buyer": "<buyer_object_id>",
  "period_start": "2026-01-01",
  "period_end": "2026-01-31"
}
```

### Get All Statements (Admin)
```
GET /api/statements?page=1&limit=10
Authorization: Bearer <admin_token>
```

### Get My Statements (Buyer)
```
GET /api/statements/my?page=1&limit=10
Authorization: Bearer <buyer_token>
```

### Get Statements by Customer (Admin)
```
GET /api/statements/customer/<buyer_object_id>?page=1&limit=10
Authorization: Bearer <admin_token>
```

### Get All Transactions (Admin)
```
GET /api/statements/transactions
Authorization: Bearer <admin_token>
```

### Get Transactions by Month (Admin)
```
GET /api/statements/transactions/by-month?year=2026&month=2
Authorization: Bearer <admin_token>
```

### Get Transactions by Buyer (Admin)
```
GET /api/statements/transactions/by-buyer/<buyer_object_id>
Authorization: Bearer <admin_token>
```

### Download Statement PDF
```
GET /api/statements/<statement_id>/pdf
Authorization: Bearer <token>
```
> Response: PDF file download

---

## 15. SETTINGS (SUPER_ADMIN only)

### Create Setting
```
POST /api/settings
Authorization: Bearer <admin_token>
```
```json
{
  "key": "company_name",
  "value": "KB Aviation Parts",
  "category": "general",
  "description": "Company display name"
}
```

### Create More Settings
```json
{
  "key": "default_currency",
  "value": "USD",
  "category": "finance",
  "description": "Default currency for invoices"
}
```

```json
{
  "key": "inr_exchange_rate",
  "value": 84.0,
  "category": "finance",
  "description": "INR to USD exchange rate"
}
```

```json
{
  "key": "low_stock_threshold",
  "value": 10,
  "category": "inventory",
  "description": "Alert when product quantity falls below this"
}
```

### Get All Settings
```
GET /api/settings
Authorization: Bearer <admin_token>
```

### Get Settings by Category
```
GET /api/settings/category/finance
Authorization: Bearer <admin_token>
```

### Get Setting by Key
```
GET /api/settings/company_name
Authorization: Bearer <admin_token>
```

### Update Setting
```
PUT /api/settings/inr_exchange_rate
Authorization: Bearer <admin_token>
```
```json
{
  "value": 85.5,
  "description": "Updated exchange rate"
}
```

### Bulk Update Settings
```
PUT /api/settings/bulk
Authorization: Bearer <admin_token>
```
```json
{
  "settings": [
    { "key": "company_name", "value": "KB Aviation Solutions" },
    { "key": "inr_exchange_rate", "value": 86.0 },
    { "key": "tax_percentage", "value": 18 }
  ]
}
```

### Delete Setting
```
DELETE /api/settings/tax_percentage
Authorization: Bearer <admin_token>
```

---

## 16. DASHBOARD (Admin — view_analytics permission)

### Dashboard Summary
```
GET /api/dashboard/summary
Authorization: Bearer <admin_token>
```

### Sales Overview (Monthly)
```
GET /api/dashboard/sales-overview?year=2026
Authorization: Bearer <admin_token>
```

### Recent Orders
```
GET /api/dashboard/recent-orders?limit=10
Authorization: Bearer <admin_token>
```

### Pending Payments
```
GET /api/dashboard/pending-payments?limit=10
Authorization: Bearer <admin_token>
```

### Inventory Alerts
```
GET /api/dashboard/inventory-alerts?threshold=10
Authorization: Bearer <admin_token>
```

### Top Products
```
GET /api/dashboard/top-products?limit=10
Authorization: Bearer <admin_token>
```

### Top Buyers
```
GET /api/dashboard/top-buyers?limit=10
Authorization: Bearer <admin_token>
```

### Order Status Breakdown
```
GET /api/dashboard/order-status-breakdown
Authorization: Bearer <admin_token>
```

### Revenue by Month
```
GET /api/dashboard/revenue-by-month?year=2026
Authorization: Bearer <admin_token>
```

---

## COMPLETE TESTING FLOW (Step by Step)

Follow this order to test the full sales flow:

1. **Seed admin** → `npm run seed`
2. **Login admin** → `POST /api/auth/login` (save admin token)
3. **Register buyer** → `POST /api/auth/register` (save buyer token)
4. **Create category** → `POST /api/categories` (save category ID)
5. **Create brand** → `POST /api/brands` (save brand ID)
6. **Create products** → `POST /api/products` × 2 (save product IDs)
7. **Add to cart** → `POST /api/carts/items` × 2 (buyer token)
8. **Checkout** → `POST /api/carts/checkout` (buyer token — creates PO, save PO ID)
9. **View POs** → `GET /api/purchase-orders` (admin token — see pending PO)
10. **Create quotation** → `POST /api/quotations` (admin token — sets pricing, save quotation ID)
11. **View quotation** → `GET /api/quotations/my` (buyer token)
12. **Accept quotation** → `PUT /api/quotations/:id/accept` (buyer token)
13. **Download quotation PDF** → `GET /api/quotations/:id/pdf`
14. **(Optional) Create proforma** → `POST /api/proforma-invoices` (admin token)
15. **Create order** → `POST /api/orders` (admin token — save order ID)
16. **View orders** → `GET /api/orders/my` (buyer token)
17. **Create invoice** → `POST /api/invoices` (admin token — save invoice ID)
18. **Download invoice PDF** → `GET /api/invoices/:id/pdf`
19. **Record payment** → `POST /api/payments` (admin token)
20. **Dispatch order** → `PUT /api/orders/:id/dispatch` (admin token)
21. **Generate statement** → `POST /api/statements/generate` (admin token)
22. **Download statement PDF** → `GET /api/statements/:id/pdf`
23. **View dashboard** → `GET /api/dashboard/summary` (admin token)

---

*Replace all `<object_id>` placeholders with actual MongoDB ObjectIds from responses.*
