# KB CRM Backend Test Cases

## Overview

This document outlines all test cases for the KB CRM backend API. Tests are organized by module and cover unit tests, integration tests, and end-to-end scenarios.

---

## Test Stack

- **Test Framework**: Jest
- **HTTP Testing**: Supertest
- **Database**: MongoDB Memory Server (for isolated testing)
- **Mocking**: Jest mocks

---

## Test Structure

```
test-backend/
├── tests/
│   ├── setup.js                 # Test setup and teardown
│   ├── fixtures/                # Test data
│   │   ├── users.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   └── ...
│   ├── unit/                    # Unit tests
│   │   ├── models/
│   │   ├── utils/
│   │   └── validators/
│   ├── integration/             # Integration tests
│   │   ├── auth.test.js
│   │   ├── users.test.js
│   │   ├── products.test.js
│   │   ├── orders.test.js
│   │   ├── invoices.test.js
│   │   ├── quotations.test.js
│   │   ├── payments.test.js
│   │   └── statements.test.js
│   └── e2e/                     # End-to-end tests
│       ├── orderFlow.test.js
│       ├── paymentFlow.test.js
│       └── quotationFlow.test.js
```

---

## 1. Authentication Tests (`auth.test.js`)

### 1.1 User Registration

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| AUTH-001 | Register buyer with valid data | Valid buyer data | 201, user created, JWT token | High |
| AUTH-002 | Register with existing email | Duplicate email | 400, "Email already exists" | High |
| AUTH-003 | Register with invalid email format | "invalid-email" | 400, validation error | Medium |
| AUTH-004 | Register with short password | Password < 6 chars | 400, "Password must be at least 6 characters" | Medium |
| AUTH-005 | Register with missing required fields | Empty name/email | 400, validation errors | High |
| AUTH-006 | Register with invalid phone format | "abc123" | 400, validation error | Low |
| AUTH-007 | Register admin (should fail for public) | role: "ADMIN" | 403, "Cannot register as admin" | High |

### 1.2 User Login

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| AUTH-008 | Login with valid credentials | Correct email/password | 200, JWT token, user data | High |
| AUTH-009 | Login with wrong password | Incorrect password | 401, "Invalid credentials" | High |
| AUTH-010 | Login with non-existent email | Unknown email | 401, "Invalid credentials" | High |
| AUTH-011 | Login with inactive account | Deactivated user | 403, "Account is deactivated" | Medium |
| AUTH-012 | Login updates last_login timestamp | Valid credentials | last_login updated | Low |
| AUTH-013 | Login with empty credentials | Empty email/password | 400, validation error | Medium |

### 1.3 Token & Session

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| AUTH-014 | Access protected route with valid token | Valid JWT | 200, access granted | High |
| AUTH-015 | Access protected route without token | No token | 401, "No token provided" | High |
| AUTH-016 | Access protected route with expired token | Expired JWT | 401, "Token expired" | High |
| AUTH-017 | Access protected route with invalid token | Malformed JWT | 401, "Invalid token" | High |
| AUTH-018 | Refresh token generates new access token | Valid refresh token | 200, new access token | Medium |
| AUTH-019 | Logout invalidates token | Valid token | 200, token invalidated | Medium |

### 1.4 Password Management

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| AUTH-020 | Forgot password with valid email | Registered email | 200, reset email sent | Medium |
| AUTH-021 | Forgot password with unknown email | Unknown email | 200 (no user leak) | Medium |
| AUTH-022 | Reset password with valid token | Valid reset token | 200, password updated | Medium |
| AUTH-023 | Reset password with expired token | Expired token | 400, "Token expired" | Medium |
| AUTH-024 | Update password with correct old password | Correct old password | 200, password updated | Medium |
| AUTH-025 | Update password with wrong old password | Wrong old password | 400, "Current password incorrect" | Medium |

---

## 2. User Management Tests (`users.test.js`)

