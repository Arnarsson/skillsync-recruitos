import { getSupabaseBrowserClient } from '@/lib/supabase/client';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type TeamPlan = 'starter' | 'pro' | 'enterprise';
export type MemberRole = 'admin' | 'recruiter' | 'hiring_manager' | 'viewer';
export type MemberStatus = 'pending' | 'active' | 'inactive';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';
export type CandidateStage = 'new' | 'shortlisted' | 'contacted' | 'interviewing' | 'offered' | 'hired' | 'rejected';
export type ExternalSource = 'github' | 'linkedin' | 'manual';

export interface Team {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
  settings: Record<string, unknown>;
  plan: TeamPlan;
  stripeCustomerId?: string;
  subscriptionStatus: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: MemberRole;
  permissions: Record<string, unknown>;
  invitedBy?: string;
  invitedAt: string;
  joinedAt?: string;
  status: MemberStatus;
  // Joined user data (when available)
  user?: {
    id: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
  };
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  email: string;
  role: MemberRole;
  token: string;
  status: InvitationStatus;
  expiresAt: string;
  invitedBy?: string;
  createdAt: string;
}

export interface Pipeline {
  id: string;
  teamId: string;
  name: string;
  description?: string;
  jobContext: Record<string, unknown>;
  isArchived: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  candidateCount: number;
  lastActivityAt?: string;
}

export interface PipelineCandidate {
  id: string;
  pipelineId: string;
  externalId: string;
  externalSource: ExternalSource;
  candidateData: Record<string, unknown>;
  stage: CandidateStage;
  alignmentScore?: number;
  engagementScore?: number;
  isOpenToWork?: boolean;
  addedAt: string;
  addedBy?: string;
  stageChangedAt?: string;
  stageChangedBy?: string;
}

export interface CandidateComment {
  id: string;
  pipelineCandidateId: string;
  content: string;
  parentId?: string;
  userId: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
  // Joined user data (when available)
  user?: {
    id: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
  };
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateTeamInput {
  name: string;
  slug: string;
  logoUrl?: string;
  plan?: TeamPlan;
  settings?: Record<string, unknown>;
}

export interface InviteMemberInput {
  teamId: string;
  email: string;
  role?: MemberRole;
}

export interface CreatePipelineInput {
  teamId: string;
  name: string;
  description?: string;
  jobContext?: Record<string, unknown>;
  isDefault?: boolean;
}

export interface AddCandidateToPipelineInput {
  pipelineId: string;
  externalId: string;
  externalSource?: ExternalSource;
  candidateData: Record<string, unknown>;
  stage?: CandidateStage;
  alignmentScore?: number;
  engagementScore?: number;
  isOpenToWork?: boolean;
}

export interface UpdateCandidateStageInput {
  pipelineCandidateId: string;
  stage: CandidateStage;
}

export interface AddCommentInput {
  pipelineCandidateId: string;
  content: string;
  parentId?: string;
}

// ============================================================================
// RESULT TYPES
// ============================================================================

export interface ServiceResult<T> {
  data: T | null;
  error: ServiceError | null;
}

export interface ServiceError {
  message: string;
  code?: string;
  details?: unknown;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createError(message: string, code?: string, details?: unknown): ServiceError {
  return { message, code, details };
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

// ============================================================================
// TEAM FUNCTIONS
// ============================================================================

/**
 * Creates a new team with the current user as owner and admin member.
 */
export async function createTeam(input: CreateTeamInput): Promise<ServiceResult<Team>> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return {
      data: null,
      error: createError('Supabase client not available. Please configure your database connection.', 'CLIENT_UNAVAILABLE'),
    };
  }

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        data: null,
        error: createError('User not authenticated', 'UNAUTHENTICATED', userError),
      };
    }

    // Generate slug if not provided or validate uniqueness
    const slug = input.slug || generateSlug(input.name);

    // Create the team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: input.name,
        slug,
        logo_url: input.logoUrl || null,
        owner_id: user.id,
        plan: input.plan || 'starter',
        settings: input.settings || {},
      })
      .select()
      .single();

    if (teamError) {
      return {
        data: null,
        error: createError('Failed to create team', teamError.code, teamError),
      };
    }

    // Add the owner as an admin member
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: user.id,
        role: 'admin',
        status: 'active',
        invited_by: user.id,
        joined_at: new Date().toISOString(),
      });

    if (memberError) {
      // Attempt to clean up the team if member creation fails
      await supabase.from('teams').delete().eq('id', team.id);
      return {
        data: null,
        error: createError('Failed to add owner as team member', memberError.code, memberError),
      };
    }

    return {
      data: mapTeamFromDb(team),
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: createError('Unexpected error creating team', 'UNEXPECTED_ERROR', err),
    };
  }
}

