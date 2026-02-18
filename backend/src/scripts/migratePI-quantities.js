/**
 * Migration Script: Update PI Quantity Tracking Fields
 *
 * This script calculates and updates the quantity tracking fields for existing PIs:
 * - total_quantity: Sum of all item quantities
 * - dispatched_quantity: Sum of dispatched quantities from Dispatch records
 * - pending_quantity: total_quantity - dispatched_quantity
 * - dispatch_status: NONE | PARTIAL | FULL
 * - dispatch_count: Number of dispatches for this PI
 *
 * Run with: node src/scripts/migratePI-quantities.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

// Import models
import ProformaInvoice from "../modules/proformaInvoices/proformaInvoices.model.js";
import Dispatch from "../modules/dispatches/dispatches.model.js";

async function migrateQuantities() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/kb_crm";
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Get all PIs
    const proformas = await ProformaInvoice.find({});
    console.log(`Found ${proformas.length} proforma invoices to process`);

    let updated = 0;
    let errors = 0;

    for (const pi of proformas) {
      try {
        // Calculate total quantity from items
        const totalQty = pi.items.reduce(
          (sum, item) => sum + (item.quantity || 0),
          0
        );

        // Get all dispatches for this PI
        const dispatches = await Dispatch.find({
          source_type: "PROFORMA_INVOICE",
          source_id: pi._id,
        });

        // Calculate dispatched quantity
        const dispatchedQty = dispatches.reduce(
          (sum, d) => sum + (d.total_quantity || 0),
          0
        );

        // Calculate pending quantity
        const pendingQty = Math.max(0, totalQty - dispatchedQty);

        // Determine dispatch status
        let dispatchStatus = "NONE";
        if (dispatchedQty > 0 && dispatchedQty < totalQty) {
          dispatchStatus = "PARTIAL";
        } else if (dispatchedQty >= totalQty && totalQty > 0) {
          dispatchStatus = "FULL";
        }

        // Update PI
        await ProformaInvoice.updateOne(
          { _id: pi._id },
          {
            $set: {
              total_quantity: totalQty,
              dispatched_quantity: dispatchedQty,
              pending_quantity: pendingQty,
              dispatch_status: dispatchStatus,
              dispatch_count: dispatches.length,
              // Also update dispatched flag for consistency
              dispatched: dispatchStatus === "FULL",
            },
          }
        );

        updated++;
        console.log(
          `[${updated}/${proformas.length}] Updated ${pi.proforma_number}: total=${totalQty}, dispatched=${dispatchedQty}, pending=${pendingQty}, status=${dispatchStatus}`
        );
      } catch (err) {
        errors++;
        console.error(`Error updating ${pi.proforma_number}:`, err.message);
      }
    }

    console.log("\n=== Migration Complete ===");
    console.log(`Total PIs processed: ${proformas.length}`);
    console.log(`Successfully updated: ${updated}`);
    console.log(`Errors: ${errors}`);

    // Show summary of statuses
    const summary = await ProformaInvoice.aggregate([
      {
        $group: {
          _id: "$dispatch_status",
          count: { $sum: 1 },
        },
      },
    ]);
    console.log("\nDispatch Status Summary:");
    summary.forEach((s) => {
      console.log(`  ${s._id || "UNKNOWN"}: ${s.count}`);
    });

    // Disconnect
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
migrateQuantities();
