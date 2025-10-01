// src/controllers/auth.ts
import { Request, Response } from "express";
import { Db, ObjectId, WithId } from "mongodb";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { TokenStatus, VerificationType, ProviderType, StatusType, UserRole } from "../types/enum";
import { IAuthRefreshToken } from "../models/AuthRefreshToken";
import { IVerificationToken } from "../models/VerificationToken";
import { IVerification } from "../models/Verification";
import * as crypto from "crypto";
import { IAuthAccessToken } from "../models/AuthAccessToken";
import { REFRESH_TOKEN_EXPIRE_DAYS } from "../config/constants";
import { IUser } from "../models/User";

export class Auth {
  private db: Db;

  constructor(db: Db) {
    this.db = db;
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

      const code = Math.floor(100000 + Math.random() * 900000).toString();
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

  /**
   * POST /auth/otp/verify
   * body: { mobile_email: string, code: string }
   *
   * Marks the token used and optionally issues JWT if a user exists with that mobile/email.
   */
  verifyOtp = async (req: Request, res: Response) => {
    try {
      const { mobile_email, code, platform_id } = req.body;
      if (!mobile_email || !code) {
        return res.status(400).json({ error: "mobile_email and code are required" });
      }

      const verificationColl = this.db.collection<IVerification>("verification");
      const userColl = this.db.collection<IUser>("users");
      const refreshTokensColl = this.db.collection<IAuthRefreshToken>("auth_refresh_tokens");
      const accessTokensColl = this.db.collection("auth_access_tokens");

      // Find verification document
      const verification = await verificationColl.findOne({ mobile_email });
      if (!verification) return res.status(404).json({ error: "No OTP request found" });

      // Find latest matching active token
      const tokens = verification.tokens || [];
      let foundIdx = -1;
      for (let i = tokens.length - 1; i >= 0; i--) {
        const t = tokens[i] as IVerificationToken;
        if (t.code === code && t.status === TokenStatus.ACTIVE) {
          foundIdx = i;
          break;
        }
      }

      if (foundIdx === -1) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      const tokenDoc = tokens[foundIdx];

      // Expiry check
      if (tokenDoc.expires_at && tokenDoc.expires_at.getTime() < Date.now()) {
        tokenDoc.status = TokenStatus.EXPIRED;
        await verificationColl.updateOne(
          { _id: verification._id, "tokens.code": code },
          { $set: { "tokens.$.status": TokenStatus.EXPIRED } }
        );
        return res.status(400).json({ error: "OTP expired" });
      }

      // Mark OTP as USED
      tokenDoc.status = TokenStatus.ACTIVE;
      await verificationColl.updateOne(
        { _id: verification._id, "tokens.code": code },
        { $set: { "tokens.$.status": TokenStatus.ACTIVE } }
      );

      // Find user by mobile OR email
      let user = await userColl.findOne({ mobile: mobile_email })
        || await userColl.findOne({ email: mobile_email });

      if (!user) {
        return res.status(200).json({
          message: "OTP verified, but no user found",
          otpVerified: true,
          requiresRegistration: true,
        });
      }

      // At this point, TypeScript knows user is not null
      const accessToken = generateAccessToken({ userId: user._id, role: user.role });
      const refreshToken = generateRefreshToken({ userId: user._id, role: user.role });

      // Persist refresh token
      const refreshResult = await refreshTokensColl.insertOne({
        user_id: user._id,
        platform_id: platform_id ? new ObjectId(platform_id) : null,
        refresh_token: refreshToken,
        status: TokenStatus.ACTIVE,
        created_at: new Date(),
        modified_at: new Date(),
        expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60 * 1000),
        provider: ProviderType.LOCAL
      });

      // Persist access token
      await accessTokensColl.insertOne({
        user_id: user._id,
        refresh_id: refreshResult.insertedId,
        access_token: accessToken,
        status: TokenStatus.ACTIVE,
        created_at: new Date(),
        modified_at: new Date(),
      });

      return res.status(200).json({
        message: "OTP verified",
        accessToken,
        refreshToken,
        userId: user._id
      });

    } catch (err) {
      return res.status(500).json({ error: "Internal server error", err });
    }
  };


