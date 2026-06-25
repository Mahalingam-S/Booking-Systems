// src/app.ts
import express from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";

// src/routes/index.ts
import { Router as Router4 } from "express";

// src/routes/health.ts
import { Router } from "express";
var router = Router();
router.get("/healthz", (req, res) => {
  res.json({ status: "ok" });
});
var health_default = router;

// src/routes/bookings.ts
import { Router as Router2 } from "express";
import { connectDB, Booking, Facility as Facility2 } from "@workspace/db";
import { OAuth2Client } from "google-auth-library";
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
  GetBookingStatsResponse
} from "@workspace/api-zod";

// src/lib/email.ts
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { Facility } from "@workspace/db";
if (process.env.NODE_ENV !== "production") {
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}
var transporter = null;
function getTransporter() {
  if (!transporter) {
    const senderEmail = process.env.EMAIL_USER;
    const senderPassword = process.env.EMAIL_PASS;
    if (senderEmail && senderPassword) {
      transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        // Use SSL
        auth: {
          user: senderEmail,
          pass: senderPassword
        }
      });
    }
  }
  return transporter;
}
var getOfficialLabName = async (labName) => {
  try {
    const facility = await Facility.findOne({ name: labName });
    if (facility) return facility.displayName;
  } catch (error) {
    console.error("Error fetching facility name", error);
  }
  const map = {
    prajna: "THE PRAJNA SPACE",
    achula: "ACHALA",
    conference: "CONFERENCE ROOM"
  };
  return map[labName.toLowerCase()] || labName.toUpperCase();
};
async function sendBookingNotification(booking) {
  const transporter2 = getTransporter();
  const senderEmail = process.env.EMAIL_USER;
  if (!transporter2 || !senderEmail) {
    console.warn("Email credentials not configured. Skipping notification.");
    return;
  }
  const principalEmail = "mahalingamshanmugam12@gmail.com";
  const officialLabName = await getOfficialLabName(booking.labName);
  const mailOptions = {
    from: `"Lab Booking System" <${senderEmail}>`,
    to: principalEmail,
    subject: `New Lab Booking Request: ${officialLabName} - ${booking.date}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563eb;">New Booking Request Received</h2>
        <p>A new laboratory reservation request has been submitted and is waiting for your review.</p>
        <hr />
        <p><strong>Faculty Name:</strong> ${booking.bookerName}</p>
        <p><strong>Faculty Email:</strong> ${booking.bookerEmail}</p>
        <p><strong>Facility:</strong> ${officialLabName}</p>
        <p><strong>Date:</strong> ${booking.date}</p>
        <p><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
        <p><strong>Purpose:</strong> ${booking.purpose}</p>
        <p><strong>No of Attendees:</strong> ${booking.studentCount}</p>
        <hr />
        <div style="margin-top: 25px; display: flex; gap: 10px;">
          <a href="${process.env.PUBLIC_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:5173")}/admin" style="background-color: #16a34a; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">\u2705 Approve Request</a>
          <a href="${process.env.PUBLIC_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:5173")}/admin" style="background-color: #dc2626; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; margin-left: 10px;">\u274C Reject Request</a>
        </div>
        <p style="font-size: 11px; color: #999; margin-top: 15px;">Clicking these buttons will take you to the Admin Dashboard for processing.</p>
      </div>
    `
  };
  try {
    await transporter2.sendMail(mailOptions);
    console.log(`Notification email sent to ${principalEmail}`);
  } catch (error) {
    console.error("Error sending email notification:", error);
  }
}
async function sendBookingStatusUpdate(booking) {
  const transporter2 = getTransporter();
  const senderEmail = process.env.EMAIL_USER;
  if (!transporter2 || !senderEmail || !booking.bookerEmail) {
    console.warn("Email credentials or booker email missing. Skipping status update notification.");
    return;
  }
  const officialLabName = await getOfficialLabName(booking.labName);
  const isApproved = booking.status === "approved";
  const subject = isApproved ? `\u2705 Booking Approved: ${officialLabName} - ${booking.date}` : `\u274C Booking Rejected: ${officialLabName} - ${booking.date}`;
  const mailOptions = {
    from: `"Lab Booking System" <${senderEmail}>`,
    to: booking.bookerEmail,
    subject,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: ${isApproved ? "#16a34a" : "#dc2626"};">${isApproved ? "Reservation Approved" : "Reservation Rejected"}</h2>
        <p>Dear ${booking.bookerName},</p>
        <p>Your request for the laboratory has been processed by the administration.</p>
        <hr />
        <p><strong>Facility:</strong> ${officialLabName}</p>
        <p><strong>Date:</strong> ${booking.date}</p>
        <p><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
        ${!isApproved && booking.rejectionReason ? `<p><strong>Reason for Rejection:</strong> ${booking.rejectionReason}</p>` : ""}
        <hr />
        <p style="font-size: 12px; color: #666;">This is an automated message. Please do not reply to this email.</p>
      </div>
    `
  };
  try {
    await transporter2.sendMail(mailOptions);
    console.log(`Status update email sent to ${booking.bookerEmail}`);
  } catch (error) {
    console.error("Error sending status update email:", error);
  }
}

// src/routes/bookings.ts
var router2 = Router2();
var GOOGLE_CLIENT_ID = "666601473845-0cq4am2ff0qvjb8adu6lpiusc8psb2tj.apps.googleusercontent.com";
var oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID);
var LAB_OPENING_TIME = "08:50";
var LAB_CLOSING_TIME = "18:45";
function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}
function isValidTime(time) {
  return timeToMinutes(time) >= timeToMinutes(LAB_OPENING_TIME) && timeToMinutes(time) <= timeToMinutes(LAB_CLOSING_TIME);
}
function formatBooking(booking) {
  const b = booking.toObject ? booking.toObject() : booking;
  return {
    ...b,
    id: b._id.toString(),
    bookerEmail: b.bookerEmail ?? null,
    createdAt: b.createdAt.toISOString(),
    rejectionReason: b.rejectionReason ?? null
  };
}
router2.get("/bookings", async (req, res) => {
  await connectDB();
  const params = ListBookingsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const query = { status: "approved" };
  if (params.data.date) {
    query.date = params.data.date;
  }
  if (params.data.labName) {
    query.labName = params.data.labName;
  }
  const bookings = await Booking.find(query).sort({ date: 1, startTime: 1 });
  res.json(ListBookingsResponse.parse(bookings.map(formatBooking)));
});
router2.post("/bookings", async (req, res) => {
  await connectDB();
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  let verifiedEmail = "";
  let verifiedName = "";
  try {
    const ticket = await oauthClient.verifyIdToken({
      idToken: parsed.data.idToken,
      audience: GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(403).json({ error: "Invalid Google token payload." });
      return;
    }
    if (!payload.email.toLowerCase().endsWith("@gmail.com")) {
      res.status(403).json({ error: "Only official @gmail.com accounts are authorized." });
      return;
    }
    verifiedEmail = payload.email;
    verifiedName = payload.name || payload.email.split("@")[0];
  } catch (error) {
    res.status(403).json({ error: "Invalid or expired Google authentication token." });
    return;
  }
  const { purpose, labName, date, startTime, endTime, studentCount } = parsed.data;
  const bookerName = verifiedName;
  const bookerEmail = verifiedEmail;
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
  const facility = await Facility2.findOne({ name: labName, status: "active" });
  if (!facility) {
    res.status(400).json({ error: "Selected facility does not exist or is inactive." });
    return;
  }
  if ((studentCount ?? 1) > facility.capacity) {
    res.status(400).json({ error: `${facility.displayName} has a maximum capacity of ${facility.capacity} students` });
    return;
  }
  const existingBookings = await Booking.find({
    labName,
    date,
    status: { $in: ["approved", "pending"] }
  });
  const hasConflict = existingBookings.some((b) => {
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
    status: "pending"
  });
  res.status(201).json(GetBookingResponse.parse(formatBooking(booking)));
  sendBookingNotification(formatBooking(booking)).catch(console.error);
});
router2.get("/bookings/schedule", async (req, res) => {
  await connectDB();
  const params = GetScheduleQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const activeFacilities = await Facility2.find({ status: "active" }).sort({ name: 1 });
  const labNames = activeFacilities.map((f) => f.name);
  const labs = await Promise.all(
    labNames.map(async (labName) => {
      const bookings = await Booking.find({
        date: params.data.date,
        labName,
        status: "approved"
      }).sort({ startTime: 1 });
      return { labName, bookings: bookings.map(formatBooking) };
    })
  );
  res.json(GetScheduleResponse.parse({ date: params.data.date, labs }));
});
router2.get("/bookings/stats", async (req, res) => {
  await connectDB();
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const allBookings = await Booking.find({});
  const total = allBookings.length;
  const pending = allBookings.filter((b) => b.status === "pending").length;
  const todayCount = allBookings.filter((b) => b.date === today && b.status === "approved").length;
  const activeFacilities = await Facility2.find({ status: "active" }).sort({ name: 1 });
  const labNames = activeFacilities.map((f) => f.name);
  const labBreakdown = labNames.map((labName) => ({
    labName,
    count: allBookings.filter((b) => b.labName === labName && b.status === "approved").length
  }));
  res.json(
    GetBookingStatsResponse.parse({
      totalBookings: total,
      pendingApprovals: pending,
      todayBookings: todayCount,
      labBreakdown
    })
  );
});
router2.get("/bookings/:id", async (req, res) => {
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
router2.delete("/bookings/:id", async (req, res) => {
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
router2.get("/admin/bookings", async (req, res) => {
  await connectDB();
  const params = AdminListBookingsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const query = {};
  if (params.data.status) {
    query.status = params.data.status;
  }
  const bookings = await Booking.find(query).sort({ createdAt: -1 });
  res.json(AdminListBookingsResponse.parse(bookings.map(formatBooking)));
});
router2.post("/admin/bookings/:id/approve", async (req, res) => {
  await connectDB();
  const params = ApproveBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const bookingToApprove = await Booking.findById(params.data.id);
  if (!bookingToApprove) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  const existingBookings = await Booking.find({
    labName: bookingToApprove.labName,
    date: bookingToApprove.date,
    status: "approved",
    _id: { $ne: bookingToApprove._id }
  });
  const hasConflict = existingBookings.some((b) => {
    return bookingToApprove.startTime < b.endTime && bookingToApprove.endTime > b.startTime;
  });
  if (hasConflict) {
    res.status(409).json({ error: "This lab is already booked and approved for the selected time slot." });
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
  sendBookingStatusUpdate(formatBooking(booking)).catch(console.error);
});
router2.post("/admin/bookings/:id/reject", async (req, res) => {
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
      rejectionReason: body.success ? body.data.reason ?? null : null
    },
    { new: true }
  );
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  res.json(RejectBookingResponse.parse(formatBooking(booking)));
  sendBookingStatusUpdate(formatBooking(booking)).catch(console.error);
});
var bookings_default = router2;

// src/routes/facilities.ts
import { Router as Router3 } from "express";
import { connectDB as connectDB2, Facility as Facility3 } from "@workspace/db";
import { CreateFacilityBody } from "@workspace/api-zod";
var router3 = Router3();
router3.get("/facilities", async (req, res) => {
  try {
    await connectDB2();
    const facilities = await Facility3.find({ status: "active" }).select("-__v");
    res.json(facilities.map((f) => ({
      id: f._id.toString(),
      name: f.name,
      displayName: f.displayName,
      type: f.type,
      capacity: f.capacity,
      systemCount: f.systemCount,
      seatCount: f.seatCount,
      description: f.description,
      status: f.status
    })));
  } catch (error) {
    req.log.error(error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
  }
});
router3.post("/admin/facilities", async (req, res) => {
  try {
    const data = CreateFacilityBody.safeParse(req.body);
    if (!data.success) {
      res.status(400).json({ error: data.error.message });
      return;
    }
    await connectDB2();
    const existing = await Facility3.findOne({ name: data.data.name });
    if (existing) {
      res.status(400).json({ error: "Facility with this short name already exists" });
      return;
    }
    const facility = new Facility3(data.data);
    await facility.save();
    res.status(201).json({
      id: facility._id.toString(),
      name: facility.name,
      displayName: facility.displayName,
      type: facility.type,
      capacity: facility.capacity,
      systemCount: facility.systemCount,
      seatCount: facility.seatCount,
      description: facility.description,
      status: facility.status
    });
  } catch (error) {
    req.log.error(error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
  }
});
router3.put("/admin/facilities/:id", async (req, res) => {
  try {
    const data = CreateFacilityBody.safeParse(req.body);
    if (!data.success) {
      res.status(400).json({ error: data.error.message });
      return;
    }
    await connectDB2();
    const facility = await Facility3.findByIdAndUpdate(
      req.params.id,
      data.data,
      { new: true }
    );
    if (!facility) {
      res.status(404).json({ error: "Facility not found" });
      return;
    }
    res.json({
      id: facility._id.toString(),
      name: facility.name,
      displayName: facility.displayName,
      type: facility.type,
      capacity: facility.capacity,
      systemCount: facility.systemCount,
      seatCount: facility.seatCount,
      description: facility.description,
      status: facility.status
    });
  } catch (error) {
    req.log.error(error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
  }
});
router3.delete("/admin/facilities/:id", async (req, res) => {
  try {
    await connectDB2();
    const facility = await Facility3.findByIdAndUpdate(
      req.params.id,
      { status: "inactive" },
      { new: true }
    );
    if (!facility) {
      res.status(404).json({ error: "Facility not found" });
      return;
    }
    res.json({
      id: facility._id.toString(),
      name: facility.name,
      displayName: facility.displayName,
      type: facility.type,
      capacity: facility.capacity,
      systemCount: facility.systemCount,
      seatCount: facility.seatCount,
      description: facility.description,
      status: facility.status
    });
  } catch (error) {
    req.log.error(error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
  }
});
var facilities_default = router3;

// src/routes/index.ts
var router4 = Router4();
router4.use(health_default);
router4.use(bookings_default);
router4.use(facilities_default);
var routes_default = router4;

// src/lib/logger.ts
import pino from "pino";
var isProduction = process.env.NODE_ENV === "production";
var logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']"
  ],
  ...isProduction ? {} : {
    transport: {
      target: "pino-pretty",
      options: { colorize: true }
    }
  }
});

// src/app.ts
import path2 from "path";
var app = express();
var loggingMiddleware = pinoHttp({
  logger,
  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url?.split("?")[0]
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode
      };
    }
  }
});
app.use(loggingMiddleware);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", routes_default);
var publicPath = path2.resolve(process.cwd(), "artifacts/lab-booking/dist");
app.use(express.static(publicPath));
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path2.join(publicPath, "index.html"));
});
app.use((err, req, res, next) => {
  console.error("API Error:", err);
  if (req.path.startsWith("/api")) {
    res.status(500).json({ error: err.message || "Internal Server Error" });
  } else {
    next(err);
  }
});
var app_default = app;

// ../../api-src/index.ts
import { parse } from "url";
var index_default = (req, res) => {
  const parsedUrl = parse(req.url || "", true);
  if (parsedUrl.query.vpath) {
    let newPath = "/api/" + parsedUrl.query.vpath;
    delete parsedUrl.query.vpath;
    const queryKeys = Object.keys(parsedUrl.query);
    if (queryKeys.length > 0) {
      const searchParams = new URLSearchParams();
      for (const key of queryKeys) {
        const val = parsedUrl.query[key];
        if (Array.isArray(val)) {
          val.forEach((v) => searchParams.append(key, v));
        } else if (val) {
          searchParams.append(key, val);
        }
      }
      newPath += "?" + searchParams.toString();
    }
    req.url = newPath;
  } else if (req.url && !req.url.startsWith("/api")) {
    req.url = "/api" + (req.url.startsWith("/") ? "" : "/") + req.url;
  }
  return app_default(req, res);
};
export {
  index_default as default
};
