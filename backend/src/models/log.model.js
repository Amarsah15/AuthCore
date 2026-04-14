import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    action: {
      type: String,
      required: true,
    },

    ip: {
      type: String,
    },

    userAgent: {
      type: String,
    },

    metadata: {
      type: Object, // optional extra info
    },
  },
  { timestamps: true },
);

export default mongoose.model("Log", logSchema);
