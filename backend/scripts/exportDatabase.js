/**
 * MongoDB Database Export Script
 * ================================
 * This is a READ-ONLY operation - your data will NOT be modified or deleted.
 * It creates JSON backup files that you can import to MongoDB Atlas.
 *
 * Usage: node scripts/exportDatabase.js
 * Output: backend/data/backup/kb_crm_<timestamp>/
 */

import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Force local MongoDB for export (ignore .env)
const MONGODB_URI = "mongodb://localhost:27017/kb_crm";

async function exportDatabase() {
  console.log("\n========================================");
  console.log("  MongoDB Database Export (READ-ONLY)");
  console.log("========================================\n");

  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully!\n");

    const db = mongoose.connection.db;

    // Get all collection names
    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collections to export:\n`);

    // Create backup directory with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, "-");
    const backupDir = path.join(__dirname, "..", "data", "backup", `kb_crm_${timestamp}`);

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    let totalDocuments = 0;
    const collectionStats = [];

    // Export each collection
    for (const collInfo of collections) {
      const collName = collInfo.name;
      const collection = db.collection(collName);

      // Get all documents (READ-ONLY operation)
      const documents = await collection.find({}).toArray();
      totalDocuments += documents.length;

      // Write to JSON file
      const filePath = path.join(backupDir, `${collName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));

      collectionStats.push({ name: collName, count: documents.length });
      console.log(`  ✓ ${collName}: ${documents.length} documents`);
    }

    // Create metadata file
    const metadata = {
      database: "kb_crm",
      exportedAt: new Date().toISOString(),
      mongodbUri: MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@"), // Hide credentials
      totalCollections: collections.length,
      totalDocuments: totalDocuments,
      collections: collectionStats,
    };

    fs.writeFileSync(
      path.join(backupDir, "_metadata.json"),
      JSON.stringify(metadata, null, 2)
    );

    console.log("\n========================================");
    console.log("  BACKUP COMPLETED SUCCESSFULLY!");
    console.log("========================================");
    console.log(`  Total Collections: ${collections.length}`);
    console.log(`  Total Documents:   ${totalDocuments}`);
    console.log(`  Backup Location:   ${backupDir}`);
    console.log("========================================\n");

    console.log("TO RESTORE TO MONGODB ATLAS:");
    console.log("-----------------------------");
    console.log("Option 1: Using MongoDB Compass (GUI)");
    console.log("  1. Connect to your Atlas cluster");
    console.log("  2. Create database 'kb_crm'");
    console.log("  3. For each collection: Add Data → Import JSON File\n");

    console.log("Option 2: Using mongoimport (CLI)");
    console.log("  For each JSON file, run:");
    console.log('  mongoimport --uri "mongodb+srv://user:pass@cluster.mongodb.net/kb_crm" \\');
    console.log("    --collection <collection_name> --file <collection_name>.json --jsonArray\n");

  } catch (error) {
    console.error("\nExport failed:", error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.\n");
  }
}

exportDatabase();