### 2.1 Get Users (Admin Only)

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| USER-001 | Get all users as admin | Admin token | 200, users array | High |
| USER-002 | Get all users as buyer | Buyer token | 403, "Access denied" | High |
| USER-003 | Get users with pagination | page=2, limit=10 | 200, paginated results | Medium |
| USER-004 | Get users filtered by role | role=BUYER | 200, only buyers | Medium |
| USER-005 | Get users with search query | search="john" | 200, filtered results | Medium |
| USER-006 | Get single user by ID | Valid user ID | 200, user object | High |
| USER-007 | Get user with invalid ID | Invalid ID | 404, "User not found" | Medium |

### 2.2 Create User (Admin Only)

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| USER-008 | Create buyer as admin | Valid buyer data | 201, user created | High |
| USER-009 | Create admin as admin | Valid admin data | 201, admin created | High |
| USER-010 | Create user with duplicate email | Existing email | 400, "Email exists" | High |
| USER-011 | Create user without required fields | Missing fields | 400, validation errors | Medium |

### 2.3 Update User

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| USER-012 | Update user profile (self) | Own profile data | 200, user updated | High |
| USER-013 | Update other user as admin | Other user data | 200, user updated | High |
| USER-014 | Update other user as buyer | Other user data | 403, "Access denied" | High |
| USER-015 | Update with invalid email format | Invalid email | 400, validation error | Medium |
| USER-016 | Update company details | Company data | 200, company updated | Medium |

### 2.4 Delete/Deactivate User

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| USER-017 | Deactivate user as admin | User ID | 200, user deactivated | High |
| USER-018 | Activate user as admin | User ID | 200, user activated | High |
| USER-019 | Delete user as admin | User ID | 200, user soft deleted | Medium |
| USER-020 | Cannot delete self as admin | Own ID | 400, "Cannot delete self" | Medium |

---

## 3. Product Management Tests (`products.test.js`)

### 3.1 Get Products

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| PROD-001 | Get all products | None | 200, products array | High |
| PROD-002 | Get products with pagination | page=1, limit=10 | 200, paginated results | Medium |
| PROD-003 | Get product by ID | Valid product ID | 200, product object | High |
| PROD-004 | Get product with invalid ID | Invalid ID | 404, "Product not found" | Medium |
| PROD-005 | Search products by name | search="wire" | 200, matching products | High |
| PROD-006 | Search products by part number | part_number="ATS" | 200, matching products | High |
| PROD-007 | Filter products by category | category="Hardware" | 200, filtered products | Medium |
| PROD-008 | Filter products by brand | brand="ACF-50" | 200, filtered products | Medium |
| PROD-009 | Filter products by price range | min=100, max=500 | 200, filtered products | Medium |
| PROD-010 | Filter products in stock | in_stock=true | 200, in-stock products | Medium |

### 3.2 Create Product (Admin Only)

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| PROD-011 | Create product with valid data | Valid product data | 201, product created | High |
| PROD-012 | Create product as buyer | Valid product data | 403, "Access denied" | High |
| PROD-013 | Create product with duplicate part number | Existing part_number | 400, "Part number exists" | High |
| PROD-014 | Create product without required fields | Missing fields | 400, validation errors | Medium |
| PROD-015 | Create product with negative price | price=-100 | 400, "Price must be positive" | Medium |
| PROD-016 | Create product with invalid category | Non-existent category | 400, "Invalid category" | Medium |

### 3.3 Update Product (Admin Only)

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| PROD-017 | Update product details | Valid updates | 200, product updated | High |
| PROD-018 | Update product inventory | New quantities | 200, inventory updated | High |
| PROD-019 | Update product as buyer | Valid updates | 403, "Access denied" | High |
| PROD-020 | Update non-existent product | Invalid ID | 404, "Product not found" | Medium |
| PROD-021 | Update with negative inventory | quantity=-5 | 400, "Quantity must be positive" | Medium |

### 3.4 Product Images

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| PROD-022 | Upload product image | Valid image file | 200, image uploaded | High |
| PROD-023 | Upload multiple images | Multiple files | 200, images uploaded | Medium |
| PROD-024 | Upload invalid file type | .exe file | 400, "Invalid file type" | High |
| PROD-025 | Upload oversized image | >5MB file | 400, "File too large" | Medium |
| PROD-026 | Delete product image | Image ID | 200, image deleted | Medium |
| PROD-027 | Set main product image | Image ID | 200, main image set | Medium |

