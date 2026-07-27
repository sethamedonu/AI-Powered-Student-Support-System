import type { MessageRole, ConversationStatus } from '../../../shared/types/index.js';

export interface Conversation {
  userId: string;
  conversationId: string;
  title: string;
  status: ConversationStatus;
  messageCount: number;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: number;
}

export interface Message {
  conversationId: string;
  messageId: string;
  role: MessageRole;
  content: string;
  model?: string;
  cacheStatus?: 'hit' | 'miss';
  tokensUsed?: number;
  latencyMs?: number;
  createdAt: string;
  expiresAt?: number;
}

export interface CreateConversationInput {
  userId: string;
  conversationId: string;
  title: string;
}

export interface CreateMessageInput {
  conversationId: string;
  messageId: string;
  role: MessageRole;
  content: string;
  model?: string;
  cacheStatus?: 'hit' | 'miss';
  tokensUsed?: number;
  latencyMs?: number;
}
