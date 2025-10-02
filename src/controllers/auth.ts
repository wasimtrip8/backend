// src/controllers/auth.ts
import { Request, Response } from "express";
import { Db, ObjectId, WithId } from "mongodb";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { TokenStatus, VerificationType, ProviderType, StatusType, UserRole } from "../types/enum";
import * as crypto from "crypto";
import { REFRESH_TOKEN_EXPIRE_DAYS } from "../config/constants";
import { IVerificationToken } from "../models/verificationToken";
import { IAuthAccessToken } from "../models/authAccessToken";
import { IAuthRefreshToken } from "../models/authRefreshToken";
import { IUser } from "../models/user";
import { IVerification } from "../models/verification";
import { error } from "console";

export class Auth {
  private db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  /** Helper: Validate OTP */
  private async validateOtp(verification: IVerification, code: string) {
    const tokens = verification.tokens || [];
    const tokenDoc = tokens[tokens.length - 1]; // latest token

    if (!tokenDoc || tokenDoc.code !== code) {
      throw new Error("Invalid or Expired OTP");
    }

    if (tokenDoc.status !== TokenStatus.ACTIVE) {
      throw new Error("OTP already used or expired");
    }

    if (tokenDoc.expires_at && tokenDoc.expires_at.getTime() < Date.now()) {
      await this.db.collection("verification").updateOne(
        { _id: verification._id, "tokens.code": tokenDoc.code },
        { $set: { "tokens.$.status": TokenStatus.EXPIRED } }
      );
      throw new Error("OTP expired");
    }

    // Mark OTP as USED
    await this.db.collection("verification").updateOne(
      { _id: verification._id, "tokens.code": tokenDoc.code },
      { $set: { "tokens.$.status": TokenStatus.USED } }
    );

    return tokenDoc;
  }


  /** Helper: Get or create user */
  private async getOrCreateUser(mobile_email: string, role?: UserRole, name?: string, source?: string, google_id?: string) {
    const userColl = this.db.collection<IUser>("users");
    let user = await userColl.findOne({ mobile: mobile_email }) || await userColl.findOne({ email: mobile_email });

    if (!user && !role) {
      throw new Error("Role is required if a new user is logging in");
    }


    if (!user) {
      const newUserDoc: Omit<IUser, "_id"> = {
        name: name || "Guest",
        mobile_verified: true,
        email_verified: mobile_email.includes("@"),
        is_verified: true,
        role: role || UserRole.USER,
        status: StatusType.ACTIVE,
        is_deleted: false,
        deleted_at: undefined,
        created_at: new Date(),
        modified_at: new Date(),
        picture: undefined,
        creator: undefined,
        source: source || "",
        ...(mobile_email && !mobile_email.includes("@") ? { mobile: mobile_email } : {}),
        ...(mobile_email && mobile_email.includes("@") ? { email: mobile_email } : {}),
        ...(google_id ? { google_id } : {}),
      };

      const insertResult = await userColl.insertOne(newUserDoc);
      user = { ...newUserDoc, _id: insertResult.insertedId } as WithId<IUser>;
    }

    return user;
  }

  /** Helper: Create tokens */
  private async createTokens(user: WithId<IUser>, platform_id?: string) {
    const refreshTokensColl = this.db.collection<IAuthRefreshToken>("auth_refresh_tokens");
    const accessTokensColl = this.db.collection<IAuthAccessToken>("auth_access_tokens");

    const accessToken = generateAccessToken({ userId: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user._id, role: user.role });

    const refreshResult = await refreshTokensColl.insertOne({
      user_id: user._id,
      platform_id: platform_id ? new ObjectId(platform_id) : null,
      refresh_token: refreshToken,
      status: TokenStatus.ACTIVE,
      created_at: new Date(),
      modified_at: new Date(),
      expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60 * 1000),
      provider: ProviderType.LOCAL,
    });

