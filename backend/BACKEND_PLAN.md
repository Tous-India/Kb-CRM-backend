# KB CRM Backend Implementation Plan

## Overview

This document outlines the complete backend architecture and implementation plan for the KB CRM application. The backend will be built using **Node.js + Express.js** with **MongoDB** as the database.

---

## Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js 5.x
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **File Upload**: multer
- **Validation**: express-validator / Joi
- **CORS**: cors middleware
- **Environment**: dotenv

---

## Project Structure

```
test-backend/
├── server.js                    # Entry point
├── package.json
├── .env                         # Environment variables
├── .env.example
├── src/
│   ├── app.js                   # Express app configuration
│   ├── config/
│   │   ├── database.js          # MongoDB connection
│   │   ├── environment.js       # Environment config
│   │   └── constants.js         # App constants
│   │
│   ├── models/                  # Mongoose schemas
│   │   ├── User.js              # Admin & Buyer users
│   │   ├── Product.js
│   │   ├── Category.js
│   │   ├── Brand.js
│   │   ├── Order.js
│   │   ├── Invoice.js
│   │   ├── ProformaInvoice.js
│   │   ├── Quotation.js
│   │   ├── Payment.js
│   │   ├── Statement.js
│   │   └── Transaction.js
│   │
│   ├── routes/                  # API routes
│   │   ├── index.js             # Route aggregator
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── productRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── brandRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── invoiceRoutes.js
│   │   ├── proformaRoutes.js
│   │   ├── quotationRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── statementRoutes.js
│   │   └── dashboardRoutes.js
│   │
│   ├── controllers/             # Route handlers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── productController.js
│   │   ├── categoryController.js
│   │   ├── brandController.js
│   │   ├── orderController.js
│   │   ├── invoiceController.js
│   │   ├── proformaController.js
│   │   ├── quotationController.js
│   │   ├── paymentController.js
│   │   ├── statementController.js
│   │   └── dashboardController.js
│   │
│   ├── middlewares/
│   │   ├── authMiddleware.js    # JWT verification
│   │   ├── roleMiddleware.js    # Role-based access (SUPER_ADMIN / SUB_ADMIN / BUYER)
│   │   ├── permissionMiddleware.js # Granular permission check for SUB_ADMIN
│   │   ├── errorMiddleware.js   # Global error handler
│   │   └── uploadMiddleware.js  # File upload handling
│   │
│   ├── utils/
│   │   ├── AppError.js          # Custom error class
│   │   ├── catchAsync.js        # Async error wrapper
│   │   ├── generateId.js        # ID generation
│   │   ├── pdfGenerator.js      # PDF generation
│   │   └── emailService.js      # Email notifications
│   │
│   └── validators/              # Request validation
│       ├── authValidator.js
│       ├── userValidator.js
│       ├── productValidator.js
│       ├── orderValidator.js
│       └── paymentValidator.js
│
├── uploads/                     # File uploads directory
│   ├── products/
│   └── documents/
│
└── logs/                        # Application logs
```

---

## Database Models (Mongoose Schemas)

### 1. User Model
```javascript
{
  user_id: String (unique, auto-generated),
  role: { type: String, enum: ['SUPER_ADMIN', 'SUB_ADMIN', 'BUYER'] },
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String
  },
  company_details: {
    company_name: String,
    tax_id: String,
    phone: String,
    billing_email: String
  },
  permissions: [String],        // For SUB_ADMIN: subset of ['manage_users', 'manage_orders', 'manage_products', 'view_analytics', 'manage_quotes', 'manage_payments', 'manage_invoices', 'manage_dispatch']
                                // SUPER_ADMIN has ALL permissions by default
                                // BUYER has no admin permissions
  status_quote: Boolean,        // For buyers
  payment_status: String,       // For buyers
  current_orders: [ObjectId],   // Reference to Orders
  is_active: Boolean,
  created_at: Date,
  last_login: Date
}
```

### 2. Product Model
```javascript
{
  product_id: String (unique),
  part_number: String,
  oem_part: String,
  product_name: String,
  category: String,
  sub_category: String,
  brand: String,
  description: String,
  list_price: Number,           // ADMIN-ONLY: hidden from buyer API responses
  your_price: Number,           // ADMIN-ONLY: hidden from buyer API responses
  discount_percentage: Number,  // ADMIN-ONLY: hidden from buyer API responses
  stock_status: String,
  available_locations: [{
    location: String,
    quantity: Number
  }],
  total_quantity: Number,
  image_url: String,
  additional_images: [String],
  specifications: Object,
  manufacturer: String,
  is_active: Boolean,
  created_at: Date,
  updated_at: Date
}
```

