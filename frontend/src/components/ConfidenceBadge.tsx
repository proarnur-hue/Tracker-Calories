import { useTranslation } from "react-i18next";
import { ConfidenceLevel } from "../types/api";

const COLORS: Record<ConfidenceLevel, string> = {
  high: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  low: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const LABEL_KEYS: Record<ConfidenceLevel, string> = {
  high: "result.confidenceHigh",
  medium: "result.confidenceMedium",
  low: "result.confidenceLow",
};

export function ConfidenceBadge({ level, label }: { level: ConfidenceLevel; label?: string }) {
  const { t } = useTranslation();
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${COLORS[level]}`}>
      {label ?? t(LABEL_KEYS[level])}
    </span>
  );
}
