 
/**
 * Network Analysis Service - GraphRAG-style Connection Mapping
 *
 * Uses BrightData's People Dataset and SERP API to:
 * 1. Discover mutual connections with hiring team
 * 2. Map shared employers/schools for warm intros
 * 3. Calculate industry influence scores
 * 4. Build a traversable network graph
 */

import type {
  NetworkGraph,
  NetworkNode,
  NetworkEdge,
  WarmIntroPath,
  IndustryInfluence,
} from '../types';

// Helper to safely get env vars
const getEnv = (key: string): string | undefined => {
  try {
    return typeof process !== 'undefined' && process.env ? process.env[key] : undefined;
  } catch {
    return undefined;
  }
};

const getBrightDataKey = (): string | null => {
  return localStorage.getItem('BRIGHTDATA_API_KEY') || getEnv('BRIGHTDATA_API_KEY') || null;
};

interface LinkedInConnection {
  name: string;
  headline?: string;
  profileUrl?: string;
  company?: string;
  sharedConnections?: number;
}

interface LinkedInExperience {
  company: string;
  title: string;
  startDate?: string;
  endDate?: string;
  location?: string;
}

interface LinkedInEducation {
  school: string;
  degree?: string;
  field?: string;
  startYear?: number;
  endYear?: number;
}

interface LinkedInProfileData {
  name: string;
  headline?: string;
  location?: string;
  connections?: number;
  followers?: number;
  experience?: LinkedInExperience[];
  education?: LinkedInEducation[];
  skills?: string[];
  endorsements?: Array<{ skill: string; count: number }>;
  recommendations?: number;
}

/**
 * Fetch LinkedIn profile data via BrightData
 */
async function fetchLinkedInProfile(linkedinUrl: string): Promise<LinkedInProfileData | null> {
  const brightDataKey = getBrightDataKey();
  if (!brightDataKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[NetworkAnalysis] BrightData API key not configured');
    }
    return null;
  }

  try {
    // Trigger BrightData scrape
    const triggerResponse = await fetch('/api/brightdata?action=trigger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-BrightData-Key': brightDataKey,
      },
      body: JSON.stringify({ url: linkedinUrl }),
    });

    if (!triggerResponse.ok) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[NetworkAnalysis] Failed to trigger BrightData scrape');
      }
      return null;
    }

    const { snapshot_id } = await triggerResponse.json();
    if (!snapshot_id) return null;

    // Poll for results (max 60 seconds)
    const maxAttempts = 30;
    const pollInterval = 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const progressResponse = await fetch(
        `/api/brightdata?action=progress&snapshot_id=${snapshot_id}`,
        { headers: { 'X-BrightData-Key': brightDataKey } }
      );

      if (!progressResponse.ok) break;

      const progress = await progressResponse.json();

      if (progress.status === 'ready' && progress.records > 0) {
        const snapshotResponse = await fetch(
          `/api/brightdata?action=snapshot&snapshot_id=${snapshot_id}`,
          { headers: { 'X-BrightData-Key': brightDataKey } }
        );

        if (snapshotResponse.ok) {
          const data = await snapshotResponse.json();
          // BrightData returns array of records
          const profile = Array.isArray(data) ? data[0] : data;
          return normalizeLinkedInProfile(profile);
        }
        break;
      } else if (progress.status === 'failed') {
        break;
      }
    }

    return null;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[NetworkAnalysis] Error fetching LinkedIn profile:', error);
    }
    return null;
  }
}

/**
 * Normalize BrightData response to our interface
 */
function normalizeLinkedInProfile(raw: Record<string, unknown>): LinkedInProfileData {
  return {
    name: (raw.name as string) || (raw.full_name as string) || '',
    headline: (raw.headline as string) || (raw.title as string) || undefined,
    location: (raw.location as string) || undefined,
    connections: typeof raw.connections === 'number' ? raw.connections : undefined,
    followers: typeof raw.followers === 'number' ? raw.followers : undefined,
    experience: normalizeExperience(raw.experience || raw.positions),
    education: normalizeEducation(raw.education),
    skills: Array.isArray(raw.skills) ? raw.skills.map((s: unknown) =>
      typeof s === 'string' ? s : (s as { name?: string })?.name || ''
    ).filter(Boolean) : undefined,
    endorsements: normalizeEndorsements(raw.endorsements || raw.skills),
    recommendations: typeof raw.recommendations === 'number' ? raw.recommendations : undefined,
  };
}