### 3.5 Delete Product (Admin Only)

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| PROD-028 | Delete product | Product ID | 200, product deleted | High |
| PROD-029 | Delete product with active orders | Product ID | 400, "Product in active orders" | Medium |
| PROD-030 | Delete as buyer | Product ID | 403, "Access denied" | High |

---

## 4. Category Tests (`categories.test.js`)

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| CAT-001 | Get all categories | None | 200, categories array | High |
| CAT-002 | Get category by ID | Valid ID | 200, category with subcategories | High |
| CAT-003 | Create category as admin | Valid data | 201, category created | High |
| CAT-004 | Create category as buyer | Valid data | 403, "Access denied" | High |
| CAT-005 | Create duplicate category | Existing name | 400, "Category exists" | Medium |
| CAT-006 | Update category | Valid updates | 200, category updated | Medium |
| CAT-007 | Delete category | Category ID | 200, category deleted | Medium |
| CAT-008 | Delete category with products | Category ID | 400, "Category has products" | Medium |
| CAT-009 | Add subcategory | Subcategory data | 200, subcategory added | Medium |
| CAT-010 | Update subcategory | Subcategory data | 200, subcategory updated | Low |
| CAT-011 | Delete subcategory | Subcategory ID | 200, subcategory deleted | Low |

---

## 5. Brand Tests (`brands.test.js`)

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| BRN-001 | Get all brands | None | 200, brands array | High |
| BRN-002 | Get brand by ID | Valid ID | 200, brand object | High |
| BRN-003 | Create brand as admin | Valid data | 201, brand created | High |
| BRN-004 | Create brand as buyer | Valid data | 403, "Access denied" | High |
| BRN-005 | Create duplicate brand | Existing name | 400, "Brand exists" | Medium |
| BRN-006 | Update brand | Valid updates | 200, brand updated | Medium |
| BRN-007 | Delete brand | Brand ID | 200, brand deleted | Medium |
| BRN-008 | Delete brand with products | Brand ID | 400, "Brand has products" | Medium |

---

## 6. Order Management Tests (`orders.test.js`)

### 6.1 Get Orders

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| ORD-001 | Get all orders as admin | Admin token | 200, all orders | High |
| ORD-002 | Get own orders as buyer | Buyer token | 200, buyer's orders only | High |
| ORD-003 | Get open orders | status=OPEN | 200, open orders | High |
| ORD-004 | Get dispatched orders | status=DISPATCHED | 200, dispatched orders | High |
| ORD-005 | Get order by ID | Valid order ID | 200, order with details | High |
| ORD-006 | Get other buyer's order as buyer | Other's order ID | 403, "Access denied" | High |
| ORD-007 | Filter orders by date range | start_date, end_date | 200, filtered orders | Medium |
| ORD-008 | Filter orders by buyer | customer_id | 200, buyer's orders | Medium |
| ORD-009 | Filter orders by payment status | payment_status=PAID | 200, paid orders | Medium |

### 6.2 Create Order

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| ORD-010 | Create order with valid data | Valid order data | 201, order created | High |
| ORD-011 | Create order with empty items | No items | 400, "Items required" | High |
| ORD-012 | Create order with invalid product | Non-existent product | 400, "Product not found" | High |
| ORD-013 | Create order exceeding inventory | quantity > stock | 400, "Insufficient stock" | High |
| ORD-014 | Create order auto-calculates totals | Items with prices | 201, correct subtotal/tax/total | High |
| ORD-015 | Create order sets initial status | Valid data | 201, status=OPEN, payment_status=UNPAID | High |

### 6.3 Update Order

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| ORD-016 | Update order details as admin | Valid updates | 200, order updated | High |
| ORD-017 | Update order as buyer | Valid updates | 403, "Access denied" | High |
| ORD-018 | Update dispatched order items | Item changes | 400, "Cannot modify dispatched order" | Medium |
| ORD-019 | Update order notes | New notes | 200, notes updated | Low |
| ORD-020 | Update shipping address | New address | 200, address updated | Medium |

