import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "validation_error",
      message: "Некорректные входные данные",
      details: err.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: "api_error", message: err.message });
  }

  console.error(err);
  return res.status(500).json({ error: "internal_error", message: "Внутренняя ошибка сервера" });
}
