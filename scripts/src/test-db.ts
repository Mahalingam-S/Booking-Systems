import { connectDB, Booking } from "@workspace/db";

async function run() {
  console.log("Connecting...");
  await connectDB();
  console.log("Connected. Fetching bookings...");
  const bookings = await Booking.find({ status: "approved" }).sort({ date: 1, startTime: 1 });
  console.log(`Found ${bookings.length} bookings.`);
  console.log(bookings[0]);
  process.exit(0);
}

run().catch(console.error);
