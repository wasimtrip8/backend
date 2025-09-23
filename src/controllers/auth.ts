import { Request, Response } from "express";
import { Db, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { User, UserRole, UserStatus } from "../types/user";
import { TokenStatus } from "../types/auth";

export class Auth {
  private db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  // User Registration
  register = async (req: Request, res: Response) => {
    try {
      const users = this.db.collection("users");
      const existingUser = await users.findOne(req.body.email);
      if (existingUser) return res.status(400).json({ error: "User already exists" });

      const hashedPassword = await bcrypt.hash( req.body.password, 10);

      const user: User = {...req.body,
        role: UserRole.USER,
        password: hashedPassword,
        is_deleted: false,
        status: UserStatus.ACTIVE,
      }

      const result = await users.insertOne( user );

      res.status(201).json({ message: "User registered", userId: result.insertedId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  // Login
  login = async (req: Request, res: Response) => {
    try {
      const { email, password, platform_id } = req.body;

      const users = this.db.collection("users");
      const user = await users.findOne({ email });
      if (!user) return res.status(404).json({ error: "User not found" });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: "Invalid credentials" });

      // Generate tokens
      const accessToken = generateAccessToken({ userId: user._id });
      const refreshToken = generateRefreshToken({ userId: user._id });

      // Save refresh token
      const refreshTokens = this.db.collection("auth_refresh_tokens");
      const refreshResult = await refreshTokens.insertOne({
        user_id: user._id,
        platform_id: new ObjectId(platform_id),
        refresh_token: refreshToken,
        status: TokenStatus.ACTIVE
      });

      // Save access token
      const accessTokens = this.db.collection("auth_access_tokens");
      await accessTokens.insertOne({
        user_id: user._id,
        refresh_id: refreshResult.insertedId,
        access_token: accessToken,
         status: TokenStatus.ACTIVE
      });

      res.json({ accessToken, refreshToken });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  // Refresh Token
  refresh = async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      const refreshTokens = this.db.collection("auth_refresh_tokens");
      const stored = await refreshTokens.findOne({ refresh_token: refreshToken, status: TokenStatus.ACTIVE });
      if (!stored) return res.status(401).json({ error: "Invalid refresh token" });

      const newAccessToken = generateAccessToken({ userId: stored.user_id });
      const accessTokens = this.db.collection("auth_access_tokens");

      await accessTokens.insertOne({
        user_id: stored.user_id,
        refresh_id: stored._id,
        access_token: newAccessToken,
        status: TokenStatus.ACTIVE
      });

      res.json({ accessToken: newAccessToken });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}
