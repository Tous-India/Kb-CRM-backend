/**
 * Email Service Utility
 * Handles all email sending functionality using Nodemailer
 */

import nodemailer from "nodemailer";
import { emailTemplates } from "./emailTemplates.js";

// Email configuration from environment variables
const emailConfig = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

// Default sender configuration
const defaultFrom = {
  name: process.env.EMAIL_FROM_NAME || "KB Enterprises",
  address: process.env.EMAIL_FROM_ADDRESS || "info@kbenterprise.org",
};

// Create transporter (singleton)
let transporter = null;

const createTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport(emailConfig);
  }
  return transporter;
};

/**
 * Verify SMTP connection
 */
export const verifyConnection = async () => {
  try {
    const transport = createTransporter();
    await transport.verify();
    console.log("[EmailService] SMTP connection verified successfully");
    return true;
  } catch (error) {
    console.error("[EmailService] SMTP connection failed:", error.message);
    return false;
  }
};

/**
 * Send email - Generic function
 */
export const sendEmail = async ({
  to,
  subject,
  html,
  text,
  attachments = [],
  replyTo = process.env.EMAIL_REPLY_TO,
}) => {
  const transport = createTransporter();

  const mailOptions = {
    from: `"${defaultFrom.name}" <${defaultFrom.address}>`,
    to,
    subject,
    html,
    text: text || subject,
    replyTo: replyTo || defaultFrom.address,
    attachments,
  };

  const info = await transport.sendMail(mailOptions);
  console.log(`[EmailService] Email sent to ${to}: ${info.messageId}`);
  return info;
};

/**
 * Send Quotation Email
 */
export const sendQuotationEmail = async (quotation, recipientEmail, options = {}) => {
  const { customMessage, pdfBuffer } = options;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  const subject = `Quotation ${quotation.quote_number} from KB Enterprises`;
  const html = emailTemplates.quotation(quotation, frontendUrl, customMessage);

  const attachments = [];
  if (pdfBuffer) {
    attachments.push({
      filename: `Quotation-${quotation.quote_number}.pdf`,
      content: pdfBuffer,
      contentType: "application/pdf",
    });
  }

  return sendEmail({
    to: recipientEmail,
    subject,
    html,
    attachments,
  });
};

/**
 * Send Proforma Invoice Email
 */
export const sendProformaEmail = async (proforma, recipientEmail, options = {}) => {
  const { customMessage, pdfBuffer } = options;

  const subject = `Proforma Invoice ${proforma.proforma_number} - Payment Required`;
  const html = emailTemplates.proformaInvoice(proforma, customMessage);

  const attachments = [];
  if (pdfBuffer) {
    attachments.push({
      filename: `ProformaInvoice-${proforma.proforma_number}.pdf`,
      content: pdfBuffer,
      contentType: "application/pdf",
    });
  }

  return sendEmail({
    to: recipientEmail,
    subject,
    html,
    attachments,
  });
};

/**
 * Send Invoice Email
 */
export const sendInvoiceEmail = async (invoice, recipientEmail, options = {}) => {
  const { customMessage, pdfBuffer } = options;

  const subject = `Invoice ${invoice.invoice_number} - KB Enterprises`;
  const html = emailTemplates.invoice(invoice, customMessage);

  const attachments = [];
  if (pdfBuffer) {
    attachments.push({
      filename: `Invoice-${invoice.invoice_number}.pdf`,
      content: pdfBuffer,
      contentType: "application/pdf",
    });
  }

  return sendEmail({
    to: recipientEmail,
    subject,
    html,
    attachments,
  });
};

/**
 * Send Dispatch Notification Email
 */
export const sendDispatchEmail = async (dispatch, recipientEmail, options = {}) => {
  const { customMessage } = options;

  const subject = `Your Order Has Been Dispatched - ${dispatch.dispatch_id}`;
  const html = emailTemplates.dispatch(dispatch, customMessage);

  return sendEmail({
    to: recipientEmail,
    subject,
    html,
  });
};

// =====================================================
// ADMIN NOTIFICATION EMAILS (Buyer → Admin)
// =====================================================

// Get admin notification email from environment
const getAdminEmail = () => {
  return process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER;
};

/**
 * Send Admin: New Order/Quote Request Notification
 */
export const sendAdminNewOrderEmail = async (order, buyer) => {
  const adminEmail = getAdminEmail();
  if (!adminEmail) {
    console.error("[EmailService] ADMIN_NOTIFICATION_EMAIL not configured");
    return null;
  }

  const subject = `🛒 New Quote Request from ${buyer.company_name || buyer.name || "Buyer"}`;
  const html = emailTemplates.adminNewOrder(order, buyer);

  return sendEmail({
    to: adminEmail,
    subject,
    html,
  });
};

/**
 * Send Admin: Quotation Accepted Notification
 */
