# КалорийКамера — счётчик калорий по фото еды

Веб-приложение (устанавливается как PWA на телефон): пользователь загружает фото
блюда, Groq Vision (модель `qwen/qwen3.6-27b`, JSON-режим) распознаёт компоненты
блюда и оценивает калорийность/БЖУ, backend пересчитывает итоги самостоятельно и
сохраняет запись в дневник питания пользователя.

## Стек

- **Backend:** Node.js + Express + TypeScript, Prisma (SQLite), Zod, JWT + bcrypt,
  `groq-sdk`. Выбран Node/Express, а не Python/FastAPI, чтобы иметь один язык
  (TypeScript) на фронте и бэке и переиспользовать типы/DTO. Groq выбран из-за
  по-настоящему бесплатного тарифа API (без привязки карты) и быстрого инференса —
  удобно для разработки и демо без расходов. Провайдер изолирован в одном файле
  (`backend/src/services/groq.service.ts`) за общим для всех vision-моделей контрактом
  (`backend/src/validators/mealAnalysis.schema.ts`), поэтому замена на другого
  провайдера (Claude/Gemini/др.) не требует правок вне этого файла.
- **Frontend:** React + Vite + TypeScript + Tailwind CSS, react-router-dom, zustand,
  react-i18next (RU по умолчанию), recharts.
