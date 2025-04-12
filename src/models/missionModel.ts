import mongoose, { Document } from "mongoose";

export interface IWaypoint {
  lat: number;
  lng: number;
  altitude: number;
}

export interface IMission extends Document {
  name: string;
  location: string;
  flightPath: IWaypoint[];
  pattern: "crosshatch" | "perimeter" | "custom";
  dataCollectionFrequency: number;
  sensors: string[];
  altitude: number;
  overlap: number;
  schedule: {
    type: "one-time" | "recurring";
    cron?: string; // For recurring schedules
    date?: Date;   // For one-time
  };
  createdBy: mongoose.Types.ObjectId;
}

const missionSchema = new mongoose.Schema<IMission>(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    flightPath: [
      {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        altitude: { type: Number, required: true },
      },
    ],
    pattern: {
      type: String,
      enum: ["crosshatch", "perimeter", "custom"],
      required: true,
    },
    dataCollectionFrequency: { type: Number, required: true }, // in minutes
    sensors: [{ type: String, required: true }],
    altitude: { type: Number, required: true },
    overlap: { type: Number, required: true },
    schedule: {
      type: {
        type: String,
        enum: ["one-time", "recurring"],
        required: true,
      },
      cron: String,
      date: Date,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Mission = mongoose.model<IMission>("Mission", missionSchema);
export default Mission;
