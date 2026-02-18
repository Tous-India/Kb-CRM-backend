# KB CRM Backend Update Plan
## Purchase Management System Integration

**Date:** 2026-02-13
**Version:** 2.3
**Scope:** Supplier Management & PI Allocation System

---

## 1. GAP ANALYSIS

### Frontend Features vs Backend Implementation

| Feature | Frontend Status | Backend Status | Action Required |
|---------|-----------------|----------------|-----------------|
| Suppliers CRUD | Implemented | **MISSING** | BUILD NEW |
| Supplier Search/Filter | Implemented | **MISSING** | BUILD NEW |
| PI Allocation | Implemented | **MISSING** | BUILD NEW |
| Allocation to Multiple Suppliers | Implemented | **MISSING** | BUILD NEW |
| Purchase Dashboard | Implemented | **MISSING** | BUILD NEW |
| Currency Management | Implemented | Partial (Settings) | UPDATE |

---

## 2. NEW MODULES TO BUILD

### 2.1 Supplier Module (`src/modules/suppliers/`)

#### Files to Create:
```
src/modules/suppliers/
├── suppliers.model.js      # Mongoose schema
├── suppliers.controller.js # Business logic
├── suppliers.routes.js     # API endpoints
└── suppliers.validation.js # Joi validation
```

#### Supplier Schema Design:
```javascript
{
  supplier_id: "SUP-00001",     // Auto-generated
  supplier_code: String,        // Unique, required (e.g., "SUP-TECH-001")
  supplier_name: String,        // Required
  status: "ACTIVE" | "INACTIVE",

  contact: {
    primary_name: String,
    email: String,
    phone: String,
    secondary_email: String
  },

  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String           // Default: "USA"
  },

  business_info: {
    tax_id: String,
    gstin: String,            // For India
    pan: String,              // For India
    registration_no: String
  },

  bank_details: {
    bank_name: String,
    account_name: String,
    account_number: String,
    ifsc_code: String,        // For India
    swift_code: String,
    branch: String
  },

  products_supplied: [String], // Array of product categories/types

  performance: {
    total_orders: Number,
    total_value: Number,
    on_time_delivery_rate: Number,  // Percentage
    quality_rating: Number,          // 0-5
    last_order_date: Date
  },

  created_at: Date,
  updated_at: Date
}
```

#### API Endpoints:
```
GET    /api/suppliers              - List all suppliers (with search/filter)
GET    /api/suppliers/:id          - Get supplier by ID
POST   /api/suppliers              - Create supplier
PUT    /api/suppliers/:id          - Update supplier
DELETE /api/suppliers/:id          - Delete supplier
GET    /api/suppliers/active       - Get only active suppliers
PUT    /api/suppliers/:id/status   - Toggle status (ACTIVE/INACTIVE)
```

---

### 2.2 PI Allocation Module (`src/modules/piAllocations/`)

#### Files to Create:
```
src/modules/piAllocations/
├── piAllocations.model.js      # Mongoose schema
├── piAllocations.controller.js # Business logic
├── piAllocations.routes.js     # API endpoints
└── piAllocations.validation.js # Joi validation
```

#### PI Allocation Schema Design:
```javascript
{
  allocation_id: "ALC-00001",    // Auto-generated

  // Reference to Proforma Invoice
  proforma_invoice: ObjectId,    // ref: ProformaInvoice
  pi_number: String,

  // Customer Info (denormalized for reporting)
  buyer: ObjectId,               // ref: User
  buyer_name: String,

  // Item being allocated
  item_index: Number,            // Index in PI items array
  product: ObjectId,             // ref: Product
  part_number: String,
  product_name: String,

  // Quantities
  total_pi_qty: Number,          // Original qty from PI
  sell_price: Number,            // Price to customer (from PI)

  // Supplier Allocations (up to 3)
  allocations: [{
    supplier: ObjectId,          // ref: Supplier
    supplier_name: String,
    allocated_qty: Number,
    unit_cost: Number,           // Our cost from supplier
    total_cost: Number,
    status: "PENDING" | "ORDERED" | "RECEIVED" | "PARTIAL_RECEIVED",
    spo_number: String,          // Supplier PO number (if generated)
    expected_date: Date,
    received_qty: Number,
    received_date: Date,
    notes: String
  }],

  // Calculated Summary
  summary: {
    total_qty: Number,
    allocated_qty: Number,
    unallocated_qty: Number,
    ordered_qty: Number,
    received_qty: Number,
    allocation_complete: Boolean
  },

  // Profit Tracking
  avg_cost_price: Number,
  total_cost: Number,
  total_sell_value: Number,
  profit_margin: Number,         // Percentage

  created_at: Date,
  updated_at: Date
}
```

