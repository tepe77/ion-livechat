import { create } from "zustand";
import type { Conversation, Message } from "@ion/types";

interface ChatState {
  activeConversation: Conversation | null;
  messages: Message[];
  typingUsers: Record<number, string>;
  isLoadingMessages: boolean;
  setActiveConversation: (conv: Conversation | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessageRead: (messageId: number, readAt: string) => void;
  setUserTyping: (userId: number, userName: string, isTyping: boolean) => void;
  setIsLoadingMessages: (loading: boolean) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversation: null,
  messages: [],
  typingUsers: {},
  isLoadingMessages: false,

  setActiveConversation: (conv) => set({ activeConversation: conv }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => {
      // Deduplicate if already present
      if (state.messages.some((m) => m.id === message.id)) {
        return state;
      }
      return { messages: [...state.messages, message] };
    }),

  updateMessageRead: (messageId, readAt) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, read_at: readAt } : m
      ),
    })),

  setUserTyping: (userId, userName, isTyping) =>
    set((state) => {
      const updated = { ...state.typingUsers };
      if (isTyping) {
        updated[userId] = userName;
      } else {
        delete updated[userId];
      }
      return { typingUsers: updated };
    }),

  setIsLoadingMessages: (isLoadingMessages) => set({ isLoadingMessages }),

  reset: () =>
    set({
      activeConversation: null,
      messages: [],
      typingUsers: {},
      isLoadingMessages: false,
    }),
}));
