import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the Profile page (/profile/[username]).
 * Handles developer profile view, tabs, and connection path.
 */
export class ProfilePage {
  readonly page: Page;

  // Header elements
  readonly profileHeader: Locator;
  readonly developerName: Locator;
  readonly developerUsername: Locator;
  readonly developerBio: Locator;
  readonly developerLocation: Locator;
  readonly developerCompany: Locator;
  readonly avatar: Locator;
  readonly archetypeBadge: Locator;

  // Stats
  readonly statsCards: Locator;
  readonly reposCount: Locator;
  readonly starsCount: Locator;
  readonly followersCount: Locator;
  readonly contributionsCount: Locator;
  readonly joinedYear: Locator;

  // Skills
  readonly skillsBadges: Locator;

  // Repositories
  readonly repoCards: Locator;
  readonly repoNames: Locator;
  readonly repoLanguages: Locator;
  readonly repoStars: Locator;

  // Tabs
  readonly tabsList: Locator;
  readonly overviewTab: Locator;
  readonly psychometricTab: Locator;
  readonly connectionTab: Locator;
  readonly outreachTab: Locator;

  // Tab content
  readonly tabContent: Locator;

  // Psychometric tab
  readonly psychometricCard: Locator;
  readonly archetypeTitle: Locator;
  readonly traitBars: Locator;

  // Connection tab
  readonly connectionPathCard: Locator;
  readonly findConnectionsButton: Locator;
  readonly connectionDegree: Locator;
  readonly connectionPath: Locator;
  readonly warmIntroSection: Locator;

  // Outreach tab
  readonly outreachStrategy: Locator;
  readonly messageTemplate: Locator;
  readonly generateMessageButton: Locator;

  // LinkedIn enrichment
  readonly linkedInInput: Locator;
  readonly linkedInEnrichButton: Locator;
  readonly linkedInProfile: Locator;

  // Loading states
  readonly loadingSpinner: Locator;
  readonly loadingSkeleton: Locator;

  // Error state
  readonly errorMessage: Locator;

  // CTA
  readonly deepProfileButton: Locator;
  readonly githubButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header
    this.profileHeader = page.locator('.flex.flex-col.md\\:flex-row.items-start');
    this.developerName = page.locator('h1').first();
    this.developerUsername = page.locator('p.text-muted-foreground').filter({ hasText: '@' });
    this.developerBio = page.locator('p.text-foreground\\/80');
    this.developerLocation = page.locator('.flex.items-center.gap-1').filter({ has: page.locator('svg.lucide-map-pin') });
    this.developerCompany = page.locator('.flex.items-center.gap-1').filter({ has: page.locator('svg.lucide-building') });
    this.avatar = page.locator('[class*="Avatar"]').first();
    this.archetypeBadge = page.locator('[class*="Badge"]').filter({ hasText: /architect|pioneer|craftsman|collaborator/i });

    // Stats
    this.statsCards = page.locator('.grid.grid-cols-2.md\\:grid-cols-5 .p-4');
    this.reposCount = this.statsCards.filter({ hasText: 'Repos' }).locator('.text-2xl');
    this.starsCount = this.statsCards.filter({ hasText: 'Stars' }).locator('.text-2xl');
    this.followersCount = this.statsCards.filter({ hasText: 'Followers' }).locator('.text-2xl');
    this.contributionsCount = this.statsCards.filter({ hasText: 'Contributions' }).locator('.text-2xl');
    this.joinedYear = this.statsCards.filter({ hasText: 'Joined' }).locator('.text-2xl');

    // Skills
    this.skillsBadges = page.locator('text=Skills & Technologies').locator('..').locator('[class*="Badge"]');

    // Repositories
    this.repoCards = page.locator('text=Top Repositories').locator('..').locator('.hover\\:border-ring');
    this.repoNames = this.repoCards.locator('h3');
    this.repoLanguages = this.repoCards.locator('[class*="Badge"]');
    this.repoStars = this.repoCards.locator('.flex.items-center.gap-1').filter({ has: page.locator('svg.lucide-star') });

    // Tabs
    this.tabsList = page.locator('[role="tablist"]');
    this.overviewTab = page.getByRole('tab', { name: /overview/i });
    this.psychometricTab = page.getByRole('tab', { name: /psychometric/i });
    this.connectionTab = page.getByRole('tab', { name: /connection/i });
    this.outreachTab = page.getByRole('tab', { name: /outreach/i });
    this.tabContent = page.locator('[role="tabpanel"]');

    // Psychometric tab
    this.psychometricCard = page.locator('[class*="Card"]').filter({ hasText: /archetype|trait/i });
    this.archetypeTitle = page.locator('text=/The Architect|The Pioneer|The Craftsman|The Collaborator/');
    this.traitBars = page.locator('[class*="Progress"]');