/**
 * Invites a member to a team by email. Creates an invitation record.
 */
export async function inviteMember(input: InviteMemberInput): Promise<ServiceResult<TeamInvitation>> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return {
      data: null,
      error: createError('Supabase client not available', 'CLIENT_UNAVAILABLE'),
    };
  }

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        data: null,
        error: createError('User not authenticated', 'UNAUTHENTICATED', userError),
      };
    }

    // Check if invitation already exists for this email and team
    const { data: existingInvite } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('team_id', input.teamId)
      .eq('email', input.email.toLowerCase())
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return {
        data: null,
        error: createError('An invitation already exists for this email', 'DUPLICATE_INVITATION'),
      };
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id, user_id')
      .eq('team_id', input.teamId)
      .single();

    // We need to check by email through auth.users, but for now just create the invitation
    // The application should handle duplicate member detection through the acceptance flow

    // Create the invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .insert({
        team_id: input.teamId,
        email: input.email.toLowerCase(),
        role: input.role || 'recruiter',
        invited_by: user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (inviteError) {
      return {
        data: null,
        error: createError('Failed to create invitation', inviteError.code, inviteError),
      };
    }

    // Log the activity
    await supabase.from('pipeline_activity').insert({
      team_id: input.teamId,
      action: 'member_invited',
      details: { email: input.email.toLowerCase(), role: input.role || 'recruiter' },
      user_id: user.id,
    });

    return {
      data: mapInvitationFromDb(invitation),
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: createError('Unexpected error inviting member', 'UNEXPECTED_ERROR', err),
    };
  }
}

/**
 * Gets all members of a team.
 */
export async function getTeamMembers(teamId: string): Promise<ServiceResult<TeamMember[]>> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return {
      data: null,
      error: createError('Supabase client not available', 'CLIENT_UNAVAILABLE'),
    };
  }

  try {
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .order('joined_at', { ascending: false });

    if (membersError) {
      return {
        data: null,
        error: createError('Failed to fetch team members', membersError.code, membersError),
      };
    }

    return {
      data: members.map(mapMemberFromDb),
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: createError('Unexpected error fetching team members', 'UNEXPECTED_ERROR', err),
    };
  }
}

/**
 * Gets all pipelines for a team.
 */
export async function getTeamPipelines(teamId: string, includeArchived = false): Promise<ServiceResult<Pipeline[]>> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return {
      data: null,
      error: createError('Supabase client not available', 'CLIENT_UNAVAILABLE'),
    };
  }

  try {
    let query = supabase
      .from('pipelines')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }

    const { data: pipelines, error: pipelinesError } = await query;

    if (pipelinesError) {
      return {
        data: null,
        error: createError('Failed to fetch pipelines', pipelinesError.code, pipelinesError),
      };
    }

    return {
      data: pipelines.map(mapPipelineFromDb),
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: createError('Unexpected error fetching pipelines', 'UNEXPECTED_ERROR', err),
    };
  }
}

/**
 * Creates a new pipeline for a team.
 */
