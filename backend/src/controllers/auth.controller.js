import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import otpGenerator from "otp-generator";
import OTP from "../models/otp.model.js";
import User from "../models/user.model.js";
import { otpTemplate } from "../utils/emailTemplate.js";
import { createLog } from "../utils/logger.utils.js";
import { sendEmail } from "../utils/sendEmail.js";
import { generateTokens } from "../utils/token.utils.js";
import { AppError } from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const generateHashedOtp = async (email) => {
  const rawOtp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
    alphabets: false,
  });

  const hashedOtp = await bcrypt.hash(rawOtp, 10);

  await OTP.deleteMany({ email });
  await OTP.create({
    email,
    otp: hashedOtp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  return rawOtp;
};

const getRecentOtp = async (email) => {
  return OTP.findOne({ email }).sort({ createdAt: -1 });
};

const createAuthenticatedSession = async (req, res, user) => {
  const { accessToken, refreshToken } = generateTokens(user);

  user.sessions.push({
    refreshToken,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
  await user.save();

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return { accessToken, refreshToken };
};

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

export const loginWithOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    await createLog({
      action: "LOGIN_OTP_REQUEST_FAILED",
      req,
      metadata: { email, reason: "User not found" },
    });

    throw new AppError("User not found", 404);
  }

  const existingOtp = await getRecentOtp(email);
  if (existingOtp && existingOtp.createdAt.getTime() > Date.now() - 60 * 1000) {
    await createLog({
      user: user._id,
      action: "LOGIN_OTP_RATE_LIMITED",
      req,
      metadata: { email },
    });

    throw new AppError("Please wait before requesting another OTP", 429);
  }

  const otp = otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });

  const hashedOtp = await bcrypt.hash(otp, 10);

  await OTP.create({
    email,
    otp: hashedOtp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  await sendEmail(email, "Login OTP", otpTemplate(otp, "Login Verification"));

  await createLog({
    user: user._id,
    action: "LOGIN_OTP_SENT",
    req,
    metadata: { email },
  });

  res.json({ success: true, message: "OTP sent to email" });
});

export const verifyLoginOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const otpRecord = await OTP.findOne({ email });
  if (!otpRecord) {
    await createLog({
      action: "LOGIN_OTP_VERIFY_FAILED",
      req,
      metadata: { email, reason: "Invalid OTP" },
    });

    throw new AppError("Invalid OTP", 400);
  }

  const isMatch = await bcrypt.compare(otp, otpRecord.otp);
  if (!isMatch || otpRecord.expiresAt < new Date()) {
    await createLog({
      action: "LOGIN_OTP_VERIFY_FAILED",
      req,
      metadata: { email, reason: "Invalid or expired OTP" },
    });

    throw new AppError("Invalid or expired OTP", 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const { accessToken } = await createAuthenticatedSession(req, res, user);

  await OTP.deleteMany({ email });

  await createLog({
    user: user._id,
    action: "LOGIN_SUCCESS_OTP",
    req,
    metadata: { email },
  });

  res.json({
    success: true,
    message: "Login successful",
    accessToken,
  });
});

