import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true,trim: true, },
    password: { type: String, required: [true, "Password is required"] },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);
