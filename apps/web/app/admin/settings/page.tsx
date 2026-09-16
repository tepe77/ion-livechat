"use client";

import React, { useEffect, useState } from "react";
import { getAdminSettings, updateAdminSettings, type SystemSettings } from "../../../lib/api/settings";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import {
  PhoneCall,
  MessageSquare,
  Clock,
  Radio,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  HelpCircle,
  Eye,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Headphones,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    hotline_number: "1500-ION",
    whatsapp_number: "6281234567890",
    whatsapp_template: "Halo Tim ION Broadband, saya ingin melaporkan kendala koneksi internet pada nomor pelanggan saya.",
    operational_hours: "Senin - Minggu, 08:00 - 22:00 WIB",
    livechat_enabled: true,
    has_online_agents: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    getAdminSettings()
      .then((data) => {
        setSettings(data);
      })
      .catch((err) => {
        console.error("Failed to load admin settings", err);
        setErrorMessage("Gagal memuat pengaturan sistem. Silakan refresh halaman.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await updateAdminSettings({
        hotline_number: settings.hotline_number.trim(),
        whatsapp_number: settings.whatsapp_number.replace(/[^0-9]/g, ""),
        whatsapp_template: settings.whatsapp_template.trim(),
        operational_hours: settings.operational_hours.trim(),
        livechat_enabled: settings.livechat_enabled,
      });

      setSettings(res.data);
      setSuccessMessage("Pengaturan kontak darurat & operasional berhasil disimpan ke database!");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error("Failed to update settings", err);
      setErrorMessage(err.message || "Gagal menyimpan pengaturan. Pastikan data terisi dengan benar.");
    } finally {
      setIsSaving(false);
    }
  };

  const previewWaUrl = `https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
    settings.whatsapp_template
  )}`;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 min-h-[400px]">
        <Loader2 className="h-8 w-8 text-[#1E3785] animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">Memuat konfigurasi sistem ION Broadband...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">Pengaturan Kontak Darurat & Operasional</h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 whitespace-nowrap">
              Superadmin Only
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Atur nomor Hotline dan WhatsApp resmi yang akan ditampilkan otomatis kepada pelanggan jika tidak ada Customer Service yang sedang online.
          </p>
        </div>

        {/* Live Agent Status Indicator */}
        <div className="flex items-center gap-3 bg-slate-50 px-3.5 sm:px-4 py-2.5 rounded-xl border border-slate-200/90 w-full sm:w-auto shrink-0">
          <div className="relative flex items-center justify-center">
            <span
              className={`h-3 w-3 rounded-full ${
                settings.has_online_agents ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
              }`}
            />
          </div>
          <div className="text-xs">
            <div className="font-semibold text-slate-800">
              {settings.has_online_agents ? "Petugas Sedang Online" : "Semua Petugas Offline"}
            </div>
            <div className="text-[11px] text-slate-500">
              {settings.has_online_agents
                ? "Pelanggan dapat memulai sesi obrolan"
                : "Pop-up darurat otomatis diaktifkan"}
            </div>
          </div>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in duration-150">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in duration-150">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Form Settings & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Column: Form Settings (7 cols) */}
        <div className="lg:col-span-7 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5 sm:space-y-6">
          <form onSubmit={handleSave} className="space-y-5">
            {/* Livechat Master Switch */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Radio className="h-4 w-4 text-[#1E3785]" />
                  Status Layanan Livechat
                </label>
                <p className="text-xs text-slate-500">
                  Aktifkan atau nonaktifkan fitur livechat secara global untuk seluruh pelanggan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettings((s) => ({ ...s, livechat_enabled: !s.livechat_enabled }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  settings.livechat_enabled ? "bg-[#1E3785]" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    settings.livechat_enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Hotline Number Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <PhoneCall className="h-3.5 w-3.5 text-blue-600" />
                Nomor Hotline / Call Center 24 Jam
              </label>
              <Input
                type="text"
                value={settings.hotline_number}
                onChange={(e) => setSettings({ ...settings, hotline_number: e.target.value })}
                placeholder="Contoh: 1500-ION atau 021-12345678"
                required
                className="font-medium"
              />
              <p className="text-[11px] text-slate-400">
                Akan memicu panggilan telepon langsung (dialer) ketika member menekan tombol di perangkat ponsel.
              </p>
            </div>

            {/* WhatsApp Number Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                Nomor WhatsApp Dukungan Teknis Resmi
              </label>
              <Input
                type="text"
                value={settings.whatsapp_number}
                onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                placeholder="Contoh: 6281234567890"
                required
                className="font-medium"
              />
              <p className="text-[11px] text-slate-400">
                Gunakan format nomor internasional diawali dengan <strong>62</strong> (tanpa spasi, tanda tambah, atau tanda hubung).
              </p>
            </div>

            {/* WhatsApp Template Message */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  Template Pesan Otomatis WhatsApp
                </span>
                <span className="text-[11px] text-slate-400 font-normal">Opsional</span>
              </label>
              <textarea
                value={settings.whatsapp_template}
                onChange={(e) => setSettings({ ...settings, whatsapp_template: e.target.value })}
                rows={3}
                placeholder="Pesan yang otomatis tertulis saat pelanggan membuka WhatsApp..."
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-300 focus:border-[#1E3785] focus:ring-1 focus:ring-[#1E3785] outline-hidden transition-all bg-white text-slate-900"
              />
              <p className="text-[11px] text-slate-400">
                Teks ini akan otomatis terisi di kolom ketik WhatsApp pelanggan saat tombol diklik.
              </p>
            </div>

            {/* Operational Hours */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-600" />
                Informasi Jam Operasional Layanan Chat
              </label>
              <Input
                type="text"
                value={settings.operational_hours}
                onChange={(e) => setSettings({ ...settings, operational_hours: e.target.value })}
                placeholder="Contoh: Setiap Hari, 08:00 - 22:00 WIB"
                required
                className="font-medium"
              />
              <p className="text-[11px] text-slate-400">
                Keterangan waktu kerja operasional customer service yang ditampilkan pada pop-up informasi pelanggan.
              </p>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto bg-[#1E3785] hover:bg-[#162B6B] text-white font-semibold text-xs px-6 py-2.5 rounded-xl shadow-xs gap-2 min-h-[44px] h-auto whitespace-nowrap"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    <span>Menyimpan Pengaturan...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 shrink-0" />
                    <span>Simpan Perubahan Pengaturan</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Interactive Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-purple-700" />
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Live Customer Pop-up Preview
                </h2>
              </div>
              <span className="text-[10px] text-slate-400">Pratinjau Otomatis</span>
            </div>

            <p className="text-[11px] text-slate-500 mt-2 mb-4 leading-relaxed">
              Berikut adalah simulasi visual dari pop-up yang akan tampil seketika di layar pelanggan jika mereka memulai chat saat seluruh petugas sedang offline:
            </p>

            {/* Mockup Modal Container */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/90 border border-slate-200/90 shadow-sm space-y-4">
              {/* Badge & Icon Header */}
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 border border-amber-200/70 shadow-2xs">
                  <Headphones className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Layanan Chat Sedang Offline
                  </h3>
                  <p className="text-xs text-amber-800 font-medium mt-0.5">
                    {settings.operational_hours || "08:00 - 22:00 WIB"}
                  </p>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Mohon maaf, saat ini seluruh petugas Customer Service kami sedang tidak bertugas atau di luar jam operasional.
                </p>
              </div>

              {/* Action Buttons Mockup */}
              <div className="space-y-2.5 pt-1">
                {/* Hotline Action */}
                <a
                  href={`tel:${settings.hotline_number}`}
                  onClick={(e) => e.preventDefault()}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-blue-200/90 hover:border-blue-400 shadow-2xs transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-50 text-[#1E3785] flex items-center justify-center shrink-0">
                      <PhoneCall className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-[#1E3785]">
                        Call Center 24 Jam
                      </div>
                      <div className="text-[11px] text-[#1E3785] font-semibold">
                        {settings.hotline_number || "1500-ION"}
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#1E3785]" />
                </a>

                {/* WhatsApp Action */}
                <a
                  href={previewWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-emerald-200/90 hover:border-emerald-400 shadow-2xs transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                        Chat WhatsApp Resmi
                      </div>
                      <div className="text-[11px] text-emerald-700 font-semibold">
                        +{settings.whatsapp_number || "6281234567890"}
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-700" />
                </a>
              </div>

              {/* Modal Dismiss Mockup */}
              <div className="pt-1 text-center">
                <button
                  type="button"
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
                >
                  Tutup & Kembali ke Beranda
                </button>
              </div>
            </div>

            {/* Test WhatsApp Link */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Uji Tautan WhatsApp:</span>
              <a
                href={previewWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:underline font-semibold flex items-center gap-1"
              >
                Buka WhatsApp Web
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
