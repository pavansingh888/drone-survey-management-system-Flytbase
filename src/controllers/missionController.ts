import { Request, Response } from "express";
import Mission from "../models/missionModel";
import { missionSchema } from "../validators/missionValidator";

export const createMission = async (req: Request, res: Response) => {
  try {
    const validated = missionSchema.safeParse(req.body);
    if (!validated.success) {
      res.status(400).json({ error: validated.error.format() });
      return;
    }

    const mission = new Mission({
      ...validated.data,
      createdBy: (req as any).user._id,
    });

    await mission.save();
    res.status(201).json(mission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getAllMissions = async (req: Request, res: Response) => {
  try {
    const missions = await Mission.find({ createdBy: (req as any).user._id });
    res.json(missions);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch missions" });
  }
};


export const deleteMission = async (req: Request, res: Response) => {
  try {
    const missionId = req.params.id;
    const userId = (req as any).user._id;

    const mission = await Mission.findOneAndDelete({ _id: missionId, createdBy: userId });

    if (!mission) {
      res.status(404).json({ message: "Mission not found or not authorized to delete." });
      return;
    }

    res.status(200).json({ message: "Mission deleted successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete mission" });
  }
};
