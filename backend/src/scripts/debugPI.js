/**
 * Debug script to check PI and dispatch data
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

async function debugPI() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/kb_crm";
    console.log("Connecting to MongoDB:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("Connected!\n");

    // Get all PIs
    const pis = await ProformaInvoice.find().select("proforma_number items total_quantity dispatched_quantity pending_quantity dispatch_status");

    for (const pi of pis) {
      console.log(`\n=== ${pi.proforma_number} ===`);
      console.log("Items:", pi.items?.length || 0);

      // Calculate actual total from items
      const actualTotal = pi.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      console.log("Actual total from items:", actualTotal);
      console.log("Stored total_quantity:", pi.total_quantity);
      console.log("Stored dispatched_quantity:", pi.dispatched_quantity);
      console.log("Stored pending_quantity:", pi.pending_quantity);
      console.log("Stored dispatch_status:", pi.dispatch_status);

      // Get dispatches for this PI
      const dispatches = await Dispatch.find({
        source_type: "PROFORMA_INVOICE",
        source_id: pi._id,
      }).select("dispatch_id total_quantity items dispatch_sequence");

      console.log("\nDispatches:", dispatches.length);

      let totalDispatched = 0;
      for (const d of dispatches) {
        const dispatchItemTotal = d.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
        totalDispatched += d.total_quantity || 0;
        console.log(`  - ${d.dispatch_id}: total_quantity=${d.total_quantity}, items sum=${dispatchItemTotal}, seq=${d.dispatch_sequence}`);
      }

      console.log("\nCalculated total dispatched from dispatches:", totalDispatched);
    }

    await mongoose.disconnect();
    console.log("\n\nDone!");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

debugPI();
