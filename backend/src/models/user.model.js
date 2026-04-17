import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    oauthProviders: {
      googleId: {
        type: String,
        index: true,
      },
      xId: {
        type: String,
        index: true,
      },
      xUsername: {
        type: String,
      },
    },

    avatarUrl: {
      type: String,
      trim: true,
    },

    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    twoFactorSecret: {
      type: String,
      select: false,
    },

    twoFactorTempSecret: {
      type: String,
      select: false,
    },

    sessions: [
      {
        refreshToken: String,
        ip: String,
        userAgent: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    loginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: {
      type: Date,
    },

    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
