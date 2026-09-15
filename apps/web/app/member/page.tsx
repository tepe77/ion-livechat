"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "../../stores/authStore";
import { getConversations, startConversation, deleteConversation } from "../../lib/api/conversations";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Dialog } from "../../components/ui/Dialog";
import { MemberProfileDropdown } from "../../components/member/MemberProfileDropdown";
import { MemberBottomNav } from "../../components/member/MemberBottomNav";
import { OfflineNoticeModal, type EmergencyContacts } from "../../components/member/OfflineNoticeModal";
import { getPublicSettings, type SystemSettings } from "../../lib/api/settings";
import { BrandLogo } from "../../components/ui/BrandLogo";
import { getEcho } from "../../lib/realtime/client";
import { formatDateTime, formatDate, formatTime } from "../../lib/utils";
import type { Conversation } from "@ion/types";
import {
  Headphones,
  History,
  LogOut,
  MessageSquare,
  Sparkles,
  Wifi,
  ShieldCheck,
  Zap,
  PhoneCall,
  Clock,
  ChevronRight,
  Trash2,
  CheckCircle2,
  Activity,
  ArrowRight,
  AlertTriangle,
  Loader2,
  Star,
} from "lucide-react";

export default function MemberOnboardingPage() {
  const router = useRouter();
  const { user, isInitialized, logout } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isStartingChat, setIsStartingChat] = useState<boolean>(false);

  // Offline notice modal state
  const [showOfflineModal, setShowOfflineModal] = useState<boolean>(false);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContacts | undefined>(undefined);
  const [offlineMessage, setOfflineMessage] = useState<string | undefined>(undefined);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);

  // Delete dialog state
  const [convToDelete, setConvToDelete] = useState<Conversation | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getConversations({ per_page: 10 });
      setConversations(res.data);
      const active = res.data.find(
        (c) => c.status === "assigned" || c.status === "waiting" || c.status === "active"
      );
      setActiveConv(active || null);
    } catch (err) {
      console.error("Failed to load conversations", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    if (!user) {
      router.push("/login");
      return;
    }
    fetchConversations();

    // Fetch system operational settings & emergency contacts
    getPublicSettings()
      .then((data) => setSystemSettings(data))
      .catch(() => {});
  }, [user, isInitialized, router, fetchConversations]);

  // Realtime agent presence listener & automatic sync
  useEffect(() => {
    const fetchLatestSettings = () => {
      getPublicSettings()
        .then((data) => setSystemSettings(data))
        .catch(() => {});
    };

    // 1. Subscribe to public channel for instant realtime agent presence updates
    const echo = getEcho();
    if (echo) {
      const presenceChannel = echo.channel("system.presence");
      presenceChannel.listen(".agent.status.updated", (data: any) => {
        if (typeof data?.has_online_agents === "boolean") {
          setSystemSettings((prev) =>
            prev ? { ...prev, has_online_agents: data.has_online_agents } : null
          );
        } else {
          fetchLatestSettings();
        }
      });
    }

    // 2. Poll every 15 seconds as a fallback
    const pollInterval = setInterval(fetchLatestSettings, 15000);

    // 3. Immediately refresh when user returns to this browser tab
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchLatestSettings();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", fetchLatestSettings);

    return () => {
      if (echo) {
        echo.leaveChannel("system.presence");
      }
      clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", fetchLatestSettings);
    };
  }, []);

  const handleStartChat = async () => {
    if (activeConv) {
      router.push("/member/chat");
      return;
    }

    setIsStartingChat(true);
    try {
      await startConversation();
      router.push("/member/chat");
    } catch (err: any) {
      console.error("Failed to start conversation", err);
      if (err.code === "NO_AGENTS_ONLINE" || err.code === "LIVECHAT_DISABLED") {
        setEmergencyContacts(err.data?.contacts || systemSettings || undefined);
        setOfflineMessage(err.message);
        setShowOfflineModal(true);
      } else {
        alert("Gagal memulai sesi obrolan: " + (err.message || "Periksa koneksi Anda."));
      }
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!convToDelete) return;
    setIsDeleting(true);
    try {
      await deleteConversation(convToDelete.id);
      setConversations((prev) => prev.filter((c) => c.id !== convToDelete.id));
      if (activeConv?.id === convToDelete.id) {
        setActiveConv(null);
      }
      setConvToDelete(null);
    } catch (err: any) {
      console.error("Failed to delete conversation", err);
      alert("Gagal menghapus riwayat obrolan: " + (err.message || "Terjadi kesalahan."));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (!isInitialized || (isLoading && conversations.length === 0)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 text-[#1E3785] animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">Memuat portal ION Broadband Livechat...</p>
      </div>
    );
  }

  const pastConversations = conversations.filter((c) => c.status === "closed");

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-40">
        <BrandLogo subtitle="Portal Pelanggan & Bantuan Teknis" />

        <div className="flex items-center gap-3">
          <Link href="/member/history">
            <Button variant="ghost" size="sm" className="text-slate-600 gap-1.5 text-xs">
              <History className="h-4 w-4 text-slate-500" />
              <span className="hidden sm:inline">Riwayat Chat</span>
            </Button>
          </Link>

          <div className="h-4 w-px bg-slate-200" />

          <MemberProfileDropdown />
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-24 md:pb-8">
        {/* Welcome Greeting Banner */}
        <section className="bg-gradient-to-r from-[#1E3785] via-blue-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-medium text-blue-100">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-300" />
              <span className="text-blue-200">No. Pelanggan:</span>
              <span className="font-mono font-bold text-white tracking-wide">
                {user?.customer_number || `ION-${String(user?.id || 1).padStart(6, "0")}`}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Halo, {user?.name || "Pelanggan"}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Selamat datang di Pusat Dukungan Pelanggan ION Broadband Livechat. Butuh panduan teknis,
              pemeriksaan router ONT, atau informasi tagihan? Tim kami siap melayani Anda secara
              realtime.
            </p>
          </div>
        </section>

        {/* Main Action Cards: 1 Card for Live Chat, 1 Card for Riwayat Percakapan & Transkrip */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Card 1: Live Chat / Customer Service */}
          <div
            className={`group relative rounded-3xl p-6 sm:p-7 border transition-all shadow-xs flex flex-col justify-between ${
              activeConv
                ? "bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 border-blue-300 shadow-sm"
                : "bg-white border-slate-200 hover:border-[#1E3785]/40 hover:shadow-md"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-xs ${
                    activeConv
                      ? "bg-[#1E3785] text-white"
                      : "bg-blue-50 text-[#1E3785]"
                  }`}
                >
                  <MessageSquare className="h-6 w-6" />
                </div>

                {activeConv ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                    Sesi Berjalan (#{activeConv.id})
                  </span>
                ) : systemSettings?.has_online_agents === false ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 transition-colors">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Offline (Hotline 24 Jam)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 transition-colors">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Teknisi Siap Membantu
                  </span>
                )}
              </div>

              <h2 className="text-xl font-bold text-slate-900 mb-2">
                {activeConv ? "Lanjutkan Sesi Chat Aktif" : "Mulai Obrolan / Konsultasi Baru"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                {activeConv
                  ? `Anda memiliki percakapan aktif yang dilayani oleh ${
                      activeConv.agent?.name || "Petugas CS ION"
                    }. Masuk kembali ke ruang chat untuk melanjutkan percakapan.`
                  : "Mulai percakapan bantuan dengan teknisi ISP kami melalui Smart Routing otomatis untuk kendala internet, konfigurasi router WiFi, atau pertanyaan layanan."}
              </p>

              {/* Service information pill */}
              <div className="mt-5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-blue-100/60 text-[#1E3785] flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="text-xs">
                  <span className="text-slate-400 font-medium">Jam Operasional Layanan:</span>{" "}
                  <strong className="text-slate-800 font-semibold">
                    {systemSettings?.operational_hours || "24 Jam / 7 Hari"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Button
                variant="primary"
                className="w-full justify-center bg-[#1E3785] hover:bg-[#162B6B] gap-2 shadow-xs min-h-[44px] text-sm font-semibold rounded-xl"
                isLoading={isStartingChat}
                onClick={handleStartChat}
              >
                <span>{activeConv ? "Masuk ke Ruang Chat Aktif" : "Mulai Percakapan Sekarang"}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Card 2: Riwayat Percakapan & Transkrip (Single Unified Card) */}
          <div className="rounded-3xl p-6 sm:p-7 bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shadow-xs">
                    <History className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Riwayat Percakapan & Transkrip
                    </h2>
                    <p className="text-xs text-slate-500">
                      Arsip percakapan dan solusi teknis lampau
                    </p>
                  </div>
                </div>

                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60">
                  {pastConversations.length} Percakapan
                </span>
              </div>

              {pastConversations.length > 0 ? (
                <div className="divide-y divide-slate-100 pt-1">
                  {pastConversations.slice(0, 3).map((conv) => (
                    <div
                      key={conv.id}
                      className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 hover:bg-slate-50/70 px-2.5 rounded-xl transition-colors"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">
                            {conv.agent?.name || "Customer Service ION"}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                            Sesi #{conv.id}
                          </span>
                          {conv.rating && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                              {conv.rating.rating}/5
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1 truncate">
                          {conv.latest_message?.content || "Percakapan telah diselesaikan."}
                        </p>
                        <div className="text-[10px] text-slate-400">
                          {formatDateTime(conv.closed_at || conv.created_at)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <Link href="/member/history">
                          <Button variant="ghost" size="sm" className="text-xs text-slate-600 h-8 px-2.5">
                            Lihat Transkrip
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConvToDelete(conv)}
                          className="text-xs text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                          title="Hapus riwayat percakapan ini"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 px-4 text-center space-y-2 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                  <div className="h-10 w-10 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                    <History className="h-5 w-5" />
                  </div>
                  <div className="text-xs font-semibold text-slate-700">
                    Belum Ada Riwayat Percakapan
                  </div>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Sesi bantuan teknis dan transkrip obrolan yang telah selesai akan otomatis tercatat di sini.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 mt-2">
              <Link href="/member/history" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-center gap-2 min-h-[42px] text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <span>Buka Semua Riwayat & Transkrip</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Quick Troubleshooting & Emergency NOC */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Zap className="h-4 w-4 text-amber-500" />
              Lampu Indikator Modem
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pastikan lampu <strong>PON</strong> menyala hijau diam. Jika lampu{" "}
              <strong className="text-red-600">LOS</strong> berkedip merah, berarti kabel optik
              terputus dan perlu ditangani teknisi.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Restart Daya ONT 30 Detik
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Cabut adaptor daya modem selama 30 detik lalu tancapkan kembali. Cara ini efektif
              menyegarkan alokasi IP dan menghapus cache perangkat.
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#1E3785] to-blue-950 rounded-2xl p-5 text-white space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-100">
              <PhoneCall className="h-4 w-4 text-blue-300" />
              Hotline Darurat NOC 24 Jam
            </div>
            <p className="text-[11px] text-blue-100">
              Untuk laporan gangguan massal atau kendala darurat, hubungi pusat komando kami:
            </p>
            <div className="text-sm font-extrabold tracking-wide text-white">
              📞 1500-ION / 0812-ION-SUPPORT
            </div>
          </div>
        </section>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={!!convToDelete}
        onClose={() => !isDeleting && setConvToDelete(null)}
        title="Hapus Riwayat Obrolan?"
        description="Konfirmasi penghapusan percakapan dari daftar riwayat."
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Apakah Anda yakin ingin menghapus sesi chat{" "}
            <strong>#{convToDelete?.id}</strong> dari riwayat Anda? Seluruh transkrip pesan dan
            lampiran akan dihapus secara permanen.
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isDeleting}
              onClick={() => setConvToDelete(null)}
              className="text-xs text-slate-600"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={handleConfirmDelete}
              className="text-xs bg-red-600 hover:bg-red-700 text-white shadow-xs"
            >
              Ya, Hapus Riwayat
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Offline Notice Modal */}
      <OfflineNoticeModal
        isOpen={showOfflineModal}
        onClose={() => setShowOfflineModal(false)}
        contacts={emergencyContacts}
        customerNumber={user?.customer_number}
        message={offlineMessage}
      />

      {/* Mobile Responsive Bottom Navigation Bar */}
      <MemberBottomNav />
    </div>
  );
}
