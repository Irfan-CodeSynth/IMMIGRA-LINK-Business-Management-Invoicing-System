import mongoose from "mongoose";
import dns from "dns";

// Only use public DNS fallback in local development when not on Vercel/AWS Lambda
if (!process.env.VERCEL && !process.env.AWS_REGION && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch (e) {
    // Ignore in restricted environments
  }
}

// Disable Mongoose query buffering so commands fail fast if connection drops
mongoose.set("bufferCommands", false);

const ATLAS_FALLBACK_URI =
  "mongodb+srv://irfankhancontact786_db_user:6il4hvfj1IhxalGC@cluster0.0hwisdv.mongodb.net/immigra_link?retryWrites=true&w=majority";

let cachedPromise: Promise<typeof mongoose> | null = null;

export async function connectDB(): Promise<typeof mongoose> {
  // 1 = connected
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  // 2 = connecting
  if (mongoose.connection.readyState === 2 && cachedPromise) {
    return cachedPromise;
  }

  const uri = process.env.MONGODB_URI || ATLAS_FALLBACK_URI;

  cachedPromise = mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10,
  });

  try {
    await cachedPromise;
    console.log("[Database] Connected successfully to MongoDB Atlas");
    return mongoose;
  } catch (err: any) {
    cachedPromise = null;
    console.error("[Database Connection Error]:", err?.message || err);
    throw err;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  cachedPromise = null;
}
