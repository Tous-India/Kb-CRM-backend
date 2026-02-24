import PaymentRecord from "./paymentRecords.model.js";
import ProformaInvoice from "../proformaInvoices/proformaInvoices.model.js";
import catchAsync from "../../utils/catchAsync.js";
import ApiResponse from "../../utils/apiResponse.js";
import AppError from "../../utils/AppError.js";
import { ROLES } from "../../constants/index.js";
import { uploadToCloudinary } from "../../utils/cloudinaryUpload.js";
import { sendAdminPaymentSubmittedEmail } from "../../utils/emailService.js";

// ===========================
// GET /api/payment-records
// ===========================
// Admin only — fetch all payment records
export const getAll = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [records, total] = await Promise.all([
    PaymentRecord.find(filter)
      .populate("buyer", "name email user_id")
      .populate("proforma_invoice", "proforma_number total_amount payment_received exchange_rate")
      .populate("verified_by", "name email")
      .populate("collected_by", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    PaymentRecord.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, records, page, limit, total, "Payment records fetched");
});

// ===========================
// GET /api/payment-records/pending
// ===========================
// Admin only — fetch pending payment records
export const getPending = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const filter = { status: "PENDING" };
  const skip = (Number(page) - 1) * Number(limit);

  const [records, total] = await Promise.all([
    PaymentRecord.find(filter)
      .populate("buyer", "name email user_id")
      .populate("proforma_invoice", "proforma_number total_amount payment_received payment_status exchange_rate")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    PaymentRecord.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, records, page, limit, total, "Pending payment records fetched");
});

// ===========================
// GET /api/payment-records/my
// ===========================
// Buyer only — fetch my payment records
export const getMyRecords = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const filter = { buyer: req.user._id };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [records, total] = await Promise.all([
    PaymentRecord.find(filter)
      .populate("proforma_invoice", "proforma_number total_amount")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    PaymentRecord.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, records, page, limit, total, "My payment records fetched");
});

// ===========================
// GET /api/payment-records/by-pi/:piId
// ===========================
// Get payment records for a specific PI
export const getByProformaInvoice = catchAsync(async (req, res) => {
  const { piId } = req.params;

  const filter = { proforma_invoice: piId };

  // If not admin, only show buyer's own records
  const isAdminUser = req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.SUB_ADMIN;
  if (!isAdminUser) {
    filter.buyer = req.user._id;
  }

  const records = await PaymentRecord.find(filter)
    .populate("buyer", "name email")
    .populate("verified_by", "name")
    .sort({ createdAt: -1 });

  return ApiResponse.success(res, { records }, "Payment records fetched");
});

// ===========================
// POST /api/payment-records
// ===========================
// Buyer only — submit a payment record for verification
export const create = catchAsync(async (req, res) => {
  const {
    proforma_invoice_id,
    proforma_number,
    amount,
    currency,
    transaction_id,
    payment_method,
    payment_date,
    notes,
  } = req.body;

  // Validate PI exists
  const pi = await ProformaInvoice.findById(proforma_invoice_id);
  if (!pi) {
    throw new AppError("Proforma invoice not found", 404);
  }

  // Validate buyer owns this PI
  if (pi.buyer.toString() !== req.user._id.toString()) {
    throw new AppError("You can only submit payments for your own proforma invoices", 403);
  }

  // Handle file upload to Cloudinary if provided
  let proof_file = null;
  let proof_file_url = null;

  if (req.file) {
    console.log("[PaymentRecords] File received:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      hasBuffer: !!req.file.buffer,
      bufferLength: req.file.buffer?.length,
    });

    try {
      // Use "auto" resource_type to support both images and PDFs
      const uploadResult = await uploadToCloudinary(req.file.buffer, "payment-proofs", {
        resource_type: "auto",
      });
      proof_file = req.file.originalname;
      proof_file_url = uploadResult.secure_url;
      console.log("[PaymentRecords] Cloudinary upload success:", proof_file_url);
    } catch (uploadError) {
      console.error("[PaymentRecords] Cloudinary upload failed:", uploadError.message);
      // Store filename even if Cloudinary upload fails
      proof_file = req.file.originalname;
    }
  } else {
    console.log("[PaymentRecords] No file in request. Check if FormData is being sent correctly.");
  }

  // Create payment record
  const record = await PaymentRecord.create({
    proforma_invoice: proforma_invoice_id,
    proforma_number: proforma_number || pi.proforma_number,
    buyer: req.user._id,
    buyer_name: req.user.name,
    buyer_email: req.user.email,
    amount,
    currency: currency || "USD",
    transaction_id,
    payment_method: payment_method || "BANK_TRANSFER",
    payment_date: payment_date || new Date(),
    notes,
    proof_file,
    proof_file_url,
    status: "PENDING",
  });

  // Send email notification to admin
  try {
    await sendAdminPaymentSubmittedEmail(
      record,
      pi,
      {
        name: req.user.name,
        email: req.user.email,
        company_name: req.user.company_name || pi.buyer_name,
      }
    );
  } catch (emailError) {
    console.error("[PaymentRecords] Admin notification email failed:", emailError.message);
    // Don't fail the request if email fails
  }

  return ApiResponse.created(res, { record }, "Payment record submitted for verification");
});

