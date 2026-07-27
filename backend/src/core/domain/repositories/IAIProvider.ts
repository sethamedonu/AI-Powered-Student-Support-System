import type { AIModel, KnowledgeCategory } from '../../../shared/types/index.js';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  systemPrompt?: string;
  model: AIModel;
  maxTokens?: number;
  temperature?: number;
  category?: KnowledgeCategory;
}

export interface AIResponse {
  content: string;
  model: string;
  tokensUsed: number;
  latencyMs: number;
  guardrailAction?: 'NONE' | 'BLOCKED' | 'MODIFIED';
}

export interface AIProviderConfig {
  region: string;
  guardrailId?: string;
  guardrailVersion?: string;
}

// ─── Core AI Provider Interface ───────────────────────────────────────────────
// All AI providers (Bedrock, OpenAI, Gemini, DeepSeek) must implement this.
// Business logic NEVER depends on a concrete provider — only this interface.
export interface IAIProvider {
  readonly name: string;
  generate(request: AIRequest): Promise<AIResponse>;
  isAvailable(): Promise<boolean>;
}

// ─── AI Provider Factory Interface ───────────────────────────────────────────
export interface IAIProviderFactory {
  getProvider(name?: string): IAIProvider;
}
