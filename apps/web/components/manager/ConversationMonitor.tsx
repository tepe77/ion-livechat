"use client";

import React, { useEffect, useState } from "react";
import type { Conversation } from "@ion/types";
import { getMonitoredConversations } from "../../lib/api/manager";
import { Badge } from "../ui/Badge";
import { Pagination } from "../ui/Pagination";
import { formatDate, formatTime } from "../../lib/utils";
import { Filter, Star, Clock } from "lucide-react";

export function ConversationMonitor() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(20);
  const [totalConversations, setTotalConversations] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchConversations = (targetPage = page, targetPerPage = perPage) => {
    setIsLoading(true);
    getMonitoredConversations({
      status: statusFilter || undefined,
      page: targetPage,
      per_page: targetPerPage,
    })
      .then((res) => {
        setConversations(res.data);
        setTotalConversations(res.meta.total);
        setTotalPages(res.meta.last_page || Math.ceil(res.meta.total / targetPerPage) || 1);
      })
      .catch((err) => console.error("Failed to load monitored conversations", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    setPage(1);
    fetchConversations(1, perPage);
  }, [statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Monitoring Percakapan Sistem</h3>
          <p className="text-xs text-slate-500">Seluruh percakapan yang masuk dan sedang berjalan</p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-medium rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1E4ED8]"
          >
            <option value="">Semua Status</option>
            <option value="waiting">Menunggu Antrean</option>
            <option value="assigned">Assigned</option>
            <option value="active">Aktif</option>
            <option value="closed">Selesai</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Pelanggan / Member</th>
                <th className="px-4 py-3">Agen CS</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Pesan Terakhir</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Waktu Mulai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Memuat daftar percakapan...
                  </td>
                </tr>
              ) : conversations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Tidak ada percakapan ditemukan.
                  </td>
                </tr>
              ) : (
                conversations.map((conv) => (
                  <tr key={conv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-500">#{conv.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">
                        {conv.member?.name || `User #${conv.member_id}`}
                      </div>
                      <div className="text-[11px] text-slate-400">{conv.member?.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {conv.agent ? (
                        <div className="font-medium text-slate-800">{conv.agent.name}</div>
                      ) : (
                        <span className="text-slate-400 italic">Belum di-assign</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={conv.status as any}>
                        {conv.status === "active" && "Aktif"}
                        {conv.status === "waiting" && "Waiting"}
                        {conv.status === "assigned" && "Assigned"}
                        {conv.status === "closed" && "Closed"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-600">
                      {conv.latest_message?.content || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {conv.rating ? (
                        <div className="flex items-center gap-1 font-semibold text-amber-500">
                          <Star className="h-3.5 w-3.5 fill-amber-400" />
                          <span>{conv.rating.rating}/5</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(conv.started_at)}, {formatTime(conv.started_at)}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalConversations}
          perPage={perPage}
          isLoading={isLoading}
          onPageChange={(newPage) => {
            setPage(newPage);
            fetchConversations(newPage, perPage);
          }}
          onPerPageChange={(newPerPage) => {
            setPerPage(newPerPage);
            setPage(1);
            fetchConversations(1, newPerPage);
          }}
          perPageOptions={[10, 20, 50]}
        />
      </div>
    </div>
  );
}
