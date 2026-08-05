import { z } from "zod";

export const updateProfileSchema = z.object({
  sex: z.enum(["male", "female"]).nullable().optional(),
  birthDate: z.string().datetime().nullable().optional(),
  heightCm: z.number().positive().nullable().optional(),
  weightKg: z.number().positive().nullable().optional(),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]).nullable().optional(),
  dailyCalorieGoal: z.number().positive().nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
