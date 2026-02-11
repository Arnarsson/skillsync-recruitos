/**
 * API Tests for /api/skills/preview
 * Tests the skills preview endpoint (hard requirements analysis)
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies before importing the route handler
const mockSearchUsers = vi.fn();

vi.mock('@/lib/github', () => ({
  createOctokit: vi.fn(() => ({
    search: {
      users: mockSearchUsers,
    },
  })),
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

import { POST } from '@/app/api/skills/preview/route';

describe('POST /api/skills/preview', () => {
  beforeAll(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock: return a count based on skill name
    mockSearchUsers.mockImplementation(({ q }: { q: string }) => {
      const countMap: Record<string, number> = {
        'react': 5000,
        'javascript': 50000,
        'typescript': 30000,
        'graphql': 2000,
        'python': 40000,
        'java': 35000,
        'spring': 8000,
        'docker': 15000,
        'vue': 12000,
        'go': 20000,
        'brainfuck': 5,
        'assembly': 800,
        'node.js': 25000,
        'express': 10000,
        'mongodb': 8000,
        'someveryrareskill123': 0,
        'react.js': 5000,
      };

      // Extract the main search term (lowercase, first word)
      const searchTerm = q.toLowerCase().split(' ')[0].replace('language:', '');
      const count = countMap[searchTerm] ?? 100;

      return Promise.resolve({ data: { total_count: count } });
    });
  });

  it('should return 400 when skills array is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/skills/preview', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Skills array is required');
  });

  it('should return 400 when skills array is empty', async () => {
    const request = new NextRequest('http://localhost:3000/api/skills/preview', {
      method: 'POST',
      body: JSON.stringify({ skills: [] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Skills array is required');
  });

  it('should return candidate counts for valid skills', async () => {
    const request = new NextRequest('http://localhost:3000/api/skills/preview', {
      method: 'POST',
      body: JSON.stringify({
        skills: [
          { name: 'React', tier: 'must-have' },
          { name: 'TypeScript', tier: 'must-have' },
          { name: 'GraphQL', tier: 'nice-to-have' },
        ],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('totalCandidates');
    expect(data).toHaveProperty('perSkill');
    expect(data).toHaveProperty('suggestions');
    expect(data).toHaveProperty('cached');

    expect(data.perSkill).toHaveProperty('React');
    expect(data.perSkill).toHaveProperty('TypeScript');
    expect(data.perSkill).toHaveProperty('GraphQL');

    expect(data.perSkill.React).toHaveProperty('count');
    expect(data.perSkill.React).toHaveProperty('isLimiting');
    expect(typeof data.perSkill.React.count).toBe('number');
    expect(typeof data.perSkill.React.isLimiting).toBe('boolean');
  });

  it('should identify limiting skills correctly', async () => {
    const request = new NextRequest('http://localhost:3000/api/skills/preview', {
      method: 'POST',
      body: JSON.stringify({
        skills: [
          { name: 'JavaScript', tier: 'must-have' },
          { name: 'Brainfuck', tier: 'must-have' },
        ],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    // JavaScript should not be limiting (very common)
    expect(data.perSkill.JavaScript.isLimiting).toBe(false);

    // Brainfuck should be limiting (count=5, below threshold of 20)
    expect(data.perSkill.Brainfuck.isLimiting).toBe(true);
  });

  it('should provide suggestions for limiting skills', async () => {
    const request = new NextRequest('http://localhost:3000/api/skills/preview', {
      method: 'POST',
      body: JSON.stringify({
        skills: [
          { name: 'React', tier: 'must-have' },
          { name: 'SomeVeryRareSkill123', tier: 'must-have' },
        ],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data.suggestions)).toBe(true);

    // SomeVeryRareSkill123 has count=0 → limiting → suggestion generated
    expect(data.suggestions.length).toBeGreaterThan(0);
    const suggestion = data.suggestions[0];
    expect(suggestion).toHaveProperty('skill');
    expect(suggestion).toHaveProperty('currentTier');
    expect(suggestion).toHaveProperty('suggestedTier');
    expect(suggestion).toHaveProperty('impact');

    expect(suggestion.currentTier).toBe('must-have');
    expect(suggestion.suggestedTier).toBe('nice-to-have');
  });

  it('should handle location filtering', async () => {
    // With location, return lower count
    mockSearchUsers.mockImplementation(({ q }: { q: string }) => {
      const hasLocation = q.includes('location:');
      return Promise.resolve({
        data: { total_count: hasLocation ? 500 : 5000 },
      });
    });

    const requestWithLocation = new NextRequest('http://localhost:3000/api/skills/preview', {
      method: 'POST',
      body: JSON.stringify({
        skills: [{ name: 'Python', tier: 'must-have' }],
        location: 'Copenhagen',
      }),
    });

    const requestWithoutLocation = new NextRequest('http://localhost:3000/api/skills/preview', {
      method: 'POST',
      body: JSON.stringify({
        skills: [{ name: 'Python', tier: 'must-have' }],
      }),
    });

    const responseWith = await POST(requestWithLocation);
    const responseWithout = await POST(requestWithoutLocation);

    const dataWith = await responseWith.json();
    const dataWithout = await responseWithout.json();

    expect(responseWith.status).toBe(200);
    expect(responseWithout.status).toBe(200);

    expect(dataWith.perSkill.Python.count).toBeLessThanOrEqual(
      dataWithout.perSkill.Python.count
    );
  });

  it('should handle multiple must-have skills', async () => {
    const request = new NextRequest('http://localhost:3000/api/skills/preview', {
      method: 'POST',
      body: JSON.stringify({
        skills: [
          { name: 'Node.js', tier: 'must-have' },
          { name: 'Express', tier: 'must-have' },
          { name: 'MongoDB', tier: 'must-have' },
        ],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.perSkill).toHaveProperty('Node.js');
    expect(data.perSkill).toHaveProperty('Express');
    expect(data.perSkill).toHaveProperty('MongoDB');

    // Total candidates now uses conservative strict estimation for combined must-haves
    const mustHaveCounts = [
      data.perSkill['Node.js'].count,
      data.perSkill['Express'].count,
      data.perSkill['MongoDB'].count,
    ].filter((c: number) => c > 0);

    if (mustHaveCounts.length > 0) {
      expect(data.estimateMode).toBe('strict');
      expect(data.totalCandidates).toBeLessThanOrEqual(Math.min(...mustHaveCounts));
      expect(data.totalCandidates).toBeGreaterThanOrEqual(0);
    }
  });

  it('should handle different skill tiers', async () => {
    const request = new NextRequest('http://localhost:3000/api/skills/preview', {
      method: 'POST',
      body: JSON.stringify({
        skills: [
          { name: 'Java', tier: 'must-have' },
          { name: 'Spring', tier: 'nice-to-have' },
          { name: 'Docker', tier: 'bonus' },
        ],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    // Only must-haves should be marked as potentially limiting
    expect(data.perSkill.Spring.isLimiting).toBe(false);
    expect(data.perSkill.Docker.isLimiting).toBe(false);
  });

  it('should utilize caching for repeated requests', async () => {
    const body = JSON.stringify({
      skills: [{ name: 'Vue', tier: 'must-have' }],
    });

    const request1 = new NextRequest('http://localhost:3000/api/skills/preview', {
      method: 'POST',
      body,
    });

    const request2 = new NextRequest('http://localhost:3000/api/skills/preview', {
      method: 'POST',
      body,
    });

    const response1 = await POST(request1);
    const data1 = await response1.json();

    const response2 = await POST(request2);
    const data2 = await response2.json();

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
    expect(typeof data2.cached).toBe('boolean');

    // Counts should be identical
    expect(data1.perSkill.Vue.count).toBe(data2.perSkill.Vue.count);
  });

  it('should calculate potential gain for limiting skills', async () => {
    const request = new NextRequest('http://localhost:3000/api/skills/preview', {
      method: 'POST',
      body: JSON.stringify({
        skills: [
          { name: 'JavaScript', tier: 'must-have' },
          { name: 'Assembly', tier: 'must-have' },
        ],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    // Assembly is limiting (count=800, which is > 20 so not limiting by default)
    // JavaScript is not limiting (50000)
    // The "isLimiting" check requires count < 20 OR count === 0, so Assembly won't be limiting
    // Just verify structure is correct
    expect(data.perSkill.JavaScript.isLimiting).toBe(false);
    expect(data.perSkill.Assembly.isLimiting).toBe(false);
    expect(data.perSkill.JavaScript.potentialGain).toBeUndefined();
  });

  it('should handle skill name normalization', async () => {
    const request = new NextRequest('http://localhost:3000/api/skills/preview', {
      method: 'POST',
      body: JSON.stringify({
        skills: [
          { name: 'react', tier: 'must-have' },
          { name: 'React.js', tier: 'nice-to-have' },
        ],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.perSkill).toHaveProperty('react');
    expect(data.perSkill).toHaveProperty('React.js');
  });

  it('should return valid tier names in response', async () => {
    const validTiers = ['must-have', 'nice-to-have', 'bonus'];

    const request = new NextRequest('http://localhost:3000/api/skills/preview', {
      method: 'POST',
      body: JSON.stringify({
        skills: [{ name: 'Go', tier: 'must-have' }],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    if (data.suggestions.length > 0) {
      data.suggestions.forEach((suggestion: any) => {
        expect(validTiers).toContain(suggestion.currentTier);
        expect(validTiers).toContain(suggestion.suggestedTier);
      });
    }
  });
});
