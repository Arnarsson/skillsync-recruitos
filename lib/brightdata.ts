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
      return localStorage.getItem('brightdata_api_key');
    }
    return process.env.BRIGHTDATA_API_KEY || null;
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

  async scrapeLinkedInProfile(linkedInUrl: string): Promise<LinkedInProfile | null> {
    try {
      // Trigger the scrape
      const snapshotId = await this.triggerLinkedInScrape(linkedInUrl);

      // Poll for completion (max 60 seconds)
      const maxAttempts = 30;
      let attempts = 0;

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const progress = await this.checkProgress(snapshotId);

        if (progress.status === 'ready') {
          const rawData = await this.getSnapshot(snapshotId);
          return this.parseLinkedInData(rawData);
        }

        if (progress.status === 'failed') {
          throw new Error('LinkedIn scrape failed');
        }

        attempts++;
      }

      throw new Error('LinkedIn scrape timed out');
    } catch (error) {
      console.error('BrightData scrape error:', error);
      return null;
    }
  }

  private parseLinkedInData(rawData: any): LinkedInProfile {
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
      connectionCount: rawData.connections_count || rawData.connections || 0,
      followerCount: rawData.followers_count || rawData.followers || 0,
      experience: (rawData.experience || rawData.positions || []).map((exp: any) => ({
        title: exp.title || '',
        company: exp.company_name || exp.company || '',
        companyLogo: exp.company_logo || '',
        location: exp.location || '',
        startDate: exp.start_date || exp.starts_at || '',
        endDate: exp.end_date || exp.ends_at || null,
        duration: exp.duration || '',
        description: exp.description || '',
      })),
      education: (rawData.education || []).map((edu: any) => ({
        school: edu.school_name || edu.school || '',
        degree: edu.degree_name || edu.degree || '',
        field: edu.field_of_study || edu.field || '',
        startYear: edu.start_year || null,
        endYear: edu.end_year || null,
      })),
      skills: (rawData.skills || []).map((skill: any) => ({
        name: typeof skill === 'string' ? skill : skill.name || '',
        endorsements: skill.endorsements || 0,
      })),
      recommendations: (rawData.recommendations || []).map((rec: any) => ({
        author: rec.recommender_name || rec.author || '',
        authorTitle: rec.recommender_title || '',
        relationship: rec.relationship || '',
        text: rec.text || rec.recommendation || '',
      })),
      posts: (rawData.posts || rawData.activities || []).map((post: any) => ({
        text: post.text || post.content || '',
        likes: post.likes || post.num_likes || 0,
        comments: post.comments || post.num_comments || 0,
        shares: post.shares || post.num_shares || 0,
        date: post.date || post.posted_at || '',
      })),
      connections: (rawData.connections || rawData.people_also_viewed || []).map((conn: any) => ({
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