export async function createPipeline(input: CreatePipelineInput): Promise<ServiceResult<Pipeline>> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return {
      data: null,
      error: createError('Supabase client not available', 'CLIENT_UNAVAILABLE'),
    };
  }

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        data: null,
        error: createError('User not authenticated', 'UNAUTHENTICATED', userError),
      };
    }

    const { data: pipeline, error: pipelineError } = await supabase
      .from('pipelines')
      .insert({
        team_id: input.teamId,
        name: input.name,
        description: input.description || null,
        job_context: input.jobContext || {},
        is_default: input.isDefault || false,
        created_by: user.id,
      })
      .select()
      .single();

    if (pipelineError) {
      return {
        data: null,
        error: createError('Failed to create pipeline', pipelineError.code, pipelineError),
      };
    }

    // Log the activity
    await supabase.from('pipeline_activity').insert({
      team_id: input.teamId,
      pipeline_id: pipeline.id,
      action: 'pipeline_created',
      details: { name: input.name },
      user_id: user.id,
    });

    return {
      data: mapPipelineFromDb(pipeline),
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: createError('Unexpected error creating pipeline', 'UNEXPECTED_ERROR', err),
    };
  }
}

/**
 * Adds a candidate to a pipeline.
 */
export async function addCandidateToPipeline(input: AddCandidateToPipelineInput): Promise<ServiceResult<PipelineCandidate>> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return {
      data: null,
      error: createError('Supabase client not available', 'CLIENT_UNAVAILABLE'),
    };
  }

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        data: null,
        error: createError('User not authenticated', 'UNAUTHENTICATED', userError),
      };
    }

    // Get the pipeline to find the team_id for activity logging
    const { data: pipeline, error: pipelineError } = await supabase
      .from('pipelines')
      .select('team_id')
      .eq('id', input.pipelineId)
      .single();

    if (pipelineError || !pipeline) {
      return {
        data: null,
        error: createError('Pipeline not found', 'NOT_FOUND', pipelineError),
      };
    }

    const { data: candidate, error: candidateError } = await supabase
      .from('pipeline_candidates')
      .insert({
        pipeline_id: input.pipelineId,
        external_id: input.externalId,
        external_source: input.externalSource || 'github',
        candidate_data: input.candidateData,
        stage: input.stage || 'new',
        alignment_score: input.alignmentScore || null,
        engagement_score: input.engagementScore || null,
        is_open_to_work: input.isOpenToWork || null,
        added_by: user.id,
      })
      .select()
      .single();

    if (candidateError) {
      // Check for duplicate
      if (candidateError.code === '23505') {
        return {
          data: null,
          error: createError('Candidate already exists in this pipeline', 'DUPLICATE_CANDIDATE', candidateError),
        };
      }
      return {
        data: null,
        error: createError('Failed to add candidate', candidateError.code, candidateError),
      };
    }

    // Log the activity
    await supabase.from('pipeline_activity').insert({
      team_id: pipeline.team_id,
      pipeline_id: input.pipelineId,
      pipeline_candidate_id: candidate.id,
      action: 'candidate_added',
      details: {
        external_id: input.externalId,
        external_source: input.externalSource || 'github',
        stage: input.stage || 'new',
      },
      user_id: user.id,
    });

    return {
      data: mapCandidateFromDb(candidate),
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: createError('Unexpected error adding candidate', 'UNEXPECTED_ERROR', err),
    };
  }
}

/**
 * Updates the stage of a candidate in a pipeline.
 */
