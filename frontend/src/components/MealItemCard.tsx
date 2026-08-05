import { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { MealItemDraft } from "../types/api";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { caloriesFromMacros } from "../utils/calorieMath";

interface MealItemCardProps {
  item: MealItemDraft;
  onChange: (patch: Partial<MealItemDraft>) => void;
  onRemove: () => void;
}

function numberInputProps(value: number, onValue: (v: number) => void) {
  return {
    type: "number" as const,
    value,
    min: 0,
    onChange: (e: ChangeEvent<HTMLInputElement>) => onValue(Number(e.target.value) || 0),
    className:
      "w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900",
  };
}

export function MealItemCard({ item, onChange, onRemove }: MealItemCardProps) {
  const { t } = useTranslation();

  // При ручной правке БЖУ калории пересчитываются на клиенте по формуле
  // белки×4 + углеводы×4 + жиры×9 — без повторного похода в API.
  function handleMacroChange(patch: Partial<Pick<MealItemDraft, "proteinG" | "fatG" | "carbsG">>) {
    const next = { ...item, ...patch };
    onChange({
      ...patch,
      caloriesKcal: caloriesFromMacros(next.proteinG, next.fatG, next.carbsG),
      isManuallyEdited: true,
    });
  }

  return (
    <div className="space-y-3 rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
      <div className="flex items-start justify-between gap-2">
        <input
          value={item.name}
          onChange={(e) => onChange({ name: e.target.value, isManuallyEdited: true })}
          placeholder={t("result.title")}
          className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 font-medium dark:border-gray-700 dark:bg-gray-900"
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label={t("result.removeItem")}
          className="rounded-lg px-2 py-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {item.weightConfidence && (
          <span className="text-xs text-gray-500">
            {t("result.weightConfidence")}: <ConfidenceBadge level={item.weightConfidence} />
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-gray-500">
            {t("result.weight")} ({t("common.gram")})
          </label>
          <input {...numberInputProps(item.estimatedWeightG, (v) => onChange({ estimatedWeightG: v, isManuallyEdited: true }))} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">{t("result.cookingMethod")}</label>
          <input
            value={item.cookingMethod ?? ""}
            onChange={(e) => onChange({ cookingMethod: e.target.value, isManuallyEdited: true })}
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="mb-1 block text-xs text-gray-500">{t("result.calories")}</label>
          <input value={Math.round(item.caloriesKcal)} disabled className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm dark:border-gray-800 dark:bg-gray-800" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">{t("result.protein")}</label>
          <input {...numberInputProps(item.proteinG, (v) => handleMacroChange({ proteinG: v }))} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">{t("result.fat")}</label>
          <input {...numberInputProps(item.fatG, (v) => handleMacroChange({ fatG: v }))} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">{t("result.carbs")}</label>
          <input {...numberInputProps(item.carbsG, (v) => handleMacroChange({ carbsG: v }))} />
        </div>
      </div>
    </div>
  );
}
