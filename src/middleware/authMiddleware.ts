import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/userModel";
import { config } from "../config/keys";

interface JwtPayload {
  id: string;
}

// Make sure not to return the response — just send it
export const authMiddleware: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ msg: "Access denied. No token provided." });
      return;
    }

    const decoded = jwt.verify(token, config.jwtSecret as string) as JwtPayload;
    const user = await User.findById(decoded.id).select("-password") as IUser;

    if (!user) {
      res.status(404).json({ msg: "User not found." });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(401).json({ msg: "Invalid or expired token." });
  }
};
