import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { createLog } from "../utils/logger.utils.js";
import { generateTokens } from "../utils/token.utils.js";
import { AppError } from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AUTH_COOKIE_OPTIONS } from "./auth.shared.js";

const MAX_ACTIVE_SESSIONS = 10;
const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export const logoutUser = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  const user = req.user;

  user.sessions = user.sessions.filter(
    (session) => session.refreshToken !== token,
  );
  await user.save();

  res.clearCookie("accessToken", AUTH_COOKIE_OPTIONS);
  res.clearCookie("refreshToken", AUTH_COOKIE_OPTIONS);

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

  if (user.sessions.length >= MAX_ACTIVE_SESSIONS) {
    user.sessions.shift();
  }

  user.sessions.push({
    refreshToken,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
  await user.save();

  res.cookie("accessToken", accessToken, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  res.cookie("refreshToken", refreshToken, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: REFRESH_TOKEN_MAX_AGE,
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

  res.clearCookie("accessToken", AUTH_COOKIE_OPTIONS);
  res.clearCookie("refreshToken", AUTH_COOKIE_OPTIONS);

  await createLog({
    user: user._id,
    action: "LOGOUT_ALL_DEVICES",
    req,
    metadata: { email: user.email, tokenVersion: user.tokenVersion },
  });

  res.json({ success: true, message: "Logged out from all devices" });
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
