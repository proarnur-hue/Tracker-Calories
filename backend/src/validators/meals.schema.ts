import { z } from "zod";
import { confidenceSchema } from "./mealAnalysis.schema";

const mealItemInputSchema = z.object({
  name: z.string().min(1),
  estimatedWeightG: z.number().nonnegative(),
  weightConfidence: confidenceSchema.nullable().optional(),
  cookingMethod: z.string().nullable().optional(),
  caloriesKcal: z.number().nonnegative(),
  proteinG: z.number().nonnegative(),
  fatG: z.number().nonnegative(),
  carbsG: z.number().nonnegative(),
  isManuallyEdited: z.boolean().optional(),
});

// Используется при сохранении записи в дневник — после того как пользователь
// подтвердил результат анализа (возможно, отредактировав его на клиенте).
export const createMealEntrySchema = z.object({
  photoUrl: z.string().nullable().optional(),
  eatenAt: z.string().datetime().optional(),
  overallConfidence: confidenceSchema.nullable().optional(),
  notes: z.string().nullable().optional(),
  needsClarification: z.boolean().optional(),
  clarificationReason: z.string().nullable().optional(),
  items: z.array(mealItemInputSchema).min(1, "Нужен хотя бы один компонент блюда"),
});

export const updateMealEntrySchema = createMealEntrySchema.partial();

export type CreateMealEntryInput = z.infer<typeof createMealEntrySchema>;
