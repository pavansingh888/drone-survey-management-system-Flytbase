import { Request, Response } from "express";
import MissionStatus from "../models/missionStatusModel";
import { missionStatusSchema, updateMissionStatusSchema } from "../validators/missionStatusValidator";
import Mission from "../models/missionModel";

export const getMissionStatus = async (req: Request, res: Response) => {
  try {
    const missionId = req.params.id;
    const missionStatus = await MissionStatus.findOne({ mission: missionId });

    if (!missionStatus) {
      res.status(404).json({ message: "Mission status not found" });
      return;
    }

    res.json(missionStatus);
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

//For launching a mission - basically launched mission data
export const createMissionStatus = async (req: Request, res: Response) => {
  try {
    const parsed = missionStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation error', errors: parsed.error.errors });
      return;
    }

    const { missionId } = parsed.data;

    // 1. Check if mission exists
    const mission = await Mission.findById(missionId);
    if (!mission) {
      res.status(404).json({ message: "Mission not found" });
      return;
    }

    // 2. Create MissionStatus(i.e launched mission) entry
    const savedMission = await MissionStatus.create({
      mission:missionId,
    });

    res.status(201).json({ message: "Mission Launch Sceduled", savedMission });
    return;
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
    return;
  }
};
