import dotenv from "dotenv";
import path from "path";

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Отсутствует обязательная переменная окружения: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),

  groqApiKey: required("GROQ_API_KEY"),
  // Llama Vision preview-модели Groq сняты с производства — рабочая vision-модель
  // на бесплатном тарифе сейчас это Qwen (input_modalities: ["text","image"]).
  // Проверить актуальный список: curl https://api.groq.com/openai/v1/models -H "Authorization: Bearer $GROQ_API_KEY"
  groqModel: process.env.GROQ_MODEL ?? "qwen/qwen3.6-27b",

  jwtAccessSecret: required("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: required("JWT_REFRESH_SECRET"),
  jwtAccessTtl: process.env.JWT_ACCESS_TTL ?? "15m",
  jwtRefreshTtl: process.env.JWT_REFRESH_TTL ?? "30d",

  // Через запятую можно перечислить несколько origin — например, при
  // тестировании с телефона по локальной сети (localhost + LAN IP разработчика).
  frontendOrigins: (process.env.FRONTEND_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),

  storageProvider: (process.env.STORAGE_PROVIDER ?? "local") as "local" | "s3",
  uploadsDir: path.resolve(process.env.UPLOADS_DIR ?? "./uploads"),

  analyzeRateLimitMax: Number(process.env.ANALYZE_RATE_LIMIT_MAX ?? 20),
  analyzeRateLimitWindowMs: Number(process.env.ANALYZE_RATE_LIMIT_WINDOW_MS ?? 3600000),
};
