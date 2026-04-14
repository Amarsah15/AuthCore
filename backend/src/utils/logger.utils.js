import Log from "../models/log.model.js";

export const createLog = async ({
  user = null,
  action,
  req,
  metadata = {},
}) => {
  try {
    await Log.create({
      user,
      action,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      metadata,
    });
  } catch (error) {
    console.error("Log error:", error.message);
  }
};
