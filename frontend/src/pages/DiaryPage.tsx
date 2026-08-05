import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { api, resolveAssetUrl } from "../services/api";
import { MealEntry, UserProfile } from "../types/api";
import { ProgressBar } from "../components/ProgressBar";

function toDateInputValue(date: Date): string {
  // Локальная календарная дата, а не toISOString() (которая отдаёт дату по UTC
  // и весь вечер в часовых поясах восточнее UTC показывала бы "вчера").
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DiaryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [date, setDate] = useState(() => toDateInputValue(new Date()));
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProfile().then(setProfile).catch(() => setProfile(null));
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .listMeals(date)
      .then(setMeals)
      .finally(() => setLoading(false));
  }, [date]);

  async function handleDelete(id: string) {
    if (!confirm(t("diary.confirmDelete"))) return;
    await api.deleteMeal(id);
    setMeals((prev) => prev.filter((m) => m.id !== id));
  }

  const totalCalories = meals.reduce((sum, m) => sum + m.totalCalories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.totalProtein, 0);
  const totalFat = meals.reduce((sum, m) => sum + m.totalFat, 0);
  const totalCarbs = meals.reduce((sum, m) => sum + m.totalCarbs, 0);
  const goal = profile?.effectiveDailyCalorieGoal ?? null;

  return (
    <div className="mx-auto max-w-md space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("diary.title")}</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
      </div>

      <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-2xl font-semibold">{Math.round(totalCalories)}</span>
          <span className="text-sm text-gray-500">
            {goal ? `${t("diary.of")} ${Math.round(goal)} ${t("diary.kcal")}` : t("diary.goalNotSet")}
          </span>
        </div>
        {goal && <ProgressBar value={totalCalories} max={goal} />}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm text-gray-600 dark:text-gray-300">
          <div>
            <div className="font-medium">{Math.round(totalProtein)} {t("common.gram")}</div>
            <div className="text-xs text-gray-500">{t("result.protein")}</div>
          </div>
          <div>
            <div className="font-medium">{Math.round(totalFat)} {t("common.gram")}</div>
            <div className="text-xs text-gray-500">{t("result.fat")}</div>
          </div>
          <div>
            <div className="font-medium">{Math.round(totalCarbs)} {t("common.gram")}</div>
            <div className="text-xs text-gray-500">{t("result.carbs")}</div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate("/upload")}
        className="w-full rounded-xl bg-brand-600 py-2.5 font-medium text-white hover:bg-brand-700"
      >
        + {t("diary.addMeal")}
      </button>

      {loading ? (
        <p className="text-center text-sm text-gray-500">{t("common.loading")}</p>
      ) : meals.length === 0 ? (
        <p className="text-center text-sm text-gray-500">{t("diary.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {meals.map((meal) => (
            <li key={meal.id} className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
              <div className="flex gap-3">
                {meal.photoUrl && (
                  <img src={resolveAssetUrl(meal.photoUrl) ?? undefined} alt="" className="h-16 w-16 rounded-xl object-cover" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{Math.round(meal.totalCalories)} {t("diary.kcal")}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(meal.eatenAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {meal.items.map((i) => i.name).join(", ")}
                  </p>
                  <div className="mt-1 flex justify-between text-xs text-gray-500">
                    <span>
                      Б: {Math.round(meal.totalProtein)} · Ж: {Math.round(meal.totalFat)} · У:{" "}
                      {Math.round(meal.totalCarbs)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(meal.id)}
                      className="text-red-600 hover:underline dark:text-red-400"
                    >
                      {t("diary.delete")}
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
