import mongoose from "mongoose";
import * as schema from "./schema";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find .env file in parent directories
let currentDir = __dirname;
while (currentDir !== path.parse(currentDir).root) {
  const envPath = path.join(currentDir, ".env");
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
  const parentDir = path.dirname(currentDir);
  if (parentDir === currentDir) break;
  currentDir = parentDir;
}

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI or DATABASE_URL must be defined");
}

// Global connection state to prevent multiple connections in dev
let cachedConnection: typeof mongoose | null = null;

export async function connectDB() {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const opts = {
      bufferCommands: false,
    };
    console.log("Attempting to connect to MongoDB at:", MONGODB_URI!.substring(0, 20) + "...");
    cachedConnection = await mongoose.connect(MONGODB_URI!, opts);
    console.log("MongoDB Connected successfully");
    return cachedConnection;
  } catch (error) {
    console.error("MongoDB Connection Error Details:", error);
    throw error;
  }
}

export * from "./schema";
