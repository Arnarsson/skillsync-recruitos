/**
 * Verification Service
 *
 * Cross-validates AI claims before admitting them to the social graph.
 * Prevents hallucinations by requiring multiple source verification.
 */

import type {
  AIClaimEntity,
  VerificationResult,
  SourceVerification,
  VerificationStatus,
  ADMISSION_THRESHOLDS,
} from '@/types/socialMatrix';

// ===== ADMISSION THRESHOLDS =====

const THRESHOLDS = {
  warm_intro: { minConfidence: 0.8, minSources: 2 },
  display: { minConfidence: 0.5, minSources: 1 },
  exploratory: { minConfidence: 0.3, minSources: 0 },
} as const;

// ===== HELPER FUNCTIONS =====

/**
 * Extract names from text (simple implementation)
 */
function extractNamesFromText(text: string): string[] {
  // Simple heuristic: look for capitalized words that could be names
  const words = text.split(/\s+/);
  const names: string[] = [];

  for (let i = 0; i < words.length - 1; i++) {
    const word1 = words[i].replace(/[^a-zA-Z]/g, '');
    const word2 = words[i + 1].replace(/[^a-zA-Z]/g, '');

    // Check if both words start with capital letters (potential name)
    if (
      word1.length > 1 &&
      word2.length > 1 &&
      word1[0] === word1[0].toUpperCase() &&
      word2[0] === word2[0].toUpperCase() &&
      word1[0] !== word1[0].toLowerCase() &&
      word2[0] !== word2[0].toLowerCase()
    ) {
      names.push(`${word1} ${word2}`);
    }
  }

  return names;
}

/**
 * Check if a name appears in text (fuzzy match)
 */
function nameAppearsInText(name: string, text: string): boolean {
  const lowerText = text.toLowerCase();
  const lowerName = name.toLowerCase();

  // Exact match
  if (lowerText.includes(lowerName)) return true;

  // Try first and last name separately
  const nameParts = lowerName.split(' ').filter(p => p.length > 2);
  const matchCount = nameParts.filter(part => lowerText.includes(part)).length;

  // Require at least half the name parts to match
  return matchCount >= Math.ceil(nameParts.length / 2);
}

/**
 * Verify a single source URL
 * In production, this would fetch and analyze the page
 */
async function verifySource(
  url: string,
  claim: AIClaimEntity
): Promise<SourceVerification> {
  // For now, return a basic verification based on URL patterns
  // In production, this would:
  // 1. Fetch the URL content
  // 2. Extract text
  // 3. Check if claimed names appear
  // 4. Validate the context

  const verification: SourceVerification = {
    url,
    verified: false,
    confidence: 0,
    extractedNames: [],
    matchesContext: false,
  };

  // Basic URL validation
  if (!url || !url.startsWith('http')) {
    verification.errorReason = 'Invalid URL';
    return verification;
  }

  // Trusted source patterns boost confidence
  const trustedDomains = [
    'linkedin.com',
    'github.com',
    'youtube.com',
    'medium.com',
    'dev.to',
    'twitter.com',
    'x.com',
  ];

  const isTrustedDomain = trustedDomains.some(domain => url.includes(domain));

  // If we have extracted text from the claim, use it for verification
  if (claim.extractedText) {
    const extractedNames = extractNamesFromText(claim.extractedText);
    verification.extractedNames = extractedNames;

    // Check if both people are mentioned (if we know their names)
    const personA = claim.entities.personA;
    const personB = claim.entities.personB;

    let matchCount = 0;
    if (personA && nameAppearsInText(personA, claim.extractedText)) matchCount++;
    if (personB && nameAppearsInText(personB, claim.extractedText)) matchCount++;

    verification.matchesContext = matchCount >= 1;
    verification.verified = matchCount >= 2;

    // Calculate confidence
    verification.confidence = (matchCount / 2) * (isTrustedDomain ? 1.0 : 0.7);
  } else {
    // No extracted text - lower confidence
    verification.confidence = isTrustedDomain ? 0.4 : 0.2;
  }

  return verification;
}

// ===== MAIN VERIFICATION FUNCTIONS =====

/**
 * Verify a single AI claim
 */
