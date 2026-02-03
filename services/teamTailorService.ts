/**
 * Team Tailor Integration Service
 * 
 * Exports RecruitOS candidate profiles to Team Tailor ATS.
 * Critical for Danish market adoption.
 * 
 * API Documentation: https://docs.teamtailor.com/
 */

import { Candidate } from '@/types';

interface TeamTailorConfig {
  apiToken: string;
  apiVersion?: string;
  baseUrl?: string;
}

interface TeamTailorCandidate {
  data: {
    type: 'candidates';
    attributes: {
      'first-name': string;
      'last-name': string;
      email?: string;
      phone?: string;
      pitch?: string; // Cover letter / summary
      'linkedin-url'?: string;
      'resume-text'?: string;
      tags?: string[];
      'custom-fields'?: Record<string, unknown>;
      'referred-by'?: string;
      sources?: string[];
    };
    relationships?: {
      job?: {
        data: {
          type: 'jobs';
          id: string;
        };
      };
    };
  };
}

interface TeamTailorResponse {
  data: {
    id: string;
    type: 'candidates';
    attributes: Record<string, unknown>;
    links: {
      self: string;
    };
  };
}

interface ExportResult {
  success: boolean;
  candidateId?: string;
  teamTailorId?: string;
  teamTailorUrl?: string;
  error?: string;
  details?: string;
}

export class TeamTailorService {
  private apiToken: string;
  private baseUrl: string;
  private apiVersion: string;

  constructor(config: TeamTailorConfig) {
    this.apiToken = config.apiToken;
    this.baseUrl = config.baseUrl || 'https://api.teamtailor.com';
    this.apiVersion = config.apiVersion || 'v1';
  }