export async function updateCandidateStage(input: UpdateCandidateStageInput): Promise<ServiceResult<PipelineCandidate>> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return {
      data: null,
      error: createError('Supabase client not available', 'CLIENT_UNAVAILABLE'),
    };
  }

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        data: null,
        error: createError('User not authenticated', 'UNAUTHENTICATED', userError),
      };
    }

    // Get the current candidate to find pipeline and team for activity logging
    const { data: existingCandidate, error: fetchError } = await supabase
      .from('pipeline_candidates')
      .select('*, pipelines(team_id)')
      .eq('id', input.pipelineCandidateId)
      .single();

    if (fetchError || !existingCandidate) {
      return {
        data: null,
        error: createError('Candidate not found', 'NOT_FOUND', fetchError),
      };
    }

    const previousStage = existingCandidate.stage;

    const { data: candidate, error: updateError } = await supabase
      .from('pipeline_candidates')
      .update({
        stage: input.stage,
        stage_changed_at: new Date().toISOString(),
        stage_changed_by: user.id,
      })
      .eq('id', input.pipelineCandidateId)
      .select()
      .single();

    if (updateError) {
      return {
        data: null,
        error: createError('Failed to update candidate stage', updateError.code, updateError),
      };
    }

    // Log the activity
    const pipelineData = existingCandidate.pipelines as { team_id: string } | null;
    if (pipelineData) {
      await supabase.from('pipeline_activity').insert({
        team_id: pipelineData.team_id,
        pipeline_id: existingCandidate.pipeline_id,
        pipeline_candidate_id: input.pipelineCandidateId,
        action: 'stage_changed',
        details: {
          previous_stage: previousStage,
          new_stage: input.stage,
          external_id: existingCandidate.external_id,
        },
        user_id: user.id,
      });
    }

    return {
      data: mapCandidateFromDb(candidate),
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: createError('Unexpected error updating candidate stage', 'UNEXPECTED_ERROR', err),
    };
  }
}

/**
 * Adds a comment to a candidate.
 */
export async function addCommentToCandidate(input: AddCommentInput): Promise<ServiceResult<CandidateComment>> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return {
      data: null,
      error: createError('Supabase client not available', 'CLIENT_UNAVAILABLE'),
    };
  }

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        data: null,
        error: createError('User not authenticated', 'UNAUTHENTICATED', userError),
      };
    }

    // Get the candidate to find pipeline and team for activity logging
    const { data: candidate, error: candidateError } = await supabase
      .from('pipeline_candidates')
      .select('*, pipelines(team_id)')
      .eq('id', input.pipelineCandidateId)
      .single();

    if (candidateError || !candidate) {
      return {
        data: null,
        error: createError('Candidate not found', 'NOT_FOUND', candidateError),
      };
    }

    const { data: comment, error: commentError } = await supabase
      .from('candidate_comments')
      .insert({
        pipeline_candidate_id: input.pipelineCandidateId,
        content: input.content,
        parent_id: input.parentId || null,
        user_id: user.id,
      })
      .select()
      .single();

    if (commentError) {
      return {
        data: null,
        error: createError('Failed to add comment', commentError.code, commentError),
      };
    }

    // Log the activity
    const pipelineData = candidate.pipelines as { team_id: string } | null;
    if (pipelineData) {
      await supabase.from('pipeline_activity').insert({
        team_id: pipelineData.team_id,
        pipeline_id: candidate.pipeline_id,
        pipeline_candidate_id: input.pipelineCandidateId,
        action: 'comment_added',
        details: {
          comment_id: comment.id,
          is_reply: !!input.parentId,
        },
        user_id: user.id,
      });
    }

    return {
      data: mapCommentFromDb(comment),
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: createError('Unexpected error adding comment', 'UNEXPECTED_ERROR', err),
    };
  }
}

/**
 * Gets all comments for a candidate.
 */
export async function getCandidateComments(pipelineCandidateId: string): Promise<ServiceResult<CandidateComment[]>> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return {
      data: null,
      error: createError('Supabase client not available', 'CLIENT_UNAVAILABLE'),
    };
  }

  try {
    const { data: comments, error: commentsError } = await supabase
      .from('candidate_comments')
      .select('*')
      .eq('pipeline_candidate_id', pipelineCandidateId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (commentsError) {
      return {
        data: null,
        error: createError('Failed to fetch comments', commentsError.code, commentsError),
      };
    }

    return {
      data: comments.map(mapCommentFromDb),
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: createError('Unexpected error fetching comments', 'UNEXPECTED_ERROR', err),
    };
  }
}

/**
 * Gets candidates in a pipeline, optionally filtered by stage.
 */
