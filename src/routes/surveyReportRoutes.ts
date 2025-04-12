import express from 'express';
import {
  createSurveyReport,
  getAllReports,
  getReportById,
} from '../controllers/surveyReportController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', authMiddleware, createSurveyReport);
router.get('/', authMiddleware, getAllReports);
router.get('/:id', authMiddleware, getReportById);

export default router;
