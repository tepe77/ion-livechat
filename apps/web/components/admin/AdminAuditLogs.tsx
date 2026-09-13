"use client";

import React, { useEffect, useState } from "react";
import type { AuditLog } from "@ion/types";
import { getAuditLogs } from "../../lib/api/admin";
import { formatDate, formatTime } from "../../lib/utils";
import { Activity, Clock } from "lucide-react";

export function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    getAuditLogs({ page: 1 })
      .then((res) => setLogs(res.data))
      .catch((err) => console.error("Failed to load audit logs", err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Audit Log Sistem</h3>
        <p className="text-xs text-slate-500">Jejak rekaman aktivitas keamanan dan operasional yang tidak dapat dimanipulasi</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Aktor</th>
                <th className="px-4 py-3">Aktivitas</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">IP & User Agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    Memuat audit log...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    Belum ada rekaman audit log.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(log.created_at)}, {formatTime(log.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{log.actor?.name || "System"}</div>
                      <div className="text-[10px] text-slate-400">{log.actor?.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-mono font-medium text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                        <Activity className="h-3 w-3 text-[#023E8A]" />
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {log.target_type && (
                        <span>
                          {log.target_type} #{log.target_id}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[11px] max-w-xs truncate">
                      {log.ip_address || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
