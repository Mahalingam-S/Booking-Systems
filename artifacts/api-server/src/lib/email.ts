import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    const senderEmail = process.env.EMAIL_USER;
    const senderPassword = process.env.EMAIL_PASS;
    if (senderEmail && senderPassword) {
      transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // Use SSL
        auth: {
          user: senderEmail,
          pass: senderPassword,
        },
      });
    }
  }
  return transporter;
}

const getOfficialLabName = (labName: string) => {
  const map: Record<string, string> = {
    prajna: "THE PRAJNA SPACE",
    achula: "ACHALA",
    conference: "CONFERENCE ROOM"
  };
  return map[labName.toLowerCase()] || labName.toUpperCase();
};

export async function sendBookingNotification(booking: any) {
  const transporter = getTransporter();
  const senderEmail = process.env.EMAIL_USER;

  if (!transporter || !senderEmail) {
    console.warn("Email credentials not configured. Skipping notification.");
    return;
  }

  const principalEmail = "s_mahalingam@cb.amrita.edu";
  const officialLabName = getOfficialLabName(booking.labName);

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
          <a href="${process.env.PUBLIC_URL || "http://localhost:5173"}/admin" style="background-color: #16a34a; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">✅ Approve Request</a>
          <a href="${process.env.PUBLIC_URL || "http://localhost:5173"}/admin" style="background-color: #dc2626; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; margin-left: 10px;">❌ Reject Request</a>
        </div>
        <p style="font-size: 11px; color: #999; margin-top: 15px;">Clicking these buttons will take you to the Admin Dashboard for processing.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Notification email sent to ${principalEmail}`);
  } catch (error) {
    console.error("Error sending email notification:", error);
  }
}

export async function sendBookingStatusUpdate(booking: any) {
  const transporter = getTransporter();
  const senderEmail = process.env.EMAIL_USER;

  if (!transporter || !senderEmail || !booking.bookerEmail) {
    console.warn("Email credentials or booker email missing. Skipping status update notification.");
    return;
  }

  const officialLabName = getOfficialLabName(booking.labName);
  const isApproved = booking.status === "approved";
  const subject = isApproved
    ? `✅ Booking Approved: ${officialLabName} - ${booking.date}`
    : `❌ Booking Rejected: ${officialLabName} - ${booking.date}`;

  const mailOptions = {
    from: `"Lab Booking System" <${senderEmail}>`,
    to: booking.bookerEmail,
    subject: subject,
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
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Status update email sent to ${booking.bookerEmail}`);
  } catch (error) {
    console.error("Error sending status update email:", error);
  }
}
