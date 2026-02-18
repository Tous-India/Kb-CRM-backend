# KB CRM Backend API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require Bearer token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

# Module 1: Authentication

## 1.1 Login
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "697c8181cfce2ea769e5772a",
      "user_id": "ADM-00001",
      "role": "SUPER_ADMIN",
      "name": "Super Admin",
      "email": "user@example.com",
      "phone": "9999999999",
      "permissions": [],
      "is_active": true,
      "last_login": "2026-02-13T19:11:58.567Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## 1.2 Register
```
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "1234567890",
  "role": "SALES_REP"
}
```

## 1.3 Get Current User
```
GET /api/auth/me
```
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "user": { ... }
  }
}
```

## 1.4 Logout
```
POST /api/auth/logout
```

---

# Module 2: Suppliers

**Required Permission:** `manage_suppliers`

## 2.1 Get All Suppliers
```
GET /api/suppliers
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 10) |
| search | string | Search in name, code, email |
| status | string | Filter by status (ACTIVE/INACTIVE/BLOCKED) |
| supplier_type | string | Filter by type (MANUFACTURER/DISTRIBUTOR/WHOLESALER) |

**Response (200):**
```json
{
  "status": "success",
  "message": "Suppliers fetched",
  "data": {
    "suppliers": [
      {
        "_id": "698f6c1ee80d29e8e4730f3c",
        "supplier_id": "SUP-00001",
        "supplier_code": "SUP-TEST-001",
        "supplier_name": "Test Electronics Supplier",
        "supplier_type": "DISTRIBUTOR",
        "status": "ACTIVE",
        "contact": {
          "primary_name": "John Doe",
          "email": "john@testsupplier.com",
          "phone": "+1-555-1234",
          "secondary_email": ""
        },
        "address": {
          "street": "123 Tech Street",
          "city": "New York",
          "state": "NY",
          "zip": "10001",
          "country": "USA"
        },
        "business_info": {
          "tax_id": "12-3456789",
          "gstin": "",
          "pan": "",
          "registration_no": ""
        },
        "bank_details": {
          "bank_name": "Chase Bank",
          "account_name": "Test Electronics LLC",
          "account_number": "123456789",
          "ifsc_code": "",
          "swift_code": "",
          "branch": ""
        },
        "terms": {
          "payment_terms": "Net 30",
          "currency": "USD",
          "credit_limit": 50000,
          "credit_used": 0,
          "delivery_terms": "FOB Origin",
          "lead_time_days": 14,
          "minimum_order": 500
        },
        "performance": {
          "total_orders": 0,
          "total_value": 0,
          "on_time_delivery_rate": 100,
          "quality_rating": 5,
          "last_order_date": null
        },
        "products_supplied": ["Electronics", "Components"],
        "notes": "Preferred supplier for electronic components",
        "createdAt": "2026-02-13T18:23:26.651Z",
        "updatedAt": "2026-02-13T18:23:26.651Z"
      }
    ],
    "pagination": {
      "total": 2,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

## 2.2 Get Supplier by ID
```
GET /api/suppliers/:id
```
**Note:** `:id` can be MongoDB `_id` or `supplier_id` (e.g., "SUP-00001")

**Response (200):**
```json
{
  "status": "success",
  "message": "Supplier fetched",
  "data": {
    "supplier": { ... }
  }
}
```

## 2.3 Create Supplier
```
POST /api/suppliers
```

**Request Body:**
```json
{
  "supplier_code": "SUP-NEWCO-001",
  "supplier_name": "New Company Supplies",
  "supplier_type": "MANUFACTURER",
  "status": "ACTIVE",
  "contact": {
    "primary_name": "Jane Smith",
    "email": "jane@newcompany.com",
    "phone": "+1-555-5678"
  },
  "address": {
    "street": "456 Industrial Ave",
    "city": "Chicago",
    "state": "IL",
    "zip": "60601",
    "country": "USA"
  },
  "business_info": {
    "tax_id": "98-7654321"
  },
  "bank_details": {
    "bank_name": "Bank of America",
    "account_name": "New Company LLC",
    "account_number": "987654321"
  },
  "terms": {
    "payment_terms": "Net 45",
    "currency": "USD",
    "credit_limit": 100000,
    "delivery_terms": "CIF",
    "lead_time_days": 21,
    "minimum_order": 1000
  },
  "products_supplied": ["Hydraulics", "Pumps"],
  "notes": "New supplier for hydraulic components"
}
```

**Response (201):**
```json
{
  "status": "success",
  "message": "Supplier created",
  "data": {
    "supplier": {
      "supplier_id": "SUP-00003",
      ...
    }
  }
}
```

## 2.4 Update Supplier
```
PUT /api/suppliers/:id
```

**Request Body:** (partial update allowed)
```json
{
  "supplier_name": "Updated Company Name",
  "terms": {
    "credit_limit": 75000
  }
}
```

## 2.5 Delete Supplier
```
DELETE /api/suppliers/:id
```

## 2.6 Update Supplier Status
```
PATCH /api/suppliers/:id/status
```

**Request Body:**
```json
{
  "status": "INACTIVE"
}
```

## 2.7 Get Supplier Statistics
```
GET /api/suppliers/stats/summary
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "stats": {
      "total": 5,
      "active": 3,
      "inactive": 1,
      "blocked": 1
    }
  }
}
```

## 2.8 Search Suppliers
```
GET /api/suppliers/search?q=electronics
```

---

# Module 3: PI Allocations

**Required Permission:** `manage_allocations`

## 3.1 Get All Allocations
```
GET /api/pi-allocations
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 10) |
| status | string | Filter by allocation_status |
| pi_number | string | Filter by PI number |
| supplier | string | Filter by supplier ID |

