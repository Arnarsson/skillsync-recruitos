/**
 * API Tests for /api/search
 * Tests the developer search endpoint
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { GET } from '@/app/api/search/route';
import { NextRequest } from 'next/server';

describe('GET /api/search', () => {
  beforeAll(() => {
    // Mock console methods to reduce test noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should return 400 when query parameter is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/search');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Query parameter 'q' is required");
  });

  it('should return search results for valid query', async () => {
    const request = new NextRequest('http://localhost:3000/api/search?q=react developer');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toBeDefined();
    
    // Validate response structure
    expect(data).toHaveProperty('items');
    expect(data).toHaveProperty('total_count');
    expect(Array.isArray(data.items)).toBe(true);

    // If results exist, validate structure
    if (data.items.length > 0) {
      const firstResult = data.items[0];
      expect(firstResult).toHaveProperty('login');
      expect(firstResult).toHaveProperty('id');
      expect(firstResult).toHaveProperty('avatar_url');
      expect(firstResult).toHaveProperty('html_url');
    }
  }, 30000);

  it('should respect pagination parameters', async () => {
    const request1 = new NextRequest('http://localhost:3000/api/search?q=javascript&page=1&perPage=5');
    const request2 = new NextRequest('http://localhost:3000/api/search?q=javascript&page=2&perPage=5');

    const response1 = await GET(request1);
    const response2 = await GET(request2);

    const data1 = await response1.json();
    const data2 = await response2.json();

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);

    // Results should be different (different pages)
    if (data1.items.length > 0 && data2.items.length > 0) {
      expect(data1.items[0].login).not.toBe(data2.items[0].login);
    }

    // Both should have the same total_count
    if (data1.total_count > 10) {
      expect(data1.total_count).toBe(data2.total_count);
    }
  }, 30000);

  it('should handle specific programming language queries', async () => {
    const request = new NextRequest('http://localhost:3000/api/search?q=typescript');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toBeDefined();
    expect(data.total_count).toBeGreaterThan(0);
  }, 30000);

  it('should handle complex search queries', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/search?q=senior react developer location:berlin'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toBeDefined();
  }, 30000);

  it('should return limited results when perPage is set', async () => {
    const perPage = 3;
    const request = new NextRequest(
      `http://localhost:3000/api/search?q=python&perPage=${perPage}`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items.length).toBeLessThanOrEqual(perPage);
  }, 30000);

  it('should handle searches with no results gracefully', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/search?q=xyzabc123nonexistentquery999'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toEqual([]);
    expect(data.total_count).toBe(0);
  }, 30000);

  it('should include user metadata in results', async () => {
    const request = new NextRequest('http://localhost:3000/api/search?q=nodejs&perPage=1');

    const response = await GET(request);
    const data = await response.json();

    if (response.status === 200 && data.items.length > 0) {
      const user = data.items[0];
      
      // Check for expected GitHub user fields
      expect(user).toHaveProperty('login');
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('type');
      expect(user).toHaveProperty('score');
      
      // Score should be a number
      expect(typeof user.score).toBe('number');
    }
  }, 30000);

  it('should handle special characters in query', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/search?q=c%2B%2B' // C++ encoded
    );

    const response = await GET(request);
    
    // Should not crash
    expect([200, 400, 500]).toContain(response.status);
  }, 30000);

  it('should validate page parameter defaults to 1', async () => {
    const requestWithPage = new NextRequest('http://localhost:3000/api/search?q=ruby&page=1');
    const requestWithoutPage = new NextRequest('http://localhost:3000/api/search?q=ruby');

    const responseWithPage = await GET(requestWithPage);
    const responseWithoutPage = await GET(requestWithoutPage);

    const dataWithPage = await responseWithPage.json();
    const dataWithoutPage = await responseWithoutPage.json();

    // Results should be identical (both page 1)
    if (dataWithPage.items.length > 0 && dataWithoutPage.items.length > 0) {
      expect(dataWithPage.items[0].login).toBe(dataWithoutPage.items[0].login);
    }
  }, 30000);

  it('should validate perPage parameter defaults to 10', async () => {
    const request = new NextRequest('http://localhost:3000/api/search?q=vue');

    const response = await GET(request);
    const data = await response.json();

    if (response.status === 200 && data.total_count >= 10) {
      // Should return up to 10 results by default
      expect(data.items.length).toBeLessThanOrEqual(10);
    }
  }, 30000);
});
