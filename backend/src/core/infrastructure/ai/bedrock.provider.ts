import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  type InvokeModelCommandInput,
} from '@aws-sdk/client-bedrock-runtime';
import { env } from '../../../shared/types/env.js';
import { AIProviderError } from '../../../shared/errors/index.js';
import { createLogger } from '../../../shared/utils/logger.js';
import type { IAIProvider, AIRequest, AIResponse } from './provider.interface.js';

const logger = createLogger('bedrock-provider');

const SYSTEM_PROMPT = `You are a helpful student support assistant for an educational institution.
You answer questions about admissions, course registration, tuition, examinations, academic calendars,
graduation requirements, scholarships, and campus services.
Be concise, accurate, and professional. If you don't know something, say so clearly.
Never make up information about specific policies, dates, or fees.`;

export class BedrockProvider implements IAIProvider {
  readonly name = 'bedrock';
  private readonly client: BedrockRuntimeClient;

  constructor() {
    this.client = new BedrockRuntimeClient({ region: env.BEDROCK_REGION });
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const model = request.complexity === 'simple'
      ? env.BEDROCK_MODEL_ROUTINE
      : env.BEDROCK_MODEL_COMPLEX;

    const isNova = model.includes('nova');
    const start = Date.now();

    try {
      const body = isNova
        ? this.buildNovaPayload(request, model)
        : this.buildClaudePayload(request, model);

      const input: InvokeModelCommandInput = {
        modelId: model,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(body),
        ...(env.BEDROCK_GUARDRAIL_ID && {
          guardrailIdentifier: env.BEDROCK_GUARDRAIL_ID,
          guardrailVersion: env.BEDROCK_GUARDRAIL_VERSION,
        }),
      };

      const command = new InvokeModelCommand(input);
      const response = await this.client.send(command);
      const parsed = JSON.parse(new TextDecoder().decode(response.body)) as Record<string, unknown>;

      const latencyMs = Date.now() - start;
      const novaOutput = parsed['output'] as { message?: { content?: Array<{ text?: string }> } } | undefined;
      const claudeContent = parsed['content'] as Array<{ text?: string }> | undefined;
      const content = isNova
        ? (novaOutput?.message?.content?.[0]?.text ?? '')
        : (claudeContent?.[0]?.text ?? '');

      const novaUsage = parsed['usage'] as { inputTokens?: number; outputTokens?: number } | undefined;
      const claudeUsage = parsed['usage'] as { input_tokens?: number; output_tokens?: number } | undefined;
      const tokensUsed = isNova
        ? ((novaUsage?.inputTokens ?? 0) + (novaUsage?.outputTokens ?? 0))
        : ((claudeUsage?.input_tokens ?? 0) + (claudeUsage?.output_tokens ?? 0));

      const guardrailAction = (response as unknown as Record<string, unknown>)['amazonBedrockGuardrailAction'] as AIResponse['guardrailAction'] ?? 'NONE';

      logger.info('Bedrock response', { model, latencyMs, tokensUsed, guardrailAction });

      return {
        content,
        model: model.includes('nova') ? 'nova-lite' : 'claude-sonnet',
        tokensUsed,
        latencyMs,
        guardrailAction,
      };
    } catch (error) {
      logger.error('Bedrock invocation failed', error);
      throw new AIProviderError('Failed to generate AI response', { model, error: String(error) });
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.config.region();
      return true;
    } catch {
      return false;
    }
  }

  private buildNovaPayload(request: AIRequest, _model: string): Record<string, unknown> {
    const system = request.systemPrompt ?? SYSTEM_PROMPT;
    return {
      system: [{ text: system }],
      messages: request.messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role,
        content: [{ text: m.content }],
      })),
      inferenceConfig: {
        maxTokens: request.maxTokens ?? 1024,
        temperature: request.temperature ?? 0.3,
      },
    };
  }

  private buildClaudePayload(request: AIRequest, _model: string): Record<string, unknown> {
    const system = request.systemPrompt ?? SYSTEM_PROMPT;
    return {
      anthropic_version: 'bedrock-2023-05-31',
      system,
      messages: request.messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: request.maxTokens ?? 2048,
      temperature: request.temperature ?? 0.3,
    };
  }
}
