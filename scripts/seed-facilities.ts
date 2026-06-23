import { connectDB, Facility } from "@workspace/db";
import mongoose from "mongoose";

async function seed() {
  try {
    await connectDB();
    console.log("Connected to DB, seeding facilities...");

    const defaultFacilities = [
      {
        name: "prajna",
        displayName: "The Prajna Space",
        type: "lab",
        capacity: 30,
        systemCount: 30,
      },
      {
        name: "achula",
        displayName: "Achala",
        type: "lab",
        capacity: 40,
        systemCount: 40,
      },
      {
        name: "conference",
        displayName: "Conference Room",
        type: "classroom",
        capacity: 20,
        seatCount: 20,
      },
    ];

    for (const fac of defaultFacilities) {
      await Facility.findOneAndUpdate(
        { name: fac.name },
        { $setOnInsert: fac },
        { upsert: true }
      );
    }

    console.log("Facilities seeded successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed facilities:", error);
    process.exit(1);
  }
}

seed();
