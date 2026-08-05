import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { ApiError } from "../middleware/errorHandler.middleware";
import { analyzeFoodImage } from "../services/groq.service";
import { recalcTotals } from "../services/nutrition.service";
import { storage } from "../services/storage.service";
import { createMealEntrySchema, updateMealEntrySchema } from "../validators/meals.schema";

const SUPPORTED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// POST /meals/analyze — принимает фото, вызывает Groq Vision, пересчитывает
// totals на сервере и возвращает результат клиенту БЕЗ сохранения в БД.
// Сохранение происходит отдельным вызовом POST /meals после того, как
// пользователь просмотрел/отредактировал результат.
export async function analyzeMeal(req: AuthenticatedRequest, res: Response) {
  if (!req.file) {
    throw new ApiError(400, "Файл фотографии не передан");
  }
  if (!SUPPORTED_MEDIA_TYPES.has(req.file.mimetype)) {
    throw new ApiError(400, "Поддерживаются только форматы JPEG, PNG и WebP");
  }

  const userId = req.userId!;
  const base64Image = req.file.buffer.toString("base64");
  const mediaType = req.file.mimetype as "image/jpeg" | "image/png" | "image/webp";

  const analysis = await analyzeFoodImage({ base64Image, mediaType, userId });

  const totals = analysis.needs_clarification ? analysis.totals : recalcTotals(analysis.items);

  const extension = mediaType.split("/")[1];
  const photoUrl = await storage.save(req.file.buffer, extension);

  res.json({ ...analysis, totals, photoUrl });
}

// POST /meals — сохранение записи в дневник (после подтверждения/правки пользователем)
export async function createMeal(req: AuthenticatedRequest, res: Response) {
  const input = createMealEntrySchema.parse(req.body);
  const userId = req.userId!;

  const totals = input.items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.caloriesKcal,
      protein: acc.protein + item.proteinG,
      fat: acc.fat + item.fatG,
      carbs: acc.carbs + item.carbsG,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );

  const entry = await prisma.mealEntry.create({
    data: {
      userId,
      photoUrl: input.photoUrl ?? null,
      eatenAt: input.eatenAt ? new Date(input.eatenAt) : new Date(),
      overallConfidence: input.overallConfidence ?? null,
      notes: input.notes ?? null,
      needsClarification: input.needsClarification ?? false,
      clarificationReason: input.clarificationReason ?? null,
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalFat: totals.fat,
      totalCarbs: totals.carbs,
      items: {
        create: input.items.map((item) => ({
          name: item.name,
          estimatedWeightG: item.estimatedWeightG,
          weightConfidence: item.weightConfidence ?? null,
          cookingMethod: item.cookingMethod ?? null,
          caloriesKcal: item.caloriesKcal,
          proteinG: item.proteinG,
          fatG: item.fatG,
          carbsG: item.carbsG,
          isManuallyEdited: item.isManuallyEdited ?? false,
        })),
      },
    },
    include: { items: true },
  });

  res.status(201).json(entry);
}

// GET /meals?date=YYYY-MM-DD — записи дневника за конкретный день
export async function listMeals(req: AuthenticatedRequest, res: Response) {
  const userId = req.userId!;
  const dateParam = req.query.date as string | undefined;

  let dateFilter: { gte: Date; lt: Date } | undefined;
  if (dateParam) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateParam);
    if (!match) {
      throw new ApiError(400, "Некорректный формат даты, ожидается YYYY-MM-DD");
    }
    // Границы дня строятся в UTC по буквальным цифрам параметра — не зависят
    // от локального часового пояса процесса backend'а (иначе один и тот же
    // запрос давал бы разные результаты в зависимости от TZ сервера).
    const [, year, month, day] = match;
    const start = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    if (Number.isNaN(start.getTime())) {
      throw new ApiError(400, "Некорректный формат даты, ожидается YYYY-MM-DD");
    }
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    dateFilter = { gte: start, lt: end };
  }

  const entries = await prisma.mealEntry.findMany({
    where: { userId, ...(dateFilter ? { eatenAt: dateFilter } : {}) },
    include: { items: true },
    orderBy: { eatenAt: "desc" },
  });

  res.json(entries);
}

export async function getMeal(req: AuthenticatedRequest, res: Response) {
  const entry = await prisma.mealEntry.findFirst({
    where: { id: req.params.id, userId: req.userId! },
    include: { items: true },
  });
  if (!entry) throw new ApiError(404, "Запись не найдена");
  res.json(entry);
}

export async function updateMeal(req: AuthenticatedRequest, res: Response) {
  const input = updateMealEntrySchema.parse(req.body);
  const userId = req.userId!;

  const existing = await prisma.mealEntry.findFirst({ where: { id: req.params.id, userId } });
  if (!existing) throw new ApiError(404, "Запись не найдена");

  if (input.items) {
    const totals = input.items.reduce(
      (acc, item) => ({
        calories: acc.calories + item.caloriesKcal,
        protein: acc.protein + item.proteinG,
        fat: acc.fat + item.fatG,
        carbs: acc.carbs + item.carbsG,
      }),
      { calories: 0, protein: 0, fat: 0, carbs: 0 }
    );

    await prisma.mealItem.deleteMany({ where: { mealEntryId: existing.id } });

    await prisma.mealEntry.update({
      where: { id: existing.id },
      data: {
        notes: input.notes,
        totalCalories: totals.calories,
        totalProtein: totals.protein,
        totalFat: totals.fat,
        totalCarbs: totals.carbs,
        items: {
          create: input.items.map((item) => ({
            name: item.name,
            estimatedWeightG: item.estimatedWeightG,
            weightConfidence: item.weightConfidence ?? null,
            cookingMethod: item.cookingMethod ?? null,
            caloriesKcal: item.caloriesKcal,
            proteinG: item.proteinG,
            fatG: item.fatG,
            carbsG: item.carbsG,
            isManuallyEdited: true,
          })),
        },
      },
    });
  } else if (input.notes !== undefined) {
    await prisma.mealEntry.update({ where: { id: existing.id }, data: { notes: input.notes } });
  }

  const updated = await prisma.mealEntry.findUnique({
    where: { id: existing.id },
    include: { items: true },
  });
  res.json(updated);
}

export async function deleteMeal(req: AuthenticatedRequest, res: Response) {
  const userId = req.userId!;
  const existing = await prisma.mealEntry.findFirst({ where: { id: req.params.id, userId } });
  if (!existing) throw new ApiError(404, "Запись не найдена");

  await prisma.mealEntry.delete({ where: { id: existing.id } });
  res.status(204).send();
}