function normalizeExperience(exp: unknown): LinkedInExperience[] | undefined {
  if (!Array.isArray(exp)) return undefined;
  return exp.map((e: Record<string, unknown>) => ({
    company: (e.company as string) || (e.company_name as string) || '',
    title: (e.title as string) || (e.position as string) || '',
    startDate: (e.start_date as string) || (e.starts_at as string) || undefined,
    endDate: (e.end_date as string) || (e.ends_at as string) || undefined,
    location: (e.location as string) || undefined,
  })).filter(e => e.company || e.title);
}

function normalizeEducation(edu: unknown): LinkedInEducation[] | undefined {
  if (!Array.isArray(edu)) return undefined;
  return edu.map((e: Record<string, unknown>) => ({
    school: (e.school as string) || (e.institution as string) || '',
    degree: (e.degree as string) || undefined,
    field: (e.field as string) || (e.field_of_study as string) || undefined,
    startYear: typeof e.start_year === 'number' ? e.start_year : undefined,
    endYear: typeof e.end_year === 'number' ? e.end_year : undefined,
  })).filter(e => e.school);
}

function normalizeEndorsements(data: unknown): Array<{ skill: string; count: number }> | undefined {
  if (!Array.isArray(data)) return undefined;
  return data
    .map((item: unknown) => {
      if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, unknown>;
        return {
          skill: (obj.skill as string) || (obj.name as string) || '',
          count: typeof obj.endorsement_count === 'number'
            ? obj.endorsement_count
            : (typeof obj.count === 'number' ? obj.count : 0),
        };
      }
      return null;
    })
    .filter((e): e is { skill: string; count: number } => e !== null && e.skill !== '');
}

/**
 * Search for people via BrightData SERP API
 */
async function searchPeopleViaSERP(query: string): Promise<Array<{ name: string; url: string; snippet: string }>> {
  const brightDataKey = getBrightDataKey();
  if (!brightDataKey) return [];

  try {
    const triggerResponse = await fetch('/api/brightdata?action=serp-trigger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-BrightData-Key': brightDataKey,
      },
      body: JSON.stringify({ keyword: query }),
    });

    if (!triggerResponse.ok) return [];

    const { snapshot_id } = await triggerResponse.json();
    if (!snapshot_id) return [];

    // Poll for results
    const maxAttempts = 15;
    const pollInterval = 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const progressResponse = await fetch(
        `/api/brightdata?action=progress&snapshot_id=${snapshot_id}`,
        { headers: { 'X-BrightData-Key': brightDataKey } }
      );

      if (!progressResponse.ok) break;

      const progress = await progressResponse.json();

      if (progress.status === 'ready' && progress.records > 0) {
        const snapshotResponse = await fetch(
          `/api/brightdata?action=snapshot&snapshot_id=${snapshot_id}`,
          { headers: { 'X-BrightData-Key': brightDataKey } }
        );

        if (snapshotResponse.ok) {
          const serpData = await snapshotResponse.json();
          const results: Array<{ name: string; url: string; snippet: string }> = [];

          for (const item of serpData) {
            if (item.organic_results) {
              for (const result of item.organic_results) {
                if (result.url?.includes('linkedin.com/in/')) {
                  results.push({
                    name: result.title?.replace(' | LinkedIn', '') || 'Unknown',
                    url: result.url,
                    snippet: result.snippet || '',
                  });
                }
              }
            }
          }
          return results;
        }
        break;
      } else if (progress.status === 'failed') {
        break;
      }
    }

    return [];
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[NetworkAnalysis] SERP search error:', error);
    }
    return [];
  }
}

/**
 * Calculate industry influence score from profile data
 */
