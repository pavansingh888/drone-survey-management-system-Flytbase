import { Server } from "socket.io";
import { authenticateSocket } from "./authenticateSocket";
import { getDroneRoomId } from "../utils/roomUtils";
import MissionStatus from "../models/missionStatusModel";
import { progressUpdateSchema } from "../validators/missionSocketSchemas";
import { IMissionStatus } from "../models/missionStatusModel";
import droneModel from "../models/droneModel";
import surveyReportModel from "../models/surveyReportModel";

export default function setupMissionSocket(io: Server) {
  const droneIO = io.of("/drone");

  droneIO.use(authenticateSocket);

  droneIO.on("connection", (socket) => {
    console.log("✅ [SOCKET] Client connected to /drone");

    //Client joins a drone room to see real time updates of that mission and to emit action events.
    //drone joins a mission room to sent progress and status updates
    socket.on("join_droneRoom", (droneId: string) => {
      const roomId = getDroneRoomId(droneId);
      socket.join(roomId);
      console.log(`🔗 Drone/Client joined ${roomId}`);
    });
    //Client leaves watching the realtime updates of a mission by leaving mission room
    //drone leaves room and stop send updates to room
    socket.on("leave_droneRoom", (droneId: string) => {
      const roomId = getDroneRoomId(droneId);
      socket.leave(roomId);
      console.log(`❌ Drone/Client left ${roomId}`);
    });

    // TODO: Use socket.io to push drone availability, battery, status from the drone SDK/device to droneModel
    socket.on(
      "drone_update",
      async ({
        droneId,
        location,
        status,
        batteryLevel,
        isActive,
        currentMissionId,
      }) => {
        try {
          const existingDrone = await droneModel.findById(droneId);
          if (!existingDrone) {
            console.warn(`⚠️ Drone with ID ${droneId} not found`);
            return;
          }

          const previousMissionId = existingDrone.currentMissionId?.toString();

          const updatedDrone = await droneModel.findByIdAndUpdate(
            droneId,
            {
              ...(location && { location }),
              ...(status && { status }),
              ...(typeof batteryLevel === "number" && { batteryLevel }),
              ...(typeof isActive === "boolean" && { isActive }),
              ...(typeof currentMissionId !== "undefined" && {
                currentMissionId,
              }),
              updatedAt: new Date(),
            },
            { new: true }
          );

          if (updatedDrone) {
            console.log(`🛩️ Drone ${droneId} updated`);

            // Emit drone_update to the room
            const roomId = getDroneRoomId(droneId);

            droneIO.to(roomId).emit("drone_update", {
              droneId: updatedDrone._id,
              location: updatedDrone.location,
              status: updatedDrone.status,
              batteryLevel: updatedDrone.batteryLevel,
              isActive: updatedDrone.isActive,
              currentMissionId: updatedDrone.currentMissionId,
            });

            console.log(`📡 Emitted drone_update to Drone room ${roomId}`);

            // Emit drone_unlinked event if the drone is unlinked from a mission
            // This is done by checking if currentMissionId is null and previousMissionId is not null
            if (
              typeof currentMissionId !== "undefined" &&
              currentMissionId === null &&
              previousMissionId
            ) {
              const roomId = getDroneRoomId(droneId);
              droneIO.to(roomId).emit("mission_unlinked", {
                droneId: updatedDrone._id,
                previousMissionId,
                currentMissionId: null,
              });
              console.log(
                `🔌 Drone ${droneId} unlinked from mission ${previousMissionId}`
              );
            }
          } else {
            console.warn(`⚠️ Drone with ID ${droneId} not found`);
          }
        } catch (err) {
          console.error("Error updating drone data:", err);
        }
      }
    );

    // drone will send coordinates to the server and server will emit it to all the members joined in the room. So once client recieves back the event it sent, it can be sure that mission action is completed.
    socket.on("drone_coordinate", ({ droneId, coordinate }) => {
      const roomId = getDroneRoomId(droneId);
      droneIO.to(roomId).emit("drone_coordinate", coordinate);
    });

    // drone will send Mission progress update for getting realtime survey progress and sending it to mission room for client to see realtime progress updates
    //as well as updating progress details to mission status model
    socket.on("progress_update", async (payload) => {
      const result = progressUpdateSchema.safeParse(payload);
      if (!result.success)
        return console.error("Invalid progress_update payload");

      const { missionId, progress, eta, status, droneId, duration, distance } =
        result.data;
      const roomId = getDroneRoomId(droneId);

      try {
        // Handle survey report creation if mission is completed or aborted
        // On mission status=completed or aborted update from drone → generate a survey report with status=completed if progress is more than 85%  with and save in survey report model and update mission status model with status=not_started and progress=0 and estimatedTimeRemaining=null and droneId=null
        if (status === "completed" || status === "aborted") {
          if (droneId && duration && distance && progress) {
            const reportStatus = progress >= 85 ? "completed" : "failed";

            const report = await surveyReportModel.create({
              missionId,
              droneId,
              duration,
              distance,
              coverage: progress,
              status: reportStatus,
              generatedAt: new Date(),
            });
            console.log(`Survey report generated for mission`, report);
            await MissionStatus.findOneAndUpdate(
              { mission: missionId },
              {
                droneId:null,
                progress:0,
                estimatedTimeRemaining:null,
                status:"not_started",
                lastUpdated: new Date(),
              },
              { upsert: true, new: true }
            );
          } else {
            console.warn(`Missing survey report data in payload for mission`);
          }
        }
        await MissionStatus.findOneAndUpdate(
          { mission: missionId },
          {
            progress,
            estimatedTimeRemaining: eta,
            status,
            lastUpdated: new Date(),
          },
          { upsert: true, new: true }
        );
        droneIO
          .to(roomId)
          .emit("mission_progress_update", {
            missionId,
            progress,
            duration,
            distance,
            eta,
            status,
          });
      } catch (err) {
        console.error("Error saving progress:", err);
      }
    });

    // Client sends Control actions: pause, resume, abort, which is emitted to all the members joined in the room. So once client recieves back the event it sent, it can be sure that mission action is completed.
    socket.on(
      "mission_action",
      async ({
        droneId,
        missionId,
        action,
      }: {
        droneId: string;
        missionId: string;
        action: "pause" | "resume" | "abort";
      }) => {
        const roomId = getDroneRoomId(droneId);

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
            { droneId, mission: missionId },
            {
              status: newStatus,
              lastUpdated: new Date(),
            },
            { new: true }
          );

          if (!updated) {
            console.warn(
              `⚠️ No MissionStatus found for mission associated with drone ${droneId}`
            );
          } else {
            console.log(
              `✅ Mission assigned to drone ${droneId}, status updated to ${newStatus}`
            );
          }

          // Emit to all clients in the room
          droneIO.to(roomId).emit("mission_action", action);
        } catch (err) {
          console.error("Error updating mission status:", err);
        }
      }
    );

    socket.on("disconnect", () => {
      console.log("🚪 [SOCKET] Drone/Client disconnected from /drone");
    });
  });
}