**Response (200):**
```json
{
  "status": "success",
  "message": "Allocations fetched",
  "data": {
    "allocations": [
      {
        "_id": "699a1234567890abcdef1234",
        "allocation_id": "ALC-00001",
        "proforma_invoice": "699a1234567890abcdef5678",
        "pi_number": "PI240010",
        "pi_item_id": "PI-ITEM-001",
        "buyer": "699a1234567890abcdefaaaa",
        "buyer_name": "John Smith",
        "customer_name": "John Smith",
        "item_index": 0,
        "product": "699a1234567890abcdefbbbb",
        "part_number": "HYD-PUMP-500",
        "product_name": "Aircraft Hydraulic Pump Assembly",
        "total_pi_qty": 3,
        "sell_price": 2707.50,
        "allocation_status": "ALLOCATED",
        "allocations": [
          {
            "_id": "699a1234567890abcdef9999",
            "supplier": "698f6c1ee80d29e8e4730f3c",
            "supplier_name": "ATS Manufacturing Co.",
            "supplier_code": "SUP-ATS-001",
            "spo_id": "699a1234567890abcdefspo1",
            "spo_number": "SP260001",
            "allocated_qty": 3,
            "unit_cost": 2200.00,
            "total_cost": 6600.00,
            "status": "ORDERED",
            "expected_date": "2026-01-24T00:00:00.000Z",
            "received_qty": 0,
            "notes": ""
          }
        ],
        "summary": {
          "total_qty": 3,
          "allocated_qty": 3,
          "unallocated_qty": 0,
          "ordered_qty": 3,
          "received_qty": 0,
          "allocation_complete": true
        },
        "avg_cost_price": 2200.00,
        "total_cost": 6600.00,
        "total_sell_value": 8122.50,
        "profit_margin": 18.74,
        "createdAt": "2026-01-10T10:00:00.000Z",
        "updatedAt": "2026-01-10T14:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

## 3.2 Get Allocation by ID
```
GET /api/pi-allocations/:id
```
**Note:** `:id` can be MongoDB `_id` or `allocation_id` (e.g., "ALC-00001")

## 3.3 Get Allocations by PI
```
GET /api/pi-allocations/by-pi/:piId
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "allocations": [
      { ... },
      { ... }
    ]
  }
}
```

## 3.4 Create Allocation
```
POST /api/pi-allocations
```

**Request Body:**
```json
{
  "proforma_invoice": "699a1234567890abcdef5678",
  "pi_number": "PI240015",
  "pi_item_id": "PI-ITEM-010",
  "buyer": "699a1234567890abcdefaaaa",
  "buyer_name": "Tech Corp",
  "customer_name": "Tech Corp",
  "item_index": 0,
  "product": "699a1234567890abcdefbbbb",
  "part_number": "COMP-001",
  "product_name": "Electronic Component",
  "total_pi_qty": 100,
  "sell_price": 25.00,
  "allocations": [
    {
      "supplier": "698f6c1ee80d29e8e4730f3c",
      "supplier_name": "Test Electronics Supplier",
      "supplier_code": "SUP-TEST-001",
      "allocated_qty": 50,
      "unit_cost": 18.00,
      "total_cost": 900.00,
      "status": "PENDING",
      "expected_date": "2026-03-01"
    }
  ]
}
```

## 3.5 Update Allocation
```
PUT /api/pi-allocations/:id
```

## 3.6 Delete Allocation
```
DELETE /api/pi-allocations/:id
```

## 3.7 Bulk Save Allocations
```
POST /api/pi-allocations/bulk
```

**Request Body:**
```json
{
  "allocations": [
    {
      "proforma_invoice": "...",
      "item_index": 0,
      ...
    },
    {
      "proforma_invoice": "...",
      "item_index": 1,
      ...
    }
  ]
}
```

## 3.8 Get Allocation Summary
```
GET /api/pi-allocations/summary/stats
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "summary": {
      "total_allocations": 8,
      "by_status": {
        "UNALLOCATED": 2,
        "PARTIAL": 2,
        "ALLOCATED": 4
      },
      "total_value": 50000.00,
      "total_cost": 38000.00,
      "avg_profit_margin": 24.5
    }
  }
}
```

## 3.9 Update Allocation Status
```
PATCH /api/pi-allocations/:id/status
```

**Request Body:**
```json
{
  "allocation_index": 0,
  "status": "ORDERED",
  "spo_number": "SP260010"
}
```

## 3.10 Update Received Quantity
```
PATCH /api/pi-allocations/:id/receive
```

**Request Body:**
```json
{
  "allocation_index": 0,
  "received_qty": 50,
  "received_date": "2026-02-15"
}
```

---

# Module 4: Purchase Dashboard

**Required Permission:** `manage_allocations`

## 4.1 Get Dashboard Summary
```
GET /api/purchase-dashboard/summary
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "summary": {
      "pending_allocations": 15,
      "active_suppliers": 5,
      "orders_in_progress": 8,
      "items_pending_receipt": 120,
      "total_purchase_value": 150000.00,
      "avg_profit_margin": 22.5
    }
  }
}
```

## 4.2 Get Supplier Statistics
```
GET /api/purchase-dashboard/supplier-stats
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "suppliers": [
      {
        "supplier_id": "SUP-00001",
        "supplier_name": "ATS Manufacturing Co.",
        "total_orders": 25,
        "total_value": 75000.00,
        "pending_orders": 5,
        "on_time_rate": 95.5
      }
    ]
  }
}
```

## 4.3 Get Pending Allocations
```
GET /api/purchase-dashboard/pending-allocations
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| limit | number | Number of items (default: 10) |
| priority | string | Filter by priority (HIGH/MEDIUM/LOW) |

