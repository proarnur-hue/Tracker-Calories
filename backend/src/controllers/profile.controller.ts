import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { ApiError } from "../middleware/errorHandler.middleware";
import { calcDailyCalorieGoal } from "../services/nutrition.service";
import { updateProfileSchema } from "../validators/profile.schema";

function ageFromBirthDate(birthDate: Date): number {
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function withCalculatedGoal(user: {
  sex: string | null;
  birthDate: Date | null;
  heightCm: number | null;
  weightKg: number | null;
  activityLevel: string | null;
  dailyCalorieGoal: number | null;
}) {
  let calculatedDailyCalorieGoal: number | null = null;

  if (user.sex && user.birthDate && user.heightCm && user.weightKg && user.activityLevel) {
    calculatedDailyCalorieGoal = calcDailyCalorieGoal({
      sex: user.sex as "male" | "female",
      ageYears: ageFromBirthDate(user.birthDate),
      heightCm: user.heightCm,
      weightKg: user.weightKg,
      activityLevel: user.activityLevel as
        | "sedentary"
        | "light"
        | "moderate"
        | "active"
        | "very_active",
    });
  }

  return {
    ...user,
    calculatedDailyCalorieGoal,
    // Ручной override в профиле имеет приоритет над расчётом по формуле
    effectiveDailyCalorieGoal: user.dailyCalorieGoal ?? calculatedDailyCalorieGoal,
  };
}

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) throw new ApiError(404, "Пользователь не найден");

  const { passwordHash: _passwordHash, ...safeUser } = user;
  res.json(withCalculatedGoal(safeUser));
}

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  const input = updateProfileSchema.parse(req.body);

  // Различаем "поле не передано" (undefined → не трогать) и "поле явно
  // очищено" (null → сбросить в БД). `?? undefined` схлопывал бы null в
  // undefined и не позволял пользователю очистить once-заполненное поле.
  const user = await prisma.user.update({
    where: { id: req.userId! },
    data: {
      sex: input.sex !== undefined ? input.sex : undefined,
      birthDate: input.birthDate !== undefined ? (input.birthDate ? new Date(input.birthDate) : null) : undefined,
      heightCm: input.heightCm !== undefined ? input.heightCm : undefined,
      weightKg: input.weightKg !== undefined ? input.weightKg : undefined,
      activityLevel: input.activityLevel !== undefined ? input.activityLevel : undefined,
      dailyCalorieGoal: input.dailyCalorieGoal !== undefined ? input.dailyCalorieGoal : undefined,
    },
  });

  const { passwordHash: _passwordHash, ...safeUser } = user;
  res.json(withCalculatedGoal(safeUser));
}
