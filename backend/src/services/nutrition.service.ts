import { MealAnalysisItem } from "../validators/mealAnalysis.schema";

export interface Totals {
  calories_kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

// Сервер не доверяет totals, присланным vision-моделью — пересчитывает их
// суммированием items как дополнительную проверку.
export function recalcTotals(items: MealAnalysisItem[]): Totals {
  const totals = items.reduce<Totals>(
    (acc, item) => ({
      calories_kcal: acc.calories_kcal + item.calories_kcal,
      protein_g: acc.protein_g + item.protein_g,
      fat_g: acc.fat_g + item.fat_g,
      carbs_g: acc.carbs_g + item.carbs_g,
    }),
    { calories_kcal: 0, protein_g: 0, fat_g: 0, carbs_g: 0 }
  );

  return {
    calories_kcal: round1(totals.calories_kcal),
    protein_g: round1(totals.protein_g),
    fat_g: round1(totals.fat_g),
    carbs_g: round1(totals.carbs_g),
  };
}

// Калории по БЖУ: белки×4 + углеводы×4 + жиры×9 (используется и на клиенте
// при ручной корректировке, и здесь как консистентная серверная проверка).
export function caloriesFromMacros(proteinG: number, fatG: number, carbsG: number): number {
  return round1(proteinG * 4 + fatG * 9 + carbsG * 4);
}

export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export interface DailyGoalInput {
  sex: Sex;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
}

// Формула Миффлина-Сан Жеора для базового обмена (BMR), затем умножается
// на коэффициент активности, чтобы получить суточную норму калорий (TDEE).
export function calcDailyCalorieGoal(input: DailyGoalInput): number {
  const { sex, ageYears, heightCm, weightKg, activityLevel } = input;

  const bmr =
    sex === "male"
      ? 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;

  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}
