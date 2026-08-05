import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";
import { env } from "../config/env";

// Абстракция над хранилищем фото. LocalStorageProvider используется в разработке,
// в будущем можно добавить S3Provider с тем же интерфейсом (совместимый API,
// например AWS S3 / Cloudflare R2 / Yandex Object Storage) без изменения кода вызова.
export interface StorageProvider {
  save(buffer: Buffer, extension: string): Promise<string>; // возвращает публичный URL/путь
  resolvePath(url: string): string; // путь на диске, используется только для local provider
}

class LocalStorageProvider implements StorageProvider {
  constructor(private readonly uploadsDir: string) {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async save(buffer: Buffer, extension: string): Promise<string> {
    const filename = `${uuid()}.${extension}`;
    const filePath = path.join(this.uploadsDir, filename);
    await fs.promises.writeFile(filePath, buffer);
    return `/uploads/${filename}`;
  }

  resolvePath(url: string): string {
    const filename = path.basename(url);
    return path.join(this.uploadsDir, filename);
  }
}

function createStorageProvider(): StorageProvider {
  switch (env.storageProvider) {
    case "local":
      return new LocalStorageProvider(env.uploadsDir);
    case "s3":
      throw new Error("S3StorageProvider ещё не реализован — задел на будущее");
    default:
      throw new Error(`Неизвестный storage provider: ${env.storageProvider}`);
  }
}

export const storage = createStorageProvider();
