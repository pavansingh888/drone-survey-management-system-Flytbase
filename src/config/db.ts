import mongoose from "mongoose";
import { config } from "./keys";
const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri as string);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error", err);
    process.exit(1);
  }
};

export default connectDB;
