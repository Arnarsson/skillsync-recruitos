/**
 * Social Matrix Prompt Templates
 *
 * AI prompts for path discovery, relationship explanation,
 * and connector discovery in the social graph.
 */

export const PATH_DISCOVERY_PROMPT = `
You are an expert network analyst helping to find connection paths between two professionals.

Given the following two people, identify potential connection paths between them:

PERSON A (Recruiter):
{personAData}

PERSON B (Candidate):
{personBData}

SEARCH RESULTS:
{searchResults}

Analyze the data and identify:
1. Direct connections (same company, same school, same organization)
2. Mutual connections (people who know both)
3. Shared events (conferences, meetups, podcasts)
4. Shared content (co-authored articles, projects)
5. Industry connections (same industry circles)

Return a JSON array of discovered connections:
{
  "discoveries": [
    {
      "type": "connection" | "event" | "content" | "company" | "school",
      "claim": "Description of the connection",
      "sourceUrl": "URL where this was found",
      "entities": {
        "personA": "Name if mentioned",
        "personB": "Name if mentioned",
        "organization": "Company/School name if relevant",
        "event": "Event name if relevant",
        "date": "Date if known"
      },
      "confidence": 0.0-1.0,
      "reasoning": "Why you believe this connection exists"
    }
  ],
  "searchSuggestions": ["Additional search queries that might reveal more connections"]
}

Be conservative with confidence scores:
- 0.9+: Direct evidence of both people mentioned together
- 0.7-0.9: Strong circumstantial evidence (same company at overlapping times)
- 0.5-0.7: Moderate evidence (same industry, similar roles)
- Below 0.5: Speculative connections

IMPORTANT: Only include connections with actual evidence. Do not hallucinate connections.
`;

export const RELATIONSHIP_EXPLANATION_PROMPT = `
You are a professional recruiter explaining the connection path between yourself and a candidate.

CONNECTION PATH:
{pathData}

Generate a natural, professional explanation of this connection that could be used:
1. In an outreach message
2. To explain the relationship to the candidate
3. To request a warm introduction

Return JSON:
{
  "shortExplanation": "One sentence summary (max 15 words)",
  "detailedExplanation": "2-3 sentences with context",
  "outreachHook": "How to mention this connection in an outreach message",
  "introRequest": "Template for requesting introduction from the connector",
  "commonGround": ["List of shared interests/experiences to discuss"]
}
`;

export const CONNECTOR_DISCOVERY_PROMPT = `
You are analyzing a professional network to identify "super-connectors" - people who bridge multiple communities.

Given the following network data:
{networkData}

Identify the top connectors who could facilitate introductions:

Return JSON:
{
  "connectors": [
    {
      "name": "Person's name",
      "role": "Their current role",
      "communities": ["List of communities/companies they connect"],
      "introValue": "Why they're valuable as an introduction path",
      "approachStrategy": "How to leverage this connection",
      "connectionStrength": "strong" | "moderate" | "weak"
    }
  ],
  "networkGaps": ["Areas where more connections would be valuable"],
  "recommendations": ["Actions to strengthen the network"]
}
`;

export const CO_APPEARANCE_SEARCH_PROMPT = `
Given the following search results about potential co-appearances between two people:

PERSON A: {personA}
PERSON B: {personB}

SEARCH RESULTS:
{searchResults}

Extract any evidence of these two people appearing together:
- Conference speaker lists mentioning both
- Podcast episodes featuring both
- Panel discussions with both
- Co-authored articles or papers
- Joint interviews or mentions
- Shared project credits

Return JSON:
{
  "coAppearances": [
    {
      "eventType": "conference" | "podcast" | "panel" | "article" | "interview" | "project",
      "eventName": "Name of the event/content",
      "date": "Date if available (YYYY-MM-DD or YYYY)",
      "sourceUrl": "URL where found",
      "extractedText": "Exact text mentioning both people",
      "confidence": 0.0-1.0
    }
  ],
  "noEvidenceFound": true | false,
  "suggestedSearches": ["Additional queries to try"]
}

Only include entries where there is CLEAR evidence. If names are common, require additional context (company, role) to confirm identity.
`;

/**
 * Generate a search query for finding co-appearances
 */
export function generateCoAppearanceQuery(personA: string, personB: string, context?: string): string {
  const baseQuery = `"${personA}" "${personB}"`;
  const eventSuffix = 'conference OR podcast OR panel OR interview OR speaker';

  if (context) {
    return `${baseQuery} ${context} ${eventSuffix}`;
  }

  return `${baseQuery} ${eventSuffix}`;
}

/**
 * Generate LinkedIn SERP query
 */
export function generateLinkedInSearchQuery(personA: string, personB: string): string {
  return `site:linkedin.com "${personA}" "${personB}"`;
}

/**
 * Generate event search query
 */
export function generateEventSearchQuery(personA: string, personB: string): string {
  const conferences = 'QCon OR StrangeLoop OR KubeCon OR DockerCon OR AWS re:Invent OR Google I/O OR WWDC';
  return `"${personA}" "${personB}" (${conferences})`;
}
