import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

// Set DNS servers for MongoDB Atlas SRV resolution
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import Product from "../src/modules/products/products.model.js";

// Products extracted from invoice images
// Will be populated with unique products from provided images
const products = [
  // Image 1 - Parts List
  { part_number: "J-23502-1", product_name: "MOUNT KIT", category: "Hardware", stock_status: "In Stock", is_active: true },
  { part_number: "AE3663161G0164", product_name: "HOSE ASSY.", category: "Hoses & Fittings", stock_status: "In Stock", is_active: true },
  { part_number: "AE6695H0180-180", product_name: "HOSE ASSY.", category: "Hoses & Fittings", stock_status: "In Stock", is_active: true },
  { part_number: "AE3663161H0184", product_name: "HOSE ASSY.", category: "Hoses & Fittings", stock_status: "In Stock", is_active: true },
  { part_number: "AE3663163E0240", product_name: "HOSE ASSY.", category: "Hoses & Fittings", stock_status: "In Stock", is_active: true },
  { part_number: "LW-12798-4S370", product_name: "HOSE ASSY.", category: "Hoses & Fittings", stock_status: "In Stock", is_active: true },
  { part_number: "LW-12798-4S172", product_name: "HOSE ASSY.", category: "Hoses & Fittings", stock_status: "In Stock", is_active: true },
  { part_number: "LW12799-6S180", product_name: "HOSE ASSY.", category: "Hoses & Fittings", stock_status: "In Stock", is_active: true },
  { part_number: "6403", product_name: "THROTTLE ASSY", category: "Engine Parts", stock_status: "In Stock", is_active: true },
  { part_number: "6404-1", product_name: "MIXTURE ASSY", category: "Engine Parts", stock_status: "In Stock", is_active: true },
  { part_number: "MS21045L7", product_name: "NUT", category: "Hardware", stock_status: "In Stock", is_active: true },
  { part_number: "S3326-2/5000B-75/1U149-015-15", product_name: "ATTITUDE GYRO-OH-EX", category: "Instruments", stock_status: "In Stock", is_active: true },
  { part_number: "A-7512-24", product_name: "LAMP", category: "Electrical", stock_status: "In Stock", is_active: true },
  { part_number: "C301002-121", product_name: "FLAP MOTOR", category: "Electrical", stock_status: "In Stock", is_active: true },
  { part_number: "S3312-1", product_name: "LIGHT BAR ASSY-FLIGHT INSTRUMENT", category: "Instruments", stock_status: "In Stock", is_active: true },
  { part_number: "0531103-3", product_name: "HINGE", category: "Hardware", stock_status: "In Stock", is_active: true },
  { part_number: "C421001-0201", product_name: "COCKPIT FIRE EXT.", category: "Safety Equipment", stock_status: "In Stock", is_active: true },

  // Image 3/4/5/6 - Engine Parts
  { part_number: "05K21104", product_name: "CYLINDER KIT", category: "Engine Parts", stock_status: "In Stock", is_active: true },
  { part_number: "75439-1", product_name: "GASKET & SEAL KIT", category: "Gaskets", stock_status: "In Stock", is_active: true },
  { part_number: "18A26093", product_name: "CRANKSHAFT BEARING (FRONT)", category: "Engine Parts", stock_status: "In Stock", is_active: true },
  { part_number: "18D26098", product_name: "CRANKSHAFT BEARING", category: "Engine Parts", stock_status: "In Stock", is_active: true },
  { part_number: "LW-18085", product_name: "SPRING OIL PRESSURE RELIEF VALVE", category: "Engine Parts", stock_status: "In Stock", is_active: true },
  { part_number: "1028-B", product_name: "BALL", category: "Hardware", stock_status: "In Stock", is_active: true },
  { part_number: "STD2246", product_name: "BOLT", category: "Hardware", stock_status: "In Stock", is_active: true },
  { part_number: "STD2231", product_name: "RING INTERNAL RETAINING", category: "Hardware", stock_status: "In Stock", is_active: true },
  { part_number: "LW18667", product_name: "PIN", category: "Hardware", stock_status: "In Stock", is_active: true },
  { part_number: "18M26105", product_name: "CONNECTING ROD BUSHING", category: "Engine Parts", stock_status: "In Stock", is_active: true },
  { part_number: "75061", product_name: "CONNECTING ROD BOLT", category: "Engine Parts", stock_status: "In Stock", is_active: true },
  { part_number: "LW12186", product_name: "CONNECTING ROD NUT", category: "Engine Parts", stock_status: "In Stock", is_active: true },
  { part_number: "01K28983", product_name: "CONNECTING ROD BUSHING", category: "Engine Parts", stock_status: "In Stock", is_active: true },
  { part_number: "LW13790", product_name: "SHAFT VALVE ROCKER", category: "Engine Parts", stock_status: "In Stock", is_active: true },
  { part_number: "LW12892", product_name: "THRUST BUTTON ROCKER SHAFT", category: "Engine Parts", stock_status: "In Stock", is_active: true },
  { part_number: "74637", product_name: "BUSHING VALVE ROCKER", category: "Engine Parts", stock_status: "In Stock", is_active: true },
  { part_number: "69603", product_name: "HOSE", category: "Hoses & Fittings", stock_status: "In Stock", is_active: true },
  { part_number: "STD1821", product_name: "HOSE", category: "Hoses & Fittings", stock_status: "In Stock", is_active: true },
  { part_number: "STD160", product_name: "WASHER", category: "Hardware", stock_status: "In Stock", is_active: true },
  { part_number: "STD8", product_name: "WASHER", category: "Hardware", stock_status: "In Stock", is_active: true },
  { part_number: "STD1411", product_name: "NUT", category: "Hardware", stock_status: "In Stock", is_active: true },
  { part_number: "53E22144", product_name: "VALVE ASSY. TEMP. CONTROL", category: "Engine Parts", stock_status: "In Stock", is_active: true },
  { part_number: "15B26066", product_name: "PLUNGER ASSY", category: "Engine Parts", stock_status: "In Stock", is_active: true },
  { part_number: "63B28207", product_name: "MANIFOLD ASSEMBLY (NEW)", category: "Engine Parts", stock_status: "In Stock", is_active: true },
  { part_number: "63C26450", product_name: "NOZZLES", category: "Engine Parts", stock_status: "In Stock", is_active: true },
  { part_number: "LW-15473/62B26931", product_name: "EDP-NEW", category: "Fuel System", stock_status: "In Stock", is_active: true },
  { part_number: "REM38E", product_name: "SPARK PLUG", category: "Electrical", stock_status: "In Stock", is_active: true },
  { part_number: "M2513R/67P20409", product_name: "IGNITION HARNESS (LH)", category: "Electrical", stock_status: "In Stock", is_active: true },
  { part_number: "M2512R/67P20408", product_name: "IGNITION HARNESS (RH)", category: "Electrical", stock_status: "In Stock", is_active: true },
  { part_number: "RSA-5AD1/2576536-2-H", product_name: "FUEL INJECTOR NEW", category: "Fuel System", stock_status: "In Stock", is_active: true },
  { part_number: "LRT23381", product_name: "TAPPET BODY", category: "Engine Parts", stock_status: "In Stock", is_active: true },
  { part_number: "149 NL/EC", product_name: "STARTER (UPFRONT PURCHASE)", category: "Electrical", stock_status: "In Stock", is_active: true },
  { part_number: "606C41-6", product_name: "TIRE", category: "Tires & Wheels", stock_status: "In Stock", is_active: true },

  // Image 7 - Additional Parts
  { part_number: "SK2003-42A", product_name: "COWL MOUNT SKY BOLT", category: "Hardware", stock_status: "In Stock", is_active: true },
  { part_number: "D9-18-1/AAD9-18-1", product_name: "GYRO FILTER", category: "Filters", stock_status: "In Stock", is_active: true },
  { part_number: "B3-5-1/RA-B3-5-1", product_name: "VRV FILTER", category: "Filters", stock_status: "In Stock", is_active: true },
  { part_number: "MS20995C25SSILB/MS20995", product_name: "SAFETY WIRE", category: "Hardware", stock_status: "In Stock", is_active: true },
  { part_number: "MS35478-307", product_name: "LAMP", category: "Electrical", stock_status: "In Stock", is_active: true },
  { part_number: "02-0350433-01", product_name: "LAMP ASSY", category: "Electrical", stock_status: "In Stock", is_active: true },
  { part_number: "606C66-8", product_name: "TIRE", category: "Tires & Wheels", stock_status: "In Stock", is_active: true },
  { part_number: "066-10500/RA066-10500", product_name: "BRAKE LINING", category: "Brake System", stock_status: "In Stock", is_active: true },
  { part_number: "302-246-401", product_name: "TUBE", category: "Tubing", stock_status: "In Stock", is_active: true },
  { part_number: "71973", product_name: "GASKET", category: "Gaskets", stock_status: "In Stock", is_active: true },
  { part_number: "LW12681", product_name: "GASKET", category: "Gaskets", stock_status: "In Stock", is_active: true },
  { part_number: "X61-0029", product_name: "CONTRACTOR", category: "Electrical", stock_status: "In Stock", is_active: true },
  { part_number: "STD-475", product_name: "WASHER", category: "Hardware", stock_status: "In Stock", is_active: true },
  { part_number: "MS20995C-032", product_name: "SAFETY WIRE", category: "Hardware", stock_status: "In Stock", is_active: true },
  { part_number: "STD-713", product_name: "COTTER PIN", category: "Hardware", stock_status: "In Stock", is_active: true },
  { part_number: "RA105-00200", product_name: "RIVET", category: "Hardware", stock_status: "In Stock", is_active: true },
  { part_number: "01-0770818-00/01-0771987", product_name: "LED", category: "Electrical", stock_status: "In Stock", is_active: true },
  { part_number: "MC1570102-14", product_name: "BONDING STRAP", category: "Electrical", stock_status: "In Stock", is_active: true },
  { part_number: "606C41B1", product_name: "TIRE 4 PLY", category: "Tires & Wheels", stock_status: "In Stock", is_active: true },
  { part_number: "0411185-7", product_name: "HINGE", category: "Hardware", stock_status: "In Stock", is_active: true },
  { part_number: "0500118-524", product_name: "LINE ASSY. RH", category: "Fuel System", stock_status: "In Stock", is_active: true },
  { part_number: "0756041-1", product_name: "GASKET", category: "Gaskets", stock_status: "In Stock", is_active: true },
  { part_number: "CH48110-1", product_name: "OIL FILTER", category: "Filters", stock_status: "In Stock", is_active: true },
  { part_number: "06E19769-1.00", product_name: "GASKET", category: "Gaskets", stock_status: "In Stock", is_active: true },
  { part_number: "P198281/AA198281", product_name: "AIR FILTER", category: "Filters", stock_status: "In Stock", is_active: true },
  { part_number: "AA3215CC", product_name: "VACCUM PUMP", category: "Engine Parts", stock_status: "In Stock", is_active: true },
  { part_number: "01-0770006-17/01-0771985", product_name: "LED FLASHER", category: "Electrical", stock_status: "In Stock", is_active: true },
  { part_number: "0500118-523", product_name: "LINE ASSY. LH", category: "Fuel System", stock_status: "In Stock", is_active: true },
  { part_number: "01-0771015-08", product_name: "LED (RED)", category: "Electrical", stock_status: "In Stock", is_active: true },
  { part_number: "541139", product_name: "PLUG", category: "Hardware", stock_status: "In Stock", is_active: true },
  { part_number: "0550364-13", product_name: "AIR FILTER BOX ASSY.", category: "Filters", stock_status: "In Stock", is_active: true },
  { part_number: "MS35206-246", product_name: "SCREW", category: "Hardware", stock_status: "In Stock", is_active: true },
  { part_number: "MS15584-15/306", product_name: "BULB", category: "Electrical", stock_status: "In Stock", is_active: true },
  { part_number: "1741005-59/1741005-61", product_name: "FAIRING-LH MAIN LANDING GEAR", category: "Landing Gear", stock_status: "In Stock", is_active: true },
  { part_number: "1741005-62/1741005-60", product_name: "FAIRING-RH MAIN LANDING GEAR", category: "Landing Gear", stock_status: "In Stock", is_active: true },
  { part_number: "MS35206-228", product_name: "SCREW", category: "Hardware", stock_status: "In Stock", is_active: true },
  { part_number: "455-0012", product_name: "ELT BATTERY KIT", category: "Electrical", stock_status: "In Stock", is_active: true },
  { part_number: "0713070-31/0713070-50", product_name: "TUBE ASSY- PARKING BRAKE", category: "Brake System", stock_status: "In Stock", is_active: true },
  { part_number: "0550364-9", product_name: "HINGE ASSY.", category: "Hardware", stock_status: "In Stock", is_active: true },
];

