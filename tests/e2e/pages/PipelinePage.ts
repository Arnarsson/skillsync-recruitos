import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the Pipeline page (/pipeline).
 * Handles candidate management, filtering, and comparison.
 */
export class PipelinePage {
  readonly page: Page;

  // Locators
  readonly candidateCards: Locator;
  readonly scoreDistributionChart: Locator;
  readonly searchInput: Locator;
  readonly addCandidatesButton: Locator;
  readonly filterButton: Locator;
  readonly filtersPanel: Locator;

  // Header elements
  readonly pageTitle: Locator;
  readonly jobContextTitle: Locator;
  readonly skillsBadges: Locator;

  // Filter controls
  readonly sortSelect: Locator;
  readonly scoreFilterButtons: Locator;
  readonly clearFiltersButton: Locator;
  readonly histogramBars: Locator;

  // Candidate selection
  readonly selectCheckboxes: Locator;
  readonly selectedCount: Locator;
  readonly compareButton: Locator;
  readonly clearSelectionButton: Locator;
  readonly shortlistPanel: Locator;

  // Modals
  readonly importModal: Locator;
  readonly comparisonModal: Locator;
  readonly outreachModal: Locator;

  // Import modal elements
  readonly importButton: Locator;
  readonly importTextarea: Locator;
  readonly analyzeImportButton: Locator;

  // Loading states
  readonly loadingSpinner: Locator;
  readonly loadingScramble: Locator;
  readonly loadingSkeletons: Locator;

  // Empty state
  readonly emptyState: Locator;
  readonly noResultsMessage: Locator;

  // View mode
  readonly viewModeToggle: Locator;
  readonly splitViewPanel: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main elements
    this.candidateCards = page.locator('[id^="candidate-"]');
    this.scoreDistributionChart = page.locator('.recharts-wrapper');
    this.searchInput = page.getByPlaceholder(/search|add/i);
    this.addCandidatesButton = page.getByRole('button', { name: /add candidates/i });
    this.filterButton = page.getByRole('button', { name: /filter/i });
    this.filtersPanel = page.locator('.border-t').filter({ hasText: /sort|filter/i });

    // Header
    this.pageTitle = page.getByRole('heading', { name: /talent pipeline/i });
    this.jobContextTitle = page.locator('p.text-muted-foreground').first();
    this.skillsBadges = page.locator('.flex.flex-wrap.gap-1 [class*="Badge"]');

    // Filter controls
    this.sortSelect = page.locator('select');
    this.scoreFilterButtons = page.locator('button').filter({ hasText: /80\+|50-79|<50|all/i });
    this.clearFiltersButton = page.getByRole('button', { name: /clear filter/i });
    this.histogramBars = page.locator('.recharts-bar-rectangle');

    // Selection
    this.selectCheckboxes = page.locator('button').filter({ has: page.locator('svg.lucide-square, svg.lucide-check-square') });
    this.selectedCount = page.locator('[class*="Badge"]').filter({ hasText: /selected/i });
    this.compareButton = page.getByRole('button', { name: /compare/i });
    this.clearSelectionButton = page.getByRole('button', { name: /clear/i });
    this.shortlistPanel = page.locator('.fixed.bottom-0');

    // Modals
    this.importModal = page.locator('.fixed.inset-0').filter({ hasText: /import|paste/i });
    this.comparisonModal = page.locator('.fixed.inset-0').filter({ hasText: /compare/i });
    this.outreachModal = page.locator('.fixed.inset-0').filter({ hasText: /outreach|message/i });

    // Import modal
    this.importButton = page.getByRole('button', { name: /import/i });
    this.importTextarea = page.locator('textarea');
    this.analyzeImportButton = page.getByRole('button', { name: /analyze|import/i }).last();

    // Loading
    this.loadingSpinner = page.locator('.animate-spin');
    this.loadingScramble = page.locator('text=/searching|loading|finding/i');
    this.loadingSkeletons = page.locator('.animate-pulse');

    // Empty/No results
    this.emptyState = page.locator('text=/no candidates|empty/i');
    this.noResultsMessage = page.locator('text=/no results|import/i');

