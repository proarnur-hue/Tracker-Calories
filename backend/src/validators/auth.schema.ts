import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(8, "Пароль должен быть не короче 8 символов"),
});

export const loginSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(1, "Пароль обязателен"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
