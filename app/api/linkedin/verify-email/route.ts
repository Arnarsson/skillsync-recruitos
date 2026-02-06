import { NextRequest, NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

interface VerificationResult {
  email: string;
  status: "valid" | "invalid" | "unknown" | "accept_all" | "disposable";
  score: number;
  sources?: string[];
  firstName?: string;
  lastName?: string;
  position?: string;
  company?: string;
}

/**
 * POST /api/linkedin/verify-email
 * Verify email using Hunter.io API or fallback to pattern scoring
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, company } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400, headers: corsHeaders }
      );
    }
    
    const hunterApiKey = process.env.HUNTER_API_KEY;
    
    // If Hunter API key is configured, use it
    if (hunterApiKey) {
      try {
        const response = await fetch(
          `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${hunterApiKey}`
        );
        
        if (response.ok) {
          const data = await response.json();
          const result: VerificationResult = {
            email,
            status: data.data?.status || "unknown",
            score: data.data?.score || 0,
            sources: data.data?.sources?.map((s: any) => s.domain) || [],
            firstName: data.data?.first_name,
            lastName: data.data?.last_name,
            position: data.data?.position,
            company: data.data?.company,
          };
          
          return NextResponse.json({
            success: true,
            verification: result,
            source: "hunter",
          }, { headers: corsHeaders });
        }
      } catch (hunterError) {
        console.error("[Verify] Hunter API error:", hunterError);
      }
    }
    
    // Fallback: Pattern-based scoring
    const result = scoreEmailPattern(email, name, company);
    
    return NextResponse.json({
      success: true,
      verification: result,
      source: "pattern",
      note: hunterApiKey ? "Hunter API failed, using pattern scoring" : "Add HUNTER_API_KEY for real verification",
    }, { headers: corsHeaders });
    
  } catch (error: any) {
    console.error("[Verify] Error:", error);
    return NextResponse.json(
      { error: "Verification failed", details: error?.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

function scoreEmailPattern(email: string, name?: string, company?: string): VerificationResult {
  let score = 50; // Base score
  
  const emailLower = email.toLowerCase();
  const [localPart, domain] = emailLower.split("@");
  
  // Domain quality scoring
  const corporateDomains = ["google.com", "microsoft.com", "amazon.com", "meta.com", "apple.com", "stripe.com"];
  const suspiciousDomains = ["tempmail", "guerrilla", "10minute", "throwaway", "mailinator"];
  
  if (corporateDomains.some(d => domain.includes(d.split(".")[0]))) {
    score += 20; // Known corporate domain
  }
  
  if (suspiciousDomains.some(d => domain.includes(d))) {
    score -= 40; // Suspicious domain
    return { email, status: "disposable", score: Math.max(0, score) };
  }
  
  // Check if name matches email pattern
  if (name) {
    const nameParts = name.toLowerCase().split(/\s+/);
    const firstName = nameParts[0]?.replace(/[^a-z]/g, "") || "";
    const lastName = nameParts[nameParts.length - 1]?.replace(/[^a-z]/g, "") || "";
    
    // Check for common patterns
    if (localPart.includes(firstName) && localPart.includes(lastName)) {
      score += 25; // Both names in email
    } else if (localPart.includes(firstName) || localPart.includes(lastName)) {
      score += 15; // One name in email
    } else if (localPart.includes(firstName[0]) && localPart.includes(lastName)) {
      score += 20; // First initial + last name
    }
  }
  
  // Check if company matches domain
  if (company) {
    const companySimplified = company.toLowerCase().replace(/[^a-z0-9]/g, "");
    const domainName = domain.split(".")[0];
    
    if (domainName.includes(companySimplified.substring(0, 6)) || 
        companySimplified.includes(domainName)) {
      score += 20; // Company matches domain
    }
  }
  
  // Basic format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { email, status: "invalid", score: 0 };
  }
  
  // Determine status based on score
  let status: VerificationResult["status"];
  if (score >= 80) status = "valid";
  else if (score >= 60) status = "accept_all";
  else if (score >= 40) status = "unknown";
  else status = "invalid";
  
  return {
    email,
    status,
    score: Math.min(100, Math.max(0, score)),
  };
}

/**
 * GET /api/linkedin/verify-email
 * Find email for a person using Hunter.io email finder
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");
  const firstName = searchParams.get("first_name");
  const lastName = searchParams.get("last_name");
  
  if (!domain || !firstName || !lastName) {
    return NextResponse.json(
      { error: "domain, first_name, and last_name are required" },
      { status: 400, headers: corsHeaders }
    );
  }
  
  const hunterApiKey = process.env.HUNTER_API_KEY;
  
  if (!hunterApiKey) {
    return NextResponse.json({
      success: false,
      error: "HUNTER_API_KEY not configured",
      suggestion: "Add HUNTER_API_KEY to your environment variables",
    }, { status: 503, headers: corsHeaders });
  }
  
  try {
    const response = await fetch(
      `https://api.hunter.io/v2/email-finder?domain=${encodeURIComponent(domain)}&first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}&api_key=${hunterApiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`Hunter API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      email: data.data?.email,
      score: data.data?.score,
      position: data.data?.position,
      sources: data.data?.sources,
    }, { headers: corsHeaders });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: "Email finder failed",
      details: error?.message,
    }, { status: 500, headers: corsHeaders });
  }
}
