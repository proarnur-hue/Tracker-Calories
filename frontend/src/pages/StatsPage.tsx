import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../services/api";
import { StatsSeriesPoint } from "../types/api";

type Range = "week" | "month";

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" });
}

export function StatsPage() {
  const { t } = useTranslation();
  const [range, setRange] = useState<Range>("week");
  const [series, setSeries] = useState<StatsSeriesPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getStats(range)
      .then((res) => setSeries(res.series))
      .finally(() => setLoading(false));
  }, [range]);

  const chartData = series.map((point) => ({ ...point, label: formatDateLabel(point.date) }));
  const hasData = series.some((p) => p.calories > 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("stats.title")}</h1>
        <div className="flex overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
          {(["week", "month"] as Range[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-sm ${
                range === r
                  ? "bg-brand-600 text-white"
                  : "bg-white text-gray-600 dark:bg-gray-900 dark:text-gray-300"
              }`}
            >
              {t(`stats.${r}`)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-center text-sm text-gray-500">{t("common.loading")}</p>
      ) : !hasData ? (
        <p className="text-center text-sm text-gray-500">{t("stats.noData")}</p>
      ) : (
        <>
          <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
            <h2 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">{t("stats.calories")}</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="calories" stroke="#16a34a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
            <h2 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
              {t("result.protein")} / {t("result.fat")} / {t("result.carbs")}
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="protein" name={t("stats.protein")} fill="#16a34a" />
                <Bar dataKey="fat" name={t("stats.fat")} fill="#f59e0b" />
                <Bar dataKey="carbs" name={t("stats.carbs")} fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
