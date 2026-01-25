import "dotenv/config";
import express from "express";
import cors from "cors";
import chatRouter from "./routes/chat";
import ossRouter from "./routes/oss";
import { startScheduler } from "./scheduler";
const app = express();
startScheduler()
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: false,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);
app.disable("x-powered-by");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  next();
});
app.use("/chat", chatRouter);
app.use("/oss", ossRouter)

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
