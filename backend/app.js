import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import config from "./src/config/index.js";
import routes from "./src/routes.js";
import errorMiddleware from "./src/middlewares/error.middleware.js";
import AppError from "./src/utils/AppError.js";

const app = express();

// ===========================
// Security Middlewares
// ===========================
app.use(helmet());

// CORS - Support multiple origins (comma-separated in .env)
const allowedOrigins = config.corsOrigin.split(",").map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// ===========================
// Body Parsers
// ===========================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ===========================
// Request Logger (dev only)
// ===========================
if (config.isDev) {
  app.use(morgan("dev"));
}

// ===========================
// API Routes
// ===========================
app.use("/api", routes);

// ===========================
// Handle undefined routes
// ===========================
app.use((req, res, next) => {
  next(new AppError("Route not found: " + req.originalUrl, 404));
});

// ===========================
// Global Error Handler (MUST be last)
// ===========================
app.use(errorMiddleware);

export default app;
