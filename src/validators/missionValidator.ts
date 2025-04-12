import { z } from "zod";

export const missionSchema = z.object({
  name: z.string().min(3),
  location: z.string(),
  flightPath: z
    .array(
      z.object({
        lat: z.number(),
        lng: z.number(),
        altitude: z.number(),
      })
    )
    .min(1),
  pattern: z.enum(["crosshatch", "perimeter", "custom"]),
  dataCollectionFrequency: z.number().min(1),
  sensors: z.array(z.string()).nonempty(),
  altitude: z.number().min(10),
  overlap: z.number().min(0).max(100),
  schedule: z.object({
    type: z.enum(["one-time", "recurring"]),
    cron: z.string().optional(),
    date: z.coerce.date().optional(),
  }),
});