export async function getPipelineCandidates(
  pipelineId: string,
  stage?: CandidateStage
): Promise<ServiceResult<PipelineCandidate[]>> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return {
      data: null,
      error: createError('Supabase client not available', 'CLIENT_UNAVAILABLE'),
    };
  }

  try {
    let query = supabase
      .from('pipeline_candidates')
      .select('*')
      .eq('pipeline_id', pipelineId)
      .order('added_at', { ascending: false });

    if (stage) {
      query = query.eq('stage', stage);
    }

    const { data: candidates, error: candidatesError } = await query;

    if (candidatesError) {
      return {
        data: null,
        error: createError('Failed to fetch candidates', candidatesError.code, candidatesError),
      };
    }

    return {
      data: candidates.map(mapCandidateFromDb),
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: createError('Unexpected error fetching candidates', 'UNEXPECTED_ERROR', err),
    };
  }
}

// ============================================================================
// DATABASE MAPPING FUNCTIONS
// ============================================================================

function mapTeamFromDb(row: Record<string, unknown>): Team {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    logoUrl: row.logo_url as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    ownerId: row.owner_id as string | undefined,
    settings: (row.settings as Record<string, unknown>) || {},
    plan: row.plan as TeamPlan,
    stripeCustomerId: row.stripe_customer_id as string | undefined,
    subscriptionStatus: row.subscription_status as string,
  };
}

function mapMemberFromDb(row: Record<string, unknown>): TeamMember {
  return {
    id: row.id as string,
    teamId: row.team_id as string,
    userId: row.user_id as string,
    role: row.role as MemberRole,
    permissions: (row.permissions as Record<string, unknown>) || {},
    invitedBy: row.invited_by as string | undefined,
    invitedAt: row.invited_at as string,
    joinedAt: row.joined_at as string | undefined,
    status: row.status as MemberStatus,
  };
}

function mapInvitationFromDb(row: Record<string, unknown>): TeamInvitation {
  return {
    id: row.id as string,
    teamId: row.team_id as string,
    email: row.email as string,
    role: row.role as MemberRole,
    token: row.token as string,
    status: row.status as InvitationStatus,
    expiresAt: row.expires_at as string,
    invitedBy: row.invited_by as string | undefined,
    createdAt: row.created_at as string,
  };
}

function mapPipelineFromDb(row: Record<string, unknown>): Pipeline {
  return {
    id: row.id as string,
    teamId: row.team_id as string,
    name: row.name as string,
    description: row.description as string | undefined,
    jobContext: (row.job_context as Record<string, unknown>) || {},
    isArchived: row.is_archived as boolean,
    isDefault: row.is_default as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    createdBy: row.created_by as string | undefined,
    candidateCount: row.candidate_count as number,
    lastActivityAt: row.last_activity_at as string | undefined,
  };
}

function mapCandidateFromDb(row: Record<string, unknown>): PipelineCandidate {
  return {
    id: row.id as string,
    pipelineId: row.pipeline_id as string,
    externalId: row.external_id as string,
    externalSource: row.external_source as ExternalSource,
    candidateData: (row.candidate_data as Record<string, unknown>) || {},
    stage: row.stage as CandidateStage,
    alignmentScore: row.alignment_score as number | undefined,
    engagementScore: row.engagement_score as number | undefined,
    isOpenToWork: row.is_open_to_work as boolean | undefined,
    addedAt: row.added_at as string,
    addedBy: row.added_by as string | undefined,
    stageChangedAt: row.stage_changed_at as string | undefined,
    stageChangedBy: row.stage_changed_by as string | undefined,
  };
}

function mapCommentFromDb(row: Record<string, unknown>): CandidateComment {
  return {
    id: row.id as string,
    pipelineCandidateId: row.pipeline_candidate_id as string,
    content: row.content as string,
    parentId: row.parent_id as string | undefined,
    userId: row.user_id as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string | undefined,
    deletedAt: row.deleted_at as string | undefined,
  };
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const teamService = {
  createTeam,
  inviteMember,
  getTeamMembers,
  getTeamPipelines,
  createPipeline,
  addCandidateToPipeline,
  updateCandidateStage,
  addCommentToCandidate,
  getCandidateComments,
  getPipelineCandidates,
};

export default teamService;
