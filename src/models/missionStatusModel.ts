// src/models/missionStatusModel.ts
import mongoose, { Document } from "mongoose";

export interface IMissionStatus extends Document {
  mission: mongoose.Types.ObjectId;
  status: "not_started" | "starting" | "in_progress" | "paused" | "completed" | "aborted";
  progress: number; // percentage
  estimatedTimeRemaining: number; // in minutes
  lastUpdated: Date;
}

const missionStatusSchema = new mongoose.Schema<IMissionStatus>(
  {
    mission: { type: mongoose.Schema.Types.ObjectId, ref: "Mission", required: true },
    status: {
      type: String,
      enum: ["not_started", "starting", "in_progress", "paused", "completed", "aborted"],
      default: "not_started",
      required: true,
    },
    progress: { type: Number, default: 0 },
    estimatedTimeRemaining: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const MissionStatus = mongoose.model<IMissionStatus>("MissionStatus", missionStatusSchema);
export default MissionStatus;
