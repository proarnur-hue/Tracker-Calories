import multer from "multer";
import { ApiError } from "./errorHandler.middleware";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB — до сжатия на клиенте

export const uploadPhoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new ApiError(400, "Поддерживаются только форматы JPEG, PNG и WebP"));
      return;
    }
    cb(null, true);
  },
}).single("photo");
