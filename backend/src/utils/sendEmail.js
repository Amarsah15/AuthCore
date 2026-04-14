import "dotenv/config";
import nodemailer from "nodemailer";

const requiredEmailEnv = ["EMAIL_HOST", "EMAIL_USER", "EMAIL_PASS", "EMAIL_FROM"];

const createTransporter = () => {
  const missing = requiredEmailEnv.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing email configuration: ${missing.join(", ")}`);
  }

  const port = Number(process.env.EMAIL_PORT || 587);
  const secure =
    process.env.EMAIL_SECURE === "true" ||
    (process.env.EMAIL_SECURE !== "false" && port === 465);

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendEmail = async (to, subject, html) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
};
