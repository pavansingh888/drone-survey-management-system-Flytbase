import express from "express";
import { getMissionStatus, updateMissionStatus } from "../controllers/missionStatusController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/:id", authMiddleware, getMissionStatus);
router.put("/:id", authMiddleware, updateMissionStatus);

export default router;
