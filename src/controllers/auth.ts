import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { signToken } from "../utils/jwt";

interface User {
  id: number;
  username: string;
  password: string; // hashed
}

const users: User[] = []; // In-memory store (replace with DB)

export const register = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const newUser: User = { id: Date.now(), username, password: hashed };
  users.push(newUser);
  res.json({ message: "User registered successfully" });
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username);
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: "Invalid credentials" });

  const token = signToken({ id: user.id, username: user.username });
  res.json({ token });
};

export const profile = (req: Request, res: Response) => {
  res.json({ message: "Profile data", user: (req as any).user });
};
