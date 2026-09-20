"use client";

import React from "react";
import {
  User,
  ShieldCheck,
  MessageSquare,
  ArrowRight,
  Loader2,
  Wrench,
  Wifi,
  FileText,
  Sparkles,
} from "lucide-react";
import { cn } from "../../lib/utils";

export interface MemberOnboardingCardProps {
  customerName?: string | null;
  customerNumber?: string | null;
  onStartChat?: () => void;
  isStartingChat?: boolean;
  hasActiveChat?: boolean;
  activeConvId?: number;
  hasOnlineAgents?: boolean;
  className?: string;
}

export function MemberOnboardingCard({
  customerName,
  customerNumber,
  onStartChat,
  isStartingChat = false,
  hasActiveChat = false,
  activeConvId,
  hasOnlineAgents = true,
  className,
}: MemberOnboardingCardProps) {
  const displayName = customerName && customerName.trim().length > 0 ? customerName : "Pelanggan";
  const displayCustomerNumber = customerNumber && customerNumber.trim().length > 0 ? customerNumber : "ION-000000";

  return (
    <section
      aria-label="Panel Onboarding Pelanggan ION Broadband"
      className={cn(
        "relative w-full rounded-[20px] sm:rounded-[24px] overflow-hidden shadow-xl text-white",
        // Multi-layered depth styling centered around brand primary #023E8A
        "bg-[#023E8A] border border-[#0757AE]/50",
        className
      )}
      style={{
        backgroundColor: "#023E8A",
      }}
    >
      {/* 
        Layered Background Elements for Depth:
        1. Deep dark-blue base shading (#012A5C)
        2. Soft secondary blue accents (#0757AE & #3B82F6)
        3. Subtle geometric & curved wave lines
      */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Deep navy vignette at bottom-left */}
        <div
          className="absolute -bottom-24 -left-16 w-80 h-80 rounded-full opacity-60 blur-2xl"
          style={{ backgroundColor: "#012A5C" }}
        />

        {/* Secondary blue ambient sphere at upper right */}
        <div
          className="absolute -top-24 -right-16 w-96 h-96 rounded-full opacity-45 blur-3xl"
          style={{ backgroundColor: "#0757AE" }}
        />

        {/* Soft cyan-blue focal glow behind illustration */}
        <div
          className="absolute right-4 top-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-25 blur-3xl"
          style={{ backgroundColor: "#3B82F6" }}
        />

        {/* Subtle decorative curved background contours */}
        <svg
          className="absolute inset-0 w-full h-full opacity-10"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1000 360"
          preserveAspectRatio="none"
        >
          <path
            d="M-50,180 C200,60 450,260 750,140 C880,90 980,160 1050,120 L1050,400 L-50,400 Z"
            fill="#0757AE"
          />
          <path
            d="M-50,260 C250,140 500,320 800,200 C920,150 1000,210 1050,180"
            stroke="#60A5FA"
            strokeWidth="1.5"
            fill="none"
            strokeDasharray="6 6"
          />
        </svg>

        {/* Mobile Blended Watermark Illustration in Background (< lg) */}
        <div
          className="lg:hidden absolute -right-4 -bottom-4 sm:-right-2 sm:-bottom-2 w-[210px] xs:w-[240px] sm:w-[290px] aspect-[660/580] pointer-events-none select-none z-0 opacity-25 sm:opacity-30 [mask-image:linear-gradient(to_left,rgba(0,0,0,1)_35%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_left,rgba(0,0,0,1)_35%,transparent_100%)]"
          aria-hidden="true"
        >
          <picture className="w-full h-full">
            <source
              srcSet="/images/member-onboarding-mobile.webp"
              type="image/webp"
            />
            <img
              src="/images/member-onboarding-mobile.png"
              alt=""
              className="w-full h-full object-contain object-bottom-right"
              loading="eager"
            />
          </picture>
        </div>

        {/* Ambient floating sparkle particles */}
        <div className="absolute top-6 left-1/3 text-blue-200/20">
          <Sparkles className="w-5 h-5" />
        </div>
      </div>

      {/* Main Content Layout Container */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8 p-5 sm:p-7 md:p-8 lg:p-9">
        {/* Left Side: Metadata & Status Badges, Greeting, Description, Feature Indicators, Action CTA */}
        <div className="w-full lg:w-[52%] xl:w-[54%] space-y-3.5 sm:space-y-4 text-left">
          {/* Metadata Row: Customer ID & Realtime Agent Presence Status */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Customer Number Box */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 shadow-2xs">
              <div className="w-5 h-5 rounded-md bg-white/15 flex items-center justify-center text-blue-200 shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-baseline gap-1.5 text-xs">
                <span className="text-blue-200/90 text-[11px] font-medium">No. Pelanggan:</span>
                <span className="font-mono font-bold text-white tracking-wider">
                  {displayCustomerNumber}
                </span>
              </div>
            </div>

            {/* Realtime Agent Status Badge */}
            {hasActiveChat ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-amber-400 text-slate-950 shadow-xs">
                <span className="h-2 w-2 rounded-full bg-amber-700 animate-ping" />
                Sesi Chat Aktif {activeConvId ? `(#${activeConvId})` : ""}
              </span>
            ) : hasOnlineAgents === false ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-amber-500/20 text-amber-200 border border-amber-400/30">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Offline (Hotline 24 Jam)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Teknisi Siap Membantu
              </span>
            )}
          </div>

          {/* Greeting Typography */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-white tracking-tight leading-tight sm:leading-snug">
              Halo, <span className="font-extrabold text-white">{displayName}</span>! 👋
            </h1>
          </div>

          {/* Description Copy */}
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-xl font-normal">
            Selamat datang di Pusat Dukungan Pelanggan ION Broadband Livechat. Butuh panduan teknis,
            pemeriksaan router ONT, atau informasi tagihan? Tim kami siap melayani Anda secara realtime.
          </p>

          {/* Feature Support Indicators (shown on sm+ screens to keep mobile card compact & focused) */}
          <div className="pt-0.5 hidden sm:flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-[11px] font-medium text-blue-100 shadow-2xs">
              <Wrench className="w-3 h-3 text-blue-300 shrink-0" />
              <span>Panduan Teknis</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-[11px] font-medium text-blue-100 shadow-2xs">
              <Wifi className="w-3 h-3 text-blue-300 shrink-0" />
              <span>Pemeriksaan Router ONT</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-[11px] font-medium text-blue-100 shadow-2xs">
              <FileText className="w-3 h-3 text-blue-300 shrink-0" />
              <span>Informasi Tagihan</span>
            </div>
          </div>

          {/* Action Button CTA */}
          {onStartChat && (
            <div className="pt-2 sm:pt-3 flex flex-col sm:flex-row sm:items-center gap-2.5">
              <button
                type="button"
                onClick={onStartChat}
                disabled={isStartingChat}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 min-h-[44px] rounded-xl bg-white text-[#023E8A] hover:bg-blue-50 font-bold text-xs sm:text-sm transition-all duration-150 shadow-md hover:shadow-lg active:scale-98 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed group focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                {isStartingChat ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#023E8A]" />
                    <span>Menghubungkan ke CS...</span>
                  </>
                ) : hasActiveChat ? (
                  <>
                    <MessageSquare className="w-4 h-4 text-[#023E8A]" />
                    <span>Lanjutkan Sesi Chat Aktif</span>
                    <ArrowRight className="w-4 h-4 text-[#023E8A] transition-transform group-hover:translate-x-0.5" />
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 text-[#023E8A]" />
                    <span>Mulai Chat dengan CS</span>
                    <ArrowRight className="w-4 h-4 text-[#023E8A] transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>

              <span className="text-[11px] text-blue-200/80">
                Terhubung otomatis via Smart Routing
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Desktop-Only Dedicated 3D Vector Illustration Asset (hidden on mobile to prevent stacking under button) */}
        <div className="hidden lg:flex lg:w-[48%] xl:w-[46%] items-center justify-end shrink-0">
          <div className="relative w-full max-w-[420px] xl:max-w-[460px] aspect-[1024/682] flex items-center justify-center">
            {/* Subtle soft backdrop radial bloom for high-contrast separation */}
            <div
              className="absolute inset-4 rounded-full opacity-35 blur-2xl pointer-events-none"
              style={{ backgroundColor: "#3B82F6" }}
            />

            <picture className="relative z-10 w-full h-full flex items-center justify-center drop-shadow-2xl">
              <source
                srcSet="/images/member-onboarding.webp"
                type="image/webp"
              />
              <img
                src="/images/member-onboarding.png"
                alt="Ilustrasi Dukungan Pelanggan ION Broadband"
                className="w-full h-full object-contain select-none pointer-events-none transition-transform duration-300 hover:scale-[1.01]"
                loading="eager"
              />
            </picture>
          </div>
        </div>
      </div>
    </section>
  );
}
