import { z } from "zod";

const email = z
  .string()
  .trim()
  .email("Valid email is required")
  .transform((value) => value.toLowerCase());
const password = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(72, "Password is too long");
const otp = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "OTP must be a 6-digit code");
const twoFactorCode = z
  .string()
  .trim()
  .regex(/^\d{8}$/, "2FA code must be an 8-digit code");

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  email,
  password,
});

export const verifyOtpSchema = z.object({
  email,
  otp,
});

export const resendVerificationSchema = z.object({
  email: email.optional(),
});

export const verifyCurrentUserOtpSchema = z.object({
  otp,
});

export const loginSchema = z.object({
  email,
  password,
});

export const loginOtpSchema = z.object({
  email,
});

export const forgotPasswordSchema = z.object({
  email,
});

export const resetPasswordSchema = z.object({
  email,
  otp,
  newPassword: password,
});

export const logoutSessionSchema = z.object({
  sessionId: z.string().trim().min(1, "Session id is required"),
});

export const verifyTwoFactorSchema = z.object({
  twoFactorToken: z.string().trim().min(1, "2FA token is required"),
  code: twoFactorCode,
});

export const twoFactorCodeSchema = z.object({
  code: twoFactorCode,
});
