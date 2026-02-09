import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { candidateService } from '../../services/candidateService';
import { Candidate, FunnelStage } from '../../types';

// Mock global fetch for the API-backed candidateService
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const mockCandidate: Candidate = {
  id: 'test-123',
  name: 'John Doe',
  currentRole: 'Senior Engineer',
  company: 'Tech Corp',
  location: 'San Francisco, CA',
  yearsExperience: 5,
  avatar: 'https://example.com/avatar.jpg',
  alignmentScore: 85,
  scoreBreakdown: {
    skills: { value: 20, max: 25, percentage: 80 },
    experience: { value: 18, max: 20, percentage: 90 },
    industry: { value: 15, max: 20, percentage: 75 },
    seniority: { value: 16, max: 20, percentage: 80 },
    location: { value: 13, max: 15, percentage: 87 },
  },
  shortlistSummary: 'Strong technical background',
  keyEvidence: ['5 years React', 'Led team of 4'],
  risks: ['Remote work preference'],
  unlockedSteps: [FunnelStage.SHORTLIST],
  sourceUrl: 'https://linkedin.com/in/johndoe',
  rawProfileText: 'Senior Engineer with 5 years...',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('candidateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchAll', () => {
    it('should return empty array when no candidates exist', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ candidates: [], total: 0, limit: 50, offset: 0 })
      );

      const result = await candidateService.fetchAll();
      expect(result.candidates).toEqual([]);
      expect(result.total).toBe(0);
      expect(mockFetch).toHaveBeenCalledWith('/api/candidates');
    });

    it('should return candidates from the API', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({
          candidates: [mockCandidate],
          total: 1,
          limit: 50,
          offset: 0,
        })
      );

      const result = await candidateService.fetchAll();
      expect(result.candidates).toHaveLength(1);
      expect(result.candidates[0].id).toBe('test-123');
      expect(result.candidates[0].name).toBe('John Doe');
    });

    it('should pass filter parameters as query string', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ candidates: [], total: 0, limit: 10, offset: 0 })
      );

      await candidateService.fetchAll({
        sourceType: 'GITHUB',
        limit: 10,
        offset: 20,
        orderBy: 'alignmentScore',
        order: 'desc',
      });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('sourceType=GITHUB');
      expect(calledUrl).toContain('limit=10');
      expect(calledUrl).toContain('offset=20');
      expect(calledUrl).toContain('orderBy=alignmentScore');
      expect(calledUrl).toContain('order=desc');
    });

    it('should throw on API error', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ error: 'Internal server error' }, 500)
      );

      await expect(candidateService.fetchAll()).rejects.toThrow(
        'Internal server error'
      );
    });

    it('should handle search filter', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ candidates: [mockCandidate], total: 1, limit: 50, offset: 0 })
      );

      await candidateService.fetchAll({ search: 'John' });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('search=John');
    });
  });

  describe('getById', () => {
    it('should fetch a single candidate by ID', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ candidate: mockCandidate })
      );

      const result = await candidateService.getById('test-123');
      expect(result).toEqual(mockCandidate);
      expect(mockFetch).toHaveBeenCalledWith('/api/candidates/test-123');
    });

    it('should return null for 404', async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 404 }));

      const result = await candidateService.getById('non-existent');
      expect(result).toBeNull();
    });

    it('should encode special characters in ID', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ candidate: mockCandidate })
      );

      await candidateService.getById('user/name');
      expect(mockFetch).toHaveBeenCalledWith('/api/candidates/user%2Fname');
    });
  });

  describe('create', () => {
    it('should POST candidate data to the API', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ candidate: mockCandidate })
      );

      const result = await candidateService.create({
        name: 'John Doe',
        sourceType: 'GITHUB',
        currentRole: 'Senior Engineer',
      });

      expect(result).toEqual(mockCandidate);
      expect(mockFetch).toHaveBeenCalledWith('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John Doe',
          sourceType: 'GITHUB',
          currentRole: 'Senior Engineer',
        }),
      });
    });

    it('should throw on API error during create', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ error: 'Validation failed' }, 400)
      );

      await expect(
        candidateService.create({ name: 'Test', sourceType: 'MANUAL' })
      ).rejects.toThrow('Validation failed');
    });

    it('should include all candidate fields in request body', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ candidate: mockCandidate })
      );

      await candidateService.create({
        ...mockCandidate,
        sourceType: 'GITHUB',
      });

      const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(sentBody.name).toBe('John Doe');
      expect(sentBody.alignmentScore).toBe(85);
      expect(sentBody.location).toBe('San Francisco, CA');
    });
  });

  describe('update', () => {
    it('should PATCH candidate data to the API', async () => {
      const updated = { ...mockCandidate, alignmentScore: 95 };
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ candidate: updated })
      );

      const result = await candidateService.update('test-123', {
        alignmentScore: 95,
      });

      expect(result.alignmentScore).toBe(95);
      expect(mockFetch).toHaveBeenCalledWith('/api/candidates/test-123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alignmentScore: 95 }),
      });
    });

    it('should throw on API error during update', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ error: 'Not found' }, 404)
      );

      await expect(
        candidateService.update('bad-id', { alignmentScore: 50 })
      ).rejects.toThrow('Not found');
    });

    it('should send only provided fields', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ candidate: mockCandidate })
      );

      await candidateService.update('test-123', {
        shortlistSummary: 'Updated summary',
      });

      const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(sentBody).toEqual({ shortlistSummary: 'Updated summary' });
    });
  });

  describe('delete', () => {
    it('should DELETE candidate via the API', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ success: true })
      );

      await candidateService.delete('test-123');

      expect(mockFetch).toHaveBeenCalledWith('/api/candidates/test-123', {
        method: 'DELETE',
      });
    });

    it('should throw on API error during delete', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ error: 'Not found' }, 404)
      );

      await expect(candidateService.delete('bad-id')).rejects.toThrow(
        'Not found'
      );
    });

    it('should encode special characters in ID for delete', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ success: true })
      );

      await candidateService.delete('user/name');
      expect(mockFetch).toHaveBeenCalledWith('/api/candidates/user%2Fname', {
        method: 'DELETE',
      });
    });
  });

  describe('updateStage', () => {
    it('should PATCH pipeline stage', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ candidate: { ...mockCandidate, pipelineStage: 'interview' } })
      );

      const result = await candidateService.updateStage('test-123', 'interview');

      expect(mockFetch).toHaveBeenCalledWith('/api/candidates/test-123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipelineStage: 'interview' }),
      });
      expect(result).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should throw descriptive error from API error body', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ error: 'Custom API error message' }, 500)
      );

      await expect(candidateService.fetchAll()).rejects.toThrow(
        'Custom API error message'
      );
    });

    it('should throw generic error when API returns non-JSON error', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Internal Server Error', { status: 500 })
      );

      await expect(candidateService.fetchAll()).rejects.toThrow(
        'Failed to fetch candidates'
      );
    });
  });
});
