import app from "../app.js";
import connectDB from "../src/config/db.js";

// Connection state for serverless environment
let isConnected = false;

/**
 * Connect to MongoDB once and reuse connection across invocations
 * This prevents connection exhaustion in serverless environments
 */
const connectOnce = async () => {
  if (isConnected) {
    return;
  }

  try {
    await connectDB();
    isConnected = true;
    console.log("MongoDB connected for serverless function");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};

/**
 * Vercel Serverless Function Handler
 * Wraps the Express app for serverless deployment
 */
export default async function handler(req, res) {
  // Ensure database connection before handling request
  await connectOnce();

  // Pass request to Express app
  return app(req, res);
}
