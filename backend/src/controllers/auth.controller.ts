import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { loginSchema, refreshSchema, registerSchema } from "../validators/auth.schema";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { ApiError } from "../middleware/errorHandler.middleware";

const REFRESH_TOKEN_DAYS = 30;
const SALT_ROUNDS = 12;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function issueTokenPair(userId: string, email: string) {
  const accessToken = signAccessToken({ userId, email });
  const refreshToken = signRefreshToken({ userId, email });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashToken(refreshToken), expiresAt },
  });

  return { accessToken, refreshToken };
}

export async function register(req: Request, res: Response) {
  const { email, password } = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(409, "Пользователь с таким email уже зарегистрирован");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({ data: { email, passwordHash } });

  const tokens = await issueTokenPair(user.id, user.email);
  res.status(201).json({ user: { id: user.id, email: user.email }, ...tokens });
}

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(401, "Неверный email или пароль");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new ApiError(401, "Неверный email или пароль");
  }

  const tokens = await issueTokenPair(user.id, user.email);
  res.json({ user: { id: user.id, email: user.email }, ...tokens });
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = refreshSchema.parse(req.body);

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, "Недействительный refresh-токен");
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findFirst({
    where: { userId: payload.userId, tokenHash, revoked: false },
  });

  if (!stored || stored.expiresAt < new Date()) {
    throw new ApiError(401, "Refresh-токен недействителен или истёк");
  }

  // Ротация: старый токен отзываем, выдаём новую пару
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
  const tokens = await issueTokenPair(payload.userId, payload.email);
  res.json(tokens);
}

export async function logout(req: Request, res: Response) {
  const { refreshToken } = refreshSchema.parse(req.body);
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash },
    data: { revoked: true },
  });
  res.status(204).send();
}
