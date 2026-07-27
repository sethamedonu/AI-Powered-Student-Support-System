import { z } from 'zod';

export const SendMessageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1).max(2000).trim(),
  category: z
    .enum(['admissions', 'registration', 'tuition', 'examinations', 'calendar', 'graduation', 'scholarships', 'campus-services', 'general'])
    .optional(),
});

export const SQSChatMessageSchema = z.object({
  userId: z.string().min(1),
  conversationId: z.string().uuid(),
  messageId: z.string().uuid(),
  question: z.string().min(1),
  category: z.string().optional(),
  conversationHistory: z.array(
    z.object({ role: z.enum(['user', 'assistant', 'system']), content: z.string() }),
  ),
});

export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type SQSChatMessage = z.infer<typeof SQSChatMessageSchema>;

export interface SendMessageResponse {
  conversationId: string;
  messageId: string;
  answer: string;
  model: string;
  cacheStatus: 'hit' | 'miss';
  tokensUsed: number;
  latencyMs: number;
}
