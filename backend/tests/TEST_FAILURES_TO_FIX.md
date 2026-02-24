# Test Failures Documentation

## Overview

**Current Status:** 884 passing / 926 total (95.5% pass rate)
**Remaining Failures:** 42 tests

This document tracks the remaining test failures that need to be resolved.

---

## Categories of Failures

### 1. Email Service Errors (500 responses)

These failures occur because the email service attempts to send emails during tests but fails due to missing SMTP configuration in the test environment.

**Affected Tests:**
- `users.test.js` - "should reject already rejected user" (line 546)
- `quotations.test.js` - Accept/reject quotation tests
- `proformaInvoices.test.js` - Approval workflow tests

**Root Cause:**
The controllers call email functions (e.g., `sendBuyerRejectionEmail`, `sendQuotationEmail`) which fail in the test environment, causing unhandled 500 errors instead of the expected 400 responses.

**Solution Options:**
1. Mock the email service in tests:
```javascript
jest.mock('../../src/utils/emailService.js', () => ({
  sendBuyerRejectionEmail: jest.fn().mockResolvedValue(true),
  sendBuyerApprovalEmail: jest.fn().mockResolvedValue(true),
  sendQuotationEmail: jest.fn().mockResolvedValue(true),
  // ... other email functions
}));
```

2. Or add better error handling in controllers to ensure email failures don't cause 500 errors.

---

### 2. Payment Records Tests (All failing)

**Affected Tests:**
- GET /api/payment-records (admin fetch)
- GET /api/payment-records (filter by status)
- GET /api/payment-records (reject buyer requests)
- GET /api/payment-records/pending
- GET /api/payment-records/my
- GET /api/payment-records/:id
- POST /api/payment-records
- PUT /api/payment-records/:id/verify
- PUT /api/payment-records/:id/reject
- Payment Record Data Integrity tests

**Root Cause:**
Need to verify the actual route structure and controller response format. The routes may be different from what's expected in tests.

**Action Required:**
1. Check `src/modules/paymentRecords/paymentRecords.routes.js` for actual route paths
2. Check controller response format
3. Update test file accordingly

---

### 3. Dashboard Tests (All failing)

**Affected Tests:**
- GET /api/dashboard (admin summary)
- GET /api/dashboard/buyer (buyer stats)
- GET /api/dashboard/buyer/recent-orders

**Root Cause:**
Dashboard endpoints may require specific data setup or have different response formats.

**Action Required:**
1. Check `src/modules/dashboard/dashboard.routes.js`
2. Verify required data setup in beforeEach
3. Check response format expectations

---

### 4. Proforma Invoice Tests

**Affected Tests:**
- GET /api/proforma-invoices/:id - 404 error
- POST /api/proforma-invoices - Expected 201, got 400
- PUT /api/proforma-invoices/:id - Expected 200, got 400
- PUT /api/proforma-invoices/:id/approve - failing

**Root Cause:**
- Create PI requires valid quotation reference
- Update requires valid PI and proper data format
- Approval workflow may have prerequisites

**Action Required:**
1. Create proper quotation fixture in beforeEach
2. Verify required fields for PI creation
3. Check PI approval prerequisites

---

### 5. Dispatch Tests

**Affected Tests:**
- GET /api/dispatches (filter by status) - getting false instead of true
- POST /api/dispatches - Expected 201, got 200
- PUT /api/dispatches/:id - 404 error
- PUT /api/dispatches/:id/status - 404 error
- GET /api/dispatches/summary - Expected 200, got 400
- Dispatch Data Integrity - status undefined

**Root Cause:**
- Response status code differences (200 vs 201)
- Route paths may differ
- Missing required data setup

**Action Required:**
1. Check dispatch routes and controller responses
2. Verify dispatch creation requirements
3. Update test expectations

---

### 6. Categories Sub-categories Tests

**Affected Tests:**
- POST /api/categories/:id/subcategories - Expected 200, got 201 (already fixed route, might be status code)
- PUT /api/categories/:id/subcategories/:subId
- DELETE /api/categories/:id/subcategories/:subId

**Root Cause:**
The subcategory routes return 201 for create, but tests expect 200.

**Fix:**
```javascript
// Change in test:
expect(res.status).toBe(201);  // Instead of 200 for POST
```

---

## Quick Fixes Checklist

### High Priority (Easy Fixes)

- [ ] Mock email service in test setup
- [ ] Fix status code expectations (201 vs 200)
- [ ] Update route paths in payment records tests

### Medium Priority

- [ ] Add proper data fixtures for PI tests
- [ ] Set up dashboard test prerequisites
- [ ] Fix dispatch test expectations

### Low Priority

- [ ] Review all 500 error cases for proper error handling

---

## Files to Review

| File | Issue Count | Priority |
|------|-------------|----------|
| `tests/integration/paymentRecords.test.js` | 11 | High |
| `tests/integration/dashboard.test.js` | 3 | Medium |
| `tests/integration/proformaInvoices.test.js` | 4 | Medium |
| `tests/integration/dispatches.test.js` | 6 | Medium |
| `tests/integration/users.test.js` | 1 | Low |
| `tests/integration/quotations.test.js` | 5+ | Medium |
| `tests/integration/categories.test.js` | 3 | Low |

---

## Recommended Test Setup Improvements

### 1. Add Email Service Mock to setup.js

```javascript
// In tests/setup.js
jest.mock('../src/utils/emailService.js', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
  sendBuyerApprovalEmail: jest.fn().mockResolvedValue(true),
  sendBuyerRejectionEmail: jest.fn().mockResolvedValue(true),
  sendQuotationEmail: jest.fn().mockResolvedValue(true),
  sendProformaEmail: jest.fn().mockResolvedValue(true),
  sendInvoiceEmail: jest.fn().mockResolvedValue(true),
  sendDispatchEmail: jest.fn().mockResolvedValue(true),
  sendPaymentConfirmationEmail: jest.fn().mockResolvedValue(true),
  sendAdminNewRegistrationEmail: jest.fn().mockResolvedValue(true),
  verifyConnection: jest.fn().mockResolvedValue(true),
}));
```

### 2. Create Comprehensive Fixtures

Create fixture files for:
- `tests/fixtures/proformaInvoices.fixture.js`
- `tests/fixtures/dispatches.fixture.js`
- `tests/fixtures/paymentRecords.fixture.js`

---

## Commands to Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/integration/paymentRecords.test.js

# Run with verbose output
npm test -- --verbose

# Run with coverage
npm run test:coverage
```

---

## Notes

- The 500 errors typically indicate unhandled exceptions in controllers, often from email service failures
- Many tests expect specific response formats - always check the actual controller response
- Some routes use soft delete (is_active = false) instead of hard delete
- Cart model uses `user` field, not `buyer`
- Product stock_status values are "In Stock", "Low Stock", "Out of Stock" (with spaces)

---

*Last Updated: 2026-02-21*
*Pass Rate: 95.5% (884/926)*
