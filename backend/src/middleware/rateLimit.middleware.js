import rateLimit from "express-rate-limit";

// Strict limiter (OTP, login)
export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // max 5 requests
  message: {
    message: "Too many requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General limiter (normal APIs)
export const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
});
