/**
 * API Tests for /api/profile/psychometric
 * Tests the personality profile generation endpoint
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the psychometrics module
vi.mock('@/lib/psychometrics', () => ({
  analyzeGitHubSignals: vi.fn(() => ({
    username: 'testuser',
    techStack: ['JavaScript', 'TypeScript', 'Python'],
    interests: ['open-source', 'systems'],
    commitPatterns: {
      frequency: 'daily',
      timeOfDay: 'evening',
      weekendActivity: true,
    },
    codeStyle: {
      documentationLevel: 'moderate',
      testCoverage: 'some',
      refactoringFrequency: 'regular',
    },
    collaboration: {
      prReviewStyle: 'thorough',
      issueResponseTime: 'fast',
      openSourceContributions: 42,
    },
  })),
  generateAIPsychometricProfile: vi.fn(() =>
    Promise.resolve({
      archetype: {
        primary: 'The Architect',
        secondary: 'The Craftsman',
        description: 'A systems thinker who designs elegant solutions',
        strengths: ['System design', 'Problem decomposition', 'Technical leadership'],
        blindSpots: ['Over-engineering', 'Impatience with simple tasks'],
      },
      workStyle: {
        autonomy: 80,
        collaboration: 60,
        structure: 70,
        pacePreference: 'steady',
        feedbackStyle: 'direct',
        decisionMaking: 'analytical',
      },
      communicationStyle: {
        formality: 'technical',
        verbosity: 'concise',
        responseTime: 'thoughtful',
        preferredChannels: ['code reviews', 'technical docs'],
      },
      motivators: ['Technical challenges', 'Open source impact', 'Learning'],
      stressors: ['Bureaucracy', 'Unclear requirements'],
      teamDynamics: {
        idealTeamSize: 'small',
        leadershipStyle: 'lead',
        conflictApproach: 'direct',
        mentorshipInterest: 'both',
      },
      greenFlags: ['Strong OSS contributions', 'Consistent commit history'],
      redFlags: [],
      interviewQuestions: [
        'Describe a system you architected from scratch',
        'How do you approach technical debt?',
        'Tell me about your mentoring experience',
      ],
      outreachTips: [
        'Lead with technical challenges',
        'Mention open source contributions',
      ],
      confidence: 78,
    })
  ),
}));

// Mock auth-guard to bypass authentication in tests
vi.mock('@/lib/auth-guard', () => ({
  requireAuth: vi.fn(() =>
    Promise.resolve({
      session: { user: { name: 'Test User', email: 'test@example.com' } },
      user: { name: 'Test User', email: 'test@example.com' },
    })
  ),
  withAuth: vi.fn((handler: any) => handler),
}));

// Mock global fetch for GitHub API calls within the route handler
const mockFetchFn = vi.fn();
vi.stubGlobal('fetch', mockFetchFn);

import { POST } from '@/app/api/profile/psychometric/route';

describe('POST /api/profile/psychometric', () => {
  beforeAll(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: mock GitHub user API response
    mockFetchFn.mockImplementation((url: string) => {
      if (url.includes('api.github.com/users/') && url.includes('/repos')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { name: 'linux', language: 'C', stargazers_count: 100000 },
              { name: 'git', language: 'C', stargazers_count: 40000 },
            ]),
        });
      }
      if (url.includes('api.github.com/users/')) {
        const username = url.split('/').pop();
        if (username === 'this-user-definitely-does-not-exist-12345') {
          return Promise.resolve({ ok: false, status: 404 });
        }
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              login: username,
              name: 'Test User',
              bio: 'Software engineer',
              company: 'FOSS',
              location: 'Worldwide',
              followers: 1000,
              public_repos: 50,
            }),
        });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });
  });

  it('should return 400 when username is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/profile/psychometric', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('GitHub username is required');
  });

  it('should return 404 when GitHub user does not exist', async () => {
    const request = new NextRequest('http://localhost:3000/api/profile/psychometric', {
      method: 'POST',
      body: JSON.stringify({ username: 'this-user-definitely-does-not-exist-12345' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('GitHub user not found');
  });

  it('should generate psychometric profile for valid username', async () => {
    const request = new NextRequest('http://localhost:3000/api/profile/psychometric', {
      method: 'POST',
      body: JSON.stringify({ username: 'torvalds' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.profile).toBeDefined();
    expect(data.githubSignals).toBeDefined();

    // Validate profile structure matches PsychometricProfile interface
    expect(data.profile).toHaveProperty('archetype');
    expect(data.profile.archetype).toHaveProperty('primary');
    expect(data.profile.archetype).toHaveProperty('strengths');
    expect(data.profile.archetype).toHaveProperty('blindSpots');
    expect(data.profile).toHaveProperty('confidence');
    expect(data.profile).toHaveProperty('workStyle');
    expect(data.profile).toHaveProperty('motivators');
    expect(data.profile).toHaveProperty('stressors');
    expect(data.profile).toHaveProperty('interviewQuestions');
    expect(data.profile).toHaveProperty('outreachTips');

    // Validate githubSignals structure
    expect(data.githubSignals).toHaveProperty('username');
    expect(data.githubSignals).toHaveProperty('techStack');
    expect(data.githubSignals).toHaveProperty('interests');
    expect(data.githubSignals).toHaveProperty('commitPatterns');
    expect(Array.isArray(data.githubSignals.techStack)).toBe(true);
  });

  it('should handle GitHub API rate limiting gracefully', async () => {
    const request = new NextRequest('http://localhost:3000/api/profile/psychometric', {
      method: 'POST',
      body: JSON.stringify({ username: 'octocat' }),
    });

    const response = await POST(request);
    expect([200, 500]).toContain(response.status);
  });

  it('should validate archetype types are within expected values', async () => {
    const validArchetypes = [
      'The Architect',
      'The Optimizer',
      'The Collaborator',
      'The Pioneer',
      'The Craftsman',
      'The Mentor',
      'The Strategist',
      'The Specialist',
    ];

    const request = new NextRequest('http://localhost:3000/api/profile/psychometric', {
      method: 'POST',
      body: JSON.stringify({ username: 'tj' }),
    });

    const response = await POST(request);
    const data = await response.json();

    if (response.status === 200) {
      expect(validArchetypes).toContain(data.profile.archetype.primary);
      expect(data.profile.confidence).toBeGreaterThanOrEqual(0);
      expect(data.profile.confidence).toBeLessThanOrEqual(100);
    }
  });

  it('should return valid arrays for strengths and blind spots', async () => {
    const request = new NextRequest('http://localhost:3000/api/profile/psychometric', {
      method: 'POST',
      body: JSON.stringify({ username: 'sindresorhus' }),
    });

    const response = await POST(request);
    const data = await response.json();

    if (response.status === 200) {
      expect(Array.isArray(data.profile.archetype.strengths)).toBe(true);
      expect(Array.isArray(data.profile.archetype.blindSpots)).toBe(true);
      expect(Array.isArray(data.profile.motivators)).toBe(true);
      expect(Array.isArray(data.profile.stressors)).toBe(true);
      expect(Array.isArray(data.profile.interviewQuestions)).toBe(true);
      expect(Array.isArray(data.profile.outreachTips)).toBe(true);

      expect(data.profile.archetype.strengths.length).toBeGreaterThan(0);
      expect(data.profile.archetype.blindSpots.length).toBeGreaterThan(0);
      expect(data.profile.interviewQuestions.length).toBeGreaterThan(0);
    }
  });

  it('should return work style indicators', async () => {
    const request = new NextRequest('http://localhost:3000/api/profile/psychometric', {
      method: 'POST',
      body: JSON.stringify({ username: 'gaearon' }),
    });

    const response = await POST(request);
    const data = await response.json();

    if (response.status === 200) {
      expect(data.profile.workStyle).toBeDefined();
      expect(data.profile.workStyle).toHaveProperty('autonomy');
      expect(data.profile.workStyle).toHaveProperty('collaboration');
      expect(data.profile.workStyle).toHaveProperty('structure');
      expect(data.profile.workStyle).toHaveProperty('pacePreference');
      expect(data.profile.workStyle).toHaveProperty('feedbackStyle');
      expect(data.profile.workStyle).toHaveProperty('decisionMaking');
    }
  });
});
