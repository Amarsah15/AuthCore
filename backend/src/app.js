import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { openApiDocument, swaggerHtml } from "./docs/openapi.js";
import { generalLimiter } from "./middleware/rateLimit.middleware.js";

const app = express();
const allowedOrigins = ["http://localhost:5173", process.env.FRONTEND_URL];

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

app.options(/.*/, cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    next();
    return;
  }

  generalLimiter(req, res, next);
});

app.set("trust proxy", 1);

app.get("/api-docs.json", (req, res) => {
  res.json(openApiDocument);
});

app.get("/api-docs", (req, res) => {
  res.type("html").send(swaggerHtml);
});

export default app;
