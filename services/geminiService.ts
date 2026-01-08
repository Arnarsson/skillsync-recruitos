/* eslint-disable no-console */

/**
 * Gemini Service - Unified API Facade
 *
 * This file re-exports all AI services for backwards compatibility.
 * The actual implementations are now organized in focused modules:
 *
 * - ai/client.ts: API key handling and client initialization
 * - ai/schemas.ts: All JSON response schemas
 * - ai/scoring.ts: Candidate profile analysis and scoring
 * - ai/profiling.ts: Persona, deep profile, and network dossier generation
 * - ai/outreach.ts: Personalized outreach message generation
 */

// Re-export client utilities
export { getAiClient, callOpenRouter, withRetry, callAIWithFailover } from './ai/client';

// Re-export scoring functions
export { analyzeCandidateProfile } from './ai/scoring';

// Re-export profiling functions
export { generatePersona, generateDeepProfile, generateNetworkDossier } from './ai/profiling';

// Re-export outreach functions
export { generateOutreach } from './ai/outreach';

// Re-export AI_MODELS for use by enrichmentService
export { AI_MODELS } from '../constants';
