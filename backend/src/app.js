import "dotenv/config";
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
const allowedOrigins = process.env.FRONTEND_URL || "http://localhost:5173";

const corsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-CSRF-Token",
    "x-csrf-token",
  ],
  credentials: true,
};

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(csrfProtection);
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    next();
    return;
  }

  generalLimiter(req, res, next);
});
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
