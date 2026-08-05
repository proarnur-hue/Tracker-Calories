import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { authRouter } from "./routes/auth.routes";
import { mealsRouter } from "./routes/meals.routes";
import { statsRouter } from "./routes/stats.routes";
import { profileRouter } from "./routes/profile.routes";
import { errorHandler } from "./middleware/errorHandler.middleware";

export const app = express();

// CORS ограничен доменами фронтенда из FRONTEND_ORIGIN (один или несколько через запятую)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.frontendOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Запрещено политикой CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

// Раздача загруженных фото (dev-режим, локальное хранилище)
app.use("/uploads", express.static(env.uploadsDir));

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/auth", authRouter);
app.use("/meals", mealsRouter);
app.use("/stats", statsRouter);
app.use("/profile", profileRouter);

app.use(errorHandler);
