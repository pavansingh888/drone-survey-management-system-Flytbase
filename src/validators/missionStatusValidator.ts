import { z } from "zod";

export const updateMissionStatusSchema = z.object({
  status: z.enum(["not_started", "starting", "in_progress", "paused", "completed", "aborted"]),
  progress: z.number().min(0).max(100),
  estimatedTimeRemaining: z.number().min(0),
});
