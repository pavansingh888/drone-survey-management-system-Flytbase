import { Server } from "socket.io";
import { authenticateSocket } from "./authenticateSocket";
import { getMissionRoomId } from "../utils/roomUtils";
import MissionStatus from "../models/missionStatusModel";
import { progressUpdateSchema, statusUpdateSchema } from "../validators/missionSocketSchemas";
import {IMissionStatus} from "../models/missionStatusModel";

export default function setupMissionSocket(io: Server) {
  const missionIO = io.of("/mission");

  missionIO.use(authenticateSocket);

  missionIO.on("connection", (socket) => {
    console.log("✅ [SOCKET] Client connected to /mission");

    //Client joins a mission room to see real time updates of that mission and to emit action events.
    //drone joins a mission room to sent progress and status updates
    socket.on("join_mission", (missionId: string) => {
      const roomId = getMissionRoomId(missionId);
      socket.join(roomId);
      console.log(`🔗 Client joined ${roomId}`);
    });
    //Client leaves watching the realtime updates of a mission by leaving mission room
    //drone leaves room and stop send updates to room 
    socket.on("leave_mission", (missionId: string) => {
      const roomId = getMissionRoomId(missionId);
      socket.leave(roomId);
      console.log(`❌ Client left ${roomId}`);
    });

    // listens to Flight path updates from drone for getting its realtime coordinate/position and sending it to mission room for client to see realtime updates
    socket.on("flight_update", ({ missionId, coordinate }) => {
      const roomId = getMissionRoomId(missionId);
      missionIO.to(roomId).emit("flight_update", coordinate);
    });

    // drone will send Mission progress update getting realtime survey progress and sending it to mission room for client to see realtime progress updates
    //as well as updating progress details to mission status model
    socket.on("progress_update", async (payload) => {
        const result = progressUpdateSchema.safeParse(payload);
        if (!result.success) return console.error("Invalid progress_update payload");
      
        const { missionId, progress, eta } = result.data;
        const roomId = getMissionRoomId(missionId);
      
        try {
          await MissionStatus.findOneAndUpdate(
            { mission: missionId },
            {
              progress,
              estimatedTimeRemaining: eta,
              lastUpdated: new Date(),
            },
            { upsert: true, new: true }
          );
      
          missionIO.to(roomId).emit("progress_update", { progress, eta });
        } catch (err) {
          console.error("Error saving progress:", err);
        }
      });
      

    // drone will send status update for realtime monitoring of mission status
    //as well as updating status details to mission status model
    socket.on("status_update", async (payload) => {
    const result = statusUpdateSchema.safeParse(payload);
    if (!result.success) return console.error("Invalid status_update payload");
  
    const { missionId, status } = result.data;
    const roomId = getMissionRoomId(missionId);
  
    try {
      await MissionStatus.findOneAndUpdate(
        { mission: missionId },
        {
          status,
          lastUpdated: new Date(),
        },
        { upsert: true, new: true }
      );
  
      missionIO.to(roomId).emit("status_update", status);
    } catch (err) {
      console.error("Error saving status:", err);
    }
  });

    // Client sends Control actions: pause, resume, abort, which is emitted to all the members joined in the room. So once client recieves back the event it sent, it can be sure that mission action is completed.
    socket.on("mission_action", async ({ missionId, action }: { missionId: string; action: "pause" | "resume" | "abort" }) => {
      const roomId = getMissionRoomId(missionId);
    
      try {
        let newStatus: IMissionStatus["status"] | null = null;
    
        switch (action) {
          case "pause":
            newStatus = "paused";
            break;
          case "resume":
            newStatus = "in_progress";
            break;
          case "abort":
            newStatus = "aborted";
            break;
          default:
            console.warn(`Unknown action "${action}" received`);
            return;
        }
    
        // Update DB
        const updated = await MissionStatus.findOneAndUpdate(
          { mission: missionId },
          {
            status: newStatus,
            lastUpdated: new Date(),
          },
          { new: true }
        );
    
        if (!updated) {
          console.warn(`⚠️ No MissionStatus found for mission ${missionId}`);
        } else {
          console.log(`✅ Mission ${missionId} status updated to ${newStatus}`);
        }
    
        // Emit to all clients in the room
        missionIO.to(roomId).emit("mission_action", action);
    
      } catch (err) {
        console.error("Error updating mission status:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("🚪 [SOCKET] Client disconnected from /mission");
    });
  });
}
