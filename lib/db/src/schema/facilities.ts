import mongoose from "mongoose";

const facilitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // e.g., 'prajna'
    displayName: { type: String, required: true },        // e.g., 'The Prajna Space'
    type: { type: String, enum: ["lab", "classroom"], required: true },
    capacity: { type: Number, required: true },
    systemCount: { type: Number },
    seatCount: { type: Number },
    description: { type: String },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

export const Facility = mongoose.models.Facility || mongoose.model("Facility", facilitySchema);
