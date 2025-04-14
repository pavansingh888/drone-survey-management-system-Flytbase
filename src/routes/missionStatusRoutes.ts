import express from "express";
import { createMissionStatus, getMissionStatus, updateMissionStatus } from "../controllers/missionStatusController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/:id", authMiddleware, getMissionStatus); //get mission status using mission id
router.put("/:id", authMiddleware, updateMissionStatus); //update mission status using mission id
router.post('/create',authMiddleware, createMissionStatus); //api to launch mission with a particular mission id and related status parameter values

export default router;
