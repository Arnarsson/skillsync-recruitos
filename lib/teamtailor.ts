/**
 * Team Tailor API Integration
 * 
 * Export RecruitOS profiles to Team Tailor candidates.
 * Team Tailor API: https://docs.teamtailor.com
 * 
 * Authentication: API Token (X-Api-Key header)
 * Base URL: https://api.teamtailor.com/v1
 */

export interface TeamTailorConfig {
  apiKey: string;
  companyId?: string;
}

export interface TeamTailorCandidate {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  linkedin_url?: string;
  github_url?: string;
  tags?: string[];
  pitch?: string;
  referred_by?: string;
  department_id?: string;
  role_id?: string;
  custom_fields?: Record<string, any>;
}

export interface RecruitOSProfile {
  username: string;
  name: string;
  email?: string;
  location?: string;
  bio?: string;
  company?: string;
  blog?: string;
  twitter_username?: string;
  linkedin?: string;
  followers: number;
  hireable?: boolean;
  skills?: string[];
  languages?: string[];
  topRepos?: Array<{
    name: string;
    description: string;
    stars: number;
    language: string;
  }>;
}

class TeamTailorService {
  private baseUrl = 'https://api.teamtailor.com/v1';
  private apiKey: string;
  
  constructor(config: TeamTailorConfig) {
    this.apiKey = config.apiKey;
  }

  /**
   * Create or update a candidate in Team Tailor
   */
  async createCandidate(candidate: TeamTailorCandidate): Promise<any> {
    const response = await fetch(`${this.baseUrl}/candidates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token token=${this.apiKey}`,
        'X-Api-Version': '20210218',
      },
      body: JSON.stringify({
        data: {
          type: 'candidates',
          attributes: candidate,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Team Tailor API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Map RecruitOS profile to Team Tailor candidate format
   */
  mapRecruitOSToTeamTailor(profile: RecruitOSProfile): TeamTailorCandidate {
    const [firstName = '', ...lastNameParts] = (profile.name || profile.username).split(' ');
    const lastName = lastNameParts.join(' ') || '';

    // Build a pitch from bio and top repos
    let pitch = profile.bio || '';
    if (profile.topRepos && profile.topRepos.length > 0) {
      pitch += '\n\n🌟 Notable Projects:\n';
      profile.topRepos.slice(0, 3).forEach(repo => {
        pitch += `• ${repo.name} (${repo.stars}⭐): ${repo.description || 'No description'}\n`;
      });
    }

    // Add skills as tags
    const tags = [
      ...(profile.skills || []),
      ...(profile.languages || []),
    ].filter(Boolean);

    return {
      first_name: firstName,
      last_name: lastName,
      email: profile.email || `${profile.username}@github.user`,
      linkedin_url: profile.linkedin,
      github_url: `https://github.com/${profile.username}`,
      tags: tags.slice(0, 10), // Limit tags
      pitch: pitch.slice(0, 5000), // Team Tailor pitch limit
      custom_fields: {
        github_username: profile.username,
        github_followers: profile.followers,
        location: profile.location,
        company: profile.company,
        hireable: profile.hireable,
        website: profile.blog,
        twitter: profile.twitter_username,
      },
    };
  }

  /**
   * Export a RecruitOS profile to Team Tailor
   */
  async exportProfile(profile: RecruitOSProfile): Promise<any> {
    const candidate = this.mapRecruitOSToTeamTailor(profile);
    return this.createCandidate(candidate);
  }

  /**
   * Bulk export multiple profiles
   */
  async bulkExport(profiles: RecruitOSProfile[]): Promise<{
    successful: number;
    failed: number;
    errors: Array<{ username: string; error: string }>;
  }> {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ username: string; error: string }>,
    };

    for (const profile of profiles) {
      try {
        await this.exportProfile(profile);
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          username: profile.username,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      
      // Rate limiting: wait 500ms between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  }

  /**
   * Test the API connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/jobs`, {
        method: 'GET',
        headers: {
          'Authorization': `Token token=${this.apiKey}`,
          'X-Api-Version': '20210218',
        },
      });

      if (response.ok) {
        return { success: true, message: 'Connected to Team Tailor successfully' };
      } else {
        return { success: false, message: `API returned status ${response.status}` };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export default TeamTailorService;
