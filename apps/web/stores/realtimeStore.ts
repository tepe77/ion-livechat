import { create } from "zustand";

export type RealtimeStatus = "connected" | "connecting" | "disconnected" | "unavailable";

interface RealtimeState {
  status: RealtimeStatus;
  lastConnectedAt: string | null;
  error: string | null;
  setStatus: (status: RealtimeStatus) => void;
  setError: (error: string | null) => void;
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  status: "connecting",
  lastConnectedAt: null,
  error: null,

  setStatus: (status: RealtimeStatus) => {
    set({
      status,
      lastConnectedAt: status === "connected" ? new Date().toISOString() : undefined,
      error: status === "connected" ? null : undefined,
    });
  },

  setError: (error: string | null) => {
    set({ error, status: "unavailable" });
  },
}));