### 3. Category Model
```javascript
{
  category_id: String (unique),
  name: String,
  description: String,
  sub_categories: [{
    sub_category_id: String,
    name: String,
    description: String
  }],
  icon: String,
  display_order: Number,
  is_active: Boolean
}
```

### 4. Brand Model
```javascript
{
  brand_id: String (unique),
  name: String,
  logo_url: String,
  description: String,
  website: String,
  is_active: Boolean
}
```

### 5. Order Model
```javascript
{
  order_id: String (unique),
  title: String,                // Purchase order title set by buyer (e.g. "Q1 Parts Restock")
  customer_id: ObjectId (ref: User),
  order_date: Date,
  status: { type: String, enum: ['OPEN', 'DISPATCHED', 'DELIVERED', 'CANCELLED'] },
  payment_status: { type: String, enum: ['UNPAID', 'PARTIAL', 'PAID'] },
  payment_received: Number,
  payment_history: [{
    payment_id: String,
    amount: Number,
    currency: { type: String, enum: ['USD', 'INR'] },
    amount_usd: Number,
    payment_method: String,
    transaction_id: String,
    payment_date: Date,
    notes: String,
    recorded_at: Date
  }],
  items: [{
    product_id: ObjectId (ref: Product),
    part_number: String,
    product_name: String,
    quantity: Number,
    unit_price: Number,
    total_price: Number,
    has_inventory: Boolean,
    inventory_quantity: Number
  }],
  subtotal: Number,
  tax: Number,
  shipping: Number,
  total_amount: Number,
  shipping_address: Object,
  dispatch_info: {
    dispatch_date: Date,
    courier_service: String,
    tracking_number: String,
    dispatch_notes: String
  },
  notes: String,
  estimated_delivery: Date,
  created_at: Date,
  updated_at: Date
}
```

### 6. Invoice Model
```javascript
{
  invoice_id: String (unique),
  invoice_number: String,
  order_id: ObjectId (ref: Order),
  customer_id: ObjectId (ref: User),
  invoice_date: Date,
  due_date: Date,
  status: { type: String, enum: ['UNPAID', 'PAID', 'PARTIAL', 'OVERDUE'] },
  payment_date: Date,
  items: [{
    product_id: ObjectId,
    part_number: String,
    product_name: String,
    quantity: Number,
    unit_price: Number,
    total_price: Number
  }],
  subtotal: Number,
  tax: Number,
  shipping: Number,
  total_amount: Number,
  amount_paid: Number,
  balance_due: Number,
  payment_method: String,
  billing_address: Object,
  notes: String,
  created_at: Date
}
```

### 7. Proforma Invoice Model
```javascript
{
  performa_invoice_id: String (unique),
  performa_invoice_number: String,
  quotation_id: ObjectId (ref: Quotation),
  customer_id: ObjectId (ref: User),
  customer_name: String,
  issue_date: Date,
  valid_until: Date,
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'] },
  items: [{
    product_id: ObjectId,
    part_number: String,
    product_name: String,
    quantity: Number,
    unit_price: Number,
    total_price: Number
  }],
  subtotal: Number,
  tax: Number,
  shipping: Number,
  total_amount: Number,
  billing_address: Object,
  shipping_address: Object,
  payment_terms: String,
  notes: String,
  created_by: String,
  approved_date: Date,
  created_at: Date
}
```

### 8. Quotation Model
```javascript
{
  quote_id: String (unique),
  quote_number: String,
  customer_id: ObjectId (ref: User),
  quote_date: Date,
  expiry_date: Date,
  status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'PAID', 'EXPIRED'] },
  converted_to_order_id: ObjectId (ref: Order),
  items: [{
    product_id: ObjectId,
    part_number: String,
    product_name: String,
    quantity: Number,
    unit_price: Number,
    total_price: Number
  }],
  subtotal: Number,
  tax: Number,
  shipping: Number,
  total_amount: Number,
  customer_notes: String,
  internal_notes: String,
  created_by: String,
  accepted_date: Date,
  created_at: Date
}
```

