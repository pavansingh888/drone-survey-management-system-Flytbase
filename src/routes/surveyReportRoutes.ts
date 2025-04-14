import express from 'express';
import {
  createSurveyReport,
  getAllReports,
  getReportById,
  getSurveyStatistics,
} from '../controllers/surveyReportController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();
router.get('/statistics', authMiddleware, getSurveyStatistics);
router.get('/:id', authMiddleware, getReportById);
router.get('/', authMiddleware, getAllReports);
router.post('/', authMiddleware, createSurveyReport);


export default router;
