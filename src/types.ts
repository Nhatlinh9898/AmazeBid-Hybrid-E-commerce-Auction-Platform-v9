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

export type TransactionType = 'TRANSFER' | 'WITHDRAWAL' | 'PAYMENT' | 'ESCROW_DEPOSIT' | 'FUTURES_SETTLEMENT';
export type TransactionStatus = 'PENDING' | 'CLEARED' | 'FLAGGED' | 'REVOKED' | 'LOCKED';

export interface TransactionRecord {
  id: string;
  senderId: string;
  receiverId: string;
  amount: number;
  currency: string;
  type: TransactionType;
  status: TransactionStatus;
  timestamp: number;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    referenceCode: string;
    contractId?: string;
    hash: string; // Cryptographic hash for integrity
    signature?: string; // Digital signature
  };
}

export interface FuturesContract {
  id: string;
  creatorId: string;
  counterpartyId: string;
  assetType: 'STOCKS' | 'COMMODITIES' | 'CREDIT';
  strikePrice: number;
  expiryDate: number;
  quantity: number;
  status: 'OPEN' | 'EXECUTED' | 'EXPIRED' | 'CANCELLED';
  conditions: string[];
}

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
