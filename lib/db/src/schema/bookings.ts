import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  bookerName: string;
  bookerType: string;
  purpose: string;
  labName: string;
  date: string;
  startTime: string;
  endTime: string;
  studentCount: number;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: Date;
}

const BookingSchema: Schema = new Schema(
  {
    bookerName: { type: String, required: true },
    bookerType: { type: String, required: true },
    purpose: { type: String, required: true },
    labName: { type: String, required: true },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    studentCount: { type: Number, default: 1, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      required: true,
    },
    rejectionReason: { type: String },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } },
);

// Add index for common queries
BookingSchema.index({ date: 1, labName: 1 });
BookingSchema.index({ status: 1 });

export const Booking = mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);
