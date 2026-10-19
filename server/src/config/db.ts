import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

let memoryReplSet: MongoMemoryReplSet | null = null;

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/immigra_link";

  try {
    // Attempt standard connection first with 3s timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[Database] Connected to MongoDB at ${uri}`);
  } catch (err: any) {
    console.log("[Database] Local/Configured MongoDB not reachable. Initializing embedded replica set for seamless zero-config local execution...");
    try {
      memoryReplSet = await MongoMemoryReplSet.create({
        replSet: { count: 1, storageEngine: "wiredTiger" },
      });
      const memUri = memoryReplSet.getUri();
      await mongoose.connect(memUri);
      console.log(`[Database] Connected to embedded MongoDB replica set at: ${memUri}`);
    } catch (memErr) {
      console.error("[Database] Failed to start embedded replica set, attempting single instance:", memErr);
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      const memServer = await MongoMemoryServer.create();
      await mongoose.connect(memServer.getUri());
      console.log(`[Database] Connected to embedded MongoDB at: ${memServer.getUri()}`);
    }
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (memoryReplSet) {
    await memoryReplSet.stop();
  }
}
