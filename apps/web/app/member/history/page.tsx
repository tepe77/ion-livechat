"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "../../../stores/authStore";
import { MemberHistory } from "../../../components/member/MemberHistory";
import { getConversation, deleteConversation } from "../../../lib/api/conversations";
import { getMessages } from "../../../lib/api/messages";
import { formatDateTime, formatTime } from "../../../lib/utils";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Dialog } from "../../../components/ui/Dialog";
import { MemberProfileDropdown } from "../../../components/member/MemberProfileDropdown";
import { RatingStars } from "../../../components/ui/RatingStars";
import type { Conversation, Message } from "@ion/types";
import {
  ArrowLeft,
  Headphones,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  FileText,
  Loader2,
  Trash2,
} from "lucide-react";

export default function MemberHistoryPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [convToDelete, setConvToDelete] = useState<Conversation | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [user, isInitialized, router]);

  const handleSelectConversation = async (conv: Conversation) => {
    setSelectedConv(conv);
    setLoadingMessages(true);
    try {
      const fullConv = await getConversation(conv.id);
      setSelectedConv(fullConv);
      const res = await getMessages(conv.id, { limit: 100 });
      setMessages(res.data.reverse());
    } catch (err) {
      console.error("Failed to load conversation details", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleDeleteActiveConv = async () => {
    if (!convToDelete) return;
    setIsDeleting(true);
    try {
      await deleteConversation(convToDelete.id);
      if (selectedConv?.id === convToDelete.id) {
        setSelectedConv(null);
        setMessages([]);
      }
      setConvToDelete(null);
      // Reload page or let state update
      router.refresh();
    } catch (err: any) {
      console.error("Failed to delete conversation", err);
      alert("Gagal menghapus percakapan: " + (err.message || "Terjadi kesalahan."));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/member">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-600 gap-1.5 text-xs -ml-2 hover:bg-slate-100"
              title="Kembali ke Beranda Pelanggan"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Beranda Portal</span>
            </Button>
          </Link>

          <div className="h-4 w-px bg-slate-200" />

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#023E8A] text-white flex items-center justify-center">
              <Headphones className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Riwayat Layanan Live Chat</div>
              <div className="text-[11px] text-slate-500">Transkrip Percakapan Selesai & Bantuan</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/member/chat">
            <Button variant="primary" size="sm" className="text-xs bg-[#023E8A] hover:bg-[#034A9B]">
              Buka Chat Aktif
            </Button>
          </Link>

          <div className="h-4 w-px bg-slate-200" />

          <MemberProfileDropdown />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-4 lg:p-6 grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left Column: Conversation List */}
        <div className="md:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[calc(100dvh-5.5rem)] flex flex-col">
          <MemberHistory
            onSelectConversation={handleSelectConversation}
            onStartNewChat={() => router.push("/member/chat")}
            selectedConversationId={selectedConv?.id}
            onDeleteConversation={(deletedId) => {
              if (selectedConv?.id === deletedId) {
                setSelectedConv(null);
                setMessages([]);
              }
            }}
          />
        </div>

        {/* Right Column: Selected Transcript */}
        <div className="hidden md:flex md:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[calc(100dvh-5.5rem)] flex-col">
          {selectedConv ? (
            <div className="flex flex-col h-full">
              {/* Detail Header */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/70">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">
                      Sesi #{selectedConv.id}
                    </span>
                    <Badge variant={selectedConv.status}>
                      {selectedConv.status === "closed"
                        ? "Selesai"
                        : selectedConv.status === "active"
                        ? "Aktif"
                        : selectedConv.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDateTime(selectedConv.created_at)}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConvToDelete(selectedConv)}
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 p-1.5 h-8 w-8 rounded-lg"
                      title="Hapus percakapan ini dari riwayat"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-2 text-xs text-slate-600 flex items-center justify-between">
                  <span>
                    Dilayani oleh:{" "}
                    <strong className="text-slate-800">
                      {selectedConv.agent?.name || "Petugas Customer Service ION"}
                    </strong>
                  </span>
                  {selectedConv.rating && (
                    <div className="flex items-center gap-1">
                      <RatingStars value={selectedConv.rating.rating} size="sm" readonly />
                      <span className="text-amber-700 font-bold ml-1">
                        {selectedConv.rating.rating}/5
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Message History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 text-[#023E8A] animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400">
                    Tidak ada riwayat pesan untuk percakapan ini.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isUser = msg.sender_id === user?.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs ${
                            isUser
                              ? "bg-[#023E8A] text-white rounded-br-xs"
                              : "bg-white text-slate-800 border border-slate-200 rounded-bl-xs shadow-2xs"
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-1.5 pt-1 border-t border-black/10">
                              {msg.attachments.map((att) => (
                                <a
                                  key={att.id}
                                  href={att.url || "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 hover:underline font-medium"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                  <span className="truncate max-w-[180px]">{att.original_name}</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-2">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <Headphones className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">Pilih Percakapan</p>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Klik salah satu tiket obrolan di sebelah kiri untuk membaca kembali transkrip
                bantuan teknis dan ulasan layanan.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal for Selected Conversation */}
      <Dialog
        isOpen={!!convToDelete}
        onClose={() => !isDeleting && setConvToDelete(null)}
        title="Hapus Riwayat Percakapan?"
        description="Konfirmasi penghapusan percakapan dari database."
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Apakah Anda yakin ingin menghapus sesi chat <strong>#{convToDelete?.id}</strong>? Seluruh
            transkrip obrolan dan riwayat tiket akan dihapus secara permanen.
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
              onClick={handleDeleteActiveConv}
              className="text-xs bg-red-600 hover:bg-red-700 text-white shadow-xs"
            >
              Ya, Hapus Percakapan
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
