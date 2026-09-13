"use client";

import React, { useEffect, useState } from "react";
import type { AgentPerformance, User } from "@ion/types";
import { createAgent, getAgentPerformance, getManagerAgents, updateAgent } from "../../lib/api/manager";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Input } from "../ui/Input";
import { formatDuration } from "../../lib/utils";
import { Plus, BarChart2, Star, CheckCircle, XCircle } from "lucide-react";

export function AgentMonitoringTable() {
  const [agents, setAgents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState<boolean>(false);
  const [performanceData, setPerformanceData] = useState<AgentPerformance | null>(null);

  // Form states
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newCapacity, setNewCapacity] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = () => {
    setIsLoading(true);
    getManagerAgents()
      .then((res) => setAgents(res.data))
      .catch((err) => console.error("Failed to load agents", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await createAgent({
        name: newName,
        email: newEmail,
        password: newPassword,
        max_concurrent_conversations: Number(newCapacity),
      });

      setShowCreateModal(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      fetchAgents();
    } catch (err: any) {
      setError(err.message || "Gagal membuat agen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewPerformance = async (agentId: number) => {
    try {
      const data = await getAgentPerformance(agentId);
      setPerformanceData(data);
      setShowPerformanceModal(true);
    } catch (err) {
      console.error("Failed to load performance", err);
    }
  };

  const handleToggleActive = async (agent: User) => {
    try {
      await updateAgent(agent.id, { is_active: !agent.is_active });
      fetchAgents();
    } catch (err) {
      console.error("Failed to toggle status", err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Manajemen & Monitoring Agen</h3>
          <p className="text-xs text-slate-500">Pantau kehadiran, kapasitas, dan beban kerja Customer Service</p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Tambah Agen Baru
        </Button>
      </div>

      {/* Agents Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Nama Agen</th>
                <th className="px-4 py-3">Presence</th>
                <th className="px-4 py-3">Ketersediaan</th>
                <th className="px-4 py-3">Beban Kerja Aktif</th>
                <th className="px-4 py-3">Status Akun</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Memuat data agen...
                  </td>
                </tr>
              ) : agents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Belum ada data agen terdaftar.
                  </td>
                </tr>
              ) : (
                agents.map((agent: any) => (
                  <tr key={agent.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900">{agent.name}</div>
                      <div className="text-[11px] text-slate-400">{agent.email}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={agent.presence === "online" ? "online" : "offline"}>
                        {agent.presence === "online" ? "Online" : "Offline"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={agent.availability as any}>
                        {agent.availability === "available" && "Tersedia"}
                        {agent.availability === "away" && "Away"}
                        {agent.availability === "busy" && "Sibuk / Penuh"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-slate-900">
                        {agent.active_conversations ?? 0} / {agent.max_concurrent_conversations ?? 5} Chats
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {agent.is_active ? (
                        <span className="text-emerald-600 flex items-center gap-1 font-medium">
                          <CheckCircle className="h-3.5 w-3.5" /> Aktif
                        </span>
                      ) : (
                        <span className="text-red-500 flex items-center gap-1 font-medium">
                          <XCircle className="h-3.5 w-3.5" /> Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPerformance(agent.id)}
                        className="text-xs"
                      >
                        <BarChart2 className="h-3.5 w-3.5 mr-1" /> Performa
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(agent)}
                        className={agent.is_active ? "text-red-600" : "text-emerald-600"}
                      >
                        {agent.is_active ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Agent Modal */}
      <Dialog
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Tambah Agen Customer Service Baru"
        description="Agen yang ditambahkan akan otomatis mendapatkan akses ke workspace live chat."
      >
        <form onSubmit={handleCreateAgent} className="space-y-3">
          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

          <Input
            label="Nama Lengkap"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
            placeholder="misal: Sarah Putri"
          />

          <Input
            label="Email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            placeholder="sarah@ion.net.id"
          />

          <Input
            label="Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            placeholder="Minimal 8 karakter"
          />

          <Input
            label="Kapasitas Maksimal Chat Sekaligus"
            type="number"
            min={1}
            max={20}
            value={newCapacity}
            onChange={(e) => setNewCapacity(Number(e.target.value))}
            required
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Simpan Agen
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Performance Modal */}
      {performanceData && (
        <Dialog
          isOpen={showPerformanceModal}
          onClose={() => setShowPerformanceModal(false)}
          title={`Metrik Performa - ${performanceData.agent_name}`}
          description="Statistik operasional penanganan chat pelanggan"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[11px] text-slate-400">Total Ditangani</p>
                <p className="text-lg font-bold text-slate-900">{performanceData.total_conversations}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[11px] text-slate-400">Terselesaikan</p>
                <p className="text-lg font-bold text-emerald-600">{performanceData.closed_conversations}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[11px] text-slate-400">Respon Pertama</p>
                <p className="text-lg font-bold text-slate-900">
                  {formatDuration(performanceData.first_response_time)}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[11px] text-slate-400">Rata-rata Resolusi</p>
                <p className="text-lg font-bold text-slate-900">
                  {formatDuration(performanceData.average_resolution_time)}
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-800">Rating Kepuasan Pelanggan</p>
                <p className="text-[11px] text-slate-500">Rata-rata penilaian bintang</p>
              </div>
              <div className="flex items-center gap-1 text-lg font-bold text-amber-500">
                <Star className="h-5 w-5 fill-amber-400" />
                <span>{performanceData.average_rating.toFixed(1)}</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-800 mb-2">Distribusi Penilaian Bintang</p>
              <div className="space-y-1.5 text-xs text-slate-600">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = (performanceData.rating_distribution as any)[stars] || 0;
                  const total = performanceData.closed_conversations || 1;
                  const percentage = Math.round((count / total) * 100);

                  return (
                    <div key={stars} className="flex items-center gap-2">
                      <span className="w-12 text-slate-500">{stars} Bintang</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${percentage}%` }} />
                      </div>
                      <span className="w-8 text-right font-medium text-slate-700">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button variant="primary" size="sm" onClick={() => setShowPerformanceModal(false)}>
                Tutup
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
