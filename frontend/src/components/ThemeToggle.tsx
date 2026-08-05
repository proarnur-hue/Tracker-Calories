import { useTranslation } from "react-i18next";
import { useThemeStore } from "../store/themeStore";

export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={t("common.theme")}
      className="rounded-full p-2 text-lg hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      {theme === "dark" ? "🌙" : "☀️"}
    </button>
  );
}
