import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

import Product from "../src/modules/products/products.model.js";

async function checkProducts() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get total count
    const total = await Product.countDocuments();
    console.log(`📊 Total products in database: ${total}`);

    // Get active count
    const activeCount = await Product.countDocuments({ is_active: true });
    console.log(`✅ Active products (is_active: true): ${activeCount}`);

    // Get inactive count
    const inactiveCount = await Product.countDocuments({ is_active: false });
    console.log(`❌ Inactive products (is_active: false): ${inactiveCount}`);

    // Get products with no is_active field
    const noFieldCount = await Product.countDocuments({ is_active: { $exists: false } });
    console.log(`⚠️  Products without is_active field: ${noFieldCount}`);

    // Get products with is_active: undefined or null
    const nullCount = await Product.countDocuments({ is_active: null });
    console.log(`⚠️  Products with is_active: null: ${nullCount}`);

    console.log("\n─".repeat(50));

    // List all products with their is_active status
    console.log("\n📝 All products:");
    const products = await Product.find().select("product_id part_number product_name is_active").sort({ createdAt: -1 });

    products.forEach((p, i) => {
      const status = p.is_active === true ? "✅" : p.is_active === false ? "❌" : "⚠️";
      console.log(`${i + 1}. ${status} ${p.product_id || "NO_ID"} | ${p.part_number} | ${p.product_name} | is_active: ${p.is_active}`);
    });

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n📤 Disconnected from MongoDB");
  }
}

checkProducts();
