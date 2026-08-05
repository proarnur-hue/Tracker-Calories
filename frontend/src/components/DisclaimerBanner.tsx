import { useTranslation } from "react-i18next";

export function DisclaimerBanner() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 px-4 py-3 text-center text-xs text-gray-500 dark:text-gray-400">
      {t("disclaimer.full")}
    </footer>
  );
}

export function DisclaimerModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
        <h2 className="mb-3 text-lg font-semibold">⚠️ {t("app.title")}</h2>
        <p className="mb-5 text-sm text-gray-600 dark:text-gray-300">{t("disclaimer.full")}</p>
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-brand-600 py-2.5 font-medium text-white hover:bg-brand-700"
        >
          {t("disclaimer.iUnderstand")}
        </button>
      </div>
    </div>
  );
}
