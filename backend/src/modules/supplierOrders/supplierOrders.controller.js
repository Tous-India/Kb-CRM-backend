import SupplierOrder from "./supplierOrders.model.js";
import mongoose from "mongoose";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Get all supplier orders
 */
export const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status, supplier, payment_status } = req.query;

    const query = {};
    if (status) query.status = status;
    if (supplier) {
      if (isValidObjectId(supplier)) {
        query.supplier = supplier;
      } else {
        query.supplier_name = new RegExp(supplier, "i");
      }
    }
    if (payment_status) query.payment_status = payment_status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      SupplierOrder.find(query)
        .populate("supplier", "supplier_id supplier_code supplier_name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      SupplierOrder.countDocuments(query),
    ]);

    res.json({
      status: "success",
      message: "Supplier orders fetched",
      data: {
        supplierOrders: orders,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get supplier order by ID
 */
export const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = isValidObjectId(id)
      ? { $or: [{ _id: id }, { spo_id: id }, { spo_number: id }] }
      : { $or: [{ spo_id: id }, { spo_number: id }] };

    const order = await SupplierOrder.findOne(query).populate(
      "supplier",
      "supplier_id supplier_code supplier_name contact"
    );

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Supplier order not found",
      });
    }

    res.json({
      status: "success",
      message: "Supplier order fetched",
      data: { supplierOrder: order },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get orders by supplier ID
 */
export const getBySupplier = async (req, res, next) => {
  try {
    const { supplierId } = req.params;

    const query = isValidObjectId(supplierId)
      ? { supplier: supplierId }
      : { supplier_name: new RegExp(supplierId, "i") };

    const orders = await SupplierOrder.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      status: "success",
      message: "Supplier orders fetched",
      data: { supplierOrders: orders },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create supplier order
 */
export const create = async (req, res, next) => {
  try {
    const orderData = {
      ...req.body,
      created_by: req.user._id,
    };

    const order = new SupplierOrder(orderData);
    await order.save();

    res.status(201).json({
      status: "success",
      message: "Supplier order created",
      data: { supplierOrder: order },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update supplier order
 */
export const update = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = isValidObjectId(id)
      ? { $or: [{ _id: id }, { spo_id: id }] }
      : { spo_id: id };

    const order = await SupplierOrder.findOne(query);

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Supplier order not found",
      });
    }

    Object.assign(order, req.body);
    await order.save();

    res.json({
      status: "success",
      message: "Supplier order updated",
      data: { supplierOrder: order },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete supplier order
 */
export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = isValidObjectId(id)
      ? { $or: [{ _id: id }, { spo_id: id }] }
      : { spo_id: id };

    const order = await SupplierOrder.findOneAndDelete(query);

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Supplier order not found",
      });
    }

    res.json({
      status: "success",
      message: "Supplier order deleted",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status
 */
export const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const query = isValidObjectId(id)
      ? { $or: [{ _id: id }, { spo_id: id }] }
      : { spo_id: id };

    const order = await SupplierOrder.findOne(query);

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Supplier order not found",
      });
    }

    order.status = status;
    await order.save();

    res.json({
      status: "success",
      message: "Order status updated",
      data: { supplierOrder: order },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add payment to order
 */
export const addPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const paymentData = req.body;

    const query = isValidObjectId(id)
      ? { $or: [{ _id: id }, { spo_id: id }] }
      : { spo_id: id };

    const order = await SupplierOrder.findOne(query);

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Supplier order not found",
      });
    }

    order.payment_history.push(paymentData);
    order.amount_paid += paymentData.amount;
    await order.save();

    res.json({
      status: "success",
      message: "Payment added",
      data: { supplierOrder: order },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Receive items
 */
export const receiveItems = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { item_id, quantity_received, condition, notes } = req.body;

    const query = isValidObjectId(id)
      ? { $or: [{ _id: id }, { spo_id: id }] }
      : { spo_id: id };

    const order = await SupplierOrder.findOne(query);

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Supplier order not found",
      });
    }

    // Find the item and update received qty
    const item = order.items.find((i) => i._id.toString() === item_id);
    if (item) {
      item.received_qty += quantity_received;
    }

    // Add to received items history
    order.received_items.push({
      received_date: new Date(),
      item_id,
      quantity_received,
      condition: condition || "GOOD",
      notes,
    });

    await order.save();

    res.json({
      status: "success",
      message: "Items received",
      data: { supplierOrder: order },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get summary statistics
 */
export const getSummary = async (req, res, next) => {
  try {
    const [
      totalOrders,
      draftOrders,
      orderedOrders,
      receivedOrders,
      totalValue,
      unpaidValue,
    ] = await Promise.all([
      SupplierOrder.countDocuments(),
      SupplierOrder.countDocuments({ status: "DRAFT" }),
      SupplierOrder.countDocuments({ status: "ORDERED" }),
      SupplierOrder.countDocuments({ status: "RECEIVED" }),
      SupplierOrder.aggregate([
        { $group: { _id: null, total: { $sum: "$total_amount" } } },
      ]),
      SupplierOrder.aggregate([
        { $match: { payment_status: { $ne: "PAID" } } },
        { $group: { _id: null, total: { $sum: "$balance_due" } } },
      ]),
    ]);

    res.json({
      status: "success",
      data: {
        summary: {
          total_orders: totalOrders,
          draft: draftOrders,
          ordered: orderedOrders,
          received: receivedOrders,
          total_value: totalValue[0]?.total || 0,
          unpaid_balance: unpaidValue[0]?.total || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
