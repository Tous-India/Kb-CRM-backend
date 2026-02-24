/**
 * Email Templates
 * Clean, professional, and easy-to-read HTML email templates
 */

// Company info
const COMPANY = {
  name: "KB Enterprises",
  address: "PLOT NO 145 GF, POCKET 25 SECTOR 24 ROHINI EAST DELHI 110085",
  phone: "+91-9315151910",
  email: "info@kbenterprise.org",
  gstin: "07CARPR7906M1ZR",
};

// Colors
const COLORS = {
  primary: "#1976d2",
  success: "#4caf50",
  warning: "#ff9800",
  error: "#f44336",
  text: "#333333",
  muted: "#666666",
  border: "#e0e0e0",
  background: "#f5f5f5",
};

/**
 * Base template wrapper
 */
const baseTemplate = (content, preheader = "") => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KB Enterprises</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: ${COLORS.background}; color: ${COLORS.text};">
  <!-- Preheader (preview text) -->
  <div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>

  <!-- Main Container -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.background}; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: ${COLORS.primary}; padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: 1px;">
                KB ENTERPRISES
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 12px;">
                Your Trusted Business Partner
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: ${COLORS.background}; padding: 24px; text-align: center; border-top: 1px solid ${COLORS.border};">
              <p style="margin: 0 0 8px; font-size: 13px; color: ${COLORS.muted};">
                <strong>${COMPANY.name}</strong>
              </p>
              <p style="margin: 0 0 4px; font-size: 12px; color: ${COLORS.muted};">
                ${COMPANY.address}
              </p>
              <p style="margin: 0 0 4px; font-size: 12px; color: ${COLORS.muted};">
                Phone: ${COMPANY.phone} | Email: ${COMPANY.email}
              </p>
              <p style="margin: 12px 0 0; font-size: 11px; color: #999999;">
                This email was sent from KB Enterprises. Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * Format currency
 */
