
import { Candidate, AuditEvent, AuditEventType } from './types';

export const INITIAL_CREDITS = 5000;

export const INITIAL_LOGS: AuditEvent[] = [
    {
        id: 'evt_init_001',
        type: AuditEventType.CREDIT_PURCHASE,
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        description: 'Pilot Package Allocation',
        cost: 5000,
        user: 'System Admin',
        metadata: { invoice: 'INV-2025-001', plan: 'pilot_v1' }
    }
];

// Start with empty list to enforce Import functionality
export const MOCK_CANDIDATES: Candidate[] = [];

// AI Model Configuration - Centralized model names for easy updates
export const AI_MODELS = {
  FLASH: 'gemini-2.5-flash',
  FLASH_LATEST: 'gemini-2.5-flash-latest',
  PRO: 'gemini-2.5-pro',
  PRO_LATEST: 'gemini-2.5-pro-latest',

  // Functional aliases for specific use cases
  DEFAULT: 'gemini-2.5-flash',
  PERSONA_GEN: 'gemini-2.5-flash',
  SCORING: 'gemini-2.5-flash',
  DEEP_PROFILE: 'gemini-2.5-flash',
  OUTREACH: 'gemini-2.5-flash',
  JOB_PARSING: 'gemini-2.5-flash'
} as const;

export type AiModelName = typeof AI_MODELS[keyof typeof AI_MODELS];
