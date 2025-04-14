import { z } from "zod";
import mongoose from 'mongoose';

export const updateMissionStatusSchema = z.object({
  status: z.enum(["not_started", "starting", "in_progress", "paused", "completed", "aborted"]),
  progress: z.number().min(0).max(100),
  estimatedTimeRemaining: z.number().min(0),
});

export const missionStatusSchema = z.object({
  missionId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid missionId',
  }),
});