### 6.4 Order Payment Recording

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| ORD-021 | Record full payment in USD | Full amount USD | 200, payment_status=PAID | High |
| ORD-022 | Record partial payment | Partial amount | 200, payment_status=PARTIAL | High |
| ORD-023 | Record payment in INR | Amount in INR | 200, converted to USD | High |
| ORD-024 | Record payment exceeding total | Over-payment | 200, credit noted | Medium |
| ORD-025 | Payment adds to payment_history | Payment data | 200, history entry added | High |
| ORD-026 | Payment updates payment_received | Amount | 200, payment_received incremented | High |
| ORD-027 | Record payment with transaction ID | Valid transaction | 200, transaction ID saved | Medium |

### 6.5 Order Dispatch

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| ORD-028 | Dispatch order with full payment | Paid order | 200, status=DISPATCHED | High |
| ORD-029 | Dispatch order without payment | Unpaid order | 400, "Payment required" | High |
| ORD-030 | Dispatch with dispatch info | Courier, tracking | 200, dispatch_info saved | High |
| ORD-031 | Dispatch without dispatch date | No date | 200, uses current date | Medium |
| ORD-032 | Update dispatch info after dispatch | New tracking number | 200, dispatch_info updated | High |
| ORD-033 | Update courier service | New courier | 200, courier updated | Medium |

### 6.6 Order Status

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| ORD-034 | Update status to DELIVERED | status=DELIVERED | 200, status updated | Medium |
| ORD-035 | Cancel open order | status=CANCELLED | 200, order cancelled | Medium |
| ORD-036 | Cancel dispatched order | Dispatched order | 400, "Cannot cancel dispatched" | Medium |
| ORD-037 | Revert DELIVERED to DISPATCHED | status=DISPATCHED | 400, "Invalid status change" | Low |

### 6.7 Inventory Impact

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| ORD-038 | Order creation reduces inventory | Order with items | Inventory decremented | High |
| ORD-039 | Order cancellation restores inventory | Cancel order | Inventory restored | High |
| ORD-040 | Partial cancellation updates inventory | Remove item | Item inventory restored | Medium |

---

## 7. Invoice Tests (`invoices.test.js`)

### 7.1 Get Invoices

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| INV-001 | Get all invoices as admin | Admin token | 200, all invoices | High |
| INV-002 | Get own invoices as buyer | Buyer token | 200, buyer's invoices | High |
| INV-003 | Get invoice by ID | Valid ID | 200, invoice details | High |
| INV-004 | Filter invoices by status | status=UNPAID | 200, unpaid invoices | Medium |
| INV-005 | Filter invoices by date range | Date range | 200, filtered invoices | Medium |

### 7.2 Create Invoice

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| INV-006 | Create invoice from order | Order ID | 201, invoice created | High |
| INV-007 | Create invoice without order | No order_id | 400, "Order required" | Medium |
| INV-008 | Create duplicate invoice for order | Same order | 400, "Invoice exists for order" | Medium |
| INV-009 | Invoice number auto-generated | Valid data | 201, unique invoice_number | High |
| INV-010 | Invoice copies order items | Order ID | 201, items match order | High |

### 7.3 Manual Invoice

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| INV-011 | Create manual invoice | Custom items | 201, invoice created | High |
| INV-012 | Manual invoice without customer | No customer_id | 400, "Customer required" | Medium |
| INV-013 | Manual invoice calculates totals | Items with prices | 201, correct totals | High |
| INV-014 | Manual invoice with custom tax | Custom tax rate | 201, custom tax applied | Medium |

### 7.4 Invoice Status

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| INV-015 | Mark invoice as paid | status=PAID | 200, status updated | High |
| INV-016 | Mark invoice as partial | Partial payment | 200, status=PARTIAL | Medium |
| INV-017 | Auto-mark overdue invoices | Past due_date | Status=OVERDUE | Medium |
| INV-018 | Update payment date on paid | Mark paid | 200, payment_date set | Medium |

