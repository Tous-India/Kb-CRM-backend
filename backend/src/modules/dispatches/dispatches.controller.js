import Dispatch from "./dispatches.model.js";
import ProformaInvoice from "../proformaInvoices/proformaInvoices.model.js";
import Order from "../orders/orders.model.js";
import Invoice from "../invoices/invoices.model.js";
import catchAsync from "../../utils/catchAsync.js";
import ApiResponse from "../../utils/apiResponse.js";
import AppError from "../../utils/AppError.js";
import { sendDispatchEmail } from "../../utils/emailService.js";

// ===========================
// GET /api/dispatches/my
// ===========================
// Buyer only — fetch buyer's own dispatches
export const getMyDispatches = catchAsync(async (req, res) => {
  const buyerId = req.user._id;
  const { page = 1, limit = 20, status } = req.query;

  const filter = { buyer: buyerId };

  // Filter by shipment status if provided
  if (status && status !== 'All') {
    filter.shipment_status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [dispatches, total] = await Promise.all([
    Dispatch.find(filter)
      .populate("source_id")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Dispatch.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, dispatches, Number(page), Number(limit), total, "Your dispatches fetched");
});

// ===========================
// GET /api/dispatches
// ===========================
// Admin only — fetch all dispatches with filters
export const getAll = catchAsync(async (req, res) => {
  const { source_type, source_id, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (source_type) filter.source_type = source_type;
  if (source_id) filter.source_id = source_id;

  const skip = (Number(page) - 1) * Number(limit);

  const [dispatches, total] = await Promise.all([
    Dispatch.find(filter)
      .populate("buyer", "name email user_id")
      .populate("created_by", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Dispatch.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, dispatches, Number(page), Number(limit), total, "Dispatches fetched");
});

// ===========================
// GET /api/dispatches/:id
// ===========================
// Get single dispatch by ID
export const getById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const dispatch = await Dispatch.findById(id)
    .populate("buyer", "name email user_id")
    .populate("created_by", "name email")
    .populate("invoice_id");

  if (!dispatch) {
    throw new AppError("Dispatch record not found", 404);
  }

  return ApiResponse.success(res, { dispatch }, "Dispatch fetched");
});

// ===========================
// GET /api/dispatches/by-source/:sourceType/:sourceId
// ===========================
// Get all dispatches for a source (PI or Order)
export const getBySource = catchAsync(async (req, res) => {
  const { sourceType, sourceId } = req.params;

  const dispatches = await Dispatch.find({
    source_type: sourceType,
    source_id: sourceId,
  })
    .populate("created_by", "name email")
    .sort({ dispatch_sequence: 1 });

  return ApiResponse.success(res, { dispatches }, "Dispatches for source fetched");
});

// ===========================
// POST /api/dispatches
// ===========================
// Admin only — create a new dispatch record
export const create = catchAsync(async (req, res) => {
  const {
    source_type,
    source_id,
    items,
    shipping_info,
    dispatch_type,
    project_name,
    generate_invoice,
    invoice_number,
    exchange_rate,
    notes,
  } = req.body;

  // Validate source
  if (!source_type || !source_id) {
    throw new AppError("Source type and source ID are required", 400);
  }

  if (!items || items.length === 0) {
    throw new AppError("At least one item is required for dispatch", 400);
  }

  // Get source document (PI or Order)
  let sourceDoc = null;
  let sourceNumber = "";
  let buyerId = null;
  let buyerName = "";
  let buyerEmail = "";

  if (source_type === "PROFORMA_INVOICE") {
    sourceDoc = await ProformaInvoice.findById(source_id).populate("buyer", "name email");
    if (!sourceDoc) {
      throw new AppError("Proforma Invoice not found", 404);
    }
    sourceNumber = sourceDoc.proforma_number;
    buyerId = sourceDoc.buyer?._id;
    buyerName = sourceDoc.buyer?.name || sourceDoc.buyer_name;
    buyerEmail = sourceDoc.buyer?.email || sourceDoc.buyer_email;
  } else if (source_type === "ORDER") {
    sourceDoc = await Order.findById(source_id).populate("buyer", "name email");
    if (!sourceDoc) {
      throw new AppError("Order not found", 404);
    }
    sourceNumber = sourceDoc.order_id;
    buyerId = sourceDoc.buyer?._id;
    buyerName = sourceDoc.buyer?.name || sourceDoc.buyer_name || sourceDoc.customer_name;
    buyerEmail = sourceDoc.buyer?.email || sourceDoc.customer_email;
  } else {
    throw new AppError("Invalid source type. Use PROFORMA_INVOICE or ORDER", 400);
  }

  // Calculate totals
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalAmount = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0);

  // Count existing dispatches for this source to get sequence
  const existingDispatches = await Dispatch.countDocuments({
    source_type,
    source_id,
  });
  const dispatchSequence = existingDispatches + 1;
  const sourceTotalQty = getTotalSourceQuantity(sourceDoc);
  const isPartial = dispatchSequence > 1 || totalQuantity < sourceTotalQty;

  // Validate: Check if dispatch quantity exceeds available quantity
  const previousDispatches = await Dispatch.find({ source_type, source_id });
  const alreadyDispatched = previousDispatches.reduce((sum, d) => sum + (d.total_quantity || 0), 0);
  const remainingAvailable = sourceTotalQty - alreadyDispatched;

  if (totalQuantity > remainingAvailable) {
    throw new AppError(
      `Cannot dispatch ${totalQuantity} items. Only ${remainingAvailable} items remaining (${alreadyDispatched}/${sourceTotalQty} already dispatched).`,
      400
    );
  }

  // Create dispatch record
  const dispatch = new Dispatch({
    source_type,
    source_id,
    source_type_ref: source_type === "PROFORMA_INVOICE" ? "ProformaInvoice" : "Order",
    source_number: sourceNumber,
    buyer: buyerId,
    buyer_name: buyerName,
    buyer_email: buyerEmail,
    dispatch_date: new Date(),
    dispatch_type: dispatch_type || "STANDARD",
    project_name: project_name || null,
    items: items.map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      part_number: item.part_number,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: (item.quantity || 0) * (item.unit_price || 0),
      hsn_code: item.hsn_code || shipping_info?.hsn_code || "",
    })),
    total_quantity: totalQuantity,
    total_amount: totalAmount,
    exchange_rate: exchange_rate || sourceDoc.exchange_rate || 83.5,
    shipping_info: shipping_info || {},
    invoice_generated: generate_invoice || false,
    invoice_number: generate_invoice ? invoice_number : null,
    is_partial: isPartial,
    dispatch_sequence: dispatchSequence,
    created_by: req.user._id,
    notes: notes || "",
  });

  await dispatch.save();

  // Update source document's dispatch status
  if (source_type === "PROFORMA_INVOICE") {
    // Calculate total dispatched quantity for this PI
    const allDispatches = await Dispatch.find({
      source_type: "PROFORMA_INVOICE",
      source_id: source_id,
    });

    const totalDispatchedQty = allDispatches.reduce((sum, d) => sum + d.total_quantity, 0);
    const piTotalQty = getTotalSourceQuantity(sourceDoc);
    const remainingQty = Math.max(0, piTotalQty - totalDispatchedQty);
    const isFullyDispatched = totalDispatchedQty >= piTotalQty;

    // Determine dispatch status
    let dispatchStatus = "NONE";
    if (totalDispatchedQty > 0 && totalDispatchedQty < piTotalQty) {
      dispatchStatus = "PARTIAL";
    } else if (isFullyDispatched) {
      dispatchStatus = "FULL";
    }

    // Update PI dispatch status with new quantity tracking fields
    const updateData = {
      dispatched: isFullyDispatched,
      dispatch_date: new Date(),
      dispatch_details: {
        tracking_number: shipping_info?.awb_number || "",
        courier: shipping_info?.shipping_by || "",
        notes: shipping_info?.notes || "",
      },
      // New quantity tracking fields
      total_quantity: piTotalQty,
      dispatched_quantity: totalDispatchedQty,
      pending_quantity: remainingQty,
      dispatch_status: dispatchStatus,
      dispatch_count: allDispatches.length,
    };

    // If invoice generated, update invoice fields
    if (generate_invoice && invoice_number) {
      updateData.invoice_generated = true;
      updateData.invoice_number = invoice_number;
    }

    await ProformaInvoice.findByIdAndUpdate(source_id, updateData);
  } else if (source_type === "ORDER") {
    // Calculate total dispatched quantity for this Order
    const allDispatches = await Dispatch.find({
      source_type: "ORDER",
      source_id: source_id,
    });

    const totalDispatchedQty = allDispatches.reduce((sum, d) => sum + d.total_quantity, 0);
    const orderTotalQty = getTotalSourceQuantity(sourceDoc);
    const isFullyDispatched = totalDispatchedQty >= orderTotalQty;

    // Update Order dispatch status
    const updateData = {
      dispatched_quantity: totalDispatchedQty,
      pending_quantity: Math.max(0, orderTotalQty - totalDispatchedQty),
      status: isFullyDispatched ? "DISPATCHED" : "PROCESSING",
      dispatch_info: {
        dispatch_date: new Date(),
        courier_service: shipping_info?.shipping_by || "",
        tracking_number: shipping_info?.awb_number || "",
        dispatch_notes: shipping_info?.notes || "",
      },
      $push: {
        dispatch_history: {
          dispatch_id: dispatch.dispatch_id,
          dispatch_date: new Date(),
          items: items.map((item) => ({
            product_id: item.product_id,
            product_name: item.product_name,
            part_number: item.part_number,
            quantity: item.quantity,
            unit_price: item.unit_price,
          })),
          total_quantity: totalQuantity,
          total_amount: totalAmount,
          hsn_code: shipping_info?.hsn_code || "",
          awb_number: shipping_info?.awb_number || "",
          shipping_by: shipping_info?.shipping_by || "",
          shipping_notes: shipping_info?.notes || "",
          invoice_number: generate_invoice ? invoice_number : null,
          invoice_generated: generate_invoice || false,
        },
      },
    };

    await Order.findByIdAndUpdate(source_id, updateData);
  }

  // Generate invoice if requested
  let generatedInvoice = null;
  if (generate_invoice && invoice_number) {
    generatedInvoice = await createInvoiceFromDispatch(dispatch, sourceDoc, invoice_number);
    if (generatedInvoice) {
      dispatch.invoice_id = generatedInvoice._id;
      await dispatch.save();
    }
  }

  return ApiResponse.success(
    res,
    {
      dispatch,
      invoice: generatedInvoice,
      is_fully_dispatched: dispatch.is_partial === false,
    },
    "Dispatch created successfully"
  );
});

