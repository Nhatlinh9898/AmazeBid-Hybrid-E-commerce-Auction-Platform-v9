import { z } from 'zod';

// Strict JSON Schema for AI Input
export const AITaskSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['text_summarization', 'image_generation', 'data_analysis', 'sentiment_analysis']),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  payload: z.record(z.any()),
  timestamp: z.number(),
});

export type AITaskInput = z.infer<typeof AITaskSchema>;

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'dlq';

export interface Job {
  id: string;
  data: AITaskInput;
  status: TaskStatus;
  attempts: number;
  maxAttempts: number;
  error?: string;
  result?: any;
  createdAt: number;
  updatedAt: number;
  processedBy?: 'Cloud AI' | 'Local AI';
}