### 7.5 Invoice PDF

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| INV-019 | Download invoice PDF | Invoice ID | 200, PDF file | High |
| INV-020 | PDF contains correct data | Invoice ID | PDF with all details | Medium |
| INV-021 | PDF for non-existent invoice | Invalid ID | 404, "Invoice not found" | Medium |

---

## 8. Proforma Invoice Tests (`proforma.test.js`)

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| PI-001 | Get all proforma invoices | Admin token | 200, all proformas | High |
| PI-002 | Get proforma by ID | Valid ID | 200, proforma details | High |
| PI-003 | Create proforma from quotation | Quotation ID | 201, proforma created | High |
| PI-004 | Create proforma directly | Valid data | 201, proforma created | Medium |
| PI-005 | Approve proforma | Proforma ID | 200, status=APPROVED | High |
| PI-006 | Reject proforma | Proforma ID | 200, status=REJECTED | High |
| PI-007 | Convert proforma to order | Approved proforma | 201, order created | High |
| PI-008 | Convert non-approved proforma | Pending proforma | 400, "Must be approved" | Medium |
| PI-009 | Proforma expiry check | Expired proforma | status=EXPIRED | Medium |
| PI-010 | Download proforma PDF | Proforma ID | 200, PDF file | Medium |

---

## 9. Quotation Tests (`quotations.test.js`)

### 9.1 Get Quotations

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| QUO-001 | Get all quotations as admin | Admin token | 200, all quotations | High |
| QUO-002 | Get own quotations as buyer | Buyer token | 200, buyer's quotes | High |
| QUO-003 | Get quotation by ID | Valid ID | 200, quotation details | High |
| QUO-004 | Filter by status | status=PENDING | 200, pending quotes | Medium |

### 9.2 Create Quotation

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| QUO-005 | Create quotation as admin | Valid data | 201, quotation created | High |
| QUO-006 | Create quotation as buyer | Valid data | 201, quotation request | Medium |
| QUO-007 | Quote number auto-generated | Valid data | 201, unique quote_number | High |
| QUO-008 | Quotation with expiry date | Valid data | 201, expiry_date set | Medium |
| QUO-009 | Quotation calculates totals | Items | 201, correct totals | High |

### 9.3 Quotation Actions

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| QUO-010 | Accept quotation | Quote ID | 200, status=ACCEPTED | High |
| QUO-011 | Reject quotation | Quote ID | 200, status=REJECTED | High |
| QUO-012 | Accept expired quotation | Expired quote | 400, "Quotation expired" | Medium |
| QUO-013 | Convert quote to proforma | Accepted quote | 201, proforma created | High |
| QUO-014 | Convert quote to order | Paid quote | 201, order created | High |
| QUO-015 | Mark quotation as paid | Quote ID | 200, status=PAID | Medium |

### 9.4 Quotation Expiry

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| QUO-016 | Auto-expire old quotations | Past expiry | status=EXPIRED | Medium |
| QUO-017 | Extend quotation validity | New expiry date | 200, expiry updated | Low |

---

## 10. Payment Tests (`payments.test.js`)

### 10.1 Get Payments

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| PAY-001 | Get all payments as admin | Admin token | 200, all payments | High |
| PAY-002 | Get own payments as buyer | Buyer token | 200, buyer's payments | High |
| PAY-003 | Get payment by ID | Valid ID | 200, payment details | High |
| PAY-004 | Get pending payments | status=PENDING | 200, pending payments | Medium |
| PAY-005 | Get payments by customer | Customer ID | 200, customer payments | Medium |
| PAY-006 | Get payments by date range | Date range | 200, filtered payments | Medium |

### 10.2 Record Payment

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| PAY-007 | Record payment for invoice | Invoice ID, amount | 201, payment recorded | High |
| PAY-008 | Record payment with transaction ID | Transaction data | 201, transaction saved | High |
| PAY-009 | Record payment in INR | INR amount | 201, USD conversion | High |
| PAY-010 | Record credit card payment | method=Credit Card | 201, method saved | Medium |
| PAY-011 | Record wire transfer | method=Wire Transfer | 201, method saved | Medium |
| PAY-012 | Record check payment | method=Check | 201, method saved | Medium |
| PAY-013 | Record UPI payment | method=UPI | 201, method saved | Medium |

