const MAX_DIMENSION = 1568; // рекомендуемое разрешение для баланса качества/токенов у vision-моделей
const JPEG_QUALITY = 0.85;

// Сжимает фото на клиенте перед отправкой: масштабирует до MAX_DIMENSION по
// длинной стороне и перекодирует в JPEG с качеством ~85%, чтобы уложиться
// в лимиты API (до нескольких MB на изображение) и снизить расход токенов.
export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Не удалось получить 2D-контекст canvas");
  ctx.drawImage(bitmap, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Не удалось сжать изображение"))),
      "image/jpeg",
      JPEG_QUALITY
    );
  });
}
