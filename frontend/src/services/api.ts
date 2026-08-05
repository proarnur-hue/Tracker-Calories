import { useAuthStore } from "../store/authStore";
import {
  AnalyzeMealResponse,
  AuthResponse,
  MealEntry,
  StatsResponse,
  UserProfile,
} from "../types/api";

const API_URL = import.meta.env.VITE_API_URL || "/api";

// Фото отдаются backend'ом как относительный путь ("/uploads/xxx.jpg"). В dev
// это работает благодаря прокси в vite.config.ts (frontend и backend на одном
// origin с точки зрения браузера). В проде frontend и backend обычно на разных
// доменах — тогда VITE_API_URL указывает на полный адрес backend, и путь нужно
// достроить явно, иначе браузер будет запрашивать фото у самого frontend-домена.
export function resolveAssetUrl(path: string | null): string | null {
  if (!path) return path;
  if (/^https?:\/\//.test(path)) return path;
  const base = API_URL === "/api" ? "" : API_URL;
  return `${base}${path}`;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setAccessToken, clearSession } = useAuthStore.getState();
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) {
          clearSession();
          return null;
        }
        const data = await res.json();
        setAccessToken(data.accessToken);
        return data.accessToken as string;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  isFormData?: boolean;
  skipAuth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}, isRetry = false): Promise<T> {
  const { accessToken } = useAuthStore.getState();
  const headers: Record<string, string> = {};

  if (!options.isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (accessToken && !options.skipAuth) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.isFormData ? (options.body as FormData) : options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401 && !options.skipAuth && !isRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request<T>(path, options, true);
    }
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, errBody.message ?? "Ошибка запроса к серверу");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  register: (email: string, password: string) =>
    request<AuthResponse>("/auth/register", { method: "POST", body: { email, password }, skipAuth: true }),

  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: { email, password }, skipAuth: true }),

  logout: (refreshToken: string) =>
    request<void>("/auth/logout", { method: "POST", body: { refreshToken } }),

  analyzeMeal: (photo: Blob) => {
    const formData = new FormData();
    formData.append("photo", photo, "meal.jpg");
    return request<AnalyzeMealResponse>("/meals/analyze", {
      method: "POST",
      body: formData,
      isFormData: true,
    });
  },

  createMeal: (payload: unknown) => request<MealEntry>("/meals", { method: "POST", body: payload }),

  listMeals: (date?: string) => request<MealEntry[]>(`/meals${date ? `?date=${date}` : ""}`),

  updateMeal: (id: string, payload: unknown) =>
    request<MealEntry>(`/meals/${id}`, { method: "PATCH", body: payload }),

  deleteMeal: (id: string) => request<void>(`/meals/${id}`, { method: "DELETE" }),

  getStats: (range: "week" | "month") => request<StatsResponse>(`/stats?range=${range}`),

  getProfile: () => request<UserProfile>("/profile"),

  updateProfile: (payload: Partial<UserProfile>) =>
    request<UserProfile>("/profile", { method: "PUT", body: payload }),
};
