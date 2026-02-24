# KB CRM Backend API

Node.js + Express.js + MongoDB backend for the KB CRM application (Aviation Parts Business).

---

## Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js 5.x (ES Modules)
- **Database**: MongoDB with Mongoose 9.x
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **File Upload**: Multer (memory storage) + Cloudinary + Streamifier
- **Security**: Helmet, CORS
- **Logging**: Morgan (dev)

---

## Project Structure

```
test-backend/
├── server.js                         # Entry point — connects DB, starts server
├── app.js                            # Express app — middlewares, routes, error handler
├── package.json
├── .env                              # Environment variables (not committed)
├── .env.example                      # Environment template
├── .gitignore
│
├── src/
│   ├── config/
│   │   ├── index.js                  # Loads .env into clean config object
│   │   ├── db.js                     # MongoDB connection (Mongoose)
│   │   └── cloudinary.js             # Cloudinary v2 config
│   │
│   ├── constants/
│   │   └── index.js                  # All enums — ROLES, PERMISSIONS, ORDER_STATUS, PAYMENT_STATUS, INVOICE_STATUS, PO_STATUS, QUOTE_STATUS, PROFORMA_STATUS
│   │
│   ├── utils/
│   │   ├── AppError.js               # Custom Error class (throw new AppError("msg", 404))
│   │   ├── catchAsync.js             # Wraps async controllers — no try/catch needed
│   │   ├── apiResponse.js            # Standardized response helpers (success, created, noContent, paginated)
│   │   ├── cloudinaryUpload.js       # uploadToCloudinary(buffer, folder) & deleteFromCloudinary(publicId)
│   │   └── pdfGenerator.js          # generateInvoicePDF, generateStatementPDF, generateQuotationPDF
│   │
│   ├── middlewares/
│   │   ├── error.middleware.js        # Global error handler (Mongoose, JWT, custom errors)
│   │   ├── auth.middleware.js         # protect (JWT verify), authorize(...roles), checkPermission(perm)
│   │   └── upload.middleware.js       # Multer memory storage: uploadSingle (field: "image"), uploadMultiple (field: "images", max 10)
│   │
│   ├── seeds/
│   │   └── seedAdmin.js              # Creates SUPER_ADMIN if none exists (npm run seed)
│   │
│   ├── routes.js                     # Route aggregator — all module routes registered here
│   │
│   └── modules/                      # Feature-based modules (model + controller + routes)
│       ├── auth/                     # Authentication (register, login, logout, me, password reset)
│       ├── users/                    # User management (CRUD, buyers, sub-admins, permissions)
│       ├── products/                 # Product catalog (CRUD, search, images, inventory)
│       ├── categories/               # Categories with sub-categories (CRUD, icon upload)
│       ├── brands/                   # Brands (CRUD, logo upload)
│       ├── carts/                    # Cart per user (add, update, remove, clear, checkout → PO)
│       ├── purchaseOrders/           # Purchase Orders (buyer submits product+qty, no pricing)
│       ├── quotations/               # Quotations (admin sets pricing from PO, buyer accepts/rejects)
│       ├── orders/                   # Orders (created from quotation, dispatch, payment tracking)
│       ├── proformaInvoices/         # Proforma Invoices (optional, from accepted quotation)
│       ├── invoices/                 # Invoices (from order or manual, tracks balance)
│       ├── payments/                 # Payments (recorded against invoices, updates balance)
│       ├── statements/               # Statements (generated per buyer for a period, aging buckets)
│       ├── settings/                 # App settings (key-value store, SUPER_ADMIN only)
│       └── dashboard/               # Dashboard analytics (summary, sales, top products/buyers)
│
├── uploads/                          # Local file uploads (gitignored)
├── logs/                             # Application logs (gitignored)
└── tests/                            # Test suites
```

---

## How It Works

```
server.js  →  connectDB()  →  app.listen()
                                  │
app.js     →  helmet → cors → json → morgan → /api routes → 404 handler → error middleware
                                                  │
routes.js  →  /api/health  →  /api/auth  →  /api/users  →  /api/products  →  ...
```

