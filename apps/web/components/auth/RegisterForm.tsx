"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "../../lib/api/auth";
import { useAuthStore } from "../../stores/authStore";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Card } from "../ui/Card";
import { Headphones, ShieldCheck, ArrowRight } from "lucide-react";

export function RegisterForm() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== passwordConfirmation) {
      setError("Konfirmasi kata sandi tidak cocok.");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await register({ name, email, password });
      setAuth(res.data.user, res.data.token);
      router.push("/member");
    } catch (err: any) {
      setError(err.message || "Pendaftaran gagal. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-[#023E8A] text-white shadow-md">
          <Headphones className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Daftar Akun Member</h1>
        <p className="text-xs text-slate-500">
          Buat akun untuk mendapatkan bantuan langsung dari tim teknis ION
        </p>
      </div>

      <Card className="p-6 border-slate-200 shadow-md">
        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-lg font-medium">
              {error}
            </div>
          )}

          <Input
            label="Nama Lengkap"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ahmad Pratama"
            required
          />

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            required
          />

          <Input
            label="Kata Sandi (Minimal 8 karakter)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Input
            label="Konfirmasi Kata Sandi"
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
            Daftar Sekarang
          </Button>

          <div className="pt-2 text-center text-xs text-slate-500">
            Sudah memiliki akun?{" "}
            <Link href="/login" className="text-[#023E8A] font-semibold hover:underline">
              Masuk di sini
            </Link>
          </div>
        </form>
      </Card>

      <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        <span>Data Anda terenkripsi dan terlindungi aman</span>
      </div>
    </div>
  );
}
