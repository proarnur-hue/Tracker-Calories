import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../services/api";
import { ActivityLevel, Sex, UserProfile } from "../types/api";

const ACTIVITY_LEVELS: ActivityLevel[] = ["sedentary", "light", "moderate", "active", "very_active"];

export function ProfilePage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProfile().then((p) => {
      setProfile(p);
      setLoading(false);
    });
  }, []);

  if (loading || !profile) {
    return <p className="text-center text-sm text-gray-500">{t("common.loading")}</p>;
  }

  function update<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setProfile((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaved(false);
  }

  async function handleSave() {
    if (!profile) return;
    const updated = await api.updateProfile({
      sex: profile.sex,
      birthDate: profile.birthDate,
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      activityLevel: profile.activityLevel,
      dailyCalorieGoal: profile.dailyCalorieGoal,
    });
    setProfile(updated);
    setSaved(true);
  }

  return (
    <div className="mx-auto max-w-md space-y-4 pb-6">
      <h1 className="text-xl font-semibold">{t("profile.title")}</h1>
      <p className="text-sm text-gray-500">{profile.email}</p>

      <div>
        <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">{t("profile.sex")}</label>
        <div className="flex gap-2">
          {(["male", "female"] as Sex[]).map((sex) => (
            <button
              key={sex}
              type="button"
              onClick={() => update("sex", sex)}
              className={`flex-1 rounded-xl border py-2 text-sm ${
                profile.sex === sex
                  ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-700/20 dark:text-brand-400"
                  : "border-gray-300 dark:border-gray-700"
              }`}
            >
              {t(`profile.${sex}`)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">{t("profile.birthDate")}</label>
        <input
          type="date"
          value={profile.birthDate ? profile.birthDate.slice(0, 10) : ""}
          onChange={(e) => update("birthDate", e.target.value ? new Date(e.target.value).toISOString() : null)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">{t("profile.height")}</label>
          <input
            type="number"
            value={profile.heightCm ?? ""}
            onChange={(e) => update("heightCm", e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">{t("profile.weight")}</label>
          <input
            type="number"
            value={profile.weightKg ?? ""}
            onChange={(e) => update("weightKg", e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">{t("profile.activityLevel")}</label>
        <select
          value={profile.activityLevel ?? ""}
          onChange={(e) => update("activityLevel", (e.target.value || null) as ActivityLevel | null)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="" disabled>
            —
          </option>
          {ACTIVITY_LEVELS.map((level) => (
            <option key={level} value={level}>
              {t(`profile.activity_${level}`)}
            </option>
          ))}
        </select>
      </div>

      {profile.calculatedDailyCalorieGoal && (
        <p className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:bg-gray-900 dark:text-gray-300">
          {t("profile.calculatedGoal")}: <strong>{Math.round(profile.calculatedDailyCalorieGoal)} {t("diary.kcal")}</strong>
        </p>
      )}

      <div>
        <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">{t("profile.manualGoal")}</label>
        <input
          type="number"
          value={profile.dailyCalorieGoal ?? ""}
          onChange={(e) => update("dailyCalorieGoal", e.target.value ? Number(e.target.value) : null)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
        />
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="w-full rounded-xl bg-brand-600 py-2.5 font-medium text-white hover:bg-brand-700"
      >
        {t("profile.save")}
      </button>

      {saved && <p className="text-center text-sm text-brand-600 dark:text-brand-400">{t("profile.saved")}</p>}
    </div>
  );
}