#### API Endpoints:
```
GET    /api/pi-allocations                    - List all allocations
GET    /api/pi-allocations/by-pi/:piId        - Get allocations for specific PI
GET    /api/pi-allocations/:id                - Get single allocation
POST   /api/pi-allocations                    - Create allocation
PUT    /api/pi-allocations/:id                - Update allocation
DELETE /api/pi-allocations/:id                - Delete allocation
PUT    /api/pi-allocations/:id/supplier       - Update specific supplier allocation
POST   /api/pi-allocations/bulk               - Bulk create/update allocations
GET    /api/pi-allocations/pending            - Get items needing allocation
GET    /api/pi-allocations/summary            - Get allocation statistics
```

---

### 2.3 Purchase Dashboard Module (`src/modules/purchaseDashboard/`)

#### Files to Create:
```
src/modules/purchaseDashboard/
├── purchaseDashboard.controller.js
└── purchaseDashboard.routes.js
```

#### API Endpoints:
```
GET    /api/purchase-dashboard/summary        - Overall purchase stats
GET    /api/purchase-dashboard/supplier-stats - Supplier statistics
GET    /api/purchase-dashboard/pending-allocations - Items needing allocation
GET    /api/purchase-dashboard/allocation-progress - Allocation completion rates
```

---

## 3. MODELS TO UPDATE

### 3.1 Proforma Invoice Model Update

**File:** `src/modules/proformaInvoices/proformaInvoices.model.js`

**Changes Required:**
```javascript
// ADD to items array schema:
items: [{
  // Existing fields...
  product: ObjectId,
  part_number: String,
  product_name: String,
  quantity: Number,
  unit_price: Number,
  total_price: Number,

  // NEW fields for allocation tracking:
  allocation_status: {
    type: String,
    enum: ['UNALLOCATED', 'PARTIAL', 'ALLOCATED'],
    default: 'UNALLOCATED'
  },
  allocated_qty: {
    type: Number,
    default: 0
  }
}]

// ADD new field to main schema:
allocation_complete: {
  type: Boolean,
  default: false
}
```

---

### 3.2 Constants Update

**File:** `src/constants/index.js`

**Add New Constants:**
```javascript
// Supplier Status
const SUPPLIER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
};

// Allocation Status
const ALLOCATION_STATUS = {
  PENDING: 'PENDING',
  ORDERED: 'ORDERED',
  RECEIVED: 'RECEIVED',
  PARTIAL_RECEIVED: 'PARTIAL_RECEIVED',
  UNALLOCATED: 'UNALLOCATED'
};

// PI Item Allocation Status
const PI_ALLOCATION_STATUS = {
  UNALLOCATED: 'UNALLOCATED',
  PARTIAL: 'PARTIAL',
  ALLOCATED: 'ALLOCATED'
};

// Permissions (add new)
const PERMISSIONS = {
  // ... existing permissions
  manage_suppliers: 'manage_suppliers',
  manage_allocations: 'manage_allocations'
};
```

---

## 4. ROUTES REGISTRATION

### Update Main Router

**File:** `src/routes.js`

**Add:**
```javascript
const suppliersRoutes = require('./modules/suppliers/suppliers.routes');
const piAllocationsRoutes = require('./modules/piAllocations/piAllocations.routes');
const purchaseDashboardRoutes = require('./modules/purchaseDashboard/purchaseDashboard.routes');

// Register new routes
router.use('/suppliers', suppliersRoutes);
router.use('/pi-allocations', piAllocationsRoutes);
router.use('/purchase-dashboard', purchaseDashboardRoutes);
```

---

## 5. IMPLEMENTATION ORDER

