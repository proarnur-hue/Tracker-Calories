import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthUser } from "../types/api";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken }),
      setAccessToken: (accessToken) => set({ accessToken }),
      clearSession: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: "calorie-tracker-auth" }
  )
);