function calculateInfluence(profile: LinkedInProfileData): IndustryInfluence {
  let thoughtLeadershipScore = 0;

  // Base score from connections
  if (profile.connections) {
    if (profile.connections >= 500) thoughtLeadershipScore += 20;
    else if (profile.connections >= 200) thoughtLeadershipScore += 10;
    else if (profile.connections >= 100) thoughtLeadershipScore += 5;
  }

  // Followers bonus
  if (profile.followers) {
    if (profile.followers >= 10000) thoughtLeadershipScore += 30;
    else if (profile.followers >= 5000) thoughtLeadershipScore += 20;
    else if (profile.followers >= 1000) thoughtLeadershipScore += 10;
  }

  // Endorsements bonus
  const totalEndorsements = profile.endorsements?.reduce((sum, e) => sum + e.count, 0) || 0;
  if (totalEndorsements >= 100) thoughtLeadershipScore += 20;
  else if (totalEndorsements >= 50) thoughtLeadershipScore += 10;
  else if (totalEndorsements >= 20) thoughtLeadershipScore += 5;

  // Recommendations bonus
  if (profile.recommendations) {
    if (profile.recommendations >= 10) thoughtLeadershipScore += 15;
    else if (profile.recommendations >= 5) thoughtLeadershipScore += 10;
    else if (profile.recommendations >= 2) thoughtLeadershipScore += 5;
  }

  // Cap at 100
  thoughtLeadershipScore = Math.min(thoughtLeadershipScore, 100);

  return {
    followerCount: profile.followers,
    endorsementCount: totalEndorsements || undefined,
    thoughtLeadershipScore,
    communityEngagement: [], // Would need additional data sources
    publicationCount: undefined, // Would need Medium/Dev.to API
    speakingEngagements: undefined, // Would need event scraping
  };
}

/**
 * Find shared employers between candidate and hiring team
 */
function findSharedEmployers(
  candidateProfile: LinkedInProfileData,
  teamProfiles: LinkedInProfileData[]
): Array<{ company: string; overlap: string; people: string[] }> {
  const candidateCompanies = new Set(
    candidateProfile.experience?.map((e) => e.company.toLowerCase()) || []
  );

  const shared: Map<string, string[]> = new Map();

  for (const teamMember of teamProfiles) {
    for (const exp of teamMember.experience || []) {
      const companyLower = exp.company.toLowerCase();
      if (candidateCompanies.has(companyLower)) {
        const people = shared.get(companyLower) || [];
        if (!people.includes(teamMember.name)) {
          people.push(teamMember.name);
        }
        shared.set(companyLower, people);
      }
    }
  }

  return Array.from(shared.entries()).map(([company, people]) => ({
    company: company.charAt(0).toUpperCase() + company.slice(1), // Capitalize
    overlap: people.length === 1 ? '1 team member' : `${people.length} team members`,
    people,
  }));
}

/**
 * Find shared schools between candidate and hiring team
 */
function findSharedSchools(
  candidateProfile: LinkedInProfileData,
  teamProfiles: LinkedInProfileData[]
): Array<{ school: string; years: string; people: string[] }> {
  const candidateSchools = new Set(
    candidateProfile.education?.map((e) => e.school.toLowerCase()) || []
  );

  const shared: Map<string, { people: string[]; years: Set<number> }> = new Map();

  for (const teamMember of teamProfiles) {
    for (const edu of teamMember.education || []) {
      const schoolLower = edu.school.toLowerCase();
      if (candidateSchools.has(schoolLower)) {
        const existing = shared.get(schoolLower) || { people: [], years: new Set() };
        if (!existing.people.includes(teamMember.name)) {
          existing.people.push(teamMember.name);
        }
        if (edu.endYear) existing.years.add(edu.endYear);
        shared.set(schoolLower, existing);
      }
    }
  }

  return Array.from(shared.entries()).map(([school, data]) => ({
    school: school
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
    years: data.years.size > 0 ? Array.from(data.years).sort().join(', ') : 'Unknown',
    people: data.people,
  }));
}

/**
 * Build warm intro paths based on network analysis
 */
function buildWarmIntroPaths(
  candidateName: string,
  sharedEmployers: Array<{ company: string; overlap: string; people: string[] }>,
  sharedSchools: Array<{ school: string; years: string; people: string[] }>
): WarmIntroPath[] {
  const paths: WarmIntroPath[] = [];

  // Paths through shared employers (strongest)
  for (const employer of sharedEmployers) {
    for (const person of employer.people) {
      paths.push({
        targetPerson: candidateName,
        pathNodes: [person, candidateName],
        pathLength: 1,
        introQuality: 'hot',
        suggestedApproach: `${person} worked at ${employer.company} - can provide direct intro and context`,
        commonGround: [`Both worked at ${employer.company}`],
      });
    }
  }

  // Paths through shared schools (strong)
  for (const school of sharedSchools) {
    for (const person of school.people) {
      // Check if this person is already in a path
      const existingPath = paths.find(
        (p) => p.pathNodes[0] === person
      );

      if (existingPath) {
        existingPath.commonGround.push(`Both attended ${school.school}`);
      } else {
        paths.push({
          targetPerson: candidateName,
          pathNodes: [person, candidateName],
          pathLength: 1,
          introQuality: 'warm',
          suggestedApproach: `${person} attended ${school.school} - alumni connection`,
          commonGround: [`Both attended ${school.school}`],
        });
      }
    }
  }

  // Sort by quality (hot > warm > cold)
  const qualityOrder = { hot: 0, warm: 1, cold: 2 };
  paths.sort((a, b) => qualityOrder[a.introQuality] - qualityOrder[b.introQuality]);

  return paths;
}

