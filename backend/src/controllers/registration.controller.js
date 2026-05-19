import bcrypt from "bcryptjs";
import OTP from "../models/otp.model.js";
import User from "../models/user.model.js";
import { otpTemplate } from "../utils/emailTemplate.js";
import { createLog } from "../utils/logger.utils.js";
import { sendEmail } from "../utils/sendEmail.js";
import { AppError } from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createAuthenticatedSession,
  generateHashedOtp,
  getRecentOtp,
} from "./auth.shared.js";

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    await createLog({
      action: "REGISTER_FAILED",
      req,
      metadata: { email, reason: "User already exists" },
    });

    throw new AppError("User already exists", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  const rawOtp = await generateHashedOtp(email);

  await sendEmail(
    email,
    "Verify your account",
    otpTemplate(rawOtp, "Email Verification"),
  );

  await createLog({
    user: user._id,
    action: "USER_REGISTERED",
    req,
    metadata: { email },
  });

  res.status(201).json({
    success: true,
    message: "User registered. OTP sent to email",
  });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const otpRecord = await OTP.findOne({ email });
  if (!otpRecord) {
    await createLog({
      action: "VERIFY_OTP_FAILED",
      req,
      metadata: { email, reason: "OTP record not found" },
    });

    throw new AppError("Invalid OTP", 400);
  }

  const isMatch = await bcrypt.compare(otp, otpRecord.otp);
  if (!isMatch || otpRecord.expiresAt < new Date()) {
    await createLog({
      action: "VERIFY_OTP_FAILED",
      req,
      metadata: { email, reason: "Invalid or expired OTP" },
    });

    throw new AppError("Invalid or expired OTP", 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.isVerified = true;

  await OTP.deleteMany({ email });
  const { accessToken } = await createAuthenticatedSession(req, res, user);

  await createLog({
    user: user?._id,
    action: "ACCOUNT_VERIFIED",
    req,
    metadata: { email },
  });

  res.status(200).json({
    success: true,
    message: "Account verified successfully",
    accessToken,
    data: user,
  });
});

export const resendVerificationOtp = asyncHandler(async (req, res) => {
  const email = req.body.email || req.user?.email;

  if (!email) {
    throw new AppError("Email is required", 400);
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.isVerified) {
    res.status(200).json({
      success: true,
      message: "Account is already verified",
    });
    return;
  }

  const existingOtp = await getRecentOtp(user.email);
  if (existingOtp && existingOtp.createdAt.getTime() > Date.now() - 60 * 1000) {
    throw new AppError("Please wait before requesting another OTP", 429);
  }

  const rawOtp = await generateHashedOtp(user.email);

  await sendEmail(
    user.email,
    "Verify your account",
    otpTemplate(rawOtp, "Email Verification"),
  );

  await createLog({
    user: user._id,
    action: "VERIFICATION_OTP_RESENT",
    req,
    metadata: { email: user.email },
  });

  res.status(200).json({
    success: true,
    message: "Verification OTP sent to your email",
  });
});

export const verifyCurrentUserOtp = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  const email = req.user.email;
  const otpRecord = await OTP.findOne({ email });

  if (!otpRecord) {
    throw new AppError("Invalid OTP", 400);
  }

  const isMatch = await bcrypt.compare(otp, otpRecord.otp);
  if (!isMatch || otpRecord.expiresAt < new Date()) {
    throw new AppError("Invalid or expired OTP", 400);
  }

  const user = await User.findById(req.user.id).select("-password");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.isVerified = true;
  await user.save();
  await OTP.deleteMany({ email });

  await createLog({
    user: user._id,
    action: "ACCOUNT_VERIFIED",
    req,
    metadata: { email },
  });

  res.status(200).json({
    success: true,
    message: "Account verified successfully",
    data: user,
  });
});
