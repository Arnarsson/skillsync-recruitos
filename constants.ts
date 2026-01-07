import { Candidate, FunnelStage, ConfidenceLevel, AuditEvent, AuditEventType } from './types';

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