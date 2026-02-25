# KB CRM Backend API

Node.js + Express.js + MongoDB backend for the KB CRM application (Aviation Parts Business).

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime environment |
| Express | 5.x | Web framework (ES Modules) |
| MongoDB | 7.x | NoSQL database |
| Mongoose | 9.x | MongoDB ODM |
| JWT | 9.x | Authentication tokens |
| Multer | 2.x | File uploads (memory storage) |
| Cloudinary | 2.x | Cloud image storage |
| Nodemailer | 7.x | Email service (Gmail SMTP) |
| PDFKit | 0.17.x | PDF generation |
| Joi | 18.x | Request validation |
| Helmet | 8.x | Security headers |
| bcrypt | 6.x | Password hashing |
| Morgan | 1.x | HTTP logging |
| Jest | 30.x | Testing framework |

---

## Project Structure

```
backend/
├── server.js                         # Entry point — connects DB, starts server
├── app.js                            # Express app — middlewares, routes, error handler
├── package.json
├── .env                              # Environment variables (not committed)
├── .env.example                      # Environment template
│
├── src/
│   ├── config/
│   │   ├── index.js                  # Loads .env into clean config object
│   │   ├── db.js                     # MongoDB connection (Mongoose)
│   │   └── cloudinary.js             # Cloudinary v2 config
│   │
│   ├── constants/
│   │   └── index.js                  # All enums — ROLES, PERMISSIONS, ORDER_STATUS,
│   │                                 # PAYMENT_STATUS, INVOICE_STATUS, PO_STATUS,
│   │                                 # QUOTE_STATUS, PROFORMA_STATUS
│   │
│   ├── modules/                      # Feature modules (MVC pattern)
│   │   ├── auth/                     # Authentication
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.routes.js
│   │   │   └── auth.validation.js
│   │   │
│   │   ├── users/                    # User management
│   │   │   ├── users.controller.js
│   │   │   ├── users.routes.js
│   │   │   ├── users.model.js
│   │   │   └── users.validation.js
│   │   │
│   │   ├── products/                 # Product catalog
│   │   ├── categories/               # Product categories
│   │   ├── brands/                   # Product brands
│   │   ├── carts/                    # Shopping cart
│   │   ├── quotations/               # Quotation lifecycle
│   │   ├── proformaInvoices/         # Proforma invoices
│   │   ├── orders/                   # Order management
│   │   ├── invoices/                 # Invoice generation
│   │   ├── dispatches/               # Shipment tracking
│   │   ├── payments/                 # Payment tracking
│   │   ├── paymentRecords/           # Buyer payment submissions
│   │   ├── purchaseOrders/           # Purchase orders
│   │   ├── suppliers/                # Supplier management
│   │   ├── piAllocations/            # PI item allocations
│   │   ├── purchaseDashboard/        # Purchase analytics
│   │   ├── statements/               # Account statements
│   │   ├── dashboard/                # Admin dashboard
│   │   ├── reports/                  # Report generation
│   │   ├── archives/                 # Document archiving
│   │   ├── supplierOrders/           # Supplier orders
│   │   └── settings/                 # App settings
│   │
│   ├── middlewares/
│   │   ├── error.middleware.js       # Global error handler
│   │   ├── auth.middleware.js        # JWT protect, authorize roles, check permissions
│   │   └── upload.middleware.js      # Multer: uploadSingle, uploadMultiple
│   │
│   ├── utils/
│   │   ├── AppError.js               # Custom Error class with statusCode
│   │   ├── catchAsync.js             # Async wrapper (no try/catch needed)
│   │   ├── apiResponse.js            # Standardized responses (success, created, paginated)
│   │   ├── cloudinaryUpload.js       # uploadToCloudinary, deleteFromCloudinary
│   │   ├── emailService.js           # Nodemailer wrapper
│   │   ├── emailTemplates.js         # 15+ HTML email templates
│   │   ├── pdfGenerator.js           # Invoice/quotation PDF generation
│   │   └── reportPdfGenerator.js     # Report PDF generation
│   │
│   └── seeds/
│       └── seedAdmin.js              # Create initial SUPER_ADMIN
│
└── tests/
    ├── setup.js                      # Jest setup with MongoDB Memory Server
    ├── fixtures/                     # Test data fixtures
    ├── unit/                         # Unit tests
    └── integration/                  # API integration tests
```

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the backend root:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/kb-crm

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Cloudinary (Image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Configuration (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
EMAIL_FROM_NAME=KB Enterprises
EMAIL_FROM_ADDRESS=info@kbenterprise.org
ADMIN_NOTIFICATION_EMAIL=admin@kbenterprise.org

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173
```

#### Gmail SMTP Setup
1. Enable 2-Factor Authentication on Gmail account
2. Go to Google Account → Security → App Passwords
3. Generate App Password for "Mail"
4. Use the 16-character password in `SMTP_PASS`

### 3. Seed Admin User

```bash
npm run seed
```

Creates a SUPER_ADMIN user:
- **Email:** `admin@kbenterprise.org`
- **Password:** `Admin@123`

### 4. Start Server

```bash
npm run dev    # Development with nodemon (auto-reload)
npm start      # Production
```

Server runs on `http://localhost:5000`

---

## API Reference

**Base URL:** `http://localhost:5000/api`

### Authentication Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/login` | User login | No |
| POST | `/auth/register/initiate` | Start registration (sends OTP) | No |
| POST | `/auth/register/verify-otp` | Verify email OTP | No |
| POST | `/auth/register/resend-otp` | Resend OTP | No |
| POST | `/auth/register/complete` | Complete registration | No |
| POST | `/auth/forgot-password/initiate` | Start password reset | No |
| POST | `/auth/forgot-password/verify-otp` | Verify reset OTP | No |
| POST | `/auth/forgot-password/reset` | Set new password | No |
| GET | `/auth/profile` | Get current user profile | Yes |
| PUT | `/auth/profile` | Update profile | Yes |

### User Management Endpoints

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/users` | List all users | Yes | Admin |
| GET | `/users/buyers` | List buyers only | Yes | Admin |
| GET | `/users/pending` | List pending approvals | Yes | Admin |
| GET | `/users/:id` | Get user details | Yes | Admin |
| POST | `/users` | Create user | Yes | Super Admin |
| PUT | `/users/:id` | Update user | Yes | Admin |
| DELETE | `/users/:id` | Delete user | Yes | Super Admin |
| POST | `/users/:id/approve` | Approve buyer registration | Yes | Admin |
| POST | `/users/:id/reject` | Reject buyer registration | Yes | Admin |
| PATCH | `/users/:id/toggle-status` | Activate/Deactivate user | Yes | Admin |

### Product Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/products` | List products (with filters) | Yes |
| GET | `/products/:id` | Get product details | Yes |
| POST | `/products` | Create product | Yes (Admin) |
| PUT | `/products/:id` | Update product | Yes (Admin) |
| DELETE | `/products/:id` | Delete product | Yes (Admin) |
| POST | `/products/:id/images` | Upload images | Yes (Admin) |

**Query Parameters:**
- `category` - Filter by category
- `brand` - Filter by brand
- `stock_status` - Filter by stock (In Stock, Low Stock, Out of Stock)
- `search` - Search by name/part number
- `page`, `limit` - Pagination

### Quotation Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/quotations` | List quotations | Yes |
| GET | `/quotations/:id` | Get quotation details | Yes |
| POST | `/quotations` | Create quotation | Yes (Admin) |
| PUT | `/quotations/:id` | Update quotation | Yes (Admin) |
| DELETE | `/quotations/:id` | Delete quotation | Yes (Admin) |
| POST | `/quotations/:id/accept` | Buyer accepts | Yes (Buyer) |
| POST | `/quotations/:id/reject` | Buyer rejects | Yes (Buyer) |
| POST | `/quotations/:id/convert-to-pi` | Convert to PI | Yes (Admin) |
| POST | `/quotations/:id/clone` | Clone quotation | Yes (Admin) |
| POST | `/quotations/:id/renew` | Renew expired/rejected | Yes (Admin) |
| POST | `/quotations/:id/send-email` | Send via email | Yes (Admin) |

**Quotation Statuses:**
| Status | Description |
|--------|-------------|
| `OPEN` | Awaiting buyer response |
| `ACCEPTED` | Buyer accepted |
| `REJECTED` | Buyer rejected |
| `EXPIRED` | Validity expired |
| `CONVERTED` | Converted to PI (frozen) |

### Proforma Invoice Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/proforma-invoices` | List PIs | Yes |
| GET | `/proforma-invoices/:id` | Get PI details | Yes |
| POST | `/proforma-invoices` | Create PI | Yes (Admin) |
| PUT | `/proforma-invoices/:id` | Update PI | Yes (Admin) |
| DELETE | `/proforma-invoices/:id` | Delete PI | Yes (Admin) |
| POST | `/proforma-invoices/:id/convert-to-invoice` | Convert to invoice | Yes (Admin) |
| POST | `/proforma-invoices/:id/send-email` | Send via email | Yes (Admin) |

### Order Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/orders` | List orders | Yes |
| GET | `/orders/:id` | Get order details | Yes |
| POST | `/orders` | Create order | Yes |
| PUT | `/orders/:id` | Update order | Yes (Admin) |
| DELETE | `/orders/:id` | Delete order | Yes (Admin) |
| POST | `/orders/:id/dispatch` | Mark as dispatched | Yes (Admin) |
| POST | `/orders/:id/send-email` | Send via email | Yes (Admin) |

### Invoice Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/invoices` | List invoices | Yes |
| GET | `/invoices/:id` | Get invoice details | Yes |
| POST | `/invoices` | Create invoice | Yes (Admin) |
| POST | `/invoices/manual` | Create manual invoice | Yes (Admin) |
| PUT | `/invoices/:id` | Update invoice | Yes (Admin) |
| DELETE | `/invoices/:id` | Delete invoice | Yes (Admin) |
| PATCH | `/invoices/:id/status` | Update status | Yes (Admin) |
| POST | `/invoices/:id/send-email` | Send via email | Yes (Admin) |

**Invoice Statuses:** `UNPAID`, `PARTIAL`, `PAID`

### Dispatch Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/dispatches` | List dispatches | Yes |
| GET | `/dispatches/:id` | Get dispatch details | Yes |
| POST | `/dispatches` | Create dispatch | Yes (Admin) |
| PUT | `/dispatches/:id` | Update dispatch | Yes (Admin) |
| DELETE | `/dispatches/:id` | Delete dispatch | Yes (Admin) |
| POST | `/dispatches/:id/send-email` | Send notification | Yes (Admin) |

### Payment Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/payments` | List payments | Yes |
| GET | `/payments/:id` | Get payment details | Yes |
| POST | `/payments` | Record payment | Yes (Admin) |
| PUT | `/payments/:id` | Update payment | Yes (Admin) |
| DELETE | `/payments/:id` | Delete payment | Yes (Admin) |

### Supplier Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/suppliers` | List suppliers | Yes (Admin) |
| GET | `/suppliers/:id` | Get supplier details | Yes (Admin) |
| POST | `/suppliers` | Create supplier | Yes (Admin) |
| PUT | `/suppliers/:id` | Update supplier | Yes (Admin) |
| DELETE | `/suppliers/:id` | Delete supplier | Yes (Admin) |
| PATCH | `/suppliers/:id/toggle-status` | Activate/Deactivate | Yes (Admin) |

### PI Allocation Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/pi-allocations/:piId` | Get PI allocations | Yes (Admin) |
| POST | `/pi-allocations/:piId` | Save allocations | Yes (Admin) |
| DELETE | `/pi-allocations/:piId` | Clear allocations | Yes (Admin) |

### Statement Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/statements` | List statements | Yes |
| GET | `/statements/buyer/:buyerId` | Get buyer statement | Yes |
| POST | `/statements/generate` | Generate statement | Yes (Admin) |
| POST | `/statements/:id/send-email` | Send via email | Yes (Admin) |

### Dashboard Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/dashboard/stats` | Get dashboard stats | Yes (Admin) |
| GET | `/dashboard/recent-activity` | Get recent activity | Yes (Admin) |
| GET | `/dashboard/charts` | Get chart data | Yes (Admin) |

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "statusCode": 400
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

---

## Authentication

### JWT Token

Include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Token Payload
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "role": "BUYER",
  "iat": 1234567890,
  "exp": 1234567890
}
```

---

## User Roles & Permissions

| Role | Description | Permissions |
|------|-------------|-------------|
| **SUPER_ADMIN** | Full system access | All permissions |
| **SUB_ADMIN** | Limited admin access | Configurable subset |
| **BUYER** | Customer account | Own data only |

**SUB_ADMIN Permissions:**
- `manage_users`
- `manage_orders`
- `manage_products`
- `view_analytics`
- `manage_quotes`
- `manage_payments`
- `manage_invoices`
- `manage_dispatch`

---

## Email Templates

Located in `src/utils/emailTemplates.js`:

| Template | Trigger | Recipient |
|----------|---------|-----------|
| `registrationOTP` | User registers | Buyer |
| `adminNewRegistration` | Registration complete | Admin |
| `buyerApproval` | Admin approves | Buyer |
| `buyerRejection` | Admin rejects | Buyer |
| `passwordResetOTP` | Forgot password | User |
| `quotation` | Send quotation | Buyer |
| `proformaInvoice` | Send PI | Buyer |
| `invoice` | Send invoice | Buyer |
| `dispatchNotification` | Order dispatched | Buyer |
| `newQuoteRequest` | Quote request submitted | Admin |
| `quotationAccepted` | Buyer accepts | Admin |
| `quotationRejected` | Buyer rejects | Admin |
| `paymentSubmitted` | Payment submitted | Admin |

---

## PDF Generation

### Supported Documents
- Invoices (Tax / Non-tax / Reimbursement)
- Quotations
- Proforma Invoices
- Purchase Orders
- Dispatch Documents
- Account Statements

### Features
- A4 format with professional layout
- Company branding
- Dual currency (USD + INR)
- Exchange rate display
- Bank details section
- Authorized signatory

---

## Testing

### Run Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

### Test Structure

```
tests/
├── setup.js              # MongoDB Memory Server setup
├── fixtures/
│   ├── users.fixture.js
│   ├── products.fixture.js
│   └── orders.fixture.js
├── unit/
│   ├── utils/
│   │   ├── AppError.test.js
│   │   ├── apiResponse.test.js
│   │   └── catchAsync.test.js
│   └── models/
│       ├── User.test.js
│       ├── Product.test.js
│       └── ...
└── integration/
    └── auth.test.js
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm run seed` | Seed admin user |
| `npm test` | Run tests |
| `npm run test:watch` | Tests in watch mode |
| `npm run test:coverage` | Tests with coverage |

---

## Module Aliases

Configured in `package.json`:

```json
{
  "_moduleAliases": {
    "@utils": "src/utils",
    "@models": "src/models",
    "@controllers": "src/controllers",
    "@services": "src/services",
    "@middlewares": "src/middlewares",
    "@config": "src/config"
  }
}
```

---

## Security Features

- **Helmet** - HTTP security headers
- **CORS** - Cross-origin resource sharing
- **bcrypt** - Password hashing (12 rounds)
- **JWT** - Stateless authentication
- **Rate limiting** - Prevent abuse
- **Input validation** - Joi schemas
- **Role-based access** - SUPER_ADMIN, SUB_ADMIN, BUYER
- **Permission-based access** - Granular permissions

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `DUPLICATE_ENTRY` | 409 | Duplicate record |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Production Deployment

### Environment Variables

Ensure all required variables are set in production.

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use secure MongoDB connection (TLS)
- [ ] Set strong `JWT_SECRET`
- [ ] Configure proper CORS origins
- [ ] Set up reverse proxy (nginx)
- [ ] Enable HTTPS
- [ ] Set up logging
- [ ] Configure error monitoring

---

## License

Proprietary software owned by KB Enterprises.
