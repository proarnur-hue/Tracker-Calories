import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError } from "../services/api";
import { useAuthStore } from "../store/authStore";

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.register(email, password);
      setSession(res.user, res.accessToken, res.refreshToken);
      navigate("/diary");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-center text-2xl font-semibold">{t("auth.registerTitle")}</h1>

        <div>
          <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">{t("auth.email")}</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">{t("auth.password")}</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
          />
          <p className="mt-1 text-xs text-gray-500">{t("auth.passwordHint")}</p>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand-600 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {t("auth.registerButton")}
        </button>

        <p className="text-center text-sm text-gray-600 dark:text-gray-300">
          {t("auth.haveAccount")}{" "}
          <Link to="/login" className="font-medium text-brand-600 dark:text-brand-400">
            {t("auth.switchToLogin")}
          </Link>
        </p>
      </form>
    </div>
  );
}
