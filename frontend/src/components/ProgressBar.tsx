export function ProgressBar({ value, max }: { value: number; max: number }) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const overGoal = max > 0 && value > max;

  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
      <div
        className={`h-full rounded-full transition-all ${overGoal ? "bg-red-500" : "bg-brand-500"}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
