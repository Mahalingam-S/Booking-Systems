import { sendBookingNotification } from "./src/lib/email.js";
import { connectDB } from "@workspace/db";

async function test() {
  await connectDB();
  console.log("env: ", process.env.EMAIL_USER);
  await sendBookingNotification({
    bookerName: "Test User",
    bookerEmail: "test@example.com",
    labName: "prajna",
    date: "2023-10-25",
    startTime: "10:00",
    endTime: "12:00",
    purpose: "Testing",
    studentCount: 10
  });
  process.exit(0);
}

test();
