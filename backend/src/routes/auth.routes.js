import express from "express";
import {
  registerUser,
  verifyOtp,
  resendVerificationOtp,
  verifyCurrentUserOtp,
  loginWithOtp,
  verifyLoginOtp,
  forgotPassword,
  resetPassword,
  logoutUser,
  logoutAllDevices,
  logoutSession,
  loginWithPassword,
  refreshAccessToken,
  getSessions,
  getUser,
} from "../controllers/auth.controller.js";

import { protect, authorize } from "../middleware/auth.middleware.js";

import { authLimiter } from "../middleware/rateLimit.middleware.js";

const authRouter = express.Router();

// auth
authRouter.post("/register", authLimiter, registerUser);
authRouter.post("/verify-otp", authLimiter, verifyOtp);
authRouter.post("/resend-verification", authLimiter, resendVerificationOtp);
authRouter.post("/verify-current-user", protect, authLimiter, verifyCurrentUserOtp);

// login
authRouter.post("/login", authLimiter, loginWithPassword);
authRouter.post("/login-otp", authLimiter, loginWithOtp);
authRouter.post("/verify-login", authLimiter, verifyLoginOtp);

// password
authRouter.post("/forgot-password", authLimiter, forgotPassword);
authRouter.post("/reset-password", authLimiter, resetPassword);

// tokens
authRouter.post("/refresh", refreshAccessToken);

// logout
authRouter.post("/logout", protect, logoutUser);
authRouter.post("/logout-all", protect, logoutAllDevices);
authRouter.post("/logout-session", protect, logoutSession);

// sessions
authRouter.get("/sessions", protect, getSessions);

// protected example
authRouter.get("/me", protect, getUser);

// admin route
authRouter.get("/admin", protect, authorize("admin"), (req, res) => {
  res.json({ message: "Admin access granted" });
});

export default authRouter;