### 9. Payment Model
```javascript
{
  payment_id: String (unique),
  invoice_id: ObjectId (ref: Invoice),
  invoice_number: String,
  customer_id: ObjectId (ref: User),
  customer_name: String,
  payment_date: Date,
  amount: Number,
  payment_method: { type: String, enum: ['Credit Card', 'Wire Transfer', 'Check', 'UPI', 'BANK_TRANSFER'] },
  transaction_id: String,
  status: { type: String, enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'] },
  notes: String,
  created_at: Date
}
```

### 10. Statement Model
```javascript
{
  statement_id: String (unique),
  customer_id: ObjectId (ref: User),
  statement_date: Date,
  period_start: Date,
  period_end: Date,
  opening_balance: Number,
  total_charges: Number,
  total_payments: Number,
  closing_balance: Number,
  current_due: Number,
  past_due_30: Number,
  past_due_60: Number,
  past_due_90: Number,
  transactions: [{
    date: Date,
    type: { type: String, enum: ['INVOICE', 'PAYMENT', 'CREDIT', 'DEBIT'] },
    reference: String,
    description: String,
    charges: Number,
    payments: Number,
    balance: Number
  }],
  created_at: Date
}
```

---

## API Endpoints

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user (buyer) |
| POST | `/login` | Login user |
| POST | `/logout` | Logout user |
| POST | `/forgot-password` | Request password reset |
| POST | `/reset-password/:token` | Reset password |
| GET | `/me` | Get current user profile |
| PUT | `/update-password` | Update password |

### User Routes (`/api/users`) - Super Admin / Sub-Admin (with permissions)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all users (with filters) |
| GET | `/buyers` | Get all buyers |
| GET | `/admins` | Get all admins & sub-admins |
| GET | `/sub-admins` | Get all sub-admins (Super Admin only) |
| GET | `/:id` | Get user by ID |
| POST | `/` | Create new user (buyer) |
| POST | `/sub-admin` | Create sub-admin with permissions (Super Admin only) |
| PUT | `/:id` | Update user |
| PUT | `/:id/permissions` | Update sub-admin permissions (Super Admin only) |
| DELETE | `/:id` | Delete user (soft delete) |
| PUT | `/:id/activate` | Activate user |
| PUT | `/:id/deactivate` | Deactivate user |

### Product Routes (`/api/products`)
> **Note**: Buyer API responses exclude pricing fields (`list_price`, `your_price`, `discount_percentage`). Buyers see the product catalog without prices. Admin sets pricing in the quotation stage.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all products (with filters, pagination) |
| GET | `/:id` | Get product by ID |
| POST | `/` | Create product (Admin) |
| PUT | `/:id` | Update product (Admin) |
| DELETE | `/:id` | Delete product (Admin) |
| POST | `/:id/images` | Upload product images (Admin) |
| DELETE | `/:id/images/:imageId` | Delete product image (Admin) |
| PUT | `/:id/inventory` | Update inventory (Admin) |
| GET | `/search` | Search products |
| GET | `/category/:categoryId` | Get products by category |
| GET | `/brand/:brandId` | Get products by brand |

### Category Routes (`/api/categories`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all categories |
| GET | `/:id` | Get category by ID |
| POST | `/` | Create category (Admin) |
| PUT | `/:id` | Update category (Admin) |
| DELETE | `/:id` | Delete category (Admin) |
| POST | `/:id/subcategories` | Add subcategory (Admin) |
| PUT | `/:id/subcategories/:subId` | Update subcategory (Admin) |
| DELETE | `/:id/subcategories/:subId` | Delete subcategory (Admin) |

### Brand Routes (`/api/brands`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all brands |
| GET | `/:id` | Get brand by ID |
| POST | `/` | Create brand (Admin) |
| PUT | `/:id` | Update brand (Admin) |
| DELETE | `/:id` | Delete brand (Admin) |

### Order Routes (`/api/orders`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all orders (Admin) |
| GET | `/my-orders` | Get buyer's orders |
| GET | `/open` | Get open orders (Admin) |
| GET | `/dispatched` | Get dispatched orders (Admin) |
| GET | `/:id` | Get order by ID |
| POST | `/` | Create order |
| PUT | `/:id` | Update order (Admin) |
| PUT | `/:id/dispatch` | Dispatch order (Admin) |
| PUT | `/:id/dispatch-info` | Update dispatch info (Admin) |
| PUT | `/:id/status` | Update order status (Admin) |
| POST | `/:id/payment` | Record payment (Admin) |
| DELETE | `/:id` | Cancel order |

