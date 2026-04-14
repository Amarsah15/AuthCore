import { AppError } from "../utils/appError.js";

export const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

export const errorHandler = (error, req, res, next) => {
  let err = error;

  if (!(err instanceof AppError)) {
    const statusCode = err.statusCode || err.status || 500;
    err = new AppError(err.message || "Internal server error", statusCode);
  }

  if (error.code === 11000) {
    err = new AppError("Duplicate field value entered", 400);
  }

  if (error.name === "CastError") {
    err = new AppError("Invalid resource identifier", 400);
  }

  if (error.name === "JsonWebTokenError") {
    err = new AppError("Invalid token", 401);
  }

  if (error.name === "TokenExpiredError") {
    err = new AppError("Token expired", 401);
  }

  if (error.code === "EBADCSRFTOKEN") {
    err = new AppError("Invalid CSRF token", 403);
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV !== "production" && { stack: error.stack }),
  });
};
