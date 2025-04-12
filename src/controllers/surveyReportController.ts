import { Request, Response } from 'express';
import SurveyReport from '../models/SurveyReport';
import { createSurveyReportSchema } from '../validators/surveyReportValidator';
import { validateObjectId } from '../utils/validateObjectId';

export const createSurveyReport = async (req: Request, res: Response) => {
  try {
    const parsed = createSurveyReportSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors });
      return;
    }

    const report = await SurveyReport.create(parsed.data);
    res.status(201).json(report);
    return;
  } catch (error) {
    console.error('Create Survey Report Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
    return;
  }
};

export const getAllReports = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const total = await SurveyReport.countDocuments();
    const reports = await SurveyReport.find()
      .populate('missionId droneId')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      data: reports,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
    return;
  } catch (error) {
    console.error('Fetch Reports Error:', error);
    res.status(500).json({ message: 'Something went wrong' });
    return;
  }
};


export const getReportById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
  
      if (!validateObjectId(id)) {
        res.status(400).json({ message: 'Invalid report ID' });
        return;
      }
  
      const report = await SurveyReport.findById(id).populate('missionId droneId');
  
      if (!report) {
        res.status(404).json({ message: 'Report not found' });
        return;
      }
  
      res.status(200).json(report);
      return;
    } catch (error) {
      console.error('Fetch Report By ID Error:', error);
      res.status(500).json({ message: 'Server error' });
      return;
    }
  };
