import cron from "node-cron";
import MissionStatus from "../models/missionStatusModel";
import { Server } from "socket.io";
import { getDroneRoomId } from "../utils/roomUtils";
import droneModel, { IDrone } from "../models/droneModel";

export async function scheduleOneTimeMissions(io: Server) {
  const droneIO = io.of("/drone");
  // Run every hour to check for one-time missions
  cron.schedule("* * * * *", async () => {
    try {
      console.log("🕒 Checking for one-time missions to schedule...");
      const now = new Date();
      
      let oneTimeMissionStatuses = [];
      try {
        oneTimeMissionStatuses = await MissionStatus.aggregate([
          {
            $lookup: {
              from: "missions",
              localField: "mission",
              foreignField: "_id",
              as: "mission",
            },
          },
          { $unwind: "$mission" },
          {
            $match: {
              "mission.schedule.type": "one-time",
              status: "not_started",
              $expr: {
                $lte: ["$mission.schedule.date", now],
              },
            },
          },
        ]);
      } catch (aggregateError) {
        console.error("❌ Error fetching one-time missions:", aggregateError);
        return;
      }

      if (oneTimeMissionStatuses.length === 0) {
        console.log("ℹ️ No one-time missions need scheduling at this time");
        return;
      }

      const hydratedOneTimeMissionStatuses = oneTimeMissionStatuses.map(
        (doc) => new MissionStatus(doc)
      );
      
      for (const missionStatus of hydratedOneTimeMissionStatuses) {
        try {
          // 🚁 Find a single available drone
          const availableDrone: IDrone | null = await droneModel.findOne({
            status: "available",
            batteryLevel: { $gt: 50 },
            isActive: true,
            currentMissionId: null,
          });

          if (!availableDrone) {
            console.log(
              "⚠️ No available drone found for mission",
              missionStatus._id
            );
            break; // Exit the loop if no available drone is found.
          }

          console.log(
            `🚀 Assigning mission ${missionStatus.mission} to drone ${availableDrone._id}`
          );
          
          try {
             await MissionStatus.findByIdAndUpdate(
              missionStatus._id,
              {
                droneId: availableDrone._id,
                status: "starting"
              },
              { new: true } // Return the updated document
            );
            
            // Only update drone status if mission status was saved successfully
            try {
              // Update drone's current mission
              const updatedDrone = await droneModel.findByIdAndUpdate(
                availableDrone._id,
                { currentMissionId: missionStatus.mission,
                  status:"in-mission" // Update drone status to in-mission
                 },
                { new: true } // Return the updated document
              );
              
              if (!updatedDrone) {
                throw new Error(`Failed to update drone ${availableDrone._id}: Not found`);
              }
              
              console.log(`✅ Successfully updated drone ${availableDrone._id} with mission ${missionStatus.mission}`);
            
            } catch (droneUpdateError) {
              console.error(`❌ Failed to update drone ${availableDrone._id}:`, droneUpdateError);
              // Attempt to revert mission status change if drone update fails
              try {
                await MissionStatus.findByIdAndUpdate(
                  missionStatus._id,
                  { status: "not_started", droneId: null }
                );
                console.log(`↩️ Reverted mission status for ${missionStatus._id} due to drone update failure`);
              } catch (revertError) {
                console.error(`❌ Failed to revert mission status:`, revertError);
              }
              continue; // Skip to next mission
            }
            
            // Only emit event if both saves were successful
            try {
              // Emit event to the assigned drone
              const roomId = getDroneRoomId(availableDrone._id.toString());
              droneIO.to(roomId).emit("start_mission", {
                missionId: missionStatus.mission.toString(),
                status: missionStatus.status,
                progress: missionStatus.progress,
                estimatedTimeRemaining: missionStatus.estimatedTimeRemaining,
              });
              console.log(`📡 Mission start event emitted to drone ${availableDrone._id}`);
            } catch (emitError) {
              console.error(`❌ Failed to emit start_mission event:`, emitError);
              // The mission is still scheduled, so we don't need to revert anything here
            }
          } catch (missionSaveError) {
            console.error(`❌ Failed to save mission status ${missionStatus._id}:`, missionSaveError);
            continue; // Skip to next mission
          }
        } catch (missionProcessError) {
          console.error(`❌ Error processing mission ${missionStatus._id}:`, missionProcessError);
          continue; // Move to next mission if there's an error
        }
      }
    } catch (cronError) {
      console.error("❌ Critical error in one-time mission scheduler:", cronError);
    }
  });
}

