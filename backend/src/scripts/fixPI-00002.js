/**
 * Fix corrupted PI-00002 data
 * PI-00002 has 9 items but 12 dispatched (3 dispatches of 4 each)
 * This script deletes the last dispatch and recalculates quantities
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

async function fixPI00002() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/kb_crm";
    console.log("Connecting to MongoDB:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("Connected!\n");

    // Find PI-00002
    const pi = await ProformaInvoice.findOne({ proforma_number: "PI-00002" });
    if (!pi) {
      console.log("PI-00002 not found!");
      return;
    }

    console.log("Found PI-00002:");
    console.log("  Total items:", pi.items.reduce((sum, i) => sum + i.quantity, 0));
    console.log("  Stored dispatched_quantity:", pi.dispatched_quantity);

    // Find all dispatches for this PI
    const dispatches = await Dispatch.find({
      source_type: "PROFORMA_INVOICE",
      source_id: pi._id,
    }).sort({ dispatch_sequence: -1 }); // Sort descending to get latest first

    console.log("\nDispatches found:", dispatches.length);
    dispatches.forEach((d) => {
      console.log(`  - ${d.dispatch_id}: qty=${d.total_quantity}, seq=${d.dispatch_sequence}`);
    });

    // Delete the last dispatch (DSP-00005)
    const lastDispatch = dispatches[0];
    if (lastDispatch) {
      console.log(`\nDeleting ${lastDispatch.dispatch_id}...`);
      await Dispatch.deleteOne({ _id: lastDispatch._id });
      console.log("Deleted!");
    }

    // Recalculate quantities
    const remainingDispatches = await Dispatch.find({
      source_type: "PROFORMA_INVOICE",
      source_id: pi._id,
    });

    const totalDispatched = remainingDispatches.reduce((sum, d) => sum + d.total_quantity, 0);
    const totalItems = pi.items.reduce((sum, i) => sum + i.quantity, 0);
    const pending = Math.max(0, totalItems - totalDispatched);

    let dispatchStatus = "NONE";
    if (totalDispatched > 0 && totalDispatched < totalItems) {
      dispatchStatus = "PARTIAL";
    } else if (totalDispatched >= totalItems) {
      dispatchStatus = "FULL";
    }

    // Update PI
    await ProformaInvoice.updateOne(
      { _id: pi._id },
      {
        $set: {
          total_quantity: totalItems,
          dispatched_quantity: totalDispatched,
          pending_quantity: pending,
          dispatch_status: dispatchStatus,
          dispatch_count: remainingDispatches.length,
          dispatched: dispatchStatus === "FULL",
        },
      }
    );

    console.log("\nUpdated PI-00002:");
    console.log("  total_quantity:", totalItems);
    console.log("  dispatched_quantity:", totalDispatched);
    console.log("  pending_quantity:", pending);
    console.log("  dispatch_status:", dispatchStatus);
    console.log("  dispatch_count:", remainingDispatches.length);

    await mongoose.disconnect();
    console.log("\nDone!");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

fixPI00002();