export const loginWithPassword = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    await createLog({
      action: "LOGIN_FAILED_PASSWORD",
      req,
      metadata: { email, reason: "User not found" },
    });

    throw new AppError("Invalid credentials", 400);
  }

  if (user.lockUntil && user.lockUntil > Date.now()) {
    await createLog({
      user: user._id,
      action: "ACCOUNT_LOCKED_LOGIN_ATTEMPT",
      req,
      metadata: { email },
    });

    throw new AppError("Account locked. Try later", 403);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    user.loginAttempts += 1;

    if (user.loginAttempts >= 5) {
      user.lockUntil = Date.now() + 15 * 60 * 1000;
    }

    await user.save();

    await createLog({
      user: user._id,
      action: "LOGIN_FAILED_PASSWORD",
      req,
      metadata: {
        email,
        loginAttempts: user.loginAttempts,
        lockedUntil: user.lockUntil,
      },
    });

    throw new AppError("Invalid credentials", 400);
  }

  user.loginAttempts = 0;
  user.lockUntil = null;

  const { accessToken } = await createAuthenticatedSession(req, res, user);

  await createLog({
    user: user._id,
    action: "LOGIN_SUCCESS_PASSWORD",
    req,
    metadata: { email },
  });

  res.json({
    success: true,
    message: "Login successful",
    accessToken,
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    await createLog({
      action: "FORGOT_PASSWORD_FAILED",
      req,
      metadata: { email, reason: "User not found" },
    });

    throw new AppError("User not found", 404);
  }

  const otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
    alphabets: false,
  });

  const hashedOtp = await bcrypt.hash(otp, 10);

  await OTP.create({
    email,
    otp: hashedOtp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  await sendEmail(email, "Reset Password", otpTemplate(otp, "Password Reset"));

  await createLog({
    user: user._id,
    action: "PASSWORD_RESET_OTP_SENT",
    req,
    metadata: { email },
  });

  res.json({ success: true, message: "OTP sent for password reset" });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const otpRecord = await OTP.findOne({ email });
  if (!otpRecord) {
    await createLog({
      action: "PASSWORD_RESET_FAILED",
      req,
      metadata: { email, reason: "OTP record not found" },
    });

    throw new AppError("Invalid or expired OTP", 400);
  }

  const isMatch = await bcrypt.compare(otp, otpRecord.otp);
  if (!isMatch || otpRecord.expiresAt < new Date()) {
    await createLog({
      action: "PASSWORD_RESET_FAILED",
      req,
      metadata: { email, reason: "Invalid or expired OTP" },
    });

    throw new AppError("Invalid or expired OTP", 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const user = await User.findOneAndUpdate(
    { email },
    { password: hashedPassword },
    { new: true },
  );

  await OTP.deleteMany({ email });

  await createLog({
    user: user?._id,
    action: "PASSWORD_RESET_SUCCESS",
    req,
    metadata: { email },
  });

  res.json({ success: true, message: "Password reset successful" });
});

export const logoutUser = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  const user = req.user;

  user.sessions = user.sessions.filter(
    (session) => session.refreshToken !== token,
  );
  await user.save();

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  await createLog({
    user: user._id,
    action: "LOGOUT_SUCCESS",
    req,
    metadata: { email: user.email },
  });

  res.json({ success: true, message: "Logged out successfully" });
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    await createLog({
      action: "REFRESH_TOKEN_MISSING",
      req,
    });

    throw new AppError("No refresh token", 401);
  }

  const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  const user = await User.findById(decoded.id);

  if (!user) {
    await createLog({
      action: "REFRESH_TOKEN_FAILED",
      req,
      metadata: { reason: "User not found", userId: decoded.id },
    });

    throw new AppError("User not found", 401);
  }

  if (decoded.tokenVersion !== user.tokenVersion) {
    await createLog({
      user: user._id,
      action: "REFRESH_TOKEN_REJECTED",
      req,
      metadata: { reason: "Token version mismatch" },
    });

    throw new AppError("Refresh token invalid", 401);
  }

  const session = user.sessions.find((currentSession) => {
    return currentSession.refreshToken === token;
  });

  if (!session) {
    await createLog({
      user: user._id,
      action: "REFRESH_TOKEN_REJECTED",
      req,
      metadata: { reason: "Invalid session" },
    });

    throw new AppError("Invalid session", 401);
  }

  const { accessToken, refreshToken } = generateTokens(user);

  user.sessions = user.sessions.filter(
    (currentSession) => currentSession.refreshToken !== token,
  );
  user.sessions.push({
    refreshToken,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
  await user.save();

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  await createLog({
    user: user._id,
    action: "TOKEN_REFRESHED",
    req,
    metadata: { email: user.email },
  });

  res.json({ success: true, accessToken });
});

export const logoutAllDevices = asyncHandler(async (req, res) => {
  const user = req.user;

  user.sessions = [];
  user.tokenVersion += 1;
  await user.save();

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  await createLog({
    user: user._id,
    action: "LOGOUT_ALL_DEVICES",
    req,
    metadata: { email: user.email, tokenVersion: user.tokenVersion },
  });

  res.json({ success: true, message: "Logged out from all devices" });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  res.json({
    success: true,
    data: user,
  });
});

export const getSessions = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const currentRefreshToken = req.cookies.refreshToken;

  res.json({
    success: true,
    sessions: user.sessions.map((session) => ({
      id: session._id,
      ip: session.ip,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
      isCurrent: session.refreshToken === currentRefreshToken,
    })),
  });
});

export const logoutSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  const user = req.user;

  user.sessions = user.sessions.filter((session) => {
    return String(session._id) !== String(sessionId);
  });
  await user.save();

  await createLog({
    user: user._id,
    action: "LOGOUT_SINGLE_SESSION",
    req,
    metadata: { email: user.email },
  });

  res.json({ success: true, message: "Session removed" });
});