  /**
   * Export a RecruitOS candidate to Team Tailor
   */
  async exportCandidate(
    candidate: Candidate,
    options?: {
      jobId?: string; // Team Tailor job ID to apply to
      email?: string; // Required for Team Tailor
      phone?: string;
      includeEvidence?: boolean; // Include evidence in custom fields
      tags?: string[]; // Additional tags
    }
  ): Promise<ExportResult> {
    try {
      // Validate required fields
      if (!options?.email) {
        return {
          success: false,
          candidateId: candidate.id,
          error: 'EMAIL_REQUIRED',
          details: 'Email is required for Team Tailor export'
        };
      }

      const teamTailorCandidate = this.transformCandidate(candidate, options);
      
      const response = await fetch(`${this.baseUrl}/${this.apiVersion}/candidates`, {
        method: 'POST',
        headers: {
          'Authorization': `Token token=${this.apiToken}`,
          'Content-Type': 'application/vnd.api+json',
          'X-Api-Version': this.apiVersion,
        },
        body: JSON.stringify(teamTailorCandidate),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          candidateId: candidate.id,
          error: `TEAM_TAILOR_API_ERROR_${response.status}`,
          details: JSON.stringify(errorData),
        };
      }

      const result: TeamTailorResponse = await response.json();

      return {
        success: true,
        candidateId: candidate.id,
        teamTailorId: result.data.id,
        teamTailorUrl: result.data.links.self,
      };

    } catch (error) {
      return {
        success: false,
        candidateId: candidate.id,
        error: 'EXPORT_FAILED',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Transform RecruitOS candidate to Team Tailor format
   */
  private transformCandidate(
    candidate: Candidate,
    options: {
      jobId?: string;
      email: string;
      phone?: string;
      includeEvidence?: boolean;
      tags?: string[];
    }
  ): TeamTailorCandidate {
    // Parse name (Team Tailor requires first/last name separately)
    const nameParts = candidate.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || 'Unknown';

    // Build pitch from shortlist summary and key evidence
    let pitch = candidate.shortlistSummary || '';
    if (options.includeEvidence && candidate.keyEvidence?.length) {
      pitch += '\n\nKey Evidence:\n' + candidate.keyEvidence.join('\n');
    }

    // Build tags from skills, persona, and custom tags
    const tags: string[] = [
      `RecruitOS-Score-${candidate.alignmentScore}`,
      `Source-RecruitOS`,
      ...(options.tags || []),
    ];

    // Add seniority tag if available
    if (candidate.persona?.psychometric) {
      tags.push(`Persona-${candidate.persona.archetype}`);
    }

    // Build custom fields for Team Tailor
    const customFields: Record<string, unknown> = {
      recruitos_id: candidate.id,
      alignment_score: candidate.alignmentScore,
      years_experience: candidate.yearsExperience,
      location: candidate.location,
    };

    if (candidate.scoreBreakdown) {
      customFields.score_breakdown = {
        skills: candidate.scoreBreakdown.skills.percentage,
        experience: candidate.scoreBreakdown.experience.percentage,
        industry: candidate.scoreBreakdown.industry.percentage,
        seniority: candidate.scoreBreakdown.seniority.percentage,
        location: candidate.scoreBreakdown.location.percentage,
      };
    }

    if (candidate.persona) {
      customFields.persona_archetype = candidate.persona.archetype;
      customFields.communication_style = candidate.persona.psychometric.communicationStyle;
      customFields.primary_motivator = candidate.persona.psychometric.primaryMotivator;
    }

    // Build relationships (job application)
    const relationships: TeamTailorCandidate['data']['relationships'] = {};
    if (options.jobId) {
      relationships.job = {
        data: {
          type: 'jobs',
          id: options.jobId,
        },
      };
    }

    return {
      data: {
        type: 'candidates',
        attributes: {
          'first-name': firstName,
          'last-name': lastName,
          email: options.email,
          phone: options.phone,
          pitch: pitch,
          'linkedin-url': candidate.linkedinUrl,
          'resume-text': candidate.rawProfileText,
          tags: tags,
          'custom-fields': customFields,
          'referred-by': 'RecruitOS',
          sources: ['RecruitOS AI Platform'],
        },
        ...(Object.keys(relationships).length > 0 ? { relationships } : {}),
      },
    };
  }

  /**
   * Batch export multiple candidates
   */
  async exportCandidates(
    candidates: Array<Candidate & { email: string; phone?: string }>,
    options?: {
      jobId?: string;
      includeEvidence?: boolean;
      tags?: string[];
      maxConcurrent?: number; // Rate limiting
    }
  ): Promise<ExportResult[]> {
    const maxConcurrent = options?.maxConcurrent || 3; // Team Tailor rate limits
    const results: ExportResult[] = [];

    // Process in batches to respect rate limits
    for (let i = 0; i < candidates.length; i += maxConcurrent) {
      const batch = candidates.slice(i, i + maxConcurrent);
      const batchResults = await Promise.all(
        batch.map(candidate =>
          this.exportCandidate(candidate, {
            jobId: options?.jobId,
            email: candidate.email,
            phone: candidate.phone,
            includeEvidence: options?.includeEvidence,
            tags: options?.tags,
          })
        )
      );
      results.push(...batchResults);

      // Rate limit delay between batches (Team Tailor allows ~10 req/sec)
      if (i + maxConcurrent < candidates.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.apiVersion}/jobs?page[size]=1`, {
        headers: {
          'Authorization': `Token token=${this.apiToken}`,
          'X-Api-Version': this.apiVersion,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `API returned ${response.status}: ${response.statusText}`,
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Create Team Tailor service instance from environment
 */
export function createTeamTailorService(): TeamTailorService | null {
  const apiToken = process.env.TEAMTAILOR_API_TOKEN;

  if (!apiToken) {
    console.warn('[TeamTailor] API token not configured');
    return null;
  }

  return new TeamTailorService({
    apiToken,
    baseUrl: process.env.TEAMTAILOR_API_URL,
    apiVersion: process.env.TEAMTAILOR_API_VERSION,
  });
}
