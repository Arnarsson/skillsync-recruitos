import { type Page } from '@playwright/test';
import {
  mockCalibrationResult,
  mockProfileAnalysis,
  mockOutreachMessage,
  mockDeepProfile,
} from '../fixtures/mockGeminiResponse';
import {
  mockDeveloperApiResponse,
  mockDeveloperDeepApiResponse,
} from '../fixtures/mockGitHubUser';
import { mockSearchResults, createMockSearchResponse } from '../fixtures/mockGitHubSearch';
import {
  mockLinkedInProfile,
  mockLinkedInSearchResults,
  mockGoogleSerpResults,
} from '../fixtures/mockBrightData';
import {
  mockSecondDegreeConnection,
  mockSocialMatrix,
} from '../fixtures/mockConnectionPath';

/**
 * Mock all Gemini AI API endpoints.
 */
export async function mockGeminiAPI(page: Page) {
  // Mock calibration endpoint
  await page.route('**/api/calibration', async (route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCalibrationResult),
      });
    } else {
      await route.continue();
    }
  });

  // Mock profile analysis endpoint
  await page.route('**/api/profile/analyze', async (route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProfileAnalysis),
      });
    } else {
      await route.continue();
    }
  });

  // Mock outreach endpoint
  await page.route('**/api/outreach', async (route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockOutreachMessage),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock all GitHub API endpoints.
 */
export async function mockGitHubAPI(page: Page) {
  // Mock search endpoint
  await page.route('**/api/search**', async (route) => {
    const url = new URL(route.request().url());
    const query = url.searchParams.get('q') || '';

    // Return dynamic results based on query
    const results = createMockSearchResponse(query);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(results),
    });
  });

  // Mock developer profile endpoint
  await page.route('**/api/developers/*', async (route) => {
    const url = route.request().url();
    const username = url.split('/').pop();

    // Return mock developer data
    const response = {
      ...mockDeveloperApiResponse,
      user: {
        ...mockDeveloperApiResponse.user,
        login: username,
      },
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });

  // Mock GitHub signals endpoint
  await page.route('**/api/github/signals**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        openToWork: true,
        lastActive: new Date().toISOString(),
        activityScore: 75,
        recentActivity: [
          { type: 'commit', date: new Date().toISOString(), repo: 'example-repo' },
        ],
      }),
    });
  });

  // Mock connection path endpoint
  await page.route('**/api/github/connection-path**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSecondDegreeConnection),
    });
  });

  // Mock GitHub stars/followers endpoints
  await page.route('**/api/github/followers**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        followers: ['user1', 'user2', 'user3'],
        following: ['user4', 'user5'],
      }),
    });
  });
}

/**
 * Mock all BrightData API endpoints.
 */
export async function mockBrightDataAPI(page: Page) {
  // Mock LinkedIn profile scrape
  await page.route('**/api/brightdata/linkedin-profile**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'ready',
        profile: mockLinkedInProfile,
      }),
    });
  });

  // Mock LinkedIn search
  await page.route('**/api/brightdata/linkedin-search**', async (route) => {
    const request = route.request();

    if (request.method() === 'POST') {
      // Return snapshot ID for initial request
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          snapshotId: 'mock-snapshot-123',
        }),
      });
    } else {
      // Return results for GET request
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockLinkedInSearchResults),
      });
    }
  });

  // Mock Google SERP search
  await page.route('**/api/brightdata/serp**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockGoogleSerpResults),
    });
  });
}

/**
 * Mock Social Matrix connection path API.
 */
export async function mockSocialMatrixAPI(page: Page) {
  await page.route('**/api/github/connection-path**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSecondDegreeConnection),
    });
  });

  await page.route('**/api/social-matrix**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSocialMatrix),
    });
  });
}

/**
 * Mock all external APIs at once.
 * Useful for setting up complete test isolation.
 */
export async function mockAllAPIs(page: Page) {
  await mockGeminiAPI(page);
  await mockGitHubAPI(page);
  await mockBrightDataAPI(page);
  await mockSocialMatrixAPI(page);
}

/**
 * Create a delay mock for testing loading states.
 */
export async function mockWithDelay(
  page: Page,
  pattern: string,
  response: object,
  delayMs: number = 1000
) {
  await page.route(pattern, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Mock an API to return an error.
 */
export async function mockAPIError(
  page: Page,
  pattern: string,
  statusCode: number = 500,
  errorMessage: string = 'Internal Server Error'
) {
  await page.route(pattern, async (route) => {
    await route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify({ error: errorMessage }),
    });
  });
}
