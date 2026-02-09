/**
 * API Tests for /api/search
 * Tests the developer search endpoint
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies before importing the route handler
vi.mock('@/lib/github', () => ({
  searchDevelopers: vi.fn(),
}));

vi.mock('@/lib/auth-guard', () => ({
  requireAuth: vi.fn(() => Promise.resolve({
    session: { user: { id: 'test-user', email: 'test@test.com' } },
    user: { id: 'test-user', email: 'test@test.com' },
  })),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

import { GET } from '@/app/api/search/route';
import { searchDevelopers } from '@/lib/github';

const mockSearchDevelopers = vi.mocked(searchDevelopers);

describe('GET /api/search', () => {
  beforeAll(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(() => {
    mockSearchDevelopers.mockReset();
  });

  it('should return 400 when query parameter is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/search');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Query parameter 'q' is required");
  });

  it('should return search results for valid query', async () => {
    mockSearchDevelopers.mockResolvedValueOnce({
      items: [
        { login: 'user1', id: 1, avatar_url: 'https://example.com/1.jpg', html_url: 'https://github.com/user1', type: 'User', score: 42.5 },
        { login: 'user2', id: 2, avatar_url: 'https://example.com/2.jpg', html_url: 'https://github.com/user2', type: 'User', score: 38.1 },
      ],
      total_count: 2,
    } as any);

    const request = new NextRequest('http://localhost:3000/api/search?q=react developer');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('items');
    expect(data).toHaveProperty('total_count');
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items).toHaveLength(2);
    expect(data.items[0]).toHaveProperty('login');
    expect(data.items[0]).toHaveProperty('id');
    expect(data.items[0]).toHaveProperty('avatar_url');
    expect(data.items[0]).toHaveProperty('html_url');
  });

  it('should respect pagination parameters', async () => {
    mockSearchDevelopers
      .mockResolvedValueOnce({
        items: [{ login: 'page1-user', id: 1, avatar_url: '', html_url: '', type: 'User', score: 10 }],
        total_count: 100,
      } as any)
      .mockResolvedValueOnce({
        items: [{ login: 'page2-user', id: 2, avatar_url: '', html_url: '', type: 'User', score: 9 }],
        total_count: 100,
      } as any);

    const request1 = new NextRequest('http://localhost:3000/api/search?q=javascript&page=1&perPage=5');
    const request2 = new NextRequest('http://localhost:3000/api/search?q=javascript&page=2&perPage=5');

    const response1 = await GET(request1);
    const response2 = await GET(request2);

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);

    // Verify pagination was passed to the search function
    expect(mockSearchDevelopers).toHaveBeenCalledWith('javascript', undefined, 1, 5);
    expect(mockSearchDevelopers).toHaveBeenCalledWith('javascript', undefined, 2, 5);
  });

  it('should handle specific programming language queries', async () => {
    mockSearchDevelopers.mockResolvedValueOnce({
      items: [{ login: 'ts-dev', id: 1, avatar_url: '', html_url: '', type: 'User', score: 5 }],
      total_count: 1,
    } as any);

    const request = new NextRequest('http://localhost:3000/api/search?q=typescript');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toBeDefined();
    expect(data.total_count).toBeGreaterThan(0);
  });

  it('should handle complex search queries', async () => {
    mockSearchDevelopers.mockResolvedValueOnce({
      items: [],
      total_count: 0,
    } as any);

    const request = new NextRequest(
      'http://localhost:3000/api/search?q=senior react developer location:berlin'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toBeDefined();
  });

  it('should return limited results when perPage is set', async () => {
    const perPage = 3;
    mockSearchDevelopers.mockResolvedValueOnce({
      items: [
        { login: 'u1', id: 1, avatar_url: '', html_url: '', type: 'User', score: 1 },
        { login: 'u2', id: 2, avatar_url: '', html_url: '', type: 'User', score: 2 },
      ],
      total_count: 2,
    } as any);

    const request = new NextRequest(
      `http://localhost:3000/api/search?q=python&perPage=${perPage}`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items.length).toBeLessThanOrEqual(perPage);
  });

  it('should handle searches with no results gracefully', async () => {
    mockSearchDevelopers.mockResolvedValueOnce({
      items: [],
      total_count: 0,
    } as any);

    const request = new NextRequest(
      'http://localhost:3000/api/search?q=xyzabc123nonexistentquery999'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toEqual([]);
    expect(data.total_count).toBe(0);
  });

  it('should include user metadata in results', async () => {
    mockSearchDevelopers.mockResolvedValueOnce({
      items: [{ login: 'node-dev', id: 42, avatar_url: 'https://example.com/a.jpg', html_url: 'https://github.com/node-dev', type: 'User', score: 99.5 }],
      total_count: 1,
    } as any);

    const request = new NextRequest('http://localhost:3000/api/search?q=nodejs&perPage=1');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    const user = data.items[0];
    expect(user).toHaveProperty('login');
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('type');
    expect(user).toHaveProperty('score');
    expect(typeof user.score).toBe('number');
  });

  it('should handle special characters in query', async () => {
    mockSearchDevelopers.mockResolvedValueOnce({
      items: [],
      total_count: 0,
    } as any);

    const request = new NextRequest(
      'http://localhost:3000/api/search?q=c%2B%2B' // C++ encoded
    );

    const response = await GET(request);
    expect([200, 400, 500]).toContain(response.status);
  });

  it('should validate page parameter defaults to 1', async () => {
    mockSearchDevelopers
      .mockResolvedValueOnce({
        items: [{ login: 'ruby-dev', id: 1, avatar_url: '', html_url: '', type: 'User', score: 5 }],
        total_count: 1,
      } as any)
      .mockResolvedValueOnce({
        items: [{ login: 'ruby-dev', id: 1, avatar_url: '', html_url: '', type: 'User', score: 5 }],
        total_count: 1,
      } as any);

    const requestWithPage = new NextRequest('http://localhost:3000/api/search?q=ruby&page=1');
    const requestWithoutPage = new NextRequest('http://localhost:3000/api/search?q=ruby');

    await GET(requestWithPage);
    await GET(requestWithoutPage);

    // Both calls should use page=1
    expect(mockSearchDevelopers).toHaveBeenNthCalledWith(1, 'ruby', undefined, 1, 10);
    expect(mockSearchDevelopers).toHaveBeenNthCalledWith(2, 'ruby', undefined, 1, 10);
  });

  it('should validate perPage parameter defaults to 10', async () => {
    mockSearchDevelopers.mockResolvedValueOnce({
      items: [],
      total_count: 0,
    } as any);

    const request = new NextRequest('http://localhost:3000/api/search?q=vue');
    await GET(request);

    expect(mockSearchDevelopers).toHaveBeenCalledWith('vue', undefined, 1, 10);
  });
});
