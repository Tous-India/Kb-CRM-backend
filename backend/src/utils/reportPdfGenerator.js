import PDFDocument from "pdfkit";

// ===========================
// Shared Constants & Helpers
// ===========================

const COLORS = {
  primary: "#1a237e",
  secondary: "#424242",
  light: "#9e9e9e",
  border: "#e0e0e0",
  bg: "#f5f5f5",
  white: "#ffffff",
};

function currency(amount) {
  return `$${Number(amount || 0).toFixed(2)}`;
}

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function drawLine(doc, y, x1 = 50, x2 = 545) {
  doc.strokeColor(COLORS.border).lineWidth(0.5).moveTo(x1, y).lineTo(x2, y).stroke();
}

function drawTableHeader(doc, y, columns) {
  doc.rect(50, y, 495, 20).fill(COLORS.primary);
  columns.forEach((col) => {
    doc
      .fillColor(COLORS.white)
      .fontSize(8)
      .font("Helvetica-Bold")
      .text(col.label, col.x, y + 5, { width: col.width, align: col.align || "left" });
  });
  return y + 20;
}

function drawTableRow(doc, y, columns, stripe = false) {
  if (stripe) {
    doc.rect(50, y, 495, 16).fill(COLORS.bg);
  }
  columns.forEach((col) => {
    doc
      .fillColor(COLORS.secondary)
      .fontSize(7)
      .font("Helvetica")
      .text(col.value, col.x, y + 3, { width: col.width, align: col.align || "left" });
  });
  return y + 16;
}

// ===========================
// Report Configurations
// ===========================

const REPORT_CONFIGS = {
  invoices: {
    title: "INVOICES REPORT",
    columns: [
      { label: "Invoice #", key: "invoice_number", x: 52, width: 80 },
      { label: "Buyer", key: (r) => r.buyer?.name || "—", x: 135, width: 90 },
      { label: "Date", key: (r) => formatDate(r.invoice_date || r.createdAt), x: 228, width: 65 },
      { label: "Due", key: (r) => formatDate(r.due_date), x: 296, width: 65 },
      { label: "Amount", key: (r) => currency(r.total_amount), x: 364, width: 60, align: "right" },
      { label: "Paid", key: (r) => currency(r.amount_paid), x: 427, width: 55, align: "right" },
      { label: "Status", key: "status", x: 485, width: 55 },
    ],
  },
  orders: {
    title: "ORDERS REPORT",
    columns: [
      { label: "Order ID", key: "order_id", x: 52, width: 80 },
      { label: "Buyer", key: (r) => r.buyer?.name || "—", x: 135, width: 100 },
      { label: "Date", key: (r) => formatDate(r.createdAt), x: 238, width: 70 },
      { label: "Items", key: (r) => String(r.items?.length || 0), x: 312, width: 40, align: "center" },
      { label: "Amount", key: (r) => currency(r.total_amount), x: 355, width: 65, align: "right" },
      { label: "Status", key: "status", x: 425, width: 60 },
      { label: "Tracking", key: (r) => r.dispatch_info?.tracking_number || "—", x: 488, width: 55 },
    ],
  },
  quotations: {
    title: "QUOTATIONS REPORT",
    columns: [
      { label: "Quote #", key: "quote_number", x: 52, width: 80 },
      { label: "Buyer", key: (r) => r.buyer?.name || "—", x: 135, width: 100 },
      { label: "Date", key: (r) => formatDate(r.quote_date || r.createdAt), x: 238, width: 70 },
      { label: "Expiry", key: (r) => formatDate(r.expiry_date), x: 312, width: 70 },
      { label: "Amount", key: (r) => currency(r.total_amount), x: 385, width: 65, align: "right" },
      { label: "Status", key: "status", x: 455, width: 85 },
    ],
  },
  payments: {
    title: "PAYMENTS REPORT",
    columns: [
      { label: "Payment ID", key: "payment_id", x: 52, width: 80 },
      { label: "Buyer", key: (r) => r.buyer?.name || "—", x: 135, width: 95 },
      { label: "Invoice", key: (r) => r.invoice?.invoice_number || "—", x: 233, width: 75 },
      { label: "Date", key: (r) => formatDate(r.payment_date || r.createdAt), x: 312, width: 65 },
      { label: "Amount", key: (r) => currency(r.amount), x: 380, width: 60, align: "right" },
      { label: "Method", key: (r) => r.payment_method || "—", x: 443, width: 50 },
      { label: "Status", key: "status", x: 496, width: 48 },
    ],
  },
  products: {
    title: "PRODUCTS REPORT",
    columns: [
      { label: "Part #", key: "part_number", x: 52, width: 75 },
      { label: "Product Name", key: "product_name", x: 130, width: 140 },
      { label: "Category", key: "category", x: 273, width: 65 },
      { label: "Brand", key: "brand", x: 341, width: 55 },
      { label: "Price", key: (r) => currency(r.your_price || r.list_price), x: 399, width: 50, align: "right" },
      { label: "Stock", key: (r) => String(r.total_quantity || 0), x: 452, width: 40, align: "center" },
      { label: "Status", key: "stock_status", x: 495, width: 48 },
    ],
  },
  users: {
    title: "USERS REPORT",
    columns: [
      { label: "User ID", key: "user_id", x: 52, width: 80 },
      { label: "Name", key: "name", x: 135, width: 100 },
      { label: "Email", key: "email", x: 238, width: 120 },
      { label: "Company", key: (r) => r.company_details?.company_name || "—", x: 362, width: 90 },
      { label: "Role", key: "role", x: 455, width: 50 },
      { label: "Active", key: (r) => (r.is_active ? "Yes" : "No"), x: 508, width: 35 },
    ],
  },
  purchaseOrders: {
    title: "PURCHASE ORDERS REPORT",
    columns: [
      { label: "PO #", key: "po_number", x: 52, width: 80 },
      { label: "Buyer", key: (r) => r.buyer?.name || "—", x: 135, width: 100 },
      { label: "Date", key: (r) => formatDate(r.po_date || r.createdAt), x: 238, width: 70 },
      { label: "Items", key: (r) => String(r.items?.length || 0), x: 312, width: 40, align: "center" },
      { label: "Amount", key: (r) => currency(r.total_amount), x: 355, width: 65, align: "right" },
      { label: "Status", key: "status", x: 425, width: 115 },
    ],
  },
  statements: {
    title: "STATEMENTS REPORT",
    columns: [
      { label: "Statement #", key: "statement_id", x: 52, width: 80 },
      { label: "Buyer", key: (r) => r.buyer?.name || "—", x: 135, width: 100 },
      { label: "Period", key: (r) => `${formatDate(r.period_start)} - ${formatDate(r.period_end)}`, x: 238, width: 120 },
      { label: "Charges", key: (r) => currency(r.total_charges), x: 362, width: 60, align: "right" },
      { label: "Payments", key: (r) => currency(r.total_payments), x: 425, width: 60, align: "right" },
      { label: "Balance", key: (r) => currency(r.closing_balance), x: 488, width: 55, align: "right" },
    ],
  },
};

