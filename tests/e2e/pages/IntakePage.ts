import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the Intake page (/intake).
 * Handles job context input, demo loading, and calibration.
 */
export class IntakePage {
  readonly page: Page;

  // Locators
  readonly loadDemoButton: Locator;
  readonly jobUrlInput: Locator;
  readonly jobTextArea: Locator;
  readonly analyzeUrlButton: Locator;
  readonly analyzeTextButton: Locator;
  readonly initializePipelineButton: Locator;
  readonly startOverButton: Locator;

  // Tabs
  readonly urlTab: Locator;
  readonly textTab: Locator;

  // Social context fields
  readonly companyLinkedInInput: Locator;
  readonly managerLinkedInInput: Locator;
  readonly benchmarkLinkedInInput: Locator;

  // Calibration results
  readonly calibrationCard: Locator;
  readonly jobTitle: Locator;
  readonly companyName: Locator;
  readonly requiredSkillsBadges: Locator;
  readonly preferredSkillsBadges: Locator;
  readonly experienceBadge: Locator;
  readonly locationBadge: Locator;

  // Loading and error states
  readonly loadingSpinner: Locator;
  readonly loadingText: Locator;
  readonly errorMessage: Locator;

  // Validation indicators
  readonly validationCheck: Locator;
  readonly validationError: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main buttons
    this.loadDemoButton = page.getByRole('button', { name: /load demo/i });
    this.analyzeUrlButton = page.getByRole('button', { name: /fetch|analyzing/i });
    this.analyzeTextButton = page.getByRole('button', { name: /analyze job|analyzing/i });
    this.initializePipelineButton = page.getByRole('button', { name: /initialize pipeline/i });
    this.startOverButton = page.getByRole('button', { name: /start over/i });

    // Tabs
    this.urlTab = page.getByRole('tab', { name: /from url/i });
    this.textTab = page.getByRole('tab', { name: /paste text/i });

    // Inputs
    this.jobUrlInput = page.getByPlaceholder(/greenhouse|url/i);
    this.jobTextArea = page.locator('textarea').first();

    // Social context inputs
    this.companyLinkedInInput = page.getByPlaceholder('https://linkedin.com/company/...');
    this.managerLinkedInInput = page.locator('input[placeholder*="linkedin.com/in/"]').first();
    this.benchmarkLinkedInInput = page.locator('input[placeholder*="linkedin.com/in/"]').last();

    // Calibration results
    this.calibrationCard = page.locator('.border-green-500\\/30');
    this.jobTitle = this.calibrationCard.locator('h3');
    this.companyName = this.calibrationCard.locator('p.text-muted-foreground').first();
    this.requiredSkillsBadges = page.locator('text=Required Skills').locator('..').locator('..').getByRole('listitem');
    this.preferredSkillsBadges = page.locator('text=Preferred Skills').locator('..').locator('..').getByRole('listitem');
    this.experienceBadge = page.locator('[class*="Badge"]').filter({ hasText: /years?|senior|junior/i });
    this.locationBadge = page.locator('[class*="Badge"]').filter({ hasText: /remote|hybrid|onsite|copenhagen|denmark/i });

    // States
    this.loadingSpinner = page.locator('.animate-spin');
    this.loadingText = page.locator('text=/extracting|identifying|analyzing|calibrating/i');
    this.errorMessage = page.locator('.text-red-500');

    // Validation
    this.validationCheck = page.locator('.text-green-500');
    this.validationError = page.locator('.border-red-500');
  }

  /**
   * Navigate to the intake page.
   */
  async goto() {
    await this.page.goto('/intake');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Load the demo job context.
   */
  async loadDemo() {
    await this.loadDemoButton.click();
    // Wait for calibration card to appear
    await this.calibrationCard.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Submit a job URL for analysis.
   */
  async submitJobUrl(url: string) {
    await this.urlTab.click();
    await this.jobUrlInput.fill(url);
    await this.analyzeUrlButton.click();
  }

  /**
   * Submit job text for analysis.
   */
  async submitJobText(text: string) {
    await this.textTab.click();
    await this.jobTextArea.fill(text);
    await this.analyzeTextButton.click();
  }

  /**
   * Set company LinkedIn URL.
   */
  async setCompanyLinkedIn(url: string) {
    await this.companyLinkedInInput.fill(url);
  }

  /**
   * Initialize the pipeline after calibration.
   */
  async initializePipeline() {
    await this.initializePipelineButton.click();
  }

  /**
   * Get the calibration result details.
   */
  async getCalibrationResult() {
    const title = await this.jobTitle.textContent();
    const company = await this.companyName.textContent();
    const skillBadges = await this.page.locator('.bg-primary\\/20.text-primary').allTextContents();

    return {
      title,
      company,
      skills: skillBadges,
    };
  }

  /**
   * Check if calibration was successful.
   */
  async isCalibrationSuccessful() {
    return this.calibrationCard.isVisible();
  }

  /**
   * Wait for loading to complete.
   */
  async waitForLoading() {
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 30000 });
  }

  /**
   * Check if there's an error message.
   */
  async hasError() {
    return this.errorMessage.isVisible();
  }

  /**
   * Get error message text.
   */
  async getErrorText() {
    return this.errorMessage.textContent();
  }

  /**
   * Check validation state for LinkedIn URL.
   */
  async isCompanyLinkedInValid() {
    const input = this.companyLinkedInInput;
    const hasGreenBorder = await input.evaluate((el) =>
      el.classList.contains('border-green-500')
    );
    return hasGreenBorder;
  }
}
