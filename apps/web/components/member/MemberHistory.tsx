"use client";

import React, { useEffect, useState } from "react";
import type { Conversation } from "@ion/types";
import { getConversations, deleteConversation } from "../../lib/api/conversations";
import { formatDate, formatTime } from "../../lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import {
  MessageSquare,
  Clock,
  Headphones,
  ChevronRight,
  Star,
  Trash2,
  Search,
} from "lucide-react";

interface MemberHistoryProps {
  onSelectConversation: (conv: Conversation) => void;
  onStartNewChat: () => void;
  selectedConversationId?: number;
  onDeleteConversation?: (convId: number) => void;
}

export function MemberHistory({
  onSelectConversation,
  onStartNewChat,
  selectedConversationId,
  onDeleteConversation,
}: MemberHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Deletion state
  const [convToDelete, setConvToDelete] = useState<Conversation | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    getConversations({ per_page: 50 })
      .then((res) => setConversations(res.data))
      .catch((err) => console.error("Failed to load history", err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleConfirmDelete = async () => {
    if (!convToDelete) return;
    setIsDeleting(true);
    try {
      await deleteConversation(convToDelete.id);
      setConversations((prev) => prev.filter((c) => c.id !== convToDelete.id));
      onDeleteConversation?.(convToDelete.id);
      setConvToDelete(null);
    } catch (err: any) {
      console.error("Failed to delete conversation", err);
      alert("Gagal menghapus percakapan: " + (err.message || "Terjadi kesalahan."));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const agentName = c.agent?.name?.toLowerCase() || "";
    const lastMsg = c.latest_message?.content?.toLowerCase() || "";
    const id = String(c.id);
    return agentName.includes(query) || lastMsg.includes(query) || id.includes(query);
  });

  return (
    <div className="flex flex-col h-full w-full bg-white">
      {/* Header */}
      <header className="px-4 py-3 bg-white border-b border-slate-200 shrink-0 space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-slate-900">Riwayat Percakapan</h1>
            <p className="text-[11px] text-slate-500">
              {conversations.length} sesi konsultasi lampau
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={onStartNewChat}
            className="text-xs bg-[#1E3785] hover:bg-[#162B6B] py-1 px-3"
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1" /> Chat Baru
          </Button>
        </div>

        {/* Search Bar */}
        {conversations.length > 3 && (
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari sesi atau teknisi..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#1E3785] focus:bg-white transition-colors"
            />
          </div>
        )}
      </header>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {isLoading ? (
          <div className="space-y-2.5 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="inline-flex items-center justify-center h-11 w-11 rounded-full bg-blue-50 text-[#1E3785] mb-2.5">
              <Headphones className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-bold text-slate-800">Belum ada riwayat percakapan</h3>
            <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
              Percakapan bantuan yang telah selesai akan tercatat secara rapi di sini.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={onStartNewChat}
              className="mt-3 text-xs bg-[#1E3785] hover:bg-[#162B6B]"
            >
              Mulai Chat Pertama
            </Button>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            Tidak ditemukan riwayat yang sesuai pencarian.
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = selectedConversationId === conv.id;

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv)}
                className={`group p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                  isSelected
                    ? "bg-blue-50/70 border-[#1E3785] shadow-xs"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                }`}
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {conv.agent?.name || "Customer Service ION"}
                    </span>
                    <Badge variant={conv.status as any} className="text-[10px] py-0 px-1.5">
                      {conv.status === "active" && "Berlangsung"}
                      {conv.status === "waiting" && "Antrean"}
                      {conv.status === "assigned" && "Terhubung"}
                      {conv.status === "closed" && "Selesai"}
                    </Badge>
                  </div>

                  {conv.latest_message && (
                    <p className="text-[11px] text-slate-600 truncate">
                      {conv.latest_message.content || "[Lampiran file]"}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatDate(conv.started_at)},{" "}
                      {formatTime(conv.started_at)}
                    </span>
                    {conv.rating && (
                      <span className="flex items-center gap-0.5 text-amber-600 font-semibold">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                        {conv.rating.rating}/5
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConvToDelete(conv);
                    }}
                    className="opacity-60 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Hapus dari riwayat"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  <ChevronRight
                    className={`h-4 w-4 transition-colors ${
                      isSelected ? "text-[#1E3785]" : "text-slate-300 group-hover:text-slate-500"
                    }`}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog
        isOpen={!!convToDelete}
        onClose={() => !isDeleting && setConvToDelete(null)}
        title="Hapus Riwayat Percakapan?"
        description="Konfirmasi penghapusan percakapan dari daftar riwayat."
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Apakah Anda yakin ingin menghapus riwayat sesi chat{" "}
            <strong>#{convToDelete?.id}</strong>? Seluruh catatan obrolan dan lampiran akan dihapus
            secara permanen.
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isDeleting}
              onClick={() => setConvToDelete(null)}
              className="text-xs text-slate-600"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={handleConfirmDelete}
              className="text-xs bg-red-600 hover:bg-red-700 text-white shadow-xs"
            >
              Ya, Hapus
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
