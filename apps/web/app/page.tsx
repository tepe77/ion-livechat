"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../stores/authStore";
import { Button } from "../components/ui/Button";
import {
  Headphones,
  ShieldCheck,
  Zap,
  Clock,
  ArrowRight,
  User,
  Users,
  Activity,
  Layers,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();

  useEffect(() => {
    if (isInitialized && user) {
      if (user.role === "superadmin") router.push("/admin/users");
      else if (user.role === "manager") router.push("/manager/dashboard");
      else if (user.role === "agent") router.push("/agent/workspace");
      else router.push("/member");
    }
  }, [user, isInitialized, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#023E8A] text-white flex items-center justify-center shadow-sm">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">ION Live Chat</span>
              <span className="text-xs text-slate-400 block -mt-1">ISP Customer Support System</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Masuk
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm">
                Daftar Member
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-[#023E8A] mb-6">
          <Zap className="h-3.5 w-3.5 text-[#023E8A]" />
          Platform Dukungan Teknis Realtime Generasi Baru
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Layanan Pelanggan ISP Cepat,{" "}
          <span className="text-[#023E8A]">Cerdas & Tanpa Hambatan</span>
        </h1>

        <p className="mt-5 text-lg sm:text-xl text-slate-600 max-w-2xl leading-relaxed">
          Hubungkan pelanggan langsung dengan teknisi dan representatif ION melalui sistem live chat real-time berkapasitas tinggi dengan perutean pintar FIFO.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full sm:w-auto gap-2">
              Buka Live Chat
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              Akses Portal Petugas & SPV
            </Button>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-10 w-10 rounded-xl bg-blue-100 text-[#023E8A] flex items-center justify-center mb-4">
              <Zap className="h-5 w-5" />
            </div>
            <h2 className="font-bold text-slate-900 text-base mb-1">Smart Routing Otomatis</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pelanggan tidak perlu memilih agent secara manual. Percakapan langsung diarahkan ke agen dengan beban paling optimal atau antrean FIFO yang adil.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <Clock className="h-5 w-5" />
            </div>
            <h2 className="font-bold text-slate-900 text-base mb-1">Realtime WebSocket Reverb</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pesan terkirim instan dengan status centang ganda, indikator pengetikan, lampiran file aman, dan pembaruan antrean langsung.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
              <Activity className="h-5 w-5" />
            </div>
            <h2 className="font-bold text-slate-900 text-base mb-1">Monitoring & Metrik SPV</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dashboard supervisor dengan pemantauan kapasitas agen, First Response Time (FRT), kepuasan CSAT, dan audit log komprehensif.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} ION ISP Live Chat Platform. Hak Cipta Dilindungi.</p>
      </footer>
    </div>
  );
}
