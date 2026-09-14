"use client";

import React, { useEffect, useState } from "react";
import type { DashboardStats, Conversation } from "@ion/types";
import { getDashboardStats, getManagerAgents, getMonitoredConversations } from "../../lib/api/manager";
import { getEcho } from "../../lib/realtime/client";
import { formatDuration, formatTime, cn } from "../../lib/utils";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { RealtimeIndicator } from "../ui/RealtimeIndicator";
import {
  Clock,
  MessageSquare,
  CheckCircle2,
  Users,
  UserCheck,
  Zap,
  Timer,
  Star,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Headphones,
  Info,
  Layers,
} from "lucide-react";

interface ManagerDashboardProps {
  onNavigateTab?: (tab: "overview" | "agents" | "conversations") => void;
}

export function ManagerDashboard({ onNavigateTab }: ManagerDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  const fetchAllData = () => {
    setIsLoading(true);
    Promise.all([
      getDashboardStats(),
      getManagerAgents({ per_page: 6 }),
      getMonitoredConversations({ per_page: 5 }),
    ])
      .then(([statsData, agentsData, convsData]) => {
        setStats(statsData);
        setAgents(agentsData.data || []);
        setRecentConversations(convsData.data || []);
        setLastRefreshedAt(new Date());
      })
      .catch((err) => console.error("Failed to load dashboard data", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchAllData();

    // Listen to Manager Dashboard realtime events via WebSocket
    const echo = getEcho();
    if (!echo) return;

    const channel = echo.private("manager.dashboard");

    channel.listen(".dashboard.updated", (payload: DashboardStats) => {
      setStats(payload);
    });

    channel.listen(".conversation.created", () => fetchAllData());
    channel.listen(".conversation.assigned", () => fetchAllData());
    channel.listen(".conversation.closed", () => fetchAllData());
    channel.listen(".agent.status.updated", () => fetchAllData());

    return () => {
      channel.stopListening(".dashboard.updated");
      channel.stopListening(".conversation.created");
      channel.stopListening(".conversation.assigned");
      channel.stopListening(".conversation.closed");
      channel.stopListening(".agent.status.updated");
      echo.leave("manager.dashboard");
    };
  }, []);

  // Compute operational health status
  const waitingCount = stats?.waiting ?? 0;
  const availableAgents = stats?.available_agents ?? 0;
  const onlineAgents = stats?.online_agents ?? 0;
  const avgFrt = stats?.average_first_response_time ?? 0;

  const isHealthy = waitingCount === 0 && (availableAgents > 0 || onlineAgents === 0);
  const isHighLoad = waitingCount > 3 || (waitingCount > 0 && availableAgents === 0);

  // Calculate total agent capacity utilization
  const totalActiveInRoster = agents.reduce((acc, a) => acc + (a.active_conversations || 0), 0);
  const totalCapacityInRoster = agents.reduce((acc, a) => acc + (a.max_concurrent_conversations || 5), 0);
  const capacityPct = totalCapacityInRoster > 0 ? Math.round((totalActiveInRoster / totalCapacityInRoster) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* 1. Header with Operational Health Badge & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Pusat Komando & Metrik Realtime
            </h2>
            <RealtimeIndicator />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Live Command Center pemantauan operasional, beban tim agen, dan SLA pelanggan ION ISP
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Service Health Indicator */}
          <div
            className={cn(
              "px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 shadow-2xs",
              isHighLoad
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : isHealthy
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-blue-50 border-blue-200 text-blue-800"
            )}
          >
            {isHighLoad ? (
              <>
                <AlertTriangle className="h-4 w-4 text-amber-600 animate-pulse" />
                <span>Kondisi Padat (Antrean Meningkat)</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Operasional Optimal (SLA Terjaga)</span>
              </>
            )}
          </div>

          <button
            onClick={fetchAllData}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#1E3785] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Perbarui data metrik"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-[#1E3785]" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Waiting Queue */}
        <Card
          onClick={() => onNavigateTab?.("conversations")}
          className={cn(
            "p-4 border transition-all cursor-pointer hover:shadow-md",
            waitingCount > 0 ? "border-amber-300 bg-amber-50/20" : "border-slate-200"
          )}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Menunggu Antrean</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {waitingCount}
                </span>
                <span className="text-[11px] text-slate-500">chat</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className={cn("font-medium", waitingCount > 0 ? "text-amber-600" : "text-emerald-600")}>
              {waitingCount > 0 ? "⚠️ Perlu respon segera" : "✓ Antrean bersih"}
            </span>
            <span className="text-slate-400 group-hover:text-slate-600 flex items-center gap-0.5">
              Lihat <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </Card>

        {/* Card 2: Active Chats */}
        <Card
          onClick={() => onNavigateTab?.("conversations")}
          className="p-4 border border-slate-200 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Chat Sedang Aktif</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-[#1E3785] tracking-tight">
                  {stats?.active ?? 0}
                </span>
                <span className="text-[11px] text-slate-500">sesi</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[#1E3785]">
              <MessageSquare className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">Sedang ditangani agen</span>
            <span className="text-slate-400 flex items-center gap-0.5">
              Pantau <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </Card>

        {/* Card 3: Online & Available Agents */}
        <Card
          onClick={() => onNavigateTab?.("agents")}
          className="p-4 border border-slate-200 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Agen Siap Bertugas</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {availableAgents}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  / {onlineAgents} Online
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-600">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className={cn("font-medium", availableAgents > 0 ? "text-emerald-600" : "text-slate-500")}>
              {availableAgents > 0 ? "🟢 Siap terima obrolan" : "⚪ Semua agen sibuk"}
            </span>
            <span className="text-slate-400 flex items-center gap-0.5">
              Roster <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </Card>

        {/* Card 4: Closed Today */}
        <Card className="p-4 border border-slate-200 hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Selesai Hari Ini</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-emerald-600 tracking-tight">
                  {stats?.closed_today ?? 0}
                </span>
                <span className="text-[11px] text-slate-500">tiket selesai</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-emerald-600 font-medium">Resolusi tuntas</span>
            <span className="text-slate-400">Total hari ini</span>
          </div>
        </Card>

        {/* Card 5: First Response Time (FRT) */}
        <Card className="p-4 border border-slate-200 hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Respon Pertama (FRT)</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {formatDuration(avgFrt)}
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-600">
              <Zap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className={cn("font-medium", avgFrt <= 60 ? "text-emerald-600" : "text-amber-600")}>
              {avgFrt <= 60 ? "✓ Memenuhi SLA (< 60 dtk)" : "⚠️ Di atas target SLA"}
            </span>
          </div>
        </Card>

        {/* Card 6: Average Resolution Time */}
        <Card className="p-4 border border-slate-200 hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Durasi Penyelesaian (AHT)</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {formatDuration(stats?.average_resolution_time ?? 0)}
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-600">
              <Timer className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Target penanganan: 5–15 mnt</span>
          </div>
        </Card>

        {/* Card 7: Customer Rating CSAT */}
        <Card className="p-4 border border-slate-200 hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Kepuasan Pelanggan (CSAT)</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {stats?.average_rating ? stats.average_rating.toFixed(1) : "0.0"}
                </span>
                <span className="text-[11px] text-slate-400">/ 5.0</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-500">
              <Star className="h-5 w-5 fill-amber-400" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-amber-600 font-semibold flex items-center gap-1">
              ★★★★★
            </span>
            <span className="text-slate-400">Skala 1 - 5</span>
          </div>
        </Card>

        {/* Card 8: Overall Team Utilization */}
        <Card className="p-4 border border-slate-200 hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Keterisian Beban Tim</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {capacityPct}%
                </span>
                <span className="text-[11px] text-slate-500">
                  ({totalActiveInRoster}/{totalCapacityInRoster})
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  capacityPct > 80 ? "bg-red-500" : capacityPct > 60 ? "bg-amber-500" : "bg-emerald-500"
                )}
                style={{ width: `${Math.min(capacityPct, 100)}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Two-Column Live Snapshot: Agent Capacity Roster & Live Sessions Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Live Agent Workload Roster */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-[#1E3785]" />
                Roster Kehadiran & Beban Kerja Agen
              </h3>
              <p className="text-[11px] text-slate-500">
                Status ketersediaan agen dan pemanfaatan kapasitas chat real-time
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateTab?.("agents")}
              className="text-xs text-[#1E3785] border-blue-200 hover:bg-blue-50"
            >
              Kelola Agen <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          <div className="space-y-2.5">
            {agents.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-xl">
                Belum ada agen terdaftar.
              </div>
            ) : (
              agents.slice(0, 5).map((agent) => {
                const isOnline = agent.presence === "online";
                const isAvailable = agent.availability === "available";
                const activeConvs = agent.active_conversations || 0;
                const maxConvs = agent.max_concurrent_conversations || 5;
                const loadPercent = Math.min(Math.round((activeConvs / maxConvs) * 100), 100);

                return (
                  <div
                    key={agent.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        {agent.avatar ? (
                          <img
                            src={agent.avatar}
                            alt={agent.name}
                            className="h-9 w-9 rounded-xl object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#1E3785] to-blue-700 text-white font-bold text-xs flex items-center justify-center">
                            {agent.name?.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span
                          className={cn(
                            "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white",
                            isOnline
                              ? isAvailable
                                ? "bg-emerald-500"
                                : "bg-amber-500"
                              : "bg-slate-300"
                          )}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {agent.name}
                          </span>
                          <span
                            className={cn(
                              "text-[9px] font-bold px-1.5 py-0.5 rounded-md",
                              isOnline
                                ? isAvailable
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-slate-100 text-slate-500 border border-slate-200"
                            )}
                          >
                            {isOnline ? (isAvailable ? "🟢 Tersedia" : "🟡 Sibuk/Away") : "⚪ Offline"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{agent.email}</p>
                      </div>
                    </div>

                    <div className="w-28 shrink-0 text-right space-y-1">
                      <div className="text-[11px] font-semibold text-slate-700">
                        {activeConvs} / {maxConvs} Chat
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            loadPercent >= 100
                              ? "bg-red-500"
                              : loadPercent >= 60
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          )}
                          style={{ width: `${loadPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Live Queue & Active Sessions Feed */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-amber-600" />
                Live Antrean & Aktivitas Obrolan Terkini
              </h3>
              <p className="text-[11px] text-slate-500">
                Sesi live chat yang baru masuk, antrean aktif, dan status interaksi
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateTab?.("conversations")}
              className="text-xs text-amber-700 border-amber-200 hover:bg-amber-50"
            >
              Semua Obrolan <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          <div className="space-y-2.5">
            {recentConversations.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-xl">
                Belum ada aktivitas percakapan tercatat.
              </div>
            ) : (
              recentConversations.slice(0, 5).map((conv) => {
                const isWaiting = conv.status === "waiting";
                const isActive = conv.status === "active" || conv.status === "assigned";

                return (
                  <div
                    key={conv.id}
                    className={cn(
                      "p-3 rounded-xl border transition-all flex items-center justify-between gap-3",
                      isWaiting
                        ? "bg-amber-50/40 border-amber-200"
                        : isActive
                        ? "bg-blue-50/20 border-blue-100"
                        : "bg-slate-50/40 border-slate-100"
                    )}
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {conv.member?.name || `Customer #${conv.member_id}`}
                        </span>
                        <Badge variant={conv.status as any}>
                          {isWaiting ? "Menunggu" : isActive ? "Aktif" : "Selesai"}
                        </Badge>
                      </div>

                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {conv.latest_message?.content || "Memulai percakapan..."}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-slate-400">
                        {formatTime(conv.started_at)}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-600 truncate max-w-[100px]">
                        {conv.agent ? `CS: ${conv.agent.name}` : "Menunggu Agen"}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 4. SLA & Smart Routing Transparency Guide */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-[#1E3785] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-slate-800">
              Standar Layanan & Smart Routing ION Broadband Livechat
            </span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Algoritma Smart Routing secara otomatis mengalokasikan pelanggan ke agen online dengan beban obrolan terendah (*Workload First*). Target SLA: Respon Pertama &lt; 60 detik, Resolusi Selesai 5–15 menit, dan CSAT &ge; 4.5/5.0.
            </p>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 shrink-0">
          Sinkronisasi realtime via Laravel Reverb WebSocket
        </div>
      </div>
    </div>
  );
}