- **БД:** PostgreSQL (в проде — бесплатный [Neon](https://neon.tech), в разработке можно
  использовать тот же Neon-проект или локальный Postgres).
- **Хранилище фото:** локальная папка `backend/uploads` за абстракцией `StorageProvider`
  (см. `backend/src/services/storage.service.ts`) — переключение на S3-совместимое
  хранилище потребует только новой реализации интерфейса. На бесплатном тарифе
  Render диск эфемерный — см. раздел "Деплой" про ограничения.

## Структура проекта

```
calorie-tracker/
├── backend/     # Express API, Prisma, интеграция с Groq
├── frontend/    # React SPA
└── docker-compose.yml
```

## Быстрый старт (локально, без Docker)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Откройте `backend/.env` и впишите:

1. Ключ Groq API — бесплатно, без карты, за 30 секунд на https://console.groq.com/keys:
   ```
   GROQ_API_KEY=gsk_...
   ```
2. Строку подключения к Postgres — бесплатно навсегда на https://neon.tech
   (создать проект → Connection string):
   ```
   DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
   ```

`JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` стоит заменить на случайные строки перед
любым публичным деплоем (сгенерировать: `openssl rand -hex 32`).

Примените миграции и запустите сервер:

```bash
npx prisma migrate dev --name init
npm run dev
```

Backend поднимется на `http://localhost:4000`.

### 2. Frontend

В новом терминале:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend поднимется на `http://localhost:5173` и проксирует `/api` и `/uploads`
на backend (см. `frontend/vite.config.ts`), так что `.env` можно не менять.

Откройте `http://localhost:5173`, зарегистрируйтесь и попробуйте загрузить фото еды.

## Установка как приложение на телефон (PWA)

Сайт — Progressive Web App: манифест и service worker уже настроены
(`frontend/vite-plugin-pwa` в `vite.config.ts`), иконки — в `frontend/public/`.
Достаточно открыть сайт в браузере телефона и "установить" его на главный экран —
дальше он откроется без адресной строки, как обычное приложение.

### Открыть dev-сервер с телефона по локальной сети

1. Телефон и компьютер должны быть в одной Wi-Fi сети.
2. `frontend/vite.config.ts` уже настроен на `host: true` — сервер слушает не только
   `localhost`, но и локальную сеть. После `npm run dev` в выводе Vite будет строка
   `Network: http://<IP-компьютера>:5173/` — её и нужно открыть на телефоне.
3. Backend должен разрешать этот адрес через CORS — впишите LAN IP в `FRONTEND_ORIGIN`
   в `backend/.env` через запятую, например:
   ```
   FRONTEND_ORIGIN=http://localhost:5173,http://192.168.1.67:5173
   ```
   (узнать свой IP: `ipconfig getifaddr en0` на macOS, `hostname -I` на Linux)
   и перезапустить backend.

### Установка на экран

- **Android (Chrome):** откройте сайт → меню (⋮) → «Установить приложение» /
  «Добавить на главный экран». Иконка появится как у обычного приложения.
- **iOS (Safari):** откройте сайт → кнопка «Поделиться» → «На экран Домой».

### Важный нюанс про HTTPS

Полноценная автоматическая подсказка "установить" в Android Chrome и регистрация
service worker требуют HTTPS (или `localhost`) — по обычному `http://<LAN-IP>` со
телефона service worker может не зарегистрироваться, хотя иконка и `manifest.json`
всё равно будут работать через "Добавить на главный экран" вручную. Для полноценного
PWA-опыта (офлайн-кэш статики) сайт в итоге стоит задеплоить на HTTPS-домен —
см. `docker-compose.yml` и раздел деплоя ниже.

## Деплой (Render + Neon)

Репозиторий содержит `render.yaml` (Blueprint) — Render разворачивает backend
(Node web service) и frontend (статический сайт) из одного репозитория.

1. **База данных:** создайте бесплатный проект на https://neon.tech, скопируйте
   Connection string (с `?sslmode=require`).
2. **Groq-ключ:** https://console.groq.com/keys (бесплатно, без карты).
3. Запушьте репозиторий на GitHub.
4. В Render Dashboard → **New** → **Blueprint** → подключите репозиторий.
   Render найдёт `render.yaml` и создаст оба сервиса. При настройке попросит
   заполнить переменные с `sync: false`:
   - `GROQ_API_KEY` — ключ Groq
   - `DATABASE_URL` — connection string из Neon
   (`JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` Render сгенерирует сам —
   `generateValue: true` в `render.yaml`.)
5. После первого деплоя backend применит миграции автоматически
   (`prisma migrate deploy` в `startCommand`).
6. Если домены Render отличаются от `calorie-tracker-backend`/`calorie-tracker-frontend`
   (заняты кем-то другим) — поправьте `FRONTEND_ORIGIN` в backend и `VITE_API_URL`
   в frontend на реальные адреса из Render Dashboard и передеплойте.

### Ограничение бесплатного тарифа Render

Free-план Render не даёт постоянный диск — файловая система эфемерна и сбрасывается
при каждом деплое/рестарте (в т.ч. после "засыпания" от неактивности). Это значит:

- **Данные дневника, БЖУ, профиль — сохраняются надёжно** (в Neon Postgres,
  не на диске Render).
- **Сами файлы фото могут пропадать** при рестарте backend — ссылка на фото в
  БД останется, но картинка по ней перестанет открываться. Для полной надёжности
  фото нужно вынести в S3-совместимое хранилище (см. "Что не реализовано" ниже) —
  это уже отдельная доработка `StorageProvider`.
- Free-инстанс "засыпает" после ~15 минут без запросов и просыпается с задержкой
  (~30-60 сек) на первый запрос после простоя — нормально для демо/личного
  использования, но не для продакшена с реальной нагрузкой.

## Запуск через Docker Compose

```bash
export GROQ_API_KEY=gsk_...
export JWT_ACCESS_SECRET=$(openssl rand -hex 32)
export JWT_REFRESH_SECRET=$(openssl rand -hex 32)
docker compose up --build
```

Backend — `http://localhost:4000`, frontend — `http://localhost:5173`.

## Тесты

```bash
cd backend
npm test
```

Покрыты: пересчёт `totals` по компонентам блюда, валидация JSON-схемы ответа vision-модели
(включая `needs_clarification` и некорректные значения), расчёт дневной нормы калорий
по формуле Миффлина-Сан Жеора, валидация email/пароля при регистрации, подпись/проверка JWT.

## Основные эндпоинты

| Метод | Путь | Описание |
|---|---|---|
| POST | `/auth/register` | Регистрация (email + пароль) |
| POST | `/auth/login` | Вход, выдача access/refresh токенов |
| POST | `/auth/refresh` | Обновление access-токена (с ротацией refresh) |
| POST | `/auth/logout` | Отзыв refresh-токена |
| POST | `/meals/analyze` | Загрузка фото → анализ Groq Vision (rate-limited) |
| POST | `/meals` | Сохранение записи в дневник |
| GET | `/meals?date=YYYY-MM-DD` | Записи дневника за день |
| PATCH/DELETE | `/meals/:id` | Редактирование/удаление записи |
| GET | `/stats?range=week\|month` | Агрегаты для графиков |
| GET/PUT | `/profile` | Профиль и дневная норма калорий |

## Безопасность

- API-ключ Groq используется только на backend, никогда не передаётся клиенту.
- Rate limit на `/meals/analyze`: по умолчанию 20 запросов/час на пользователя
  (`ANALYZE_RATE_LIMIT_MAX`, `ANALYZE_RATE_LIMIT_WINDOW_MS`) — также защищает от
  исчерпания бесплатной квоты Groq API (лимиты по запросам/токенам в минуту).
- Пароли хэшируются bcrypt (12 раундов), JWT access-токен короткоживущий (15 мин),
  refresh-токен хранится в БД в виде хэша и ротируется при каждом обновлении.
- Валидация загружаемых файлов: только JPEG/PNG/WebP, до 10MB (до клиентского сжатия).
- CORS ограничен доменом из `FRONTEND_ORIGIN`.
- Каждый вызов Groq логирует расход токенов (`[groq-usage]` в логах backend)
  для мониторинга нагрузки на квоту.

## Что не реализовано / стоит доработать

- **Реальное S3-хранилище** — есть абстракция `StorageProvider`, но реализован только
  локальный провайдер; на бесплатном тарифе Render это значит, что фото могут
  пропадать при рестарте (см. раздел "Деплой"). Для продакшена нужен `S3StorageProvider`.
- **OAuth / вход через соцсети** — сейчас только email + пароль.
- **Push-уведомления** (напоминания о приёме пищи и т.п.).
- **Few-shot калибровка** по блюдам конкретного пользователя (например, "мой обычный
  завтрак = X ккал") для повышения точности повторяющихся блюд.
- **Локальная мини-база часто встречаемых продуктов** для ручного поиска — сейчас
  ручной ввод полностью свободный (без автодополнения/поиска).
- **CI (автотесты на пуш)** — сам деплой настроен (`render.yaml`), но GitHub Actions
  с прогоном тестов перед деплоем не подключены.
- **Refresh-токены не привязаны к устройству/сессии в UI** — нет экрана "активные сессии".
- Code-splitting на фронте (сборка предупреждает про размер бандла recharts) — можно
  вынести `StatsPage` в `React.lazy`.
