import { NextRequest, NextResponse } from "next/server";
import dns from "dns";
import { promisify } from "util";
import { requireAuth } from "@/lib/auth-guard";

const resolveMx = promisify(dns.resolveMx);

// Known disposable email domains
const DISPOSABLE_DOMAINS = new Set([
  "tempmail.com", "guerrillamail.com", "10minutemail.com", "throwaway.email",
  "mailinator.com", "yopmail.com", "temp-mail.org", "fakeinbox.com",
  "trashmail.com", "getnada.com", "tempail.com", "dispostable.com",
  "mailnesia.com", "tempr.email", "discard.email", "spamgourmet.com",
  "mytrashmail.com", "mt2015.com", "thankyou2010.com", "trash2009.com",
  "sharklasers.com", "guerrillamailblock.com", "pokemail.net", "spam4.me",
]);

interface VerificationResult {
  email: string;
  status: "valid" | "invalid" | "unknown" | "risky" | "disposable";
  score: number;
  checks: {
    format: boolean;
    mxRecord: boolean;
    disposable: boolean;
    patternMatch: number;
  };
}

/**
 * Check if domain has valid MX records (can receive email)
 */
async function checkMxRecord(domain: string): Promise<boolean> {
  try {
    const records = await resolveMx(domain);
    return records && records.length > 0;
  } catch {
    return false;
  }
}

/**
 * POST /api/linkedin/verify-email
 * Free email verification: MX check + disposable detection + pattern scoring
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { email, name, company } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }
    
    const result = await verifyEmail(email, name, company);
    
    return NextResponse.json({
      success: true,
      verification: result,
      source: "free",
    });
    
  } catch (error: any) {
    console.error("[Verify] Error:", error);
    return NextResponse.json(
      { error: "Verification failed", details: error?.message },
      { status: 500 }
    );
  }
}

async function verifyEmail(email: string, name?: string, company?: string): Promise<VerificationResult> {
  const emailLower = email.toLowerCase().trim();
  const [localPart, domain] = emailLower.split("@");
  
  const checks = {
    format: false,
    mxRecord: false,
    disposable: false,
    patternMatch: 0,
  };
  
  // 1. Format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  checks.format = emailRegex.test(emailLower);
  
  if (!checks.format) {
    return { email, status: "invalid", score: 0, checks };
  }
  
  // 2. Disposable check
  checks.disposable = DISPOSABLE_DOMAINS.has(domain);
  
  if (checks.disposable) {
    return { email, status: "disposable", score: 10, checks };
  }
  
  // 3. MX record check
  checks.mxRecord = await checkMxRecord(domain);
  
  // 4. Pattern match scoring
  checks.patternMatch = calculatePatternScore(localPart, domain, name, company);
  
  // Calculate final score
  let score = 30; // Base
  if (checks.mxRecord) score += 30;
  score += checks.patternMatch;
  score = Math.min(100, Math.max(0, score));
  
  // Determine status
  let status: VerificationResult["status"];
  if (!checks.mxRecord) {
    status = "invalid";
    score = Math.min(score, 20);
  } else if (score >= 75) {
    status = "valid";
  } else if (score >= 50) {
    status = "risky";
  } else {
    status = "unknown";
  }
  
  return { email, status, score, checks };
}

function calculatePatternScore(localPart: string, domain: string, name?: string, company?: string): number {
  let score = 0;
  
  // Known corporate domains boost
  const corporateDomains = ["google", "microsoft", "amazon", "meta", "apple", "stripe", "spotify", "netflix", "uber", "airbnb"];
  const domainName = domain.split(".")[0];
  
  if (corporateDomains.includes(domainName)) {
    score += 15;
  }
  
  // Name pattern matching
  if (name) {
    const nameParts = name.toLowerCase().split(/\s+/);
    const firstName = nameParts[0]?.replace(/[^a-z]/g, "") || "";
    const lastName = nameParts[nameParts.length - 1]?.replace(/[^a-z]/g, "") || "";
    
    if (firstName && lastName) {
      // Check common patterns
      if (localPart === `${firstName}.${lastName}`) score += 25;
      else if (localPart === `${firstName}${lastName}`) score += 20;
      else if (localPart === `${firstName[0]}${lastName}`) score += 20;
      else if (localPart === `${firstName}_${lastName}`) score += 20;
      else if (localPart === `${firstName}-${lastName}`) score += 20;
      else if (localPart === firstName) score += 15;
      else if (localPart.includes(firstName) && localPart.includes(lastName)) score += 20;
      else if (localPart.includes(firstName) || localPart.includes(lastName)) score += 10;
    }
  }
  
  // Company/domain match
  if (company) {
    const companySimplified = company.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 10);
    if (domainName.includes(companySimplified) || companySimplified.includes(domainName)) {
      score += 15;
    }
  }
  
  return Math.min(40, score); // Cap pattern contribution at 40
}

/**
 * GET /api/linkedin/verify-email?email=xxx
 * Quick verification check
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  
  if (!email) {
    return NextResponse.json(
      { error: "email query param is required" },
      { status: 400 }
    );
  }
  
  const result = await verifyEmail(email);
  
  return NextResponse.json({
    success: true,
    verification: result,
  });
}
