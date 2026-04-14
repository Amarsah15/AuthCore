import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import authRouter from "./routes/auth.routes.js";

const PORT = process.env.PORT || 5000;

connectDB();

// Routes
app.use("/api/v1/auth", authRouter);

app.get("/", (req, res) => {
  res.send("Welcome to AuthCore!");
});

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`AuthCore is running on port ${PORT}`);
});
