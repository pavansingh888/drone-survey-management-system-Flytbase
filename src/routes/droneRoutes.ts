import express from 'express';
import {
  createDrone,
  getDrones,
  getDroneById,
  updateDrone,
  deleteDrone,
} from '../controllers/droneController';

import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authMiddleware); // All routes require auth

router.route('/')
  .post(createDrone)
  .get(getDrones);

router.route('/:id')
  .get(getDroneById)
  .put(updateDrone)
  .delete(deleteDrone);

export default router;
