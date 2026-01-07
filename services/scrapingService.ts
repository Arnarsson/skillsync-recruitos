
interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown: string;
    metadata?: any;
  };
  error?: string;
}

interface BrightDataProfile {
  name?: string;
  position?: string;
  current_company?: { name?: string };
  city?: string;
  country?: string;
  about?: string;
  experience?: Array<{
    title?: string;
    company_name?: string;
    duration?: string;
    description?: string;
  }>;
  education?: Array<{
    title?: string;
    subtitle?: string;
  }>;
  skills?: string[];
}

// Helper to safely get env vars
const getEnv = (key: string) => {
  try {
    return (typeof process !== 'undefined' && process.env) ? process.env[key] : undefined;
  } catch (e) {
    return undefined;
  }
};

// Check if URL is a LinkedIn profile
const isLinkedInUrl = (url: string): boolean => {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.includes('linkedin.com');
  } catch {
    return false;
  }
};

// List of domains that Firecrawl typically blocks (excluding LinkedIn which we now handle via BrightData)
const FIRECRAWL_BLOCKED_DOMAINS = ['facebook.com', 'instagram.com', 'twitter.com', 'x.com'];

const isFirecrawlBlockedDomain = (url: string): boolean => {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return FIRECRAWL_BLOCKED_DOMAINS.some(domain => hostname.includes(domain));
  } catch {
    return false;
  }
};

/**
 * Convert BrightData profile JSON to readable markdown text
 */
const brightDataProfileToMarkdown = (profile: BrightDataProfile): string => {
  let markdown = '';

  if (profile.name) {
    markdown += `${profile.name}\n`;
  }
  if (profile.position) {
    markdown += `${profile.position}`;
    if (profile.current_company?.name) {
      markdown += ` at ${profile.current_company.name}`;
    }
    markdown += '\n';
  }
  if (profile.city || profile.country) {
    markdown += `${[profile.city, profile.country].filter(Boolean).join(', ')}\n`;
  }

  if (profile.about) {
    markdown += `\nAbout:\n${profile.about}\n`;
  }

  if (profile.experience && profile.experience.length > 0) {
    markdown += `\nExperience:\n`;
    for (const exp of profile.experience) {
      markdown += `• ${exp.title || 'Role'}`;
      if (exp.company_name) markdown += `, ${exp.company_name}`;
      if (exp.duration) markdown += ` (${exp.duration})`;
      markdown += '\n';
      if (exp.description) markdown += `  ${exp.description}\n`;
    }
  }

  if (profile.education && profile.education.length > 0) {
    markdown += `\nEducation:\n`;
    for (const edu of profile.education) {
      markdown += `• ${edu.title || 'Degree'}`;
      if (edu.subtitle) markdown += ` - ${edu.subtitle}`;
      markdown += '\n';
    }
  }

  if (profile.skills && profile.skills.length > 0) {
    markdown += `\nSkills: ${profile.skills.join(', ')}\n`;
  }

  return markdown || 'No profile data available';
};

/**
 * Scrape LinkedIn profile using BrightData API
 */
const scrapeLinkedInWithBrightData = async (url: string): Promise<string> => {
  const brightDataKey = localStorage.getItem('BRIGHTDATA_API_KEY') || getEnv('BRIGHTDATA_API_KEY');

  if (!brightDataKey) {
    throw new Error("BrightData API Key is missing. Please configure it in Settings or use Quick Paste.");
  }

  // LinkedIn People Profile dataset ID
  const datasetId = 'gd_l1viktl72bvl7bjuj0';

  try {
    // Trigger the scrape
    const triggerResponse = await fetch(
      `https://api.brightdata.com/datasets/v3/trigger?dataset_id=${datasetId}&format=json&type=discover_new&discover_by=url`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${brightDataKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{ url }])
      }
    );

    if (!triggerResponse.ok) {
      const errorText = await triggerResponse.text();
      console.error('BrightData trigger error:', errorText);
      throw new Error(`BrightData API Error: ${triggerResponse.status}. Use Quick Paste instead.`);
    }

    const triggerResult = await triggerResponse.json();
    const snapshotId = triggerResult.snapshot_id;

    if (!snapshotId) {
      throw new Error('BrightData did not return a snapshot ID');
    }

    // Poll for results (with timeout)
    const maxAttempts = 30;
    const pollInterval = 2000; // 2 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const progressResponse = await fetch(
        `https://api.brightdata.com/datasets/v3/progress/${snapshotId}`,
        {
          headers: {
            'Authorization': `Bearer ${brightDataKey}`
          }
        }
      );

      if (!progressResponse.ok) continue;

      const progress = await progressResponse.json();

      if (progress.status === 'ready') {
        // Fetch the snapshot data
        const snapshotResponse = await fetch(
          `https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}?format=json`,
          {
            headers: {
              'Authorization': `Bearer ${brightDataKey}`
            }
          }
        );

        if (!snapshotResponse.ok) {
          throw new Error('Failed to fetch BrightData snapshot');
        }

        const profiles: BrightDataProfile[] = await snapshotResponse.json();

        if (profiles && profiles.length > 0) {
          return brightDataProfileToMarkdown(profiles[0]);
        }
        throw new Error('No profile data returned from BrightData');
      }

      if (progress.status === 'failed') {
        throw new Error('BrightData scrape failed. The profile may be private or unavailable.');
      }
    }

    throw new Error('BrightData scrape timed out. Please try again or use Quick Paste.');

  } catch (error) {
    console.error("BrightData Scraping Error:", error);
    throw error;
  }
};

/**
 * Generic scraper - routes to BrightData for LinkedIn, Firecrawl for others
 */
export const scrapeUrlContent = async (url: string): Promise<string> => {
  // Route LinkedIn URLs to BrightData
  if (isLinkedInUrl(url)) {
    return scrapeLinkedInWithBrightData(url);
  }

  // Check for other blocked domains
  if (isFirecrawlBlockedDomain(url)) {
    throw new Error(`This social media site is not supported. Use "Quick Paste" to copy/paste profile content instead.`);
  }

  // Use Firecrawl for non-LinkedIn URLs
  const firecrawlKey = localStorage.getItem('FIRECRAWL_API_KEY') || getEnv('FIRECRAWL_API_KEY');

  if (!firecrawlKey) {
    throw new Error("Firecrawl API Key is missing. Please configure it in Settings.");
  }

  try {
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown'],
        pageOptions: {
           onlyMainContent: true
        }
      })
    });

    if (!scrapeResponse.ok) {
        const errorText = await scrapeResponse.text();
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error?.includes('not currently supported')) {
            throw new Error(`This website is not supported. Use "Quick Paste" to copy/paste content instead.`);
          }
        } catch {
          // If parsing fails, continue with generic error
        }
        throw new Error(`Firecrawl Error (${scrapeResponse.status}): Site not supported. Use Quick Paste instead.`);
    }

    const json: FirecrawlResponse = await scrapeResponse.json();

    if (!json.success || !json.data?.markdown) {
        throw new Error(json.error || "Failed to retrieve content from URL");
    }

    return json.data.markdown;

  } catch (error) {
    console.error("Scraping Error:", error);
    throw error;
  }
};
