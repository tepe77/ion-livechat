"use client";

import React, { useEffect, useState } from "react";
import type { Conversation, Message } from "@ion/types";
import { getMessages } from "../../lib/api/messages";
import { Dialog } from "./Dialog";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { formatDateTime, formatTime, getAttachmentUrl } from "../../lib/utils";
import {
  MessageSquare,
  Clock,
  User,
  Headphones,
  Star,
  FileText,
  Download,
  Loader2,
  Calendar,
  X,
  ExternalLink,
} from "lucide-react";

interface ConversationTranscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation | null;
}

export function ConversationTranscriptModal({
  isOpen,
  onClose,
  conversation,
}: ConversationTranscriptModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen && conversation?.id) {
      setIsLoading(true);
      getMessages(conversation.id, { limit: 100 })
        .then((res) => setMessages(res.data || []))
        .catch((err) => {
          console.error("Gagal memuat transkrip pesan:", err);
          setMessages([]);
        })
        .finally(() => setIsLoading(false));
    } else {
      setMessages([]);
    }
  }, [isOpen, conversation?.id]);

  if (!conversation) return null;

  const memberName = conversation.member?.name || `Pelanggan #${conversation.member_id}`;
  const memberCustomerNumber = conversation.member?.customer_number;
  const agentName = conversation.agent?.name || "Belum di-assign";

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Transkrip Percakapan Sesi #${conversation.id}`}
      description="Rekaman riwayat lengkap pesan, solusi teknis, dan evaluasi kepuasan pelanggan"
      className="max-w-2xl p-6"
    >
      <div className="space-y-4">
        {/* Sesi Overview Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs">
          {/* Member & Agent Info */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-700">
              <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-500">Pelanggan:</span>
              <strong className="font-semibold text-slate-900">{memberName}</strong>
              {memberCustomerNumber && (
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700">
                  {memberCustomerNumber}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              <Headphones className="h-3.5 w-3.5 text-[#023E8A] shrink-0" />
              <span className="text-slate-500">Petugas CS:</span>
              <strong className="font-semibold text-slate-900">{agentName}</strong>
            </div>
          </div>

          {/* Time & Rating Info */}
          <div className="space-y-1.5 sm:text-right">
            <div className="flex items-center sm:justify-end gap-1.5 text-slate-600">
              <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>Mulai: </span>
              <span className="font-medium text-slate-800">
                {conversation.started_at ? formatDateTime(conversation.started_at) : formatDateTime(conversation.created_at)}
              </span>
            </div>
            <div className="flex items-center sm:justify-end gap-2">
              <span className="text-slate-500">Status:</span>
              <Badge variant={conversation.status as any} className="capitalize">
                {conversation.status === "closed" ? "Selesai" : conversation.status}
              </Badge>
              {conversation.rating && (
                <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-[11px]">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                  {conversation.rating.rating}/5
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Rating feedback note if exists */}
        {conversation.rating?.comment && (
          <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200/70 text-xs text-amber-900 flex items-start gap-2">
            <Star className="h-4 w-4 fill-amber-400 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-[11px] uppercase tracking-wider text-amber-800">
                Ulasan Pelanggan:
              </div>
              <p className="italic mt-0.5">"{conversation.rating.comment}"</p>
            </div>
          </div>
        )}

        {/* Messages Stream Container */}
        <div className="h-[360px] overflow-y-auto p-4 space-y-3 bg-slate-100/60 rounded-2xl border border-slate-200">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-2 text-slate-400">
              <Loader2 className="h-6 w-6 text-[#023E8A] animate-spin" />
              <p className="text-xs">Memuat riwayat percakapan...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 space-y-1">
              <MessageSquare className="h-8 w-8 text-slate-300" />
              <p className="text-xs font-medium">Tidak ada rekaman pesan dalam sesi ini.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMember = msg.sender_id === conversation.member_id;
              const senderDisplayName = isMember
                ? memberName
                : (msg.sender?.name || agentName);

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMember ? "items-start" : "items-end"}`}
                >
                  <div className="text-[10px] text-slate-400 px-1 mb-1 font-medium">
                    {senderDisplayName} • {formatTime(msg.created_at)}
                  </div>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs ${
                      isMember
                        ? "bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs"
                        : "bg-[#023E8A] text-white rounded-tr-xs"
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                    {/* Attachments rendering */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 space-y-1.5 pt-1.5 border-t border-black/10">
                        {msg.attachments.map((att: any) => {
                          const fileUrl = getAttachmentUrl(att.file_path);
                          const isImg = att.mime_type?.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(att.file_name);
                          const isVid = att.mime_type?.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(att.file_name);

                          return (
                            <div key={att.id} className="pt-1">
                              {isImg ? (
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block overflow-hidden rounded-lg border border-black/10 hover:opacity-90 transition-opacity"
                                >
                                  <img
                                    src={fileUrl}
                                    alt={att.file_name}
                                    className="max-h-48 w-auto object-cover rounded-lg"
                                  />
                                </a>
                              ) : isVid ? (
                                <video
                                  src={fileUrl}
                                  controls
                                  className="max-h-52 w-full rounded-lg bg-black/40"
                                />
                              ) : (
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs underline font-medium"
                                >
                                  <FileText className="h-3.5 w-3.5 shrink-0" />
                                  <span>{att.file_name}</span>
                                  <Download className="h-3 w-3 shrink-0" />
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs text-slate-700 hover:bg-slate-100 min-h-[40px] px-5 rounded-xl font-medium"
          >
            Tutup Transkrip
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
