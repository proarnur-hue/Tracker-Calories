import { z } from "zod";

export const confidenceSchema = z.enum(["high", "medium", "low"]);

export const mealItemSchema = z.object({
  name: z.string().min(1),
  estimated_weight_g: z.number().nonnegative(),
  weight_confidence: confidenceSchema,
  cooking_method: z.string().min(1),
  calories_kcal: z.number().nonnegative(),
  protein_g: z.number().nonnegative(),
  fat_g: z.number().nonnegative(),
  carbs_g: z.number().nonnegative(),
});

export const totalsSchema = z.object({
  calories_kcal: z.number().nonnegative(),
  protein_g: z.number().nonnegative(),
  fat_g: z.number().nonnegative(),
  carbs_g: z.number().nonnegative(),
});

// Схема ответа vision-модели — используется и как zod-валидатор, и как
// источник JSON Schema для structured output (см. gemini.service.ts).
// Не привязана к конкретному провайдеру (Gemini/др.) — это контракт
// между backend и любой vision-моделью, которая распознаёт еду на фото.
export const mealAnalysisSchema = z.object({
  recognized: z.boolean(),
  overall_confidence: confidenceSchema,
  items: z.array(mealItemSchema),
  totals: totalsSchema,
  notes: z.string().nullable(),
  needs_clarification: z.boolean(),
  clarification_reason: z.string().nullable(),
});

export type MealAnalysisResult = z.infer<typeof mealAnalysisSchema>;
export type MealAnalysisItem = z.infer<typeof mealItemSchema>;