/**
 * Build network nodes from profile data
 */
function buildNetworkNodes(
  candidateProfile: LinkedInProfileData,
  candidateId: string,
  teamProfiles: LinkedInProfileData[]
): NetworkNode[] {
  const nodes: NetworkNode[] = [];

  // Add candidate as central node
  nodes.push({
    id: candidateId,
    type: 'candidate',
    name: candidateProfile.name,
    role: candidateProfile.headline,
    connectionStrength: 'strong',
  });

  // Add companies from candidate's experience
  for (const exp of candidateProfile.experience || []) {
    const companyId = `company-${exp.company.toLowerCase().replace(/\s+/g, '-')}`;
    if (!nodes.find((n) => n.id === companyId)) {
      nodes.push({
        id: companyId,
        type: 'company',
        name: exp.company,
        connectionStrength: 'strong',
      });
    }
  }

  // Add schools from candidate's education
  for (const edu of candidateProfile.education || []) {
    const schoolId = `school-${edu.school.toLowerCase().replace(/\s+/g, '-')}`;
    if (!nodes.find((n) => n.id === schoolId)) {
      nodes.push({
        id: schoolId,
        type: 'school',
        name: edu.school,
        connectionStrength: 'moderate',
      });
    }
  }

  // Add team members
  for (const teamMember of teamProfiles) {
    const memberId = `person-${teamMember.name.toLowerCase().replace(/\s+/g, '-')}`;
    nodes.push({
      id: memberId,
      type: 'person',
      name: teamMember.name,
      role: teamMember.headline,
      relationship: 'Hiring team',
      connectionStrength: 'moderate',
    });
  }

  return nodes;
}

/**
 * Build network edges from profile relationships
 */
function buildNetworkEdges(
  candidateId: string,
  candidateProfile: LinkedInProfileData,
  teamProfiles: LinkedInProfileData[]
): NetworkEdge[] {
  const edges: NetworkEdge[] = [];

  // Edges from candidate to their companies
  for (const exp of candidateProfile.experience || []) {
    const companyId = `company-${exp.company.toLowerCase().replace(/\s+/g, '-')}`;
    edges.push({
      source: candidateId,
      target: companyId,
      type: 'worked_with',
      weight: exp.endDate ? 0.6 : 0.9, // Current job has higher weight
      context: exp.title,
    });
  }

  // Edges from candidate to their schools
  for (const edu of candidateProfile.education || []) {
    const schoolId = `school-${edu.school.toLowerCase().replace(/\s+/g, '-')}`;
    edges.push({
      source: candidateId,
      target: schoolId,
      type: 'studied_with',
      weight: 0.5,
      context: edu.degree ? `${edu.degree} in ${edu.field || 'N/A'}` : undefined,
    });
  }

  // Edges from team members to shared companies/schools
  for (const teamMember of teamProfiles) {
    const memberId = `person-${teamMember.name.toLowerCase().replace(/\s+/g, '-')}`;

    for (const exp of teamMember.experience || []) {
      const companyId = `company-${exp.company.toLowerCase().replace(/\s+/g, '-')}`;
      // Check if candidate also worked there
      const candidateWorkedThere = candidateProfile.experience?.some(
        (e) => e.company.toLowerCase() === exp.company.toLowerCase()
      );

      if (candidateWorkedThere) {
        edges.push({
          source: memberId,
          target: companyId,
          type: 'worked_with',
          weight: 0.7,
          context: `${teamMember.name} also worked here`,
        });
      }
    }

    for (const edu of teamMember.education || []) {
      const schoolId = `school-${edu.school.toLowerCase().replace(/\s+/g, '-')}`;
      // Check if candidate also attended
      const candidateAttended = candidateProfile.education?.some(
        (e) => e.school.toLowerCase() === edu.school.toLowerCase()
      );

      if (candidateAttended) {
        edges.push({
          source: memberId,
          target: schoolId,
          type: 'studied_with',
          weight: 0.5,
          context: `${teamMember.name} is an alumni`,
        });
      }
    }
  }

  return edges;
}

/**
 * Main function: Build a network graph for a candidate
 */
