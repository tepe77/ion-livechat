import { create } from "zustand";
import type { User } from "@ion/types";
import { getAuthToken, removeAuthToken, setAuthToken } from "../lib/api/client";
import { getMe, logout as apiLogout } from "../lib/api/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  initAuth: () => Promise<void>;
  setAuth: (user: User, token: string) => void;
  updateUser: (user: User) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isInitialized: false,

  initAuth: async () => {
    const token = getAuthToken();
    if (!token) {
      set({ user: null, token: null, isLoading: false, isInitialized: true });
      return;
    }

    try {
      const user = await getMe();
      set({ user, token, isLoading: false, isInitialized: true });
    } catch {
      removeAuthToken();
      set({ user: null, token: null, isLoading: false, isInitialized: true });
    }
  },

  setAuth: (user: User, token: string) => {
    setAuthToken(token);
    set({ user, token, isLoading: false, isInitialized: true });
  },

  updateUser: (user: User) => {
    set({ user });
  },

  logout: async () => {
    try {
      await apiLogout();
    } catch {
      removeAuthToken();
    } finally {
      set({ user: null, token: null, isLoading: false, isInitialized: true });
    }
  },
}));
