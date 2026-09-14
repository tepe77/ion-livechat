"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login } from "../../lib/api/auth";
import { API_BASE_URL } from "../../lib/api/client";
import { useAuthStore } from "../../stores/authStore";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Card } from "../ui/Card";
import { BrandLogo } from "../ui/BrandLogo";
import { Headphones, ShieldCheck, User, Users, Briefcase } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const { user, isInitialized, setAuth } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isInitialized && user) {
      if (user.role === "superadmin") router.push("/admin/users");
      else if (user.role === "manager") router.push("/manager/dashboard");
      else if (user.role === "agent") router.push("/agent/workspace");
      else router.push("/member");
    }
  }, [user, isInitialized, router]);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await login({ email, password });
      setAuth(res.data.user, res.data.token);

      // Route according to role
      const role = res.data.user.role;
      if (role === "superadmin") {
        router.push("/admin/users");
      } else if (role === "manager") {
        router.push("/manager/dashboard");
      } else if (role === "agent") {
        router.push("/agent/workspace");
      } else {
        router.push("/member");
      }
    } catch (err: any) {
      setError(err.message || "Gagal masuk. Periksa kembali email dan password Anda.");
    } finally {
      setIsLoading(false);
    }
  };

  const quickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password");
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="flex flex-col items-center justify-center space-y-2 text-center">
        <BrandLogo size="xl" showText={false} />
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">ION Broadband Livechat</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Platform Layanan Pelanggan & Bantuan Teknis Terpadu
          </p>
        </div>
      </div>

      <Card className="p-6 border-slate-200 shadow-md">
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-lg font-medium">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
            Masuk ke Akun
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-medium">Atau Masuk Dengan</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a
              href={`${API_BASE_URL}/auth/oauth/google`}
              className="flex items-center justify-center gap-2 h-10 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google</span>
            </a>

            <a
              href={`${API_BASE_URL}/auth/oauth/facebook`}
              className="flex items-center justify-center gap-2 h-10 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg className="h-4 w-4 fill-[#1877F2]" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Facebook</span>
            </a>
          </div>

          <div className="text-center pt-2">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Pelanggan ION dapat langsung masuk secara instan menggunakan tombol <strong>Google</strong> atau <strong>Facebook</strong> di atas.
            </p>
          </div>
        </form>
      </Card>

      {/* Demo Accounts Quick-Access Drawer */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2.5">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
          Pilihan Akun Demo (1-Click Test)
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => quickFill("member1@ion.test")}
            className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-left"
          >
            <User className="h-4 w-4 text-[#1E3785]" />
            <div className="truncate">
              <p className="font-semibold truncate">Member Budi</p>
              <p className="text-[10px] text-slate-400">Customer</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => quickFill("agent1@ion.test")}
            className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-left"
          >
            <Headphones className="h-4 w-4 text-emerald-600" />
            <div className="truncate">
              <p className="font-semibold truncate">Agent Sarah</p>
              <p className="text-[10px] text-slate-400">CS Agent (Cap: 5)</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => quickFill("manager@ion.test")}
            className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-left"
          >
            <Briefcase className="h-4 w-4 text-indigo-600" />
            <div className="truncate">
              <p className="font-semibold truncate">Manager SPV</p>
              <p className="text-[10px] text-slate-400">Supervisor</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => quickFill("admin@ion.test")}
            className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-left"
          >
            <ShieldCheck className="h-4 w-4 text-purple-600" />
            <div className="truncate">
              <p className="font-semibold truncate">Superadmin</p>
              <p className="text-[10px] text-slate-400">Administrator</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
