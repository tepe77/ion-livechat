"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../stores/authStore";
import { updateProfile } from "../../lib/api/auth";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Input } from "../ui/Input";
import {
  User as UserIcon,
  ChevronDown,
  LogOut,
  CreditCard,
  CheckCircle2,
  Shield,
  Hash,
  Sparkles,
} from "lucide-react";

export function MemberProfileDropdown() {
  const router = useRouter();
  const { user, updateUser, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dialog states
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditCustomerNumber, setShowEditCustomerNumber] = useState(false);

  // Edit Profile form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Edit Customer Number form state
  const [customerNumber, setCustomerNumber] = useState("");
  const [isUpdatingCustNum, setIsUpdatingCustNum] = useState(false);
  const [custNumError, setCustNumError] = useState<string | null>(null);
  const [custNumSuccess, setCustNumSuccess] = useState<string | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openProfileModal = () => {
    setName(user?.name || "");
    setEmail(user?.email || "");
    setPassword("");
    setProfileError(null);
    setProfileSuccess(null);
    setIsOpen(false);
    setShowEditProfile(true);
  };

  const openCustomerNumberModal = () => {
    setCustomerNumber(user?.customer_number || "");
    setCustNumError(null);
    setCustNumSuccess(null);
    setIsOpen(false);
    setShowEditCustomerNumber(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      const payload: any = { name: name.trim() };
      if (email.trim() && email !== user?.email) {
        payload.email = email.trim();
      }
      if (password) {
        if (password.length < 8) {
          setProfileError("Kata sandi baru minimal 8 karakter.");
          setIsUpdatingProfile(false);
          return;
        }
        payload.password = password;
      }

      const updated = await updateProfile(payload);
      updateUser(updated);
      setProfileSuccess("Profil akun berhasil diperbarui.");
      setTimeout(() => {
        setShowEditProfile(false);
      }, 1200);
    } catch (err: any) {
      console.error("Failed to update profile", err);
      setProfileError(err.message || "Gagal memperbarui profil.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleSaveCustomerNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingCustNum(true);
    setCustNumError(null);
    setCustNumSuccess(null);

    try {
      const updated = await updateProfile({
        customer_number: customerNumber.trim() || undefined,
      });
      updateUser(updated);
      setCustNumSuccess("Nomor pelanggan berhasil disimpan.");
      setTimeout(() => {
        setShowEditCustomerNumber(false);
      }, 1200);
    } catch (err: any) {
      console.error("Failed to update customer number", err);
      setCustNumError(err.message || "Gagal menyimpan nomor pelanggan.");
    } finally {
      setIsUpdatingCustNum(false);
    }
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    router.push("/login");
  };

  const displayCustomerNumber =
    user?.customer_number || `ION-${String(user?.id || 1).padStart(6, "0")}`;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 pl-2 pr-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all text-left shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1E3785]/20"
      >
        <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-[#1E3785] to-blue-700 text-white font-bold text-xs flex items-center justify-center shadow-xs">
          {user?.name?.charAt(0).toUpperCase() || "M"}
        </div>
        <div className="hidden sm:flex flex-col items-start leading-tight">
          <span className="text-xs font-bold text-slate-800 max-w-[120px] truncate">
            {user?.name || "Member"}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {displayCustomerNumber}
          </span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-slate-700" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* User Details Header */}
          <div className="px-4 py-2.5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 truncate">
                {user?.name || "Member ION"}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#1E3785] border border-blue-100">
                Pelanggan
              </span>
            </div>
            <div className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email}</div>
            <div className="mt-2 flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="text-slate-400">ID Pelanggan:</span>
              <span className="font-mono font-semibold text-slate-800">
                {displayCustomerNumber}
              </span>
            </div>
          </div>

          {/* Menu Action Items */}
          <div className="py-1">
            <button
              type="button"
              onClick={openProfileModal}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer"
            >
              <UserIcon className="h-4 w-4 text-slate-500" />
              <span>Edit Profil Pengguna</span>
            </button>

            <button
              type="button"
              onClick={openCustomerNumberModal}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer"
            >
              <Hash className="h-4 w-4 text-slate-500" />
              <span>Edit Nomor Pelanggan</span>
            </button>
          </div>

          <div className="my-1 border-t border-slate-100" />

          {/* Logout Action */}
          <div className="px-2 pt-1">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left cursor-pointer"
            >
              <LogOut className="h-4 w-4 text-red-500" />
              <span>Keluar dari Akun</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal 1: Edit Profile Dialog */}
      <Dialog
        isOpen={showEditProfile}
        onClose={() => !isUpdatingProfile && setShowEditProfile(false)}
        title="Edit Profil Pengguna"
        description="Perbarui informasi data pribadi dan kata sandi akun Anda."
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {profileError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {profileError}
            </div>
          )}

          {profileSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          <Input
            label="Nama Lengkap"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masukkan nama lengkap"
            required
          />

          <Input
            label="Alamat Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            required
          />

          <div>
            <Input
              label="Ubah Kata Sandi (Opsional)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Kosongkan jika tidak ingin mengubah"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Minimal 8 karakter jika ingin memperbarui kata sandi.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
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

      {/* Modal 2: Edit Customer Number Dialog */}
      <Dialog
        isOpen={showEditCustomerNumber}
        onClose={() => !isUpdatingCustNum && setShowEditCustomerNumber(false)}
        title="Nomor Pelanggan ISP ION"
        description="Kelola nomor ID pelanggan yang terhubung dengan layanan internet fiber Anda."
      >
        <form onSubmit={handleSaveCustomerNumber} className="space-y-4">
          {custNumError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {custNumError}
            </div>
          )}

          {custNumSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{custNumSuccess}</span>
            </div>
          )}

          <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[#1E3785]" />
              Tentang Nomor ID Pelanggan
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Nomor pelanggan digunakan oleh representatif teknis dan sistem Smart Routing untuk
              memeriksa status jaringan, redaman sinyal ONT, dan riwayat paket Anda secara instan.
            </p>
          </div>

          <Input
            label="Nomor ID Pelanggan"
            type="text"
            value={customerNumber}
            onChange={(e) => setCustomerNumber(e.target.value)}
            placeholder="Contoh: ION-089124 atau 10082914"
            required
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isUpdatingCustNum}
              onClick={() => setShowEditCustomerNumber(false)}
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
    </div>
  );
}
