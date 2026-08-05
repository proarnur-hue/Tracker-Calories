import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon-32.png", "apple-touch-icon.png"],
      manifest: {
        id: "/",
        name: "КалорийКамера — счётчик калорий по фото",
        short_name: "КалорийКамера",
        description: "Счётчик калорий по фото еды",
        lang: "ru",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#ffffff",
        theme_color: "#16a34a",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Фото и API-запросы не кэшируем — только статику приложения
        // (иначе устаревшие ответы дневника переживали бы обновление данных).
        navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//],
        runtimeCaching: [
          {
            urlPattern: /^\/uploads\//,
            handler: "CacheFirst",
            options: {
              cacheName: "meal-photos",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: {
        // Даёт проверить установку PWA прямо из `npm run dev`, не только из сборки
        enabled: true,
      },
    }),
  ],
  server: {
    port: 5173,
    // Слушает не только localhost, но и локальную сеть — чтобы открыть сайт
    // с телефона по IP компьютера (телефон и компьютер должны быть в одном Wi-Fi).
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/uploads": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