export function RecurringMissionPolling(io: Server) {
  const droneIO = io.of("/drone");
  setInterval(async () => {
    try {
      console.log("🔍 Checking for recurring missions to schedule...");
      let recurringMissionStatuses = [];
      
      try {
        recurringMissionStatuses = await MissionStatus.aggregate([
          {
            $lookup: {
              from: "missions",
              localField: "mission",
              foreignField: "_id",
              as: "mission",
            },
          },
          { $unwind: "$mission" },
          {
            $match: {
              "mission.schedule.type": "recurring",
              status: "not_started",
            },
          },
        ]);
        
        console.log(`📋 Found ${recurringMissionStatuses.length} recurring missions to process`);
      } catch (aggregateError) {
        console.error("❌ Error fetching recurring missions:", aggregateError);
        return;
      }
      
      recurringMissionStatuses.forEach((missionStatus) => {
        if (missionStatus.mission.schedule.cron) {
          try {
            cron.schedule(missionStatus.mission.schedule.cron, async () => {
              try {
                console.log(
                  `🔁 Launching recurring mission ${missionStatus.mission._id}`
                );
                
                // 🚁 Find a single available drone
                let availableDrone: IDrone | null;
                try {
                  availableDrone = await droneModel.findOne({
                    status: "available",
                    batteryLevel: { $gt: 50 },
                    isActive: true,
                    currentMissionId: null,
                  });
                  
                  if (!availableDrone) {
                    console.log(
                      "⚠️ No available drone found for mission",
                      missionStatus._id
                    );
                    return;
                  }
                } catch (droneQueryError) {
                  console.error("❌ Error finding available drone:", droneQueryError);
                  return;
                }
                
                console.log(
                  `🚀 Assigning mission ${missionStatus.mission._id} to drone ${availableDrone._id}`
                );
                
                // Get the latest mission status from database before updating
                let currentMissionStatus;
                try {
                  currentMissionStatus = await MissionStatus.findById(missionStatus._id);
                  if (!currentMissionStatus) {
                    console.error(`❌ Mission status ${missionStatus._id} no longer exists`);
                    return;
                  }
                } catch (findError) {
                  console.error(`❌ Error fetching current mission status: ${findError}`);
                  return;
                }
                
                // Update mission status using findByIdAndUpdate
                try {
                  const updatedMissionStatus = await MissionStatus.findByIdAndUpdate(
                    currentMissionStatus._id,
                    {
                      droneId: availableDrone._id, // Removed optional chaining
                      status: "starting"
                    },
                    { new: true }
                  );
                  
                  if (!updatedMissionStatus) {
                    throw new Error(`Failed to update mission status ${currentMissionStatus._id}`);
                  }
                  
                } catch (missionUpdateError) {
                  console.error(`❌ Failed to update mission status:`, missionUpdateError);
                  return;
                }
                
                // Update drone using findByIdAndUpdate
                try {
                  const updatedDrone = await droneModel.findByIdAndUpdate(
                    availableDrone._id,
                    { currentMissionId: missionStatus.mission._id,
                      status: "in-mission" // Update drone status to in-mission
                    },
                    { new: true }
                  );
                  
                  if (!updatedDrone) {
                    throw new Error(`Failed to update drone ${availableDrone._id}`);
                  }
                } catch (droneUpdateError) {
                  console.error(`❌ Failed to update drone:`, droneUpdateError);
                  
                  // Try to revert mission status update
                  try {
                    await MissionStatus.findByIdAndUpdate(
                      missionStatus._id,
                      {
                        droneId: null,
                        status: "not_started"
                      }
                    );
                  } catch (revertError) {
                    console.error(`❌ Failed to revert mission status:`, revertError);
                  }
                  return;
                }
                
                // Emit event to the assigned drone
                try {
                  const roomId = getDroneRoomId(availableDrone._id.toString());
                  droneIO.to(roomId).emit("start_mission", {
                    missionId: missionStatus.mission._id.toString(),
                    status: "starting",
                    progress: missionStatus.progress,
                    estimatedTimeRemaining: missionStatus.estimatedTimeRemaining,
                  });
                } catch (emitError) {
                  console.error(`❌ Failed to emit start_mission event:`, emitError);
                  // The mission is still scheduled, so we don't need to revert anything here
                }
              } catch (cronExecutionError) {
                console.error(`❌ Error executing recurring mission ${missionStatus._id}:`, cronExecutionError);
              }
            });
          } catch (cronSetupError) {
            console.error(`❌ Error setting up cron job for mission ${missionStatus._id}:`, cronSetupError);
          }
        } else {
          console.warn(`⚠️ Mission ${missionStatus._id} is marked as recurring but has no cron pattern`);
        }
      });
    } catch (intervalError) {
      console.error("❌ Critical error in recurring mission polling:", intervalError);
    }
  },  60 * 1000); // every 1 day
}
