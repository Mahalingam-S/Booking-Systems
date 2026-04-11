import { Router, type IRouter } from "express";
import { connectDB, Booking } from "@workspace/db";
import {
  ListBookingsQueryParams,
  ListBookingsResponse,
  CreateBookingBody,
  GetBookingParams,
  GetBookingResponse,
  DeleteBookingParams,
  DeleteBookingResponse,
  AdminListBookingsQueryParams,
  AdminListBookingsResponse,
  ApproveBookingParams,
  ApproveBookingResponse,
  RejectBookingParams,
  RejectBookingBody,
  RejectBookingResponse,
  GetScheduleQueryParams,
  GetScheduleResponse,
  GetBookingStatsResponse,
} from "@workspace/api-zod";
import { sendBookingNotification, sendBookingStatusUpdate } from "../lib/email";

const router: IRouter = Router();

const LAB_OPENING_TIME = "08:50";
const LAB_CLOSING_TIME = "18:45";
const PRAJNA_MAX_STUDENTS = 30;

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function isValidTime(time: string): boolean {
  return (
    timeToMinutes(time) >= timeToMinutes(LAB_OPENING_TIME) &&
    timeToMinutes(time) <= timeToMinutes(LAB_CLOSING_TIME)
  );
}

// Reusable formatting function for Mongoose documents
function formatBooking(booking: any) {
  const b = booking.toObject ? booking.toObject() : booking;
  return {
    ...b,
    id: b._id.toString(),
    bookerEmail: b.bookerEmail ?? null,
    createdAt: b.createdAt.toISOString(),
    rejectionReason: b.rejectionReason ?? null,
  };
}

router.get("/bookings", async (req, res): Promise<void> => {
  await connectDB();
  const params = ListBookingsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const query: any = { status: "approved" };

  if (params.data.date) {
    query.date = params.data.date;
  }
  if (params.data.labName) {
    query.labName = params.data.labName;
  }

  const bookings = await Booking.find(query).sort({ date: 1, startTime: 1 });

  res.json(ListBookingsResponse.parse(bookings.map(formatBooking)));
});

router.post("/bookings", async (req, res): Promise<void> => {
  await connectDB();
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { bookerName, bookerEmail, purpose, labName, date, startTime, endTime, studentCount } = parsed.data;
  const bookerType = "faculty"; 

  if (!isValidTime(startTime)) {
    res.status(400).json({ error: `Start time must be between ${LAB_OPENING_TIME} and ${LAB_CLOSING_TIME}` });
    return;
  }

  if (!isValidTime(endTime)) {
    res.status(400).json({ error: `End time must be between ${LAB_OPENING_TIME} and ${LAB_CLOSING_TIME}` });
    return;
  }

  if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
    res.status(400).json({ error: "Start time must be before end time" });
    return;
  }

  if (labName === "prajna" && (studentCount ?? 1) > PRAJNA_MAX_STUDENTS) {
    res.status(400).json({ error: `Prajna lab has a maximum capacity of ${PRAJNA_MAX_STUDENTS} students` });
    return;
  }

  // Check for conflicts
  const existingBookings = await Booking.find({
    labName,
    date,
    status: { $in: ["approved", "pending"] }
  });

  const hasConflict = existingBookings.some(b => {
    return startTime < b.endTime && endTime > b.startTime;
  });

  if (hasConflict) {
    res.status(409).json({ error: "This lab is already booked for the selected time slot." });
    return;
  }

  const booking = await Booking.create({
    bookerName,
    bookerEmail,
    bookerType,
    purpose,
    labName,
    date,
    startTime,
    endTime,
    studentCount: studentCount ?? 1,
    status: "pending",
  });

  res.status(201).json(GetBookingResponse.parse(formatBooking(booking)));

  // Trigger non-blocking email notification
  sendBookingNotification(formatBooking(booking)).catch(console.error);
});

router.get("/bookings/schedule", async (req, res): Promise<void> => {
  await connectDB();
  const params = GetScheduleQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const labNames = ["achula", "prajna", "conference"];
  const labs = await Promise.all(
    labNames.map(async (labName) => {
      const bookings = await Booking.find({
        date: params.data.date,
        labName: labName,
        status: "approved"
      }).sort({ startTime: 1 });
      return { labName, bookings: bookings.map(formatBooking) };
    })
  );

  res.json(GetScheduleResponse.parse({ date: params.data.date, labs }));
});

router.get("/bookings/stats", async (req, res): Promise<void> => {
  await connectDB();
  const today = new Date().toISOString().split("T")[0];

  const allBookings = await Booking.find({});
  const total = allBookings.length;
  const pending = allBookings.filter((b) => b.status === "pending").length;
  const todayCount = allBookings.filter((b) => b.date === today && b.status === "approved").length;

  const labNames = ["achula", "prajna", "conference"];
  const labBreakdown = labNames.map((labName) => ({
    labName,
    count: allBookings.filter((b) => b.labName === labName && b.status === "approved").length,
  }));

  res.json(
    GetBookingStatsResponse.parse({
      totalBookings: total,
      pendingApprovals: pending,
      todayBookings: todayCount,
      labBreakdown,
    })
  );
});

router.get("/bookings/:id", async (req, res): Promise<void> => {
  await connectDB();
  const params = GetBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const booking = await Booking.findById(params.data.id);

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.json(GetBookingResponse.parse(formatBooking(booking)));
});

router.delete("/bookings/:id", async (req, res): Promise<void> => {
  await connectDB();
  const params = DeleteBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const booking = await Booking.findByIdAndUpdate(
    params.data.id,
    { status: "cancelled" },
    { new: true }
  );

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.json(DeleteBookingResponse.parse(formatBooking(booking)));
});

router.get("/admin/bookings", async (req, res): Promise<void> => {
  await connectDB();
  const params = AdminListBookingsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const query: any = {};
  if (params.data.status) {
    query.status = params.data.status;
  }

  const bookings = await Booking.find(query).sort({ createdAt: -1 });

  res.json(AdminListBookingsResponse.parse(bookings.map(formatBooking)));
});

router.post("/admin/bookings/:id/approve", async (req, res): Promise<void> => {
  await connectDB();
  const params = ApproveBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const booking = await Booking.findByIdAndUpdate(
    params.data.id,
    { status: "approved" },
    { new: true }
  );

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.json(ApproveBookingResponse.parse(formatBooking(booking)));

  // Send approval notification to faculty
  sendBookingStatusUpdate(formatBooking(booking)).catch(console.error);
});

router.post("/admin/bookings/:id/reject", async (req, res): Promise<void> => {
  await connectDB();
  const params = RejectBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = RejectBookingBody.safeParse(req.body);

  const booking = await Booking.findByIdAndUpdate(
    params.data.id,
    {
      status: "rejected",
      rejectionReason: body.success ? (body.data.reason ?? null) : null,
    },
    { new: true }
  );

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.json(RejectBookingResponse.parse(formatBooking(booking)));

  // Send rejection notification to faculty
  sendBookingStatusUpdate(formatBooking(booking)).catch(console.error);
});

export default router;
