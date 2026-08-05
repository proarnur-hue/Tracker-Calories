import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { PhotoUploader } from "../components/PhotoUploader";
import { compressImage } from "../utils/imageCompression";
import { api, ApiError } from "../services/api";
import { useMealDraftStore } from "../store/mealDraftStore";

export function UploadPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setFromAnalysis = useMealDraftStore((s) => s.setFromAnalysis);
  const setManual = useMealDraftStore((s) => s.setManual);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setLoading(true);
    try {
      const compressed = await compressImage(file);
      const result = await api.analyzeMeal(compressed);
      setFromAnalysis(result);
      navigate("/result");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || t("upload.networkError"));
      } else {
        setError(t("upload.noCameraAccess"));
      }
    } finally {
      setLoading(false);
    }
  }

  function handleManualEntry() {
    setManual();
    navigate("/result");
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-xl font-semibold">{t("upload.title")}</h1>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 p-10 dark:border-gray-800">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          <p className="font-medium">{t("upload.analyzing")}</p>
          <p className="text-sm text-gray-500">{t("upload.analyzingHint")}</p>
        </div>
      ) : (
        <PhotoUploader onFileSelected={handleFile} />
      )}

      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleManualEntry}
        disabled={loading}
        className="w-full text-center text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
      >
        {t("upload.manualEntry")}
      </button>
    </div>
  );
}
