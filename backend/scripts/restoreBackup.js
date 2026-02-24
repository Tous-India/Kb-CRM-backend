import mongoose from "mongoose";
import dns from "node:dns/promises";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_DIR = path.join(__dirname, "../data/backup/kb_crm_2026-02-23T06-40-28");

// Direct connection to kb_crm database
const MONGODB_URI = "mongodb+srv://kbenterprise5230_db_user:Trythekbenterprise123@cluster0.4jryl8r.mongodb.net/kb_crm?retryWrites=true&w=majority";

// Collection name mapping (filename -> MongoDB collection name)
const collections = [
  "users",
  "products",
  "categories",
  "brands",
  "orders",
  "quotations",
  "invoices",
  "proformainvoices",
  "dispatches",
  "payments",
  "paymentrecords",
  "piallocations",
  "statements",
  "suppliers",
  "supplierorders",
  "purchaseorders",
  "carts",
  "archives",
  "settings",
];

async function restoreBackup() {
  try {
    // Set DNS servers for Atlas SRV lookup
    dns.setServers(["1.1.1.1", "8.8.8.8"]);

    console.log("Connecting to MongoDB Atlas (kb_crm database)...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to:", mongoose.connection.db.databaseName, "\n");

    const db = mongoose.connection.db;

    for (const collectionName of collections) {
      const filePath = path.join(BACKUP_DIR, `${collectionName}.json`);

      if (!fs.existsSync(filePath)) {
        console.log(`⏭️  Skipping ${collectionName} - file not found`);
        continue;
      }

      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      if (!Array.isArray(data) || data.length === 0) {
        console.log(`⏭️  Skipping ${collectionName} - empty or invalid`);
        continue;
      }

      // Drop existing collection if it exists
      try {
        await db.collection(collectionName).drop();
      } catch (e) {
        // Collection might not exist, ignore
      }

      // Insert the backup data
      await db.collection(collectionName).insertMany(data);
      console.log(`✅ Restored ${collectionName}: ${data.length} documents`);
    }

    console.log("\n🎉 Backup restoration complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Restore failed:", error.message);
    process.exit(1);
  }
}

restoreBackup();
