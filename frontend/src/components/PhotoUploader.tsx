import { DragEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

interface PhotoUploaderProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export function PhotoUploader({ onFileSelected, disabled }: PhotoUploaderProps) {
  const { t } = useTranslation();
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  function validateAndEmit(file: File | undefined) {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setLocalError(t("upload.unsupportedFormat"));
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setLocalError(t("upload.fileTooLarge"));
      return;
    }
    setLocalError(null);
    onFileSelected(file);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    validateAndEmit(e.dataTransfer.files?.[0]);
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && galleryInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
          dragActive
            ? "border-brand-500 bg-brand-50 dark:bg-brand-700/10"
            : "border-gray-300 dark:border-gray-700"
        } ${disabled ? "pointer-events-none opacity-60" : ""}`}
      >
        <span className="text-4xl">📷</span>
        <p className="text-sm text-gray-600 dark:text-gray-300">{t("upload.dropzone")}</p>
      </div>

      {localError && <p className="text-sm text-red-600 dark:text-red-400">{localError}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => cameraInputRef.current?.click()}
          className="flex-1 rounded-xl bg-brand-600 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {t("upload.takePhoto")}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => galleryInputRef.current?.click()}
          className="flex-1 rounded-xl border border-gray-300 py-2.5 font-medium hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          {t("upload.chooseFile")}
        </button>
      </div>

      {/* Отдельный input с capture="environment" открывает камеру напрямую на мобильных браузерах */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={(e) => validateAndEmit(e.target.files?.[0])}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => validateAndEmit(e.target.files?.[0])}
      />
    </div>
  );
}