## 4.4 Get Allocation Progress
```
GET /api/purchase-dashboard/allocation-progress
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "progress": {
      "total_items": 100,
      "allocated": 65,
      "ordered": 45,
      "received": 30,
      "allocation_rate": 65,
      "fulfillment_rate": 30
    }
  }
}
```

## 4.5 Get Recent Activity
```
GET /api/purchase-dashboard/recent-activity
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| limit | number | Number of activities (default: 20) |
| days | number | Days to look back (default: 7) |

---

# Module 5: Proforma Invoices

## 5.1 Get All PIs
```
GET /api/proforma-invoices
```

## 5.2 Get PI by ID
```
GET /api/proforma-invoices/:id
```

## 5.3 Create PI
```
POST /api/proforma-invoices
```

## 5.4 Update PI
```
PUT /api/proforma-invoices/:id
```

## 5.5 Delete PI
```
DELETE /api/proforma-invoices/:id
```

---

# Module 6: Products

## 6.1 Get All Products
```
GET /api/products
```

## 6.2 Get Product by ID
```
GET /api/products/:id
```

## 6.3 Create Product
```
POST /api/products
```

## 6.4 Update Product
```
PUT /api/products/:id
```

---

# Error Responses

All error responses follow this format:

```json
{
  "status": "error",
  "message": "Error description",
  "stack": "..." // Only in development mode
}
```

**Common Status Codes:**
| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

---

# Enums & Constants

## Supplier Status
```javascript
SUPPLIER_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  BLOCKED: "BLOCKED"
}
```

## Supplier Type
```javascript
SUPPLIER_TYPE = {
  MANUFACTURER: "MANUFACTURER",
  DISTRIBUTOR: "DISTRIBUTOR",
  WHOLESALER: "WHOLESALER"
}
```

## PI Allocation Status (Item Level)
```javascript
PI_ALLOCATION_STATUS = {
  UNALLOCATED: "UNALLOCATED",
  PARTIAL: "PARTIAL",
  ALLOCATED: "ALLOCATED"
}
```

## Allocation Status (Supplier Level)
```javascript
ALLOCATION_STATUS = {
  PENDING: "PENDING",
  ORDERED: "ORDERED",
  PARTIAL_RECEIVED: "PARTIAL_RECEIVED",
  RECEIVED: "RECEIVED",
  CANCELLED: "CANCELLED"
}
```

## User Roles
```javascript
ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  SALES_REP: "SALES_REP",
  PURCHASE_MANAGER: "PURCHASE_MANAGER",
  WAREHOUSE: "WAREHOUSE",
  ACCOUNTS: "ACCOUNTS",
  BUYER: "BUYER"
}
```

## Permissions
```javascript
PERMISSIONS = {
  MANAGE_USERS: "manage_users",
  MANAGE_PRODUCTS: "manage_products",
  MANAGE_QUOTATIONS: "manage_quotations",
  MANAGE_ORDERS: "manage_orders",
  MANAGE_INVOICES: "manage_invoices",
  VIEW_REPORTS: "view_reports",
  MANAGE_SUPPLIERS: "manage_suppliers",
  MANAGE_ALLOCATIONS: "manage_allocations"
}
```

---

# Integration Notes

## Frontend API Service Setup
```javascript
// src/services/api.js
const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## CORS Configuration
Backend allows requests from:
- `http://localhost:3000`
- `http://localhost:5173`
- `http://localhost:5174`