export async function buildNetworkGraph(
  candidateId: string,
  linkedinUrl: string,
  teamLinkedInUrls: string[] = []
): Promise<NetworkGraph | null> {
  if (process.env.NODE_ENV === 'development') {
    console.log('[NetworkAnalysis] Building network graph for:', linkedinUrl);
    console.log('[NetworkAnalysis] Team profiles to compare:', teamLinkedInUrls.length);
  }

  // Fetch candidate profile
  const candidateProfile = await fetchLinkedInProfile(linkedinUrl);
  if (!candidateProfile) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[NetworkAnalysis] Could not fetch candidate profile');
    }
    return null;
  }

  // Fetch team profiles in parallel
  const teamProfiles: LinkedInProfileData[] = [];
  const teamFetches = teamLinkedInUrls.map(async (url) => {
    const profile = await fetchLinkedInProfile(url);
    if (profile) teamProfiles.push(profile);
  });
  await Promise.all(teamFetches);

  if (process.env.NODE_ENV === 'development') {
    console.log('[NetworkAnalysis] Fetched team profiles:', teamProfiles.length);
  }

  // Build network components
  const nodes = buildNetworkNodes(candidateProfile, candidateId, teamProfiles);
  const edges = buildNetworkEdges(candidateId, candidateProfile, teamProfiles);
  const sharedEmployers = findSharedEmployers(candidateProfile, teamProfiles);
  const sharedSchools = findSharedSchools(candidateProfile, teamProfiles);
  const warmIntroPaths = buildWarmIntroPaths(
    candidateProfile.name,
    sharedEmployers,
    sharedSchools
  );
  const industryInfluence = calculateInfluence(candidateProfile);

  // Find mutual connections (team members with shared companies/schools)
  const mutualConnections: NetworkNode[] = teamProfiles
    .filter((tp) => {
      const hasSharedEmployer = tp.experience?.some((e) =>
        candidateProfile.experience?.some(
          (ce) => ce.company.toLowerCase() === e.company.toLowerCase()
        )
      );
      const hasSharedSchool = tp.education?.some((e) =>
        candidateProfile.education?.some(
          (ce) => ce.school.toLowerCase() === e.school.toLowerCase()
        )
      );
      return hasSharedEmployer || hasSharedSchool;
    })
    .map((tp) => ({
      id: `person-${tp.name.toLowerCase().replace(/\s+/g, '-')}`,
      type: 'person' as const,
      name: tp.name,
      role: tp.headline,
      relationship: 'Team member with shared background',
      connectionStrength: 'strong' as const,
    }));

  const networkGraph: NetworkGraph = {
    candidateNodeId: candidateId,
    nodes,
    edges,
    warmIntroPaths,
    mutualConnections,
    sharedEmployers,
    sharedSchools,
    industryInfluence,
    generatedAt: new Date().toISOString(),
    dataFreshness: 'live',
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('[NetworkAnalysis] ✅ Network graph built:', {
      nodes: nodes.length,
      edges: edges.length,
      warmPaths: warmIntroPaths.length,
      mutualConnections: mutualConnections.length,
    });
  }

  return networkGraph;
}

/**
 * Quick network scan - lighter version without full team comparison
 */
export async function quickNetworkScan(
  candidateId: string,
  linkedinUrl: string
): Promise<Partial<NetworkGraph> | null> {
  const candidateProfile = await fetchLinkedInProfile(linkedinUrl);
  if (!candidateProfile) return null;

  const industryInfluence = calculateInfluence(candidateProfile);

  return {
    candidateNodeId: candidateId,
    industryInfluence,
    nodes: buildNetworkNodes(candidateProfile, candidateId, []),
    edges: [],
    warmIntroPaths: [],
    mutualConnections: [],
    sharedEmployers: [],
    sharedSchools: [],
    generatedAt: new Date().toISOString(),
    dataFreshness: 'live',
  };
}

/**
 * Search for potential connections via SERP
 */
export async function searchNetworkConnections(
  candidateName: string,
  companies: string[]
): Promise<LinkedInConnection[]> {
  const connections: LinkedInConnection[] = [];

  for (const company of companies.slice(0, 3)) {
    // Limit to 3 companies
    const query = `site:linkedin.com/in "${candidateName}" "${company}"`;
    const results = await searchPeopleViaSERP(query);

    for (const result of results) {
      connections.push({
        name: result.name,
        headline: result.snippet,
        profileUrl: result.url,
        company,
      });
    }
  }

  return connections;
}