    // View mode
    this.viewModeToggle = page.getByRole('button', { name: /list|split/i });
    this.splitViewPanel = page.locator('[class*="split"]');
  }

  /**
   * Navigate to the pipeline page.
   */
  async goto() {
    await this.page.goto('/pipeline');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Get the count of candidate cards displayed.
   */
  async getCandidateCount() {
    await this.candidateCards.first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => null);
    return this.candidateCards.count();
  }

  /**
   * Select a candidate by clicking their checkbox.
   */
  async selectCandidate(id: string) {
    const card = this.page.locator(`[id="candidate-${id}"]`);
    const checkbox = card.locator('button').filter({ has: this.page.locator('svg.lucide-square') });
    await checkbox.click();
  }

  /**
   * Open candidate profile (expand card or navigate).
   */
  async openCandidateProfile(id: string) {
    const card = this.page.locator(`[id="candidate-${id}"]`);
    await card.click();
  }

  /**
   * Click on a candidate's View Profile button.
   */
  async viewCandidateProfile(id: string) {
    const card = this.page.locator(`[id="candidate-${id}"]`);
    const viewButton = card.getByRole('button', { name: /view|profile/i });
    await viewButton.click();
  }

  /**
   * Filter by score range via histogram bar click.
   */
  async filterByScoreRange(range: string) {
    // Click on the histogram bar for the given range
    const bar = this.histogramBars.filter({ hasText: new RegExp(range) });
    if (await bar.count() > 0) {
      await bar.click();
    } else {
      // Fallback: click on filter buttons
      await this.scoreFilterButtons.filter({ hasText: new RegExp(range) }).click();
    }
  }

  /**
   * Add candidates via search.
   */
  async addCandidates(query: string) {
    await this.searchInput.fill(query);
    await this.addCandidatesButton.click();
  }

  /**
   * Open the import modal.
   */
  async openImportModal() {
    await this.importButton.click();
  }

  /**
   * Import a resume/text.
   */
  async importResume(text: string) {
    await this.openImportModal();
    await this.importTextarea.fill(text);
    await this.analyzeImportButton.click();
  }

  /**
   * Open outreach modal for a candidate.
   */
  async openOutreachModal(id: string) {
    const card = this.page.locator(`[id="candidate-${id}"]`);
    const outreachButton = card.getByRole('button', { name: /outreach|message/i });
    await outreachButton.click();
  }

  /**
   * Wait for candidates to load.
   */
  async waitForCandidates() {
    await Promise.race([
      this.candidateCards.first().waitFor({ state: 'visible', timeout: 15000 }),
      this.emptyState.waitFor({ state: 'visible', timeout: 15000 }),
    ]);
  }

  /**
   * Wait for loading to complete.
   */
  async waitForLoading() {
    await this.loadingSkeletons.first().waitFor({ state: 'hidden', timeout: 30000 }).catch(() => null);
  }

  /**
   * Get the selected candidates count.
   */
  async getSelectedCount() {
    const text = await this.selectedCount.textContent().catch(() => '0');
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Open comparison modal.
   */
  async openComparison() {
    await this.compareButton.click();
  }

  /**
   * Clear all selections.
   */
  async clearSelection() {
    if (await this.clearSelectionButton.isVisible()) {
      await this.clearSelectionButton.click();
    }
  }

  /**
   * Get all candidate IDs.
   */
  async getCandidateIds() {
    const cards = await this.candidateCards.all();
    const ids: string[] = [];
    for (const card of cards) {
      const id = await card.getAttribute('id');
      if (id) {
        ids.push(id.replace('candidate-', ''));
      }
    }
    return ids;
  }

  /**
   * Check if shortlist panel is visible.
   */
  async isShortlistPanelVisible() {
    return this.shortlistPanel.isVisible();
  }

  /**
   * Seed localStorage with test candidates.
   */
  async seedCandidates(candidates: Array<{
    id: string;
    name: string;
    currentRole: string;
    company: string;
    location: string;
    alignmentScore: number;
    avatar: string;
    skills: string[];
  }>) {
    await this.page.evaluate((data) => {
      localStorage.setItem('apex_candidates', JSON.stringify(data));
    }, candidates);
  }
}
