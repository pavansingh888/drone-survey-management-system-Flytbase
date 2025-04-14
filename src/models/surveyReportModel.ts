import mongoose, { Schema, Document } from 'mongoose';

export interface ISurveyReport extends Document {
  missionId: mongoose.Types.ObjectId;
  droneId: mongoose.Types.ObjectId;
  duration: number;
  distance: number;
  coverage: number;
  status: 'completed' | 'failed';
  generatedAt: Date;
}

const surveyReportSchema = new Schema<ISurveyReport>(
  {
    missionId: { type: Schema.Types.ObjectId, ref: 'Mission', required: true },
    droneId: { type: Schema.Types.ObjectId, ref: 'Drone', required: true },
    duration: { type: Number, required: true },
    distance: { type: Number, required: true },
    coverage: { type: Number, required: true },
    status: { type: String, enum: ['completed', 'failed'], required: true },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

surveyReportSchema.index({ status: 1, createdAt: -1 });
surveyReportSchema.index({ createdAt: -1 });
surveyReportSchema.index({ status: 1 });


export default mongoose.model<ISurveyReport>('SurveyReport', surveyReportSchema);
