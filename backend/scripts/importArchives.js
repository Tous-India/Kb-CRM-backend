/**
 * Bulk Import Archives Script
 *
 * Usage: node scripts/importArchives.js ./data/legacy-invoices.json
 *
 * Expected JSON format:
 * {
 *   "archives": [
 *     {
 *       "document_type": "INVOICE",
 *       "original_reference": "INV-2023-001",
 *       "document_date": "2023-06-15",
 *       "fiscal_year": "FY2023-24",
 *       "buyer_name": "ABC Company",
 *       "buyer_email": "buyer@abc.com",
 *       "buyer_company": "ABC Industries Pvt Ltd",
 *       "currency": "USD",
 *       "total_amount": 15000,
 *       "total_amount_inr": 1252500,
 *       "payment_status": "PAID",
 *       "items": [
 *         {
 *           "sn": 1,
 *           "part_number": "P/N-12345",
 *           "product_name": "Engine Component",
 *           "quantity": 10,
 *           "unit_price": 1500,
 *           "total_price": 15000
 *         }
 *       ],
 *       "notes": "Legacy invoice from old system",
 *       "tags": ["legacy", "2023"]
 *     }
 *   ]
 * }
 */

import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Import Archive model
import Archive from "../src/modules/archives/archives.model.js";

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
};

// Get JSON file path from command line
const jsonFilePath = process.argv[2];

if (!jsonFilePath) {
  console.log(`
${colors.cyan}=== Archive Import Script ===${colors.reset}

Usage: node scripts/importArchives.js <json-file-path>

Example:
  node scripts/importArchives.js ./data/legacy-invoices.json

Expected JSON format:
{
  "archives": [
    {
      "document_type": "INVOICE",
      "original_reference": "INV-2023-001",
      "document_date": "2023-06-15",
      "fiscal_year": "FY2023-24",
      "buyer_name": "ABC Company",
      "buyer_email": "buyer@abc.com",
      "currency": "USD",
      "total_amount": 15000,
      "payment_status": "PAID",
      "items": [...],
      "tags": ["legacy"]
    }
  ]
}
`);
  process.exit(1);
}

// Resolve the file path
const resolvedPath = path.resolve(jsonFilePath);

// Check if file exists
if (!fs.existsSync(resolvedPath)) {
  log.error(`File not found: ${resolvedPath}`);
  process.exit(1);
}

// Connect to MongoDB
async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/kb_crm";
    await mongoose.connect(mongoUri);
    log.success(`Connected to MongoDB`);
  } catch (error) {
    log.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
}

// Import archives
async function importArchives() {
  log.info(`Reading JSON file: ${resolvedPath}`);

  let data;
  try {
    const fileContent = fs.readFileSync(resolvedPath, "utf-8");
    data = JSON.parse(fileContent);
  } catch (error) {
    log.error(`Failed to parse JSON: ${error.message}`);
    process.exit(1);
  }

  // Get archives array
  const archives = data.archives || data;

  if (!Array.isArray(archives)) {
    log.error("JSON must contain an 'archives' array or be an array directly");
    process.exit(1);
  }

  log.success(`Loaded ${archives.length} records from JSON`);

  // Results tracking
  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  // Process each archive
  console.log(`\n${colors.cyan}Importing archives...${colors.reset}\n`);

  for (let i = 0; i < archives.length; i++) {
    const record = archives[i];

    try {
      const archiveData = {
        document_type: record.document_type || "INVOICE",
        original_reference: record.original_reference,
        document_date: record.document_date ? new Date(record.document_date) : new Date(),
        fiscal_year: record.fiscal_year,
        buyer_name: record.buyer_name,
        buyer_email: record.buyer_email,
        buyer_company: record.buyer_company,
        currency: record.currency || "USD",
        exchange_rate: record.exchange_rate || 83.5,
        subtotal: record.subtotal || 0,
        tax: record.tax || 0,
        discount: record.discount || 0,
        shipping: record.shipping || 0,
        total_amount: record.total_amount || 0,
        total_amount_inr: record.total_amount_inr || 0,
        amount_paid: record.amount_paid || 0,
        balance_due: record.balance_due || 0,
        payment_status: record.payment_status || "PAID",
        items: record.items || [],
        original_data: record.original_data || record,
        notes: record.notes,
        internal_notes: record.internal_notes,
        tags: record.tags || ["legacy", "bulk-import"],
        source_system: record.source_system || "LEGACY",
      };

      const archive = await Archive.create(archiveData);
      results.success++;

      // Progress indicator
      if (results.success % 10 === 0 || results.success === archives.length) {
        process.stdout.write(`\r  Processed: ${results.success + results.failed}/${archives.length}`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        index: i,
        reference: record.original_reference || `Record ${i}`,
        error: error.message,
      });
    }
  }

  // Print results
  console.log(`\n\n${colors.cyan}=== Import Summary ===${colors.reset}\n`);
  log.success(`Imported: ${results.success} archives`);

  if (results.failed > 0) {
    log.error(`Failed: ${results.failed} archives`);
    console.log(`\n${colors.yellow}Errors:${colors.reset}`);
    results.errors.forEach((err) => {
      console.log(`  - ${err.reference}: ${err.error}`);
    });
  }

  console.log(`\n${colors.green}✓ Import completed${colors.reset}\n`);
}

// Main function
async function main() {
  console.log(`\n${colors.cyan}=== Archive Import Script ===${colors.reset}\n`);

  await connectDB();
  await importArchives();

  // Disconnect
  await mongoose.disconnect();
  log.success("Disconnected from MongoDB");
  process.exit(0);
}

// Run
main().catch((error) => {
  log.error(`Script failed: ${error.message}`);
  process.exit(1);
});
