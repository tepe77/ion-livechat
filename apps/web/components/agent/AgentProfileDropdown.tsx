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
  KeyRound,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

export function AgentProfileDropdown() {
  const router = useRouter();
  const { user, updateUser, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Modal dialog states
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Edit Profile form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Edit Password form state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

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
    setProfileError(null);
    setProfileSuccess(null);
    setIsOpen(false);
    setShowEditProfile(true);
  };

  const openPasswordModal = () => {
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
    setPasswordSuccess(null);
    setIsOpen(false);
    setShowEditPassword(true);
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

      const updated = await updateProfile(payload);
      updateUser(updated);
      setProfileSuccess("Profil agen berhasil diperbarui.");
      setTimeout(() => {
        setShowEditProfile(false);
      }, 1200);
    } catch (err: any) {
      console.error("Failed to update agent profile", err);
      setProfileError(err.message || "Gagal memperbarui profil agen.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 8) {
      setPasswordError("Kata sandi baru minimal 8 karakter.");
      setIsUpdatingPassword(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi kata sandi tidak cocok.");
      setIsUpdatingPassword(false);
      return;
    }

    try {
      const updated = await updateProfile({ password: newPassword });
      updateUser(updated);
      setPasswordSuccess("Kata sandi agen berhasil diperbarui.");
      setTimeout(() => {
        setShowEditPassword(false);
      }, 1200);
    } catch (err: any) {
      console.error("Failed to update password", err);
      setPasswordError(err.message || "Gagal memperbarui kata sandi.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    router.push("/login");
  };

  return (
    <div className="relative flex-1 min-w-0" ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all text-left shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1E3785]/20"
        title="Menu Profil & Pengaturan"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-tr from-[#1E3785] to-blue-700 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            {user?.name?.slice(0, 2).toUpperCase() || "AG"}
          </div>
          <div className="flex flex-col items-start leading-tight min-w-0">
            <span className="text-xs font-bold text-slate-800 truncate block max-w-[130px]">
              {user?.name || "Agent"}
            </span>
            <span className="text-[10px] text-slate-400">Petugas CS</span>
          </div>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 mr-1 ${
            isOpen ? "rotate-180 text-slate-700" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* User Details Header */}
          <div className="px-4 py-2.5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 truncate">
                {user?.name}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#1E3785] border border-blue-100">
                Agent
              </span>
            </div>
            <div className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email}</div>
          </div>

          {/* Action Menu Items */}
          <div className="py-1">
            <button
              type="button"
              onClick={openProfileModal}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer"
            >
              <UserIcon className="h-4 w-4 text-slate-500" />
              <span>Edit Profil Agen</span>
            </button>

            <button
              type="button"
              onClick={openPasswordModal}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer"
            >
              <KeyRound className="h-4 w-4 text-slate-500" />
              <span>Ubah Kata Sandi</span>
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
        title="Edit Profil Petugas CS"
        description="Perbarui informasi nama dan alamat email akun petugas Anda."
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
            label="Nama Lengkap Agen"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masukkan nama lengkap"
            required
          />

          <Input
            label="Alamat Email Kerja"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="agent@ion.test"
            required
          />

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

      {/* Modal 2: Edit Password Dialog */}
      <Dialog
        isOpen={showEditPassword}
        onClose={() => !isUpdatingPassword && setShowEditPassword(false)}
        title="Ubah Kata Sandi Agen"
        description="Pastikan menggunakan kombinasi kata sandi yang aman dan kuat."
      >
        <form onSubmit={handleSavePassword} className="space-y-4">
          {passwordError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <Input
            label="Kata Sandi Baru"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimal 8 karakter"
            required
          />

          <Input
            label="Konfirmasi Kata Sandi Baru"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Ketik ulang kata sandi baru"
            required
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isUpdatingPassword}
              onClick={() => setShowEditPassword(false)}
              className="text-xs text-slate-600"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isUpdatingPassword}
              className="text-xs bg-[#1E3785] hover:bg-[#162B6B]"
            >
              Perbarui Kata Sandi
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
