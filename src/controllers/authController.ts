import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/userModel";
import { signupSchema, signinSchema } from "../validators/authValidator";
import { config } from "../config/keys";

const generateToken = (id: string) => {
  return jwt.sign({ id }, config.jwtSecret as string, { expiresIn: "7d" });
};

export const signup = async (req: Request, res: Response) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ msg: "Invalid input", errors: parsed.error.format() });
      return;
    }
    const { name, email, password } = parsed.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ msg: "User already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({ name, email, password: hashedPassword });
    const token = generateToken(String(user._id));

    res.status(201).json({ token, user: { id: user._id, name: user.name, email } });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ msg: "Server error during signup" });
  }
};

export const signin = async (req: Request, res: Response) => {
  try {
    const parsed = signinSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ msg: "Invalid input", errors: parsed.error.format() });
      return;
    }
    const { email, password } = parsed.data;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ msg: "Invalid email or password" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ msg: "Invalid email or password" });
      return;
    }
    const token = generateToken(String(user._id));

    res.json({ token, user: { id: user._id, name: user.name, email } });
  } catch (error) {
    console.error("Signin Error:", error);
    res.status(500).json({ msg: "Server error during signin" });
  }
};
