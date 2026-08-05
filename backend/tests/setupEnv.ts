// Тестовое окружение — задаёт обязательные переменные до импорта config/env.ts,
// чтобы юнит-тесты не требовали настоящего .env файла с реальным API-ключом.
process.env.GROQ_API_KEY ||= "test-groq-key";
process.env.GROQ_MODEL ||= "qwen/qwen3.6-27b";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";
process.env.JWT_REFRESH_SECRET ||= "test-refresh-secret";
process.env.DATABASE_URL ||= "postgresql://test:test@localhost:5432/test";
