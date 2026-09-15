"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "../../../stores/authStore";
import { startConversation, getConversations } from "../../../lib/api/conversations";
import { MemberChat } from "../../../components/member/MemberChat";
import { Button } from "../../../components/ui/Button";
import { MemberProfileDropdown } from "../../../components/member/MemberProfileDropdown";
import { MemberBottomNav } from "../../../components/member/MemberBottomNav";
import { OfflineNoticeModal, type EmergencyContacts } from "../../../components/member/OfflineNoticeModal";
import { BrandLogo } from "../../../components/ui/BrandLogo";
import type { Conversation } from "@ion/types";
import {
  Headphones,
  History,
  LogOut,
  MessageSquare,
  Loader2,
  Sparkles,
  Wifi,
  ShieldCheck,
  PhoneCall,
  Activity,
  CheckCircle2,
  Info,
  Server,
  Zap,
  ArrowLeft,
} from "lucide-react";

export default function MemberChatPage() {
  const router = useRouter();
  const { user, isInitialized, logout } = useAuthStore();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Offline notice modal state
  const [showOfflineModal, setShowOfflineModal] = useState<boolean>(false);
  const [offlineContacts, setOfflineContacts] = useState<EmergencyContacts | undefined>(undefined);
  const [offlineMessage, setOfflineMessage] = useState<string | undefined>(undefined);

  const initChat = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getConversations({ per_page: 5 });
      const active = res.data.find(
        (c) => c.status === "assigned" || c.status === "waiting" || c.status === "active"
      );

      if (active) {
        setConversation(active);
      } else {
        const newConv = await startConversation();
        setConversation(newConv);
      }
    } catch (err: any) {
      console.error("Failed to initialize conversation", err);
      if (err.code === "NO_AGENTS_ONLINE" || err.code === "LIVECHAT_DISABLED") {
        setOfflineContacts(err.data?.contacts);
        setOfflineMessage(err.message);
        setShowOfflineModal(true);
      } else {
        setError(err.message || "Gagal memulai sesi live chat. Silakan coba kembali.");
      }
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
    initChat();
  }, [user, isInitialized, router, initChat]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleStartNewChat = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const newConv = await startConversation();
      setConversation(newConv);
    } catch (err: any) {
      console.error("Failed to start new conversation", err);
      if (err.code === "NO_AGENTS_ONLINE" || err.code === "LIVECHAT_DISABLED") {
        setOfflineContacts(err.data?.contacts);
        setOfflineMessage(err.message);
        setShowOfflineModal(true);
      } else {
        setError(err.message || "Gagal memulai sesi live chat baru.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isInitialized || (isLoading && !conversation && !showOfflineModal)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 text-[#1E3785] animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">Menghubungkan ke layanan ION Broadband Livechat...</p>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-slate-100 flex flex-col overflow-hidden">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/member">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-700 hover:text-[#1E3785] gap-1 text-xs -ml-1 sm:-ml-2 hover:bg-slate-100 font-semibold cursor-pointer"
              title="Kembali ke Beranda Pelanggan"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Beranda</span>
            </Button>
          </Link>

          <div className="h-4 w-px bg-slate-200" />

          <BrandLogo subtitle="Layanan Bantuan Teknis & Pelanggan ISP" />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/member/history">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-[#1E3785] gap-1.5 text-xs">
              <History className="h-4 w-4 text-slate-500" />
              <span className="hidden sm:inline font-medium">Riwayat Chat</span>
            </Button>
          </Link>

          <div className="h-4 w-px bg-slate-200" />

          <MemberProfileDropdown />
        </div>
      </header>

      {/* Main Responsive Desktop & Mobile Stage */}
      <main className="flex-1 min-h-0 w-full max-w-7xl mx-auto p-0 sm:p-4 lg:p-6 flex flex-col overflow-hidden">
        {error ? (
          <div className="max-w-md w-full mx-auto my-12 bg-white p-6 rounded-2xl border border-red-200 text-center space-y-4 shadow-sm">
            <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Koneksi Layanan Terkendala</h2>
            <p className="text-xs text-slate-500">{error}</p>
            <Button variant="primary" onClick={initChat} className="w-full">
              Coba Hubungkan Kembali
            </Button>
          </div>
        ) : conversation ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full min-h-0 flex-1 overflow-hidden">
            {/* Primary Chat Column */}
            <div className="col-span-12 lg:col-span-8 h-full min-h-0 flex flex-col overflow-hidden">
              <MemberChat
                conversation={conversation}
                onStartNewChat={handleStartNewChat}
              />
            </div>

            {/* Desktop Side Diagnostic & Customer Account Panel */}
            <div className="hidden lg:flex lg:col-span-4 h-full flex-col gap-4 overflow-y-auto pr-1">
              {/* Account & Subscription Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-[#1E3785]" />
                    Paket Layanan Aktif
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    ONT Online
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nama Paket:</span>
                    <span className="font-bold text-[#1E3785]">ION Fiber 100 Mbps</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">ID Pelanggan:</span>
                    <span className="font-mono font-medium text-slate-700">ION-089124</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>IP Publik Dinamis & Bandwidth Dedicated 1:1</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Perangkat Optical Network Terminal (ONT) Aktif</span>
                  </div>
                </div>
              </div>

              {/* Quick Troubleshooting Guide */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Panduan Cepat Gangguan Internet
                </h3>

                <div className="space-y-2.5 text-xs text-slate-600">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex gap-2.5">
                    <div className="h-5 w-5 rounded-full bg-blue-100 text-[#1E3785] font-bold text-[10px] flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div>
                      <strong className="text-slate-800 block">Lampu Indikator Modem</strong>
                      Pastikan lampu <span className="font-semibold text-emerald-700">PON</span> menyala
                      hijau diam. Jika lampu <span className="font-semibold text-red-600">LOS</span>{" "}
                      berkedip merah, segera laporkan ke teknisi via chat.
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex gap-2.5">
                    <div className="h-5 w-5 rounded-full bg-blue-100 text-[#1E3785] font-bold text-[10px] flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div>
                      <strong className="text-slate-800 block">Restart Daya Modem ONT</strong>
                      Cabut colokan adaptor modem selama 30 detik, lalu tancapkan kembali hingga lampu
                      Internet menyala normal.
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex gap-2.5">
                    <div className="h-5 w-5 rounded-full bg-blue-100 text-[#1E3785] font-bold text-[10px] flex items-center justify-center shrink-0">
                      3
                    </div>
                    <div>
                      <strong className="text-slate-800 block">Uji Melalui Kabel LAN</strong>
                      Jika WiFi lambat, coba sambungkan PC/laptop langsung menggunakan kabel LAN ke port
                      LAN 1 pada modem.
                    </div>
                  </div>
                </div>
              </div>

              {/* NOC Contact Card */}
              <div className="bg-gradient-to-br from-[#1E3785] to-blue-950 rounded-2xl p-4 text-white shadow-xs space-y-2">
                <div className="flex items-center gap-2">
                  <PhoneCall className="h-4 w-4 text-blue-200" />
                  <span className="text-xs font-bold">Pusat Bantuan Darurat 24 Jam</span>
                </div>
                <p className="text-[11px] text-blue-100 leading-relaxed">
                  Jika terjadi pemadaman massal atau gangguan fisik kabel, hubungi pusat komando NOC:
                </p>
                <div className="text-sm font-extrabold tracking-wide text-white">
                  📞 1500-ION / 0812-ION-SUPPORT
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* Offline Notice Modal */}
      <OfflineNoticeModal
        isOpen={showOfflineModal}
        onClose={() => {
          setShowOfflineModal(false);
          router.push("/member");
        }}
        contacts={offlineContacts}
        customerNumber={user?.customer_number}
        message={offlineMessage}
      />
    </div>
  );
}
