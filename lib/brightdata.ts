// BrightData LinkedIn Scraping Service
// Uses BrightData's Web Scraper API to extract LinkedIn profile data

export interface LinkedInProfile {
  name: string;
  headline: string;
  location: string;
  about: string;
  currentCompany: string;
  currentRole: string;
  profileUrl: string;
  profileImage: string;
  connectionCount: number;
  followerCount: number;
  experience: LinkedInExperience[];
  education: LinkedInEducation[];
  skills: LinkedInSkill[];
  recommendations: LinkedInRecommendation[];
  posts: LinkedInPost[];
  connections: LinkedInConnection[];
}

export interface LinkedInExperience {
  title: string;
  company: string;
  companyLogo?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  duration: string;
  description?: string;
}

export interface LinkedInEducation {
  school: string;
  degree?: string;
  field?: string;
  startYear?: number;
  endYear?: number;
}

export interface LinkedInSkill {
  name: string;
  endorsements: number;
}

export interface LinkedInRecommendation {
  author: string;
  authorTitle: string;
  relationship: string;
  text: string;
}

export interface LinkedInPost {
  text: string;
  likes: number;
  comments: number;
  shares: number;
  date: string;
}

export interface LinkedInConnection {
  name: string;
  headline: string;
  profileUrl: string;
  profileImage?: string;
  mutualConnections?: number;
  connectionDegree: 1 | 2 | 3;
}

export interface NetworkNode {
  id: string;
  name: string;
  title: string;
  company: string;
  image?: string;
  type: 'target' | 'connection' | 'mutual';
  connectionDegree?: number;
}

export interface NetworkEdge {
  source: string;
  target: string;
  strength: number;
  type: 'direct' | 'mutual' | 'company';
}

export interface NetworkGraph {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  clusters: NetworkCluster[];
}

export interface NetworkCluster {
  id: string;
  name: string;
  type: 'company' | 'industry' | 'school' | 'location';
  nodeIds: string[];
}

// BrightData API response types
interface BrightDataTriggerResponse {
  snapshot_id: string;
  status: string;
}

interface BrightDataProgressResponse {
  status: 'running' | 'ready' | 'failed';
  progress?: number;
}

interface BrightDataSnapshotResponse {
  data: any[];
  status: string;
}

class BrightDataService {
  private apiKey: string | null = null;
  private baseUrl = '/api/brightdata';

  setApiKey(key: string) {
    this.apiKey = key;
  }

  getApiKey(): string | null {
    if (this.apiKey) return this.apiKey;
    if (typeof window !== 'undefined') {
      // Check localStorage first (both key formats for compatibility)
      const storedKey = localStorage.getItem('BRIGHTDATA_API_KEY') || localStorage.getItem('brightdata_api_key');
      if (storedKey) return storedKey;
      // Then check NEXT_PUBLIC env var for client-side
      return process.env.NEXT_PUBLIC_BRIGHTDATA_API_KEY || null;
    }
    return process.env.BRIGHTDATA_API_KEY || null;
  }

  isConfigured(): boolean {
    return !!this.getApiKey();
  }

