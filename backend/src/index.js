import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import adminRouter from "./routes/admin.routes.js";
import loginRouter from "./routes/login.routes.js";
import oauthRouter from "./routes/oauth.routes.js";
import passwordRouter from "./routes/password.routes.js";
import registrationRouter from "./routes/registration.routes.js";
import sessionRouter from "./routes/session.routes.js";
import userRouter from "./routes/user.routes.js";

const PORT = process.env.PORT || 5000;

connectDB();

app.use("/api/v1/auth", registrationRouter);
app.use("/api/v1/auth", loginRouter);
app.use("/api/v1/auth", passwordRouter);
app.use("/api/v1/auth", sessionRouter);
app.use("/api/v1/auth", oauthRouter);
app.use("/api/v1/auth", userRouter);
app.use("/api/v1/auth", adminRouter);

app.get("/", (req, res) => {
  res.send("Welcome to AuthCore!");
});

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`AuthCore is running on port ${PORT}`);
});
