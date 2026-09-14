"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAuthToken } from "@/lib/api/client";
import { getMe } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/authStore";
import { Loader2 } from "lucide-react";


function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setError("Token otentikasi tidak ditemukan.");
      return;
    }

    setAuthToken(token);
    getMe()
      .then((user) => {
        setAuth(user, token);
        if (user.role === "superadmin") router.push("/admin/users");
        else if (user.role === "manager") router.push("/manager/dashboard");
        else if (user.role === "agent") router.push("/agent/workspace");
        else router.push("/member");
      })
      .catch((err) => {
        setError(err.message || "Gagal memproses otentikasi.");
      });
  }, [searchParams, router, setAuth]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-red-200 text-center space-y-4">
          <p className="text-red-600 font-semibold text-sm">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 bg-[#1E3785] hover:bg-[#162B6B] text-white rounded-lg text-xs font-semibold"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Loader2 className="h-8 w-8 text-[#1E3785] animate-spin mb-4" />
      <p className="text-sm font-medium text-slate-600">Menyelesaikan proses masuk...</p>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-[#1E3785] animate-spin" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
