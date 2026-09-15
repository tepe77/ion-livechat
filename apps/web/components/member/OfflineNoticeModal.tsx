"use client";

import React from "react";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import {
  Headphones,
  PhoneCall,
  MessageSquare,
  Clock,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

export interface EmergencyContacts {
  hotline_number?: string;
  whatsapp_number?: string;
  whatsapp_template?: string;
  operational_hours?: string;
}

interface OfflineNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts?: EmergencyContacts;
  customerNumber?: string | null;
  title?: string;
  message?: string;
}

export function OfflineNoticeModal({
  isOpen,
  onClose,
  contacts,
  customerNumber,
  title = "Layanan Chat Sedang Offline",
  message = "Mohon maaf, saat ini seluruh petugas Customer Service kami sedang tidak bertugas atau di luar jam operasional.",
}: OfflineNoticeModalProps) {
  const hotline = contacts?.hotline_number || "1500-ION";
  const rawWa = contacts?.whatsapp_number || "6281234567890";
  const cleanWa = rawWa.replace(/[^0-9]/g, "");
  const operationalHours = contacts?.operational_hours || "Senin - Minggu, 08:00 - 22:00 WIB";

  let defaultTemplate =
    contacts?.whatsapp_template ||
    "Halo Tim ION Broadband, saya ingin melaporkan kendala koneksi internet pada layanan saya.";

  if (customerNumber && !defaultTemplate.includes(customerNumber)) {
    defaultTemplate += ` (ID Pelanggan: ${customerNumber})`;
  }

  const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(defaultTemplate)}`;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title=""
      className="max-w-md p-0 overflow-hidden rounded-2xl border-none shadow-2xl"
    >
      {/* Visual Top Header */}
      <div className="bg-gradient-to-br from-[#1E3785] via-blue-900 to-indigo-950 p-6 text-white text-center relative">
        <div className="mx-auto mb-3 inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 shadow-inner">
          <Headphones className="h-7 w-7" />
        </div>
        <h3 className="text-base sm:text-lg font-bold tracking-tight">{title}</h3>
        <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-medium text-blue-100 border border-white/10">
          <Clock className="h-3 w-3 text-amber-300" />
          <span>{operationalHours}</span>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-6 space-y-5 bg-white">
        <p className="text-xs text-slate-600 text-center leading-relaxed">
          {message}
        </p>

        <div className="space-y-3">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
            Saluran Bantuan Darurat 24 Jam
          </div>

          {/* Hotline / Call Center Button */}
          <a
            href={`tel:${hotline}`}
            className="flex items-center justify-between p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:border-[#1E3785] transition-all group shadow-2xs cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#1E3785] text-white flex items-center justify-center shrink-0 shadow-xs">
                <PhoneCall className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 group-hover:text-[#1E3785] transition-colors">
                  Call Center / Hotline Bebas Pulsa
                </div>
                <div className="text-xs text-[#1E3785] font-extrabold tracking-wide">
                  {hotline}
                </div>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-[#1E3785] transition-colors" />
          </a>

          {/* WhatsApp Dukungan Teknis Button */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-600 transition-all group shadow-2xs cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Chat WhatsApp Dukungan Teknis
                </div>
                <div className="text-xs text-emerald-700 font-extrabold tracking-wide">
                  +{cleanWa}
                </div>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-emerald-700 transition-colors" />
          </a>
        </div>

        {/* Footer Dismiss Button */}
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="w-full text-xs text-slate-600 hover:text-slate-900 border-slate-200 py-2.5 rounded-xl font-medium"
          >
            Tutup & Kembali ke Beranda
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
