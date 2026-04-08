import { connectDB, Booking } from "./lib/db/src/index";
import dotenv from "dotenv";
dotenv.config();

async function test() {
  try {
    console.log("Connecting to DB...");
    await connectDB();
    console.log("Connected! Creating a test booking...");
    const booking = await Booking.create({
      bookerName: "Test User",
      bookerType: "faculty",
      purpose: "Testing Mongoose",
      labName: "achula",
      date: "2024-04-08",
      startTime: "09:00",
      endTime: "10:00",
      studentCount: 1,
      status: "pending"
    });
    console.log("Booking created successfully:", booking);
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

test();