    await accessTokensColl.insertOne({
      user_id: user._id,
      refresh_id: refreshResult.insertedId,
      access_token: accessToken,
      status: TokenStatus.ACTIVE,
      created_at: new Date(),
      modified_at: new Date(),
      expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60 * 1000),
      provider: ProviderType.LOCAL,
    });

    return { accessToken, refreshToken };
  }

  // Refresh Token
  refresh = async (req: Request, res: Response) => {
    try {
      const { refresh_token } = req.body;
      const refreshTokensColl = this.db.collection<IAuthRefreshToken>("auth_refresh_tokens");
      const accessTokensColl = this.db.collection("auth_access_tokens");

      const stored = await refreshTokensColl.findOne({ refresh_token: refresh_token, status: TokenStatus.ACTIVE });
      if (!stored) return res.status(401).json({ error: "Invalid refresh token" });

      const newAccessToken = generateAccessToken({ userId: stored.user_id });

      await accessTokensColl.insertOne({
        user_id: stored.user_id,
        refresh_id: stored._id,
        access_token: newAccessToken,
        status: TokenStatus.ACTIVE,
        created_at: new Date(),
        modified_at: new Date(),
      });

      res.json({ accessToken: newAccessToken });
    } catch (err) {
      res.status(500).json({ error: "Internal server error", err });
    }
  };

  // ---------- OTP endpoints ----------
  /**
   * POST /auth/otp/send
   * body: { mobile_email: string, platform_id?: string, verification_type?: string }
   */
  sendOtp = async (req: Request, res: Response) => {
    try {
      const { mobile_email, platform_id, verification_type } = req.body;
      if (!mobile_email) return res.status(400).json({ error: "mobile_email is required" });

      const verificationColl = this.db.collection<IVerification>("verification");

      const code = Math.floor(1000 + Math.random() * 9000).toString();
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      const tokenObj: IVerificationToken = {
        platform_id: platform_id ? new ObjectId(platform_id) : new ObjectId(),
        verification_type: verification_type || VerificationType.LOGIN,
        token,
        code,
        verify_attempts: 0,
        resend_attempts: 0,
        expires_at: expiresAt,
        status: TokenStatus.ACTIVE,
        created_at: new Date(),
        modified_at: new Date(),
      };

      const existing = await verificationColl.findOne({ mobile_email });

      if (!existing) {
        await verificationColl.insertOne({
          mobile_email,
          tokens: [tokenObj],
          status: TokenStatus.ACTIVE,
          created_at: new Date(),
          modified_at: new Date(),
        });
      } else {
        await verificationColl.updateOne(
          { _id: existing._id },
          {
            $push: { tokens: tokenObj },
            $set: { status: TokenStatus.ACTIVE, modified_at: new Date() },
          }
        );
      }

      return res.status(200).json({ message: "OTP sent", sent: true, otp: code });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error", err });
    }
  };


  /** OTP login: verify + auto-create user + generate tokens */
  otpLogin = async (req: Request, res: Response) => {
    try {
      const { mobile_email, otp, platform_id, name, source, google_id, role } = req.body;
      const verificationColl = this.db.collection<IVerification>("verification");
      const verification = await verificationColl.findOne({ mobile_email });
      if (!verification) return res.status(404).json({ error: "No OTP request found" });

      await this.validateOtp(verification, otp);

      const user = await this.getOrCreateUser(mobile_email, role, name, source, google_id);

      const tokens = await this.createTokens(user, platform_id);

      return res.status(200).json({
        message: "OTP login successful",
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        user_id: user._id,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || "OTP login error", err });
    }
  };

  resendOtp = async (req: Request, res: Response) => {
    try {
      const { mobile_email } = req.body;
      if (!mobile_email) return res.status(400).json({ error: "mobile_email is required" });

      const verificationColl = this.db.collection<IVerification>("verification");

      const verification = await verificationColl.findOne({ mobile_email });
      if (!verification) return res.status(404).json({ error: "No OTP request found" });

      const tokens = verification.tokens || [];
      if (tokens.length === 0) return res.status(400).json({ error: "No OTP to resend" });

      const lastToken = tokens[tokens.length - 1];

      const MAX_RESENDS = 3;
      lastToken.resend_attempts = (lastToken.resend_attempts || 0) + 1;

      if (lastToken.resend_attempts > MAX_RESENDS) {
        return res.status(429).json({ error: "Resend limit reached" });
      }

      // extend expiry
      lastToken.expires_at = new Date(Date.now() + 5 * 60 * 1000);

      // update token in array using positional operator
      await verificationColl.updateOne(
        { _id: verification._id, "tokens.code": lastToken.code },
        {
          $set: {
            "tokens.$.resend_attempts": lastToken.resend_attempts,
            "tokens.$.expires_at": lastToken.expires_at
          }
        }
      );

      return res.status(200).json({
        message: "OTP resent",
        otp: lastToken.code,
        resendAttempts: lastToken.resend_attempts
      });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error", err });
    }
  };
}