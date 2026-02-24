import mongoose from "mongoose";
import dns from "node:dns/promises";
import config from "./index.js";

const connectDB = async () => {
  try {
    // Set DNS servers to resolve MongoDB Atlas SRV records
    dns.setServers(["1.1.1.1", "8.8.8.8"]);

    const conn = await mongoose.connect(config.mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