const formatCurrency = (amount, currency = "USD") => {
  if (!amount) return currency === "INR" ? "₹0.00" : "$0.00";
  const symbol = currency === "INR" ? "₹" : "$";
  return symbol + parseFloat(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/**
 * Format date
 */
const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

/**
 * Items table component
 */
const itemsTable = (items, showINR = false, exchangeRate = 1) => {
  if (!items || items.length === 0) return "";

  const rows = items.map((item, index) => `
    <tr style="background-color: ${index % 2 === 0 ? "#ffffff" : "#fafafa"};">
      <td style="padding: 10px; border-bottom: 1px solid ${COLORS.border}; text-align: center; font-size: 13px;">${index + 1}</td>
      <td style="padding: 10px; border-bottom: 1px solid ${COLORS.border}; font-size: 13px;">
        <strong>${item.product_name || item.description || "-"}</strong>
        ${item.part_number ? `<br><span style="color: ${COLORS.muted}; font-size: 11px;">Part #: ${item.part_number}</span>` : ""}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid ${COLORS.border}; text-align: center; font-size: 13px;">${item.quantity || 0}</td>
      <td style="padding: 10px; border-bottom: 1px solid ${COLORS.border}; text-align: right; font-size: 13px;">${formatCurrency(item.unit_price)}</td>
      <td style="padding: 10px; border-bottom: 1px solid ${COLORS.border}; text-align: right; font-size: 13px; font-weight: 600;">${formatCurrency(item.total_price || (item.quantity * item.unit_price))}</td>
    </tr>
  `).join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid ${COLORS.border}; border-radius: 4px; margin: 16px 0;">
      <tr style="background-color: ${COLORS.primary};">
        <th style="padding: 12px; color: #ffffff; font-size: 12px; text-transform: uppercase; text-align: center; width: 40px;">S/N</th>
        <th style="padding: 12px; color: #ffffff; font-size: 12px; text-transform: uppercase; text-align: left;">Description</th>
        <th style="padding: 12px; color: #ffffff; font-size: 12px; text-transform: uppercase; text-align: center; width: 60px;">Qty</th>
        <th style="padding: 12px; color: #ffffff; font-size: 12px; text-transform: uppercase; text-align: right; width: 100px;">Unit Price</th>
        <th style="padding: 12px; color: #ffffff; font-size: 12px; text-transform: uppercase; text-align: right; width: 100px;">Amount</th>
      </tr>
      ${rows}
    </table>
  `;
};

/**
 * Info row component
 */
const infoRow = (label, value, highlight = false) => `
  <tr>
    <td style="padding: 8px 12px; font-size: 13px; color: ${COLORS.muted}; border-bottom: 1px solid ${COLORS.border};">${label}</td>
    <td style="padding: 8px 12px; font-size: 13px; font-weight: ${highlight ? "700" : "500"}; color: ${highlight ? COLORS.primary : COLORS.text}; border-bottom: 1px solid ${COLORS.border}; text-align: right;">${value}</td>
  </tr>
`;

/**
 * Button component
 */
const button = (text, url, color = COLORS.primary) => `
  <a href="${url}" style="display: inline-block; padding: 12px 28px; background-color: ${color}; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 4px; margin: 4px;">
    ${text}
  </a>
`;

// =====================================================
// EMAIL TEMPLATES
// =====================================================

/**
 * Quotation Email Template
 */
const quotationTemplate = (quotation, frontendUrl, customMessage = "") => {
  const acceptUrl = `${frontendUrl}/buyer/quotations/${quotation._id}?action=accept`;
  const rejectUrl = `${frontendUrl}/buyer/quotations/${quotation._id}?action=reject`;
  const viewUrl = `${frontendUrl}/buyer/quotations/${quotation._id}`;

  const content = `
    <!-- Greeting -->
    <h2 style="margin: 0 0 16px; font-size: 20px; color: ${COLORS.text};">
      Quotation ${quotation.quote_number}
    </h2>

    <p style="margin: 0 0 20px; font-size: 14px; color: ${COLORS.muted}; line-height: 1.6;">
      Dear <strong>${quotation.customer_name || quotation.buyer_name || "Valued Customer"}</strong>,<br><br>
      Thank you for your inquiry. Please find below our quotation for your requirements.
    </p>

    ${customMessage ? `
      <div style="background-color: #e3f2fd; padding: 16px; border-radius: 4px; margin-bottom: 20px; border-left: 4px solid ${COLORS.primary};">
        <p style="margin: 0; font-size: 14px; color: ${COLORS.text};">${customMessage}</p>
      </div>
    ` : ""}

    <!-- Quotation Details -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
      <tr>
        <td width="50%" style="vertical-align: top; padding-right: 10px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.background}; border-radius: 4px;">
            ${infoRow("Quote Number", quotation.quote_number, true)}
            ${infoRow("Date", formatDate(quotation.createdAt))}
            ${infoRow("Valid Until", formatDate(quotation.expiry_date))}
          </table>
        </td>
        <td width="50%" style="vertical-align: top; padding-left: 10px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.background}; border-radius: 4px;">
            ${infoRow("Payment Terms", quotation.payment_terms || "As agreed")}
            ${infoRow("Delivery Terms", quotation.delivery_terms || "Ex-works")}
            ${infoRow("Currency", quotation.currency || "USD")}
          </table>
        </td>
      </tr>
    </table>

    <!-- Items -->
    ${itemsTable(quotation.items)}

    <!-- Totals -->
    <table width="300" align="right" cellpadding="0" cellspacing="0" style="border: 1px solid ${COLORS.border}; border-radius: 4px; margin-bottom: 24px;">
      ${infoRow("Subtotal", formatCurrency(quotation.subtotal))}
      ${quotation.discount > 0 ? infoRow("Discount", "-" + formatCurrency(quotation.discount)) : ""}
      ${quotation.shipping_charges > 0 ? infoRow("Shipping", formatCurrency(quotation.shipping_charges)) : ""}
      <tr style="background-color: ${COLORS.primary};">
        <td style="padding: 12px; font-size: 14px; color: #ffffff; font-weight: 700;">Grand Total</td>
        <td style="padding: 12px; font-size: 14px; color: #ffffff; font-weight: 700; text-align: right;">${formatCurrency(quotation.total_amount || quotation.grand_total)}</td>
      </tr>
    </table>

    <div style="clear: both;"></div>

    <!-- Action Buttons -->
    <div style="text-align: center; margin: 32px 0; padding: 24px; background-color: ${COLORS.background}; border-radius: 8px;">
      <p style="margin: 0 0 16px; font-size: 14px; color: ${COLORS.muted};">Please review and respond to this quotation:</p>
      ${button("Accept Quotation", acceptUrl, COLORS.success)}
      ${button("Reject Quotation", rejectUrl, COLORS.error)}
      <p style="margin: 16px 0 0; font-size: 12px; color: ${COLORS.muted};">
        Or <a href="${viewUrl}" style="color: ${COLORS.primary};">view full details online</a>
      </p>
    </div>

    <p style="margin: 0; font-size: 13px; color: ${COLORS.muted}; line-height: 1.6;">
      If you have any questions or need further clarification, please don't hesitate to contact us.<br><br>
      Best regards,<br>
      <strong>KB Enterprises Team</strong>
    </p>
  `;

  return baseTemplate(content, `Quotation ${quotation.quote_number} - ${formatCurrency(quotation.total_amount)}`);
};

/**
 * Proforma Invoice Email Template
 */
const proformaInvoiceTemplate = (proforma, customMessage = "") => {
  const content = `
    <!-- Greeting -->
    <h2 style="margin: 0 0 16px; font-size: 20px; color: ${COLORS.text};">
      Proforma Invoice ${proforma.proforma_number}
    </h2>

    <p style="margin: 0 0 20px; font-size: 14px; color: ${COLORS.muted}; line-height: 1.6;">
      Dear <strong>${proforma.buyer_name || "Valued Customer"}</strong>,<br><br>
      Please find attached the Proforma Invoice for your order. Kindly arrange payment as per the terms below.
    </p>

    ${customMessage ? `
      <div style="background-color: #e3f2fd; padding: 16px; border-radius: 4px; margin-bottom: 20px; border-left: 4px solid ${COLORS.primary};">
        <p style="margin: 0; font-size: 14px; color: ${COLORS.text};">${customMessage}</p>
      </div>
    ` : ""}

    <!-- PI Details -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
      <tr>
        <td width="50%" style="vertical-align: top; padding-right: 10px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.background}; border-radius: 4px;">
            ${infoRow("PI Number", proforma.proforma_number, true)}
            ${infoRow("Date", formatDate(proforma.issue_date || proforma.createdAt))}
            ${infoRow("Valid Until", formatDate(proforma.valid_until))}
          </table>
        </td>
        <td width="50%" style="vertical-align: top; padding-left: 10px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.background}; border-radius: 4px;">
            ${infoRow("Quote Ref", proforma.quote_number || "-")}
            ${infoRow("Payment Terms", proforma.payment_terms || "As agreed")}
            ${infoRow("Exchange Rate", proforma.exchange_rate ? `1 USD = ₹${proforma.exchange_rate}` : "-")}
          </table>
        </td>
      </tr>
    </table>

    <!-- Items -->
    ${itemsTable(proforma.items)}

    <!-- Totals -->
    <table width="300" align="right" cellpadding="0" cellspacing="0" style="border: 1px solid ${COLORS.border}; border-radius: 4px; margin-bottom: 24px;">
      ${infoRow("Subtotal (USD)", formatCurrency(proforma.subtotal))}
      ${proforma.logistic_charges > 0 ? infoRow("Logistics", formatCurrency(proforma.logistic_charges)) : ""}
      ${proforma.custom_duty > 0 ? infoRow("Custom Duty", formatCurrency(proforma.custom_duty)) : ""}
      ${proforma.bank_charges > 0 ? infoRow("Bank Charges", formatCurrency(proforma.bank_charges)) : ""}
      <tr style="background-color: ${COLORS.primary};">
        <td style="padding: 12px; font-size: 14px; color: #ffffff; font-weight: 700;">Total Amount</td>
        <td style="padding: 12px; font-size: 14px; color: #ffffff; font-weight: 700; text-align: right;">${formatCurrency(proforma.total_amount)}</td>
      </tr>
      ${proforma.exchange_rate ? `
        <tr style="background-color: #1565c0;">
          <td style="padding: 12px; font-size: 14px; color: #ffffff; font-weight: 700;">Amount (INR)</td>
          <td style="padding: 12px; font-size: 14px; color: #ffffff; font-weight: 700; text-align: right;">${formatCurrency(proforma.total_amount * proforma.exchange_rate, "INR")}</td>
        </tr>
      ` : ""}
    </table>

    <div style="clear: both;"></div>

    <!-- Bank Details -->
    <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid ${COLORS.success};">
      <h3 style="margin: 0 0 12px; font-size: 14px; color: ${COLORS.success}; text-transform: uppercase;">Bank Details for Payment</h3>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 4px 0; font-size: 13px; color: ${COLORS.muted}; width: 120px;">Bank Name:</td>
          <td style="padding: 4px 0; font-size: 13px; font-weight: 600;">${proforma.bank_details?.bank_name || "Contact us for details"}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-size: 13px; color: ${COLORS.muted};">Account Name:</td>
          <td style="padding: 4px 0; font-size: 13px; font-weight: 600;">${proforma.bank_details?.account_name || COMPANY.name}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-size: 13px; color: ${COLORS.muted};">Account No:</td>
          <td style="padding: 4px 0; font-size: 13px; font-weight: 600;">${proforma.bank_details?.account_number || "-"}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-size: 13px; color: ${COLORS.muted};">IFSC Code:</td>
          <td style="padding: 4px 0; font-size: 13px; font-weight: 600;">${proforma.bank_details?.ifsc_code || "-"}</td>
        </tr>
        ${proforma.bank_details?.swift_code ? `
          <tr>
            <td style="padding: 4px 0; font-size: 13px; color: ${COLORS.muted};">SWIFT Code:</td>
            <td style="padding: 4px 0; font-size: 13px; font-weight: 600;">${proforma.bank_details.swift_code}</td>
          </tr>
        ` : ""}
      </table>
    </div>

    <p style="margin: 0; font-size: 13px; color: ${COLORS.muted}; line-height: 1.6;">
      Please share the payment confirmation once done. The PDF copy of the Proforma Invoice is attached for your reference.<br><br>
      Best regards,<br>
      <strong>KB Enterprises Team</strong>
    </p>
  `;

  return baseTemplate(content, `Proforma Invoice ${proforma.proforma_number} - Payment Required`);
};

/**
 * Invoice Email Template
 */
const invoiceTemplate = (invoice, customMessage = "") => {
  const statusColor = invoice.status === "PAID" ? COLORS.success : invoice.status === "PARTIAL" ? COLORS.warning : COLORS.error;

  const content = `
    <!-- Greeting -->
    <h2 style="margin: 0 0 16px; font-size: 20px; color: ${COLORS.text};">
      Invoice ${invoice.invoice_number}
      <span style="display: inline-block; padding: 4px 12px; background-color: ${statusColor}; color: #ffffff; font-size: 11px; border-radius: 4px; margin-left: 8px; vertical-align: middle;">
        ${invoice.status || "UNPAID"}
      </span>
    </h2>

    <p style="margin: 0 0 20px; font-size: 14px; color: ${COLORS.muted}; line-height: 1.6;">
      Dear <strong>${invoice.buyer_name || "Valued Customer"}</strong>,<br><br>
      Please find attached your invoice. We appreciate your business.
    </p>

    ${customMessage ? `
      <div style="background-color: #e3f2fd; padding: 16px; border-radius: 4px; margin-bottom: 20px; border-left: 4px solid ${COLORS.primary};">
        <p style="margin: 0; font-size: 14px; color: ${COLORS.text};">${customMessage}</p>
      </div>
    ` : ""}

    <!-- Invoice Details -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
      <tr>
        <td width="50%" style="vertical-align: top; padding-right: 10px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.background}; border-radius: 4px;">
            ${infoRow("Invoice Number", invoice.invoice_number, true)}
            ${infoRow("Invoice Date", formatDate(invoice.invoice_date || invoice.createdAt))}
            ${infoRow("Due Date", formatDate(invoice.due_date))}
          </table>
        </td>
        <td width="50%" style="vertical-align: top; padding-left: 10px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.background}; border-radius: 4px;">
            ${infoRow("Invoice Type", invoice.invoice_type?.replace("_", " ") || "Tax Invoice")}
            ${infoRow("Payment Terms", invoice.payment_terms || "As agreed")}
            ${infoRow("Status", invoice.status || "UNPAID")}
          </table>
        </td>
      </tr>
    </table>

    <!-- Items -->
    ${itemsTable(invoice.items)}

    <!-- Totals -->
    <table width="300" align="right" cellpadding="0" cellspacing="0" style="border: 1px solid ${COLORS.border}; border-radius: 4px; margin-bottom: 24px;">
      ${infoRow("Subtotal", formatCurrency(invoice.subtotal))}
      ${invoice.tax > 0 ? infoRow("Tax", formatCurrency(invoice.tax)) : ""}
      ${invoice.discount > 0 ? infoRow("Discount", "-" + formatCurrency(invoice.discount)) : ""}
      ${invoice.shipping > 0 ? infoRow("Shipping", formatCurrency(invoice.shipping)) : ""}
      <tr style="background-color: ${COLORS.primary};">
        <td style="padding: 12px; font-size: 14px; color: #ffffff; font-weight: 700;">Total Amount</td>
        <td style="padding: 12px; font-size: 14px; color: #ffffff; font-weight: 700; text-align: right;">${formatCurrency(invoice.total_amount)}</td>
      </tr>
      ${invoice.amount_paid > 0 ? `
        <tr>
          <td style="padding: 8px 12px; font-size: 13px; color: ${COLORS.success}; font-weight: 600;">Amount Paid</td>
          <td style="padding: 8px 12px; font-size: 13px; color: ${COLORS.success}; font-weight: 600; text-align: right;">${formatCurrency(invoice.amount_paid)}</td>
        </tr>
      ` : ""}
      ${invoice.balance_due > 0 ? `
        <tr style="background-color: #fff3e0;">
          <td style="padding: 10px 12px; font-size: 13px; color: ${COLORS.warning}; font-weight: 700;">Balance Due</td>
          <td style="padding: 10px 12px; font-size: 13px; color: ${COLORS.warning}; font-weight: 700; text-align: right;">${formatCurrency(invoice.balance_due)}</td>
        </tr>
      ` : ""}
    </table>

    <div style="clear: both;"></div>

    ${invoice.status !== "PAID" && invoice.bank_details?.bank_name ? `
      <!-- Bank Details -->
      <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid ${COLORS.success};">
        <h3 style="margin: 0 0 12px; font-size: 14px; color: ${COLORS.success}; text-transform: uppercase;">Bank Details for Payment</h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 4px 0; font-size: 13px; color: ${COLORS.muted}; width: 120px;">Bank Name:</td>
            <td style="padding: 4px 0; font-size: 13px; font-weight: 600;">${invoice.bank_details.bank_name}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-size: 13px; color: ${COLORS.muted};">Account No:</td>
            <td style="padding: 4px 0; font-size: 13px; font-weight: 600;">${invoice.bank_details.account_number}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-size: 13px; color: ${COLORS.muted};">IFSC Code:</td>
            <td style="padding: 4px 0; font-size: 13px; font-weight: 600;">${invoice.bank_details.ifsc_code}</td>
          </tr>
        </table>
      </div>
    ` : ""}

    <p style="margin: 0; font-size: 13px; color: ${COLORS.muted}; line-height: 1.6;">
      The PDF copy of the invoice is attached for your records.<br><br>
      Thank you for your business!<br>
      <strong>KB Enterprises Team</strong>
    </p>
  `;

  return baseTemplate(content, `Invoice ${invoice.invoice_number} - ${formatCurrency(invoice.total_amount)}`);
};

/**
 * Dispatch Email Template
 */
const dispatchTemplate = (dispatch, customMessage = "") => {
  const content = `
    <!-- Greeting -->
    <div style="text-align: center; padding: 20px 0; margin-bottom: 24px; background: linear-gradient(135deg, ${COLORS.success} 0%, #388e3c 100%); border-radius: 8px;">
      <h2 style="margin: 0; font-size: 24px; color: #ffffff;">
        Your Order Has Been Dispatched!
      </h2>
      <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
        Dispatch ID: <strong>${dispatch.dispatch_id}</strong>
      </p>
    </div>

    <p style="margin: 0 0 20px; font-size: 14px; color: ${COLORS.muted}; line-height: 1.6;">
      Dear <strong>${dispatch.buyer_name || "Valued Customer"}</strong>,<br><br>
      Great news! Your order has been dispatched and is on its way to you.
    </p>

    ${customMessage ? `
      <div style="background-color: #e3f2fd; padding: 16px; border-radius: 4px; margin-bottom: 20px; border-left: 4px solid ${COLORS.primary};">
        <p style="margin: 0; font-size: 14px; color: ${COLORS.text};">${customMessage}</p>
      </div>
    ` : ""}

    <!-- Shipping Details -->
    <div style="background-color: ${COLORS.background}; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 16px; font-size: 14px; color: ${COLORS.text}; text-transform: uppercase;">Shipping Details</h3>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="50%" style="vertical-align: top;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding: 6px 0; font-size: 13px; color: ${COLORS.muted};">Dispatch Date:</td>
                <td style="padding: 6px 0; font-size: 13px; font-weight: 600;">${formatDate(dispatch.dispatch_date)}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 13px; color: ${COLORS.muted};">Source Ref:</td>
                <td style="padding: 6px 0; font-size: 13px; font-weight: 600;">${dispatch.source_number || "-"}</td>
              </tr>
            </table>
          </td>
          <td width="50%" style="vertical-align: top;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding: 6px 0; font-size: 13px; color: ${COLORS.muted};">Courier:</td>
                <td style="padding: 6px 0; font-size: 13px; font-weight: 600;">${dispatch.shipping_info?.shipping_by || "-"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 13px; color: ${COLORS.muted};">AWB Number:</td>
                <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: ${COLORS.primary};">${dispatch.shipping_info?.awb_number || "-"}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>

    <!-- Items Dispatched -->
    <h3 style="margin: 0 0 12px; font-size: 14px; color: ${COLORS.text};">Items Dispatched</h3>
    ${itemsTable(dispatch.items)}

    <!-- Total -->
    <table width="250" align="right" cellpadding="0" cellspacing="0" style="border: 1px solid ${COLORS.border}; border-radius: 4px; margin-bottom: 24px;">
      ${infoRow("Total Quantity", dispatch.total_quantity || dispatch.items?.reduce((s, i) => s + (i.quantity || 0), 0))}
      <tr style="background-color: ${COLORS.primary};">
        <td style="padding: 12px; font-size: 14px; color: #ffffff; font-weight: 700;">Total Amount</td>
        <td style="padding: 12px; font-size: 14px; color: #ffffff; font-weight: 700; text-align: right;">${formatCurrency(dispatch.total_amount)}</td>
      </tr>
    </table>

    <div style="clear: both;"></div>

    ${dispatch.shipping_info?.notes ? `
      <div style="background-color: #fff8e1; padding: 16px; border-radius: 4px; margin: 20px 0; border-left: 4px solid ${COLORS.warning};">
        <p style="margin: 0; font-size: 13px; color: ${COLORS.text};"><strong>Note:</strong> ${dispatch.shipping_info.notes}</p>
      </div>
    ` : ""}

    ${dispatch.invoice_number ? `
      <p style="margin: 20px 0; padding: 16px; background-color: #e8f5e9; border-radius: 4px; font-size: 14px; color: ${COLORS.text};">
        Invoice <strong>${dispatch.invoice_number}</strong> has been generated for this dispatch.
      </p>
    ` : ""}

    <p style="margin: 0; font-size: 13px; color: ${COLORS.muted}; line-height: 1.6;">
      You can track your shipment using the AWB number provided above. For any queries, please contact us.<br><br>
      Thank you for choosing KB Enterprises!<br>
      <strong>KB Enterprises Team</strong>
    </p>
  `;

  return baseTemplate(content, `Order Dispatched - ${dispatch.dispatch_id}`);
};

// =====================================================
// ADMIN NOTIFICATION TEMPLATES (Buyer → Admin)
// =====================================================

/**
 * Admin: New Quote Request (Order) Notification
 */
const adminNewOrderTemplate = (order, buyer) => {
  const itemsList = order.items?.map((item, index) => `
    <tr style="background-color: ${index % 2 === 0 ? "#ffffff" : "#fafafa"};">
      <td style="padding: 10px; border-bottom: 1px solid ${COLORS.border}; text-align: center; font-size: 13px;">${index + 1}</td>
      <td style="padding: 10px; border-bottom: 1px solid ${COLORS.border}; font-size: 13px;">
        <strong>${item.product_name || item.description || "-"}</strong>
        ${item.part_number ? `<br><span style="color: ${COLORS.muted}; font-size: 11px;">Part #: ${item.part_number}</span>` : ""}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid ${COLORS.border}; text-align: center; font-size: 13px;">${item.quantity || 0}</td>
    </tr>
  `).join("") || "";

  const content = `
    <!-- Alert Banner -->
    <div style="background-color: ${COLORS.primary}; padding: 20px; border-radius: 8px; margin-bottom: 24px; text-align: center;">
      <h2 style="margin: 0; font-size: 20px; color: #ffffff;">
        🛒 New Quote Request Received
      </h2>
    </div>

    <p style="margin: 0 0 20px; font-size: 14px; color: ${COLORS.text}; line-height: 1.6;">
      A new quote request has been submitted by <strong>${buyer.name || buyer.company_name || "a buyer"}</strong>.
      Please review and create a quotation.
    </p>

    <!-- Buyer Details -->
    <div style="background-color: ${COLORS.background}; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="margin: 0 0 12px; font-size: 14px; color: ${COLORS.text}; text-transform: uppercase;">Buyer Information</h3>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: ${COLORS.muted}; width: 120px;">Company:</td>
          <td style="padding: 6px 0; font-size: 13px; font-weight: 600;">${buyer.company_name || "-"}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: ${COLORS.muted};">Contact Name:</td>
          <td style="padding: 6px 0; font-size: 13px; font-weight: 600;">${buyer.name || "-"}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: ${COLORS.muted};">Email:</td>
          <td style="padding: 6px 0; font-size: 13px; font-weight: 600;">
            <a href="mailto:${buyer.email}" style="color: ${COLORS.primary};">${buyer.email || "-"}</a>
          </td>
        </tr>
        ${buyer.phone ? `
          <tr>
            <td style="padding: 6px 0; font-size: 13px; color: ${COLORS.muted};">Phone:</td>
            <td style="padding: 6px 0; font-size: 13px; font-weight: 600;">${buyer.phone}</td>
          </tr>
        ` : ""}
      </table>
    </div>

    <!-- Order Details -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.background}; border-radius: 4px; margin-bottom: 16px;">
      ${infoRow("Order ID", order.order_id || order._id, true)}
      ${infoRow("Request Date", formatDate(order.createdAt))}
      ${infoRow("Total Items", order.items?.length || 0)}
    </table>

    <!-- Items Requested -->
    <h3 style="margin: 20px 0 12px; font-size: 14px; color: ${COLORS.text};">Items Requested</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid ${COLORS.border}; border-radius: 4px;">
      <tr style="background-color: ${COLORS.primary};">
        <th style="padding: 12px; color: #ffffff; font-size: 12px; text-transform: uppercase; text-align: center; width: 40px;">S/N</th>
        <th style="padding: 12px; color: #ffffff; font-size: 12px; text-transform: uppercase; text-align: left;">Description</th>
        <th style="padding: 12px; color: #ffffff; font-size: 12px; text-transform: uppercase; text-align: center; width: 80px;">Qty</th>
      </tr>
      ${itemsList}
    </table>

    ${order.notes ? `
      <div style="background-color: #fff8e1; padding: 16px; border-radius: 4px; margin: 20px 0; border-left: 4px solid ${COLORS.warning};">
        <p style="margin: 0; font-size: 13px; color: ${COLORS.text};"><strong>Customer Notes:</strong> ${order.notes}</p>
      </div>
    ` : ""}

    <p style="margin: 24px 0 0; font-size: 13px; color: ${COLORS.muted}; line-height: 1.6;">
      Please log in to the admin panel to review this request and prepare a quotation.
    </p>
  `;

  return baseTemplate(content, `New Quote Request from ${buyer.company_name || buyer.name || "Buyer"}`);
};

/**
 * Admin: Quotation Accepted Notification
 */
const adminQuotationAcceptedTemplate = (quotation, buyer, shippingAddress = null) => {
  const content = `
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 28px;">
      <h2 style="margin: 0 0 8px; font-size: 20px; color: ${COLORS.text}; font-weight: 600;">
        Quotation Accepted
      </h2>
      <p style="margin: 0; font-size: 14px; color: ${COLORS.success}; font-weight: 500;">
        ${quotation.quote_number}
      </p>
    </div>

    <p style="margin: 0 0 20px; font-size: 14px; color: ${COLORS.text}; line-height: 1.6;">
      <strong>${buyer.name || buyer.company_name || "A buyer"}</strong> has accepted the quotation.
      Please proceed with generating the Proforma Invoice.
    </p>

    <!-- Buyer Details -->
    <div style="background-color: ${COLORS.background}; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="margin: 0 0 12px; font-size: 14px; color: ${COLORS.text}; text-transform: uppercase;">Buyer Information</h3>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: ${COLORS.muted}; width: 120px;">Company:</td>
          <td style="padding: 6px 0; font-size: 13px; font-weight: 600;">${buyer.company_name || "-"}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: ${COLORS.muted};">Contact Name:</td>
          <td style="padding: 6px 0; font-size: 13px; font-weight: 600;">${buyer.name || "-"}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: ${COLORS.muted};">Email:</td>
          <td style="padding: 6px 0; font-size: 13px; font-weight: 600;">
            <a href="mailto:${buyer.email}" style="color: ${COLORS.primary};">${buyer.email || "-"}</a>
          </td>
        </tr>
      </table>
    </div>

    <!-- Quotation Summary -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.background}; border-radius: 4px; margin-bottom: 16px;">
      ${infoRow("Quote Number", quotation.quote_number, true)}
      ${infoRow("Accepted On", formatDate(new Date()))}
      ${infoRow("Total Amount", formatCurrency(quotation.total_amount || quotation.grand_total))}
      ${infoRow("Items Count", quotation.items?.length || 0)}
    </table>

    ${shippingAddress ? `
      <!-- Shipping Address -->
      <div style="background-color: #e3f2fd; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${COLORS.primary};">
        <h3 style="margin: 0 0 12px; font-size: 14px; color: ${COLORS.primary}; text-transform: uppercase;">Shipping Address</h3>
        <p style="margin: 0; font-size: 13px; color: ${COLORS.text}; line-height: 1.6;">
          ${shippingAddress.address_line1 || ""}${shippingAddress.address_line2 ? `, ${shippingAddress.address_line2}` : ""}<br>
          ${shippingAddress.city || ""}${shippingAddress.state ? `, ${shippingAddress.state}` : ""} ${shippingAddress.postal_code || ""}<br>
          ${shippingAddress.country || ""}
        </p>
      </div>
    ` : ""}

    <!-- Items Summary -->
    ${itemsTable(quotation.items)}

    <div style="background-color: #e8f5e9; padding: 16px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; font-size: 14px; color: ${COLORS.success}; font-weight: 600;">
        Next Step: Generate Proforma Invoice
      </p>
    </div>

    <p style="margin: 0; font-size: 13px; color: ${COLORS.muted}; line-height: 1.6;">
      Please log in to the admin panel to generate the Proforma Invoice for this accepted quotation.
    </p>
  `;

  return baseTemplate(content, `Quotation ${quotation.quote_number} Accepted by ${buyer.name || "Buyer"}`);
};

/**
 * Admin: Quotation Rejected Notification
 */
const adminQuotationRejectedTemplate = (quotation, buyer, reason = "") => {
  const content = `
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 28px;">
      <h2 style="margin: 0 0 8px; font-size: 20px; color: ${COLORS.text}; font-weight: 600;">
        Quotation Rejected
      </h2>
      <p style="margin: 0; font-size: 14px; color: ${COLORS.error}; font-weight: 500;">
        ${quotation.quote_number}
      </p>
    </div>

    <p style="margin: 0 0 20px; font-size: 14px; color: ${COLORS.text}; line-height: 1.6;">
      <strong>${buyer.name || buyer.company_name || "A buyer"}</strong> has rejected the quotation.
    </p>

    <!-- Buyer Details -->
    <div style="background-color: ${COLORS.background}; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="margin: 0 0 12px; font-size: 14px; color: ${COLORS.text}; text-transform: uppercase;">Buyer Information</h3>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: ${COLORS.muted}; width: 120px;">Company:</td>
          <td style="padding: 6px 0; font-size: 13px; font-weight: 600;">${buyer.company_name || "-"}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: ${COLORS.muted};">Contact Name:</td>
          <td style="padding: 6px 0; font-size: 13px; font-weight: 600;">${buyer.name || "-"}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: ${COLORS.muted};">Email:</td>
          <td style="padding: 6px 0; font-size: 13px; font-weight: 600;">
            <a href="mailto:${buyer.email}" style="color: ${COLORS.primary};">${buyer.email || "-"}</a>
          </td>
        </tr>
      </table>
    </div>

    <!-- Quotation Summary -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.background}; border-radius: 4px; margin-bottom: 16px;">
      ${infoRow("Quote Number", quotation.quote_number, true)}
      ${infoRow("Rejected On", formatDate(new Date()))}
      ${infoRow("Total Amount", formatCurrency(quotation.total_amount || quotation.grand_total))}
    </table>

    ${reason ? `
      <!-- Rejection Reason -->
      <div style="background-color: #ffebee; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${COLORS.error};">
        <h3 style="margin: 0 0 8px; font-size: 14px; color: ${COLORS.error}; text-transform: uppercase;">Rejection Reason</h3>
        <p style="margin: 0; font-size: 14px; color: ${COLORS.text}; line-height: 1.6;">${reason}</p>
      </div>
    ` : `
      <div style="background-color: #fff8e1; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${COLORS.warning};">
        <p style="margin: 0; font-size: 13px; color: ${COLORS.text};">
          <strong>Note:</strong> No specific reason was provided for the rejection.
        </p>
      </div>
    `}

    <p style="margin: 24px 0 0; font-size: 13px; color: ${COLORS.muted}; line-height: 1.6;">
      You may want to follow up with the buyer to understand their concerns and potentially revise the quotation.
    </p>
  `;

  return baseTemplate(content, `Quotation ${quotation.quote_number} Rejected by ${buyer.name || "Buyer"}`);
};

/**
 * Admin: Payment Submitted Notification
 */
const adminPaymentSubmittedTemplate = (paymentRecord, pi, buyer) => {
  const content = `
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 28px;">
      <h2 style="margin: 0 0 8px; font-size: 20px; color: ${COLORS.text}; font-weight: 600;">
        Payment Submitted
      </h2>
      <p style="margin: 0; font-size: 14px; color: ${COLORS.warning}; font-weight: 500;">
        Verification required
      </p>
    </div>

    <p style="margin: 0 0 20px; font-size: 14px; color: ${COLORS.text}; line-height: 1.6;">
      <strong>${buyer.name || buyer.company_name || "A buyer"}</strong> has submitted a payment for Proforma Invoice <strong>${pi?.proforma_number || paymentRecord.proforma_invoice_id}</strong>.
      Please verify the payment.
    </p>

    <!-- Buyer Details -->
    <div style="background-color: ${COLORS.background}; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="margin: 0 0 12px; font-size: 14px; color: ${COLORS.text}; text-transform: uppercase;">Buyer Information</h3>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: ${COLORS.muted}; width: 120px;">Company:</td>
          <td style="padding: 6px 0; font-size: 13px; font-weight: 600;">${buyer.company_name || "-"}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: ${COLORS.muted};">Contact Name:</td>
          <td style="padding: 6px 0; font-size: 13px; font-weight: 600;">${buyer.name || "-"}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: ${COLORS.muted};">Email:</td>
          <td style="padding: 6px 0; font-size: 13px; font-weight: 600;">
            <a href="mailto:${buyer.email}" style="color: ${COLORS.primary};">${buyer.email || "-"}</a>
          </td>
        </tr>
      </table>
    </div>

    <!-- Payment Details -->
    <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${COLORS.success};">
      <h3 style="margin: 0 0 16px; font-size: 14px; color: ${COLORS.success}; text-transform: uppercase;">Payment Details</h3>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: ${COLORS.muted}; width: 150px;">Amount Paid:</td>
          <td style="padding: 8px 0; font-size: 18px; font-weight: 700; color: ${COLORS.success};">${formatCurrency(paymentRecord.amount)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 13px; color: ${COLORS.muted};">Payment Method:</td>
          <td style="padding: 8px 0; font-size: 13px; font-weight: 600;">${paymentRecord.payment_method || "Bank Transfer"}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 13px; color: ${COLORS.muted};">Transaction ID:</td>
          <td style="padding: 8px 0; font-size: 13px; font-weight: 600; color: ${COLORS.primary};">${paymentRecord.transaction_id || "-"}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 13px; color: ${COLORS.muted};">Payment Date:</td>
          <td style="padding: 8px 0; font-size: 13px; font-weight: 600;">${formatDate(paymentRecord.payment_date || paymentRecord.createdAt)}</td>
        </tr>
      </table>
    </div>

    <!-- PI Details -->
    ${pi ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.background}; border-radius: 4px; margin-bottom: 16px;">
        ${infoRow("PI Number", pi.proforma_number, true)}
        ${infoRow("PI Total Amount", formatCurrency(pi.total_amount))}
        ${infoRow("Payment Status", pi.payment_status || "PARTIAL")}
      </table>
    ` : ""}

    ${paymentRecord.proof_url ? `
      <div style="text-align: center; margin: 24px 0;">
        ${button("View Payment Proof", paymentRecord.proof_url, COLORS.primary)}
      </div>
    ` : ""}

    ${paymentRecord.notes ? `
      <div style="background-color: #fff8e1; padding: 16px; border-radius: 4px; margin: 20px 0; border-left: 4px solid ${COLORS.warning};">
        <p style="margin: 0; font-size: 13px; color: ${COLORS.text};"><strong>Buyer Notes:</strong> ${paymentRecord.notes}</p>
      </div>
    ` : ""}

    <div style="background-color: #fff3e0; padding: 16px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; font-size: 14px; color: ${COLORS.warning}; font-weight: 600;">
        Action Required: Verify this payment in the admin panel
      </p>
    </div>

    <p style="margin: 0; font-size: 13px; color: ${COLORS.muted}; line-height: 1.6;">
      Please log in to the admin panel to verify this payment and update the PI status accordingly.
    </p>
  `;

  return baseTemplate(content, `Payment Submitted for ${pi?.proforma_number || "PI"} - Verify Required`);
};

// =====================================================
// REGISTRATION & PASSWORD RESET TEMPLATES
// =====================================================

/**
 * Registration OTP Email Template
 * Sent to user during registration to verify their email
 */
const registrationOTPTemplate = (name, otp) => {
  const content = `
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 28px;">
      <h2 style="margin: 0 0 8px; font-size: 20px; color: ${COLORS.text}; font-weight: 600;">
        Email Verification
      </h2>
      <p style="margin: 0; font-size: 14px; color: ${COLORS.muted};">
        Complete your registration
      </p>
    </div>

    <p style="margin: 0 0 24px; font-size: 14px; color: ${COLORS.text}; line-height: 1.7;">
      Dear <strong>${name || "User"}</strong>,
    </p>

    <p style="margin: 0 0 28px; font-size: 14px; color: ${COLORS.text}; line-height: 1.7;">
      Thank you for registering. Please use the verification code below to complete your registration.
    </p>

    <!-- OTP Code Box -->
    <div style="text-align: center; margin: 32px 0;">
      <div style="display: inline-block; background-color: ${COLORS.background}; padding: 24px 40px; border-radius: 8px; border: 1px solid ${COLORS.border};">
        <p style="margin: 0 0 8px; font-size: 11px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 1.5px;">
          Verification Code
        </p>
        <p style="margin: 0; font-size: 32px; font-weight: 700; color: ${COLORS.text}; letter-spacing: 6px; font-family: 'Courier New', monospace;">
          ${otp}
        </p>
      </div>
    </div>

    <!-- Expiry Notice -->
    <div style="background-color: ${COLORS.background}; padding: 14px 20px; border-radius: 6px; margin: 28px 0; text-align: center;">
      <p style="margin: 0; font-size: 13px; color: ${COLORS.muted};">
        This code will expire in <strong style="color: ${COLORS.text};">10 minutes</strong>
      </p>
    </div>

    <p style="margin: 0 0 28px; font-size: 14px; color: ${COLORS.text}; line-height: 1.7;">
      Enter this code on the registration page to verify your email address and proceed with creating your password.
    </p>

    <!-- Security Notice -->
    <div style="background-color: ${COLORS.background}; padding: 16px 20px; border-radius: 6px; margin: 28px 0;">
      <p style="margin: 0; font-size: 12px; color: ${COLORS.muted}; line-height: 1.6;">
        <strong>Security Notice:</strong> If you did not request this code, please ignore this email.
        Never share this code with anyone.
      </p>
    </div>

    <p style="margin: 24px 0 0; font-size: 13px; color: ${COLORS.text}; line-height: 1.7;">
      Best regards,<br>
      <strong>KB Enterprises Team</strong>
    </p>
  `;

  return baseTemplate(content, `Your verification code is ${otp}`);
};

/**
 * Password Reset OTP Email Template
 * Sent to user when they request to reset their password
 */
const passwordResetOTPTemplate = (name, otp) => {
  const content = `
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 28px;">
      <h2 style="margin: 0 0 8px; font-size: 20px; color: ${COLORS.text}; font-weight: 600;">
        Password Reset
      </h2>
      <p style="margin: 0; font-size: 14px; color: ${COLORS.muted};">
        Verify your identity
      </p>
    </div>

    <p style="margin: 0 0 24px; font-size: 14px; color: ${COLORS.text}; line-height: 1.7;">
      Dear <strong>${name || "User"}</strong>,
    </p>

    <p style="margin: 0 0 28px; font-size: 14px; color: ${COLORS.text}; line-height: 1.7;">
      We received a request to reset your password. Please use the verification code below to proceed.
    </p>

    <!-- OTP Code Box -->
    <div style="text-align: center; margin: 32px 0;">
      <div style="display: inline-block; background-color: ${COLORS.background}; padding: 24px 40px; border-radius: 8px; border: 1px solid ${COLORS.border};">
        <p style="margin: 0 0 8px; font-size: 11px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 1.5px;">
          Reset Code
        </p>
        <p style="margin: 0; font-size: 32px; font-weight: 700; color: ${COLORS.text}; letter-spacing: 6px; font-family: 'Courier New', monospace;">
          ${otp}
        </p>
      </div>
    </div>

    <!-- Expiry Notice -->
    <div style="background-color: ${COLORS.background}; padding: 14px 20px; border-radius: 6px; margin: 28px 0; text-align: center;">
      <p style="margin: 0; font-size: 13px; color: ${COLORS.muted};">
        This code will expire in <strong style="color: ${COLORS.text};">10 minutes</strong>
      </p>
    </div>

    <p style="margin: 0 0 28px; font-size: 14px; color: ${COLORS.text}; line-height: 1.7;">
      Enter this code on the password reset page to verify your identity and create a new password.
    </p>

    <!-- Security Notice -->
    <div style="background-color: ${COLORS.background}; padding: 16px 20px; border-radius: 6px; margin: 28px 0;">
      <p style="margin: 0; font-size: 12px; color: ${COLORS.muted}; line-height: 1.6;">
        <strong>Security Notice:</strong> If you did not request a password reset, please ignore this email.
        Your password will remain unchanged.
      </p>
    </div>

    <p style="margin: 24px 0 0; font-size: 13px; color: ${COLORS.text}; line-height: 1.7;">
      Best regards,<br>
      <strong>KB Enterprises Team</strong>
    </p>
  `;

  return baseTemplate(content, `Your password reset code is ${otp}`);
};

/**
 * Admin: New Buyer Registration Notification
 * Sent to admin when a new buyer completes registration (pending approval)
 */
const adminNewRegistrationTemplate = (user) => {
  const content = `
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 28px;">
      <h2 style="margin: 0 0 8px; font-size: 20px; color: ${COLORS.text}; font-weight: 600;">
        New Registration
      </h2>
      <p style="margin: 0; font-size: 14px; color: ${COLORS.muted};">
        Pending approval
      </p>
    </div>

    <p style="margin: 0 0 24px; font-size: 14px; color: ${COLORS.text}; line-height: 1.7;">
      A new buyer has completed registration and is waiting for approval before they can access the system.
    </p>

    <!-- User Details -->
    <div style="background-color: ${COLORS.background}; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="margin: 0 0 16px; font-size: 13px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.5px;">Registration Details</h3>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 8px 0; font-size: 13px; color: ${COLORS.muted}; width: 120px;">Name:</td>
          <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: ${COLORS.text};">${user.name || "-"}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 13px; color: ${COLORS.muted};">Email:</td>
          <td style="padding: 8px 0; font-size: 14px; font-weight: 600;">
            <a href="mailto:${user.email}" style="color: ${COLORS.primary}; text-decoration: none;">${user.email || "-"}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 13px; color: ${COLORS.muted};">Phone:</td>
          <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: ${COLORS.text};">${user.phone || "-"}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 13px; color: ${COLORS.muted};">Company:</td>
          <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: ${COLORS.text};">${user.company_details?.company_name || "-"}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 13px; color: ${COLORS.muted};">Registered:</td>
          <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: ${COLORS.text};">${formatDate(user.createdAt || new Date())}</td>
        </tr>
      </table>
    </div>

    ${user.address ? `
      <!-- Address -->
      <div style="background-color: ${COLORS.background}; padding: 16px 20px; border-radius: 6px; margin-bottom: 20px;">
        <h4 style="margin: 0 0 8px; font-size: 12px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.5px;">Address</h4>
        <p style="margin: 0; font-size: 13px; color: ${COLORS.text}; line-height: 1.6;">
          ${user.address.street || ""}${user.address.city ? `, ${user.address.city}` : ""}${user.address.state ? `, ${user.address.state}` : ""} ${user.address.zip || ""}<br>
          ${user.address.country || ""}
        </p>
      </div>
    ` : ""}

    <!-- Action Required -->
    <div style="background-color: ${COLORS.background}; padding: 20px; border-radius: 6px; margin: 28px 0; text-align: center; border: 1px solid ${COLORS.border};">
      <p style="margin: 0 0 8px; font-size: 14px; color: ${COLORS.text}; font-weight: 600;">
        Action Required
      </p>
      <p style="margin: 0; font-size: 13px; color: ${COLORS.muted};">
        Please log in to the admin panel to review and approve or reject this registration.
      </p>
    </div>

    <p style="margin: 0; font-size: 12px; color: ${COLORS.muted}; line-height: 1.6; text-align: center;">
      This notification was sent from the KB Enterprises CRM system.
    </p>
  `;

  return baseTemplate(content, `New buyer registration: ${user.name || user.email} - Pending Approval`);
};

/**
 * Buyer Approval Email Template
 * Sent to buyer when their registration is approved by admin
 */
const buyerApprovalTemplate = (user, frontendUrl = "http://localhost:5173") => {
  const loginUrl = `${frontendUrl}/login`;

  const content = `
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <h2 style="margin: 0 0 8px; font-size: 22px; color: ${COLORS.text}; font-weight: 600;">
        Account Approved
      </h2>
      <p style="margin: 0; font-size: 14px; color: ${COLORS.muted};">
        You can now access your account
      </p>
    </div>

    <p style="margin: 0 0 24px; font-size: 14px; color: ${COLORS.text}; line-height: 1.7;">
      Dear <strong>${user.name || "Valued Customer"}</strong>,
    </p>

    <p style="margin: 0 0 24px; font-size: 14px; color: ${COLORS.text}; line-height: 1.7;">
      We are pleased to inform you that your registration request has been reviewed and approved.
      You now have full access to your account and can begin using our services.
    </p>

    <!-- Account Details -->
    <div style="background-color: ${COLORS.background}; padding: 24px; border-radius: 6px; margin-bottom: 28px;">
      <h3 style="margin: 0 0 16px; font-size: 13px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.5px;">Account Details</h3>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 8px 0; font-size: 13px; color: ${COLORS.muted}; width: 100px;">Email:</td>
          <td style="padding: 8px 0; font-size: 14px; font-weight: 500; color: ${COLORS.text};">${user.email}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 13px; color: ${COLORS.muted};">User ID:</td>
          <td style="padding: 8px 0; font-size: 14px; font-weight: 500; color: ${COLORS.text};">${user.user_id || "-"}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 13px; color: ${COLORS.muted};">Status:</td>
          <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: ${COLORS.success};">Active</td>
        </tr>
      </table>
    </div>

    <!-- Login Button -->
    <div style="text-align: center; margin: 32px 0;">
      ${button("Access Your Account", loginUrl, COLORS.primary)}
    </div>

    <!-- What's Next -->
    <div style="background-color: ${COLORS.background}; padding: 24px; border-radius: 6px; margin: 28px 0;">
      <h3 style="margin: 0 0 16px; font-size: 13px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.5px;">Getting Started</h3>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: ${COLORS.text};">• Browse our product catalog and explore available items</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: ${COLORS.text};">• Submit quotation requests for products you need</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: ${COLORS.text};">• Track your orders and monitor delivery status</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: ${COLORS.text};">• Access and download your invoices anytime</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: ${COLORS.text};">• Update your profile and account preferences</td>
        </tr>
      </table>
    </div>

    <p style="margin: 24px 0 0; font-size: 13px; color: ${COLORS.muted}; line-height: 1.7;">
      Should you have any questions or require assistance, please do not hesitate to contact our team.
    </p>

    <p style="margin: 24px 0 0; font-size: 13px; color: ${COLORS.text}; line-height: 1.7;">
      Best regards,<br>
      <strong>KB Enterprises Team</strong>
    </p>
  `;

  return baseTemplate(content, `Your KB Enterprises account has been approved`);
};

/**
 * Buyer Rejection Email Template
 * Sent to buyer when their registration is rejected by admin
 */
const buyerRejectionTemplate = (user, reason = "") => {
  const content = `
    <!-- Header -->
    <h2 style="margin: 0 0 16px; font-size: 20px; color: ${COLORS.text}; text-align: center;">
      Registration Update
    </h2>

    <p style="margin: 0 0 20px; font-size: 14px; color: ${COLORS.text}; line-height: 1.6;">
      Dear <strong>${user.name || "User"}</strong>,<br><br>
      Thank you for your interest in KB Enterprises. After reviewing your registration request, we regret to inform you that we are unable to approve your account at this time.
    </p>

    ${reason ? `
      <!-- Rejection Reason -->
      <div style="background-color: #ffebee; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid ${COLORS.error};">
        <h3 style="margin: 0 0 12px; font-size: 14px; color: ${COLORS.error}; text-transform: uppercase;">Reason</h3>
        <p style="margin: 0; font-size: 14px; color: ${COLORS.text}; line-height: 1.6;">
          ${reason}
        </p>
      </div>
    ` : `
      <div style="background-color: ${COLORS.background}; padding: 16px; border-radius: 8px; margin: 24px 0;">
        <p style="margin: 0; font-size: 13px; color: ${COLORS.muted}; text-align: center;">
          No specific reason was provided.
        </p>
      </div>
    `}

    <!-- What to Do Next -->
    <div style="background-color: ${COLORS.background}; padding: 20px; border-radius: 6px; margin: 28px 0; border: 1px solid ${COLORS.border};">
      <h3 style="margin: 0 0 12px; font-size: 13px; color: ${COLORS.text}; text-transform: uppercase; letter-spacing: 0.5px;">Need Assistance?</h3>
      <p style="margin: 0; font-size: 13px; color: ${COLORS.muted}; line-height: 1.7;">
        If you believe this was a mistake or would like to provide additional information, please contact our support team:
      </p>
      <p style="margin: 12px 0 0; font-size: 13px; color: ${COLORS.text}; line-height: 1.8;">
        Email: <a href="mailto:${COMPANY.email}" style="color: ${COLORS.primary}; text-decoration: none;">${COMPANY.email}</a><br>
        Phone: ${COMPANY.phone}
      </p>
    </div>

    <p style="margin: 0; font-size: 13px; color: ${COLORS.muted}; line-height: 1.6; text-align: center;">
      We appreciate your understanding.<br><br>
      Best regards,<br>
      <strong>KB Enterprises Team</strong>
    </p>
  `;

  return baseTemplate(content, `Registration Update - KB Enterprises`);
};

/**
 * Buyer Inquiry Email Template (Buyer → Admin)
 * Used when buyer wants to ask questions about a quotation/document
 */
const buyerInquiryTemplate = (inquiry) => {
  const { documentType, documentNumber, buyer, subject, message } = inquiry;

  const content = `
    <!-- Alert Banner -->
    <div style="background-color: ${COLORS.primary}; padding: 20px; border-radius: 8px; margin-bottom: 24px; text-align: center;">
      <h2 style="margin: 0; font-size: 20px; color: #ffffff;">
        📩 New Inquiry from Buyer
      </h2>
      <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
        ${documentType ? `Regarding ${documentType}: ${documentNumber}` : "General Inquiry"}
      </p>
    </div>

    <!-- Buyer Details -->
    <div style="background-color: ${COLORS.background}; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="margin: 0 0 12px; font-size: 14px; color: ${COLORS.text}; text-transform: uppercase;">From</h3>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: ${COLORS.muted}; width: 100px;">Name:</td>
          <td style="padding: 6px 0; font-size: 13px; font-weight: 600;">${buyer.name || "-"}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: ${COLORS.muted};">Company:</td>
          <td style="padding: 6px 0; font-size: 13px; font-weight: 600;">${buyer.company_name || "-"}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: ${COLORS.muted};">Email:</td>
          <td style="padding: 6px 0; font-size: 13px; font-weight: 600;">
            <a href="mailto:${buyer.email}" style="color: ${COLORS.primary};">${buyer.email}</a>
          </td>
        </tr>
        ${buyer.phone ? `
          <tr>
            <td style="padding: 6px 0; font-size: 13px; color: ${COLORS.muted};">Phone:</td>
            <td style="padding: 6px 0; font-size: 13px; font-weight: 600;">${buyer.phone}</td>
          </tr>
        ` : ""}
      </table>
    </div>

    <!-- Subject -->
    <div style="margin-bottom: 20px;">
      <h3 style="margin: 0 0 8px; font-size: 14px; color: ${COLORS.text}; text-transform: uppercase;">Subject</h3>
      <p style="margin: 0; padding: 12px; background-color: ${COLORS.background}; border-radius: 4px; font-size: 14px; font-weight: 600;">
        ${subject}
      </p>
    </div>

    <!-- Message -->
    <div style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 8px; font-size: 14px; color: ${COLORS.text}; text-transform: uppercase;">Message</h3>
      <div style="padding: 16px; background-color: #fff; border: 1px solid ${COLORS.border}; border-radius: 8px; border-left: 4px solid ${COLORS.primary};">
        <p style="margin: 0; font-size: 14px; color: ${COLORS.text}; line-height: 1.8; white-space: pre-wrap;">${message}</p>
      </div>
    </div>

    <!-- Reply Button -->
    <div style="text-align: center; margin: 24px 0;">
      ${button("Reply to Buyer", `mailto:${buyer.email}?subject=Re: ${encodeURIComponent(subject)}`, COLORS.primary)}
    </div>

    <p style="margin: 0; font-size: 13px; color: ${COLORS.muted}; line-height: 1.6; text-align: center;">
      This inquiry was sent from the KB Enterprises CRM system.
    </p>
  `;

  return baseTemplate(content, `Inquiry: ${subject}`);
};

// Export all templates
export const emailTemplates = {
  quotation: quotationTemplate,
  proformaInvoice: proformaInvoiceTemplate,
  invoice: invoiceTemplate,
  dispatch: dispatchTemplate,
  // Admin notification templates (buyer → admin)
  adminNewOrder: adminNewOrderTemplate,
  adminQuotationAccepted: adminQuotationAcceptedTemplate,
  adminQuotationRejected: adminQuotationRejectedTemplate,
  adminPaymentSubmitted: adminPaymentSubmittedTemplate,
  // Buyer inquiry template
  buyerInquiry: buyerInquiryTemplate,
  // Registration & Password Reset templates
  registrationOTP: registrationOTPTemplate,
  passwordResetOTP: passwordResetOTPTemplate,
  adminNewRegistration: adminNewRegistrationTemplate,
  buyerApproval: buyerApprovalTemplate,
  buyerRejection: buyerRejectionTemplate,
};

export default emailTemplates;