### 10.3 Payment Status

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| PAY-014 | Mark payment completed | status=COMPLETED | 200, status updated | High |
| PAY-015 | Mark payment failed | status=FAILED | 200, status updated | Medium |
| PAY-016 | Refund payment | status=REFUNDED | 200, refund recorded | Medium |

### 10.4 Payment Impact

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| PAY-017 | Payment updates invoice status | Full payment | Invoice status=PAID | High |
| PAY-018 | Partial payment updates invoice | Partial amount | Invoice status=PARTIAL | High |
| PAY-019 | Payment updates order payment_received | Amount | Order payment updated | High |
| PAY-020 | Payment creates statement transaction | Payment | Transaction entry created | High |

---

## 11. Statement Tests (`statements.test.js`)

### 11.1 Get Statements

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| STM-001 | Get all statements as admin | Admin token | 200, all statements | High |
| STM-002 | Get own statement as buyer | Buyer token | 200, buyer's statement | High |
| STM-003 | Get statement by customer ID | Customer ID | 200, customer statement | High |
| STM-004 | Get all transactions | Admin token | 200, all transactions | High |
| STM-005 | Filter transactions by month | Month/Year | 200, monthly transactions | High |
| STM-006 | Filter transactions by buyer | Buyer ID | 200, buyer transactions | High |

### 11.2 Generate Statement

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| STM-007 | Generate monthly statement | Customer, period | 201, statement generated | High |
| STM-008 | Statement calculates balances | Transactions | Correct opening/closing | High |
| STM-009 | Statement includes all invoices | Customer invoices | All invoices in transactions | High |
| STM-010 | Statement includes all payments | Customer payments | All payments in transactions | High |
| STM-011 | Statement calculates aging | Overdue invoices | Correct 30/60/90 day aging | Medium |

### 11.3 Transaction Tracking

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| STM-012 | Invoice creates INVOICE transaction | New invoice | Transaction type=INVOICE | High |
| STM-013 | Payment creates PAYMENT transaction | New payment | Transaction type=PAYMENT | High |
| STM-014 | Credit creates CREDIT transaction | Credit issued | Transaction type=CREDIT | Medium |
| STM-015 | Transaction running balance correct | Multiple transactions | Correct balance chain | High |

### 11.4 Statement PDF

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| STM-016 | Download statement PDF | Statement ID | 200, PDF file | High |
| STM-017 | PDF contains all transactions | Statement ID | Complete transaction list | Medium |
| STM-018 | PDF shows correct totals | Statement ID | Matching totals | Medium |

---

## 12. Dashboard Tests (`dashboard.test.js`)

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| DASH-001 | Get dashboard summary | Admin token | 200, summary stats | High |
| DASH-002 | Dashboard as buyer | Buyer token | 403, "Access denied" | High |
| DASH-003 | Get sales overview | Admin token | 200, sales data | Medium |
| DASH-004 | Get recent orders | Admin token | 200, recent orders list | Medium |
| DASH-005 | Get pending payments | Admin token | 200, pending payments | Medium |
| DASH-006 | Get inventory alerts | Admin token | 200, low stock products | Medium |
| DASH-007 | Get top products | Admin token | 200, top selling products | Low |
| DASH-008 | Get top buyers | Admin token | 200, top buyers list | Low |
| DASH-009 | Filter dashboard by date range | Date range | 200, filtered stats | Low |

---

## 13. End-to-End Flow Tests

### 13.1 Complete Order Flow (`orderFlow.test.js`)

| Test ID | Test Case | Description | Priority |
|---------|-----------|-------------|----------|
| E2E-001 | Quotation to Order Flow | Create quote → Approve → Create proforma → Approve → Record payment → Create order → Dispatch | High |
| E2E-002 | Direct Order with Payment | Create order → Record payment → Dispatch → Update tracking | High |
| E2E-003 | Partial Payment Flow | Create order → Partial payment → Add more payment → Full payment → Dispatch | High |
| E2E-004 | INR Payment Conversion | Create order → Pay in INR → Verify USD conversion → Dispatch | Medium |
| E2E-005 | Order Cancellation | Create order → Cancel → Verify inventory restored | Medium |

