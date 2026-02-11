export interface CandidateIdentitySource {
  id: string;
  githubUsername?: string | null;
  username?: string | null;
  source?: string | null;
  sourceUrl?: string | null;
}

export function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export function parseGitHubUsernameFromUrl(sourceUrl?: string | null): string | null {
  if (!sourceUrl) return null;
  const match = sourceUrl.match(/github\.com\/([^/?#]+)/i);
  return match?.[1]?.trim() || null;
}

export function extractGitHubUsername(candidate: CandidateIdentitySource): string | null {
  const explicit = candidate.githubUsername?.trim();
  if (explicit) return explicit;

  const alias = candidate.username?.trim();
  if (alias) return alias;

  const fromUrl = parseGitHubUsernameFromUrl(candidate.sourceUrl);
  if (fromUrl) return fromUrl;

  if (candidate.source?.toLowerCase() === "github" && !isUuidLike(candidate.id)) {
    return candidate.id;
  }

  if (!isUuidLike(candidate.id)) return candidate.id;
  return null;
}

export function resolveProfileSlug(candidate: CandidateIdentitySource): string {
  return extractGitHubUsername(candidate) || candidate.id;
}

export function readLocalCandidates<T = CandidateIdentitySource>(
  storageKey = "apex_candidates"
): T[] {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function findCandidateInLocalCache<T extends CandidateIdentitySource>(
  candidates: T[],
  idOrUsername: string
): T | null {
  const needle = idOrUsername.trim().toLowerCase();
  for (const candidate of candidates) {
    if (candidate.id?.toLowerCase() === needle) return candidate;
    const gh = extractGitHubUsername(candidate);
    if (gh?.toLowerCase() === needle) return candidate;
  }
  return null;
}
