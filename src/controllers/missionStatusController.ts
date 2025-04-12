import { Request, Response } from "express";
import MissionStatus from "../models/missionStatusModel";
import { updateMissionStatusSchema } from "../validators/missionStatusValidator";

export const getMissionStatus = async (req: Request, res: Response) => {
  try {
    const missionId = req.params.id;
    const status = await MissionStatus.findOne({ mission: missionId });

    if (!status) {
      res.status(404).json({ message: "Mission status not found" });
      return;
    }

    res.json(status);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateMissionStatus = async (req: Request, res: Response) => {
  try {
    const missionId = req.params.id;
    const validated = updateMissionStatusSchema.safeParse(req.body);

    if (!validated.success) {
      res.status(400).json({ error: validated.error.format() });
      return;
    }

    const updated = await MissionStatus.findOneAndUpdate(
      { mission: missionId },
      { ...validated.data, lastUpdated: new Date() },
      { new: true, upsert: true }
    );

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};