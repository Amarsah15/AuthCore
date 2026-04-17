import { AppError } from "../utils/appError.js";

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const message = result.error.issues[0]?.message || "Invalid request body";
    next(new AppError(message, 400));
    return;
  }

  req.body = result.data;
  next();
};
