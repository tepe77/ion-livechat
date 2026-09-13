import { apiClient } from "./client";
import type { ApiResponse, Message, MessageAttachment, MessageType } from "@ion/types";

export interface GetMessagesParams {
  limit?: number;
  before?: number;
}

export interface MessagesResponse {
  data: Message[];
  meta: {
    count: number;
    next_cursor?: number | null;
  };
}

export async function getMessages(conversationId: number, params?: GetMessagesParams): Promise<MessagesResponse> {
  return apiClient<MessagesResponse>(`/conversations/${conversationId}/messages`, {
    params: params as any,
  });
}

export async function sendMessage(
  conversationId: number,
  content: string,
  type: MessageType = "text",
  files?: File[]
): Promise<Message> {
  if (files && files.length > 0) {
    const formData = new FormData();
    formData.append("content", content);
    formData.append("type", type);
    files.forEach((file) => {
      formData.append("attachments[]", file);
    });

    const res = await apiClient<ApiResponse<Message>>(`/conversations/${conversationId}/messages`, {
      method: "POST",
      body: formData,
    });
    return res.data;
  }

  const res = await apiClient<ApiResponse<Message>>(`/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content, type }),
  });
  return res.data;
}

export async function markMessageRead(conversationId: number, messageId: number): Promise<Message> {
  const res = await apiClient<ApiResponse<Message>>(`/conversations/${conversationId}/messages/${messageId}/read`, {
    method: "POST",
  });
  return res.data;
}

export async function uploadAttachment(conversationId: number, file: File): Promise<MessageAttachment> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await apiClient<ApiResponse<MessageAttachment>>(`/conversations/${conversationId}/attachments`, {
    method: "POST",
    body: formData,
  });
  return res.data;
}
