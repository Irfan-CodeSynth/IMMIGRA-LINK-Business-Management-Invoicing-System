"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
const api_1 = __importDefault(require("./routes/api"));
const seed_1 = require("./utils/seed");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middlewares
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
app.use((0, morgan_1.default)("dev"));
// Static uploads folder
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok", app: "DeepX Invoice System - DeepX Ai Solutions", timestamp: new Date() });
});
// API Routes
app.use("/api", api_1.default);
// In production or when client/dist exists, serve built React assets
const clientDist = path_1.default.join(__dirname, "../../client/dist");
if (fs_1.default.existsSync(clientDist)) {
    app.use(express_1.default.static(clientDist));
    app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api") || req.path.startsWith("/uploads") || req.path.startsWith("/health")) {
            return next();
        }
        const indexPath = path_1.default.join(clientDist, "index.html");
        if (fs_1.default.existsSync(indexPath)) {
            return res.sendFile(indexPath);
        }
        next();
    });
}
// Centralized error handling
app.use((err, req, res, next) => {
    console.error("[ServerError]:", err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error",
    });
});
async function startServer() {
    await (0, db_1.connectDB)();
    // Auto-seed initial admin, accounts, services, and reference data if database is clean
    await (0, seed_1.seedDatabase)();
    app.listen(PORT, () => {
        console.log(`=======================================================`);
        console.log(`  DeepX Invoice System — DeepX Ai Solutions Backend API Server`);
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
exports.default = app;