---

## Core Files Explained

### `server.js`
Entry point. Connects to MongoDB, then starts the Express server.

### `app.js`
Creates and configures the Express app:
1. Security middlewares (helmet, cors)
2. Body parsers (json, urlencoded)
3. Request logger (morgan — dev only)
4. API routes under `/api`
5. 404 handler for undefined routes
6. Global error handler (must be last)

### `src/config/index.js`
Loads `.env` and exports a clean config object:
```js
import config from "./src/config/index.js";
config.port       // 5000
config.mongoUri   // mongodb://localhost:27017/kb_crm
config.jwtSecret  // your secret
config.isDev      // true/false
```

### `src/config/db.js`
Connects to MongoDB using Mongoose. Exits process on connection failure.

### `src/config/cloudinary.js`
Configures Cloudinary v2 with credentials from `.env`.

### `src/constants/index.js`
All enums used across the app:
```js
import { ROLES, PERMISSIONS, ORDER_STATUS, PAYMENT_STATUS } from "../constants/index.js";

ROLES.SUPER_ADMIN    // "SUPER_ADMIN"
ROLES.SUB_ADMIN      // "SUB_ADMIN"
ROLES.BUYER          // "BUYER"

PERMISSIONS.MANAGE_USERS     // "manage_users"
PERMISSIONS.MANAGE_ORDERS    // "manage_orders"
// ... 8 granular permissions total
```

### `src/utils/AppError.js`
Custom error class. Throw it anywhere — the global error handler catches it:
```js
throw new AppError("User not found", 404);
throw new AppError("Email already exists", 400);
throw new AppError("Not authorized", 401);
```

### `src/utils/catchAsync.js`
Wraps async controller functions. No try/catch needed:
```js
export const getUsers = catchAsync(async (req, res) => {
  const users = await User.find();
  return ApiResponse.success(res, users, "Users fetched");
});
```

### `src/utils/apiResponse.js`
Standardized JSON responses:
```js
ApiResponse.success(res, data, "Users fetched");           // 200
ApiResponse.created(res, newUser, "User created");          // 201
ApiResponse.noContent(res);                                 // 204
ApiResponse.paginated(res, users, page, limit, totalCount); // 200 with pagination
```

### `src/utils/cloudinaryUpload.js`
Upload/delete images via Cloudinary streaming:
```js
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinaryUpload.js";

const result = await uploadToCloudinary(buffer, "kb-crm/products");
// result.secure_url, result.public_id

await deleteFromCloudinary(publicId);
```

### `src/middlewares/error.middleware.js`
Global error handler. Catches and converts:
- **AppError** → clean status + message
- **Mongoose CastError** → "Invalid ID format"
- **Mongoose 11000** → "field already exists"
- **Mongoose ValidationError** → "Validation failed: ..."
- **JWT errors** → "Invalid/expired token"
- **Unknown errors** → "Something went wrong" (production) or full stack (dev)

### `src/middlewares/auth.middleware.js`
Three middleware functions:
- `protect` — verifies JWT token from `Authorization: Bearer <token>` header
- `authorize(...roles)` — restricts to specific roles (e.g. `authorize("SUPER_ADMIN")`)
- `checkPermission(perm)` — checks sub-admin permission. SUPER_ADMIN always passes.

### `src/middlewares/upload.middleware.js`
Multer with memory storage (no disk writes):
- `uploadSingle` — single file upload (field name: `image`)
- `uploadMultiple` — multi file upload (field name: `images`, max 10)

---

## Roles & Permissions

| Role | Description |
|------|-------------|
| `SUPER_ADMIN` | Full access. Can create sub-admins. Bypasses all permission checks. |
| `SUB_ADMIN` | Limited access based on assigned permissions. |
| `BUYER` | Browse products (no prices), raise POs, manage cart, view own data. |

