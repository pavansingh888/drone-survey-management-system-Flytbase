import { z } from 'zod';

export const droneSchema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.string().min(1, "Location is required"),
  status: z.enum(['available', 'in-mission', 'maintenance']).optional(),
  batteryLevel: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});