async function bulkInsert() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    console.log(`Inserting ${products.length} products...\n`);

    let insertedCount = 0;
    let skippedCount = 0;
    const insertedProducts = [];

    // Use individual saves to trigger pre-save hook for product_id generation
    for (const productData of products) {
      try {
        // Check if product already exists
        const existing = await Product.findOne({
          part_number: productData.part_number,
        });
        if (existing) {
          console.log(`⏭️  Skipping (exists): ${productData.part_number}`);
          skippedCount++;
          continue;
        }

        // Create new product (triggers pre-save hook)
        const product = new Product(productData);
        await product.save();
        insertedProducts.push(product);
        insertedCount++;
        console.log(
          `✅ Inserted: ${product.product_id} | ${product.part_number}`,
        );
      } catch (err) {
        if (err.code === 11000) {
          console.log(`⏭️  Skipping (duplicate): ${productData.part_number}`);
          skippedCount++;
        } else {
          console.error(
            `❌ Error inserting ${productData.part_number}:`,
            err.message,
          );
        }
      }
    }

    console.log("\n" + "─".repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   Inserted: ${insertedCount}`);
    console.log(`   Skipped:  ${skippedCount}`);
    console.log(`   Total:    ${products.length}`);
    console.log("─".repeat(60));
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n📤 Disconnected from MongoDB");
  }
}

bulkInsert();
