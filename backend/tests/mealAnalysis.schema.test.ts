import { describe, expect, it } from "vitest";
import { mealAnalysisSchema } from "../src/validators/mealAnalysis.schema";

function validPayload() {
  return {
    recognized: true,
    overall_confidence: "high",
    items: [
      {
        name: "куриная грудка",
        estimated_weight_g: 150,
        weight_confidence: "medium",
        cooking_method: "жареное",
        calories_kcal: 250,
        protein_g: 30,
        fat_g: 12,
        carbs_g: 0,
      },
    ],
    totals: { calories_kcal: 250, protein_g: 30, fat_g: 12, carbs_g: 0 },
    notes: null,
    needs_clarification: false,
    clarification_reason: null,
  };
}

describe("mealAnalysisSchema", () => {
  it("принимает корректный ответ модели", () => {
    const result = mealAnalysisSchema.safeParse(validPayload());
    expect(result.success).toBe(true);
  });

  it("принимает ответ needs_clarification с пустыми items", () => {
    const payload = {
      recognized: false,
      overall_confidence: "low",
      items: [],
      totals: { calories_kcal: 0, protein_g: 0, fat_g: 0, carbs_g: 0 },
      notes: null,
      needs_clarification: true,
      clarification_reason: "На фото не видно еды",
    };
    expect(mealAnalysisSchema.safeParse(payload).success).toBe(true);
  });

  it("отклоняет ответ с некорректным confidence", () => {
    const payload = validPayload();
    payload.overall_confidence = "very_high" as any;
    expect(mealAnalysisSchema.safeParse(payload).success).toBe(false);
  });

  it("отклоняет ответ с отрицательной калорийностью", () => {
    const payload = validPayload();
    payload.items[0].calories_kcal = -10;
    expect(mealAnalysisSchema.safeParse(payload).success).toBe(false);
  });

  it("отклоняет ответ без обязательного поля items", () => {
    const payload = validPayload() as any;
    delete payload.items;
    expect(mealAnalysisSchema.safeParse(payload).success).toBe(false);
  });

  it("отклоняет ответ, где item без cooking_method", () => {
    const payload = validPayload() as any;
    delete payload.items[0].cooking_method;
    expect(mealAnalysisSchema.safeParse(payload).success).toBe(false);
  });
});
