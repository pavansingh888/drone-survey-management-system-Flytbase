
export const config = {
    port: process.env.PORT || 5000,
    mongoUri: process.env.MONGO_URI!,
    jwtSecret: process.env.JWT_SECRET!,
    roomSecret: process.env.ROOM_SECRET!,
  };
  