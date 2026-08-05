import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { ApiError } from "./errorHandler.middleware";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new ApiError(401, "Требуется авторизация");
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.userId;
    req.userEmail = payload.email;
    next();
  } catch {
    throw new ApiError(401, "Недействительный или истёкший токен");
  }
}
