import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useMealDraftStore } from "../store/mealDraftStore";
import { MealItemCard } from "../components/MealItemCard";
import { ConfidenceBadge } from "../components/ConfidenceBadge";
import { api, ApiError, resolveAssetUrl } from "../services/api";
import { sumTotals } from "../utils/calorieMath";

export function ResultPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const draft = useMealDraftStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (draft.needsClarification) {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <span className="text-5xl">🤔</span>
        <h1 className="text-xl font-semibold">{t("result.needsClarificationTitle")}</h1>
        {draft.clarificationReason && (
          <p className="text-gray-600 dark:text-gray-300">{draft.clarificationReason}</p>
        )}
        <p className="text-sm text-gray-500">{t("result.needsClarificationHint")}</p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => navigate("/upload")}
            className="w-full rounded-xl bg-brand-600 py-2.5 font-medium text-white hover:bg-brand-700"
          >
            {t("result.retake")}
          </button>
          <button
            type="button"
            onClick={() => draft.setManual()}
            className="w-full rounded-xl border border-gray-300 py-2.5 font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            {t("upload.manualEntry")}
          </button>
        </div>
      </div>
    );
  }

  const totals = sumTotals(draft.items);

  async function handleSave() {
    setError(null);
    if (draft.items.length === 0) return;
    setSaving(true);
    try {
      await api.createMeal({
        photoUrl: draft.photoUrl,
        overallConfidence: draft.overallConfidence,
        notes: draft.notes,
        needsClarification: false,
        items: draft.items.map((item) => ({
          name: item.name,
          estimatedWeightG: item.estimatedWeightG,
          weightConfidence: item.weightConfidence,
          cookingMethod: item.cookingMethod,
          caloriesKcal: item.caloriesKcal,
          proteinG: item.proteinG,
          fatG: item.fatG,
          carbsG: item.carbsG,
          isManuallyEdited: item.isManuallyEdited,
        })),
      });
      draft.reset();
      navigate("/diary");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4 pb-6">
      <h1 className="text-xl font-semibold">{t("result.title")}</h1>

      {draft.photoUrl && (
        <img src={resolveAssetUrl(draft.photoUrl) ?? undefined} alt="" className="h-56 w-full rounded-2xl object-cover" />
      )}

      <div className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
        <span>{t("result.approxBadge")}</span>
        {draft.overallConfidence && (
          <span className="flex items-center gap-1">
            {t("result.confidence")}: <ConfidenceBadge level={draft.overallConfidence} />
          </span>
        )}
      </div>

      {draft.notes && (
        <p className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:bg-gray-900 dark:text-gray-300">
          <strong>{t("result.notes")}:</strong> {draft.notes}
        </p>
      )}

      <div className="space-y-3">
        {draft.items.map((item) => (
          <MealItemCard
            key={item.id}
            item={item}
            onChange={(patch) => draft.updateItem(item.id, patch)}
            onRemove={() => draft.removeItem(item.id)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => draft.addItem()}
        className="w-full rounded-xl border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        + {t("result.addItem")}
      </button>

      <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
        <h2 className="mb-2 font-medium">{t("result.totalFor")}</h2>
        <div className="grid grid-cols-4 gap-2 text-center text-sm">
          <div>
            <div className="text-lg font-semibold">{Math.round(totals.calories)}</div>
            <div className="text-xs text-gray-500">{t("result.calories")}</div>
          </div>
          <div>
            <div className="text-lg font-semibold">{Math.round(totals.protein)}</div>
            <div className="text-xs text-gray-500">{t("result.protein")}</div>
          </div>
          <div>
            <div className="text-lg font-semibold">{Math.round(totals.fat)}</div>
            <div className="text-xs text-gray-500">{t("result.fat")}</div>
          </div>
          <div>
            <div className="text-lg font-semibold">{Math.round(totals.carbs)}</div>
            <div className="text-xs text-gray-500">{t("result.carbs")}</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || draft.items.length === 0}
        className="w-full rounded-xl bg-brand-600 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {t("result.save")}
      </button>
    </div>
  );
}
