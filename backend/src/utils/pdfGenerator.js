import PDFDocument from "pdfkit";

// ===========================
// Shared helpers
// ===========================

const COLORS = {
  primary: "#1a237e",
  secondary: "#424242",
  light: "#9e9e9e",
  border: "#e0e0e0",
  bg: "#f5f5f5",
  white: "#ffffff",
  black: "#000000",
};

/**
 * Draw a horizontal line
 */
function drawLine(doc, y, x1 = 50, x2 = 545) {
  doc
    .strokeColor(COLORS.border)
    .lineWidth(0.5)
    .moveTo(x1, y)
    .lineTo(x2, y)
    .stroke();
}

/**
 * Draw a table header row (filled background)
 */
function drawTableHeader(doc, y, columns) {
  doc.rect(50, y, 495, 20).fill(COLORS.primary);

  columns.forEach((col) => {
    doc
      .fillColor(COLORS.white)
      .fontSize(9)
      .font("Helvetica-Bold")
      .text(col.label, col.x, y + 5, { width: col.width, align: col.align || "left" });
  });

  return y + 20;
}

/**
 * Draw a table data row
 */
function drawTableRow(doc, y, columns, stripe = false) {
  if (stripe) {
    doc.rect(50, y, 495, 18).fill(COLORS.bg);
  }

  columns.forEach((col) => {
    doc
      .fillColor(COLORS.secondary)
      .fontSize(8)
      .font("Helvetica")
      .text(col.value, col.x, y + 4, { width: col.width, align: col.align || "left" });
  });

  return y + 18;
}

/**
 * Format currency
 */
function currency(amount) {
  return `$${Number(amount || 0).toFixed(2)}`;
}

/**
 * Format date
 */
