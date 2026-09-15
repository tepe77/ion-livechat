"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "../../stores/authStore";
import { getConversations, startConversation } from "../../lib/api/conversations";
import { updateProfile } from "../../lib/api/auth";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { OfflineNoticeModal, type EmergencyContacts } from "./OfflineNoticeModal";
import { cn } from "../../lib/utils";
import {
  Home,
  History,
  MessageSquarePlus,
  MessageSquare,
  Wifi,
  User as UserIcon,
  LogOut,
  Loader2,
  ShieldCheck,
  Zap,
  PhoneCall,
  Clock,
  Edit3,
  CreditCard,
  CheckCircle2,
  Activity,
  AlertCircle,
} from "lucide-react";

export function MemberBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, updateUser, logout } = useAuthStore();

  const [isStartingChat, setIsStartingChat] = useState(false);
  const [hasActiveChat, setHasActiveChat] = useState(false);

  // Offline notice modal state
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [offlineContacts, setOfflineContacts] = useState<EmergencyContacts | undefined>(undefined);
  const [offlineMessage, setOfflineMessage] = useState<string | undefined>(undefined);

  // Modals state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditCustNum, setShowEditCustNum] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  const [customerNumber, setCustomerNumber] = useState("");
  const [isUpdatingCustNum, setIsUpdatingCustNum] = useState(false);
  const [custNumError, setCustNumError] = useState<string | null>(null);
  const [custNumSuccess, setCustNumSuccess] = useState<string | null>(null);

  // Check active conversation status on mount & route change
  useEffect(() => {
    if (!user) return;
    getConversations({ per_page: 5 })
      .then((res) => {
        const active = res.data.find(
          (c) => c.status === "assigned" || c.status === "waiting" || c.status === "active"
        );
        setHasActiveChat(!!active);
      })
      .catch(() => {});
  }, [user, pathname]);

  const handleStartChat = async () => {
    if (pathname === "/member/chat") {
      return;
    }

    setIsStartingChat(true);
    try {
      const res = await getConversations({ per_page: 5 });
      const active = res.data.find(
        (c) => c.status === "assigned" || c.status === "waiting" || c.status === "active"
      );
      if (active) {
        router.push("/member/chat");
      } else {
        await startConversation();
        router.push("/member/chat");
      }
    } catch (err: any) {
      console.error("Failed to start chat from bottom nav", err);
      if (err.code === "NO_AGENTS_ONLINE" || err.code === "LIVECHAT_DISABLED") {
        setOfflineContacts(err.data?.contacts);
        setOfflineMessage(err.message);
        setShowOfflineModal(true);
      } else {
        router.push("/member/chat");
      }
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleLogout = async () => {
    setShowAccountModal(false);
    await logout();
    router.push("/login");
  };

  const openEditProfile = () => {
    setName(user?.name || "");
    setEmail(user?.email || "");
    setPassword("");
    setProfileError(null);
    setProfileSuccess(null);
    setShowAccountModal(false);
    setShowEditProfile(true);
  };

  const openEditCustNum = () => {
    setCustomerNumber(user?.customer_number || "");
    setCustNumError(null);
    setCustNumSuccess(null);
    setShowAccountModal(false);
    setShowEditCustNum(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setIsUpdatingProfile(true);

    try {
      const payload: { name?: string; email?: string; password?: string } = {};
      if (name.trim() && name !== user?.name) payload.name = name.trim();
      if (email.trim() && email !== user?.email) payload.email = email.trim();
      if (password) payload.password = password;

      if (Object.keys(payload).length === 0) {
        setProfileError("Tidak ada perubahan data yang disimpan.");
        return;
      }

      const updated = await updateProfile(payload);
      updateUser(updated);
      setProfileSuccess("Profil berhasil diperbarui.");
      setTimeout(() => {
        setShowEditProfile(false);
        setProfileSuccess(null);
      }, 1200);
    } catch (err: any) {
      setProfileError(err.message || "Gagal memperbarui profil.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleSaveCustNum = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustNumError(null);
    setCustNumSuccess(null);
    setIsUpdatingCustNum(true);

    try {
      const trimmed = customerNumber.trim();
      if (!trimmed) {
        setCustNumError("Nomor pelanggan tidak boleh kosong.");
        return;
      }

      const updated = await updateProfile({ customer_number: trimmed });
      updateUser(updated);
      setCustNumSuccess("Nomor pelanggan berhasil diperbarui.");
      setTimeout(() => {
        setShowEditCustNum(false);
        setCustNumSuccess(null);
      }, 1200);
    } catch (err: any) {
      setCustNumError(err.message || "Gagal memperbarui nomor pelanggan.");
    } finally {
      setIsUpdatingCustNum(false);
    }
  };

  return (
    <>
      {/* Mobile Responsive Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-4px_24px_rgba(0,0,0,0.07)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto relative px-1">
          {/* 1. Beranda */}
          <Link
            href="/member"
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-1 transition-colors",
              pathname === "/member"
                ? "text-[#1E3785] font-bold"
                : "text-slate-400 hover:text-slate-700 font-medium"
            )}
          >
            <Home className={cn("h-5 w-5 mb-0.5", pathname === "/member" && "text-[#1E3785]")} />
            <span className="text-[10px] tracking-tight">Beranda</span>
          </Link>

          {/* 2. Riwayat */}
          <Link
            href="/member/history"
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-1 transition-colors",
              pathname === "/member/history"
                ? "text-[#1E3785] font-bold"
                : "text-slate-400 hover:text-slate-700 font-medium"
            )}
          >
            <History className={cn("h-5 w-5 mb-0.5", pathname === "/member/history" && "text-[#1E3785]")} />
            <span className="text-[10px] tracking-tight">Riwayat</span>
          </Link>

          {/* 3. Center: Start Chat Button */}
          <div className="flex-1 flex flex-col items-center justify-center relative -top-4">
            <button
              type="button"
              onClick={handleStartChat}
              disabled={isStartingChat}
              className={cn(
                "h-14 w-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all active:scale-95 cursor-pointer relative",
                pathname === "/member/chat"
                  ? "bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-600/30 ring-4 ring-white"
                  : "bg-gradient-to-tr from-[#1E3785] via-blue-700 to-sky-600 shadow-blue-900/35 ring-4 ring-white hover:shadow-2xl"
              )}
              title={pathname === "/member/chat" ? "Sedang dalam sesi chat" : "Mulai sesi chat"}
            >
              {isStartingChat ? (
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              ) : pathname === "/member/chat" ? (
                <MessageSquare className="h-6 w-6 text-white" />
              ) : (
                <MessageSquarePlus className="h-6 w-6 text-white" />
              )}

              {hasActiveChat && pathname !== "/member/chat" && (
                <span className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
              )}
            </button>
            <span
              className={cn(
                "text-[10px] font-bold mt-1 tracking-tight text-center whitespace-nowrap",
                pathname === "/member/chat" ? "text-emerald-700" : "text-[#1E3785]"
              )}
            >
              {pathname === "/member/chat" ? "Chat Aktif" : "Mulai Chat"}
            </span>
          </div>

          {/* 4. Status ONT */}
          <button
            type="button"
            onClick={() => setShowStatusModal(true)}
            className="flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-slate-700 font-medium transition-colors cursor-pointer"
          >
            <Wifi className="h-5 w-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Status ONT</span>
          </button>

          {/* 5. Akun */}
          <button
            type="button"
            onClick={() => setShowAccountModal(true)}
            className="flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-slate-700 font-medium transition-colors cursor-pointer"
          >
            <UserIcon className="h-5 w-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Akun</span>
          </button>
        </div>
      </nav>

      {/* Status ONT & Jaringan Modal */}
      <Dialog
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Status Perangkat & Koneksi"
        description="Informasi konektivitas serat optik dan modem ONT Anda."
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Status Modem ONT:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Online (Normal)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Paket Internet:</span>
              <span className="text-xs font-bold text-slate-800">ION Fiber 100 Mbps</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Nomor Pelanggan:</span>
              <span className="text-xs font-mono font-bold text-[#1E3785]">
                {user?.customer_number || `ION-${String(user?.id || 1).padStart(6, "0")}`}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Jam Layanan NOC:</span>
              <span className="text-xs font-semibold text-slate-700">24 Jam / 7 Hari</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-1.5 text-xs text-blue-900">
            <div className="font-bold flex items-center gap-1.5 text-[#1E3785]">
              <Zap className="h-4 w-4 text-amber-500 shrink-0" />
              Tips Cepat Gangguan Internet
            </div>
            <p className="text-[11px] text-blue-800/90 leading-relaxed">
              Jika internet terasa lambat atau lampu LOS berkedip, cabut adaptor daya modem selama 30 detik lalu tancapkan kembali.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowStatusModal(false)}
              className="w-full text-xs"
            >
              Tutup
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Akun / Profil Quick Action Sheet */}
      <Dialog
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        title="Pengaturan Akun Pelanggan"
        description="Kelola data akun, identitas pelanggan, dan keamanan."
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="h-12 w-12 rounded-full bg-[#1E3785] text-white font-bold flex items-center justify-center text-base shadow-xs shrink-0">
              {user?.name?.charAt(0).toUpperCase() || "P"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-slate-900 truncate">{user?.name}</div>
              <div className="text-xs text-slate-500 truncate">{user?.email}</div>
              <div className="text-[11px] font-mono font-semibold text-[#1E3785] mt-0.5">
                {user?.customer_number || `ION-${String(user?.id || 1).padStart(6, "0")}`}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={openEditProfile}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Edit3 className="h-4 w-4 text-[#1E3785]" />
                <span>Ubah Nama, Email & Password</span>
              </div>
              <span className="text-slate-400">›</span>
            </button>

            <button
              type="button"
              onClick={openEditCustNum}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                <span>Ubah Nomor Pelanggan ISP</span>
              </div>
              <span className="text-slate-400">›</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 text-xs font-semibold text-red-600 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <LogOut className="h-4 w-4 text-red-600" />
                <span>Keluar dari Akun</span>
              </div>
              <span className="text-red-400">›</span>
            </button>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAccountModal(false)}
              className="w-full text-xs"
            >
              Tutup
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog
        isOpen={showEditProfile}
        onClose={() => !isUpdatingProfile && setShowEditProfile(false)}
        title="Ubah Profil Pelanggan"
        description="Perbarui informasi profil dan kata sandi Anda."
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {profileError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          {profileSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Nama Lengkap</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Nama lengkap Anda"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Alamat Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="email@domain.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Kata Sandi Baru <span className="font-normal text-slate-400">(Opsional)</span>
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Kosongkan jika tidak ingin mengubah"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isUpdatingProfile}
              onClick={() => setShowEditProfile(false)}
              className="text-xs text-slate-600"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isUpdatingProfile}
              className="text-xs bg-[#1E3785] hover:bg-[#162B6B]"
            >
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Customer Number Dialog */}
      <Dialog
        isOpen={showEditCustNum}
        onClose={() => !isUpdatingCustNum && setShowEditCustNum(false)}
        title="Ubah Nomor Pelanggan"
        description="Nomor ID pelanggan tertera pada lembar tagihan atau surat kontrak ISP Anda."
      >
        <form onSubmit={handleSaveCustNum} className="space-y-4">
          {custNumError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{custNumError}</span>
            </div>
          )}

          {custNumSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{custNumSuccess}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Nomor Pelanggan (Customer ID)</label>
            <Input
              type="text"
              value={customerNumber}
              onChange={(e) => setCustomerNumber(e.target.value)}
              required
              placeholder="Contoh: ION-102938"
              className="font-mono text-sm tracking-wide"
            />
            <p className="text-[11px] text-slate-400">
              Digunakan teknisi untuk verifikasi cepat paket dan lokasi router ONT Anda.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isUpdatingCustNum}
              onClick={() => setShowEditCustNum(false)}
              className="text-xs text-slate-600"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isUpdatingCustNum}
              className="text-xs bg-[#1E3785] hover:bg-[#162B6B]"
            >
              Simpan Nomor
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Offline Notice Modal */}
      <OfflineNoticeModal
        isOpen={showOfflineModal}
        onClose={() => setShowOfflineModal(false)}
        contacts={offlineContacts}
        customerNumber={user?.customer_number}
        message={offlineMessage}
      />
    </>
  );
}
