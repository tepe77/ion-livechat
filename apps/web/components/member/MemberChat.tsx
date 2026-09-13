"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Conversation, Message } from "@ion/types";
import { getMessages, markMessageRead, sendMessage } from "../../lib/api/messages";
import { closeConversation, startConversation } from "../../lib/api/conversations";
import { getEcho } from "../../lib/realtime/client";
import { formatTime, cn, getAttachmentUrl } from "../../lib/utils";
import { useAuthStore } from "../../stores/authStore";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { MemberRatingDialog } from "./MemberRatingDialog";
import {
  Send,
  Paperclip,
  Check,
  CheckCheck,
  FileText,
  Image as ImageIcon,
  Video,
  Headphones,
  XCircle,
  Clock,
  Sparkles,
  Wifi,
  ShieldCheck,
  AlertCircle,
  X,
} from "lucide-react";

interface MemberChatProps {
  conversation: Conversation;
  onConversationEnded?: () => void;
  onStartNewChat?: () => void;
}

export function MemberChat({
  conversation: initialConversation,
  onConversationEnded,
  onStartNewChat,
}: MemberChatProps) {
  const { user } = useAuthStore();
  const [conversation, setConversation] = useState<Conversation>(initialConversation);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputContent, setInputContent] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isAgentTyping, setIsAgentTyping] = useState<boolean>(false);
  const [showRatingDialog, setShowRatingDialog] = useState<boolean>(false);
  const [showConfirmClose, setShowConfirmClose] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [hasRated, setHasRated] = useState<boolean>(false);
  const [isStartingNew, setIsStartingNew] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setConversation(initialConversation);
    setHasRated(false);
  }, [initialConversation]);

  // Object preview for selected image
  useEffect(() => {
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  // Close attachment menu on outside click
  const attachmentMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
        setAttachmentMenuOpen(false);
      }
    }
    if (attachmentMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [attachmentMenuOpen]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    const isImageExt = /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!validTypes.includes(file.type) && !isImageExt) {
      alert("Format foto tidak didukung. Silakan pilih gambar dengan format JPG, JPEG, PNG, atau WEBP.");
      return;
    }

    // Max 1MB
    if (file.size > 1024 * 1024) {
      alert(`Ukuran foto terlalu besar (${(file.size / (1024 * 1024)).toFixed(2)} MB). Maksimal ukuran foto adalah 1MB.`);
      return;
    }

    setSelectedFile(file);
    setAttachmentMenuOpen(false);
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const validTypes = ["video/mp4", "video/webm", "video/quicktime"];
    const isVideoExt = /\.(mp4|webm|mov)$/i.test(file.name);
    if (!validTypes.includes(file.type) && !isVideoExt) {
      alert("Format video tidak didukung. Silakan pilih video dengan format MP4, WebM, atau MOV.");
      return;
    }

    // Max 50MB
    if (file.size > 50 * 1024 * 1024) {
      alert(`Ukuran video terlalu besar (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maksimal ukuran video adalah 50MB.`);
      return;
    }

    setSelectedFile(file);
    setAttachmentMenuOpen(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Fetch initial message history
  useEffect(() => {
    let isMounted = true;
    getMessages(conversation.id)
      .then((res) => {
        if (isMounted) {
          setMessages(res.data);
          scrollToBottom();
        }
      })
      .catch((err) => console.error("Failed to load messages", err));

    return () => {
      isMounted = false;
    };
  }, [conversation.id]);

  // 2. Subscribe to WebSocket Private Channel
  useEffect(() => {
    const echo = getEcho();
    if (!echo) return;

    const channelName = `conversation.${conversation.id}`;
    const channel = echo.private(channelName);

    // Realtime message incoming
    channel.listen(".message.created", (payload: any) => {
      const msg: Message = payload.message || payload;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      scrollToBottom();

      // If message is from someone else, mark as read
      if (user && msg.sender_id !== user.id) {
        markMessageRead(conversation.id, msg.id).catch(() => {});
      }
    });

    // Realtime read receipts
    channel.listen(".message.read", (payload: { message_id: number; read_at: string }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === payload.message_id ? { ...m, read_at: payload.read_at } : m))
      );
    });

    // Conversation assigned to an agent
    channel.listen(".conversation.assigned", (payload: any) => {
      setConversation((prev) => ({
        ...prev,
        status: "assigned",
        agent_id: payload.agent?.id || prev.agent_id,
        agent: payload.agent || prev.agent,
      }));
    });

    // Conversation transferred
    channel.listen(".conversation.transferred", (payload: any) => {
      setConversation((prev) => ({
        ...prev,
        agent_id: payload.agent?.id || prev.agent_id,
        agent: payload.agent || prev.agent,
      }));
    });

    // Conversation closed
    channel.listen(".conversation.closed", () => {
      setConversation((prev) => ({
        ...prev,
        status: "closed",
        closed_at: new Date().toISOString(),
      }));
      setShowRatingDialog(true);
    });

    // Typing whisper events
    channel.listenForWhisper("typing", (e: { isTyping: boolean; senderRole: string }) => {
      if (e.senderRole === "agent") {
        setIsAgentTyping(e.isTyping);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (e.isTyping) {
          typingTimeoutRef.current = setTimeout(() => setIsAgentTyping(false), 3000);
        }
      }
    });

    return () => {
      channel.stopListening(".message.created");
      channel.stopListening(".message.read");
      channel.stopListening(".conversation.assigned");
      channel.stopListening(".conversation.transferred");
      channel.stopListening(".conversation.closed");
      echo.leave(channelName);
    };
  }, [conversation.id, user]);

  // 3. Handle sending message with optimistic update
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const content = inputContent.trim();
    if (!content && !selectedFile) return;

    setIsSending(true);
    const tempContent = content;
    const tempFile = selectedFile;

    setInputContent("");
    setSelectedFile(null);

    try {
      const msgType = tempFile
        ? tempFile.type.startsWith("image/")
          ? "image"
          : tempFile.type.startsWith("video/")
          ? "video"
          : "file"
        : "text";

      const sent = await sendMessage(
        conversation.id,
        tempContent,
        msgType,
        tempFile ? [tempFile] : undefined
      );

      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });

      scrollToBottom();
    } catch (err: any) {
      console.error("Failed to send message", err);
      // Restore input on failure
      setInputContent(tempContent);
      setSelectedFile(tempFile);
      alert("Gagal mengirim pesan: " + (err.message || "Periksa koneksi Anda."));
    } finally {
      setIsSending(false);
    }
  };

  // 4. Handle typing indicator whisper
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputContent(e.target.value);

    const echo = getEcho();
    if (echo) {
      const channel = echo.private(`conversation.${conversation.id}`);
      channel.whisper("typing", { isTyping: true, senderRole: "member" });
    }
  };

  // 5. Quick prompt fill
  const handleQuickPrompt = (prompt: string) => {
    setInputContent(prompt);
  };

  // 6. Handle close conversation & start new chat
  const handleConfirmClose = async () => {
    setIsClosing(true);
    setCloseError(null);
    try {
      const closed = await closeConversation(conversation.id);
      setConversation(closed);
      setShowConfirmClose(false);
      setShowRatingDialog(true);
    } catch (err: any) {
      console.error("Failed to close conversation", err);
      setCloseError(err.message || "Gagal mengakhiri percakapan. Silakan coba kembali.");
    } finally {
      setIsClosing(false);
    }
  };

  const handleStartNewChat = async () => {
    if (onStartNewChat) {
      onStartNewChat();
      return;
    }
    setIsStartingNew(true);
    try {
      const newConv = await startConversation();
      setConversation(newConv);
      setMessages([]);
      setHasRated(false);
    } catch (err: any) {
      console.error("Failed to start new conversation", err);
      alert("Gagal memulai chat baru: " + (err.message || "Silakan muat ulang halaman."));
    } finally {
      setIsStartingNew(false);
    }
  };

  const isClosed = conversation.status === "closed";
  const isWaiting = conversation.status === "waiting";

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Top Conversation Header */}
      <header className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-slate-200 shrink-0 z-10">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="flex items-center justify-center h-11 w-11 rounded-2xl bg-gradient-to-tr from-[#023E8A] to-blue-600 text-white font-semibold shadow-xs">
              <Headphones className="h-6 w-6" />
            </div>
            {!isClosed && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                {conversation.agent?.name || "Customer Service ION"}
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-[#023E8A] border border-blue-100 hidden sm:inline">
                Dukungan Teknis ISP
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {isWaiting && (
                <span className="text-xs text-amber-700 font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3 animate-spin" /> Menghubungkan ke antrean agen...
                </span>
              )}
              {!isWaiting && !isClosed && (
                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Petugas sedang aktif di sesi ini
                </span>
              )}
              {isClosed && (
                <span className="text-xs text-slate-400 font-medium">Sesi Percakapan Selesai</span>
              )}
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-3">
          {!isClosed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConfirmClose(true)}
              disabled={isClosing}
              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200/90 bg-red-50/50 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all shadow-2xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title="Akhiri sesi percakapan ini"
            >
              <XCircle className="h-4 w-4" />
              <span>Akhiri Chat</span>
            </Button>
          )}
        </div>
      </header>

      {/* Waiting Status Alert Banner */}
      {isWaiting && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 px-5 py-3 text-xs text-amber-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold">Antrean FIFO Smart Routing:</span> Anda berada dalam antrean.
              Sistem akan otomatis menghubungkan Anda segera setelah teknisi tersedia.
            </div>
          </div>
          <span className="text-[11px] font-semibold bg-white/80 px-2.5 py-1 rounded-md border border-amber-200 text-amber-800 shrink-0 hidden md:inline">
            Status: Menunggu Petugas
          </span>
        </div>
      )}

      {/* Main Messages Stream Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/60">
        {/* Welcome Card Banner */}
        <div className="max-w-xl mx-auto p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs text-center space-y-2 mb-4">
          <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-blue-50 text-[#023E8A]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="text-xs sm:text-sm font-bold text-slate-900">
            Selamat Datang di Pusat Layanan Pelanggan ION
          </h2>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Sesi chat ini terenkripsi dan dilayani oleh representatif teknis resmi ION. Anda dapat
            melaporkan kendala koneksi, permintaan reset ONT, atau informasi tagihan.
          </p>
        </div>

        {/* Quick Question Prompts if conversation is fresh */}
        {messages.length < 3 && !isClosed && (
          <div className="max-w-xl mx-auto">
            <div className="text-[11px] font-semibold text-slate-400 mb-2 text-center uppercase tracking-wider">
              Pertanyaan Cepat Sering Ditanyakan
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickPrompt("Halo tim teknis, koneksi internet saya terasa lambat.")}
                className="text-left p-2.5 rounded-xl border border-slate-200 bg-white hover:border-[#023E8A] hover:bg-blue-50/50 text-xs text-slate-700 transition-all cursor-pointer"
              >
                ⚡ Internet terasa lambat
              </button>
              <button
                type="button"
                onClick={() => handleQuickPrompt("Lampu LOS pada modem ONT saya berkedip warna merah.")}
                className="text-left p-2.5 rounded-xl border border-slate-200 bg-white hover:border-[#023E8A] hover:bg-blue-50/50 text-xs text-slate-700 transition-all cursor-pointer"
              >
                🔴 Lampu LOS merah berkedip
              </button>
              <button
                type="button"
                onClick={() => handleQuickPrompt("Mohon bantuan untuk reset atau ganti kata sandi WiFi.")}
                className="text-left p-2.5 rounded-xl border border-slate-200 bg-white hover:border-[#023E8A] hover:bg-blue-50/50 text-xs text-slate-700 transition-all cursor-pointer"
              >
                🔑 Cara ganti password WiFi
              </button>
              <button
                type="button"
                onClick={() => handleQuickPrompt("Bagaimana cara mengecek status tagihan paket bulan ini?")}
                className="text-left p-2.5 rounded-xl border border-slate-200 bg-white hover:border-[#023E8A] hover:bg-blue-50/50 text-xs text-slate-700 transition-all cursor-pointer"
              >
                💳 Cek rincian tagihan
              </button>
            </div>
          </div>
        )}

        {/* Message Bubbles */}
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;

          return (
            <div
              key={msg.id}
              className={cn("flex flex-col group", isMe ? "items-end" : "items-start")}
            >
              {!isMe && (
                <span className="text-[10px] font-semibold text-slate-500 mb-1 px-1">
                  {msg.sender?.name || "Customer Service"}
                </span>
              )}

              <div
                className={cn(
                  "max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs transition-shadow",
                  isMe
                    ? "bg-[#023E8A] text-white rounded-br-xs font-normal"
                    : "bg-white text-slate-800 border border-slate-200 rounded-bl-xs shadow-2xs"
                )}
              >
                {/* Attachments Preview */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mb-2 space-y-2 pt-1">
                    {msg.attachments.map((att) => {
                      const fileUrl = getAttachmentUrl(att.url);
                      const isImage = att.mime_type?.startsWith("image/") || msg.type === "image";
                      const isVideo = att.mime_type?.startsWith("video/") || msg.type === "video";

                      if (isImage) {
                        return (
                          <div key={att.id} className="rounded-xl overflow-hidden border border-black/10 my-1 bg-black/5">
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" title="Klik untuk melihat foto ukuran penuh">
                              <img
                                src={fileUrl}
                                alt={att.original_name}
                                className="max-h-60 sm:max-h-72 w-auto object-cover rounded-xl hover:opacity-95 transition-opacity cursor-pointer"
                              />
                            </a>
                          </div>
                        );
                      }

                      if (isVideo) {
                        return (
                          <div key={att.id} className="rounded-xl overflow-hidden border border-black/10 my-1.5 bg-black/95">
                            <video
                              controls
                              playsInline
                              preload="metadata"
                              className="max-h-64 sm:max-h-72 w-full rounded-t-xl object-contain bg-black"
                              src={fileUrl}
                            >
                              Browser Anda tidak mendukung pemutaran video langsung.
                            </video>
                            <div className={cn(
                              "px-3 py-1.5 flex items-center justify-between text-[11px]",
                              isMe ? "bg-white/10 text-white" : "bg-slate-100 text-slate-700"
                            )}>
                              <div className="flex items-center gap-1.5 truncate max-w-[220px]">
                                <Video className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                                <span className="truncate">{att.original_name}</span>
                              </div>
                              <span className="opacity-75 font-mono text-[10px] shrink-0">{formatFileSize(att.size)}</span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <a
                          key={att.id}
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium border transition-colors",
                            isMe
                              ? "bg-white/10 hover:bg-white/20 border-white/20 text-white"
                              : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                          )}
                        >
                          <FileText className="h-4 w-4 shrink-0" />
                          <span className="truncate max-w-[200px]">{att.original_name}</span>
                          <span className="text-[10px] opacity-75 font-mono">({formatFileSize(att.size)})</span>
                        </a>
                      );
                    })}
                  </div>
                )}

                {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
              </div>

              {/* Timestamp and Read Status */}
              <div
                className={cn(
                  "flex items-center gap-1.5 text-[10px] text-slate-400 mt-1 px-1",
                  isMe ? "justify-end" : "justify-start"
                )}
              >
                <span>{formatTime(msg.created_at)}</span>
                {isMe && (
                  <span title={msg.read_at ? "Terbaca" : "Terkirim"}>
                    {msg.read_at ? (
                      <CheckCheck className="h-3.5 w-3.5 text-blue-600" />
                    ) : (
                      <Check className="h-3 w-3 text-slate-400" />
                    )}
                  </span>
                )}

              </div>
            </div>
          );
        })}

        {/* Realtime Agent Typing Indicator */}
        {isAgentTyping && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 rounded-full px-3.5 py-1.5 w-fit shadow-xs animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-[#023E8A] animate-bounce" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#023E8A] animate-bounce [animation-delay:0.2s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#023E8A] animate-bounce [animation-delay:0.4s]" />
            <span className="font-medium text-[11px] text-slate-600">
              {conversation.agent?.name || "Petugas CS"} sedang mengetik...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Selected File Preview Banner */}
      {selectedFile && (
        <div className="bg-blue-50/95 border-t border-blue-200 px-4 py-2 flex items-center justify-between text-xs text-slate-700 animate-in fade-in slide-in-from-bottom-1 duration-150">
          <div className="flex items-center gap-2.5 min-w-0">
            {selectedFile.type.startsWith("image/") ? (
              <div className="h-9 w-9 rounded-lg overflow-hidden border border-blue-300 bg-white shrink-0 shadow-2xs">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-blue-50 text-[#023E8A]">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                )}
              </div>
            ) : (
              <div className="h-9 w-9 rounded-lg border border-amber-300 bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-2xs">
                <Video className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0 truncate">
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded leading-none",
                  selectedFile.type.startsWith("image/") ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-800"
                )}>
                  {selectedFile.type.startsWith("image/") ? "Foto" : "Video"}
                </span>
                <span className="font-medium truncate text-slate-800 text-xs">{selectedFile.name}</span>
              </div>
              <span className="text-slate-400 text-[10px] font-mono">
                {formatFileSize(selectedFile.size)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedFile(null)}
            className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors shrink-0"
            title="Hapus lampiran"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Sticky Message Composer or Closed Banner */}
      <footer className="p-3.5 sm:p-4 bg-white border-t border-slate-200 shrink-0">
        {isClosed ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-1.5 px-1">
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-slate-800">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Sesi Percakapan Selesai
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {hasRated
                  ? "Terima kasih atas penilaian dan ulasan layanan Anda! ⭐"
                  : "Terima kasih telah menghubungi pusat bantuan ION Internet."}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {!hasRated && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRatingDialog(true)}
                  className="text-xs border-amber-300 bg-amber-50/60 text-amber-900 hover:bg-amber-100/70 font-semibold cursor-pointer"
                >
                  ⭐ Beri Penilaian Layanan
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={handleStartNewChat}
                isLoading={isStartingNew}
                className="text-xs bg-[#023E8A] hover:bg-[#034A9B] font-semibold shadow-xs cursor-pointer"
              >
                Mulai Chat Baru
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-center gap-2 sm:gap-3">
            {/* Attachment Button & Popover Submenu */}
            <div className="relative" ref={attachmentMenuRef}>
              <input
                type="file"
                ref={photoInputRef}
                onChange={handlePhotoSelect}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
              />
              <input
                type="file"
                ref={videoInputRef}
                onChange={handleVideoSelect}
                accept="video/mp4,video/webm,video/quicktime"
                className="hidden"
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setAttachmentMenuOpen((prev) => !prev)}
                className={cn(
                  "text-slate-500 hover:text-[#023E8A] hover:bg-blue-50 shrink-0 h-10 w-10 rounded-xl transition-all",
                  attachmentMenuOpen && "bg-blue-100 text-[#023E8A] ring-2 ring-[#023E8A]/20"
                )}
                title="Pilih lampiran foto atau video"
              >
                <Paperclip className="h-5 w-5" />
              </Button>

              {/* Submenu Popover */}
              {attachmentMenuOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
                    <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">Pilih Jenis Lampiran</p>
                    <p className="text-[10px] text-slate-400">Kirim foto keluhan atau rekaman kendala</p>
                  </div>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAttachmentMenuOpen(false);
                        photoInputRef.current?.click();
                      }}
                      className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left hover:bg-blue-50 transition-colors group cursor-pointer"
                    >
                      <div className="h-8 w-8 rounded-lg bg-blue-100 text-[#023E8A] group-hover:bg-[#023E8A] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-800 group-hover:text-[#023E8A]">Foto / Gambar</div>
                        <div className="text-[10px] text-slate-400">JPG, PNG, WEBP (Maks. 1MB)</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAttachmentMenuOpen(false);
                        videoInputRef.current?.click();
                      }}
                      className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left hover:bg-amber-50 transition-colors group cursor-pointer"
                    >
                      <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-800 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                        <Video className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-800 group-hover:text-amber-800">Video Rekaman</div>
                        <div className="text-[10px] text-slate-400">MP4, WebM, MOV (Maks. 50MB)</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <input
              type="text"
              value={inputContent}
              onChange={handleInputChange}
              placeholder="Tulis pesan atau keluhan Anda di sini..."
              className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#023E8A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#023E8A] transition-colors"
            />

            <Button
              type="submit"
              variant="primary"
              size="icon"
              isLoading={isSending}
              disabled={!inputContent.trim() && !selectedFile}
              className="rounded-xl h-10 w-10 shrink-0 bg-[#023E8A] hover:bg-[#034A9B] shadow-xs"
              title="Kirim pesan"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        )}
      </footer>

      {/* Confirm Close Dialog */}
      <Dialog
        isOpen={showConfirmClose}
        onClose={() => !isClosing && setShowConfirmClose(false)}
        title="Akhiri Sesi Chat?"
        description="Konfirmasi penyelesaian bantuan teknis dengan customer service."
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Apakah Anda yakin ingin mengakhiri sesi percakapan ini? Sesi akan ditutup dan Anda dapat memberikan penilaian kepuasan layanan atas bantuan teknis yang diberikan.
          </p>

          {closeError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
              {closeError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isClosing}
              onClick={() => setShowConfirmClose(false)}
              className="text-xs text-slate-600 hover:text-slate-800"
            >
              Lanjutkan Chat
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={isClosing}
              onClick={handleConfirmClose}
              className="text-xs bg-red-600 hover:bg-red-700 text-white shadow-xs"
            >
              Ya, Akhiri Chat
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Rating Dialog on Close */}
      <MemberRatingDialog
        isOpen={showRatingDialog}
        conversationId={conversation.id}
        agentName={conversation.agent?.name}
        onSubmitted={() => {
          setShowRatingDialog(false);
          setHasRated(true);
          onConversationEnded?.();
        }}
        onClose={() => {
          setShowRatingDialog(false);
          onConversationEnded?.();
        }}
      />
    </div>
  );
}
