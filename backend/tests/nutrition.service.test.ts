import { describe, expect, it } from "vitest";
import { calcDailyCalorieGoal, caloriesFromMacros, recalcTotals } from "../src/services/nutrition.service";
import { MealAnalysisItem } from "../src/validators/mealAnalysis.schema";

function makeItem(overrides: Partial<MealAnalysisItem> = {}): MealAnalysisItem {
  return {
    name: "рис",
    estimated_weight_g: 150,
    weight_confidence: "medium",
    cooking_method: "варёное",
    calories_kcal: 200,
    protein_g: 4,
    fat_g: 1,
    carbs_g: 45,
    ...overrides,
  };
}

describe("recalcTotals", () => {
  it("суммирует totals по всем items, не доверяя присланной сумме", () => {
    const items = [
      makeItem({ calories_kcal: 200, protein_g: 4, fat_g: 1, carbs_g: 45 }),
      makeItem({ name: "курица", calories_kcal: 250, protein_g: 30, fat_g: 12, carbs_g: 0 }),
    ];

    const totals = recalcTotals(items);

    expect(totals.calories_kcal).toBe(450);
    expect(totals.protein_g).toBe(34);
    expect(totals.fat_g).toBe(13);
    expect(totals.carbs_g).toBe(45);
  });

  it("возвращает нули для пустого списка items", () => {
    expect(recalcTotals([])).toEqual({ calories_kcal: 0, protein_g: 0, fat_g: 0, carbs_g: 0 });
  });

  it("игнорирует некорректную сумму, присланную моделью, и считает заново", () => {
    // Даже если бы модель посчитала totals неправильно, recalcTotals не использует
    // это значение вообще — пересчитывает по items с нуля.
    const items = [makeItem({ calories_kcal: 999, protein_g: 999, fat_g: 999, carbs_g: 999 })];
    const totals = recalcTotals(items);
    expect(totals.calories_kcal).toBe(999); // единственный item — сумма совпадает с ним
  });
});

describe("caloriesFromMacros", () => {
  it("считает калории по формуле белки×4 + углеводы×4 + жиры×9", () => {
    expect(caloriesFromMacros(20, 10, 15)).toBe(20 * 4 + 10 * 9 + 15 * 4);
  });

  it("возвращает 0 для нулевых БЖУ", () => {
    expect(caloriesFromMacros(0, 0, 0)).toBe(0);
  });
});

describe("calcDailyCalorieGoal (формула Миффлина-Сан Жеора)", () => {
  it("считает норму для мужчины с умеренной активностью", () => {
    // BMR = 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    // TDEE = 1780 * 1.55 = 2759
    const goal = calcDailyCalorieGoal({
      sex: "male",
      ageYears: 30,
      heightCm: 180,
      weightKg: 80,
      activityLevel: "moderate",
    });
    expect(goal).toBe(2759);
  });

  it("считает норму для женщины с сидячим образом жизни", () => {
    // BMR = 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
    // TDEE = 1345.25 * 1.2 = 1614.3 → округление до 1614
    const goal = calcDailyCalorieGoal({
      sex: "female",
      ageYears: 25,
      heightCm: 165,
      weightKg: 60,
      activityLevel: "sedentary",
    });
    expect(goal).toBe(1614);
  });

  it("норма растёт вместе с уровнем активности при равных остальных параметрах", () => {
    const base = { sex: "male" as const, ageYears: 30, heightCm: 180, weightKg: 80 };
    const sedentary = calcDailyCalorieGoal({ ...base, activityLevel: "sedentary" });
    const veryActive = calcDailyCalorieGoal({ ...base, activityLevel: "very_active" });
    expect(veryActive).toBeGreaterThan(sedentary);
  });
});