  async triggerLinkedInScrape(linkedInUrl: string): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('BrightData API key not configured');
    }

    const response = await fetch(`${this.baseUrl}/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey,
        url: linkedInUrl,
        dataset: 'linkedin_profile',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to trigger LinkedIn scrape');
    }

    const data: BrightDataTriggerResponse = await response.json();
    return data.snapshot_id;
  }

  async checkProgress(snapshotId: string): Promise<BrightDataProgressResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('BrightData API key not configured');
    }

    const response = await fetch(`${this.baseUrl}/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey,
        snapshotId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to check scrape progress');
    }

    return response.json();
  }

  async getSnapshot(snapshotId: string): Promise<any> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('BrightData API key not configured');
    }

    const response = await fetch(`${this.baseUrl}/snapshot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey,
        snapshotId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get snapshot');
    }

    const data: BrightDataSnapshotResponse = await response.json();
    return data.data?.[0] || null;
  }

  async scrapeLinkedInProfile(
    linkedInUrl: string,
    onProgress?: (status: string, attempt: number, maxAttempts: number) => void
  ): Promise<LinkedInProfile | null> {
    try {
      // Trigger the scrape
      console.log('[BrightData] Triggering scrape for:', linkedInUrl);
      const snapshotId = await this.triggerLinkedInScrape(linkedInUrl);
      console.log('[BrightData] Got snapshot ID:', snapshotId);

      // Poll for completion (max 180 seconds - BrightData can be slow)
      const maxAttempts = 60; // 60 attempts × 3 seconds = 180 seconds max
      let attempts = 0;

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        attempts++;

        try {
          const progress = await this.checkProgress(snapshotId);

          // Report progress
          const statusMsg = progress.progress
            ? `${progress.status} (${Math.round(progress.progress * 100)}%)`
            : progress.status;
          console.log(`[BrightData] Progress check ${attempts}/${maxAttempts}: ${statusMsg}`);
          onProgress?.(statusMsg, attempts, maxAttempts);

          if (progress.status === 'ready') {
            console.log('[BrightData] Scrape ready, fetching data...');
            const rawData = await this.getSnapshot(snapshotId);
            if (rawData) {
              console.log('[BrightData] Successfully retrieved profile data');
              return this.parseLinkedInData(rawData);
            } else {
              console.warn('[BrightData] Scrape ready but no data returned');
              return null;
            }
          }

          if (progress.status === 'failed') {
            console.error('[BrightData] Scrape failed');
            throw new Error('LinkedIn scrape failed - the profile may be private or the URL may be incorrect');
          }
        } catch (progressError) {
          // Log but continue polling - transient errors are common
          console.warn('[BrightData] Progress check error:', progressError);
        }
      }

      throw new Error('LinkedIn scrape timed out after 180 seconds. The profile may be private or BrightData may be experiencing delays.');
    } catch (error) {
      console.error('BrightData scrape error:', error);
      // Re-throw with more context
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to scrape LinkedIn profile');
    }
  }

  private parseLinkedInData(rawData: any): LinkedInProfile {
    // Helper to safely get array from data
    const toArray = (data: any): any[] => {
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object') return Object.values(data);
      return [];
    };

    // Parse BrightData response into our LinkedInProfile structure
    return {
      name: rawData.name || rawData.full_name || '',
      headline: rawData.headline || rawData.title || '',
      location: rawData.location || '',
      about: rawData.about || rawData.summary || '',
      currentCompany: rawData.current_company?.name || rawData.company || '',
      currentRole: rawData.current_company?.title || rawData.title || '',
      profileUrl: rawData.url || rawData.profile_url || '',
      profileImage: rawData.profile_pic_url || rawData.avatar || '',
      connectionCount: typeof rawData.connections_count === 'number' ? rawData.connections_count :
                       typeof rawData.connections === 'number' ? rawData.connections : 0,
      followerCount: rawData.followers_count || rawData.followers || 0,
      experience: toArray(rawData.experience || rawData.positions).map((exp: any) => ({
        title: exp.title || '',
        company: exp.company_name || exp.company || '',
        companyLogo: exp.company_logo || '',
        location: exp.location || '',
        startDate: exp.start_date || exp.starts_at || '',
        endDate: exp.end_date || exp.ends_at || null,
        duration: exp.duration || '',
        description: exp.description || '',
      })),
      education: toArray(rawData.education).map((edu: any) => ({
        school: edu.school_name || edu.school || '',
        degree: edu.degree_name || edu.degree || '',
        field: edu.field_of_study || edu.field || '',
        startYear: edu.start_year || null,
        endYear: edu.end_year || null,
      })),
      skills: toArray(rawData.skills).map((skill: any) => ({
        name: typeof skill === 'string' ? skill : skill.name || '',
        endorsements: skill.endorsements || 0,
      })),
      recommendations: toArray(rawData.recommendations).map((rec: any) => ({
        author: rec.recommender_name || rec.author || '',
        authorTitle: rec.recommender_title || '',
        relationship: rec.relationship || '',
        text: rec.text || rec.recommendation || '',
      })),
      posts: toArray(rawData.posts || rawData.activities).map((post: any) => ({
        text: post.text || post.content || '',
        likes: post.likes || post.num_likes || 0,
        comments: post.comments || post.num_comments || 0,
        shares: post.shares || post.num_shares || 0,
        date: post.date || post.posted_at || '',
      })),
      connections: toArray(rawData.people_also_viewed).map((conn: any) => ({
        name: conn.name || conn.full_name || '',
        headline: conn.headline || conn.title || '',
        profileUrl: conn.url || conn.profile_url || '',
        profileImage: conn.profile_pic_url || '',
        mutualConnections: conn.mutual_connections || 0,
        connectionDegree: conn.degree || 2,
      })),
    };
  }

  buildNetworkGraph(profile: LinkedInProfile): NetworkGraph {
    const nodes: NetworkNode[] = [];
    const edges: NetworkEdge[] = [];
    const clusters: NetworkCluster[] = [];

    // Add target node (the candidate)
    const targetId = 'target';
    nodes.push({
      id: targetId,
      name: profile.name,
      title: profile.currentRole,
      company: profile.currentCompany,
      image: profile.profileImage,
      type: 'target',
    });

    // Group connections by company
    const companyGroups = new Map<string, LinkedInConnection[]>();

    profile.connections.forEach((conn, index) => {
      const nodeId = `conn-${index}`;

      // Extract company from headline
      const companyMatch = conn.headline.match(/at\s+(.+?)(?:\s*\||$)/i);
      const company = companyMatch ? companyMatch[1].trim() : 'Unknown';

      nodes.push({
        id: nodeId,
        name: conn.name,
        title: conn.headline,
        company,
        image: conn.profileImage,
        type: conn.mutualConnections && conn.mutualConnections > 0 ? 'mutual' : 'connection',
        connectionDegree: conn.connectionDegree,
      });

      // Add edge to target
      edges.push({
        source: targetId,
        target: nodeId,
        strength: conn.mutualConnections || 1,
        type: conn.connectionDegree === 1 ? 'direct' : 'mutual',
      });

      // Group by company
      if (!companyGroups.has(company)) {
        companyGroups.set(company, []);
      }
      companyGroups.get(company)!.push(conn);
    });

    // Create company clusters
    companyGroups.forEach((connections, company) => {
      if (connections.length >= 2) {
        const nodeIds = connections.map((_, i) => {
          const index = profile.connections.indexOf(connections[i]);
          return `conn-${index}`;
        });

        clusters.push({
          id: `cluster-${company}`,
          name: company,
          type: 'company',
          nodeIds,
        });

        // Add edges between nodes in same company
        for (let i = 0; i < nodeIds.length; i++) {
          for (let j = i + 1; j < nodeIds.length; j++) {
            edges.push({
              source: nodeIds[i],
              target: nodeIds[j],
              strength: 0.5,
              type: 'company',
            });
          }
        }
      }
    });

    return { nodes, edges, clusters };
  }
}

export const brightDataService = new BrightDataService();
export default brightDataService;
