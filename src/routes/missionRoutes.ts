import express from "express";
import { createMission, deleteMission, getAllMissions } from "../controllers/missionController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", authMiddleware, createMission);
router.get("/", authMiddleware, getAllMissions);
router.delete("/:id", authMiddleware, deleteMission);

export default router;
