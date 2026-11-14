import "server-only";
import mongoose from "mongoose";
import { usePublicDnsWhenLoopback } from "@/lib/mongo-dns";
import { traceSpan } from "@/lib/telemetry";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cached: MongooseCache = globalForMongoose.mongooseCache ?? {
  conn: null,
  promise: null,
};

globalForMongoose.mongooseCache = cached;

function poolNumber(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function isDatabaseConfigured() {
  const uri = process.env.MONGODB_URI ?? "";
  if (!uri.startsWith("mongodb")) return false;
  if (uri.includes("<") || uri.includes("xxxxx")) return false;
  return true;
}

export async function connectDB() {
  return traceSpan("db.connect", async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri || !isDatabaseConfigured()) {
      throw new Error("MONGODB_URI is not configured.");
    }

    if (cached.conn) return cached.conn;

    if (!cached.promise) {
      usePublicDnsWhenLoopback();
      mongoose.set("strictQuery", true);
      mongoose.set("debug", false);
      cached.promise = mongoose.connect(uri, {
        bufferCommands: false,
        maxPoolSize: poolNumber("MONGODB_MAX_POOL_SIZE", 10),
        minPoolSize: poolNumber("MONGODB_MIN_POOL_SIZE", 2),
        connectTimeoutMS: poolNumber("MONGODB_CONNECT_TIMEOUT_MS", 5000),
        socketTimeoutMS: poolNumber("MONGODB_SOCKET_TIMEOUT_MS", 30000),
        serverSelectionTimeoutMS: poolNumber("MONGODB_CONNECT_TIMEOUT_MS", 5000),
        autoIndex: true,
      });
    }

    try {
      cached.conn = await cached.promise;
    } catch (error) {
      cached.promise = null;
      throw error;
    }

    return cached.conn;
  });
}
