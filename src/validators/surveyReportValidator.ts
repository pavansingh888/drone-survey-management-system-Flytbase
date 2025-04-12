import { z } from 'zod';

export const createSurveyReportSchema = z.object({
  missionId: z.string().min(1),
  droneId: z.string().min(1),
  duration: z.number().positive(),
  distance: z.number().positive(),
  coverage: z.number().min(0).max(100),
  status: z.enum(['completed', 'failed']),
});