### Phase 1: Foundation (Priority: HIGH)
1. Update `src/constants/index.js` with new enums
2. Create Supplier model and schema
3. Create Supplier controller with CRUD operations
4. Create Supplier routes and validation
5. Register Supplier routes in main router
6. Test Supplier endpoints

### Phase 2: Allocation System (Priority: HIGH)
1. Update Proforma Invoice model with allocation fields
2. Create PI Allocation model and schema
3. Create PI Allocation controller
4. Create PI Allocation routes and validation
5. Register routes
6. Test allocation endpoints

### Phase 3: Dashboard (Priority: MEDIUM)
1. Create Purchase Dashboard controller
2. Create aggregation queries for statistics
3. Create routes
4. Register routes
5. Test dashboard endpoints

### Phase 4: Integration Testing (Priority: HIGH)
1. Test complete flow: PI -> Allocation -> Supplier
2. Verify quantity calculations
3. Test multiple supplier allocation per item
4. Test allocation status updates

---

## 6. DATA FLOW VERIFICATION

### Current Flow (Working):
```
Buyer creates PO -> Admin converts to Quote -> Buyer accepts ->
Admin creates PI -> Admin creates Order -> Admin creates Invoice
```

### New Flow Addition:
```
Admin creates PI ->
  Admin opens PI Allocation page ->
  Admin allocates items to suppliers (1-3 per item) ->
  Admin generates Supplier POs (PDF) ->
  Admin tracks receiving from suppliers ->
  Admin proceeds with dispatch to customer
```

---

## 7. FRONTEND-BACKEND MAPPING

### Suppliers Page Mapping:
| Frontend Action | API Call | Backend Handler |
|-----------------|----------|-----------------|
| Load suppliers | GET /suppliers | suppliers.controller.getAll |
| Search/Filter | GET /suppliers?search=&status= | suppliers.controller.getAll |
| Add supplier | POST /suppliers | suppliers.controller.create |
| Edit supplier | PUT /suppliers/:id | suppliers.controller.update |
| Delete supplier | DELETE /suppliers/:id | suppliers.controller.delete |
| View details | GET /suppliers/:id | suppliers.controller.getById |

### PI Allocation Page Mapping:
| Frontend Action | API Call | Backend Handler |
|-----------------|----------|-----------------|
| Load PIs | GET /proforma-invoices | existing |
| Load active suppliers | GET /suppliers/active | suppliers.controller.getActive |
| Save allocation | POST /pi-allocations | piAllocations.controller.create |
| Update allocation | PUT /pi-allocations/:id | piAllocations.controller.update |
| Get PI allocations | GET /pi-allocations/by-pi/:id | piAllocations.controller.getByPi |

### Purchase Dashboard Mapping:
| Frontend Widget | API Call | Backend Handler |
|-----------------|----------|-----------------|
| Active suppliers count | GET /purchase-dashboard/summary | purchaseDashboard.getSummary |
| Pending allocations | GET /purchase-dashboard/pending-allocations | purchaseDashboard.getPending |
| Allocation progress | GET /purchase-dashboard/allocation-progress | purchaseDashboard.getProgress |

---

## 8. VALIDATION RULES

### Supplier Validation:
- `supplier_code`: Required, unique, alphanumeric with hyphens
- `supplier_name`: Required, min 2 chars
- `contact.email`: Valid email format
- `contact.phone`: Valid phone format
- `status`: Must be ACTIVE or INACTIVE

### Allocation Validation:
- `proforma_invoice`: Required, valid ObjectId
- `allocations[].allocated_qty`: Required, positive number
- `allocations[].allocated_qty` sum <= `total_pi_qty`
- Max 3 suppliers per item allocation

---

## 9. FILES TO CREATE (COMPLETE LIST)

```
src/modules/suppliers/
├── suppliers.model.js
├── suppliers.controller.js
├── suppliers.routes.js
└── suppliers.validation.js

src/modules/piAllocations/
├── piAllocations.model.js
├── piAllocations.controller.js
├── piAllocations.routes.js
└── piAllocations.validation.js

src/modules/purchaseDashboard/
├── purchaseDashboard.controller.js
└── purchaseDashboard.routes.js
```

---

## 10. FILES TO UPDATE (COMPLETE LIST)