### Sub-Admin Permissions
| Permission | Access |
|------------|--------|
| `manage_users` | View/create/edit buyers, activate/deactivate |
| `manage_orders` | View/process orders, update status |
| `manage_products` | Add/edit/delete products, categories, brands |
| `view_analytics` | Access dashboard and reports |
| `manage_quotes` | Create/edit quotations and proforma invoices |
| `manage_payments` | Record and manage payments |
| `manage_invoices` | Create/edit invoices (regular + manual), generate statements |
| `manage_dispatch` | Dispatch orders and update tracking info |

---

## Business Rules

1. **Pricing hidden from buyers** — Product prices are only visible to admins. Buyers see catalog without prices. Admin sets pricing at quotation stage.
2. **Out-of-stock ordering allowed** — Buyers can raise purchase orders for out-of-stock products. Admin handles sourcing.
3. **Purchase order title** — Every PO requires a title (e.g. "Q1 Parts Restock"). Title carries over to the order.
4. **Advance payment model** — Orders require payment before dispatch.
5. **One cart per user** — Each buyer has a single cart (unique constraint on user field).
6. **Delete pattern** — Most resources use soft delete (`is_active: false`). Products use hard delete (permanent removal from database).

---

## Sales Flow

```
BUYER browses products (no prices)
  → Adds to CART (quantity only)
  → Checks out → Creates PURCHASE ORDER with title
  → ADMIN converts PO → QUOTATION (sets unit pricing, tax, shipping)
  → BUYER accepts/rejects quotation
  → ADMIN creates PROFORMA INVOICE (optional, from accepted quotation)
  → ADMIN converts quotation → ORDER
  → ADMIN creates INVOICE (from order)
  → ADMIN records PAYMENT (against invoice, updates balance)
  → ADMIN dispatches ORDER (adds tracking info)
  → ADMIN generates monthly STATEMENT (per buyer, with aging)
```

---

## Auto-Generated IDs

| Module | Prefix | Format | Example |
|--------|--------|--------|---------|
| User (Buyer) | USR- | USR-00001 | USR-00042 |
| User (Admin) | ADM- | ADM-00001 | ADM-00003 |
| Category | CAT- | CAT-001 | CAT-015 |
| Product | PRD- | PRD-00001 | PRD-00128 |
| Brand | BRD- | BRD-001 | BRD-007 |
| Purchase Order | PO- | PO-00001 | PO-00055 |
| Quotation | QT- | QT-00001 | QT-00033 |
| Order | ORD- | ORD-00001 | ORD-00021 |
| Proforma Invoice | PI- | PI-00001 | PI-00010 |
| Invoice | INV- | INV-00001 | INV-00045 |
| Payment | PAY- | PAY-00001 | PAY-00078 |
| Statement | STM- | STM-00001 | STM-00012 |

---

## API Endpoints

### Health Check
```
GET /api/health → { status: "success", message: "KB CRM API is running" }
```

---

### Auth (`/api/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | Public | Register new buyer |
| POST | `/login` | Public | Login (returns JWT) |
| POST | `/forgot-password` | Public | Send reset token |
| POST | `/reset-password/:token` | Public | Reset password with token |
| POST | `/logout` | Protected | Logout (placeholder) |
| GET | `/me` | Protected | Get current user profile |

---

### Users (`/api/users`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | manage_users | Get all users (paginated, searchable) |
| GET | `/buyers` | manage_users | Get all buyers |
| GET | `/sub-admins` | SUPER_ADMIN | Get all sub-admins |
| GET | `/:id` | manage_users | Get user by ID |
| POST | `/` | manage_users | Create buyer account |
| POST | `/sub-admin` | SUPER_ADMIN | Create sub-admin with permissions |
| PUT | `/:id` | manage_users | Update user details |
| PUT | `/:id/permissions` | SUPER_ADMIN | Update sub-admin permissions |
| DELETE | `/:id` | manage_users | Soft delete user |
| PUT | `/:id/activate` | manage_users | Activate user |
| PUT | `/:id/deactivate` | manage_users | Deactivate user |

---

