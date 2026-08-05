// Пересчёт калорий по БЖУ на клиенте — без повторного похода в API,
// используется при ручной корректировке порции/БЖУ на экране результата.
export function caloriesFromMacros(proteinG: number, fatG: number, carbsG: number): number {
  const value = proteinG * 4 + fatG * 9 + carbsG * 4;
  return Math.round(value * 10) / 10;
}

export function sumTotals(items: Array<{ caloriesKcal: number; proteinG: number; fatG: number; carbsG: number }>) {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.caloriesKcal,
      protein: acc.protein + item.proteinG,
      fat: acc.fat + item.fatG,
      carbs: acc.carbs + item.carbsG,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );
}
