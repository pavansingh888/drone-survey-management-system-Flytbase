import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "../config/keys";

export const authenticateSocket = (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication token missing"));
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret as string) as { id: string };
    (socket as any).user = { _id: decoded.id };
    next();
  } catch (err) {
    next(new Error("Invalid authentication token"));
  }
};