### Invoice Routes (`/api/invoices`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all invoices (Admin) |
| GET | `/my-invoices` | Get buyer's invoices |
| GET | `/:id` | Get invoice by ID |
| POST | `/` | Create invoice (Admin) |
| POST | `/manual` | Create manual invoice (Admin) |
| PUT | `/:id` | Update invoice (Admin) |
| PUT | `/:id/status` | Update invoice status (Admin) |
| GET | `/:id/pdf` | Download invoice PDF |
| POST | `/:id/send` | Email invoice to customer |

### Proforma Invoice Routes (`/api/proforma-invoices`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all proforma invoices (Admin) |
| GET | `/:id` | Get proforma invoice by ID |
| POST | `/` | Create proforma invoice (Admin) |
| PUT | `/:id` | Update proforma invoice (Admin) |
| PUT | `/:id/approve` | Approve proforma (Admin) |
| PUT | `/:id/reject` | Reject proforma (Admin) |
| POST | `/:id/convert-to-order` | Convert to order (Admin) |
| GET | `/:id/pdf` | Download proforma PDF |

### Quotation Routes (`/api/quotations`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all quotations (Admin) |
| GET | `/my-quotations` | Get buyer's quotations |
| GET | `/:id` | Get quotation by ID |
| POST | `/` | Create quotation |
| PUT | `/:id` | Update quotation (Admin) |
| PUT | `/:id/accept` | Accept quotation |
| PUT | `/:id/reject` | Reject quotation |
| POST | `/:id/convert-to-proforma` | Create proforma from quote (Admin) |
| POST | `/:id/convert-to-order` | Convert to order (Admin) |
| GET | `/:id/pdf` | Download quotation PDF |

### Payment Routes (`/api/payments`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all payments (Admin) |
| GET | `/my-payments` | Get buyer's payments |
| GET | `/:id` | Get payment by ID |
| POST | `/` | Record payment (Admin) |
| PUT | `/:id` | Update payment (Admin) |
| PUT | `/:id/status` | Update payment status (Admin) |
| GET | `/pending` | Get pending payments (Admin) |
| GET | `/by-customer/:customerId` | Get payments by customer |

### Statement Routes (`/api/statements`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all statements (Admin) |
| GET | `/my-statement` | Get buyer's statement |
| GET | `/:customerId` | Get statement by customer (Admin) |
| GET | `/transactions` | Get all transactions (Admin) |
| GET | `/transactions/by-month` | Get transactions by month |
| GET | `/transactions/by-buyer/:buyerId` | Get transactions by buyer |
| POST | `/generate` | Generate statement (Admin) |
| GET | `/:id/pdf` | Download statement PDF |

### Dashboard Routes (`/api/dashboard`) - Super Admin / Sub-Admin (with `view_analytics` permission)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/summary` | Get dashboard summary |
| GET | `/sales-overview` | Get sales overview |
| GET | `/recent-orders` | Get recent orders |
| GET | `/pending-payments` | Get pending payments |
| GET | `/inventory-alerts` | Get low inventory alerts |
| GET | `/top-products` | Get top selling products |
| GET | `/top-buyers` | Get top buyers |

---

## Implementation Phases

### Phase 1: Core Setup & Authentication
1. Project structure setup
2. MongoDB connection configuration
3. User model implementation
4. Authentication system (JWT)
5. Auth routes & controllers
6. Middleware (auth, roles, error handling)

### Phase 2: Product Management
1. Product model
2. Category model
3. Brand model
4. Product CRUD operations
5. Image upload functionality
6. Product search & filters

### Phase 3: Order Management
1. Order model
2. Order creation & management
3. Payment tracking
4. Dispatch functionality
5. Order status updates
6. Payment history tracking

### Phase 4: Invoicing
1. Invoice model
2. Invoice generation
3. Manual invoice creation
4. Proforma invoice model
5. Quotation model
6. Quote to Order conversion flow

### Phase 5: Financial Management
1. Payment model
2. Payment recording & tracking
3. Statement model
4. Transaction tracking
5. Statement generation
6. PDF generation

### Phase 6: Dashboard & Reports
1. Dashboard analytics
2. Sales reports
3. Inventory alerts
4. Export functionality

---