// ===========================
// Get cell value from row
// ===========================
function getCellValue(row, colConfig) {
  if (typeof colConfig.key === "function") {
    return colConfig.key(row);
  }
  return String(row[colConfig.key] ?? "—");
}

// ===========================
// Generate Report PDF
// ===========================
export function generateReportPDF(reportType, data, filters = {}) {
  const config = REPORT_CONFIGS[reportType];
  if (!config) {
    throw new Error(`Unknown report type: ${reportType}`);
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 40 });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      // Adjust columns for landscape (wider page: ~842 pts usable ~762 after margins)
      const landscapeCols = config.columns.map((col) => ({
        ...col,
        x: col.x + 40, // shift for landscape centering
      }));

      // --- Header ---
      doc
        .fillColor(COLORS.primary)
        .fontSize(18)
        .font("Helvetica-Bold")
        .text(config.title, 40, 30);

      doc
        .fillColor(COLORS.secondary)
        .fontSize(9)
        .font("Helvetica")
        .text(`Generated: ${formatDate(new Date())}`, 40, 55)
        .text(`Total Records: ${data.length}`, 40, 68);

      // Show active filters
      const filterEntries = Object.entries(filters).filter(([, v]) => v);
      if (filterEntries.length > 0) {
        const filterStr = filterEntries.map(([k, v]) => `${k}: ${v}`).join("  |  ");
        doc.fillColor(COLORS.light).fontSize(8).text(`Filters: ${filterStr}`, 40, 81);
      }

      drawLine(doc, 95, 40, 802);

      // --- Table ---
      let y = 105;
      y = drawTableHeader(doc, y, landscapeCols);

      data.forEach((row, i) => {
        if (y > 540) {
          doc.addPage();
          y = 40;
          y = drawTableHeader(doc, y, landscapeCols);
        }

        const rowCols = landscapeCols.map((col) => ({
          value: getCellValue(row, col),
          x: col.x,
          width: col.width,
          align: col.align || "left",
        }));

        y = drawTableRow(doc, y, rowCols, i % 2 === 0);
      });

      if (data.length === 0) {
        doc
          .fillColor(COLORS.light)
          .fontSize(10)
          .font("Helvetica")
          .text("No records found matching the applied filters.", 40, y + 20);
      }

      drawLine(doc, y + 2, 40, 802);

      // --- Summary for financial reports ---
      if (["invoices", "payments", "orders", "quotations", "purchaseOrders"].includes(reportType)) {
        y += 15;
        const amountField =
          reportType === "payments" ? "amount" : "total_amount";
        const total = data.reduce((sum, r) => sum + Number(r[amountField] || 0), 0);

        doc
          .fillColor(COLORS.primary)
          .fontSize(10)
          .font("Helvetica-Bold")
          .text(`Total Amount: ${currency(total)}`, 40, y);
      }

      // --- Footer ---
      doc
        .fillColor(COLORS.light)
        .fontSize(7)
        .font("Helvetica")
        .text("Generated by KB CRM", 40, 560, { align: "center", width: 762 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export { REPORT_CONFIGS };