### Products (`/api/products`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Public | Get all products (paginated, filtered). Pricing hidden from buyers. |
| GET | `/search` | Public | Search products by keyword |
| GET | `/category/:categoryId` | Public | Get products by category |
| GET | `/brand/:brand` | Public | Get products by brand |
| GET | `/:id` | Public | Get product by ID |
| POST | `/` | manage_products | Create product |
| PUT | `/:id` | manage_products | Update product |
| DELETE | `/:id` | manage_products | Hard delete product (permanent) |
| PUT | `/:id/inventory` | manage_products | Update stock/locations |
| POST | `/:id/images` | manage_products | Upload additional images (Cloudinary) |
| PUT | `/:id/main-image` | manage_products | Update main image |
| DELETE | `/:id/images/:imageId` | manage_products | Delete a product image |

---

### Categories (`/api/categories`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Public | Get all active categories |
| GET | `/:id` | Public | Get category by ID |
| POST | `/` | manage_products | Create category (with icon upload) |
| PUT | `/:id` | manage_products | Update category (replace icon) |
| DELETE | `/:id` | manage_products | Soft delete category |
| POST | `/:id/sub-categories` | manage_products | Add sub-category |
| PUT | `/:id/sub-categories/:subId` | manage_products | Update sub-category |
| DELETE | `/:id/sub-categories/:subId` | manage_products | Remove sub-category |

---

### Brands (`/api/brands`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Public | Get all active brands |
| GET | `/:id` | Public | Get brand by ID |
| POST | `/` | manage_products | Create brand (with logo upload) |
| PUT | `/:id` | manage_products | Update brand (replace logo) |
| DELETE | `/:id` | manage_products | Soft delete brand |

---

### Cart (`/api/carts`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Protected | Get my cart (populated product details) |
| POST | `/items` | Protected | Add item to cart (increments if exists) |
| PUT | `/items/:itemId` | Protected | Update item quantity |
| DELETE | `/items/:itemId` | Protected | Remove item from cart |
| DELETE | `/` | Protected | Clear entire cart |
| POST | `/checkout` | Protected | Checkout → creates Purchase Order, clears cart |

---

### Purchase Orders (`/api/purchase-orders`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/my` | Protected | Get my purchase orders |
| POST | `/` | Protected | Create PO (product + qty only, no pricing) |
| PUT | `/:id` | Protected | Update PO (PENDING only, buyer own) |
| PUT | `/:id/cancel` | Protected | Cancel PO (buyer own) |
| GET | `/` | manage_orders | Get all POs (paginated) |
| GET | `/:id` | Protected | Get PO by ID (buyer own + admin any) |
| PUT | `/:id/reject` | manage_orders | Reject PO |
| POST | `/:id/convert-to-quotation` | manage_orders | Mark PO for quotation |

---

### Quotations (`/api/quotations`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/my` | Protected | Get my quotations (buyer) |
| PUT | `/:id/accept` | Protected | Accept quotation (buyer) |
| PUT | `/:id/reject` | Protected | Reject quotation (buyer) |
| GET | `/` | manage_quotes | Get all quotations (admin) |
| POST | `/` | manage_quotes | Create quotation from PO (admin sets pricing) |
| PUT | `/:id` | manage_quotes | Update quotation (PENDING only) |
| POST | `/:id/convert-to-proforma` | manage_quotes | Guide to create proforma |
| POST | `/:id/convert-to-order` | manage_quotes | Mark as converted |
| GET | `/:id/pdf` | Protected | Download quotation PDF |
| GET | `/:id` | Protected | Get quotation by ID (buyer own + admin any) |

**Create quotation body:**
```json
{
  "purchase_order": "po_object_id",
  "items": [
    { "product": "product_id", "quantity": 5, "unit_price": 120.50 }
  ],
  "tax": 50,
  "shipping": 25,
  "expiry_date": "2026-03-01",
  "internal_notes": "Priority customer"
}
```

---

