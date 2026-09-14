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
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <BrandLogo subtitle="Portal Supervisor & Monitoring Operasional" />

        <div className="flex items-center gap-3">
          <Link href="/agent/workspace" target="_blank">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 hidden md:flex">
              <Headphones className="h-3.5 w-3.5" />
              Buka Workspace Agen
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </Button>
          </Link>

          {user.role === "superadmin" && (
            <Link href="/admin/users">
              <Button variant="outline" size="sm" className="text-xs gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-purple-600" />
                Panel Admin
              </Button>
            </Link>
          )}

          <div className="h-5 w-px bg-slate-200" />

          {/* Manager Profile & Settings Dropdown */}
          <ManagerProfileDropdown />
        </div>
      </header>

      {/* Subnav Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 px-6">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors ${
              activeTab === "overview"
                ? "border-[#1E3785] text-[#1E3785]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Ringkasan & Metrik Realtime
          </button>

          <button
            onClick={() => setActiveTab("agents")}
            className={`py-3 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors ${
              activeTab === "agents"
                ? "border-[#1E3785] text-[#1E3785]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="h-4 w-4" />
            Manajemen & Kapasitas Agen
          </button>

          <button
            onClick={() => setActiveTab("conversations")}
            className={`py-3 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors ${
              activeTab === "conversations"
                ? "border-[#1E3785] text-[#1E3785]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Monitoring Percakapan
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {activeTab === "overview" && <ManagerDashboard onNavigateTab={setActiveTab} />}
        {activeTab === "agents" && <AgentMonitoringTable />}
        {activeTab === "conversations" && <ConversationMonitor />}
      </main>
    </div>
  );
}
