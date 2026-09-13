"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "../../stores/authStore";
import { Button } from "../../components/ui/Button";
import {
  ShieldAlert,
  Users,
  FileText,
  Activity,
  LogOut,
  Loader2,
  ChevronRight,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isInitialized, logout } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "superadmin") {
      router.push("/login");
    }
  }, [user, isInitialized, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (!isInitialized || !user || user.role !== "superadmin") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#023E8A] animate-spin" />
      </div>
    );
  }

  const navItems = [
    { label: "Manajemen Pengguna & Peran", href: "/admin/users", icon: Users },
    { label: "Audit Log & Keamanan", href: "/admin/audit-logs", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Admin Top Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-700 text-white flex items-center justify-center shadow-xs">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 leading-tight">
              Portal Superadmin ION
            </div>
            <div className="text-xs text-slate-500">
              Pengaturan Akun, Hak Akses & Integritas Sistem Live Chat
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/manager/dashboard">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <Activity className="h-3.5 w-3.5 text-blue-600" />
              Portal Supervisor
            </Button>
          </Link>

          <div className="h-5 w-px bg-slate-200" />

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center">
              {user.name.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">{user.name}</div>
              <div className="text-[10px] text-purple-700 uppercase tracking-wider font-semibold">
                Superadmin
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-red-600 hover:bg-red-50 p-2"
            title="Keluar"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Admin Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 px-6">
        <nav className="flex space-x-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`py-3 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors ${
                  isActive
                    ? "border-purple-700 text-purple-700 font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Admin Content */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">{children}</main>
    </div>
  );
}