### Orders (`/api/orders`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/my` | Protected | Get my orders (buyer) |
| GET | `/` | manage_orders | Get all orders (paginated, filterable) |
| GET | `/open` | manage_orders | Get open orders (OPEN + PROCESSING) |
| GET | `/dispatched` | manage_orders | Get dispatched orders |
| POST | `/` | manage_orders | Create order from quotation |
| PUT | `/:id` | manage_orders | Update order notes/address |
| PUT | `/:id/status` | manage_orders | Update order status |
| PUT | `/:id/dispatch` | manage_dispatch | Dispatch order (add tracking) |
| PUT | `/:id/dispatch-info` | manage_dispatch | Update dispatch tracking |
| POST | `/:id/payment` | manage_payments | Record payment against order |
| GET | `/:id` | Protected | Get order by ID (buyer own + admin any) |

**Order statuses:** `OPEN` → `PROCESSING` → `DISPATCHED` → `DELIVERED` / `CANCELLED`
**Payment statuses:** `UNPAID` → `PARTIAL` → `PAID`

---

### Proforma Invoices (`/api/proforma-invoices`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/my` | Protected | Get my proformas (buyer) |
| GET | `/` | manage_quotes | Get all proformas (admin) |
| POST | `/` | manage_quotes | Create proforma from accepted quotation |
| PUT | `/:id` | manage_quotes | Update proforma (PENDING only) |
| PUT | `/:id/approve` | manage_quotes | Approve proforma |
| PUT | `/:id/reject` | manage_quotes | Reject proforma |
| POST | `/:id/convert-to-order` | manage_quotes | Guide to create order |
| GET | `/:id` | Protected | Get proforma by ID (buyer own + admin any) |

---

### Invoices (`/api/invoices`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/my` | Protected | Get my invoices (buyer) |
| GET | `/` | manage_invoices | Get all invoices (admin) |
| POST | `/` | manage_invoices | Create invoice from order |
| POST | `/manual` | manage_invoices | Create manual invoice (not from order) |
| PUT | `/:id` | manage_invoices | Update invoice (due_date, notes, address) |
| PUT | `/:id/status` | manage_invoices | Update invoice status |
| GET | `/:id` | Protected | Get invoice by ID (buyer own + admin any) |
| GET | `/:id/pdf` | Protected | Download invoice PDF |

**Invoice statuses:** `UNPAID` → `PARTIAL` → `PAID` / `OVERDUE`

---

### Payments (`/api/payments`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/my` | Protected | Get my payments (buyer) |
| GET | `/` | manage_payments | Get all payments (admin) |
| GET | `/pending` | manage_payments | Get pending payments |
| GET | `/customer/:customerId` | manage_payments | Get payments by customer |
| POST | `/` | manage_payments | Record payment against invoice (auto-updates balance) |
| PUT | `/:id` | manage_payments | Update payment details |
| PUT | `/:id/status` | manage_payments | Update status (refund reverses balance) |
| GET | `/:id` | Protected | Get payment by ID (buyer own + admin any) |

**Payment methods:** `Credit Card`, `Wire Transfer`, `Check`, `UPI`, `BANK_TRANSFER`
**Payment statuses:** `PENDING` → `COMPLETED` / `FAILED` / `REFUNDED`
**Currencies:** `USD`, `INR`

---

### Statements (`/api/statements`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/my` | Protected | Get my statements (buyer) |
| GET | `/` | manage_invoices | Get all statements (admin) |
| GET | `/transactions` | manage_invoices | Get all transactions (invoices + payments) |
| GET | `/transactions/by-month?year=2026&month=1` | manage_invoices | Monthly transactions |
| GET | `/transactions/by-buyer/:buyerId` | manage_invoices | Buyer's transactions |
| POST | `/generate` | manage_invoices | Generate statement for buyer + period |
| GET | `/customer/:customerId` | manage_invoices | Get statements by customer |
| GET | `/:id/pdf` | Protected | Download statement PDF |

**Statement generation** calculates: opening balance, total charges, total payments, closing balance, and aging buckets (current, 30, 60, 90 days).

---

### Settings (`/api/settings`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | SUPER_ADMIN | Get all settings |
| GET | `/category/:category` | SUPER_ADMIN | Get settings by category |
| GET | `/:key` | SUPER_ADMIN | Get setting by key |
| POST | `/` | SUPER_ADMIN | Create setting |
| PUT | `/bulk` | SUPER_ADMIN | Bulk update settings |
| PUT | `/:key` | SUPER_ADMIN | Update setting by key |
| DELETE | `/:key` | SUPER_ADMIN | Delete setting |

