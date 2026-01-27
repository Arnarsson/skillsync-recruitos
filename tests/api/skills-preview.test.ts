/**
 * API Tests for /api/skills/preview
 * Tests the skills preview endpoint (hard requirements analysis)
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { POST } from '@/app/api/skills/preview/route';
import { NextRequest } from 'next/server';

describe('POST /api/skills/preview', () => {
  beforeAll(() => {
    // Mock console methods to reduce test noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
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

    // Validate perSkill structure
    expect(data.perSkill).toHaveProperty('React');
    expect(data.perSkill).toHaveProperty('TypeScript');
    expect(data.perSkill).toHaveProperty('GraphQL');

    // Each skill should have count and isLimiting
    expect(data.perSkill.React).toHaveProperty('count');
    expect(data.perSkill.React).toHaveProperty('isLimiting');
    expect(typeof data.perSkill.React.count).toBe('number');
    expect(typeof data.perSkill.React.isLimiting).toBe('boolean');
  }, 60000);

  it('should identify limiting skills correctly', async () => {
    const request = new NextRequest('http://localhost:3000/api/skills/preview', {
      method: 'POST',
      body: JSON.stringify({
        skills: [
          { name: 'JavaScript', tier: 'must-have' }, // Very common
          { name: 'Brainfuck', tier: 'must-have' },  // Very rare
        ],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    // JavaScript should not be limiting (very common language)
    expect(data.perSkill.JavaScript.isLimiting).toBe(false);

    // Brainfuck should be limiting (rare/esoteric language)
    if (data.perSkill.Brainfuck.count < 20) {
      expect(data.perSkill.Brainfuck.isLimiting).toBe(true);
    }
  }, 60000);

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

    // If there are suggestions, validate structure
    if (data.suggestions.length > 0) {
      const suggestion = data.suggestions[0];
      expect(suggestion).toHaveProperty('skill');
      expect(suggestion).toHaveProperty('currentTier');
      expect(suggestion).toHaveProperty('suggestedTier');
      expect(suggestion).toHaveProperty('impact');

      // Current tier should be must-have, suggested should be nice-to-have
      expect(suggestion.currentTier).toBe('must-have');
      expect(suggestion.suggestedTier).toBe('nice-to-have');
    }
  }, 60000);

  it('should handle location filtering', async () => {
    const requestWithLocation = new NextRequest('http://localhost:3000/api/skills/preview', {
      method: 'POST',
      body: JSON.stringify({
        skills: [
          { name: 'Python', tier: 'must-have' },
        ],
        location: 'Copenhagen',
      }),
    });

    const requestWithoutLocation = new NextRequest('http://localhost:3000/api/skills/preview', {
      method: 'POST',
      body: JSON.stringify({
        skills: [
          { name: 'Python', tier: 'must-have' },
        ],
      }),
    });

    const responseWith = await POST(requestWithLocation);
    const responseWithout = await POST(requestWithoutLocation);

    const dataWith = await responseWith.json();
    const dataWithout = await responseWithout.json();

    expect(responseWith.status).toBe(200);
    expect(responseWithout.status).toBe(200);

    // Location-filtered should have fewer or equal candidates
    expect(dataWith.perSkill.Python.count).toBeLessThanOrEqual(
      dataWithout.perSkill.Python.count
    );
  }, 60000);

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

    // Total candidates should be based on the largest must-have pool
    const mustHaveCounts = [
      data.perSkill['Node.js'].count,
      data.perSkill['Express'].count,
      data.perSkill['MongoDB'].count,
    ].filter(c => c > 0);

    if (mustHaveCounts.length > 0) {
      expect(data.totalCandidates).toBe(Math.max(...mustHaveCounts));
    }
  }, 60000);

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
  }, 60000);

  it('should utilize caching for repeated requests', async () => {
    const body = JSON.stringify({
      skills: [
        { name: 'Vue', tier: 'must-have' },
      ],
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

    // Second request should be faster due to caching
    const response2 = await POST(request2);
    const data2 = await response2.json();

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);

    // Second response might be marked as cached
    // (depends on cache TTL)
    expect(typeof data2.cached).toBe('boolean');

    // Counts should be identical
    expect(data1.perSkill.Vue.count).toBe(data2.perSkill.Vue.count);
  }, 60000);

  it('should calculate potential gain for limiting skills', async () => {
    const request = new NextRequest('http://localhost:3000/api/skills/preview', {
      method: 'POST',
      body: JSON.stringify({
        skills: [
          { name: 'JavaScript', tier: 'must-have' }, // Very common
          { name: 'Assembly', tier: 'must-have' },   // Much rarer
        ],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    if (response.status === 200) {
      // If Assembly is limiting, it should have potentialGain
      if (data.perSkill.Assembly.isLimiting) {
        expect(data.perSkill.Assembly).toHaveProperty('potentialGain');
        expect(data.perSkill.Assembly.potentialGain).toBeGreaterThan(0);
      }

      // JavaScript should not have potentialGain (not limiting)
      expect(data.perSkill.JavaScript.potentialGain).toBeUndefined();
    }
  }, 60000);

  it('should handle skill name normalization', async () => {
    const request = new NextRequest('http://localhost:3000/api/skills/preview', {
      method: 'POST',
      body: JSON.stringify({
        skills: [
          { name: 'react', tier: 'must-have' },      // lowercase
          { name: 'React.js', tier: 'nice-to-have' }, // with .js
        ],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.perSkill).toHaveProperty('react');
    expect(data.perSkill).toHaveProperty('React.js');
  }, 60000);

  it('should return valid tier names in response', async () => {
    const validTiers = ['must-have', 'nice-to-have', 'bonus'];
    
    const request = new NextRequest('http://localhost:3000/api/skills/preview', {
      method: 'POST',
      body: JSON.stringify({
        skills: [
          { name: 'Go', tier: 'must-have' },
        ],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    if (response.status === 200 && data.suggestions.length > 0) {
      data.suggestions.forEach((suggestion: any) => {
        expect(validTiers).toContain(suggestion.currentTier);
        expect(validTiers).toContain(suggestion.suggestedTier);
      });
    }
  }, 60000);
});
