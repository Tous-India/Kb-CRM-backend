import mongoose from "mongoose";
import app from "./app.js";
import config from "./src/config/index.js";
import connectDB from "./src/config/db.js";

// ===========================
// Start Server
// ===========================
const startServer = async () => {
  // 1. Connect to MongoDB
  await connectDB();

  // 2. One-time fix: Drop problematic index on sub_categories.sub_category_id
  try {
    const collection = mongoose.connection.collection("categories");
    await collection.dropIndex("sub_categories.sub_category_id_1");
    console.log("  Dropped problematic sub_categories.sub_category_id index");
  } catch (err) {
    // Index might not exist - that's fine
    if (err.code !== 27) {
      // 27 = index not found
      console.log("  Index cleanup skipped:", err.message);
    }
  }

  // 2. Start Express server
  app.listen(config.port, () => {
    console.log("------------------------------------");
    console.log("  KB CRM Backend API");
    console.log("  Environment: " + config.nodeEnv);
    console.log("  Port:        " + config.port);
    console.log("  API URL:     http://localhost:" + config.port + "/api");
    console.log("------------------------------------");
  });
};

startServer();
