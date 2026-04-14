import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import csrf from "csurf";
import helmet from "helmet";
import { generalLimiter } from "./middleware/rateLimit.middleware.js";
import { openApiDocument, swaggerHtml } from "./docs/openapi.js";

const app = express();
const csrfProtection = csrf({
  cookie: true,
});
const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  process.env.FRONTEND_URL ||
  "http://localhost:5175"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(csrfProtection);
app.use(generalLimiter);
app.set("trust proxy", 1);

app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.get("/api-docs.json", (req, res) => {
  res.json(openApiDocument);
});

app.get("/api-docs", (req, res) => {
  res.type("html").send(swaggerHtml);
});

export default app;
