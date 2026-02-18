import dotenv from "dotenv";

// Load .env file into process.env
dotenv.config();

const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 5000,

  // Database
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/kb_crm",

  // JWT
  jwtSecret: process.env.JWT_SECRET || "fallback_secret_not_for_production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",

  // Cloudinary
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,

  // Helpers
  isDev: (process.env.NODE_ENV || "development") === "development",
  isProd: process.env.NODE_ENV === "production",
};

export default config;
