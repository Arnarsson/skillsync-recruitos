import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

interface CapturedProfile {
  id: string;
  linkedinId: string;
  name: string;
  headline: string;
  currentCompany: string;
  location: string;
  experience: { title: string; company: string; dates?: string }[];
  connectionDegree?: string;
  mutualConnections?: string;
}

interface CompanyNode {
  company: string;
  employees: {
    id: string;
    name: string;
    title: string;
    linkedinId: string;
    connectionDegree?: string;
  }[];
  totalCaptured: number;
  locations: string[];
  titles: string[];
}

interface NetworkAnalysis {
  companies: CompanyNode[];
  sharedEmployers: {
    company: string;
    profiles: string[];
  }[];
  connectionStrength: {
    firstDegree: number;
    secondDegree: number;
    thirdDegree: number;
    unknown: number;
  };
  topLocations: { location: string; count: number }[];
  potentialColleagues: {
    personA: string;
    personB: string;
    sharedCompany: string;
    overlapPeriod?: string;
  }[];
}

function extractTitle(headline: string, company: string): string {
  if (!headline) return 'Unknown';
  
  // Try to extract title before @ or at
  const atMatch = headline.match(/^([^@|]+?)(?:\s*[@|]\s*|\s+at\s+)/i);
  if (atMatch) return atMatch[1].trim();
  
  // If company name is in headline, extract what's before it
  if (company) {
    const companyIndex = headline.toLowerCase().indexOf(company.toLowerCase());
    if (companyIndex > 0) {
      return headline.substring(0, companyIndex).replace(/\s*[@|]\s*$/, '').trim();
    }
  }
  
  // Just return first part
  return headline.split(/[|•·]/)[0].trim().substring(0, 50);
}

function analyzeNetwork(profiles: CapturedProfile[]): NetworkAnalysis {
  // Build company map
  const companyMap = new Map<string, CompanyNode>();
  
  profiles.forEach(profile => {
    const company = profile.currentCompany?.trim();
    if (!company) return;
    
    if (!companyMap.has(company)) {
      companyMap.set(company, {
        company,
        employees: [],
        totalCaptured: 0,
        locations: [],
        titles: [],
      });
    }
    
    const node = companyMap.get(company)!;
    const title = extractTitle(profile.headline, company);
    
    node.employees.push({
      id: profile.id,
      name: profile.name,
      title,
      linkedinId: profile.linkedinId,
      connectionDegree: profile.connectionDegree,
    });
    node.totalCaptured++;
    
    if (profile.location && !node.locations.includes(profile.location)) {
      node.locations.push(profile.location);
    }
    if (title && !node.titles.includes(title)) {
      node.titles.push(title);
    }
  });
  
  // Find shared employers (people who worked at same company in their history)
  const employerHistory = new Map<string, Set<string>>();
  
  profiles.forEach(profile => {
    const companies = new Set<string>();
    if (profile.currentCompany) companies.add(profile.currentCompany.toLowerCase());
    profile.experience?.forEach(exp => {
      if (exp.company) companies.add(exp.company.toLowerCase());
    });
    
    companies.forEach(company => {
      if (!employerHistory.has(company)) {
        employerHistory.set(company, new Set());
      }
      employerHistory.get(company)!.add(profile.name);
    });
  });
  
  const sharedEmployers = Array.from(employerHistory.entries())
    .filter(([_, profiles]) => profiles.size > 1)
    .map(([company, profileSet]) => ({
      company,
      profiles: Array.from(profileSet),
    }))
    .sort((a, b) => b.profiles.length - a.profiles.length)
    .slice(0, 10);
  
  // Connection strength analysis
  const connectionStrength = {
    firstDegree: 0,
    secondDegree: 0,
    thirdDegree: 0,
    unknown: 0,
  };
  
  profiles.forEach(profile => {
    const degree = profile.connectionDegree?.toLowerCase() || '';
    if (degree.includes('1st')) connectionStrength.firstDegree++;
    else if (degree.includes('2nd')) connectionStrength.secondDegree++;
    else if (degree.includes('3rd')) connectionStrength.thirdDegree++;
    else connectionStrength.unknown++;
  });
  
  // Top locations
  const locationCount = new Map<string, number>();
  profiles.forEach(profile => {
    if (profile.location) {
      locationCount.set(profile.location, (locationCount.get(profile.location) || 0) + 1);
    }
  });
  
  const topLocations = Array.from(locationCount.entries())
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Find potential colleagues (same company in history, possibly overlapping)
  const potentialColleagues: NetworkAnalysis['potentialColleagues'] = [];
  
  sharedEmployers.forEach(({ company, profiles: names }) => {
    if (names.length >= 2) {
      for (let i = 0; i < names.length - 1 && potentialColleagues.length < 20; i++) {
        for (let j = i + 1; j < names.length && potentialColleagues.length < 20; j++) {
          potentialColleagues.push({
            personA: names[i],
            personB: names[j],
            sharedCompany: company,
          });
        }
      }
    }
  });
  
  return {
    companies: Array.from(companyMap.values())
      .sort((a, b) => b.totalCaptured - a.totalCaptured)
      .slice(0, 20),
    sharedEmployers,
    connectionStrength,
    topLocations,
    potentialColleagues,
  };
}

/**
 * POST /api/linkedin/network
 * Analyze network relationships from captured profiles
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { profiles } = body;
    
    if (!profiles || !Array.isArray(profiles)) {
      return NextResponse.json(
        { error: "profiles array is required" },
        { status: 400 }
      );
    }
    
    const analysis = analyzeNetwork(profiles);
    
    return NextResponse.json({
      success: true,
      analysis,
      profileCount: profiles.length,
      analyzedAt: new Date().toISOString(),
    });
    
  } catch (error: any) {
    console.error('[Network] Analysis error:', error);
    return NextResponse.json(
      { error: "Network analysis failed", details: error?.message },
      { status: 500 }
    );
  }
}
