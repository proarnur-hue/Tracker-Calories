import { describe, expect, it } from "vitest";
import { registerSchema, loginSchema } from "../src/validators/auth.schema";
import { signAccessToken, verifyAccessToken } from "../src/utils/jwt";

describe("auth validators", () => {
  it("отклоняет регистрацию с некорректным email", () => {
    const result = registerSchema.safeParse({ email: "not-an-email", password: "password123" });
    expect(result.success).toBe(false);
  });

  it("отклоняет регистрацию со слишком коротким паролем", () => {
    const result = registerSchema.safeParse({ email: "user@example.com", password: "123" });
    expect(result.success).toBe(false);
  });

  it("принимает корректные данные регистрации", () => {
    const result = registerSchema.safeParse({ email: "user@example.com", password: "password123" });
    expect(result.success).toBe(true);
  });

  it("логин требует непустой пароль, но без ограничения на длину", () => {
    expect(loginSchema.safeParse({ email: "user@example.com", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "user@example.com", password: "" }).success).toBe(false);
  });
});

describe("JWT access token", () => {
  it("подписывает и проверяет payload корректно", () => {
    process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "test-secret";
    const token = signAccessToken({ userId: "user-1", email: "user@example.com" });
    const payload = verifyAccessToken(token);
    expect(payload.userId).toBe("user-1");
    expect(payload.email).toBe("user@example.com");
  });
});
