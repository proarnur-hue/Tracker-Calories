export type ConfidenceLevel = "high" | "medium" | "low";
export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

// Компонент блюда в "сыром" виде, как его возвращает vision-модель (snake_case,
// зеркалит backend/src/validators/mealAnalysis.schema.ts)
export interface AnalyzedMealItem {
  name: string;
  estimated_weight_g: number;
  weight_confidence: ConfidenceLevel;
  cooking_method: string;
  calories_kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
}

export interface AnalyzedTotals {
  calories_kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
}

export interface AnalyzeMealResponse {
  recognized: boolean;
  overall_confidence: ConfidenceLevel;
  items: AnalyzedMealItem[];
  totals: AnalyzedTotals;
  notes: string | null;
  needs_clarification: boolean;
  clarification_reason: string | null;
  photoUrl: string;
}

// Компонент блюда в виде, который сохраняется в дневник (camelCase,
// зеркалит backend/src/validators/meals.schema.ts)
export interface MealItemDraft {
  id: string; // локальный id для React-ключей, на сервер не отправляется отдельно
  name: string;
  estimatedWeightG: number;
  weightConfidence: ConfidenceLevel | null;
  cookingMethod: string | null;
  caloriesKcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  isManuallyEdited: boolean;
}

export interface MealEntry {
  id: string;
  userId: string;
  photoUrl: string | null;
  eatenAt: string;
  createdAt: string;
  overallConfidence: ConfidenceLevel | null;
  notes: string | null;
  needsClarification: boolean;
  clarificationReason: string | null;
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  items: Array<{
    id: string;
    name: string;
    estimatedWeightG: number;
    weightConfidence: ConfidenceLevel | null;
    cookingMethod: string | null;
    caloriesKcal: number;
    proteinG: number;
    fatG: number;
    carbsG: number;
    isManuallyEdited: boolean;
  }>;
}

export interface StatsSeriesPoint {
  date: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface StatsResponse {
  range: "week" | "month";
  series: StatsSeriesPoint[];
}

export interface UserProfile {
  id: string;
  email: string;
  sex: Sex | null;
  birthDate: string | null;
  heightCm: number | null;
  weightKg: number | null;
  activityLevel: ActivityLevel | null;
  dailyCalorieGoal: number | null;
  calculatedDailyCalorieGoal: number | null;
  effectiveDailyCalorieGoal: number | null;
}
