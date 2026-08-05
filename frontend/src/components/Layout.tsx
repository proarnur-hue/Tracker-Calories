import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ThemeToggle } from "./ThemeToggle";
import { DisclaimerBanner } from "./DisclaimerBanner";
import { useAuthStore } from "../store/authStore";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium ${
    isActive
      ? "bg-brand-100 text-brand-700 dark:bg-brand-700/30 dark:text-brand-400"
      : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
  }`;

export function Layout() {
  const { t } = useTranslation();
  const { user, clearSession } = useAuthStore();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">🍽️</span>
          <span className="font-semibold">{t("app.title")}</span>
        </div>
        <nav className="hidden sm:flex items-center gap-1">
          <NavLink to="/diary" className={navLinkClass}>
            {t("nav.diary")}
          </NavLink>
          <NavLink to="/stats" className={navLinkClass}>
            {t("nav.stats")}
          </NavLink>
          <NavLink to="/profile" className={navLinkClass}>
            {t("nav.profile")}
          </NavLink>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user && (
            <button
              type="button"
              onClick={clearSession}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {t("nav.logout")}
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-24 sm:pb-4">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 flex justify-around border-t border-gray-200 bg-white py-2 dark:border-gray-800 dark:bg-gray-950 sm:hidden">
        <NavLink to="/diary" className={navLinkClass}>
          {t("nav.diary")}
        </NavLink>
        <NavLink to="/stats" className={navLinkClass}>
          {t("nav.stats")}
        </NavLink>
        <NavLink to="/profile" className={navLinkClass}>
          {t("nav.profile")}
        </NavLink>
      </nav>

      <div className="hidden sm:block">
        <DisclaimerBanner />
      </div>
    </div>
  );
}
