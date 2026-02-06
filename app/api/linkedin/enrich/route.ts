import { NextRequest, NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Email pattern templates
const EMAIL_PATTERNS = [
  (first: string, last: string, domain: string) => `${first}@${domain}`,
  (first: string, last: string, domain: string) => `${first}.${last}@${domain}`,
  (first: string, last: string, domain: string) => `${first}${last}@${domain}`,
  (first: string, last: string, domain: string) => `${first[0]}${last}@${domain}`,
  (first: string, last: string, domain: string) => `${first}_${last}@${domain}`,
  (first: string, last: string, domain: string) => `${first}-${last}@${domain}`,
  (first: string, last: string, domain: string) => `${last}@${domain}`,
  (first: string, last: string, domain: string) => `${first[0]}.${last}@${domain}`,
];

// Common company domain mappings
const COMPANY_DOMAINS: Record<string, string> = {
  "google": "google.com",
  "microsoft": "microsoft.com",
  "amazon": "amazon.com",
  "meta": "meta.com",
  "facebook": "fb.com",
  "apple": "apple.com",
  "netflix": "netflix.com",
  "spotify": "spotify.com",
  "stripe": "stripe.com",
  "shopify": "shopify.com",
  "salesforce": "salesforce.com",
  "atlassian": "atlassian.com",
  "slack": "slack.com",
  "twitter": "x.com",
  "linkedin": "linkedin.com",
  "uber": "uber.com",
  "airbnb": "airbnb.com",
  "dropbox": "dropbox.com",
  "github": "github.com",
  "gitlab": "gitlab.com",
};

function normalizeCompanyToDomain(company: string): string | null {
  if (!company) return null;
  
  const normalized = company.toLowerCase()
    .replace(/\s*(inc|llc|ltd|corp|gmbh|as|a\/s|aps)\.?\s*$/i, '')
    .trim();
  
  // Check known mappings
  for (const [key, domain] of Object.entries(COMPANY_DOMAINS)) {
    if (normalized.includes(key)) {
      return domain;
    }
  }
  
  // Try to construct domain from company name
  const simplified = normalized
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20);
  
  if (simplified.length >= 2) {
    return `${simplified}.com`;
  }
  
  return null;
}

function generateEmailPatterns(name: string, company: string): string[] {
  if (!name || !company) return [];
  
  const nameParts = name.toLowerCase().split(/\s+/).filter(Boolean);
  if (nameParts.length < 2) return [];
  
  const first = nameParts[0].replace(/[^a-z]/g, '');
  const last = nameParts[nameParts.length - 1].replace(/[^a-z]/g, '');
  
  if (!first || !last) return [];
  
  const domain = normalizeCompanyToDomain(company);
  if (!domain) return [];
  
  return EMAIL_PATTERNS.map(pattern => pattern(first, last, domain));
}

async function searchGitHub(name: string): Promise<any[]> {
  try {
    // Search GitHub users by name
    const query = encodeURIComponent(name);
    const response = await fetch(
      `https://api.github.com/search/users?q=${query}+type:user&per_page=5`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'RecruitOS-Enrichment/1.0',
        },
      }
    );
    
    if (!response.ok) {
      console.error('[Enrich] GitHub search failed:', response.status);
      return [];
    }
    
    const data = await response.json();
    return (data.items || []).map((user: any) => ({
      username: user.login,
      profileUrl: user.html_url,
      avatarUrl: user.avatar_url,
      type: user.type,
    }));
  } catch (error) {
    console.error('[Enrich] GitHub search error:', error);
    return [];
  }
}

/**
 * POST /api/linkedin/enrich
 * Enrich a candidate with email patterns and GitHub profiles
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, company, linkedinId } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Generate email patterns
    const emailPatterns = generateEmailPatterns(name, company || '');
    
    // Search GitHub
    const githubProfiles = await searchGitHub(name);
    
    // Compute likely domain
    const companyDomain = company ? normalizeCompanyToDomain(company) : null;
    
    const enrichment = {
      linkedinId,
      name,
      company,
      companyDomain,
      emailPatterns,
      githubProfiles,
      enrichedAt: new Date().toISOString(),
    };
    
    console.log('[Enrich] Generated enrichment for:', name);
    
    return NextResponse.json({
      success: true,
      enrichment,
    }, { headers: corsHeaders });
    
  } catch (error: any) {
    console.error('[Enrich] Error:', error);
    return NextResponse.json(
      { error: "Enrichment failed", details: error?.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
