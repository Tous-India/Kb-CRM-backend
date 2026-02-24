# KB CRM

A full-stack CRM (Customer Relationship Management) system built for managing buyers, orders, invoices, quotations, and product catalogs.

## Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express 5
- **Database:** MongoDB with Mongoose 9
- **Auth:** JWT (JSON Web Tokens)
- **File Uploads:** Multer + Cloudinary
- **Validation:** Joi
- **PDF Generation:** Built-in PDF generator for invoices/quotations
- **Security:** Helmet, CORS, bcryptjs

### Frontend
- **Framework:** React 19 (Vite)
- **UI Library:** MUI 7 (Material UI) + Tailwind CSS 4
- **State Management:** Zustand
- **Data Fetching:** TanStack React Query v5
- **HTTP Client:** Axios
- **Routing:** React Router v7
- **Date Handling:** Day.js
- **PDF Export:** html2pdf.js

## Project Structure

```
KB CRM/
├── frontend2/                 # React frontend (Vite)
│   └── src/
│       ├── admin/             # Admin panel
│       │   ├── pages/         # Admin pages (Dashboard, Orders, PendingApprovals, etc.)
│       │   └── components/    # Print preview components, SendEmailModal
│       ├── buyer/             # Buyer portal pages
│       ├── pages/             # Public pages (Login, Register, ForgotPassword)
│       ├── components/        # Shared components (ProtectedRoute, Logo, NotificationSettings)
│       ├── context/           # React context providers (Auth, Currency, NotificationCounts)
│       ├── hooks/             # React Query hooks, useDesktopNotifications
│       ├── services/          # API service modules
│       │   └── api/           # Axios client & endpoint config
│       ├── stores/            # Zustand stores (cart, notifications)
│       └── utils/             # Utility functions (toast, passwordValidator, notificationSound)
│
└── backend/              # Node.js backend
    └── src/
        ├── modules/           # Feature modules
        │   ├── auth/          # Authentication (login, multi-step register, forgot password, JWT)
        │   ├── users/         # User management (SUPER_ADMIN, SUB_ADMIN, BUYER, approval workflow)
        │   ├── products/      # Product catalog
        │   ├── categories/    # Product categories
        │   ├── brands/        # Product brands
        │   ├── carts/         # Shopping cart
        │   ├── purchaseOrders/# Purchase orders
        │   ├── quotations/    # Quotations with PDF download
        │   ├── orders/        # Orders (open, dispatched)
        │   ├── proformaInvoices/ # Proforma invoices
        │   ├── invoices/      # Invoices (auto + manual creation)
        │   ├── payments/      # Payment tracking
        │   ├── paymentRecords/# Buyer payment submissions
        │   ├── dispatches/    # Order dispatches
        │   ├── statements/    # Account statements
        │   ├── dashboard/     # Dashboard analytics
        │   └── settings/      # App settings
        ├── middlewares/       # Auth, role, permission middleware
        ├── utils/             # ApiResponse, AppError, PDF generator, Cloudinary
        │   ├── emailService.js    # Nodemailer email sending
        │   ├── emailTemplates.js  # HTML email templates
        │   └── pdfGenerator.js    # PDF generation for documents
        └── seeds/             # Database seeders
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account (for image uploads)

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kb-crm
JWT_SECRET=your_jwt_secret
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
SMTP_PASS=your-app-password
EMAIL_FROM_NAME=KB Enterprises
EMAIL_FROM_ADDRESS=info@kbenterprise.org
ADMIN_NOTIFICATION_EMAIL=admin@kbenterprise.org

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173
```

### Gmail SMTP Setup
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
npm run dev
```

### Frontend Setup

```bash
cd frontend2
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and connects to the backend on `http://localhost:5000`.

## User Roles

| Role | Description |
|------|-------------|
| **SUPER_ADMIN** | Full access to all features and user management |
| **SUB_ADMIN** | Limited admin access based on assigned permissions |
| **BUYER** | Customer account with access to orders, invoices, and statements |

## Buyer Registration Flow