function formatDate(date) {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// ===========================
// Generate Invoice PDF
// ===========================
export function generateInvoicePDF(invoice) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      // --- Header ---
      doc
        .fillColor(COLORS.primary)
        .fontSize(22)
        .font("Helvetica-Bold")
        .text("INVOICE", 50, 50);

      doc
        .fillColor(COLORS.secondary)
        .fontSize(10)
        .font("Helvetica")
        .text(`Invoice #: ${invoice.invoice_number || "—"}`, 350, 50, { align: "right" })
        .text(`Date: ${formatDate(invoice.invoice_date)}`, 350, 65, { align: "right" })
        .text(`Due: ${formatDate(invoice.due_date)}`, 350, 80, { align: "right" })
        .text(`Status: ${invoice.status}`, 350, 95, { align: "right" });

      drawLine(doc, 115);

      // --- Bill To ---
      const buyer = invoice.buyer || {};
      doc
        .fillColor(COLORS.light)
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("BILL TO", 50, 130);

      doc
        .fillColor(COLORS.secondary)
        .fontSize(10)
        .font("Helvetica")
        .text(buyer.name || invoice.buyer_name || "—", 50, 145)
        .text(buyer.email || "", 50, 160)
        .text(buyer.phone || "", 50, 175);

      if (invoice.billing_address) {
        const addr = invoice.billing_address;
        const addrStr = [addr.street, addr.city, addr.state, addr.zip, addr.country]
          .filter(Boolean)
          .join(", ");
        if (addrStr) doc.text(addrStr, 50, 190);
      }

      // --- Order ref ---
      if (invoice.order) {
        const orderId = invoice.order.order_id || invoice.order;
        doc
          .fillColor(COLORS.light)
          .fontSize(9)
          .font("Helvetica-Bold")
          .text("ORDER REF", 350, 130);
        doc
          .fillColor(COLORS.secondary)
          .fontSize(10)
          .font("Helvetica")
          .text(String(orderId), 350, 145);
      }

      // --- Items Table ---
      let y = 225;

      const headerCols = [
        { label: "#", x: 52, width: 25, align: "left" },
        { label: "Item", x: 80, width: 200, align: "left" },
        { label: "Part #", x: 280, width: 80, align: "left" },
        { label: "Qty", x: 365, width: 40, align: "center" },
        { label: "Unit Price", x: 410, width: 60, align: "right" },
        { label: "Total", x: 475, width: 70, align: "right" },
      ];

      y = drawTableHeader(doc, y, headerCols);

      (invoice.items || []).forEach((item, i) => {
        if (y > 700) {
          doc.addPage();
          y = 50;
          y = drawTableHeader(doc, y, headerCols);
        }

        const rowCols = [
          { value: String(i + 1), x: 52, width: 25, align: "left" },
          { value: item.product_name || "—", x: 80, width: 200, align: "left" },
          { value: item.part_number || "—", x: 280, width: 80, align: "left" },
          { value: String(item.quantity), x: 365, width: 40, align: "center" },
          { value: currency(item.unit_price), x: 410, width: 60, align: "right" },
          { value: currency(item.total_price), x: 475, width: 70, align: "right" },
        ];

        y = drawTableRow(doc, y, rowCols, i % 2 === 0);
      });

      drawLine(doc, y + 2);

      // --- Totals ---
      y += 15;
      const totalsX = 400;
      const totalsValX = 475;
      const totalsW = 70;

      doc.fontSize(9).font("Helvetica");

      doc.fillColor(COLORS.secondary).text("Subtotal:", totalsX, y);
      doc.text(currency(invoice.subtotal), totalsValX, y, { width: totalsW, align: "right" });
      y += 16;

      doc.text("Tax:", totalsX, y);
      doc.text(currency(invoice.tax), totalsValX, y, { width: totalsW, align: "right" });
      y += 16;

      doc.text("Shipping:", totalsX, y);
      doc.text(currency(invoice.shipping), totalsValX, y, { width: totalsW, align: "right" });
      y += 16;

      drawLine(doc, y, totalsX, 545);
      y += 8;

      doc.fontSize(11).font("Helvetica-Bold").fillColor(COLORS.primary);
      doc.text("Total:", totalsX, y);
      doc.text(currency(invoice.total_amount), totalsValX, y, { width: totalsW, align: "right" });
      y += 20;

      doc.fontSize(9).font("Helvetica").fillColor(COLORS.secondary);
      doc.text("Amount Paid:", totalsX, y);
      doc.text(currency(invoice.amount_paid), totalsValX, y, { width: totalsW, align: "right" });
      y += 16;

      doc.font("Helvetica-Bold").fillColor(COLORS.primary);
      doc.text("Balance Due:", totalsX, y);
      doc.text(currency(invoice.balance_due), totalsValX, y, { width: totalsW, align: "right" });

      // --- Notes ---
      if (invoice.notes) {
        y += 40;
        doc.fillColor(COLORS.light).fontSize(9).font("Helvetica-Bold").text("NOTES", 50, y);
        y += 14;
        doc.fillColor(COLORS.secondary).fontSize(9).font("Helvetica").text(invoice.notes, 50, y, { width: 300 });
      }

      // --- Footer ---
      doc
        .fillColor(COLORS.light)
        .fontSize(8)
        .font("Helvetica")
        .text("Generated by KB CRM", 50, 760, { align: "center", width: 495 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ===========================
// Generate Statement PDF
// ===========================
export function generateStatementPDF(statement) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      // --- Header ---
      doc
        .fillColor(COLORS.primary)
        .fontSize(22)
        .font("Helvetica-Bold")
        .text("STATEMENT", 50, 50);

      doc
        .fillColor(COLORS.secondary)
        .fontSize(10)
        .font("Helvetica")
        .text(`Statement #: ${statement.statement_id || "—"}`, 350, 50, { align: "right" })
        .text(`Date: ${formatDate(statement.statement_date)}`, 350, 65, { align: "right" })
        .text(`Period: ${formatDate(statement.period_start)} — ${formatDate(statement.period_end)}`, 350, 80, { align: "right" });

      drawLine(doc, 105);

      // --- Customer ---
      const buyer = statement.buyer || {};
      doc
        .fillColor(COLORS.light)
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("CUSTOMER", 50, 120);

      doc
        .fillColor(COLORS.secondary)
        .fontSize(10)
        .font("Helvetica")
        .text(buyer.name || "—", 50, 135)
        .text(buyer.email || "", 50, 150)
        .text(buyer.phone || "", 50, 165);

      // --- Summary Box ---
      let y = 195;
      doc.rect(50, y, 495, 70).fill(COLORS.bg);

      doc.fillColor(COLORS.secondary).fontSize(9).font("Helvetica-Bold");
      doc.text("Opening Balance", 65, y + 10);
      doc.text("Total Charges", 185, y + 10);
      doc.text("Total Payments", 305, y + 10);
      doc.text("Closing Balance", 425, y + 10);

      doc.fontSize(14).font("Helvetica-Bold").fillColor(COLORS.primary);
      doc.text(currency(statement.opening_balance), 65, y + 30);
      doc.text(currency(statement.total_charges), 185, y + 30);
      doc.text(currency(statement.total_payments), 305, y + 30);
      doc.text(currency(statement.closing_balance), 425, y + 30);

      // --- Aging ---
      y = 280;
      doc.fillColor(COLORS.light).fontSize(9).font("Helvetica-Bold").text("AGING SUMMARY", 50, y);
      y += 16;

      doc.fillColor(COLORS.secondary).fontSize(9).font("Helvetica");
      doc.text(`Current: ${currency(statement.current_due)}`, 50, y);
      doc.text(`30 Days: ${currency(statement.past_due_30)}`, 170, y);
      doc.text(`60 Days: ${currency(statement.past_due_60)}`, 290, y);
      doc.text(`90+ Days: ${currency(statement.past_due_90)}`, 410, y);

      // --- Transactions Table ---
      y += 30;
      doc.fillColor(COLORS.light).fontSize(9).font("Helvetica-Bold").text("TRANSACTIONS", 50, y);
      y += 16;

      const headerCols = [
        { label: "Date", x: 52, width: 80, align: "left" },
        { label: "Type", x: 135, width: 65, align: "left" },
        { label: "Reference", x: 205, width: 90, align: "left" },
        { label: "Description", x: 300, width: 100, align: "left" },
        { label: "Charges", x: 400, width: 60, align: "right" },
        { label: "Payments", x: 460, width: 60, align: "right" },
      ];

      y = drawTableHeader(doc, y, headerCols);

      (statement.transactions || []).forEach((txn, i) => {
        if (y > 700) {
          doc.addPage();
          y = 50;
          y = drawTableHeader(doc, y, headerCols);
        }

        const rowCols = [
          { value: formatDate(txn.date), x: 52, width: 80, align: "left" },
          { value: txn.type || "—", x: 135, width: 65, align: "left" },
          { value: txn.reference || "—", x: 205, width: 90, align: "left" },
          { value: txn.description || "—", x: 300, width: 100, align: "left" },
          { value: txn.charges ? currency(txn.charges) : "—", x: 400, width: 60, align: "right" },
          { value: txn.payments ? currency(txn.payments) : "—", x: 460, width: 60, align: "right" },
        ];

        y = drawTableRow(doc, y, rowCols, i % 2 === 0);
      });

      drawLine(doc, y + 2);

      // --- Footer ---
      doc
        .fillColor(COLORS.light)
        .fontSize(8)
        .font("Helvetica")
        .text("Generated by KB CRM", 50, 760, { align: "center", width: 495 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ===========================
// Generate Quotation PDF
// ===========================
export function generateQuotationPDF(quotation) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      // --- Header ---
      doc
        .fillColor(COLORS.primary)
        .fontSize(22)
        .font("Helvetica-Bold")
        .text("QUOTATION", 50, 50);

      doc
        .fillColor(COLORS.secondary)
        .fontSize(10)
        .font("Helvetica")
        .text(`Quote #: ${quotation.quote_number || "—"}`, 350, 50, { align: "right" })
        .text(`Date: ${formatDate(quotation.quote_date)}`, 350, 65, { align: "right" })
        .text(`Valid Until: ${formatDate(quotation.expiry_date)}`, 350, 80, { align: "right" })
        .text(`Status: ${quotation.status}`, 350, 95, { align: "right" });

      drawLine(doc, 115);

      // --- Customer ---
      const buyer = quotation.buyer || {};
      doc.fillColor(COLORS.light).fontSize(9).font("Helvetica-Bold").text("CUSTOMER", 50, 130);
      doc
        .fillColor(COLORS.secondary)
        .fontSize(10)
        .font("Helvetica")
        .text(buyer.name || quotation.buyer_name || "—", 50, 145)
        .text(buyer.email || "", 50, 160)
        .text(buyer.phone || "", 50, 175);

      // --- Items Table ---
      let y = 205;

      const headerCols = [
        { label: "#", x: 52, width: 25, align: "left" },
        { label: "Item", x: 80, width: 200, align: "left" },
        { label: "Part #", x: 280, width: 80, align: "left" },
        { label: "Qty", x: 365, width: 40, align: "center" },
        { label: "Unit Price", x: 410, width: 60, align: "right" },
        { label: "Total", x: 475, width: 70, align: "right" },
      ];

      y = drawTableHeader(doc, y, headerCols);

      (quotation.items || []).forEach((item, i) => {
        if (y > 700) {
          doc.addPage();
          y = 50;
          y = drawTableHeader(doc, y, headerCols);
        }

        const rowCols = [
          { value: String(i + 1), x: 52, width: 25, align: "left" },
          { value: item.product_name || "—", x: 80, width: 200, align: "left" },
          { value: item.part_number || "—", x: 280, width: 80, align: "left" },
          { value: String(item.quantity), x: 365, width: 40, align: "center" },
          { value: currency(item.unit_price), x: 410, width: 60, align: "right" },
          { value: currency(item.total_price), x: 475, width: 70, align: "right" },
        ];

        y = drawTableRow(doc, y, rowCols, i % 2 === 0);
      });

      drawLine(doc, y + 2);

      // --- Totals ---
      y += 15;
      const tX = 400;
      const tVX = 475;
      const tW = 70;

      doc.fontSize(9).font("Helvetica").fillColor(COLORS.secondary);
      doc.text("Subtotal:", tX, y);
      doc.text(currency(quotation.subtotal), tVX, y, { width: tW, align: "right" });
      y += 16;
      doc.text("Tax:", tX, y);
      doc.text(currency(quotation.tax), tVX, y, { width: tW, align: "right" });
      y += 16;
      doc.text("Shipping:", tX, y);
      doc.text(currency(quotation.shipping), tVX, y, { width: tW, align: "right" });
      y += 16;
      drawLine(doc, y, tX, 545);
      y += 8;

      doc.fontSize(11).font("Helvetica-Bold").fillColor(COLORS.primary);
      doc.text("Total:", tX, y);
      doc.text(currency(quotation.total_amount), tVX, y, { width: tW, align: "right" });

      // --- Notes ---
      if (quotation.customer_notes) {
        y += 40;
        doc.fillColor(COLORS.light).fontSize(9).font("Helvetica-Bold").text("CUSTOMER NOTES", 50, y);
        y += 14;
        doc.fillColor(COLORS.secondary).fontSize(9).font("Helvetica").text(quotation.customer_notes, 50, y, { width: 300 });
      }

      // --- Footer ---
      doc
        .fillColor(COLORS.light)
        .fontSize(8)
        .font("Helvetica")
        .text("Generated by KB CRM", 50, 760, { align: "center", width: 495 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
