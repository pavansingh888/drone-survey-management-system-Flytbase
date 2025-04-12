import mongoose, { Schema, Document } from 'mongoose';

export interface IDrone extends Document {
  name: string;
  location: string;
  status: 'available' | 'in-mission' | 'maintenance';
  batteryLevel: number; // % from 0 to 100
  isActive: boolean;
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
}, {
  timestamps: true,
});

export default mongoose.model<IDrone>('Drone', DroneSchema);