// ===========================
// Helper: Get total quantity from source
// ===========================
function getTotalSourceQuantity(sourceDoc) {
  if (!sourceDoc || !sourceDoc.items) return 0;
  return sourceDoc.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

// ===========================
// Helper: Create Invoice from Dispatch
// ===========================
async function createInvoiceFromDispatch(dispatch, sourceDoc, invoiceNumber) {
  try {
    const isFromPI = dispatch.source_type === "PROFORMA_INVOICE";
    const isFromOrder = dispatch.source_type === "ORDER";

    // Build bill_to from source document
    const buildBillTo = () => {
      const billingAddr = sourceDoc.billing_address || {};
      const shippingAddr = sourceDoc.shipping_address || {};
      return {
        company_name: dispatch.buyer_name || "",
        address_line1: billingAddr.street || shippingAddr.street || "",
        city: billingAddr.city || shippingAddr.city || "",
        state: billingAddr.state || shippingAddr.state || "",
        zip: billingAddr.zip || shippingAddr.zip || "",
        country: billingAddr.country || shippingAddr.country || "",
        email: dispatch.buyer_email || "",
      };
    };

    // Build ship_to from source document
    const buildShipTo = () => {
      const shippingAddr = sourceDoc.shipping_address || {};
      return {
        company_name: dispatch.buyer_name || "",
        address_line1: shippingAddr.street || "",
        city: shippingAddr.city || "",
        state: shippingAddr.state || "",
        zip: shippingAddr.zip || "",
        country: shippingAddr.country || "",
        email: dispatch.buyer_email || "",
      };
    };

    // Build invoice items with all required fields
    const buildItems = () => {
      return dispatch.items.map((item, index) => ({
        sn: index + 1,
        product_id: item.product_id,
        part_number: item.part_number,
        product_name: item.product_name,
        quantity: item.quantity,
        qty_ordered: item.quantity,
        qty_delivered: item.quantity,
        qty_pending: 0,
        uom: "EA",
        delivery_status: "DELIVERED",
        unit_price: item.unit_price,
        total_price: item.total_price,
        hsn_sac_code: item.hsn_code || "",
      }));
    };

    // Build invoice data
    const invoiceData = {
      invoice_number: invoiceNumber,
      invoice_type: "TAX_INVOICE",
      invoice_date: new Date(),
      source: isFromPI ? "PROFORMA_INVOICE" : "ORDER",

      // Reference based on source
      ...(isFromPI && {
        proforma_invoice: dispatch.source_id,
        proforma_invoice_number: dispatch.source_number,
        quote_reference: sourceDoc.quote_number || sourceDoc.quotation_number || "",
        quotation: sourceDoc.quotation || null,
      }),
      ...(isFromOrder && {
        order: dispatch.source_id,
        po_number: dispatch.source_number,
      }),

      // Buyer info
      buyer: dispatch.buyer,
      buyer_name: dispatch.buyer_name,
      buyer_email: dispatch.buyer_email,

      // Address details
      bill_to: buildBillTo(),
      ship_to: buildShipTo(),

      // Document references
      awb_number: dispatch.shipping_info?.awb_number || "",
      hsn_sac: dispatch.shipping_info?.hsn_code || "",

      // Shipping
      shipping_method: dispatch.shipping_info?.shipping_by?.toUpperCase().includes("AIR")
        ? "BYAIR"
        : dispatch.shipping_info?.shipping_by?.toUpperCase().includes("SEA")
        ? "BY_SEA"
        : "COURIER",
      shipping_carrier: dispatch.shipping_info?.shipping_by || "",
      tracking_number: dispatch.shipping_info?.awb_number || "",

      // Dates
      shipping_date: dispatch.dispatch_date,

      // Items
      items: buildItems(),

      // Financial
      subtotal: dispatch.total_amount,
      total_amount: dispatch.total_amount,
      balance_due: sourceDoc.payment_status === "PAID" ? 0 : dispatch.total_amount,
      amount_paid: sourceDoc.payment_status === "PAID" ? dispatch.total_amount : 0,

      // Currency
      currency: "USD",
      exchange_rate: dispatch.exchange_rate || sourceDoc.exchange_rate || 83.5,
      pi_exchange_rate: sourceDoc.exchange_rate,

      // Payment
      payment_terms: sourceDoc.payment_terms || "100% Advance",

      // Status
      status: sourceDoc.payment_status === "PAID" ? "PAID" : "UNPAID",
      delivery_status: "DELIVERED",

      // Dispatch info
      dispatch_info: {
        dispatch_date: dispatch.dispatch_date,
        courier_service: dispatch.shipping_info?.shipping_by || "",
        tracking_number: dispatch.shipping_info?.awb_number || "",
        dispatch_notes: dispatch.shipping_info?.notes || "",
      },
      include_dispatch_info: true,

      // Notes
      notes: dispatch.notes || "",

      // Audit
      created_by: dispatch.created_by,
    };

    const invoice = new Invoice(invoiceData);
    await invoice.save();

    console.log(`[Dispatch] Invoice created successfully: ${invoice.invoice_number}`);

    // Update source document with invoice reference
    if (isFromPI) {
      await ProformaInvoice.findByIdAndUpdate(dispatch.source_id, {
        invoice: invoice._id,
        invoice_number: invoice.invoice_number,
        invoice_generated: true,
      });
    }

    return invoice;
  } catch (error) {
    console.error("[Dispatch] Error creating invoice from dispatch:", error.message);
    console.error("[Dispatch] Invoice data that failed:", JSON.stringify({
      invoice_number: invoiceNumber,
      buyer: dispatch.buyer,
      buyer_name: dispatch.buyer_name,
      source_type: dispatch.source_type,
    }, null, 2));
    return null;
  }
}

// ===========================
// DELETE /api/dispatches/:id
// ===========================
// Admin only — delete a dispatch record
export const remove = catchAsync(async (req, res) => {
  const { id } = req.params;

  const dispatch = await Dispatch.findById(id);
  if (!dispatch) {
    throw new AppError("Dispatch record not found", 404);
  }

  await Dispatch.findByIdAndDelete(id);

  return ApiResponse.success(res, null, "Dispatch deleted successfully");
});

// ===========================
// GET /api/dispatches/summary/:sourceType/:sourceId
// ===========================
// Get dispatch summary for a source
export const getSummary = catchAsync(async (req, res) => {
  const { sourceType, sourceId } = req.params;

  const dispatches = await Dispatch.find({
    source_type: sourceType,
    source_id: sourceId,
  });

  const totalDispatched = dispatches.reduce((sum, d) => sum + d.total_quantity, 0);
  const totalAmount = dispatches.reduce((sum, d) => sum + d.total_amount, 0);
  const dispatchCount = dispatches.length;

  // Get source total based on source type
  let sourceTotal = 0;
  let sourceNumber = "";
  let sourceTotalAmount = 0;

  if (sourceType === "PROFORMA_INVOICE") {
    const pi = await ProformaInvoice.findById(sourceId);
    if (pi) {
      sourceTotal = pi.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      sourceNumber = pi.proforma_number;
      sourceTotalAmount = pi.total_amount || 0;
    }
  } else if (sourceType === "ORDER") {
    const order = await Order.findById(sourceId);
    if (order) {
      sourceTotal = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      sourceNumber = order.order_id;
      sourceTotalAmount = order.total_amount || 0;
    }
  }

  const remainingQty = sourceTotal - totalDispatched;
  const isFullyDispatched = remainingQty <= 0;
  const remainingAmount = sourceTotalAmount - totalAmount;

  // Calculate item-level dispatched quantities
  const dispatchedByItem = {};
  dispatches.forEach((d) => {
    d.items.forEach((item) => {
      const key = item.product_id || item.part_number || item.product_name;
      if (!dispatchedByItem[key]) {
        dispatchedByItem[key] = 0;
      }
      dispatchedByItem[key] += item.quantity || 0;
    });
  });

  // Get source items with remaining quantities
  let sourceItems = [];
  if (sourceType === "PROFORMA_INVOICE") {
    const pi = await ProformaInvoice.findById(sourceId);
    if (pi && pi.items) {
      sourceItems = pi.items.map((item) => {
        const key = item.product_id || item.part_number || item.product_name;
        const dispatched = dispatchedByItem[key] || 0;
        const remaining = Math.max(0, (item.quantity || 0) - dispatched);
        return {
          product_id: item.product_id,
          product_name: item.product_name,
          part_number: item.part_number,
          original_quantity: item.quantity || 0,
          dispatched_quantity: dispatched,
          remaining_quantity: remaining,
          unit_price: item.unit_price || 0,
          hsn_code: item.hsn_code || "",
        };
      });
    }
  } else if (sourceType === "ORDER") {
    const order = await Order.findById(sourceId);
    if (order && order.items) {
      sourceItems = order.items.map((item) => {
        const key = item.product_id || item.part_number || item.product_name;
        const dispatched = dispatchedByItem[key] || 0;
        const remaining = Math.max(0, (item.quantity || 0) - dispatched);
        return {
          product_id: item.product_id,
          product_name: item.product_name,
          part_number: item.part_number,
          original_quantity: item.quantity || 0,
          dispatched_quantity: dispatched,
          remaining_quantity: remaining,
          unit_price: item.unit_price || 0,
          hsn_code: item.hsn_code || "",
        };
      });
    }
  }

  return ApiResponse.success(
    res,
    {
      source_type: sourceType,
      source_number: sourceNumber,
      dispatch_count: dispatchCount,
      total_dispatched_qty: totalDispatched,
      total_dispatched_amount: totalAmount,
      source_total_qty: sourceTotal,
      source_total_amount: sourceTotalAmount,
      remaining_qty: Math.max(0, remainingQty),
      remaining_amount: Math.max(0, remainingAmount),
      is_fully_dispatched: isFullyDispatched,
      items: sourceItems, // Item-level details with remaining quantities
      dispatches: dispatches.map((d) => ({
        dispatch_id: d.dispatch_id,
        dispatch_date: d.dispatch_date,
        dispatch_sequence: d.dispatch_sequence,
        total_quantity: d.total_quantity,
        total_amount: d.total_amount,
        invoice_generated: d.invoice_generated,
        invoice_number: d.invoice_number,
      })),
    },
    "Dispatch summary fetched"
  );
});

// ===========================
// POST /api/dispatches/:id/send-email
// ===========================
// Admin only — send dispatch notification via email to buyer
export const sendEmail = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { recipientEmail, customMessage } = req.body;

  const dispatch = await Dispatch.findById(id)
    .populate("buyer", "name email user_id");

  if (!dispatch) {
    throw new AppError("Dispatch not found", 404);
  }

  // Determine recipient email
  const emailTo = recipientEmail || dispatch.buyer_email || dispatch.buyer?.email;

  if (!emailTo) {
    throw new AppError("No recipient email address available", 400);
  }

  // Send email (no PDF attachment for dispatches)
  try {
    await sendDispatchEmail(dispatch, emailTo, {
      customMessage,
    });
  } catch (emailError) {
    console.error("[DispatchesController] Email send failed:", emailError.message);
    throw new AppError(`Failed to send email: ${emailError.message}`, 500);
  }

  // Update dispatch tracking
  dispatch.is_emailed = true;
  dispatch.last_emailed_at = new Date();
  dispatch.email_count = (dispatch.email_count || 0) + 1;
  await dispatch.save();

  return ApiResponse.success(
    res,
    { dispatch, emailSentTo: emailTo },
    `Dispatch notification sent successfully to ${emailTo}`
  );
});
