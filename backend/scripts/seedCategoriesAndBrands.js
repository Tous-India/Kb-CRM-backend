import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

// Set DNS servers for MongoDB Atlas SRV resolution
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import Category from "../src/modules/categories/categories.model.js";
import Brand from "../src/modules/brands/brands.model.js";

// Categories from bulkInsertProducts.js + Uncategorized default
const categories = [
  "Uncategorized",
  "Hardware",
  "Hoses & Fittings",
  "Engine Parts",
  "Instruments",
  "Electrical",
  "Safety Equipment",
  "Gaskets",
  "Fuel System",
  "Tires & Wheels",
  "Filters",
  "Tubing",
  "Brake System",
  "Landing Gear",
];

// Brands - just the default for now
const brands = [
  "No Brand",
];

async function seedCategoriesAndBrands() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Insert categories
    console.log("Inserting categories...\n");
    let catInserted = 0;
    let catSkipped = 0;

    for (const name of categories) {
      try {
        const existing = await Category.findOne({ name });
        if (existing) {
          console.log(`⏭️  Category exists: ${name}`);
          catSkipped++;
          continue;
        }

        const category = new Category({ name, is_active: true });
        await category.save();
        console.log(`✅ Created: ${category.category_id} | ${name}`);
        catInserted++;
      } catch (err) {
        if (err.code === 11000) {
          console.log(`⏭️  Category duplicate: ${name}`);
          catSkipped++;
        } else {
          console.error(`❌ Error creating category ${name}:`, err.message);
        }
      }
    }

    console.log(`\n📊 Categories: ${catInserted} inserted, ${catSkipped} skipped\n`);

    // Insert brands
    console.log("Inserting brands...\n");
    let brandInserted = 0;
    let brandSkipped = 0;

    for (const name of brands) {
      try {
        const existing = await Brand.findOne({ name });
        if (existing) {
          console.log(`⏭️  Brand exists: ${name}`);
          brandSkipped++;
          continue;
        }

        const brand = new Brand({ name, is_active: true });
        await brand.save();
        console.log(`✅ Created: ${brand.brand_id} | ${name}`);
        brandInserted++;
      } catch (err) {
        if (err.code === 11000) {
          console.log(`⏭️  Brand duplicate: ${name}`);
          brandSkipped++;
        } else {
          console.error(`❌ Error creating brand ${name}:`, err.message);
        }
      }
    }

    console.log(`\n📊 Brands: ${brandInserted} inserted, ${brandSkipped} skipped`);

    console.log("\n" + "─".repeat(50));
    console.log("✅ Seeding completed!");
    console.log("─".repeat(50));

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n📤 Disconnected from MongoDB");
  }
}

seedCategoriesAndBrands();
