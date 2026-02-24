import mongoose from "mongoose";
import dns from "node:dns/promises";
import dotenv from "dotenv";
import User from "../modules/users/users.model.js";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/kb_crm";

const seedAdmin = async () => {
  try {
    // Set DNS servers to resolve MongoDB Atlas SRV records
    dns.setServers(["1.1.1.1", "8.8.8.8"]);

    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Check if SUPER_ADMIN already exists
    const existing = await User.findOne({ role: "SUPER_ADMIN" });
    if (existing) {
      console.log("SUPER_ADMIN already exists:");
      console.log("  Email:", existing.email);
      console.log("  User ID:", existing.user_id);
      process.exit(0);
    }

    // Create SUPER_ADMIN
    const admin = await User.create({
      name: "Super Admin",
      email: "kbenterprise5230@gmail.com",
      password: "admin123",
      phone: "9999999999",
      role: "SUPER_ADMIN",
    });

    console.log("SUPER_ADMIN created successfully:");
    console.log("  User ID:", admin.user_id);
    console.log("  Email:  ", admin.email);
    console.log("  Password:", "admin123");
    console.log("");
    console.log("Use these credentials to log in.");

    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
};

seedAdmin();