---

### Dashboard (`/api/dashboard`)
All dashboard routes require `view_analytics` permission. SUPER_ADMIN auto-passes.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/summary` | Counts: total/open/dispatched orders, buyers, products, pending POs/quotations, revenue, unpaid invoices |
| GET | `/sales-overview?year=2026` | Monthly order totals for the year (12 months) |
| GET | `/recent-orders?limit=10` | Latest orders with buyer + status |
| GET | `/pending-payments?limit=10` | Unpaid/partial/overdue invoices sorted by due date |
| GET | `/inventory-alerts?threshold=10` | Out-of-stock or low-stock products |
| GET | `/top-products?limit=10` | Most ordered products (by quantity, with revenue) |
| GET | `/top-buyers?limit=10` | Highest-spending buyers |
| GET | `/order-status-breakdown` | Count of orders per status |
| GET | `/revenue-by-month?year=2026` | Monthly payment totals (completed payments) |

---

## Database Models

| Model | Collection | Auto-ID | Key Fields |
|-------|------------|---------|------------|
| User | users | USR-/ADM- | role, name, email, password, permissions[], address, company_details, is_active |
| Product | products | PRD- | part_number (unique), product_name, category, brand, list_price, your_price, stock_status, image, additional_images |
| Category | categories | CAT- | name (unique), sub_categories[], icon, display_order, is_active |
| Brand | brands | BRD- | name (unique), logo, description, website, is_active |
| Cart | carts | — | user (unique), items[{product, quantity}] |
| PurchaseOrder | purchaseorders | PO- | title, buyer, items[{product, quantity}], status (PENDING/CONVERTED/REJECTED/CANCELLED) |
| Quotation | quotations | QT- | purchase_order, buyer, items[{product, quantity, unit_price, total_price}], subtotal, tax, shipping, total_amount, status |
| Order | orders | ORD- | title, buyer, quotation, items[], subtotal, tax, shipping, total_amount, status, payment_status, dispatch_info |
| ProformaInvoice | proformainvoices | PI- | quotation, buyer, items[], subtotal, tax, shipping, total_amount, valid_until, status |
| Invoice | invoices | INV- | order, buyer, items[], total_amount, amount_paid, balance_due, status, is_manual |
| Payment | payments | PAY- | invoice, buyer, amount, currency, payment_method, transaction_id, status |
| Statement | statements | STM- | buyer, period_start, period_end, opening_balance, closing_balance, transactions[], aging buckets |
| Setting | settings | — | key (unique), value (mixed), category |

---

## Environment Variables

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kb_crm
JWT_SECRET=your_jwt_secret_change_this_in_production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start MongoDB (must be running)
mongod

# Seed SUPER_ADMIN account
npm run seed

# Start development server (with auto-reload)
npm run dev

# Start production server
npm start
```

Server runs at `http://localhost:5000/api`

---

## NPM Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `start` | `node server.js` | Production server |
| `dev` | `nodemon server.js` | Development with auto-reload |
| `seed` | `node src/seeds/seedAdmin.js` | Create SUPER_ADMIN account |
| `test` | `jest` | Run all tests |
| `test:watch` | `jest --watch` | Run tests in watch mode |
| `test:coverage` | `jest --coverage` | Run tests with coverage report |

---

## Testing

### Test Setup

Tests use **Jest** with **MongoDB Memory Server** for isolated database testing. No external MongoDB instance required.

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/integration/auth.test.js

# Run with verbose output
npm test -- --verbose

