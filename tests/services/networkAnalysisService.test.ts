import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0
};
Object.defineProperty(global, 'localStorage', { value: mockLocalStorage });

import {
  buildNetworkGraph,
  quickNetworkScan
} from '../../services/networkAnalysisService';

beforeEach(() => {
  vi.clearAllMocks();
  mockLocalStorage.getItem.mockReturnValue(null);
});

describe('networkAnalysisService', () => {
  describe('buildNetworkGraph', () => {
    it('should return null when BrightData API key is missing', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = await buildNetworkGraph(
        'candidate-1',
        'https://linkedin.com/in/johndoe'
      );

      expect(result).toBeNull();
    });

    it('should build network graph when API key is available', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-brightdata-key');

      // Mock BrightData trigger
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ snapshot_id: 'snap-123' })
      });

      // Mock progress check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ready', records: 1 })
      });

      // Mock snapshot data
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: 'John Doe',
          headline: 'Senior Software Engineer at Google',
          location: 'San Francisco Bay Area',
          experiences: [
            {
              title: 'Senior Software Engineer',
              company: 'Google',
              startDate: '2020-01',
              endDate: null
            },
            {
              title: 'Software Engineer',
              company: 'Facebook',
              startDate: '2018-01',
              endDate: '2020-01'
            }
          ],
          education: [
            {
              school: 'Stanford University',
              degree: 'Computer Science',
              startYear: 2014,
              endYear: 2018
            }
          ]
        })
      });

      const result = await buildNetworkGraph(
        'candidate-1',
        'https://linkedin.com/in/johndoe'
      );

      expect(result).toBeDefined();
      expect(result?.candidateNodeId).toBe('candidate-1');
      expect(result?.nodes).toBeDefined();
      expect(result?.edges).toBeDefined();
    });

    it('should identify shared employers with team members', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-brightdata-key');

      // Mock candidate profile
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ snapshot_id: 'snap-candidate' })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ready', records: 1 })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: 'Candidate',
          experiences: [
            { title: 'Engineer', company: 'Google', startDate: '2019-01' }
          ]
        })
      });

      // Mock team member profile
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ snapshot_id: 'snap-team' })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ready', records: 1 })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: 'Team Member',
          experiences: [
            { title: 'Senior Engineer', company: 'Google', startDate: '2018-01' }
          ]
        })
      });

      const result = await buildNetworkGraph(
        'candidate-1',
        'https://linkedin.com/in/candidate',
        ['https://linkedin.com/in/teammember']
      );

      expect(result).toBeDefined();
      expect(result?.sharedEmployers).toBeDefined();
    });

    it('should handle API errors gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-brightdata-key');

      mockFetch.mockRejectedValue(new Error('API Error'));

      const result = await buildNetworkGraph(
        'candidate-1',
        'https://linkedin.com/in/johndoe'
      );

      expect(result).toBeNull();
    });
  });

  describe('quickNetworkScan', () => {
    it('should return minimal network data quickly', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-brightdata-key');

      // Mock quick LinkedIn fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ snapshot_id: 'snap-quick' })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ready', records: 1 })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: 'Quick User',
          headline: 'Developer',
          experiences: []
        })
      });

      const result = await quickNetworkScan(
        'candidate-1',
        'https://linkedin.com/in/quickuser'
      );

      expect(result).toBeDefined();
      expect(result?.candidateNodeId).toBe('candidate-1');
    });

    it('should not compare with team profiles in quick mode', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-brightdata-key');

      // Should only make one fetch for candidate profile
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ snapshot_id: 'snap-quick' })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ready', records: 1 })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: 'Quick User',
          experiences: []
        })
      });

      await quickNetworkScan(
        'candidate-1',
        'https://linkedin.com/in/quickuser'
      );

      // Should only have 3 fetch calls for candidate profile, not additional for team
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });
});
