import mongoose from "mongoose";
import * as schema from "./schema/index.js";
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

let cachedPromise: Promise<typeof mongoose> | null = null;

export async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is missing. Please check your Vercel Project Settings -> Environment Variables!");
  }

  if (cachedPromise) {
    return cachedPromise;
  }

  try {
    const opts = {
      bufferCommands: false,
    };
    console.log("Attempting to connect to MongoDB at:", uri.substring(0, 20) + "...");
    
    cachedPromise = mongoose.connect(uri, opts).then((conn) => {
      console.log("MongoDB Connected successfully");
      return conn;
    });
    
    return await cachedPromise;
  } catch (error) {
    cachedPromise = null;
    console.error("MongoDB Connection Error Details:", error);
    throw error;
  }
}

export * from "./schema/index.js";
