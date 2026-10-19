"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
exports.disconnectDB = disconnectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const dns_1 = __importDefault(require("dns"));
// Only use public DNS fallback in local development when not on Vercel/AWS Lambda
if (!process.env.VERCEL && !process.env.AWS_REGION && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
    try {
        dns_1.default.setServers(["8.8.8.8", "1.1.1.1"]);
    }
    catch (e) {
        // Ignore in restricted environments
    }
}
// Disable Mongoose query buffering so commands fail fast if connection drops
mongoose_1.default.set("bufferCommands", false);
const ATLAS_FALLBACK_URI = "mongodb+srv://irfankhancontact786_db_user:6il4hvfj1IhxalGC@cluster0.0hwisdv.mongodb.net/immigra_link?retryWrites=true&w=majority";
let cachedPromise = null;
async function connectDB() {
    // 1 = connected
    if (mongoose_1.default.connection.readyState === 1) {
        return mongoose_1.default;
    }
    // 2 = connecting
    if (mongoose_1.default.connection.readyState === 2 && cachedPromise) {
        return cachedPromise;
    }
    const uri = process.env.MONGODB_URI || ATLAS_FALLBACK_URI;
    cachedPromise = mongoose_1.default.connect(uri, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 10000,
        maxPoolSize: 10,
    });
    try {
        await cachedPromise;
        console.log("[Database] Connected successfully to MongoDB Atlas");
        return mongoose_1.default;
    }
    catch (err) {
        cachedPromise = null;
        console.error("[Database Connection Error]:", err?.message || err);
        throw err;
    }
}
async function disconnectDB() {
    await mongoose_1.default.disconnect();
    cachedPromise = null;
}
