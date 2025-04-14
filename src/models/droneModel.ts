import mongoose, { Schema, Document } from 'mongoose';

export interface IDrone extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  location: string;
  status: 'available' | 'in-mission' | 'maintenance';
  batteryLevel: number; // % from 0 to 100
  isActive: boolean;
  currentMissionId: mongoose.Types.ObjectId
}

const DroneSchema: Schema = new Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  status: {
    type: String,
    enum: ['available', 'in-mission', 'maintenance'],
    default: 'available',
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: 100,
  },
  isActive: { type: Boolean, default: true },
  currentMissionId: { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'Mission' }
}, {
  timestamps: true,
});

DroneSchema.index({ status: 1 });
DroneSchema.index({ batteryLevel: 1 });
DroneSchema.index({ currentMissionId: 1 });
DroneSchema.index({ isActive: 1 });
DroneSchema.index({ status: 1, batteryLevel: 1, isActive: 1, currentMissionId: 1 });

export default mongoose.model<IDrone>('Drone', DroneSchema);
