/**
 * Website Enrichment - Scrape personal website/blog via Firecrawl
 */

interface WebsiteEnrichment {
  url: string;
  title: string;
  content: string;
  topics: string[];
  hasProjects: boolean;
  hasBlog: boolean;
  socialLinks: string[];
}

/**
 * Scrape and analyze personal website
 */
export async function enrichFromWebsite(
  websiteUrl: string,
  firecrawlKey?: string
): Promise<WebsiteEnrichment | null> {
  const apiKey = firecrawlKey || process.env.FIRECRAWL_API_KEY;

  if (!apiKey) {
    console.log("[Website Enrichment] No Firecrawl key configured");
    return null;
  }

  if (!websiteUrl) {
    return null;
  }

  // Normalize URL
  let url = websiteUrl.trim();
  if (!url.startsWith("http")) {
    url = `https://${url}`;
  }

  // Skip GitHub/LinkedIn URLs (we handle those separately)
  if (url.includes("github.com") || url.includes("linkedin.com")) {
    return null;
  }

  console.log("[Website Enrichment] Scraping:", url);

  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });

    if (!response.ok) {
      console.error("[Website Enrichment] Firecrawl error:", response.status);
      return null;
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      console.error("[Website Enrichment] Scrape failed:", data.error);
      return null;
    }

    const content = data.data.markdown || "";
    const metadata = data.data.metadata || {};

    // Analyze content
    const contentLower = content.toLowerCase();
    const hasProjects =
      contentLower.includes("project") ||
      contentLower.includes("portfolio") ||
      contentLower.includes("work");
    const hasBlog =
      contentLower.includes("blog") ||
      contentLower.includes("post") ||
      contentLower.includes("article");

    // Extract topics from content (simple keyword extraction)
    const techKeywords = [
      "react",
      "vue",
      "angular",
      "node",
      "python",
      "rust",
      "go",
      "typescript",
      "javascript",
      "kubernetes",
      "docker",
      "aws",
      "gcp",
      "azure",
      "machine learning",
      "ai",
      "blockchain",
      "web3",
      "mobile",
      "ios",
      "android",
      "devops",
      "backend",
      "frontend",
      "fullstack",
    ];

    const topics = techKeywords.filter((keyword) =>
      contentLower.includes(keyword)
    );

    // Extract social links
    const socialPatterns = [
      /twitter\.com\/\w+/gi,
      /x\.com\/\w+/gi,
      /linkedin\.com\/in\/[\w-]+/gi,
      /github\.com\/\w+/gi,
      /dev\.to\/\w+/gi,
      /medium\.com\/@?\w+/gi,
    ];

    const socialLinks: string[] = [];
    socialPatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        socialLinks.push(...matches.map((m) => `https://${m}`));
      }
    });

    console.log("[Website Enrichment] Complete:", {
      hasProjects,
      hasBlog,
      topicsFound: topics.length,
      socialLinks: socialLinks.length,
    });

    return {
      url,
      title: metadata.title || "",
      content: content.slice(0, 5000), // Limit content size
      topics,
      hasProjects,
      hasBlog,
      socialLinks: [...new Set(socialLinks)], // Dedupe
    };
  } catch (error) {
    console.error("[Website Enrichment] Error:", error);
    return null;
  }
}

export type { WebsiteEnrichment };
