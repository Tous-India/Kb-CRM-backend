import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

import Product from "../src/modules/products/products.model.js";

/**
 * Image Update Script
 *
 * Usage:
 * 1. Add your image mappings to the `imageUpdates` array below
 * 2. Run: node scripts/updateProductImages.js
 *
 * Example Cloudinary URL format:
 * https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
 */

// Add your image mappings here: part_number -> image details
const imageUpdates = [
  // Example:
  // {
  //   part_number: "05K21104",
  //   url: "https://res.cloudinary.com/your-cloud/image/upload/v123/products/cylinder-kit.jpg",
  //   public_id: "products/cylinder-kit"
  // },
  // {
  //   part_number: "75439-1",
  //   url: "https://res.cloudinary.com/your-cloud/image/upload/v123/products/gasket-kit.jpg",
  //   public_id: "products/gasket-kit"
  // },
];

async function updateImages() {
  if (imageUpdates.length === 0) {
    console.log("⚠️ No image updates defined. Add entries to the imageUpdates array.");
    console.log("\nExample:");
    console.log(`{
  part_number: "05K21104",
  url: "https://res.cloudinary.com/xxx/image/upload/v123/product.jpg",
  public_id: "products/product-id"
}`);
    return;
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    let successCount = 0;
    let notFoundCount = 0;

    console.log(`Updating images for ${imageUpdates.length} products...\n`);
    console.log("─".repeat(60));

    for (const item of imageUpdates) {
      const result = await Product.updateOne(
        { part_number: item.part_number },
        {
          $set: {
            image: {
              url: item.url,
              public_id: item.public_id
            }
          }
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ Updated: ${item.part_number}`);
        successCount++;
      } else if (result.matchedCount === 0) {
        console.log(`⚠️ Not found: ${item.part_number}`);
        notFoundCount++;
      } else {
        console.log(`⏭️ No change: ${item.part_number} (same image)`);
      }
    }

    console.log("─".repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   Updated: ${successCount}`);
    console.log(`   Not found: ${notFoundCount}`);
    console.log(`   Total: ${imageUpdates.length}`);

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n📤 Disconnected from MongoDB");
  }
}

updateImages();
