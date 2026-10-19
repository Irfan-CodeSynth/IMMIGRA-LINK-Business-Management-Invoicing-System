import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import apiRoutes from "./routes/api";
import { seedDatabase } from "./utils/seed";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("dev"));

// Static uploads folder
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", app: "IMMIGRA LINK BUSINESS SERVICES", timestamp: new Date() });
});

// API Routes
app.use("/api", apiRoutes);

// In production or when client/dist exists, serve built React assets
const clientDist = path.join(__dirname, "../../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads") || req.path.startsWith("/health")) {
      return next();
    }
    const indexPath = path.join(clientDist, "index.html");
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    next();
  });
}

// Centralized error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[ServerError]:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

async function startServer() {
  await connectDB();
  // Auto-seed initial admin, accounts, services, and reference data if database is clean
  await seedDatabase();

  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  IMMIGRA LINK BUSINESS SERVICES — Backend API Server`);
    console.log(`  Running on: http://localhost:${PORT}`);
    console.log(`  Health Check: http://localhost:${PORT}/health`);
    console.log(`=======================================================`);
  });
}

if (!process.env.VERCEL && require.main === module) {
  startServer().catch((err) => {
    console.error("Failed to start server:", err);
  });
}

export default app;
