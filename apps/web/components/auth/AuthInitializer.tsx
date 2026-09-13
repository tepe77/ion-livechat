"use client";

import { useEffect } from "react";
import { useAuthStore } from "../../stores/authStore";

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return <>{children}</>;
}
