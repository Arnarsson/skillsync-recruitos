/**
 * Immutable Audit Service for EU AI Act Compliance
 *
 * Features:
 * - Append-only logging to Supabase with hash chaining
 * - localStorage fallback for offline operation
 * - Automatic sync queue for reconnection
 * - Integrity verification
 * - Migration from existing localStorage logs
 */

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { AuditEventType, AuditEvent } from "@/types";

// Extended audit event for EU AI Act compliance
export interface ImmutableAuditEvent {
  id: string;
  event_type: AuditEventType | string;
  created_at: string;
  user_id?: string;
  user_email?: string;
  description: string;
  credits_charged: number;
  subject_id?: string;
  subject_type?: "candidate" | "job" | "team" | "system";
  model_provider?: string;
  model_version?: string;
  input_hash?: string;
  output_hash?: string;
  previous_hash?: string;
  entry_hash?: string;
  metadata?: {
    input_summary?: string;
    output_summary?: string;
    data_sources?: string[];
    calibration_factors?: Record<string, unknown>;
    evidence_count?: number;
    confidence?: number;
    [key: string]: unknown;
  };
  migrated_from_localstorage?: boolean;
}

export interface AuditChainVerification {
  is_valid: boolean;
  total_entries: number;
  first_entry_at: string | null;
  last_entry_at: string | null;
  broken_at_id: string | null;
  error_message: string | null;
}

// SHA-256 hash function (browser-compatible)
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Compute hash of input/output data
export async function computeDataHash(data: unknown): Promise<string> {
  const jsonString = JSON.stringify(data, Object.keys(data as object).sort());
  return sha256(jsonString);
}

// LocalStorage keys
const AUDIT_QUEUE_KEY = "recruitos_audit_queue";
const AUDIT_CACHE_KEY = "apex_logs"; // Legacy key for backwards compatibility

class AuditService {
  private supabase = getSupabaseBrowserClient();
  private isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
  private syncInProgress = false;

