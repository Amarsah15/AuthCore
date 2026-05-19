import bcrypt from "bcryptjs";
import OTP from "../models/otp.model.js";
import User from "../models/user.model.js";
import { otpTemplate } from "../utils/emailTemplate.js";
import { createLog } from "../utils/logger.utils.js";
import { sendEmail } from "../utils/sendEmail.js";
import { AppError } from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateHashedOtp } from "./auth.shared.js";

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

  const otp = await generateHashedOtp(email);

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