// ===========================
// PUT /api/payment-records/:id/verify
// ===========================
// Admin only — verify a payment record and update PI
export const verify = catchAsync(async (req, res) => {
  const { id } = req.params;
  const {
    recorded_amount,
    verification_notes,
    payment_method,
    payment_date,
    transaction_id,
    generate_invoice,
  } = req.body;

  const record = await PaymentRecord.findById(id);
  if (!record) {
    throw new AppError("Payment record not found", 404);
  }

  if (record.status !== "PENDING") {
    throw new AppError("This payment record has already been processed", 400);
  }

  // Get the proforma invoice
  const pi = await ProformaInvoice.findById(record.proforma_invoice);
  if (!pi) {
    throw new AppError("Proforma invoice not found", 404);
  }

  // Use recorded_amount if provided, otherwise use the submitted amount
  const amountToRecord = recorded_amount !== undefined ? parseFloat(recorded_amount) : record.amount;

  // Use admin-provided values if available, otherwise use original record values
  const finalPaymentMethod = payment_method || record.payment_method;
  const finalTransactionId = transaction_id || record.transaction_id;
  const finalPaymentDate = payment_date ? new Date(payment_date) : record.payment_date;
  // Always use PI's exchange rate for payment collection
  const finalExchangeRate = pi.exchange_rate || 83.5;

  // Update PI payment info
  const newPaymentReceived = (pi.payment_received || 0) + amountToRecord;
  const newPaymentStatus = newPaymentReceived >= pi.total_amount ? "PAID" :
    newPaymentReceived > 0 ? "PARTIAL" : "UNPAID";

  // Add to payment history with exchange rate
  const paymentHistoryEntry = {
    payment_id: `PAY-${Date.now()}`,
    amount: amountToRecord,
    currency: record.currency || "USD",
    amount_inr: amountToRecord * finalExchangeRate,
    exchange_rate_at_payment: finalExchangeRate,
    payment_method: finalPaymentMethod,
    transaction_id: finalTransactionId,
    payment_date: finalPaymentDate,
    notes: record.notes,
    recorded_at: new Date(),
    verified_by: req.user._id,
  };

  pi.payment_received = newPaymentReceived;
  pi.payment_status = newPaymentStatus;
  pi.payment_history = [...(pi.payment_history || []), paymentHistoryEntry];
  await pi.save();

  // Update payment record status
  record.status = "VERIFIED";
  record.verified_by = req.user._id;
  record.verified_at = new Date();
  record.verification_notes = verification_notes;
  record.recorded_amount = amountToRecord;
  await record.save();

  // Populate for response
  await record.populate("buyer", "name email");
  await record.populate("proforma_invoice", "proforma_number total_amount payment_received payment_status");

  // TODO: Generate invoice if requested
  // For now, we just return the updated data. Invoice generation can be added later.
  const responseData = { record, proforma_invoice: pi };

  return ApiResponse.success(res, responseData, "Payment verified and recorded successfully");
});

// ===========================
// PUT /api/payment-records/:id/reject
// ===========================
// Admin only — reject a payment record
export const reject = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { verification_notes } = req.body;

  const record = await PaymentRecord.findById(id);
  if (!record) {
    throw new AppError("Payment record not found", 404);
  }

  if (record.status !== "PENDING") {
    throw new AppError("This payment record has already been processed", 400);
  }

  // Update payment record status
  record.status = "REJECTED";
  record.verified_by = req.user._id;
  record.verified_at = new Date();
  record.verification_notes = verification_notes || "Payment rejected by admin";
  await record.save();

  await record.populate("buyer", "name email");

  return ApiResponse.success(res, { record }, "Payment record rejected");
});

