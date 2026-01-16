-- Team Collaboration Schema for RecruitOS
-- Phase 3: Team & Collaboration Features
--
-- This migration creates tables for:
-- - Teams: Company/organization teams
-- - Team Members: Users belonging to teams with roles
-- - Pipelines: Shared candidate pipelines
-- - Pipeline Candidates: Ephemeral candidate data linked to pipelines
-- - Comments: Discussion threads on candidates

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TEAMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  settings JSONB DEFAULT '{}', -- Team settings (notifications, defaults, etc.)

  -- Subscription info
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'enterprise')),
  stripe_customer_id TEXT,
  subscription_status TEXT DEFAULT 'active'
);

-- Index for faster lookups
CREATE INDEX idx_teams_owner ON teams(owner_id);
CREATE INDEX idx_teams_slug ON teams(slug);

-- ============================================================================
-- TEAM MEMBERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role-based access control
  role TEXT NOT NULL DEFAULT 'recruiter'
    CHECK (role IN ('admin', 'recruiter', 'hiring_manager', 'viewer')),

  -- Permissions (can be customized beyond role defaults)
  permissions JSONB DEFAULT '{}',

  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),

  -- Unique constraint: one user can only be in a team once
  UNIQUE(team_id, user_id)
);

-- Indexes for team member lookups
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_status ON team_members(status);

-- ============================================================================
-- PIPELINES (Shared Candidate Collections)
-- ============================================================================

CREATE TABLE IF NOT EXISTS pipelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

  -- Pipeline metadata
  name TEXT NOT NULL,
  description TEXT,

  -- Job context (what role is this pipeline for)
  job_context JSONB DEFAULT '{}', -- { title, company, skills, location, etc. }

  -- Pipeline settings
  is_archived BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE, -- Default pipeline for the team

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Statistics (denormalized for performance)
  candidate_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_pipelines_team ON pipelines(team_id);
CREATE INDEX idx_pipelines_created_by ON pipelines(created_by);
CREATE INDEX idx_pipelines_archived ON pipelines(is_archived) WHERE NOT is_archived;

-- ============================================================================
-- PIPELINE CANDIDATES (Ephemeral - No permanent talent pool)
-- ============================================================================

CREATE TABLE IF NOT EXISTS pipeline_candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,

  -- Candidate identifier (e.g., GitHub username, LinkedIn URL)
  external_id TEXT NOT NULL,
  external_source TEXT DEFAULT 'github' CHECK (external_source IN ('github', 'linkedin', 'manual')),

  -- Snapshot of candidate data at time of addition
  -- This is ephemeral - we don't store permanent profiles
  candidate_data JSONB NOT NULL, -- Full candidate object as shown in UI

  -- Pipeline stage
  stage TEXT DEFAULT 'new'
    CHECK (stage IN ('new', 'shortlisted', 'contacted', 'interviewing', 'offered', 'hired', 'rejected')),

  -- Scores and analysis (cached)
  alignment_score INTEGER,
  engagement_score INTEGER,
  is_open_to_work BOOLEAN,

  -- Timestamps
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id),
  stage_changed_at TIMESTAMP WITH TIME ZONE,
  stage_changed_by UUID REFERENCES auth.users(id),

  -- Unique: same candidate can't be added twice to same pipeline
  UNIQUE(pipeline_id, external_id)
);

-- Indexes
CREATE INDEX idx_pipeline_candidates_pipeline ON pipeline_candidates(pipeline_id);
CREATE INDEX idx_pipeline_candidates_stage ON pipeline_candidates(stage);
CREATE INDEX idx_pipeline_candidates_added_by ON pipeline_candidates(added_by);
CREATE INDEX idx_pipeline_candidates_external ON pipeline_candidates(external_id);

-- ============================================================================
-- CANDIDATE COMMENTS (Threaded Discussion)
-- ============================================================================

CREATE TABLE IF NOT EXISTS candidate_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pipeline_candidate_id UUID NOT NULL REFERENCES pipeline_candidates(id) ON DELETE CASCADE,

  -- Comment content
  content TEXT NOT NULL,

  -- Threading support
  parent_id UUID REFERENCES candidate_comments(id) ON DELETE CASCADE,

  -- Author
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,

  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_comments_candidate ON candidate_comments(pipeline_candidate_id);
CREATE INDEX idx_comments_user ON candidate_comments(user_id);
CREATE INDEX idx_comments_parent ON candidate_comments(parent_id);

