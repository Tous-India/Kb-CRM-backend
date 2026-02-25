# KB CRM

A full-stack CRM (Customer Relationship Management) system built for KB Enterprises to manage buyers, orders, invoices, quotations, proforma invoices, and product catalogs with comprehensive admin and buyer portals.

## Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime environment |
| Express | 5.x | Web framework |
| MongoDB | 7.x | NoSQL database |
| Mongoose | 9.x | MongoDB ODM |
| JWT | 9.x | Authentication tokens |
| Multer | 2.x | File uploads |
| Cloudinary | 2.x | Cloud image storage |
| Nodemailer | 7.x | Email service |
| PDFKit | 0.17.x | PDF generation |
| Joi | 18.x | Request validation |
| Helmet | 8.x | Security headers |
| bcrypt | 6.x | Password hashing |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI library |
| Vite | 7.x | Build tool |
| MUI (Material UI) | 7.x | Component library |
| Tailwind CSS | 4.x | Utility-first CSS |
| React Router | 7.x | Client-side routing |
| TanStack Query | 5.x | Data fetching & caching |
| Zustand | 5.x | State management |
| Axios | 1.x | HTTP client |
| html2pdf.js | 0.12.x | PDF export |
| react-toastify | 10.x | Toast notifications |

---

## Project Structure

