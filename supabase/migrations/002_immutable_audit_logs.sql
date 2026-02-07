-- Immutable Audit Logs for EU AI Act Compliance
--
-- This migration creates an append-only audit log table with:
-- - Hash chaining for tamper detection
-- - Cryptographic verification of AI operations
-- - REVOKE DELETE/UPDATE to enforce immutability
-- - Full input/output tracking for AI profiling decisions

-- ============================================================================
-- AUDIT LOGS (Immutable, Hash-Chained)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Event classification (matches AuditEventType enum)
  event_type TEXT NOT NULL CHECK (event_type IN (
    'job_created',
    'score_generated',
    'profile_enriched',
    'outreach_generated',
    'credit_purchase',
    'sourcing_run',
    'persona_generated',    -- NEW: Psychometric profiling
    'calibration_applied',  -- NEW: Social context calibration
    'candidate_rejected',   -- NEW: Adverse decisions
    'data_exported'         -- NEW: GDPR data export
  )),

  -- Timestamp (immutable, set by database)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- User identification
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT, -- Denormalized for audit readability

  -- Event description (human readable)
  description TEXT NOT NULL,

  -- Cost tracking
  credits_charged INTEGER DEFAULT 0,

  -- Subject of the decision (candidate identifier)
  subject_id TEXT, -- e.g., GitHub username, candidate ID
  subject_type TEXT CHECK (subject_type IN ('candidate', 'job', 'team', 'system')),

  -- AI Model Information (EU AI Act Article 13 - Transparency)
  model_provider TEXT, -- 'gemini', 'openrouter', etc.
  model_version TEXT,  -- 'gemini-1.5-flash', 'gemini-1.5-pro', etc.

  -- Input/Output Hashes for Verification (SHA-256)
  -- Allows verification that outputs match inputs without storing PII
  input_hash TEXT,  -- SHA-256 of input data sent to AI
  output_hash TEXT, -- SHA-256 of AI response

  -- Hash Chain for Tamper Detection
  -- Each log includes hash of previous log, creating a verifiable chain
  previous_hash TEXT, -- SHA-256 of previous log entry
  entry_hash TEXT,    -- SHA-256 of this entire entry (computed after insert)

  -- Full metadata (JSONB for flexibility)
  metadata JSONB DEFAULT '{}',
  -- Expected structure:
  -- {
  --   "input_summary": "Scored candidate X for role Y",
  --   "output_summary": "Score: 85/100",
  --   "data_sources": ["github", "linkedin"],
  --   "calibration_factors": { "hiring_manager_background": "fintech" },
  --   "evidence_count": 5,
  --   "confidence": 0.87
  -- }

  -- Migration tracking
  migrated_from_localstorage BOOLEAN DEFAULT FALSE,
  original_timestamp TIMESTAMP WITH TIME ZONE -- For migrated records
);

-- Indexes for efficient querying
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_subject ON audit_logs(subject_id) WHERE subject_id IS NOT NULL;
CREATE INDEX idx_audit_logs_hash ON audit_logs(entry_hash);

-- ============================================================================
-- IMMUTABILITY ENFORCEMENT
-- ============================================================================

-- Revoke DELETE and UPDATE permissions from all roles
-- This ensures logs cannot be tampered with after creation
REVOKE DELETE, UPDATE ON audit_logs FROM authenticated;
REVOKE DELETE, UPDATE ON audit_logs FROM anon;
REVOKE DELETE, UPDATE ON audit_logs FROM service_role;

-- Only allow INSERT (append-only)
GRANT INSERT, SELECT ON audit_logs TO authenticated;
GRANT SELECT ON audit_logs TO anon; -- Read-only for unauthenticated (if needed)

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only read their own audit logs
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own audit logs
CREATE POLICY "Users can insert own audit logs" ON audit_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Service role can read all (for admin/compliance purposes)
CREATE POLICY "Service role can read all audit logs" ON audit_logs
  FOR SELECT USING (auth.role() = 'service_role');

-- ============================================================================
-- HASH CHAIN FUNCTION
-- ============================================================================

-- Function to compute entry hash and link to previous entry
CREATE OR REPLACE FUNCTION compute_audit_hash()
RETURNS TRIGGER AS $$
DECLARE
  prev_hash TEXT;
  hash_input TEXT;