# Run with coverage report
npm run test:coverage
```

### Test Structure

```
tests/
├── setup.js                          # Jest setup with MongoDB Memory Server
├── fixtures/                         # Test data fixtures
│   ├── users.fixture.js              # Admin, buyer, sub-admin test data
│   ├── products.fixture.js           # Product test data
│   └── orders.fixture.js             # Order test data
├── unit/                             # Unit tests
│   ├── utils/                        # Utility function tests
│   │   ├── AppError.test.js
│   │   ├── apiResponse.test.js
│   │   └── catchAsync.test.js
│   └── models/                       # Model validation tests
│       ├── User.test.js
│       ├── Product.test.js
│       ├── Order.test.js
│       ├── Quotation.test.js
│       ├── Invoice.test.js
│       ├── ProformaInvoice.test.js
│       ├── Dispatch.test.js
│       ├── Cart.test.js
│       └── Payment.test.js
└── integration/                      # API integration tests
    ├── auth.test.js
    ├── users.test.js
    ├── products.test.js
    ├── orders.test.js
    ├── quotations.test.js
    ├── invoices.test.js
    ├── carts.test.js
    ├── categories.test.js
    ├── brands.test.js
    └── ... (all API modules)
```

### Current Test Status

| Category | Tests | Status |
|----------|-------|--------|
| Unit Tests (Utils) | 26 | ✅ Passing |
| Unit Tests (Models) | 290+ | ✅ Passing |
| Integration Tests | 568+ | ⚠️ 95.5% Passing |
| **Total** | **884+** | **95.5%** |

### Known Test Issues

See `tests/TEST_FAILURES_TO_FIX.md` for documentation of remaining test failures and their solutions.

**Common issues:**
- Email service calls in test environment (requires mocking)
- Some integration tests need additional fixture setup

### Writing Tests

**Unit Test Example:**
```javascript
import AppError from '../../src/utils/AppError.js';

describe('AppError', () => {
  it('should create error with status code', () => {
    const error = new AppError('Not found', 404);
    expect(error.message).toBe('Not found');
    expect(error.statusCode).toBe(404);
  });
});
```

**Integration Test Example:**
```javascript
import request from 'supertest';
import app from '../../app.js';
import User from '../../src/modules/users/users.model.js';
import { validAdmin } from '../fixtures/users.fixture.js';

describe('Auth API', () => {
  it('should login with valid credentials', async () => {
    await User.create(validAdmin);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validAdmin.email, password: validAdmin.password });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });
});
```

---

## Response Formats

### Success
```json
{ "status": "success", "message": "Users fetched", "data": { ... } }
```

### Error
```json
{ "status": "fail", "message": "User not found" }
```

### Paginated
```json
{
  "status": "success",
  "message": "Success",
  "data": [...],
  "pagination": { "page": 1, "limit": 10, "total": 50, "totalPages": 5 }
}
```

---

## Implementation Status

| Component | Status |
|-----------|--------|
| Server entry (server.js) | **Done** |
| Express app (app.js) | **Done** |
| Config (env, db, cloudinary) | **Done** |
| Constants (roles, permissions, statuses) | **Done** |
| Error handling (AppError, catchAsync, errorMiddleware) | **Done** |
| API response helpers | **Done** |
| Route aggregator | **Done** |
| Health check endpoint | **Done** |
| Auth middleware (protect, authorize, checkPermission) | **Done** |
| Upload middleware (multer + cloudinary) | **Done** |
| Seed script (SUPER_ADMIN) | **Done** |
| Auth module (model + controller + routes) | **Done** |
| User module (model + controller + routes) | **Done** |
| Product module (model + controller + routes) | **Done** |
| Category module (model + controller + routes) | **Done** |
| Brand module (model + controller + routes) | **Done** |
| Cart module (model + controller + routes) | **Done** |
| Purchase Order module (model + controller + routes) | **Done** |
| Quotation module (model + controller + routes) | **Done** |
| Order module (model + controller + routes) | **Done** |
| Proforma Invoice module (model + controller + routes) | **Done** |
| Invoice module (model + controller + routes) | **Done** |
| Payment module (model + controller + routes) | **Done** |
| Statement module (model + controller + routes) | **Done** |
| Settings module (model + controller + routes) | **Done** |
| PDF generation (invoices, quotations, statements) | **Done** |
| Dashboard analytics (9 endpoints) | **Done** |
| Payment Records module | **Done** |
| Notification counts support | **Done** |

---

## Recent Updates

### Version 2.4 Features (Latest)

**Product Management Updates**
1. **Hard Delete** - Products are permanently removed from database (no soft delete)
2. **Cloudinary Cleanup** - Product images automatically deleted from Cloudinary on product deletion
3. **Simplified Filtering** - Removed `is_active` field filtering from all product endpoints
4. **Unified API** - Both admin and buyer see the same products from database
5. **Bulk Insert Script** - `scripts/bulkInsertProducts.js` for bulk product import
6. **Image Update Script** - `scripts/updateProductImages.js` for batch image updates

**API Changes**
```
DELETE /api/products/:id
  - Now permanently deletes product from database
  - Deletes main image and all additional images from Cloudinary
  - Returns 404 if product not found

