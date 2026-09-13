/**
 * ION Live Chat - Core Shared Types
 */

export type UserRole = 'superadmin' | 'manager' | 'agent' | 'member';

export type ConversationStatus = 'waiting' | 'assigned' | 'active' | 'closed';

export type MessageType = 'text' | 'image' | 'file' | 'video';

export type AgentPresence = 'online' | 'offline';

export type AgentAvailability = 'available' | 'away' | 'busy';

export type AssignmentReason = 'auto_routing' | 'manual_assignment' | 'transfer';

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string | null;
  customer_number?: string | null;
  role: UserRole;
  role_id?: number;
  is_active: boolean;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialAccount {
  id: number;
  user_id: number;
  provider: 'google' | 'facebook';
  provider_user_id: string;
  provider_email?: string | null;
  created_at: string;
}

export interface AgentProfile {
  id: number;
  user_id: number;
  max_concurrent_conversations: number;
  created_at: string;
  updated_at: string;
}

export interface AgentStatus {
  id?: number;
  agent_id: number;
  presence: AgentPresence;
  availability: AgentAvailability;
  last_seen_at?: string | null;
  available_since?: string | null;
  active_conversations?: number;
  max_concurrent_conversations?: number;
  user?: User;
}

export interface Conversation {
  id: number;
  member_id: number;
  agent_id?: number | null;
  status: ConversationStatus;
  started_at: string;
  assigned_at?: string | null;
  first_response_at?: string | null;
  closed_at?: string | null;
  created_at: string;
  updated_at: string;
  member?: User;
  agent?: User | null;
  latest_message?: Message | null;
  unread_count?: number;
  rating?: ConversationRating | null;
}

export interface ConversationAssignment {
  id: number;
  conversation_id: number;
  agent_id: number;
  assigned_at: string;
  unassigned_at?: string | null;
  reason: AssignmentReason;
  created_at: string;
  agent?: User;
}

export interface MessageAttachment {
  id: number;
  message_id: number;
  disk: string;
  path: string;
  original_name: string;
  mime_type: string;
  size: number;
  url?: string;
  created_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  type: MessageType;
  content: string;
  created_at: string;
  updated_at: string;
  read_at?: string | null;
  sender?: User;
  attachments?: MessageAttachment[];
}

export interface ConversationRating {
  id: number;
  conversation_id: number;
  agent_id: number;
  member_id: number;
  rating: number; // 1 - 5
  comment?: string | null;
  created_at: string;
  updated_at: string;
  agent?: User;
  member?: User;
}

export interface AuditLog {
  id: number;
  actor_id?: number | null;
  action: string;
  target_type?: string | null;
  target_id?: number | null;
  metadata?: Record<string, any> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  actor?: User | null;
}

export interface DashboardStats {
  waiting: number;
  active: number;
  closed_today: number;
  online_agents: number;
  available_agents: number;
  average_first_response_time: number; // seconds
  average_resolution_time: number;     // seconds
  average_rating: number;             // e.g. 4.8
}

export interface AgentPerformance {
  agent_id: number;
  agent_name: string;
  total_conversations: number;
  active_conversations: number;
  closed_conversations: number;
  transferred_conversations: number;
  first_response_time: number;
  average_response_time: number;
  average_resolution_time: number;
  average_rating: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// WebSocket Event Payloads
export interface MessageCreatedPayload {
  message: Message;
}

export interface MessageReadPayload {
  message_id: number;
  read_by: number;
  read_at: string;
}

export interface TypingStartedPayload {
  conversation_id: number;
  user_id: number;
  user_name?: string;
}

export interface TypingStoppedPayload {
  conversation_id: number;
  user_id: number;
}

export interface ConversationCreatedPayload {
  conversation: Conversation;
}

export interface ConversationAssignedPayload {
  conversation_id: number;
  agent: {
    id: number;
    name: string;
    avatar?: string | null;
  };
  assigned_at: string;
}

export interface ConversationTransferredPayload {
  conversation_id: number;
  agent: {
    id: number;
    name: string;
    avatar?: string | null;
  };
  transferred_at: string;
}

export interface ConversationClosedPayload {
  conversation_id: number;
  closed_at: string;
  rating_available: boolean;
}

export interface AgentStatusUpdatedPayload {
  agent_id: number;
  presence: AgentPresence;
  availability: AgentAvailability;
  active_conversations?: number;
  max_concurrent_conversations?: number;
}

export interface QueueUpdatedPayload {
  conversation_id: number;
  status: ConversationStatus;
  position?: number;
}

export interface DashboardUpdatedPayload extends DashboardStats {}

// Standard API Responses
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiPaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page?: number;
    next_cursor?: string | null;
  };
}
