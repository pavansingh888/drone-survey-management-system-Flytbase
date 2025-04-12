import dotenv from "dotenv";
dotenv.config();
import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import connectDB from "./config/db";
import { config } from "./config/keys";
import missionRoutes from "./routes/missionRoutes";
import authRoutes from "./routes/authRoutes";
import droneRoutes from "./routes/droneRoutes";
import surveyReportRoutes from "./routes/surveyReportRoutes";
import missionStatusRoutes from "./routes/missionStatusRoutes";
import { authenticateSocket } from "./sockets/authenticateSocket";
import setupMissionSocket from "./sockets/missionSocket";

const app = express();

app.use(cors());
app.use(express.json());

// TODO: Load routes
app.use("/api/auth", authRoutes);
app.use("/api/missions", missionRoutes);
app.use("/api/drones", droneRoutes);
app.use("/api/reports", surveyReportRoutes);
app.use("/api/mission-status", missionStatusRoutes);

// TODO: Setup sockets
const server = http.createServer(app);

// create Socket.IO server
const io = new SocketIOServer(server, {
  cors: { origin: "*" },
});

// apply socket authentication middleware
io.use(authenticateSocket);
// setup mission socket listeners
setupMissionSocket(io);

const PORT = config.port;
connectDB().then(()=>{
  server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
})