BEGIN
  -- Get the hash of the most recent entry for this user
  SELECT entry_hash INTO prev_hash
  FROM audit_logs
  WHERE user_id = NEW.user_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Set previous_hash (NULL for first entry)
  NEW.previous_hash := prev_hash;

  -- Compute entry hash from all immutable fields
  hash_input := COALESCE(NEW.event_type, '') || '|' ||
                COALESCE(NEW.created_at::TEXT, '') || '|' ||
                COALESCE(NEW.user_id::TEXT, '') || '|' ||
                COALESCE(NEW.description, '') || '|' ||
                COALESCE(NEW.subject_id, '') || '|' ||
                COALESCE(NEW.input_hash, '') || '|' ||
                COALESCE(NEW.output_hash, '') || '|' ||
                COALESCE(NEW.previous_hash, 'GENESIS');

  NEW.entry_hash := encode(sha256(hash_input::bytea), 'hex');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply hash computation on every insert
CREATE TRIGGER audit_logs_hash_chain
  BEFORE INSERT ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION compute_audit_hash();

-- ============================================================================
-- INTEGRITY VERIFICATION FUNCTION
-- ============================================================================

-- Function to verify the integrity of the audit chain for a user
CREATE OR REPLACE FUNCTION verify_audit_chain(target_user_id UUID)
RETURNS TABLE (
  is_valid BOOLEAN,
  total_entries INTEGER,
  first_entry_at TIMESTAMP WITH TIME ZONE,
  last_entry_at TIMESTAMP WITH TIME ZONE,
  broken_at_id UUID,
  error_message TEXT
) AS $$
DECLARE
  log_record RECORD;
  expected_hash TEXT;
  computed_hash TEXT;
  prev_hash TEXT := 'GENESIS';
  entry_count INTEGER := 0;
  first_ts TIMESTAMP WITH TIME ZONE;
  last_ts TIMESTAMP WITH TIME ZONE;
BEGIN
  is_valid := TRUE;
  broken_at_id := NULL;
  error_message := NULL;

  FOR log_record IN
    SELECT * FROM audit_logs
    WHERE user_id = target_user_id
    ORDER BY created_at ASC
  LOOP
    entry_count := entry_count + 1;

    IF first_ts IS NULL THEN
      first_ts := log_record.created_at;
    END IF;
    last_ts := log_record.created_at;

    -- Verify previous_hash matches
    IF log_record.previous_hash IS DISTINCT FROM prev_hash AND prev_hash != 'GENESIS' THEN
      is_valid := FALSE;
      broken_at_id := log_record.id;
      error_message := 'Previous hash mismatch at entry ' || log_record.id;
      EXIT;
    END IF;

    -- Recompute entry hash
    computed_hash := encode(sha256((
      COALESCE(log_record.event_type, '') || '|' ||
      COALESCE(log_record.created_at::TEXT, '') || '|' ||
      COALESCE(log_record.user_id::TEXT, '') || '|' ||
      COALESCE(log_record.description, '') || '|' ||
      COALESCE(log_record.subject_id, '') || '|' ||
      COALESCE(log_record.input_hash, '') || '|' ||
      COALESCE(log_record.output_hash, '') || '|' ||
      COALESCE(log_record.previous_hash, 'GENESIS')
    )::bytea), 'hex');

    IF computed_hash != log_record.entry_hash THEN
      is_valid := FALSE;
      broken_at_id := log_record.id;
      error_message := 'Entry hash mismatch at entry ' || log_record.id;
      EXIT;
    END IF;

    prev_hash := log_record.entry_hash;
  END LOOP;

  total_entries := entry_count;
  first_entry_at := first_ts;
  last_entry_at := last_ts;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE audit_logs IS 'Immutable audit log for EU AI Act compliance. DELETE and UPDATE are revoked to ensure tamper-proof records.';
COMMENT ON COLUMN audit_logs.entry_hash IS 'SHA-256 hash of this entry, computed automatically by trigger';
COMMENT ON COLUMN audit_logs.previous_hash IS 'SHA-256 hash of previous entry in chain, enabling tamper detection';
COMMENT ON COLUMN audit_logs.input_hash IS 'SHA-256 of AI input data (allows verification without storing PII)';
COMMENT ON COLUMN audit_logs.output_hash IS 'SHA-256 of AI output data';
COMMENT ON FUNCTION verify_audit_chain IS 'Verifies the integrity of the audit hash chain for a user. Returns is_valid=false if tampering detected.';
