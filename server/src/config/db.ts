import mongoose from "mongoose";
import dns from "dns";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  // Ignore in restricted environments
}

let isConnecting = false;

export async function connectDB(): Promise<void> {
  // If already connected, return immediately (crucial for serverless functions)
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  if (isConnecting) {
    while (mongoose.connection.readyState === 2) {
      await new Promise((r) => setTimeout(r, 100));
    }
    if (mongoose.connection.readyState >= 1) return;
  }

  isConnecting = true;
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/immigra_link";

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    });
    console.log(`[Database] Connected to MongoDB`);
  } catch (err: any) {
    // Only attempt embedded in-memory MongoDB in local development when not on Vercel
    if (!process.env.VERCEL && process.env.NODE_ENV !== "production") {
      console.log("[Database] Local MongoDB unreachable. Initializing embedded replica set...");
      try {
        const { MongoMemoryReplSet } = await import("mongodb-memory-server");
        const memoryReplSet = await MongoMemoryReplSet.create({
          replSet: { count: 1, storageEngine: "wiredTiger" },
        });
        await mongoose.connect(memoryReplSet.getUri());
        console.log(`[Database] Connected to embedded MongoDB replica set`);
      } catch (memErr) {
        console.error("[Database] Failed to start embedded replica set:", memErr);
      }
    } else {
      console.error("[Database] MongoDB connection failed:", err.message);
      throw err;
    }
  } finally {
    isConnecting = false;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
