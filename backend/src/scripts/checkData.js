/**
 * Quick script to check what data exists in the database
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

import ProformaInvoice from "../modules/proformaInvoices/proformaInvoices.model.js";
import Dispatch from "../modules/dispatches/dispatches.model.js";
import Order from "../modules/orders/orders.model.js";

async function checkData() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/kb_crm";
    console.log("Connecting to MongoDB:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("Connected!\n");

    // Check PIs
    const piCount = await ProformaInvoice.countDocuments();
    console.log(`Proforma Invoices: ${piCount}`);

    if (piCount > 0) {
      const pis = await ProformaInvoice.find().select("proforma_number status dispatched dispatch_status total_quantity dispatched_quantity pending_quantity").limit(5);
      console.log("Sample PIs:", JSON.stringify(pis, null, 2));
    }

    // Check Dispatches
    const dispatchCount = await Dispatch.countDocuments();
    console.log(`\nDispatches: ${dispatchCount}`);

    if (dispatchCount > 0) {
      const dispatches = await Dispatch.find().select("dispatch_id source_type source_number total_quantity").limit(5);
      console.log("Sample Dispatches:", JSON.stringify(dispatches, null, 2));
    }

    // Check Orders
    const orderCount = await Order.countDocuments();
    console.log(`\nOrders: ${orderCount}`);

    if (orderCount > 0) {
      const orders = await Order.find().select("order_id status dispatched_quantity pending_quantity").limit(5);
      console.log("Sample Orders:", JSON.stringify(orders, null, 2));
    }

    await mongoose.disconnect();
    console.log("\nDone!");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkData();
