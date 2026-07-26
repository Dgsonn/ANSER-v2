import "dotenv/config";
import cors from "cors";
import express from "express";
import authRouter from "./routes/auth.js";
import { seedDemoUser } from "./store/users.js";

const app = express();
const port = process.env.PORT ?? 4000;

seedDemoUser();

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
