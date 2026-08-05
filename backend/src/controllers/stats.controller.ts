import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { ApiError } from "../middleware/errorHandler.middleware";

const RANGE_DAYS: Record<string, number> = { week: 7, month: 30 };

// GET /stats?range=week|month — агрегаты калорий/БЖУ по дням для графиков
export async function getStats(req: AuthenticatedRequest, res: Response) {
  const range = (req.query.range as string) ?? "week";
  const days = RANGE_DAYS[range];
  if (!days) {
    throw new ApiError(400, "Некорректный range, ожидается 'week' или 'month'");
  }

  const userId = req.userId!;
  // Дни считаются в UTC (а не в локальном времени процесса) — иначе ключи
  // бакетов и toISOString() дат записей расходятся в зависимости от TZ
  // сервера, и часть сегодняшних записей "теряется" из статистики.
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const since = new Date(todayUtc);
  since.setUTCDate(since.getUTCDate() - (days - 1));

  const entries = await prisma.mealEntry.findMany({
    where: { userId, eatenAt: { gte: since } },
    select: { eatenAt: true, totalCalories: true, totalProtein: true, totalFat: true, totalCarbs: true },
  });

  const byDay = new Map<string, { calories: number; protein: number; fat: number; carbs: number }>();

  for (let i = 0; i < days; i++) {
    const day = new Date(since);
    day.setUTCDate(day.getUTCDate() + i);
    const key = day.toISOString().slice(0, 10);
    byDay.set(key, { calories: 0, protein: 0, fat: 0, carbs: 0 });
  }

  for (const entry of entries) {
    const key = entry.eatenAt.toISOString().slice(0, 10);
    const bucket = byDay.get(key);
    if (bucket) {
      bucket.calories += entry.totalCalories;
      bucket.protein += entry.totalProtein;
      bucket.fat += entry.totalFat;
      bucket.carbs += entry.totalCarbs;
    }
  }

  const series = Array.from(byDay.entries()).map(([date, totals]) => ({ date, ...totals }));
  res.json({ range, series });
}
