"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  getStorageMetrics,
  updateStorageSettings,
  pruneStorage,
  type StorageMetrics,
  type PruneStorageResult,
} from "../../../lib/api/storage";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Dialog } from "../../../components/ui/Dialog";
import {
  HardDrive,
  Database,
  FileBox,
  Trash2,
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  ShieldCheck,
  Info,
  Layers,
  Settings2,
  Sparkles,
  Loader2,
  Calendar,
} from "lucide-react";

export default function AdminStoragePage() {
  const [metrics, setMetrics] = useState<StorageMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isPruning, setIsPruning] = useState(false);

  // Notifications
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Retention form state
  const [auditLogsDays, setAuditLogsDays] = useState(90);
  const [attachmentsDays, setAttachmentsDays] = useState(60);
  const [autoPruneEnabled, setAutoPruneEnabled] = useState(true);

  // Prune modal state
  const [isPruneModalOpen, setIsPruneModalOpen] = useState(false);
  const [pruneDryRun, setPruneDryRun] = useState(true);
  const [pruneAuditLogs, setPruneAuditLogs] = useState(true);
  const [pruneAttachments, setPruneAttachments] = useState(true);
  const [pruneOrphans, setPruneOrphans] = useState(true);
  const [pruneResult, setPruneResult] = useState<PruneStorageResult | null>(null);

  const loadMetrics = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    try {
      const data = await getStorageMetrics();
      setMetrics(data);
      setAuditLogsDays(data.retention.retention_audit_logs_days);
      setAttachmentsDays(data.retention.retention_attachments_days);
      setAutoPruneEnabled(data.retention.auto_prune_enabled);
    } catch (err: any) {
      console.error("Failed to load storage metrics:", err);
      setFeedback({
        type: "error",
        message: err.message || "Gagal memuat informasi ruang penyimpanan server.",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setFeedback(null);

    try {
      const res = await updateStorageSettings({
        retention_audit_logs_days: Number(auditLogsDays),
        retention_attachments_days: Number(attachmentsDays),
        auto_prune_enabled: Boolean(autoPruneEnabled),
      });

      setMetrics(res.data);
      setFeedback({
        type: "success",
        message: "Kebijakan retensi penyimpanan berhasil diperbarui dan diterapkan.",
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      console.error("Failed to update storage settings:", err);
      setFeedback({
        type: "error",
        message: err.message || "Gagal menyimpan konfigurasi kebijakan retensi.",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleExecutePrune = async () => {
    setIsPruning(true);
    setPruneResult(null);

    try {
      const res = await pruneStorage({
        dry_run: pruneDryRun,
        prune_audit_logs: pruneAuditLogs,
        prune_attachments: pruneAttachments,
        clean_orphans: pruneOrphans,
      });

      setPruneResult(res.data);
      // Reload fresh metrics if real deletion was executed
      if (!pruneDryRun) {
        await loadMetrics();
      }
    } catch (err: any) {
      console.error("Failed to execute storage cleanup:", err);
      setFeedback({
        type: "error",
        message: err.message || "Gagal menjalankan proses pembersihan penyimpanan.",
      });
    } finally {
      setIsPruning(false);
    }
  };

  const formatDateTime = (isoDate: string | null) => {
    if (!isoDate) return "Belum pernah dijalankan";
    try {
      const d = new Date(isoDate);
      return new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(d);
    } catch {
      return isoDate;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 text-[#1E4ED8] animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Memuat analisis ruang penyimpanan...</p>
      </div>
    );
  }

  const diskPercent = metrics?.disk.used_percent ?? 0;
  const isDiskWarning = diskPercent >= 75 && diskPercent < 90;
  const isDiskCritical = diskPercent >= 90;

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8">
      {/* Top Banner / Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 border shadow-xs transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="text-sm font-medium">{feedback.message}</div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-[#1E4ED8]">
              <HardDrive className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#0F2B5B]">
                Penyimpanan & Retensi Data
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Monitoring kapasitas disk server VM Antares, riwayat percakapan, dan siklus pembersihan berkala.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadMetrics(true)}
            disabled={isRefreshing}
            className="min-h-[44px] px-3 sm:px-4 text-xs font-semibold gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-[#1E4ED8]" : "text-slate-600"}`} />
            Refresh
          </Button>

          <Button
            onClick={() => {
              setPruneResult(null);
              setIsPruneModalOpen(true);
            }}
            className="min-h-[44px] px-4 text-xs font-semibold bg-[#1E4ED8] hover:bg-blue-700 text-white gap-2 shadow-xs"
          >
            <Trash2 className="h-4 w-4" />
            Pembersihan Manual
          </Button>
        </div>
      </div>

      {/* 3 Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Card 1: Server VM Disk Space */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Disk VM Antares
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  isDiskCritical
                    ? "bg-red-50 text-red-700 border-red-200"
                    : isDiskWarning
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                {isDiskCritical ? "Kritis" : isDiskWarning ? "Waspada" : "Kapasitas Aman"}
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#0F2B5B]">
                  {metrics?.disk.used_formatted}
                </span>
                <span className="text-xs sm:text-sm text-slate-500">
                  dari total {metrics?.disk.total_formatted}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Tersisa bebas: <strong className="text-slate-700">{metrics?.disk.free_formatted}</strong>
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>Penggunaan Ruang</span>
                <span className="font-bold text-slate-700">{diskPercent}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isDiskCritical
                      ? "bg-red-600"
                      : isDiskWarning
                      ? "bg-amber-500"
                      : "bg-[#1E4ED8]"
                  }`}
                  style={{ width: `${Math.min(diskPercent, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Mount: /storage/app/public</span>
            <span className="font-mono text-[11px]">Docker Volume</span>
          </div>
        </div>

        {/* Card 2: Attachment Media Files */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                File Lampiran (Media)
              </span>
              <div className="p-1.5 rounded-lg bg-blue-50 text-[#1E4ED8]">
                <FileBox className="h-4 w-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#0F2B5B]">
                  {metrics?.attachments.disk_formatted}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Total fisik file di storage: <strong className="text-slate-700">{metrics?.attachments.total_files} file</strong>
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Entri database:</span>
                <span className="font-semibold text-slate-800">{metrics?.attachments.db_records} lampiran</span>
              </div>
              <div className="flex justify-between">
                <span>Maksimum foto:</span>
                <span className="font-semibold text-slate-800">1 MB</span>
              </div>
              <div className="flex justify-between">
                <span>Maksimum video:</span>
                <span className="font-semibold text-slate-800">50 MB</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-400">
            <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span className="truncate">Hanya lampiran percakapan selesai yang dipangkas</span>
          </div>
        </div>

        {/* Card 3: Database & Chat Logs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Basis Data & Riwayat
              </span>
              <div className="p-1.5 rounded-lg bg-blue-50 text-[#1E4ED8]">
                <Database className="h-4 w-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#0F2B5B]">
                  {metrics?.database.size_formatted}
                </span>
                <span className="text-xs text-slate-500">PostgreSQL</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Audit logs tersimpan: <strong className="text-slate-700">{metrics?.database.audit_logs_count} baris</strong>
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Total percakapan:</span>
                <span className="font-semibold text-slate-800">{metrics?.database.conversations_count}</span>
              </div>
              <div className="flex justify-between">
                <span>Percakapan selesai:</span>
                <span className="font-semibold text-slate-800">{metrics?.database.closed_conversations_count}</span>
              </div>
              <div className="flex justify-between">
                <span>Total pesan obrolan:</span>
                <span className="font-semibold text-slate-800">{metrics?.database.messages_count}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">Teks transkrip obrolan tersimpan permanen</span>
          </div>
        </div>
      </div>

      {/* Retention Settings & Scheduled Auto-Prune Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Retention Policy Form (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs">
          <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-blue-50 text-[#1E4ED8]">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0F2B5B]">
                Kebijakan Retensi Otomatis
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Pembersihan terjadwal otomatis dijalankan setiap hari pada pukul 02:00 WIB oleh scheduler.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6 pt-6">
            {/* Field 1: Audit Log Days */}
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700">
                Masa Retensi Audit Log (Hari)
              </label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="7"
                  max="3650"
                  value={auditLogsDays}
                  onChange={(e) => setAuditLogsDays(Number(e.target.value))}
                  className="max-w-[140px] min-h-[44px] font-semibold text-slate-900"
                  required
                />
                <span className="text-xs sm:text-sm text-slate-500 font-medium">
                  hari (minimal 7 hari, rekomendasi: 90 hari)
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Log audit keamanan, perubahan peran, dan aksi admin yang berusia lebih dari batas ini akan dibersihkan.
              </p>
            </div>

            {/* Field 2: Attachments Days */}
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700">
                Masa Retensi Lampiran Percakapan Selesai (Hari)
              </label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="0"
                  max="3650"
                  value={attachmentsDays}
                  onChange={(e) => setAttachmentsDays(Number(e.target.value))}
                  className="max-w-[140px] min-h-[44px] font-semibold text-slate-900"
                  required
                />
                <span className="text-xs sm:text-sm text-slate-500 font-medium">
                  hari (0 = jangan hapus lampiran, rekomendasi: 60 hari)
                </span>
              </div>
              <p className="text-xs text-slate-500">
                File fisik lampiran (foto & video) dari sesi percakapan yang telah <strong>ditutup</strong> lebih lama dari batas ini akan dihapus dari disk VM untuk membebaskan ruang. Teks percakapan tetap tersimpan.
              </p>
            </div>

            {/* Field 3: Auto-Prune Toggle */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
                  Jalankan Pembersihan Otomatis Setiap Hari
                </span>
                <span className="text-xs text-slate-500">
                  Scheduler cron dijalankan di kontainer ion_scheduler pada 02:00 WIB
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[50px] justify-center">
                <input
                  type="checkbox"
                  checked={autoPruneEnabled}
                  onChange={(e) => setAutoPruneEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[12px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1E4ED8]"></div>
              </label>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button
                type="submit"
                disabled={isSavingSettings}
                className="w-full sm:w-auto min-h-[44px] px-6 text-xs sm:text-sm font-semibold bg-[#1E4ED8] hover:bg-blue-700 text-white shadow-xs"
              >
                {isSavingSettings ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Menyimpan Kebijakan...
                  </>
                ) : (
                  "Simpan Kebijakan Retensi"
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Info & Status Sidebar (1 col) */}
        <div className="space-y-6">
          {/* Status Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#0F2B5B] flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#1E4ED8]" />
              Status Scheduler Sistem
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-500 font-medium block">Pembersihan Terakhir:</span>
                <span className="text-slate-800 font-semibold text-sm">
                  {formatDateTime(metrics?.retention.last_pruned_at ?? null)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-500 font-medium block">Jadwal Rutin:</span>
                <span className="text-slate-800 font-semibold">
                  Setiap Hari, Pukul 02:00 WIB
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-500 font-medium block">Rotasi Log Kontainer:</span>
                <span className="text-slate-800 font-semibold">
                  Maksimum 20 MB x 3 berkas per kontainer
                </span>
              </div>
            </div>
          </div>

          {/* Safety Guarantee Box */}
          <div className="bg-linear-to-br from-blue-50/70 to-indigo-50/40 rounded-2xl border border-blue-100 p-5 sm:p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-[#1E4ED8] font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4" />
              Jaminan Keamanan Data
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pembersihan otomatis tidak akan menghapus percakapan aktif atau teks riwayat pelanggan. Hanya berkas fisik media (foto dan video) kadaluarsa pada sesi yang sudah selesai ditutup yang akan dirampingkan.
            </p>
          </div>
        </div>
      </div>

      {/* Manual Pruning Dialog Modal */}
      <Dialog
        isOpen={isPruneModalOpen}
        onClose={() => setIsPruneModalOpen(false)}
        title="Pembersihan Manual Penyimpanan"
        description="Jalankan simulasi (dry run) atau eksekusi pembersihan data kadaluarsa untuk membebaskan ruang disk VM."
        className="max-w-lg"
      >
        <div className="space-y-5 pt-1">
          {/* Result Banner if already executed */}
          {pruneResult && (
            <div
              className={`p-4 rounded-xl border space-y-2 ${
                pruneResult.dry_run
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : "bg-emerald-50 border-emerald-200 text-emerald-900"
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs">
                {pruneResult.dry_run ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    Hasil Simulasi (Tidak Ada Berkas yang Dihapus)
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    Pembersihan Berhasil Diselesaikan
                  </>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-slate-500 block">Ruang disk dihemat:</span>
                  <span className="font-bold text-sm">{pruneResult.freed_formatted}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Audit logs:</span>
                  <span className="font-bold text-sm">{pruneResult.deleted_audit_logs_count} baris</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Lampiran kadaluarsa:</span>
                  <span className="font-bold text-sm">{pruneResult.deleted_attachments_count} berkas</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Berkas yatim piatu (orphan):</span>
                  <span className="font-bold text-sm">{pruneResult.deleted_orphan_files_count} berkas</span>
                </div>
              </div>
            </div>
          )}

          {/* Configuration Options */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Pilihan Komponen yang Dibersihkan
            </span>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors min-h-[44px]">
              <input
                type="checkbox"
                checked={pruneAuditLogs}
                onChange={(e) => setPruneAuditLogs(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#1E4ED8] focus:ring-[#1E4ED8]"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-800 block">
                  Audit Log Kadaluarsa (&gt; {auditLogsDays} Hari)
                </span>
                <span className="text-slate-500">
                  Membersihkan rekam jejak aktivitas lama dari tabel audit logs.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors min-h-[44px]">
              <input
                type="checkbox"
                checked={pruneAttachments}
                onChange={(e) => setPruneAttachments(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#1E4ED8] focus:ring-[#1E4ED8]"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-800 block">
                  Lampiran Percakapan Selesai (&gt; {attachmentsDays} Hari)
                </span>
                <span className="text-slate-500">
                  Menghapus file foto dan video dari percakapan yang sudah ditutup. Teks chat tetap aman.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors min-h-[44px]">
              <input
                type="checkbox"
                checked={pruneOrphans}
                onChange={(e) => setPruneOrphans(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#1E4ED8] focus:ring-[#1E4ED8]"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-800 block">
                  File Sampah Tanpa Referensi (Orphan Files)
                </span>
                <span className="text-slate-500">
                  Menghapus berkas di direktori attachments yang sudah tidak memiliki entri di database.
                </span>
              </div>
            </label>
          </div>

          {/* Mode Selector: Dry Run vs Real Prune */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-700 block">Mode Eksekusi</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPruneDryRun(true)}
                className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                  pruneDryRun
                    ? "bg-white text-[#1E4ED8] border-[#1E4ED8] shadow-xs"
                    : "bg-transparent text-slate-600 border-transparent hover:bg-slate-100"
                }`}
              >
                <Info className="h-3.5 w-3.5" />
                Simulasi (Dry Run)
              </button>
              <button
                type="button"
                onClick={() => setPruneDryRun(false)}
                className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                  !pruneDryRun
                    ? "bg-red-50 text-red-700 border-red-300 shadow-xs"
                    : "bg-transparent text-slate-600 border-transparent hover:bg-slate-100"
                }`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Hapus Fisik (Nyata)
              </button>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              {pruneDryRun
                ? "Simulasi hanya menghitung estimasi berkas & ukuran yang dapat dibebaskan tanpa menghapus berkas apapun."
                : "Perhatian: Berkas foto/video kadaluarsa akan dihapus secara permanen dari server disk VM."}
            </p>
          </div>

          {/* Modal Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPruneModalOpen(false)}
              disabled={isPruning}
              className="min-h-[44px] px-4 text-xs font-medium"
            >
              Tutup
            </Button>
            <Button
              type="button"
              onClick={handleExecutePrune}
              disabled={isPruning || (!pruneAuditLogs && !pruneAttachments && !pruneOrphans)}
              className={`min-h-[44px] px-5 text-xs font-semibold text-white shadow-xs gap-2 ${
                pruneDryRun ? "bg-[#1E4ED8] hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isPruning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : pruneDryRun ? (
                <>
                  <Play className="h-4 w-4" />
                  Mulai Simulasi
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Jalankan Pembersihan
                </>
              )}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
