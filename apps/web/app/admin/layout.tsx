"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "../../stores/authStore";
import { Button } from "../../components/ui/Button";
import { BrandLogo } from "../../components/ui/BrandLogo";
import {
  ShieldAlert,
  Users,
  FileText,
  Activity,
  LogOut,
  Loader2,
  ChevronRight,
  Settings,
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
        <Loader2 className="h-8 w-8 text-[#1E3785] animate-spin" />
      </div>
    );
  }

  const navItems = [
    {
      label: "Manajemen Pengguna & Peran",
      shortLabel: "Pengguna & Peran",
      href: "/admin/users",
      icon: Users,
    },
    {
      label: "Audit Log & Keamanan",
      shortLabel: "Audit Log",
      href: "/admin/audit-logs",
      icon: FileText,
    },
    {
      label: "Pengaturan Kontak & Sistem",
      shortLabel: "Pengaturan Sistem",
      href: "/admin/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Admin Top Header */}
      <header className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between sticky top-0 z-40 gap-2">
        <BrandLogo
          size="sm"
          subtitle={
            <>
              <span className="hidden sm:inline">Portal Superadmin & Manajemen Sistem</span>
              <span className="sm:hidden">Superadmin</span>
            </>
          }
          className="min-w-0 shrink"
          textClassName="min-w-0 max-w-[140px] xs:max-w-[200px] sm:max-w-none"
        />

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Link href="/manager/dashboard">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 px-2 sm:px-3 h-8 whitespace-nowrap">
              <Activity className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span className="hidden sm:inline">Portal Supervisor</span>
              <span className="sm:hidden text-[11px] font-medium">SPV</span>
            </Button>
          </Link>

          <div className="h-4 sm:h-5 w-px bg-slate-200" />

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">{user.name}</div>
              <div className="text-[10px] text-purple-700 uppercase tracking-wider font-semibold">
                Superadmin
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-red-600 hover:bg-red-50 h-8 w-8 p-0 shrink-0"
            title="Keluar"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Admin Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-6 overflow-x-auto no-scrollbar scroll-smooth">
        <nav className="flex space-x-2 sm:space-x-6 min-w-max">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`py-3 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap min-h-[44px] ${
                  isActive
                    ? "border-purple-700 text-purple-700 font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.shortLabel}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Admin Content */}
      <main className="flex-1 p-3.5 sm:p-5 md:p-6 max-w-7xl w-full mx-auto">{children}</main>
    </div>
  );
}
