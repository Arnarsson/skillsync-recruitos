/**
 * Enrichment Library - Aggregates all enrichment sources
 */

export {
  enrichFromGitHub,
  type GitHubEnrichment,
  type PRToOtherRepo,
  type ContributionPattern,
} from "./githubEnrichment";

export {
  findLinkedInProfile,
  type LinkedInMatch,
  type FinderResult,
  type GitHubProfile,
} from "./linkedinFinder";

export {
  enrichFromWebsite,
  type WebsiteEnrichment,
} from "./websiteEnrichment";

export {
  enrichFromTalks,
  type Talk,
  type TalksEnrichment,
} from "./talksEnrichment";