// ===========================
// GET /api/payment-records/:id
// ===========================
// Get single payment record
export const getById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const record = await PaymentRecord.findById(id)
    .populate("buyer", "name email user_id")
    .populate("proforma_invoice", "proforma_number total_amount payment_received exchange_rate")
    .populate("verified_by", "name email");

  if (!record) {
    throw new AppError("Payment record not found", 404);
  }

  // Check access
  const isAdminUser = req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.SUB_ADMIN;
  if (!isAdminUser && record.buyer._id.toString() !== req.user._id.toString()) {
    throw new AppError("You can only view your own payment records", 403);
  }

  return ApiResponse.success(res, { record }, "Payment record fetched");
});

// ===========================
// PUT /api/payment-records/:id/update-proof
// ===========================
// Buyer only — update payment proof image
export const updateProof = catchAsync(async (req, res) => {
  const { id } = req.params;

  const record = await PaymentRecord.findById(id);
  if (!record) {
    throw new AppError("Payment record not found", 404);
  }

  // Only buyer who owns this record can update
  if (record.buyer.toString() !== req.user._id.toString()) {
    throw new AppError("You can only update your own payment records", 403);
  }

  // Only allow update for PENDING records
  if (record.status !== "PENDING") {
    throw new AppError("Cannot update proof for already processed payment records", 400);
  }

  // Check if file is provided
  if (!req.file) {
    throw new AppError("Please upload a payment proof file", 400);
  }

  console.log("[PaymentRecords] Update proof - File received:", {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });

  try {
    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file.buffer, "payment-proofs", {
      resource_type: "auto",
    });

    // Update record with new proof
    record.proof_file = req.file.originalname;
    record.proof_file_url = uploadResult.secure_url;
    await record.save();

    console.log("[PaymentRecords] Proof updated successfully:", record.proof_file_url);

    return ApiResponse.success(res, { record }, "Payment proof updated successfully");
  } catch (uploadError) {
    console.error("[PaymentRecords] Failed to upload proof:", uploadError.message);
    throw new AppError("Failed to upload payment proof. Please try again.", 500);
  }
});

// ===========================
// PUT /api/payment-records/:id
// ===========================
// Buyer only — update payment record before admin verification
export const update = catchAsync(async (req, res) => {
  const { id } = req.params;
  const {
    amount,
    transaction_id,
    payment_method,
    payment_date,
    notes,
  } = req.body;

  const record = await PaymentRecord.findById(id);
  if (!record) {
    throw new AppError("Payment record not found", 404);
  }

  // Only buyer who owns this record can update
  if (record.buyer.toString() !== req.user._id.toString()) {
    throw new AppError("You can only update your own payment records", 403);
  }

  // Only allow update for PENDING records
  if (record.status !== "PENDING") {
    throw new AppError("Cannot update payment records that have been verified or rejected", 400);
  }

  // Update fields if provided
  if (amount !== undefined) record.amount = amount;
  if (transaction_id) record.transaction_id = transaction_id;
  if (payment_method) record.payment_method = payment_method;
  if (payment_date) record.payment_date = payment_date;
  if (notes !== undefined) record.notes = notes;

  // Handle file upload if provided
  if (req.file) {
    console.log("[PaymentRecords] Update - New proof file received:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    try {
      const uploadResult = await uploadToCloudinary(req.file.buffer, "payment-proofs", {
        resource_type: "auto",
      });
      record.proof_file = req.file.originalname;
      record.proof_file_url = uploadResult.secure_url;
      console.log("[PaymentRecords] Update - Proof uploaded:", record.proof_file_url);
    } catch (uploadError) {
      console.error("[PaymentRecords] Update - Cloudinary upload failed:", uploadError.message);
      // Continue with other updates even if image upload fails
    }
  }

  await record.save();

  return ApiResponse.success(res, { record }, "Payment record updated successfully");
});

