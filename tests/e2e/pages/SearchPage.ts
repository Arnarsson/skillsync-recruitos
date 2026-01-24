import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the Search page (/search).
 * Handles developer search, filtering, and result navigation.
 */
export class SearchPage {
  readonly page: Page;

  // Locators
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly developerCards: Locator;
  readonly scoreBadges: Locator;
  readonly loadingSpinner: Locator;
  readonly loadingSkeletons: Locator;
  readonly noResultsMessage: Locator;
  readonly errorMessage: Locator;

  // Filter controls
  readonly filterButton: Locator;
  readonly locationFilter: Locator;
  readonly languageFilter: Locator;
  readonly resetFiltersButton: Locator;

  // Search interpretation badges
  readonly interpretationBadges: Locator;
  readonly languageBadge: Locator;
  readonly locationBadge: Locator;
  readonly keywordBadges: Locator;

  // Result info
  readonly resultsCount: Locator;
  readonly aiScoredBadge: Locator;

  // Developer card elements
  readonly developerNames: Locator;
  readonly developerLocations: Locator;
  readonly developerCompanies: Locator;
  readonly developerSkills: Locator;
  readonly connectionBadges: Locator;
  readonly openToWorkBadges: Locator;

  // Source toggles
  readonly googleToggle: Locator;
  readonly googleResults: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main search
    this.searchInput = page.locator('input[type="text"]').first();
    this.searchButton = page.getByRole('button', { name: /search/i });
    this.developerCards = page.locator('a[href^="/profile/"]').locator('..');
    this.scoreBadges = page.locator('[class*="Badge"]').filter({ hasText: /%/ });
    this.loadingSpinner = page.locator('.animate-spin');
    this.loadingSkeletons = page.locator('.animate-pulse');
    this.noResultsMessage = page.getByText(/no results|no developers found/i);
    this.errorMessage = page.locator('.text-destructive');

    // Filter controls
    this.filterButton = page.getByRole('button', { name: /filter/i });
    this.locationFilter = page.getByLabel(/location/i);
    this.languageFilter = page.getByLabel(/language/i);
    this.resetFiltersButton = page.getByRole('button', { name: /reset filters/i });

    // Interpretation badges
    this.interpretationBadges = page.locator('text=Searching:').locator('..').locator('[class*="Badge"]');
    this.languageBadge = page.locator('[class*="Badge"]').filter({ has: page.locator('svg.lucide-code-2') });
    this.locationBadge = page.locator('[class*="Badge"]').filter({ has: page.locator('svg.lucide-map-pin') });
    this.keywordBadges = page.locator('text=Searching:').locator('..').locator('[class*="Badge"][variant="outline"]');

    // Results info
    this.resultsCount = page.locator('text=/found.*developers/i');
    this.aiScoredBadge = page.locator('[class*="Badge"]').filter({ hasText: /ai scored/i });

    // Developer card elements
    this.developerNames = page.locator('h3.font-semibold');
    this.developerLocations = page.locator('.flex.items-center.gap-1').filter({ has: page.locator('svg.lucide-map-pin') });
    this.developerCompanies = page.locator('.flex.items-center.gap-1').filter({ has: page.locator('svg.lucide-building') });
    this.developerSkills = page.locator('[class*="Badge"][variant="secondary"]');
    this.connectionBadges = page.locator('[data-testid="connection-badge"]');
    this.openToWorkBadges = page.getByText(/open to work/i);

    // Source toggles
    this.googleToggle = page.locator('button[role="switch"]').first();
    this.googleResults = page.getByText('Google Results').locator('..');
  }

  /**
   * Navigate to the search page.
   */
  async goto() {
    await this.page.goto('/search');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Navigate to search page with a query.
   */
  async gotoWithQuery(query: string) {
    await this.page.goto(`/search?q=${encodeURIComponent(query)}`);
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Perform a search.
   */
  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchButton.click();
  }

  /**
   * Get the count of developer cards displayed.
   */
  async getDeveloperCount() {
    await this.developerCards.first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => null);
    return this.developerCards.count();
  }

  /**
   * Get a developer card by index.
   */
  getDeveloperByIndex(index: number) {
    return this.developerCards.nth(index);
  }

  /**
   * Click on a developer to view their profile.
   */
  async clickDeveloper(username: string) {
    await this.page.locator(`a[href="/profile/${username}"]`).first().click();
  }

  /**
   * Wait for search results to load.
   */
  async waitForResults() {
    // Wait for either results or no results message
    await Promise.race([
      this.developerCards.first().waitFor({ state: 'visible', timeout: 15000 }),
      this.noResultsMessage.waitFor({ state: 'visible', timeout: 15000 }),
    ]);
  }

  /**
   * Wait for loading to complete.
   */
  async waitForLoading() {
    await this.loadingSkeletons.first().waitFor({ state: 'hidden', timeout: 30000 }).catch(() => null);
  }

  /**
   * Check if search interpretation badges are displayed.
   */
  async hasInterpretationBadges() {
    return (await this.interpretationBadges.count()) > 0;
  }

  /**
   * Get interpretation info (language, location, keywords).
   */
  async getInterpretation() {
    const language = await this.languageBadge.textContent().catch(() => null);
    const location = await this.locationBadge.textContent().catch(() => null);
    const keywords = await this.keywordBadges.allTextContents();

    return { language, location, keywords };
  }

  /**
   * Apply location filter.
   */
  async filterByLocation(location: string) {
    await this.filterButton.click();
    await this.locationFilter.fill(location);
  }

  /**
   * Apply language filter.
   */
  async filterByLanguage(language: string) {
    await this.filterButton.click();
    await this.languageFilter.fill(language);
  }

  /**
   * Get all developer usernames from results.
   */
  async getDeveloperUsernames() {
    const links = await this.page.locator('a[href^="/profile/"]').all();
    const usernames: string[] = [];
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href) {
        const match = href.match(/\/profile\/([^/]+)/);
        if (match) usernames.push(match[1]);
      }
    }
    return Array.from(new Set(usernames));
  }

  /**
   * Check if any developer has a score badge.
   */
  async hasScoreBadges() {
    return (await this.scoreBadges.count()) > 0;
  }

  /**
   * Get score for a specific developer card by index.
   */
  async getScoreByIndex(index: number) {
    const card = this.developerCards.nth(index);
    const scoreBadge = card.locator('[class*="Badge"]').filter({ hasText: /%/ });
    const text = await scoreBadge.textContent();
    const match = text?.match(/(\d+)%/);
    return match ? parseInt(match[1]) : null;
  }
}
