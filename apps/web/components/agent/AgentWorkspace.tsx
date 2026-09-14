"use client";

import React, { useEffect, useRef, useState } from "react";
import type { AgentAvailability, AgentStatus, Conversation, Message, User } from "@ion/types";
import { getAgentConversations, getAgentStatus, sendHeartbeat, updateAgentStatus } from "../../lib/api/agents";
import { getMessages, markMessageRead, sendMessage } from "../../lib/api/messages";
import { closeConversation } from "../../lib/api/conversations";
import { getEcho } from "../../lib/realtime/client";
import { formatTime, cn, getAttachmentUrl } from "../../lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { RealtimeIndicator } from "../ui/RealtimeIndicator";
import { TransferModal } from "./TransferModal";
import { AgentProfileDropdown } from "./AgentProfileDropdown";

import {
  Send,
  Paperclip,
  Check,
  CheckCheck,
  Headphones,
  User as UserIcon,
  XCircle,
  ArrowRightLeft,
  FileText,
  Clock,
  LogOut,
  AlertCircle,
  Image as ImageIcon,
  Video,
  X,
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore";

export function AgentWorkspace() {
  const { user, logout } = useAuthStore();
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputContent, setInputContent] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isMemberTyping, setIsMemberTyping] = useState<boolean>(false);
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [closedNotice, setClosedNotice] = useState<string | null>(null);
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});

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
  const selectedConversationRef = useRef<Conversation | null>(null);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

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

  // Auto-dismiss notice after 6 seconds
  useEffect(() => {
    if (closedNotice) {
      const timer = setTimeout(() => setClosedNotice(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [closedNotice]);

  // 1. Initial Data Fetch: Status & Conversations
  const refreshInbox = () => {
    getAgentConversations().then((res) => {
      setConversations(res.data);
      setUnreadCounts((prev) => {
        const next = { ...prev };
        res.data.forEach((c) => {
          if (c.unread_count !== undefined) {
            next[c.id] = c.unread_count;
          } else if (
            c.latest_message &&
            user &&
            c.latest_message.sender_id !== user.id &&
            !c.latest_message.read_at &&
            next[c.id] === undefined
          ) {
            next[c.id] = 1;
          }
        });
        return next;
      });
      setSelectedConversation((current) => {
        // If current active conversation was closed, clear selection
        if (current && !res.data.some((c) => c.id === current.id)) {
          return null;
        }
        return current;
      });
    });
    getAgentStatus().then((s) => setStatus(s));
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setUnreadCounts((prev) => {
      if (!prev[conv.id]) return prev;
      const next = { ...prev };
      delete next[conv.id];
      return next;
    });
  };

  useEffect(() => {
    refreshInbox();

    // 2. Heartbeat interval: send every 25 seconds
    const heartbeatInterval = setInterval(() => {
      sendHeartbeat().catch(() => {});
    }, 25000);

    return () => clearInterval(heartbeatInterval);
  }, []);

  // 3. Agent Personal Channel subscription
  useEffect(() => {
    if (!user) return;
    const echo = getEcho();
    if (!echo) return;

    const agentChannel = echo.private(`agent.${user.id}`);

    // New conversation assigned to this agent
    agentChannel.listen(".conversation.assigned", () => {
      refreshInbox();
    });

    // Conversation transferred to or from this agent
    agentChannel.listen(".conversation.transferred", () => {
      refreshInbox();
    });

    // Conversation closed (e.g. member ended the session)
    agentChannel.listen(".conversation.closed", (payload: { conversation_id: number }) => {
      const closedId = payload?.conversation_id;
      setConversations((prev) => prev.filter((c) => c.id !== closedId));
      setSelectedConversation((prev) => {
        if (prev && prev.id === closedId) {
          setClosedNotice(`Sesi obrolan #${closedId} telah diakhiri oleh pelanggan.`);
          setMessages([]);
          return null;
        }
        return prev;
      });
      refreshInbox();
    });

    agentChannel.listen(".agent.status.updated", (payload: AgentStatus) => {
      setStatus(payload);
    });

    // Realtime message notification on agent channel (cross-conversation)
    agentChannel.listen(".message.created", (payload: any) => {
      const msg: Message = payload.message || payload;
      const convMeta = payload.conversation;

      const isFromAgent =
        user &&
        (msg.sender_id === user.id ||
          msg.sender?.role === "agent" ||
          msg.sender?.role === "superadmin" ||
          msg.sender?.role === "manager");

      // Update conversations list in sidebar
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === msg.conversation_id);
        if (index === -1) {
          refreshInbox();
          return prev;
        }
        const updated = [...prev];
        const existing = updated[index];
        updated[index] = {
          ...existing,
          latest_message: msg,
          first_response_at:
            convMeta?.first_response_at ||
            existing.first_response_at ||
            (isFromAgent ? msg.created_at : existing.first_response_at),
          updated_at: msg.created_at,
        };
        return updated;
      });

      // Check against current active conversation
      const currentSelected = selectedConversationRef.current;
      if (currentSelected && currentSelected.id === msg.conversation_id) {
        setSelectedConversation((curr) => {
          if (!curr || curr.id !== msg.conversation_id) return curr;
          return {
            ...curr,
            latest_message: msg,
            first_response_at:
              convMeta?.first_response_at ||
              curr.first_response_at ||
              (isFromAgent ? msg.created_at : curr.first_response_at),
          };
        });

        // If from member, append message if not already present
        if (!isFromAgent) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          scrollToBottom();
          markMessageRead(msg.conversation_id, msg.id).catch(() => {});
        }
      } else if (!isFromAgent) {
        // From customer on another conversation -> increment unread badge
        setUnreadCounts((prev) => ({
          ...prev,
          [msg.conversation_id]: (prev[msg.conversation_id] || 0) + 1,
        }));
      }
    });

    return () => {
      agentChannel.stopListening(".conversation.assigned");
      agentChannel.stopListening(".conversation.transferred");
      agentChannel.stopListening(".conversation.closed");
      agentChannel.stopListening(".agent.status.updated");
      agentChannel.stopListening(".message.created");
      echo.leave(`agent.${user.id}`);
    };
  }, [user]);

  // 4. Active Conversation messages & Realtime
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    getMessages(selectedConversation.id).then((res) => {
      setMessages(res.data);
      scrollToBottom();
    });

    const echo = getEcho();
    if (!echo) return;

    const channelName = `conversation.${selectedConversation.id}`;
    const channel = echo.private(channelName);

    channel.listen(".message.created", (payload: any) => {
      const msg: Message = payload.message || payload;
      const convMeta = payload.conversation;

      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      scrollToBottom();

      const isFromAgent =
        user &&
        (msg.sender_id === user.id ||
          msg.sender?.role === "agent" ||
          msg.sender?.role === "superadmin" ||
          msg.sender?.role === "manager");

      // Sync selected conversation state
      setSelectedConversation((curr) => {
        if (!curr || curr.id !== selectedConversation.id) return curr;
        return {
          ...curr,
          latest_message: msg,
          first_response_at:
            convMeta?.first_response_at ||
            curr.first_response_at ||
            (isFromAgent ? msg.created_at : curr.first_response_at),
        };
      });

      // Sync conversations list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversation.id
            ? {
                ...c,
                latest_message: msg,
                first_response_at:
                  convMeta?.first_response_at ||
                  c.first_response_at ||
                  (isFromAgent ? msg.created_at : c.first_response_at),
                updated_at: msg.created_at,
              }
            : c
        )
      );

      // If message is from customer, mark as read
      if (user && msg.sender_id !== user.id) {
        markMessageRead(selectedConversation.id, msg.id).catch(() => {});
      }
    });


    channel.listen(".message.read", (payload: { message_id: number; read_at: string }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === payload.message_id ? { ...m, read_at: payload.read_at } : m))
      );
    });

    channel.listen(".conversation.closed", (payload: any) => {
      const closedId = payload?.conversation_id || selectedConversation.id;
      setClosedNotice(`Sesi obrolan #${closedId} telah diakhiri oleh pelanggan.`);
      setSelectedConversation(null);
      setMessages([]);
      refreshInbox();
    });

    channel.listenForWhisper("typing", (e: { isTyping: boolean; senderRole: string }) => {
      if (e.senderRole === "member") {
        setIsMemberTyping(e.isTyping);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (e.isTyping) {
          typingTimeoutRef.current = setTimeout(() => setIsMemberTyping(false), 3000);
        }
      }
    });

    return () => {
      channel.stopListening(".message.created");
      channel.stopListening(".message.read");
      channel.stopListening(".conversation.closed");
      echo.leave(channelName);
    };
  }, [selectedConversation?.id]);

  // 5. Send Message
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedConversation) return;

    const content = inputContent.trim();
    if (!content && !selectedFile) return;

    setIsSending(true);
    try {
      const msgType = selectedFile
        ? selectedFile.type.startsWith("image/")
          ? "image"
          : selectedFile.type.startsWith("video/")
          ? "video"
          : "file"
        : "text";

      const sent = await sendMessage(
        selectedConversation.id,
        content,
        msgType,
        selectedFile ? [selectedFile] : undefined
      );

      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });

      const nowIso = new Date().toISOString();
      setSelectedConversation((prev) =>
        prev
          ? {
              ...prev,
              latest_message: sent,
              first_response_at: prev.first_response_at || nowIso,
            }
          : prev
      );

      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversation.id
            ? {
                ...c,
                latest_message: sent,
                first_response_at: c.first_response_at || nowIso,
                updated_at: nowIso,
              }
            : c
        )
      );

      setInputContent("");
      setSelectedFile(null);
      scrollToBottom();
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputContent(e.target.value);
    if (!selectedConversation) return;

    const echo = getEcho();
    if (echo) {
      echo.private(`conversation.${selectedConversation.id}`).whisper("typing", {
        isTyping: true,
        senderRole: "agent",
      });
    }
  };

  // 6. Close Conversation
  const handleClose = async () => {
    if (!selectedConversation) return;
    if (confirm("Tutup percakapan dengan pelanggan ini?")) {
      try {
        await closeConversation(selectedConversation.id);
        setSelectedConversation(null);
        refreshInbox();
      } catch (err) {
        console.error("Failed to close conversation", err);
      }
    }
  };

  // 7. Update Status
  const handleStatusChange = async (avail: AgentAvailability) => {
    try {
      const updated = await updateAgentStatus(avail);
      setStatus(updated);
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-100 overflow-hidden">
      {/* Sidebar: Agent Profile & Inbox */}
      <aside className="w-80 border-r border-slate-200 bg-white flex flex-col shrink-0">
        {/* Agent Profile & Presence Header */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between gap-2 mb-3">
            <AgentProfileDropdown />
            <RealtimeIndicator showLabel={false} />
          </div>

          {/* Availability Selector & Workload Meter */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
            <select
              value={status?.availability || "available"}
              onChange={(e) => handleStatusChange(e.target.value as AgentAvailability)}
              className="text-xs font-medium rounded-lg border border-slate-200 bg-white py-1 px-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1E3785]"
            >
              <option value="available">🟢 Available</option>
              <option value="away">🟡 Away</option>
              <option value="busy">🔴 Busy</option>
            </select>

            <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
              {status?.active_conversations ?? conversations.length} /{" "}
              {status?.max_concurrent_conversations ?? 5} Chats
            </div>
          </div>
        </div>

        {/* Conversation Inbox List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Percakapan Aktif ({conversations.length})
          </div>

          {conversations.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              Tidak ada percakapan aktif. Percakapan baru akan otomatis masuk ke workspace Anda.
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = selectedConversation?.id === conv.id;
              const unreadCount = unreadCounts[conv.id] || 0;

              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={cn(
                    "p-3 rounded-xl border transition-all cursor-pointer",
                    isSelected
                      ? "bg-[#1E3785]/5 border-[#1E3785] text-[#1E3785]"
                      : "bg-white border-slate-200 hover:bg-slate-50 text-slate-800"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-xs font-semibold truncate text-slate-900">
                        {conv.member?.name || `Customer #${conv.member_id}`}
                      </span>
                      {unreadCount > 0 && (
                        <span
                          title={`${unreadCount} pesan baru`}
                          className="h-5 min-w-[20px] px-1 flex items-center justify-center rounded-full bg-[#1E3785] text-white text-[11px] font-bold shrink-0 shadow-xs"
                        >
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <Badge variant={conv.status as any} className="shrink-0 text-[10px]">
                      {conv.status === "active" ? "Aktif" : "Assigned"}
                    </Badge>
                  </div>

                  <div className="text-[10px] text-slate-400 mt-1.5 flex items-center justify-between">
                    <span>Mulai: {formatTime(conv.started_at)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Workspace Area: Active Chat */}
      <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
        {closedNotice && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2 shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="font-medium">{closedNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setClosedNotice(null)}
              className="text-amber-700 hover:text-amber-900 font-semibold text-xs ml-4 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {selectedConversation ? (
          <>
            {/* Top Chat Action Bar */}
            <header className="h-14 px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-semibold text-xs">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 leading-tight">
                    {selectedConversation.member?.name || `Customer #${selectedConversation.member_id}`}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {selectedConversation.member?.email} • Mulai: {formatTime(selectedConversation.started_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <RealtimeIndicator className="hidden md:inline-flex" />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTransferModal(true)}
                  className="text-xs text-slate-700"
                >

                  <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" /> Transfer
                </Button>

                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleClose}
                  className="text-xs"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1.5" /> Selesaikan Chat
                </Button>
              </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 p-6 chat-scroll-container space-y-3">
              {messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col max-w-[70%]",
                      isMe ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2.5 text-sm shadow-xs break-words",
                        isMe
                          ? "bg-[#1E3785] text-white rounded-tr-xs"
                          : "bg-white text-slate-900 border border-slate-200 rounded-tl-xs"
                      )}
                    >
                      {/* Attachments */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mb-2 space-y-2">
                          {msg.attachments.map((att) => {
                            const fileUrl = getAttachmentUrl(att.url);
                            const isImage = att.mime_type?.startsWith("image/") || msg.type === "image";
                            const isVideo = att.mime_type?.startsWith("video/") || msg.type === "video";

                            if (isImage) {
                              return (
                                <div key={att.id} className="rounded-xl overflow-hidden border border-black/10 my-1 bg-black/5">
                                  <a href={fileUrl} target="_blank" rel="noreferrer" title="Klik untuk melihat foto ukuran penuh">
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
                                rel="noreferrer"
                                className={cn(
                                  "flex items-center gap-2 p-2 rounded-lg text-xs font-medium border transition-colors",
                                  isMe ? "bg-white/15 hover:bg-white/25 border-white/20 text-white" : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800"
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

                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    <div
                      className={cn(
                        "flex items-center gap-1 text-[10px] text-slate-400 mt-1 px-1",
                        isMe ? "justify-end" : "justify-start"
                      )}
                    >
                      <span>{formatTime(msg.created_at)}</span>
                      {isMe && (
                        <span>
                          {msg.read_at ? (
                            <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                          ) : (
                            <Check className="h-3 w-3 text-slate-400" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Member typing indicator */}
              {isMemberTyping && (
                <div className="flex items-center gap-2 text-xs text-slate-500 italic bg-white border border-slate-200 rounded-full px-3 py-1 w-fit shadow-xs animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                  <span>Pelanggan sedang mengetik...</span>
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
                        <div className="h-full w-full flex items-center justify-center bg-blue-50 text-[#1E3785]">
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

            {/* Composer */}
            <footer className="p-4 bg-white border-t border-slate-200 shrink-0">
              <form onSubmit={handleSend} className="flex items-center gap-3">
                {/* Attachment Submenu */}
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
                      "text-slate-500 hover:text-slate-700 shrink-0 h-10 w-10 rounded-xl transition-all",
                      attachmentMenuOpen && "bg-blue-100 text-[#1E3785] ring-2 ring-[#1E3785]/20"
                    )}
                    aria-label="Lampirkan foto atau video"
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>

                  {/* Submenu Popover */}
                  {attachmentMenuOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                      <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
                        <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">Pilih Jenis Lampiran</p>
                        <p className="text-[10px] text-slate-400">Kirim foto screenshot atau video panduan</p>
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
                          <div className="h-8 w-8 rounded-lg bg-blue-100 text-[#1E3785] group-hover:bg-[#1E3785] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-slate-800 group-hover:text-[#1E3785]">Foto / Gambar</div>
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
                  placeholder="Ketik balasan untuk pelanggan..."
                  className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1E3785] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E3785]"
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSending}
                  disabled={!inputContent.trim() && !selectedFile}
                  className="px-5 shrink-0"
                >
                  <Send className="h-4 w-4 mr-1.5" /> Kirim
                </Button>
              </form>
            </footer>

            {/* Transfer Modal */}
            <TransferModal
              isOpen={showTransferModal}
              conversationId={selectedConversation.id}
              currentAgentId={user?.id || 0}
              onTransferred={() => {
                setShowTransferModal(false);
                setSelectedConversation(null);
                refreshInbox();
              }}
              onClose={() => setShowTransferModal(false)}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="h-16 w-16 rounded-full bg-[#1E3785]/10 text-[#1E3785] flex items-center justify-center mb-4">
              <Headphones className="h-8 w-8" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Workspace CS ION Broadband Livechat</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Pilih salah satu percakapan di bilah samping untuk mulai melayani pelanggan secara realtime.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