## Business Logic & Workflows

### 1. Advance Payment Order Flow
```
Quotation → Proforma Invoice → Buyer Approval → Payment → Order Created → Dispatch
```

1. Admin creates quotation for buyer
2. Convert quotation to proforma invoice
3. Buyer reviews and approves proforma
4. Buyer makes advance payment
5. Admin records payment and creates order
6. Order status changes based on payment:
   - Full payment → PAID status
   - Partial payment → PARTIAL status
7. Admin dispatches order (only when payment received)
8. Order status changes to DISPATCHED
9. Dispatch info can be updated later

### 2. Payment Recording
- Support USD and INR currencies
- Auto-convert INR to USD using exchange rate
- Track multiple payments per order
- Calculate remaining balance
- Update order payment status automatically

### 3. Statement Generation
- Auto-generate monthly statements
- Track all transactions (invoices, payments)
- Calculate opening/closing balance
- Track aging (30/60/90 days overdue)
- Filter by buyer and month

### 4. Inventory Management
- Track stock by location
- Auto-update on order dispatch (not on order creation)
- Low stock alerts
- Stock status calculation
- **No stock validation on purchase order / order creation** — buyers can order out-of-stock products

### 5. Pricing Visibility
- Product prices (`list_price`, `your_price`, `discount_percentage`) are **hidden from buyers**
- Buyer API responses return product catalog without any pricing
- Buyers submit purchase orders with product + quantity only
- Admin sets pricing when creating the quotation from the purchase order
- Pricing is visible only to SUPER_ADMIN and SUB_ADMIN (with `manage_products` or `manage_quotes` permission)

### 6. Out-of-Stock Ordering
- Buyers **can** raise purchase orders for products that are out of stock
- No stock validation is enforced at PO or order creation time
- Admin handles sourcing and procurement separately
- Inventory is tracked for admin visibility but does not block orders

### 7. Sub-Admin Management
- **SUPER_ADMIN** can create SUB_ADMIN accounts with selective permissions
- Available permissions:
  - `manage_users` — View/create/edit buyers
  - `manage_orders` — View/process/dispatch orders
  - `manage_products` — Add/edit/delete products, categories, brands
  - `view_analytics` — Access dashboard and reports
  - `manage_quotes` — Create/edit quotations and proforma invoices
  - `manage_payments` — Record and manage payments
  - `manage_invoices` — Create/edit invoices (regular + manual)
  - `manage_dispatch` — Dispatch orders and update tracking info
- Permission middleware checks each route against the sub-admin's assigned permissions
- SUPER_ADMIN bypasses all permission checks (full access)
- SUB_ADMIN cannot create other SUB_ADMIN accounts
- Only SUPER_ADMIN can modify SUB_ADMIN permissions

---

## Security Considerations

1. **Authentication**: JWT with refresh tokens
2. **Password**: bcrypt hashing with salt
3. **Authorization**: Role-based access control (SUPER_ADMIN / SUB_ADMIN / BUYER) with granular permissions for SUB_ADMIN
4. **Input Validation**: Sanitize all inputs
5. **Rate Limiting**: Prevent brute force attacks
6. **CORS**: Restrict to allowed origins
7. **Helmet**: Security headers
8. **SQL Injection**: Use parameterized queries (Mongoose)

---

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/kb_crm

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_REFRESH_EXPIRES_IN=30d

# Currency
DEFAULT_CURRENCY=USD
INR_EXCHANGE_RATE=84.0

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Email (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
```

---

## Dependencies

```json
{
  "dependencies": {
    "express": "^5.2.1",
    "mongoose": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express-validator": "^7.0.1",
    "multer": "^1.4.5-lts.1",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "module-alias": "^2.2.3"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

## Getting Started (After Implementation)

```bash
# Install dependencies
npm install

# Create .env file from .env.example
cp .env.example .env

# Start MongoDB (if local)
mongod

# Run in development
npm run dev

# Run in production
npm start
```

---

## API Response Format

### Success Response
```json
{
  "status": "success",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description",
  "code": "ERROR_CODE",
  "errors": [] // Validation errors if any
}
```

### Paginated Response
```json
{
  "status": "success",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

## Next Steps

1. Review this plan
2. Start implementation with Phase 1
3. Test each phase before moving to next
4. Integrate with frontend
5. Deploy to production

---

*Document Version: 1.0*
*Created: January 2026*