```
KB CRM/
├── frontend2/                      # React frontend (Vite)
│   └── src/
│       ├── admin/                  # Admin panel
│       │   ├── layout/             # AdminLayout.jsx (sidebar, header, notifications)
│       │   ├── pages/              # 25+ admin pages
│       │   └── components/         # Print previews, modals
│       │
│       ├── buyer/                  # Buyer portal
│       │   ├── layout/             # BuyerLayout.jsx
│       │   ├── pages/              # 17 buyer pages
│       │   └── components/         # Header, Sidebar, PdfModal, Cards
│       │
│       ├── pages/                  # Public/shared pages
│       │   ├── AuthPage.jsx        # Combined Login/Register with animations
│       │   ├── ForgotPassword.jsx  # Password reset flow
│       │   └── NotFound.jsx        # 404 page
│       │
│       ├── components/             # Shared components
│       │   ├── ProtectedRoute.jsx  # Route protection by role
│       │   ├── NotificationSettings.jsx
│       │   ├── Logo.jsx
│       │   ├── LoadingSpinner.jsx
│       │   └── ErrorDisplay.jsx
│       │
│       ├── context/                # React Context providers
│       │   ├── AuthContext.jsx     # Authentication state
│       │   ├── CurrencyContext.jsx # USD/INR conversion rates
│       │   └── NotificationCountsContext.jsx
│       │
│       ├── hooks/                  # Custom React Query hooks
│       │   ├── useProducts.js      # Product CRUD operations
│       │   ├── useOrders.js        # Order management
│       │   ├── useInvoices.js      # Invoice operations
│       │   ├── useQuotations.js    # Quotation lifecycle
│       │   ├── useDispatchedOrders.js
│       │   ├── usePurchaseOrders.js
│       │   ├── useUsers.js         # User management
│       │   ├── useDashboard.js     # Dashboard stats
│       │   └── useDesktopNotifications.js
│       │
│       ├── stores/                 # Zustand state stores
│       │   ├── useCartStore.js     # Shopping cart
│       │   ├── useProductsStore.js # Product filters/search
│       │   ├── useUsersStore.js    # User list state
│       │   ├── useInvoicesStore.js # Invoice filters
│       │   ├── useDispatchedOrdersStore.js
│       │   ├── useQuoteRequestStore.js
│       │   ├── useNotificationStore.js
│       │   └── useArchivesStore.js
│       │
│       ├── services/               # API service modules
│       │   ├── api/
│       │   │   ├── client.js       # Axios instance with interceptors
│       │   │   └── endpoints.js    # API endpoint constants
│       │   ├── auth.service.js
│       │   ├── products.service.js
│       │   ├── orders.service.js
│       │   ├── invoices.service.js
│       │   ├── quotations.service.js
│       │   ├── proformaInvoices.service.js
│       │   ├── dispatches.service.js
│       │   ├── paymentRecords.service.js
│       │   ├── suppliers.service.js
│       │   ├── piAllocations.service.js
│       │   └── ... (18 service modules)
│       │
│       └── utils/                  # Utility functions
│           ├── passwordValidator.js
│           ├── notificationSound.js
│           └── toast.js
│
└── backend/                        # Node.js backend
    └── src/
        ├── modules/                # Feature modules (MVC pattern)
        │   ├── auth/               # Authentication (JWT, OTP, multi-step register)
        │   ├── users/              # User management & approval workflow
        │   ├── products/           # Product catalog
        │   ├── categories/         # Product categories with subcategories
        │   ├── brands/             # Product brands with logos
        │   ├── carts/              # Shopping cart
        │   ├── quotations/         # Quotation lifecycle (5 statuses)
        │   ├── orders/             # Order management
        │   ├── proformaInvoices/   # PI management
        │   ├── invoices/           # Invoice generation
        │   ├── dispatches/         # Shipment tracking
        │   ├── payments/           # Payment tracking
        │   ├── paymentRecords/     # Buyer payment submissions
        │   ├── purchaseOrders/     # Purchase orders
        │   ├── suppliers/          # Supplier management
        │   ├── piAllocations/      # PI item allocations to suppliers
        │   ├── purchaseDashboard/  # Purchase analytics
        │   ├── statements/         # Account statements
        │   ├── dashboard/          # Admin dashboard analytics
        │   ├── reports/            # Report generation
        │   ├── archives/           # Document archiving
        │   ├── supplierOrders/     # Supplier order tracking
        │   └── settings/           # App settings
        │
        ├── middlewares/            # Express middleware
        │   ├── auth.js             # JWT verification
        │   ├── roleCheck.js        # Role-based access
        │   └── permissions.js      # Permission-based access
        │
        ├── utils/                  # Utility functions
        │   ├── apiResponse.js      # Standardized API responses
        │   ├── AppError.js         # Custom error class
        │   ├── catchAsync.js       # Async error wrapper
        │   ├── cloudinaryUpload.js # Image upload helper
        │   ├── emailService.js     # Nodemailer wrapper
        │   ├── emailTemplates.js   # HTML email templates (15+ templates)
        │   ├── pdfGenerator.js     # Invoice/quotation PDF generation
        │   └── reportPdfGenerator.js
        │
        └── seeds/                  # Database seeders
            └── seedAdmin.js        # Create initial SUPER_ADMIN
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account (for image uploads)
- Gmail account with App Password (for emails)

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

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

Seed the admin user:

```bash
npm run seed
```

Start the server:

```bash
npm run dev       # Development with nodemon
npm start         # Production
```

### Frontend Setup

```bash
cd frontend2
npm install
npm run dev
```

| Environment | URL |
|-------------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000/api |

---

## User Roles & Permissions

| Role | Description | Permissions |
|------|-------------|-------------|
| **SUPER_ADMIN** | Full system access | All permissions |
| **SUB_ADMIN** | Limited admin access | Configurable subset of: `manage_users`, `manage_orders`, `manage_products`, `view_analytics`, `manage_quotes`, `manage_payments`, `manage_invoices`, `manage_dispatch` |
| **BUYER** | Customer account | Access to own orders, invoices, statements, cart, quotations |

---

## Authentication Flows

### Buyer Registration (4-Step Wizard)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Step 1: Basic  │────►│  Step 2: Verify │────►│  Step 3: Create │────►│  Step 4: Done   │
│  Info           │     │  Email (OTP)    │     │  Password       │     │  (Pending)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
      │                       │                       │                       │
      │ Name, Email,          │ 6-digit OTP          │ Password +             │ Admin approval
      │ Phone, Company        │ (10 min expiry)      │ Confirmation           │ required
```

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (!@#$%^&*)

### Forgot Password Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Enter Email    │────►│  Verify OTP     │────►│  New Password   │────► Login
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Admin Approval Workflow

```
Registration Complete → Admin Notification Email + Dashboard Badge
                     ↓
            Admin Reviews Application
                     ↓
         ┌──────────┴──────────┐
         ↓                     ↓
    [Approve]              [Reject]
         ↓                     ↓
   Buyer can login      Rejection email
   + Approval email      with reason
```

---

## Quotation Workflow

The quotation system has 5 distinct status tabs:

```
┌─────────┐     Buyer      ┌──────────┐     Admin      ┌───────────┐
│  OPEN   │ ──────────────►│ ACCEPTED │ ──────────────►│ CONVERTED │
│(Pending)│    Accepts     │          │  Convert to PI │  (Frozen) │
└────┬────┘                └──────────┘                └───────────┘
     │
     │ Buyer Rejects
     ▼
┌──────────┐
│ REJECTED │ ── Renew ──► Back to OPEN
└──────────┘

     │ No Response (Expiry)
     ▼
┌─────────┐
│ EXPIRED │ ── Renew/Clone ──► Back to OPEN
└─────────┘
```

| Tab | Description | Available Actions |
|-----|-------------|-------------------|
| **Open** | Awaiting buyer response | View, Email, Print/PDF, Edit, Clone |
| **Accepted** | Buyer accepted | View, Email, Print/PDF, Edit, Clone, **Convert to PI** |
| **Rejected** | Buyer rejected | View, Email, Print/PDF, Edit, Renew |
| **Expired** | Validity expired | View, Email, Print/PDF, Renew, Clone |
| **Converted** | Converted to PI (frozen) | View, Email, Print/PDF only |

---

## Invoice Status Workflow

```
┌──────────────────────────────────────────────────────────┐
│                    INVOICE STATUS                         │
├──────────────────────────────────────────────────────────┤
│                                                           │
│   ┌──────────┐    Partial     ┌──────────┐               │
│   │  UNPAID  │ ─────────────► │ PARTIAL  │               │
│   │  (Red)   │   Payment      │ (Orange) │               │
│   └────┬─────┘                └────┬─────┘               │
│        │                           │                      │
│        │ Full Payment              │ Remaining Payment    │
│        ▼                           ▼                      │
│   ┌─────────────────────────────────────┐                │
│   │              PAID                    │                │
│   │             (Green)                  │                │
│   └─────────────────────────────────────┘                │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## Admin Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/admin` | Overview stats, charts, recent activity |
| Users | `/admin/users` | User CRUD, profile details, activity tabs |
| Pending Approvals | `/admin/pending-approvals` | Review/approve/reject buyer registrations |
| Products | `/admin/products` | Product catalog with filters |
| Add/Edit Product | `/admin/products/add` `/admin/products/edit/:id` | Product form with image upload |
| Categories | `/admin/categories` | Category management with subcategories |
| Brands | `/admin/brands` | Brand management with logos |
| Quotations | `/admin/quotations` | 5-tab quotation management |
| Proforma Invoices | `/admin/performa-invoices` | PI management with item editing |
| Orders | `/admin/orders` | Open orders with invoice preview |
| Dispatched Orders | `/admin/dispatched-orders` | Shipment tracking |
| Invoices | `/admin/invoices` | Invoice management |
| Manual Invoice | `/admin/manual-invoice` | Create manual invoices |
| Payments | `/admin/payments` | Payment tracking |
| Payment Records | `/admin/payment-records` | Buyer payment submissions |
| Statements | `/admin/statements` | Account statement generation |
| Buyer Transactions | `/admin/buyer-transactions/:id` | Per-buyer transaction history |
| Purchase Orders | `/admin/purchase-orders` | PO management |
| Suppliers | `/admin/suppliers` | Supplier management |
| PI Allocation | `/admin/pi-allocation` | Allocate PI items to suppliers |
| Purchase Dashboard | `/admin/purchase-dashboard` | Purchase analytics & profit tracking |
| Profit Analysis | `/admin/profit-analysis` | Profit/loss analysis |
| Archives | `/admin/archives` | Archived documents |

---

## Buyer Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Overview, recent orders, stats |
| Products | `/products` | Product catalog with search/filters |
| Single Product | `/products/:id` | Product details |
| Cart | `/cart` | Shopping cart |
| Web Orders | `/web-orders` | Order history |
| Quote | `/quote` | View quotations from admin |
| Quote Request | `/quote-request` | Request new quotations |
| Open Orders | `/open-orders` | Active orders |
| Shipments | `/shipments` | Track shipments |
| Proforma Invoices | `/proforma-invoices` | View PIs |
| Invoices | `/invoices` | Invoice history |
| Statements | `/statements` | Account statements |
| 8130 | `/8130` | 8130 certificates |
| Multi Search | `/multi-search` | Multi-part search engine |
| Profile | `/profile` | User profile management |

---

## Print Preview Components

Professional A4-format print preview components:

| Component | Document Type | Theme Color |
|-----------|---------------|-------------|
| `InvoicePrintPreview` | Tax/Non-tax Invoice | Blue (#1976d2) |
| `QuotationPrintPreview` | Quotation | Orange (#ed6c02) |
| `PerformaInvoicePrintPreview` | Proforma Invoice | Purple (#9c27b0) |
| `DispatchPrintPreview` | Dispatch/Shipment | Green (#4caf50) |
| `StatementPrintPreview` | Account Statement | Blue (#1976d2) |
| `PurchaseOrderPrintPreview` | Purchase Order | Blue (#1976d2) |

**Features:**
- Professional A4 layout with company branding
- Dual currency display (USD and INR)
- Exchange rate display
- Bank details and authorized signatory section
- Print/PDF via browser's print dialog

---

## Email Notification System

| Email Type | Trigger | Recipient |
|------------|---------|-----------|
| Registration OTP | User initiates registration | Buyer |
| Admin New Registration | Registration complete | Admin |
| Buyer Approval | Admin approves registration | Buyer |
| Buyer Rejection | Admin rejects registration | Buyer |
| Password Reset OTP | Forgot password request | User |
| Quotation | Admin sends quotation | Buyer |
| Proforma Invoice | Admin sends PI | Buyer |
| Invoice | Admin sends invoice | Buyer |
| Dispatch Notification | Order dispatched | Buyer |
| New Quote Request | Buyer submits quote request | Admin |
| Quotation Accepted | Buyer accepts quotation | Admin |
| Quotation Rejected | Buyer rejects quotation | Admin |
| Payment Submitted | Buyer submits payment | Admin |

---

## API Endpoints

All endpoints are under `/api/` prefix:

| Module | Base Path | Key Endpoints |
|--------|-----------|---------------|
| Auth | `/auth` | `POST /login`, `POST /register/initiate`, `POST /register/verify-otp`, `POST /register/complete`, `POST /forgot-password/*` |
| Users | `/users` | CRUD, `GET /pending`, `POST /:id/approve`, `POST /:id/reject`, `PATCH /:id/toggle-status` |
| Products | `/products` | CRUD with image upload, filters by category/brand/stock |
| Categories | `/categories` | CRUD with subcategories |
| Brands | `/brands` | CRUD with logo upload |
| Quotations | `/quotations` | CRUD, `POST /:id/accept`, `POST /:id/reject`, `POST /:id/convert-to-pi` |
| Proforma Invoices | `/proforma-invoices` | CRUD, `POST /:id/convert-to-invoice` |
| Orders | `/orders` | CRUD, `POST /:id/dispatch` |
| Invoices | `/invoices` | CRUD, manual creation, status updates |
| Dispatches | `/dispatches` | CRUD, tracking updates |
| Payments | `/payments` | CRUD, record against invoices |
| Payment Records | `/payment-records` | Buyer payment submissions |
| Purchase Orders | `/purchase-orders` | CRUD, status updates |
| Suppliers | `/suppliers` | CRUD |
| PI Allocations | `/pi-allocations` | Allocate PI items to suppliers |
| Statements | `/statements` | Generate per-buyer statements |
| Dashboard | `/dashboard` | Analytics and summary stats |
| Archives | `/archives` | Document archiving |

---

## Testing

### Backend Testing (Jest)

```bash
cd backend

npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

**Test Structure:**
```
backend/tests/
├── setup.js              # Jest setup with MongoDB Memory Server
├── fixtures/             # Test data
├── unit/                 # Unit tests
│   ├── utils/            # Utility tests
│   └── models/           # Model tests
└── integration/          # API integration tests
```

### Frontend Testing (Vitest)

```bash
cd frontend2

npm test              # Watch mode
npm run test:run      # Run once
npm run test:coverage # With coverage
npm run test:ui       # Visual UI
```

**Test Structure:**
```
frontend2/src/__tests__/
├── utils/            # Utility tests
├── stores/           # Zustand store tests
├── hooks/            # React Query hook tests
└── services/         # API service tests
```

---

## Database Schema

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for complete MongoDB schema documentation including:

- **users** - User accounts with roles and permissions
- **products** - Product catalog with pricing and inventory
- **categories** - Product categories with subcategories
- **brands** - Product brands with logos
- **quotations** - Quotation documents with 5-status lifecycle
- **proforma_invoices** - Proforma invoices
- **orders** - Customer orders
- **invoices** - Tax and reimbursement invoices
- **dispatches** - Shipment tracking
- **payments** - Payment records
- **carts** - Shopping carts
- **suppliers** - Supplier information
- **pi_allocations** - PI item allocations to suppliers

---

## Environment Variables

### Backend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 5000) | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `JWT_EXPIRES_IN` | Token expiry (default: 7d) | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |
| `SMTP_HOST` | SMTP server host | Yes |
| `SMTP_PORT` | SMTP server port | Yes |
| `SMTP_SECURE` | Use TLS (true/false) | Yes |
| `SMTP_USER` | SMTP username/email | Yes |
| `SMTP_PASS` | SMTP password/app password | Yes |
| `EMAIL_FROM_NAME` | Sender name | Yes |
| `EMAIL_FROM_ADDRESS` | Sender email | Yes |
| `ADMIN_NOTIFICATION_EMAIL` | Admin notification email | Yes |
| `FRONTEND_URL` | Frontend URL for email links | Yes |

---

## Contributing

### Git Workflow

1. Create a feature branch from `main`
2. Make changes
3. Run tests before committing
4. Create a pull request

### Files Not to Commit

| Category | Files/Folders |
|----------|---------------|
| Environment | `.env`, `.env.*`, `*.local` |
| Dependencies | `node_modules/` |
| Build | `dist/`, `build/`, `out/` |
| IDE | `.vscode/`, `.idea/` |
| OS | `.DS_Store`, `Thumbs.db` |
| Logs | `*.log`, `logs/` |
| Coverage | `coverage/`, `.nyc_output/` |
| Credentials | `*.pem`, `*.key`, `credentials.json` |
| Backups | `*.zip`, `*.bak` |
| AI Tools | `.claude/` |

---

## Screenshots

### Auth Pages
- **Login/Register** - Combined auth page with animated toggle
- **Forgot Password** - 3-step OTP-based password reset

### Admin Portal
- **Dashboard** - Stats cards, charts, recent activity
- **Quotations** - 5-tab quotation management
- **Orders** - Order management with invoice preview
- **PI Allocation** - Supplier allocation with profit calculation
- **Purchase Dashboard** - Purchase analytics with INR conversion

### Buyer Portal
- **Products** - Product catalog with search and filters
- **Cart** - Shopping cart with quantity management
- **Invoices** - Invoice history with PDF download
- **Statements** - Account statements with print preview

---

## License

This project is proprietary software owned by KB Enterprises. All rights reserved.

---

## Support

For issues or feature requests, please contact the development team.