  constructor() {
    // Listen for online/offline events
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        this.isOnline = true;
        this.syncQueuedEvents();
      });
      window.addEventListener("offline", () => {
        this.isOnline = false;
      });
    }
  }

  private get hasSupabase(): boolean {
    return this.supabase !== null;
  }

  /**
   * Log an audit event (EU AI Act compliant)
   */
  async logEvent(event: {
    type: AuditEventType | string;
    description: string;
    cost?: number;
    subjectId?: string;
    subjectType?: "candidate" | "job" | "team" | "system";
    modelProvider?: string;
    modelVersion?: string;
    inputData?: unknown;
    outputData?: unknown;
    metadata?: Record<string, unknown>;
  }): Promise<ImmutableAuditEvent | null> {
    const {
      type,
      description,
      cost = 0,
      subjectId,
      subjectType,
      modelProvider,
      modelVersion,
      inputData,
      outputData,
      metadata = {},
    } = event;

    // Compute hashes for input/output (privacy-preserving verification)
    const inputHash = inputData ? await computeDataHash(inputData) : undefined;
    const outputHash = outputData ? await computeDataHash(outputData) : undefined;

    // Get current user (only if Supabase is available)
    let user: { id: string; email?: string } | null = null;
    if (this.hasSupabase) {
      const { data } = await this.supabase!.auth.getUser();
      user = data.user;
    }

    const auditEvent: Partial<ImmutableAuditEvent> = {
      event_type: type,
      description,
      credits_charged: cost,
      subject_id: subjectId,
      subject_type: subjectType,
      model_provider: modelProvider,
      model_version: modelVersion,
      input_hash: inputHash,
      output_hash: outputHash,
      user_id: user?.id,
      user_email: user?.email,
      metadata: {
        ...metadata,
        input_summary: inputData
          ? `${JSON.stringify(inputData).substring(0, 100)}...`
          : undefined,
        output_summary: outputData
          ? `${JSON.stringify(outputData).substring(0, 100)}...`
          : undefined,
      },
    };

    // Try to log to Supabase first
    if (this.isOnline && user && this.hasSupabase) {
      try {
        const { data, error } = await this.supabase!
          .from("audit_logs")
          .insert(auditEvent)
          .select()
          .single();

        if (error) {
          console.warn("[AuditService] Supabase insert failed, queueing:", error);
          this.queueEvent(auditEvent);
        } else {
          // Also update localStorage cache for offline viewing
          this.updateLocalCache(data as ImmutableAuditEvent);
          return data as ImmutableAuditEvent;
        }
      } catch (err) {
        console.warn("[AuditService] Network error, queueing:", err);
        this.queueEvent(auditEvent);
      }
    } else {
      // Offline or not authenticated - queue for later
      this.queueEvent(auditEvent);
    }

    // Also log to legacy localStorage for backwards compatibility
    this.logToLegacyStorage({
      id: crypto.randomUUID(),
      type: type as AuditEventType,
      timestamp: new Date().toISOString(),
      description,
      cost,
      user: user?.email || "anonymous",
      metadata,
    });

    return null;
  }

  /**
   * Queue event for later sync
   */
  private queueEvent(event: Partial<ImmutableAuditEvent>): void {
    if (typeof localStorage === "undefined") return;

    const queue = this.getQueue();
    queue.push({
      ...event,
      created_at: new Date().toISOString(),
      id: crypto.randomUUID(),
    });
    localStorage.setItem(AUDIT_QUEUE_KEY, JSON.stringify(queue));
  }

  /**
   * Get pending queue
   */
  private getQueue(): Partial<ImmutableAuditEvent>[] {
    if (typeof localStorage === "undefined") return [];
    const stored = localStorage.getItem(AUDIT_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Sync queued events when back online
   */
  async syncQueuedEvents(): Promise<{ synced: number; failed: number }> {
    if (this.syncInProgress || !this.isOnline || !this.hasSupabase) {
      return { synced: 0, failed: 0 };
    }

    this.syncInProgress = true;
    const queue = this.getQueue();
    let synced = 0;
    let failed = 0;
    const remainingQueue: Partial<ImmutableAuditEvent>[] = [];

    for (const event of queue) {
      try {
        const { error } = await this.supabase!.from("audit_logs").insert(event);

        if (error) {
          console.warn("[AuditService] Failed to sync event:", error);
          remainingQueue.push(event);
          failed++;
        } else {
          synced++;
        }
      } catch {
        remainingQueue.push(event);
        failed++;
      }
    }

    // Update queue with remaining items
    localStorage.setItem(AUDIT_QUEUE_KEY, JSON.stringify(remainingQueue));
    this.syncInProgress = false;

    if (synced > 0) {
      console.log(`[AuditService] Synced ${synced} queued events`);
    }

    return { synced, failed };
  }

  /**
   * Update localStorage cache for offline viewing
   */
  private updateLocalCache(event: ImmutableAuditEvent): void {
    if (typeof localStorage === "undefined") return;

    const cached = localStorage.getItem("recruitos_audit_cache");
    const events: ImmutableAuditEvent[] = cached ? JSON.parse(cached) : [];
    events.unshift(event);
    // Keep only last 100 events in cache
    localStorage.setItem(
      "recruitos_audit_cache",
      JSON.stringify(events.slice(0, 100))
    );
  }

  /**
   * Log to legacy localStorage (backwards compatibility)
   */
  private logToLegacyStorage(event: AuditEvent): void {
    if (typeof localStorage === "undefined") return;

    const stored = localStorage.getItem(AUDIT_CACHE_KEY);
    const events: AuditEvent[] = stored ? JSON.parse(stored) : [];
    events.unshift(event);
    localStorage.setItem(AUDIT_CACHE_KEY, JSON.stringify(events.slice(0, 100)));
  }

  /**
   * Fetch audit logs (from Supabase or cache)
   */
  async fetchLogs(options?: {
    limit?: number;
    offset?: number;
    eventType?: string;
    subjectId?: string;
  }): Promise<ImmutableAuditEvent[]> {
    const { limit = 50, offset = 0, eventType, subjectId } = options || {};

    // Try Supabase first
    if (this.isOnline && this.hasSupabase) {
      try {
        let query = this.supabase!
          .from("audit_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (eventType) {
          query = query.eq("event_type", eventType);
        }
        if (subjectId) {
          query = query.eq("subject_id", subjectId);
        }

        const { data, error } = await query;

        if (!error && data) {
          return data as ImmutableAuditEvent[];
        }
      } catch (err) {
        console.warn("[AuditService] Failed to fetch from Supabase:", err);
      }
    }

    // Fallback to localStorage cache
    const cached = localStorage.getItem("recruitos_audit_cache");
    const events: ImmutableAuditEvent[] = cached ? JSON.parse(cached) : [];
    return events.slice(offset, offset + limit);
  }

  /**
   * Verify audit chain integrity
   */
  async verifyChainIntegrity(): Promise<AuditChainVerification | null> {
    if (!this.hasSupabase) return null;

    try {
      const { data: userData } = await this.supabase!.auth.getUser();
      const { data, error } = await this.supabase!.rpc("verify_audit_chain", {
        target_user_id: userData.user?.id,
      });

      if (error) {
        console.error("[AuditService] Chain verification failed:", error);
        return null;
      }

      return data?.[0] as AuditChainVerification;
    } catch (err) {
      console.error("[AuditService] Chain verification error:", err);
      return null;
    }
  }

  /**
   * Migrate existing localStorage logs to Supabase
   */
  async migrateFromLocalStorage(): Promise<{ migrated: number; failed: number }> {
    if (typeof localStorage === "undefined" || !this.hasSupabase) {
      return { migrated: 0, failed: 0 };
    }

    const stored = localStorage.getItem(AUDIT_CACHE_KEY);
    if (!stored) {
      return { migrated: 0, failed: 0 };
    }

    const legacyLogs: AuditEvent[] = JSON.parse(stored);
    let migrated = 0;
    let failed = 0;

    const { data: userData } = await this.supabase!.auth.getUser();
    const user = userData.user;
    if (!user) {
      console.warn("[AuditService] Cannot migrate without authenticated user");
      return { migrated: 0, failed: 0 };
    }

    for (const log of legacyLogs) {
      try {
        const { error } = await this.supabase!.from("audit_logs").insert({
          event_type: log.type,
          description: log.description,
          credits_charged: log.cost,
          user_id: user.id,
          user_email: log.user,
          metadata: log.metadata,
          migrated_from_localstorage: true,
          original_timestamp: log.timestamp,
        });

        if (error) {
          failed++;
        } else {
          migrated++;
        }
      } catch {
        failed++;
      }
    }

    // Mark as migrated
    if (migrated > 0) {
      localStorage.setItem("recruitos_audit_migrated", "true");
      console.log(`[AuditService] Migrated ${migrated} legacy logs to Supabase`);
    }

    return { migrated, failed };
  }

  /**
   * Export audit logs for regulatory compliance
   */
  async exportForCompliance(options?: {
    startDate?: Date;
    endDate?: Date;
    format?: "json" | "csv";
  }): Promise<string> {
    if (!this.hasSupabase) {
      throw new Error("Supabase not configured - cannot export audit logs");
    }

    const { startDate, endDate, format = "json" } = options || {};

    let query = this.supabase!
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: true });

    if (startDate) {
      query = query.gte("created_at", startDate.toISOString());
    }
    if (endDate) {
      query = query.lte("created_at", endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Export failed: ${error.message}`);
    }

    if (format === "csv") {
      const headers = [
        "id",
        "event_type",
        "created_at",
        "description",
        "credits_charged",
        "subject_id",
        "model_provider",
        "model_version",
        "entry_hash",
      ];
      const rows = (data || []).map((row: Record<string, unknown>) =>
        headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")
      );
      return [headers.join(","), ...rows].join("\n");
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * Get pending sync count
   */
  getPendingSyncCount(): number {
    return this.getQueue().length;
  }
}

// Singleton instance
export const auditService = new AuditService();

// Helper function for logging AI operations
export async function logAIOperation(params: {
  type: "score_generated" | "profile_enriched" | "persona_generated" | "outreach_generated";
  candidateId: string;
  modelProvider: string;
  modelVersion: string;
  inputData: unknown;
  outputData: unknown;
  creditsCharged: number;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await auditService.logEvent({
    type: params.type,
    description: `AI ${params.type.replace("_", " ")} for candidate ${params.candidateId}`,
    cost: params.creditsCharged,
    subjectId: params.candidateId,
    subjectType: "candidate",
    modelProvider: params.modelProvider,
    modelVersion: params.modelVersion,
    inputData: params.inputData,
    outputData: params.outputData,
    metadata: params.metadata,
  });
}
