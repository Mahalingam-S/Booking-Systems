import { connectDB, Booking, Facility } from "@workspace/db";

async function run() {
  console.log("Connecting...");
  await connectDB();
  console.log("Connected. Fetching facilities...");
  const facilities = await Facility.find({});
  console.log(`Found ${facilities.length} facilities.`);
  console.log(facilities[0]);
  process.exit(0);
}

run().catch(console.error);