export const sendAdminQuotationAcceptedEmail = async (quotation, buyer, shippingAddress = null) => {
  const adminEmail = getAdminEmail();
  if (!adminEmail) {
    console.error("[EmailService] ADMIN_NOTIFICATION_EMAIL not configured");
    return null;
  }

  const subject = `✅ Quotation ${quotation.quote_number} Accepted by ${buyer.name || buyer.company_name || "Buyer"}`;
  const html = emailTemplates.adminQuotationAccepted(quotation, buyer, shippingAddress);

  return sendEmail({
    to: adminEmail,
    subject,
    html,
  });
};

/**
 * Send Admin: Quotation Rejected Notification
 */
export const sendAdminQuotationRejectedEmail = async (quotation, buyer, reason = "") => {
  const adminEmail = getAdminEmail();
  if (!adminEmail) {
    console.error("[EmailService] ADMIN_NOTIFICATION_EMAIL not configured");
    return null;
  }

  const subject = `❌ Quotation ${quotation.quote_number} Rejected by ${buyer.name || buyer.company_name || "Buyer"}`;
  const html = emailTemplates.adminQuotationRejected(quotation, buyer, reason);

  return sendEmail({
    to: adminEmail,
    subject,
    html,
  });
};

/**
 * Send Admin: Payment Submitted Notification
 */
export const sendAdminPaymentSubmittedEmail = async (paymentRecord, pi, buyer) => {
  const adminEmail = getAdminEmail();
  if (!adminEmail) {
    console.error("[EmailService] ADMIN_NOTIFICATION_EMAIL not configured");
    return null;
  }

  const subject = `💰 Payment Submitted for ${pi?.proforma_number || "PI"} - Verification Required`;
  const html = emailTemplates.adminPaymentSubmitted(paymentRecord, pi, buyer);

  return sendEmail({
    to: adminEmail,
    subject,
    html,
  });
};

/**
 * Send Buyer Inquiry Email to Admin
 * Used when buyer wants to ask questions about quotations, PIs, etc.
 */
export const sendBuyerInquiryEmail = async (inquiry) => {
  const adminEmail = getAdminEmail();
  if (!adminEmail) {
    console.error("[EmailService] ADMIN_NOTIFICATION_EMAIL not configured");
    return null;
  }

  const subject = `📩 Inquiry: ${inquiry.subject}`;
  const html = emailTemplates.buyerInquiry(inquiry);

  return sendEmail({
    to: adminEmail,
    subject,
    html,
    replyTo: inquiry.buyer.email, // Set reply-to as buyer's email for easy response
  });
};

// =====================================================
// REGISTRATION & PASSWORD RESET EMAILS
// =====================================================

/**
 * Send Registration OTP Email
 * Sent to user during registration to verify their email
 */
export const sendRegistrationOTP = async (email, name, otp) => {
  const subject = "Verify Your Email - KB Enterprises";
  const html = emailTemplates.registrationOTP(name, otp);

  return sendEmail({
    to: email,
    subject,
    html,
  });
};

/**
 * Send Password Reset OTP Email
 * Sent to user when they request to reset their password
 */
export const sendPasswordResetOTP = async (email, name, otp) => {
  const subject = "Password Reset OTP - KB Enterprises";
  const html = emailTemplates.passwordResetOTP(name, otp);

  return sendEmail({
    to: email,
    subject,
    html,
  });
};

/**
 * Send Admin: New Registration Notification
 * Sent to admin when a new buyer completes registration (pending approval)
 */
export const sendAdminNewRegistrationEmail = async (user) => {
  const adminEmail = getAdminEmail();
  if (!adminEmail) {
    console.error("[EmailService] ADMIN_NOTIFICATION_EMAIL not configured");
    return null;
  }

  const subject = `👤 New Buyer Registration: ${user.name || user.email} - Pending Approval`;
  const html = emailTemplates.adminNewRegistration(user);

  return sendEmail({
    to: adminEmail,
    subject,
    html,
  });
};

/**
 * Send Buyer Approval Email
 * Sent to buyer when their registration is approved by admin
 */
export const sendBuyerApprovalEmail = async (user) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const subject = "🎉 Registration Approved - Welcome to KB Enterprises!";
  const html = emailTemplates.buyerApproval(user, frontendUrl);

  return sendEmail({
    to: user.email,
    subject,
    html,
  });
};

/**
 * Send Buyer Rejection Email
 * Sent to buyer when their registration is rejected by admin
 */
export const sendBuyerRejectionEmail = async (user, reason = "") => {
  const subject = "Registration Update - KB Enterprises";
  const html = emailTemplates.buyerRejection(user, reason);

  return sendEmail({
    to: user.email,
    subject,
    html,
  });
};

export default {
  verifyConnection,
  sendEmail,
  sendQuotationEmail,
  sendProformaEmail,
  sendInvoiceEmail,
  sendDispatchEmail,
  // Admin notifications
  sendAdminNewOrderEmail,
  sendAdminQuotationAcceptedEmail,
  sendAdminQuotationRejectedEmail,
  sendAdminPaymentSubmittedEmail,
  // Buyer inquiries
  sendBuyerInquiryEmail,
  // Registration & Password Reset
  sendRegistrationOTP,
  sendPasswordResetOTP,
  sendAdminNewRegistrationEmail,
  sendBuyerApprovalEmail,
  sendBuyerRejectionEmail,
};
