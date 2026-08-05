import rateLimit from "express-rate-limit";
import { env } from "../config/env";
import { AuthenticatedRequest } from "./auth.middleware";

// Ограничение на анализ фото: не более N запросов в час НА ПОЛЬЗОВАТЕЛЯ
// (а не на IP) — защита от исчерпания бесплатной квоты Groq API.
// requireAuth должен выполняться раньше в цепочке middleware, чтобы req.userId был доступен.
export const analyzeRateLimiter = rateLimit({
  windowMs: env.analyzeRateLimitWindowMs,
  max: env.analyzeRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: AuthenticatedRequest) => req.userId ?? req.ip ?? "anonymous",
  message: {
    error: "rate_limit_exceeded",
    message: "Превышен лимит запросов на анализ фото. Попробуйте позже.",
  },
});