The system implements a secure multi-step registration process with email OTP verification and admin approval:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Step 1: Enter  │────►│  Step 2: Verify │────►│  Step 3: Create │
│  Basic Info     │     │  Email (OTP)    │     │  Password       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                               │
        │  Name, Email,                                 │  Strong password
        │  Phone, Company                               │  validation
        │                                               ▼
                                               ┌─────────────────┐
                                               │  Registration   │
                                               │  Complete       │
                                               │  (PENDING)      │
                                               └────────┬────────┘
                                                        │
                    ┌───────────────────────────────────┴───────────────────────────────────┐
                    │                                                                       │
                    ▼                                                                       ▼
           ┌─────────────────┐                                                    ┌─────────────────┐
           │  Admin Email    │                                                    │  Dashboard      │
           │  Notification   │                                                    │  Notification   │
           └─────────────────┘                                                    └─────────────────┘
                    │                                                                       │
                    └───────────────────────────────────┬───────────────────────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │  Admin Reviews  │
                                               │  & Approves     │
                                               └────────┬────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │  Buyer Email:   │
                                               │  "You can now   │
                                               │  login!"        │
                                               └─────────────────┘
```

### Registration Features
- **6-digit OTP** sent to email for verification (10 min expiry)
- **Strong Password Requirements**:
  - Minimum 8 characters
  - At least 1 uppercase letter (A-Z)
  - At least 1 lowercase letter (a-z)
  - At least 1 number (0-9)
  - At least 1 special character (!@#$%^&*)
- **Admin Approval Workflow**: Buyers cannot login until approved
- **Email Notifications**: OTP, approval, and rejection emails

## Forgot Password Flow

Secure password reset using OTP verification:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Step 1: Enter  │────►│  Step 2: Verify │────►│  Step 3: Create │
│  Email Address  │     │  Email (OTP)    │     │  New Password   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │  Password Reset │
                                               │  Complete       │
                                               │  → Login Page   │
                                               └─────────────────┘
```

## Admin Pending Approvals

Admins can review and approve/reject buyer registrations:

| Action | Description | Email Sent |
|--------|-------------|------------|
| **View Details** | See full registration details | - |
| **Approve** | Activate account, allow login | Approval email with login link |
| **Reject** | Deny registration with reason | Rejection email with reason |

The admin sidebar shows a badge count for pending approvals.

## Quotation Flow

The quotation system follows a structured workflow with 5 status tabs:

```
┌─────────┐     Buyer      ┌──────────┐     Admin      ┌───────────┐
│  Open   │ ──────────────►│ Accepted │ ──────────────►│ Converted │
│(Pending)│    Accepts     │          │  Convert to PI │  (Frozen) │
└────┬────┘                └──────────┘                └───────────┘
     │
     │ Buyer Rejects
     ▼
┌──────────┐
│ Rejected │ ── Renew ──► Back to Open
└──────────┘

     │ No Response (Expiry)
     ▼
┌─────────┐
│ Expired │ ── Renew/Clone ──► Back to Open
└─────────┘
```

### Quotation Tabs

| Tab | Description | Admin Actions |
|-----|-------------|---------------|
| **Open** | Sent quotations awaiting buyer response | View, Email, Print/PDF, Edit, Clone |
| **Accepted** | Buyer accepted quotations | View, Email, Print/PDF, Edit, Clone, Convert to PI |
| **Rejected** | Buyer rejected quotations | View, Email, Print/PDF, Edit, Renew |
| **Expired** | Expired without buyer response | View, Email, Print/PDF, Renew, Clone |
| **Converted** | Converted to Proforma Invoice (frozen) | View, Email, Print/PDF only |

### Key Features
- **Buyer-driven status**: Buyer accepts or rejects quotations
- **Admin notification**: Admin gets notified when buyer responds
- **Convert to PI**: Accepted quotations can be converted to Proforma Invoice with editable prices, quantities, and exchange rate
- **Renew**: Rejected/Expired quotations can be renewed with updated pricing
- **Clone**: Create a copy of any quotation in Open tab
- **Frozen state**: Converted quotations cannot be edited or cloned

## Print Preview Components

Professional A4-format print preview components for all documents:

| Component | Description | Theme Color |
|-----------|-------------|-------------|
| `InvoicePrintPreview` | Tax/Non-tax invoice preview | Blue (#1976d2) |
| `QuotationPrintPreview` | Quotation document preview | Orange (#ed6c02) |
| `PerformaInvoicePrintPreview` | Proforma invoice preview | Purple (#9c27b0) |
| `DispatchPrintPreview` | Dispatch document with tracking | Green (#4caf50) |
| `StatementPrintPreview` | Account statement preview | Blue (#1976d2) |

### Print Features
- Professional A4 layout with company branding
- Dual currency display (USD and INR)
- Exchange rate display on all documents
- Bank details and stamp section
- Print/PDF via browser's print dialog ("Save as PDF")

## API Modules

All API endpoints follow RESTful conventions under `/api/`:

| Module | Endpoints |
|--------|-----------|
| Auth | Login, Multi-step Register (initiate, verify-otp, complete), Forgot Password (initiate, verify-otp, reset), Profile |
| Users | CRUD, Buyers list, Sub-admins, Activate/Deactivate, Pending Approvals, Approve/Reject |
| Products | CRUD with image upload, filtering by category/brand/stock |
| Categories | CRUD |
| Brands | CRUD with logo upload |
| Purchase Orders | CRUD, status updates, PDF |
| Quotations | CRUD, accept/reject, convert to proforma/order, PDF |
| Orders | CRUD, dispatch, record payment |
| Proforma Invoices | CRUD, convert to invoice, PDF |
| Invoices | CRUD, manual creation, status updates, PDF |
| Payments | CRUD, record payments against invoices |
| Statements | Account statements per buyer |
| Dashboard | Analytics and summary stats |
| Settings | Application-wide settings |

## Admin Pages

| Page | Description |
|------|-------------|
| Dashboard | Overview stats, recent activity, charts |
| Users | User management with CRUD, profile details, activity tabs |
| Pending Approvals | Review and approve/reject buyer registrations |
| Products | Product catalog with filtering, stock status |
| Add/Edit Product | Product form with image upload |
| Purchase Orders | PO management and tracking |
| Quotations | Quote lifecycle with 5 tabs (Open, Accepted, Rejected, Expired, Converted) |
| Orders | Open orders management with professional invoice preview |
| Dispatched Orders | Track dispatched shipments with dispatch/invoice preview |
| Proforma Invoices | Proforma invoice management |
| Invoices | Invoice management with PDF download |
| Manual Invoice | Create invoices manually with status tracking (PAID/UNPAID/PARTIAL) |
| Payments | Payment tracking and recording |
| Statements | Account statement generation with professional preview |
| Buyer Transactions | Transaction history per buyer |

## Recent Updates

### Buyer Registration & Authentication
- **Multi-step Registration**: 4-step wizard (Basic Info → Verify Email → Create Password → Success)
- **Email OTP Verification**: 6-digit code with 10-minute expiry and resend functionality
- **Strong Password Validation**: Real-time password strength indicator with requirement checklist
- **Admin Approval Workflow**: Buyers must be approved by admin before login
- **Pending Approvals Page**: Admin dashboard to review, approve, or reject registrations
- **Forgot Password Flow**: OTP-based password reset with strong password enforcement
- **Email Notifications**:
  - Registration OTP email
  - Admin notification for new registrations
  - Buyer approval/rejection emails
  - Password reset OTP email

### Email Notification System
Professional HTML email templates for all document types:

| Email Type | Trigger | Recipient |
|------------|---------|-----------|
| Registration OTP | User registers | Buyer |
| Admin New Registration | Registration complete | Admin |
| Buyer Approval | Admin approves | Buyer |
| Buyer Rejection | Admin rejects | Buyer |
| Password Reset OTP | Forgot password | Buyer |
| Quotation | Send quotation | Buyer |
| Proforma Invoice | Send PI | Buyer |
| Invoice | Send invoice | Buyer |
| Dispatch Notification | Order dispatched | Buyer |
| New Quote Request | Buyer submits order | Admin |
| Quotation Accepted | Buyer accepts quote | Admin |
| Quotation Rejected | Buyer rejects quote | Admin |
| Payment Submitted | Buyer submits payment | Admin |

### Manual Invoice Page Enhancements
- **Simplified Form**: Removed Items tab - items are now optional for manual invoices
- **Invoice Status**: Added Invoice Status dropdown with options:
  - `UNPAID` - Default status for new invoices
  - `PAID` - Fully paid invoices
  - `PARTIAL` - Partially paid invoices
- **Invoice Types**: Streamlined to only 2 types:
  - Tax Invoice
  - Reimbursement Invoice
- **Real-time Summary**: Invoice status displayed in real-time in the Invoice Summary section
- **Professional Print Preview**: Matches the design of other invoice pages with:
  - Company logo and header
  - From/Bill To address boxes
  - Invoice details grid with status badge
  - Items table (if items exist)
  - Amount in words + Totals breakdown
  - Bank details section
  - Terms & Conditions
  - Authorized signatory section

### Quotations Page Redesign
- Replaced multiple tables with tab-based layout
- 5 tabs: Open, Accepted, Rejected, Expired, Converted
- Buyer-driven accept/reject flow (admin views status only)
- Convert to PI with editable options (price, quantity, exchange rate)
- Renew functionality for rejected/expired quotations

### Professional Print Previews
- New print preview components for all document types
- Consistent A4 professional design across all documents
- Dual currency (USD/INR) with exchange rate display
- Combined Print/PDF button using browser's print dialog

## Invoice Status Workflow

```
┌─────────────────────────────────────────────────────────┐
│                    MANUAL INVOICE                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   ┌──────────┐    Payment    ┌──────────┐               │
│   │  UNPAID  │ ─────────────►│ PARTIAL  │               │
│   │  (Red)   │   Partial     │ (Orange) │               │
│   └────┬─────┘               └────┬─────┘               │
│        │                          │                      │
│        │ Full Payment             │ Remaining Payment    │
│        ▼                          ▼                      │
│   ┌──────────────────────────────────┐                  │
│   │              PAID                 │                  │
│   │             (Green)               │                  │
│   └──────────────────────────────────┘                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Status Badge Colors
| Status | Color | Description |
|--------|-------|-------------|
| **UNPAID** | Red | Invoice created, no payment received |
| **PARTIAL** | Orange | Partial payment received |
| **PAID** | Green | Full payment received |

## Testing

The project includes comprehensive test suites for both backend and frontend.

### Backend Testing (Jest)

```bash
cd backend

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=auth

# Run in watch mode
npm run test:watch
```

**Test Structure:**
```
backend/tests/
├── setup.js                    # Jest setup with MongoDB Memory Server
├── fixtures/                   # Test data fixtures
│   ├── users.fixture.js
│   ├── products.fixture.js
│   └── orders.fixture.js
├── unit/                       # Unit tests
│   ├── utils/                  # Utility function tests
│   │   ├── AppError.test.js
│   │   ├── apiResponse.test.js
│   │   └── catchAsync.test.js
│   └── models/                 # Mongoose model tests
│       ├── User.test.js
│       ├── Product.test.js
│       ├── Order.test.js
│       ├── Quotation.test.js
│       ├── Invoice.test.js
│       ├── ProformaInvoice.test.js
│       ├── Dispatch.test.js
│       ├── Cart.test.js
│       └── Payment.test.js
└── integration/                # Integration tests
    └── auth.test.js
```

### Frontend Testing (Vitest)

```bash
cd frontend2

# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui
```

**Test Structure:**
```
frontend2/src/__tests__/
├── utils/                      # Utility tests
│   └── passwordValidator.test.js
├── stores/                     # Zustand store tests
│   ├── useProductsStore.test.js
│   ├── useCartStore.test.js
│   ├── useQuoteRequestStore.test.js
│   ├── useDispatchedOrdersStore.test.js
│   └── useNotificationStore.test.js
├── hooks/                      # React Query hook tests
└── services/                   # API service tests
```

## Contributing

### Git Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Run tests before committing
4. Create a pull request

### Files Not to Commit

The following files/folders are excluded via `.gitignore`:

| Category | Files/Folders |
|----------|---------------|
| **Environment** | `.env`, `.env.*`, `*.local` |
| **Dependencies** | `node_modules/` |
| **Build** | `dist/`, `build/`, `out/` |
| **IDE** | `.vscode/`, `.idea/` |
| **OS** | `.DS_Store`, `Thumbs.db`, `nul` |
| **Logs** | `*.log`, `logs/` |
| **Coverage** | `coverage/`, `.nyc_output/` |
| **Credentials** | `*.pem`, `*.key`, `credentials.json`, `secrets.json` |
| **Backups** | `*.zip`, `*.bak`, `*-old.zip` |
| **AI Tools** | `.claude/` |

### Environment Setup

Copy the example environment file and configure:

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend (if needed)
cp frontend2/.env.example frontend2/.env
```

## License

This project is proprietary software owned by KB Enterprises.
