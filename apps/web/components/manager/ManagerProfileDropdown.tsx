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
  Camera,
  Sparkles,
  Link as LinkIcon,
} from "lucide-react";

const PRESET_AVATARS = [
  {
    id: "spv-1",
    label: "Supervisor 1",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80",
  },
  {
    id: "spv-2",
    label: "Supervisor 2",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80",
  },
  {
    id: "spv-3",
    label: "Supervisor 3",
    url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80",
  },
  {
    id: "spv-4",
    label: "Supervisor 4",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80",
  },
  {
    id: "spv-5",
    label: "Supervisor 5",
    url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&auto=format&fit=crop&q=80",
  },
  {
    id: "spv-6",
    label: "Supervisor 6",
    url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160&auto=format&fit=crop&q=80",
  },
];

export function ManagerProfileDropdown() {
  const router = useRouter();
  const { user, updateUser, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Modal dialog states
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditAvatar, setShowEditAvatar] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Edit Profile form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Avatar form state
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState("");
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null);

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

  const openAvatarModal = () => {
    setSelectedAvatarUrl(user?.avatar || "");
    setCustomAvatarUrl(user?.avatar || "");
    setAvatarError(null);
    setAvatarSuccess(null);
    setIsOpen(false);
    setShowEditAvatar(true);
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
      setProfileSuccess("Profil supervisor berhasil diperbarui.");
      setTimeout(() => {
        setShowEditProfile(false);
      }, 1200);
    } catch (err: any) {
      console.error("Failed to update manager profile", err);
      setProfileError(err.message || "Gagal memperbarui profil.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleSaveAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingAvatar(true);
    setAvatarError(null);
    setAvatarSuccess(null);

    const targetUrl = customAvatarUrl.trim() || selectedAvatarUrl.trim();

    try {
      const updated = await updateProfile({ avatar: targetUrl || null });
      updateUser(updated);
      setAvatarSuccess("Foto avatar berhasil diperbarui.");
      setTimeout(() => {
        setShowEditAvatar(false);
      }, 1200);
    } catch (err: any) {
      console.error("Failed to update avatar", err);
      setAvatarError(err.message || "Gagal memperbarui avatar.");
    } finally {
      setIsUpdatingAvatar(false);
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
      setPasswordSuccess("Kata sandi berhasil diperbarui.");
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

  const activeAvatarPreview = customAvatarUrl.trim() || selectedAvatarUrl.trim() || user?.avatar;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all text-left shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1E4ED8]/20"
        title="Menu Profil & Akun Supervisor"
      >
        <div className="relative">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="h-8 w-8 rounded-lg object-cover border border-slate-200 shadow-xs"
            />
          ) : (
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-[#0F2B5B] to-[#1E4ED8] text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {user?.name?.slice(0, 2).toUpperCase() || "SP"}
            </div>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
        </div>

        <div className="hidden sm:flex flex-col items-start leading-tight min-w-0">
          <span className="text-xs font-bold text-slate-800 truncate max-w-[130px]">
            {user?.name || "Manager"}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Supervisor SPV
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
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* User Details Header */}
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-3">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-9 w-9 rounded-xl object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#0F2B5B] to-[#1E4ED8] text-white font-bold text-xs flex items-center justify-center shrink-0">
                {user?.name?.slice(0, 2).toUpperCase() || "SP"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-slate-900 truncate">{user?.name}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                  SPV
                </span>
              </div>
              <div className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email}</div>
            </div>
          </div>

          {/* Action Menu Items */}
          <div className="py-1">
            <button
              type="button"
              onClick={openProfileModal}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer"
            >
              <UserIcon className="h-4 w-4 text-slate-500" />
              <span>Edit Profil SPV</span>
            </button>

            <button
              type="button"
              onClick={openAvatarModal}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer"
            >
              <Camera className="h-4 w-4 text-slate-500" />
              <span>Ubah Avatar Profil</span>
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
        title="Edit Profil Supervisor"
        description="Perbarui informasi nama dan alamat email akun supervisor Anda."
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
            label="Nama Lengkap Supervisor"
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
            placeholder="manager@ion.test"
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
              className="text-xs bg-[#1E4ED8] hover:bg-[#1D40B0]"
            >
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal 2: Edit Avatar Dialog */}
      <Dialog
        isOpen={showEditAvatar}
        onClose={() => !isUpdatingAvatar && setShowEditAvatar(false)}
        title="Pilih atau Ubah Avatar"
        description="Pilih dari koleksi avatar profesional ION atau gunakan link gambar kustom Anda."
      >
        <form onSubmit={handleSaveAvatar} className="space-y-4">
          {avatarError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {avatarError}
            </div>
          )}

          {avatarSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{avatarSuccess}</span>
            </div>
          )}

          {/* Live Avatar Preview */}
          <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="relative">
              {activeAvatarPreview ? (
                <img
                  src={activeAvatarPreview}
                  alt="Preview"
                  className="h-16 w-16 rounded-2xl object-cover border-2 border-white shadow-md"
                />
              ) : (
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-[#0F2B5B] to-[#1E4ED8] text-white font-bold text-lg flex items-center justify-center shadow-md">
                  {user?.name?.slice(0, 2).toUpperCase() || "SP"}
                </div>
              )}
              <span className="absolute -top-1 -right-1 bg-[#1E4ED8] text-white p-1 rounded-full shadow-xs">
                <Sparkles className="h-3 w-3" />
              </span>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Pratinjau Avatar</div>
              <div className="text-[11px] text-slate-500">
                Avatar ini akan tampil di seluruh panel supervisor dan sistem.
              </div>
            </div>
          </div>

          {/* Preset Avatar Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Pilihan Avatar Cepat
            </label>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_AVATARS.map((preset) => {
                const isSelected = selectedAvatarUrl === preset.url && !customAvatarUrl;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedAvatarUrl(preset.url);
                      setCustomAvatarUrl("");
                    }}
                    className={`p-1 rounded-xl border transition-all hover:scale-105 cursor-pointer ${
                      isSelected
                        ? "border-[#1E4ED8] ring-2 ring-[#1E4ED8]/30 bg-blue-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="h-10 w-10 rounded-lg object-cover mx-auto"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Avatar URL Input */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <LinkIcon className="h-3.5 w-3.5 text-slate-400" />
              Atau Gunakan URL Gambar Kustom
            </label>
            <Input
              type="url"
              value={customAvatarUrl}
              onChange={(e) => {
                setCustomAvatarUrl(e.target.value);
                if (e.target.value) setSelectedAvatarUrl("");
              }}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isUpdatingAvatar}
              onClick={() => setShowEditAvatar(false)}
              className="text-xs text-slate-600"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isUpdatingAvatar}
              className="text-xs bg-[#1E4ED8] hover:bg-[#1D40B0]"
            >
              Simpan Avatar
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal 3: Edit Password Dialog */}
      <Dialog
        isOpen={showEditPassword}
        onClose={() => !isUpdatingPassword && setShowEditPassword(false)}
        title="Ubah Kata Sandi Supervisor"
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
              className="text-xs bg-[#1E4ED8] hover:bg-[#1D40B0]"
            >
              Perbarui Kata Sandi
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