### 13.2 Invoice Flow (`invoiceFlow.test.js`)

| Test ID | Test Case | Description | Priority |
|---------|-----------|-------------|----------|
| E2E-006 | Order to Invoice Flow | Create order → Generate invoice → Record payment → Mark paid | High |
| E2E-007 | Manual Invoice Flow | Create manual invoice → Send to customer → Record payment | Medium |
| E2E-008 | Overdue Invoice Handling | Create invoice → Pass due date → Auto-mark overdue | Medium |

### 13.3 Statement Flow (`statementFlow.test.js`)

| Test ID | Test Case | Description | Priority |
|---------|-----------|-------------|----------|
| E2E-009 | Monthly Statement Generation | Multiple transactions → Generate statement → Verify balances | High |
| E2E-010 | Statement with Multiple Buyers | Various buyers → Filter by buyer → Verify accuracy | Medium |
| E2E-011 | Statement Aging Report | Overdue invoices → Generate statement → Verify aging buckets | Medium |

---

## 14. Error Handling Tests

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| ERR-001 | Handle invalid JSON body | Malformed JSON | 400, "Invalid JSON" | High |
| ERR-002 | Handle database connection error | DB down | 500, "Database error" | High |
| ERR-003 | Handle undefined route | /api/undefined | 404, "Route not found" | High |
| ERR-004 | Handle validation errors | Invalid data | 400, validation details | High |
| ERR-005 | Handle duplicate key error | Duplicate entry | 400, "Already exists" | High |
| ERR-006 | Handle cast error (invalid ObjectId) | Invalid ID format | 400, "Invalid ID" | Medium |
| ERR-007 | Handle file upload error | Corrupt file | 400, "Upload failed" | Medium |

---

## 15. Security Tests

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| SEC-001 | SQL injection prevention | Malicious query | Query escaped/rejected | High |
| SEC-002 | XSS prevention | Script in input | Script escaped | High |
| SEC-003 | Rate limiting works | 100+ requests/min | 429, "Too many requests" | Medium |
| SEC-004 | CORS blocks unauthorized origin | Wrong origin | CORS error | Medium |
| SEC-005 | Password not returned in response | Any user query | No password field | High |
| SEC-006 | JWT cannot be tampered | Modified token | 401, "Invalid token" | High |
| SEC-007 | Sensitive data encrypted | Check database | Passwords hashed | High |

---

## Test Data Fixtures

### Sample Users
```javascript
const testUsers = {
  admin: {
    name: "Test Admin",
    email: "admin@test.com",
    password: "admin123",
    role: "ADMIN"
  },
  buyer: {
    name: "Test Buyer",
    email: "buyer@test.com",
    password: "buyer123",
    role: "BUYER",
    company_details: {
      company_name: "Test Company",
      tax_id: "12-3456789"
    }
  }
};
```

### Sample Products
```javascript
const testProducts = {
  product1: {
    product_id: "TEST-001",
    part_number: "TEST-PART-001",
    product_name: "Test Product 1",
    category: "Hardware",
    brand: "ACF-50",
    list_price: 100.00,
    your_price: 95.00,
    total_quantity: 50
  }
};
```

### Sample Orders
```javascript
const testOrders = {
  order1: {
    customer_id: "buyer_id",
    items: [{
      product_id: "TEST-001",
      quantity: 5,
      unit_price: 95.00
    }],
    shipping_address: {
      street: "123 Test St",
      city: "Test City",
      state: "TS",
      zip: "12345",
      country: "USA"
    }
  }
};
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/integration/orders.test.js

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run only unit tests
npm test -- tests/unit

# Run only integration tests
npm test -- tests/integration

# Run only e2e tests
npm test -- tests/e2e
```

---

## Test Coverage Requirements

| Module | Minimum Coverage |
|--------|-----------------|
| Models | 90% |
| Controllers | 85% |
| Routes | 80% |
| Middlewares | 90% |
| Utils | 85% |
| Overall | 85% |

---

*Document Version: 1.0*
*Created: January 2026*