// ===========================
// PUT /api/payment-records/:id/admin-update
// ===========================
// Admin only — edit a payment record (even after verification)
// Used to correct mistakes in amount, transaction details, etc.
export const adminUpdate = catchAsync(async (req, res) => {
  const { id } = req.params;
  const {
    amount,
    recorded_amount,
    transaction_id,
    payment_method,
    payment_date,
    notes,
    verification_notes,
    payment_exchange_rate,
  } = req.body;

  const record = await PaymentRecord.findById(id);
  if (!record) {
    throw new AppError("Payment record not found", 404);
  }

  // Get the proforma invoice
  const pi = await ProformaInvoice.findById(record.proforma_invoice);
  if (!pi) {
    throw new AppError("Proforma invoice not found", 404);
  }

  // Store original recorded amount for PI adjustment
  const originalRecordedAmount = record.recorded_amount || record.amount || 0;

  // Determine new amount
  const newRecordedAmount = recorded_amount !== undefined
    ? parseFloat(recorded_amount)
    : (amount !== undefined ? parseFloat(amount) : originalRecordedAmount);

  // Calculate the difference for PI adjustment
  const amountDifference = newRecordedAmount - originalRecordedAmount;

  // Update record fields
  if (amount !== undefined) record.amount = parseFloat(amount);
  if (recorded_amount !== undefined) record.recorded_amount = parseFloat(recorded_amount);
  if (transaction_id !== undefined) record.transaction_id = transaction_id;
  if (payment_method !== undefined) record.payment_method = payment_method;
  if (payment_date !== undefined) record.payment_date = new Date(payment_date);
  if (notes !== undefined) record.notes = notes;
  if (verification_notes !== undefined) record.verification_notes = verification_notes;

  // Track the edit
  record.last_edited_by = req.user._id;
  record.last_edited_at = new Date();

  // Handle file upload if provided
  if (req.file) {
    console.log("[PaymentRecords] Admin update - File received:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    try {
      const uploadResult = await uploadToCloudinary(req.file.buffer, "payment-proofs", {
        resource_type: "auto",
      });
      record.proof_file = req.file.originalname;
      record.proof_file_url = uploadResult.secure_url;
      console.log("[PaymentRecords] Admin update - Proof uploaded:", record.proof_file_url);
    } catch (uploadError) {
      console.error("[PaymentRecords] Admin update - Cloudinary upload failed:", uploadError.message);
    }
  }

  await record.save();

  // If record was verified and amount changed, update PI
  if (record.status === "VERIFIED" && amountDifference !== 0) {
    const exchangeRate = payment_exchange_rate
      ? parseFloat(payment_exchange_rate)
      : (pi.exchange_rate || 83.5);

    // Adjust PI payment_received
    const newPaymentReceived = Math.max(0, (pi.payment_received || 0) + amountDifference);
    const newPaymentStatus = newPaymentReceived >= pi.total_amount ? "PAID" :
      newPaymentReceived > 0 ? "PARTIAL" : "UNPAID";

    pi.payment_received = newPaymentReceived;
    pi.payment_status = newPaymentStatus;

    // Find and update the payment history entry if it exists
    if (pi.payment_history && pi.payment_history.length > 0) {
      // Try to find the matching entry by looking for similar details
      const historyIndex = pi.payment_history.findIndex(entry => {
        // Match by recorded_at timestamp being close to record verified_at
        const verifiedAt = record.verified_at ? new Date(record.verified_at).getTime() : 0;
        const recordedAt = entry.recorded_at ? new Date(entry.recorded_at).getTime() : 0;
        // Within 60 seconds of each other or matching transaction_id
        return Math.abs(verifiedAt - recordedAt) < 60000 ||
               (entry.transaction_id && entry.transaction_id === record.transaction_id);
      });

      if (historyIndex !== -1) {
        // Update the existing history entry
        pi.payment_history[historyIndex] = {
          ...pi.payment_history[historyIndex],
          amount: newRecordedAmount,
          amount_inr: newRecordedAmount * exchangeRate,
          exchange_rate_at_payment: exchangeRate,
          payment_method: record.payment_method,
          transaction_id: record.transaction_id,
          payment_date: record.payment_date,
          notes: record.notes,
          last_edited_at: new Date(),
          last_edited_by: req.user._id,
        };
      } else {
        // Add edit note to payment history
        pi.payment_history.push({
          payment_id: `EDIT-${Date.now()}`,
          amount: amountDifference,
          currency: record.currency || "USD",
          amount_inr: amountDifference * exchangeRate,
          exchange_rate_at_payment: exchangeRate,
          payment_method: "ADJUSTMENT",
          transaction_id: `ADJ-${record._id}`,
          payment_date: new Date(),
          notes: `Payment record adjusted by ${amountDifference > 0 ? '+' : ''}${amountDifference}`,
          recorded_at: new Date(),
          verified_by: req.user._id,
        });
      }
    }

    await pi.save();
  }

  // Populate for response
  await record.populate("buyer", "name email");
  await record.populate("proforma_invoice", "proforma_number total_amount payment_received payment_status");
  await record.populate("verified_by", "name email");

  return ApiResponse.success(
    res,
    { record, proforma_invoice: pi },
    "Payment record updated successfully"
  );
});