  /**
   * POST /auth/otp/resend
   * body: { mobile_email: string }
   * Increments resend_attempts on last token and simulates resend.
   */
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

  // OTP Login (shortcut: send + verify in one flow)
  otpLogin = async (req: Request, res: Response) => {
    try {
      const { mobile_email, code, platform_id, name, source, google_id } = req.body;
      if (!mobile_email || !code) {
        return res.status(400).json({ error: "mobile_email and code are required" });
      }

      const verificationColl = this.db.collection<IVerification>("verification");
      const userColl = this.db.collection<IUser>("users");
      const refreshTokensColl = this.db.collection<IAuthRefreshToken>("auth_refresh_tokens");
      const accessTokensColl = this.db.collection<IAuthAccessToken>("auth_access_tokens");

      // find verification entry
      const verification = await verificationColl.findOne({ mobile_email });
      if (!verification) return res.status(404).json({ error: "No OTP request found" });

      // find latest active token with matching code
      const tokens = verification.tokens || [];
      const tokenDoc = [...tokens].reverse().find(
        t => t.code === code && t.status === TokenStatus.ACTIVE
      );

      if (!tokenDoc) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      // expiry check
      if (tokenDoc.expires_at && tokenDoc.expires_at.getTime() < Date.now()) {
        tokenDoc.status = TokenStatus.EXPIRED;
        await verificationColl.updateOne(
          { _id: verification._id, "tokens.code": tokenDoc.code },
          { $set: { "tokens.$.status": TokenStatus.EXPIRED } }
        );
        return res.status(400).json({ error: "OTP expired" });
      }

      // mark OTP as used
      tokenDoc.status = TokenStatus.ACTIVE;
      await verificationColl.updateOne(
        { _id: verification._id, "tokens.code": tokenDoc.code },
        { $set: { "tokens.$.status": TokenStatus.ACTIVE } }
      );

      // locate user by mobile/email
      let user = await userColl.findOne({ mobile: mobile_email }) ||
        await userColl.findOne({ email: mobile_email });

      // Auto-create user if not found
      if (!user) {
        const newUserDoc: Omit<IUser, "_id"> = {
          name: name || "Guest",
          mobile_verified: true,
          email_verified: mobile_email.includes("@"),
          is_verified: true,
          role: UserRole.USER,
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
  ...(google_id ? { google_id: google_id } : {}),
        };

        const insertResult = await userColl.insertOne(newUserDoc);

        // Cast to WithId<IUser> using insertedId
        user = { ...newUserDoc, _id: insertResult.insertedId } as WithId<IUser>;
      }

      // generate tokens
      const accessToken = generateAccessToken({ userId: user._id, role: user.role });
      const refreshToken = generateRefreshToken({ userId: user._id, role: user.role });

      // persist refresh token
      const refreshResult = await refreshTokensColl.insertOne({
        user_id: user._id,
        platform_id: platform_id ? new ObjectId(platform_id) : null,
        refresh_token: refreshToken,
        status: TokenStatus.ACTIVE,
        created_at: new Date(),
        modified_at: new Date(),
        expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60 * 1000), // 30 days
        provider: ProviderType.LOCAL
      });

      // persist access token
      await accessTokensColl.insertOne({
        user_id: user._id,
        refresh_id: refreshResult.insertedId,
        access_token: accessToken,
        status: TokenStatus.ACTIVE,
        created_at: new Date(),
        modified_at: new Date(),
        expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60 * 1000), // 30 days,
        provider: ProviderType.LOCAL
      });

      return res.status(200).json({
        message: "OTP login successful",
        accessToken,
        refreshToken,
        userId: user._id,
      });
    } catch (err) {
      return res.status(500).json({ error: "OTP login error", err });
    }
  };
}