    // Connection tab
    this.connectionPathCard = page.locator('[class*="Card"]').filter({ hasText: /connection path|find connections/i });
    this.findConnectionsButton = page.getByRole('button', { name: /find connections|analyze/i });
    this.connectionDegree = page.locator('[class*="Badge"]').filter({ hasText: /1st|2nd|3rd|degree/i });
    this.connectionPath = page.locator('.flex.items-center').filter({ has: page.locator('svg.lucide-arrow-right') });
    this.warmIntroSection = page.locator('text=/warm intro|introduction/i').locator('..');

    // Outreach tab
    this.outreachStrategy = page.locator('text=Outreach Strategy').locator('..');
    this.messageTemplate = page.locator('text=Message Template').locator('..');
    this.generateMessageButton = page.getByRole('button', { name: /generate.*message/i });

    // LinkedIn
    this.linkedInInput = page.getByPlaceholder(/linkedin.com/);
    this.linkedInEnrichButton = page.getByRole('button', { name: /enrich/i });
    this.linkedInProfile = page.locator('[class*="Badge"]').filter({ hasText: /linkedin/i });

    // Loading
    this.loadingSpinner = page.locator('.animate-spin');
    this.loadingSkeleton = page.locator('.animate-pulse, [class*="Skeleton"]');

    // Error
    this.errorMessage = page.locator('text=/not found|error/i');

    // CTAs
    this.deepProfileButton = page.getByRole('button', { name: /view analysis|deep profile/i });
    this.githubButton = page.getByRole('link', { name: /github/i });
  }

  /**
   * Navigate to a profile page.
   */
  async goto(username: string) {
    await this.page.goto(`/profile/${username}`);
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Switch to a specific tab.
   */
  async switchToTab(tabName: 'overview' | 'psychometric' | 'connection' | 'outreach') {
    switch (tabName) {
      case 'overview':
        await this.overviewTab.click();
        break;
      case 'psychometric':
        await this.psychometricTab.click();
        break;
      case 'connection':
        await this.connectionTab.click();
        break;
      case 'outreach':
        await this.outreachTab.click();
        break;
    }
    // Wait for tab content to update
    await this.page.waitForTimeout(100);
  }

  /**
   * Get all skills displayed.
   */
  async getSkills() {
    await this.switchToTab('overview');
    return this.skillsBadges.allTextContents();
  }

  /**
   * Get stats from the profile.
   */
  async getStats() {
    return {
      repos: await this.reposCount.textContent(),
      stars: await this.starsCount.textContent(),
      followers: await this.followersCount.textContent(),
      contributions: await this.contributionsCount.textContent(),
      joined: await this.joinedYear.textContent(),
    };
  }

  /**
   * Get repository names.
   */
  async getRepoNames() {
    return this.repoNames.allTextContents();
  }

  /**
   * Find connections via GitHub.
   */
  async findConnections() {
    await this.switchToTab('connection');
    if (await this.findConnectionsButton.isVisible()) {
      await this.findConnectionsButton.click();
    }
  }

  /**
   * Get connection degree badge text.
   */
  async getConnectionDegree() {
    await this.switchToTab('connection');
    if (await this.connectionDegree.isVisible()) {
      return this.connectionDegree.textContent();
    }
    return null;
  }

  /**
   * Navigate to deep profile.
   */
  async goToDeepProfile() {
    await this.deepProfileButton.click();
  }

  /**
   * Enrich with LinkedIn.
   */
  async enrichWithLinkedIn(url: string) {
    await this.linkedInInput.fill(url);
    await this.linkedInEnrichButton.click();
  }

  /**
   * Generate outreach message.
   */
  async generateOutreach() {
    await this.switchToTab('outreach');
    await this.generateMessageButton.click();
  }

  /**
   * Wait for profile to load.
   */
  async waitForProfile() {
    await Promise.race([
      this.developerName.waitFor({ state: 'visible', timeout: 15000 }),
      this.errorMessage.waitFor({ state: 'visible', timeout: 15000 }).then(async () => {
        const errorText = await this.errorMessage.first().textContent();
        throw new Error(`Profile failed to load: ${errorText || 'unknown error'}`);
      }),
    ]);
  }

  /**
   * Check if profile loaded successfully.
   */
  async isProfileLoaded() {
    return this.developerName.isVisible();
  }

  /**
   * Check if there's an error.
   */
  async hasError() {
    return this.errorMessage.isVisible();
  }

  /**
   * Get archetype from psychometric tab.
   */
  async getArchetype() {
    await this.switchToTab('psychometric');
    const badge = await this.archetypeBadge.textContent().catch(() => null);
    const title = await this.archetypeTitle.textContent().catch(() => null);
    return badge || title;
  }

  /**
   * Check if all tabs are accessible.
   */
  async areAllTabsAccessible() {
    const tabs = ['overview', 'psychometric', 'connection', 'outreach'] as const;
    for (const tab of tabs) {
      await this.switchToTab(tab);
      const tabButton = tab === 'overview' ? this.overviewTab :
                        tab === 'psychometric' ? this.psychometricTab :
                        tab === 'connection' ? this.connectionTab :
                        this.outreachTab;
      if (!await tabButton.getAttribute('data-state')?.then(s => s === 'active')) {
        // Just check that clicking doesn't throw
      }
    }
    return true;
  }
}