GET /api/products
  - Returns ALL products (no is_active filtering)
  - Admin sees pricing fields (list_price, your_price, discount_percentage)
  - Buyers see products without pricing fields
```

**Scripts Added**
```bash
# Bulk insert products from JSON
node scripts/bulkInsertProducts.js

# Bulk update product images
node scripts/updateProductImages.js

# Check product status in database
node scripts/checkProducts.js
```

### Version 2.3 Features

**Payment Records Enhancement**
1. **PI Exchange Rate** - Payment verification uses PI's stored exchange rate
2. **Populate Exchange Rate** - All payment record queries include PI's exchange_rate field
3. **Consistent Rate Handling** - `finalExchangeRate` always derived from PI, not user input

**Invoice Model Updates**
1. **Dispatch Info** - Invoice stores dispatch details (courier, tracking, AWB)
2. **HSN Code** - HSN/SAC code field for tax compliance
3. **Shipping By** - Carrier/courier information
4. **Exchange Rate** - Per-invoice exchange rate for conversions

**Notification Support**
1. **Pending Endpoints** - `/orders/pending` and `/payment-records/pending` return items with timestamps
2. **updatedAt Tracking** - All models include updatedAt for status change detection
3. **Buyer Endpoints** - `/quotations/my`, `/proforma-invoices/my`, `/orders/my` include timestamps

### API Changes

**Payment Records**
```
GET /api/payment-records/pending
  - Returns pending payments with PI exchange_rate populated
  - Response includes updatedAt for notification tracking

PUT /api/payment-records/:id/verify
  - Uses PI's exchange_rate (no longer accepts payment_exchange_rate)
  - finalExchangeRate = proformaInvoice.exchange_rate || 83.5
```

**Invoice Generation from Dispatch**
```
POST /api/invoices/from-dispatch
  Body: {
    proforma_invoice_id: "pi_id",
    items: [...],
    dispatch_info: {
      dispatch_date: "2026-02-18",
      courier_service: "FedEx",
      tracking_number: "FX123456789",
      awb_number: "AWB123456",
      shipping_by: "FedEx Express"
    },
    hsn_code: "84733020",
    custom_invoice_number: "INV-2602-00001",
    exchange_rate: 83.5
  }
```

### Data Schema Updates

**Invoice Schema Additions**
```javascript
{
  // Dispatch/Shipping Info
  dispatch_info: {
    dispatch_date: Date,
    courier_service: String,
    tracking_number: String,
    awb_number: String,
    shipping_by: String
  },
  hsn_code: String,        // HSN/SAC code
  awb_number: String,      // Air Waybill number
  shipping_by: String,     // Courier/Carrier name

  // Existing fields
  invoice_number: String,
  invoice_type: String,    // TAX_INVOICE, REIMBURSEMENT, BILL_OF_SUPPLY
  proforma_invoice: ObjectId,
  buyer: ObjectId,
  items: Array,
  total_amount: Number,
  exchange_rate: Number,
  status: String           // PAID, UNPAID, PARTIAL, CANCELLED
}
```

**Payment Record Schema**
```javascript
{
  proforma_invoice: {
    ref: 'ProformaInvoice',
    populate: ['proforma_number', 'total_amount', 'payment_received', 'exchange_rate']
  },
  // Payment uses PI's exchange_rate for INR conversion
}
```
