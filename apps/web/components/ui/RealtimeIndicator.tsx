"use client";

import React from "react";
import { useRealtimeStore } from "../../stores/realtimeStore";
import { reconnectEcho } from "../../lib/realtime/client";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

interface RealtimeIndicatorProps {
  showLabel?: boolean;
  className?: string;
}

export function RealtimeIndicator({ showLabel = true, className = "" }: RealtimeIndicatorProps) {
  const { status, error } = useRealtimeStore();

  const handleReconnect = () => {
    reconnectEcho();
  };

  if (status === "connected") {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium transition-all ${className}`}
        title="Terhubung ke server Reverb WebSocket secara realtime"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        {showLabel && <span>Live Realtime</span>}
      </div>
    );
  }

  if (status === "connecting") {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-medium transition-all ${className}`}
        title="Sedang menghubungkan ke server WebSocket..."
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
        </span>
        {showLabel && <span>Menghubungkan...</span>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleReconnect}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 text-[11px] font-medium transition-all cursor-pointer ${className}`}
      title={error ? `${error} (Klik untuk menyambungkan ulang)` : "Koneksi terputus. Klik untuk menyambungkan ulang"}
    >
      <span className="h-2 w-2 rounded-full bg-red-500" />
      {showLabel && <span>Offline (Sambungkan)</span>}
      <RefreshCw className="h-3 w-3 ml-0.5 opacity-70" />
    </button>
  );
}