// ===========================
// POST /api/payment-records/admin-collect
// ===========================
// Admin only — directly collect payment (without buyer submission)
// Used when buyer contacts via phone, email, or in-person
export const adminCollect = catchAsync(async (req, res) => {
  const {
    proforma_invoice_id,
    amount,
    currency,
    transaction_id,
    payment_method,
    payment_date,
    notes,
    collection_source,
    payment_exchange_rate,
  } = req.body;

  // Validate PI exists
  const pi = await ProformaInvoice.findById(proforma_invoice_id);
  if (!pi) {
    throw new AppError("Proforma invoice not found", 404);
  }

  if (!amount || parseFloat(amount) <= 0) {
    throw new AppError("Payment amount is required and must be greater than 0", 400);
  }

  // Handle file upload to Cloudinary if provided
  let proof_file = null;
  let proof_file_url = null;

  if (req.file) {
    console.log("[PaymentRecords] Admin collect - File received:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    try {
      const uploadResult = await uploadToCloudinary(req.file.buffer, "payment-proofs", {
        resource_type: "auto",
      });
      proof_file = req.file.originalname;
      proof_file_url = uploadResult.secure_url;
      console.log("[PaymentRecords] Admin collect - Cloudinary upload success:", proof_file_url);
    } catch (uploadError) {
      console.error("[PaymentRecords] Admin collect - Cloudinary upload failed:", uploadError.message);
      proof_file = req.file.originalname;
    }
  }

  const paymentAmount = parseFloat(amount);
  const exchangeRate = payment_exchange_rate ? parseFloat(payment_exchange_rate) : (pi.exchange_rate || 83.5);

  // Create payment record - already verified since admin is collecting directly
  const record = await PaymentRecord.create({
    proforma_invoice: proforma_invoice_id,
    proforma_number: pi.proforma_number,
    buyer: pi.buyer,
    buyer_name: pi.buyer_name || pi.customer_name,
    buyer_email: pi.buyer_email,
    collection_source: collection_source || "ADMIN_DIRECT",
    collected_by: req.user._id,
    collected_by_name: req.user.name,
    amount: paymentAmount,
    currency: currency || "USD",
    transaction_id: transaction_id || `ADMIN-${Date.now()}`,
    payment_method: payment_method || "BANK_TRANSFER",
    payment_date: payment_date || new Date(),
    notes,
    proof_file,
    proof_file_url,
    status: "VERIFIED", // Already verified since admin is collecting
    verified_by: req.user._id,
    verified_at: new Date(),
    verification_notes: `Payment collected directly by admin via ${collection_source || "ADMIN_DIRECT"}`,
    recorded_amount: paymentAmount,
  });

  // Update PI payment info
  const newPaymentReceived = (pi.payment_received || 0) + paymentAmount;
  const newPaymentStatus = newPaymentReceived >= pi.total_amount ? "PAID" :
    newPaymentReceived > 0 ? "PARTIAL" : "UNPAID";

  // Add to payment history
  const paymentHistoryEntry = {
    payment_id: `PAY-${Date.now()}`,
    amount: paymentAmount,
    currency: currency || "USD",
    amount_inr: paymentAmount * exchangeRate,
    exchange_rate_at_payment: exchangeRate,
    payment_method: payment_method || "BANK_TRANSFER",
    transaction_id: transaction_id || `ADMIN-${Date.now()}`,
    payment_date: payment_date || new Date(),
    notes: notes || `Collected via ${collection_source || "ADMIN_DIRECT"}`,
    recorded_at: new Date(),
    verified_by: req.user._id,
    collection_source: collection_source || "ADMIN_DIRECT",
  };

  pi.payment_received = newPaymentReceived;
  pi.payment_status = newPaymentStatus;
  pi.payment_history = [...(pi.payment_history || []), paymentHistoryEntry];
  await pi.save();

  // Populate for response
  await record.populate("buyer", "name email");
  await record.populate("proforma_invoice", "proforma_number total_amount payment_received payment_status");

  return ApiResponse.created(res, { record, proforma_invoice: pi }, "Payment collected and recorded successfully");
});
