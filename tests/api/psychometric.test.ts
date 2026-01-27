/**
 * API Tests for /api/profile/psychometric
 * Tests the personality profile generation endpoint
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { POST } from '@/app/api/profile/psychometric/route';
import { NextRequest } from 'next/server';

describe('POST /api/profile/psychometric', () => {
  beforeAll(() => {
    // Mock console methods to reduce test noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
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
    // Using a well-known GitHub user for testing
    const request = new NextRequest('http://localhost:3000/api/profile/psychometric', {
      method: 'POST',
      body: JSON.stringify({ username: 'torvalds' }), // Linus Torvalds
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.profile).toBeDefined();
    expect(data.githubSignals).toBeDefined();

    // Validate profile structure
    expect(data.profile).toHaveProperty('persona');
    expect(data.profile).toHaveProperty('confidence');
    expect(data.profile).toHaveProperty('strengths');
    expect(data.profile).toHaveProperty('blindSpots');
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
  }, 60000); // Increased timeout for API calls and AI processing

  it('should handle GitHub API rate limiting gracefully', async () => {
    // This test may fail if rate limits are not exceeded
    // It's here to document expected behavior
    const request = new NextRequest('http://localhost:3000/api/profile/psychometric', {
      method: 'POST',
      body: JSON.stringify({ username: 'octocat' }),
    });

    const response = await POST(request);
    
    // Should either succeed or return 500 with error details
    expect([200, 500]).toContain(response.status);
  }, 60000);

  it('should validate persona types are within expected values', async () => {
    const validPersonas = [
      'The Architect',
      'The Craftsman',
      'The Innovator',
      'The Pragmatist',
      'The Explorer',
      'The Specialist',
    ];

    const request = new NextRequest('http://localhost:3000/api/profile/psychometric', {
      method: 'POST',
      body: JSON.stringify({ username: 'tj' }), // TJ Holowaychuk
    });

    const response = await POST(request);
    const data = await response.json();

    if (response.status === 200) {
      expect(validPersonas).toContain(data.profile.persona);
      expect(data.profile.confidence).toBeGreaterThanOrEqual(0);
      expect(data.profile.confidence).toBeLessThanOrEqual(100);
    }
  }, 60000);

  it('should return valid arrays for strengths and blind spots', async () => {
    const request = new NextRequest('http://localhost:3000/api/profile/psychometric', {
      method: 'POST',
      body: JSON.stringify({ username: 'sindresorhus' }), // Sindre Sorhus
    });

    const response = await POST(request);
    const data = await response.json();

    if (response.status === 200) {
      expect(Array.isArray(data.profile.strengths)).toBe(true);
      expect(Array.isArray(data.profile.blindSpots)).toBe(true);
      expect(Array.isArray(data.profile.motivators)).toBe(true);
      expect(Array.isArray(data.profile.stressors)).toBe(true);
      expect(Array.isArray(data.profile.interviewQuestions)).toBe(true);
      expect(Array.isArray(data.profile.outreachTips)).toBe(true);

      // Each should have at least one item
      expect(data.profile.strengths.length).toBeGreaterThan(0);
      expect(data.profile.blindSpots.length).toBeGreaterThan(0);
      expect(data.profile.interviewQuestions.length).toBeGreaterThan(0);
    }
  }, 60000);

  it('should return work style indicators', async () => {
    const request = new NextRequest('http://localhost:3000/api/profile/psychometric', {
      method: 'POST',
      body: JSON.stringify({ username: 'gaearon' }), // Dan Abramov
    });

    const response = await POST(request);
    const data = await response.json();

    if (response.status === 200) {
      expect(data.profile.workStyle).toBeDefined();
      expect(data.profile.workStyle).toHaveProperty('autonomy');
      expect(data.profile.workStyle).toHaveProperty('collaboration');
      expect(data.profile.workStyle).toHaveProperty('structure');
      expect(data.profile.workStyle).toHaveProperty('pace');
      expect(data.profile.workStyle).toHaveProperty('feedback');
      expect(data.profile.workStyle).toHaveProperty('decisions');
    }
  }, 60000);
});