```
src/constants/index.js           - Add new enums and permissions
src/routes.js                    - Register new module routes
src/modules/proformaInvoices/proformaInvoices.model.js - Add allocation fields
```

---

## 11. TESTING CHECKLIST

- [ ] Supplier CRUD operations
- [ ] Supplier search and filter
- [ ] Supplier status toggle
- [ ] PI Allocation create/update
- [ ] Multi-supplier allocation (up to 3)
- [ ] Allocation quantity validation
- [ ] Allocation status updates
- [ ] Purchase dashboard statistics
- [ ] Integration with existing PI flow
- [ ] Permission checks for new endpoints

---

## 12. NOTES

1. **Frontend currently uses localStorage** for allocations - backend will persist this properly
2. **Supplier PDF generation** happens on frontend - no backend changes needed
3. **Currency management** can use existing Settings model
4. **All new endpoints** should require admin authentication
5. **Consider adding** audit logging for allocation changes

---

## 13. IMPLEMENTATION STATUS

### Completed Tasks (2026-02-13):

| Task | Status | Files Created/Updated |
|------|--------|----------------------|
| Constants Update | DONE | `src/constants/index.js` |
| Supplier Model | DONE | `src/modules/suppliers/suppliers.model.js` |
| Supplier Controller | DONE | `src/modules/suppliers/suppliers.controller.js` |
| Supplier Routes | DONE | `src/modules/suppliers/suppliers.routes.js` |
| PI Allocation Model | DONE | `src/modules/piAllocations/piAllocations.model.js` |
| PI Allocation Controller | DONE | `src/modules/piAllocations/piAllocations.controller.js` |
| PI Allocation Routes | DONE | `src/modules/piAllocations/piAllocations.routes.js` |
| Purchase Dashboard Controller | DONE | `src/modules/purchaseDashboard/purchaseDashboard.controller.js` |
| Purchase Dashboard Routes | DONE | `src/modules/purchaseDashboard/purchaseDashboard.routes.js` |
| Proforma Invoice Model Update | DONE | `src/modules/proformaInvoices/proformaInvoices.model.js` |
| Main Router Update | DONE | `src/routes.js` |

### New API Endpoints Available:

**Suppliers:**
- `GET /api/suppliers` - List all suppliers with search/filter
- `GET /api/suppliers/active` - Get active suppliers only
- `GET /api/suppliers/:id` - Get supplier by ID
- `POST /api/suppliers` - Create new supplier
- `PUT /api/suppliers/:id` - Update supplier
- `PUT /api/suppliers/:id/status` - Toggle supplier status
- `PUT /api/suppliers/:id/performance` - Update performance metrics
- `DELETE /api/suppliers/:id` - Soft delete supplier

**PI Allocations:**
- `GET /api/pi-allocations` - List all allocations
- `GET /api/pi-allocations/pending` - Get items needing allocation
- `GET /api/pi-allocations/summary` - Get allocation statistics
- `GET /api/pi-allocations/by-pi/:piId` - Get allocations for specific PI
- `GET /api/pi-allocations/:id` - Get single allocation
- `POST /api/pi-allocations` - Create/update allocation
- `POST /api/pi-allocations/bulk` - Bulk create/update allocations
- `PUT /api/pi-allocations/:id` - Update allocation
- `PUT /api/pi-allocations/:id/supplier/:supplierId` - Update supplier allocation
- `DELETE /api/pi-allocations/:id` - Delete allocation

**Purchase Dashboard:**
- `GET /api/purchase-dashboard/summary` - Overall purchase stats
- `GET /api/purchase-dashboard/supplier-stats` - Supplier statistics
- `GET /api/purchase-dashboard/pending-allocations` - Items needing allocation
- `GET /api/purchase-dashboard/allocation-progress` - Allocation progress
- `GET /api/purchase-dashboard/recent-activity` - Recent activity

### New Permissions Added:
- `manage_suppliers` - Required for supplier CRUD operations
- `manage_allocations` - Required for PI allocation operations

### Next Steps:
1. Start the backend server and test the new endpoints
2. Update frontend API services to use real backend instead of localStorage
3. Add the new permissions to existing admin users
4. Test the complete flow from PI to Allocation to Supplier
