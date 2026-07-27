import type { AIModel, RequestComplexity, KnowledgeCategory } from '../../../shared/types/index.js';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  systemPrompt?: string;
  complexity: RequestComplexity;
  category?: KnowledgeCategory;
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse {
  content: string;
  model: AIModel;
  tokensUsed: number;
  latencyMs: number;
  guardrailAction?: 'NONE' | 'BLOCKED' | 'MODIFIED';
}

export interface IAIProvider {
  readonly name: string;
  generate(request: AIRequest): Promise<AIResponse>;
  isAvailable(): Promise<boolean>;
}
