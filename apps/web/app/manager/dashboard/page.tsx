"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "../../../stores/authStore";
import { ManagerDashboard } from "../../../components/manager/ManagerDashboard";
import { AgentMonitoringTable } from "../../../components/manager/AgentMonitoringTable";
import { ConversationMonitor } from "../../../components/manager/ConversationMonitor";
import { ManagerProfileDropdown } from "../../../components/manager/ManagerProfileDropdown";
import { Button } from "../../../components/ui/Button";
import { BrandLogo } from "../../../components/ui/BrandLogo";
import {
  Activity,
  Users,
  MessageSquare,
  ShieldAlert,
  LayoutDashboard,
  Headphones,
  Loader2,
  ExternalLink,
} from "lucide-react";

export default function ManagerDashboardPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"overview" | "agents" | "conversations">("overview");

  useEffect(() => {
    if (!isInitialized) return;
    if (!user) {
      router.push("/login");
      return;
    }
    // Only allow managers and superadmins
    if (user.role !== "manager" && user.role !== "superadmin") {
      router.push("/login");
    }
  }, [user, isInitialized, router]);

  if (!isInitialized || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#1E3785] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Manager Header */}
      <header className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between sticky top-0 z-40 gap-2">
        <BrandLogo
          size="sm"
          subtitle={
            <>
              <span className="hidden sm:inline">Portal Supervisor & Monitoring Operasional</span>
              <span className="sm:hidden">Supervisor</span>
            </>
          }
          className="min-w-0 shrink"
          textClassName="min-w-0 max-w-[140px] xs:max-w-[200px] sm:max-w-none"
        />

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Link href="/agent/workspace" target="_blank">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 hidden md:flex whitespace-nowrap">
              <Headphones className="h-3.5 w-3.5" />
              Buka Workspace Agen
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </Button>
          </Link>

          {user.role === "superadmin" && (
            <Link href="/admin/users">
              <Button variant="outline" size="sm" className="text-xs gap-1.5 whitespace-nowrap px-2 sm:px-3 h-8">
                <ShieldAlert className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                <span className="hidden sm:inline">Panel Admin</span>
                <span className="sm:hidden text-[11px] font-medium">Admin</span>
              </Button>
            </Link>
          )}

          <div className="h-4 sm:h-5 w-px bg-slate-200" />

          {/* Manager Profile & Settings Dropdown */}
          <ManagerProfileDropdown />
        </div>
      </header>

      {/* Subnav Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-6 overflow-x-auto no-scrollbar scroll-smooth">
        <nav className="flex space-x-2 sm:space-x-6 min-w-max">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap min-h-[44px] ${
              activeTab === "overview"
                ? "border-[#1E3785] text-[#1E3785] font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Ringkasan & Metrik Realtime</span>
            <span className="sm:hidden">Ringkasan Metrik</span>
          </button>

          <button
            onClick={() => setActiveTab("agents")}
            className={`py-3 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap min-h-[44px] ${
              activeTab === "agents"
                ? "border-[#1E3785] text-[#1E3785] font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Manajemen & Kapasitas Agen</span>
            <span className="sm:hidden">Kapasitas Agen</span>
          </button>

          <button
            onClick={() => setActiveTab("conversations")}
            className={`py-3 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap min-h-[44px] ${
              activeTab === "conversations"
                ? "border-[#1E3785] text-[#1E3785] font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <MessageSquare className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Monitoring Percakapan</span>
            <span className="sm:hidden">Monitoring Chat</span>
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-3.5 sm:p-5 md:p-6 max-w-7xl w-full mx-auto space-y-4 sm:space-y-6">
        {activeTab === "overview" && <ManagerDashboard onNavigateTab={setActiveTab} />}
        {activeTab === "agents" && <AgentMonitoringTable />}
        {activeTab === "conversations" && <ConversationMonitor />}
      </main>
    </div>
  );
}