-- ============================================================================
-- ACTIVITY LOG (Audit Trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS pipeline_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE,
  pipeline_candidate_id UUID REFERENCES pipeline_candidates(id) ON DELETE CASCADE,

  -- Activity type
  action TEXT NOT NULL
    CHECK (action IN (
      'candidate_added', 'candidate_removed', 'stage_changed',
      'comment_added', 'outreach_sent', 'score_updated',
      'pipeline_created', 'pipeline_archived', 'member_invited',
      'member_joined', 'member_removed'
    )),

  -- Activity details
  details JSONB DEFAULT '{}',

  -- Who did it
  user_id UUID REFERENCES auth.users(id),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activity_team ON pipeline_activity(team_id);
CREATE INDEX idx_activity_pipeline ON pipeline_activity(pipeline_id);
CREATE INDEX idx_activity_user ON pipeline_activity(user_id);
CREATE INDEX idx_activity_created ON pipeline_activity(created_at);

-- ============================================================================
-- TEAM INVITATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

  -- Invitation details
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'recruiter',

  -- Token for accepting invitation
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),

  -- Who invited
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate invitations
  UNIQUE(team_id, email)
);

-- Index
CREATE INDEX idx_invitations_token ON team_invitations(token);
CREATE INDEX idx_invitations_email ON team_invitations(email);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Teams: Members can read, admins can update
CREATE POLICY "Team members can view their team" ON teams
  FOR SELECT USING (
    id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Team admins can update their team" ON teams
  FOR UPDATE USING (
    id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active')
  );

-- Team Members: Members can read team members, admins can manage
CREATE POLICY "Team members can view other members" ON team_members
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Team admins can manage members" ON team_members
  FOR ALL USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active')
  );

-- Pipelines: Team members can view, recruiters+ can manage
CREATE POLICY "Team members can view pipelines" ON pipelines
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Recruiters can manage pipelines" ON pipelines
  FOR ALL USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'recruiter')
      AND status = 'active'
    )
  );

-- Pipeline Candidates: Similar to pipelines
CREATE POLICY "Team members can view candidates" ON pipeline_candidates
  FOR SELECT USING (
    pipeline_id IN (
      SELECT p.id FROM pipelines p
      JOIN team_members tm ON p.team_id = tm.team_id
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );

CREATE POLICY "Recruiters can manage candidates" ON pipeline_candidates
  FOR ALL USING (
    pipeline_id IN (
      SELECT p.id FROM pipelines p
      JOIN team_members tm ON p.team_id = tm.team_id
      WHERE tm.user_id = auth.uid()
      AND tm.role IN ('admin', 'recruiter')
      AND tm.status = 'active'
    )
  );

-- Comments: Team members can read, anyone can add
CREATE POLICY "Team members can view comments" ON candidate_comments
  FOR SELECT USING (
    pipeline_candidate_id IN (
      SELECT pc.id FROM pipeline_candidates pc
      JOIN pipelines p ON pc.pipeline_id = p.id
      JOIN team_members tm ON p.team_id = tm.team_id
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );

CREATE POLICY "Team members can add comments" ON candidate_comments
  FOR INSERT WITH CHECK (
    pipeline_candidate_id IN (
      SELECT pc.id FROM pipeline_candidates pc
      JOIN pipelines p ON pc.pipeline_id = p.id
      JOIN team_members tm ON p.team_id = tm.team_id
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );

-- Activity: Team members can view
CREATE POLICY "Team members can view activity" ON pipeline_activity
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND status = 'active')
  );

-- Invitations: Only admins can manage, invitees can view their own
CREATE POLICY "Admins can manage invitations" ON team_invitations
  FOR ALL USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER pipelines_updated_at
  BEFORE UPDATE ON pipelines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to update candidate count on pipelines
CREATE OR REPLACE FUNCTION update_pipeline_candidate_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE pipelines
    SET candidate_count = candidate_count + 1,
        last_activity_at = NOW()
    WHERE id = NEW.pipeline_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE pipelines
    SET candidate_count = candidate_count - 1,
        last_activity_at = NOW()
    WHERE id = OLD.pipeline_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pipeline_candidates_count
  AFTER INSERT OR DELETE ON pipeline_candidates
  FOR EACH ROW EXECUTE FUNCTION update_pipeline_candidate_count();