export async function verifyClaim(claim: AIClaimEntity): Promise<VerificationResult> {
  const sourceDetails: SourceVerification[] = [];

  // Verify the primary source
  if (claim.sourceUrl) {
    const primaryVerification = await verifySource(claim.sourceUrl, claim);
    sourceDetails.push(primaryVerification);
  }

  // Calculate overall result
  const verifiedCount = sourceDetails.filter(s => s.verified).length;
  const avgConfidence = sourceDetails.length > 0
    ? sourceDetails.reduce((sum, s) => sum + s.confidence, 0) / sourceDetails.length
    : claim.confidence;

  // Determine status
  let status: VerificationStatus;
  if (verifiedCount >= 2 && avgConfidence >= 0.8) {
    status = 'verified';
  } else if (verifiedCount >= 1 && avgConfidence >= 0.5) {
    status = 'plausible';
  } else if (avgConfidence >= 0.3) {
    status = 'unverified';
  } else {
    status = 'rejected';
  }

  return {
    overallConfidence: avgConfidence,
    verifiedSources: verifiedCount,
    totalSources: sourceDetails.length,
    status,
    sourceDetails,
  };
}

/**
 * Check if a claim should be admitted to the graph
 */
export function shouldAdmitClaim(
  claim: AIClaimEntity,
  verification: VerificationResult,
  purpose: 'warm_intro' | 'display' | 'exploratory'
): boolean {
  const threshold = THRESHOLDS[purpose];

  return (
    verification.overallConfidence >= threshold.minConfidence &&
    verification.verifiedSources >= threshold.minSources &&
    verification.status !== 'rejected'
  );
}

/**
 * Admit a claim to the graph with appropriate status
 */
export async function admitClaimToGraph(
  claim: AIClaimEntity,
  purpose: 'warm_intro' | 'display' | 'exploratory'
): Promise<{
  admitted: boolean;
  claim: AIClaimEntity;
  verification: VerificationResult;
  reason?: string;
}> {
  const verification = await verifyClaim(claim);
  const admitted = shouldAdmitClaim(claim, verification, purpose);

  // Update claim with verification status
  const updatedClaim: AIClaimEntity = {
    ...claim,
    confidence: verification.overallConfidence,
    verificationStatus: verification.status,
    verifiedAt: new Date().toISOString(),
  };

  let reason: string | undefined;
  if (!admitted) {
    const threshold = THRESHOLDS[purpose];
    if (verification.overallConfidence < threshold.minConfidence) {
      reason = `Confidence ${(verification.overallConfidence * 100).toFixed(0)}% below ${threshold.minConfidence * 100}% threshold`;
    } else if (verification.verifiedSources < threshold.minSources) {
      reason = `Only ${verification.verifiedSources} verified sources, need ${threshold.minSources}`;
    } else {
      reason = `Verification status: ${verification.status}`;
    }
  }

  return {
    admitted,
    claim: updatedClaim,
    verification,
    reason,
  };
}

/**
 * Batch verify multiple claims
 */
export async function verifyMultipleClaims(
  claims: AIClaimEntity[],
  purpose: 'warm_intro' | 'display' | 'exploratory'
): Promise<{
  admitted: AIClaimEntity[];
  rejected: Array<{ claim: AIClaimEntity; reason: string }>;
  stats: {
    total: number;
    admitted: number;
    rejected: number;
    avgConfidence: number;
  };
}> {
  const results = await Promise.all(
    claims.map(claim => admitClaimToGraph(claim, purpose))
  );

  const admitted: AIClaimEntity[] = [];
  const rejected: Array<{ claim: AIClaimEntity; reason: string }> = [];

  for (const result of results) {
    if (result.admitted) {
      admitted.push(result.claim);
    } else {
      rejected.push({
        claim: result.claim,
        reason: result.reason || 'Unknown reason',
      });
    }
  }

  const avgConfidence = results.length > 0
    ? results.reduce((sum, r) => sum + r.verification.overallConfidence, 0) / results.length
    : 0;

  return {
    admitted,
    rejected,
    stats: {
      total: claims.length,
      admitted: admitted.length,
      rejected: rejected.length,
      avgConfidence,
    },
  };
}

/**
 * Get verification status label
 */
export function getVerificationLabel(status: VerificationStatus): {
  label: string;
  color: string;
  description: string;
} {
  switch (status) {
    case 'verified':
      return {
        label: 'Verified',
        color: 'green',
        description: 'Confirmed by multiple reliable sources',
      };
    case 'plausible':
      return {
        label: 'Plausible',
        color: 'blue',
        description: 'Supported by at least one source',
      };
    case 'unverified':
      return {
        label: 'Unverified',
        color: 'yellow',
        description: 'AI-discovered, not yet verified',
      };
    case 'rejected':
      return {
        label: 'Rejected',
        color: 'red',
        description: 'Could not verify or contradicted',
      };
    default:
      return {
        label: 'Unknown',
        color: 'gray',
        description: 'Status not determined',
      };
  }
}
