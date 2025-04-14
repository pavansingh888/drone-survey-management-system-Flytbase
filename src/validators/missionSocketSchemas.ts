import { z } from "zod";

export const progressUpdateSchema = z.object({
  missionId: z.string().min(1),
  progress: z.number().min(0).max(100),
  eta: z.number().min(0),
  status: z.enum([
    "not_started",
    "starting",
    "in_progress",
    "paused",
    "completed",
    "aborted",
  ]),
  // Optional fields for survey report generation
  droneId: z.string(),
  duration: z.number().positive(),
  distance: z.number().positive(),
});


