import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { scrapeUrlContent } from '../../services/scrapingService';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('scrapingService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset process.env for API key tests
    process.env = { ...originalEnv };
    delete process.env.FIRECRAWL_API_KEY;
    delete process.env.BRIGHTDATA_API_KEY;
    // Clear all mocks
    vi.resetAllMocks();
    // Suppress console output in tests
    // vi.spyOn(console, 'warn').mockImplementation(() => { });
    // vi.spyOn(console, 'error').mockImplementation(() => { });
    // vi.spyOn(console, 'log').mockImplementation(() => { });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });


  // Helper to mock failures for Tiers 1-3 so we test Tier 4 (Dataset API)
  const setupTierFailures = () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 }); // Tier 1
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 }); // Tier 2
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 }); // Tier 3
  };

  describe('scrapeUrlContent - Firecrawl integration (non-LinkedIn URLs)', () => {
    const testJobUrl = 'https://example.com/jobs/senior-engineer';
    const testMarkdown = '# Senior Engineer\n\nWe are looking for a talented engineer...';

    it('should successfully scrape job description with Firecrawl', async () => {
      const firecrawlKey = 'test-firecrawl-key-123';
      process.env.FIRECRAWL_API_KEY = firecrawlKey;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            markdown: testMarkdown,
            metadata: { title: 'Senior Engineer' }
          }
        })
      });

      const result = await scrapeUrlContent(testJobUrl);

      expect(result).toBe(testMarkdown);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.firecrawl.dev/v1/scrape',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining(testJobUrl)
        })
      );
    });

    it('should use FIRECRAWL_API_KEY from process.env', async () => {
      const localStorageKey = 'local-storage-key';
      process.env.FIRECRAWL_API_KEY = localStorageKey;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { markdown: testMarkdown }
        })
      });

      await scrapeUrlContent(testJobUrl);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${localStorageKey}`
          })
        })
      );
    });

    it('should throw error if Firecrawl API key is missing', async () => {
      // No API key in localStorage or env
      await expect(scrapeUrlContent(testJobUrl)).rejects.toThrow(
        'Firecrawl API Key is missing'
      );
    });

    it('should handle Firecrawl API errors gracefully', async () => {
      process.env.FIRECRAWL_API_KEY = 'test-key';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => JSON.stringify({ error: 'Internal server error' })
      });

      await expect(scrapeUrlContent(testJobUrl)).rejects.toThrow();
    });

    it('should handle Firecrawl unsupported site errors', async () => {
      process.env.FIRECRAWL_API_KEY = 'test-key';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({
          error: 'This site is not currently supported by Firecrawl'
        })
      });

      await expect(scrapeUrlContent(testJobUrl)).rejects.toThrow(
        'not supported'
      );
    });

    it('should throw error if Firecrawl returns success:false', async () => {
      process.env.FIRECRAWL_API_KEY = 'test-key';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: false,
          error: 'Failed to retrieve content'
        })
      });

      await expect(scrapeUrlContent(testJobUrl)).rejects.toThrow(
        'Failed to retrieve content'
      );
    });

    it('should throw error if Firecrawl returns no markdown data', async () => {
      process.env.FIRECRAWL_API_KEY = 'test-key';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { markdown: null }
        })
      });

      await expect(scrapeUrlContent(testJobUrl)).rejects.toThrow();
    });

    it('should throw error for blocked social media domains', async () => {
      process.env.FIRECRAWL_API_KEY = 'test-key';

      await expect(
        scrapeUrlContent('https://facebook.com/profile')
      ).rejects.toThrow('not supported');

      await expect(
        scrapeUrlContent('https://twitter.com/user')
      ).rejects.toThrow('not supported');

      await expect(
        scrapeUrlContent('https://instagram.com/user')
      ).rejects.toThrow('not supported');
    });
  });

  describe('scrapeUrlContent - BrightData integration (LinkedIn URLs)', () => {


    const linkedInUrl = 'https://www.linkedin.com/in/johndoe';
    const mockProfile = {
      name: 'John Doe',
      position: 'Senior Engineer',
      company: 'Tech Corp',
      location: 'San Francisco, CA',
      about: 'Experienced software engineer...',
      experience: [
        {
          title: 'Senior Engineer',
          company: 'Tech Corp',
          start_date: '2020',
          end_date: 'Present',
          description: 'Leading backend development'
        }
      ],
      skills: ['JavaScript', 'React', 'Node.js'],
      education: [
        {
          school: 'MIT',
          degree: 'BS Computer Science',
          start_year: '2015',
          end_year: '2019'
        }
      ]
    };

    it('should successfully scrape LinkedIn profile with BrightData', { timeout: 20000 }, async () => {
      const brightDataKey = 'test-brightdata-key-123';
      process.env.BRIGHTDATA_API_KEY = brightDataKey;

      setupTierFailures();

      // Mock trigger response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ snapshot_id: 'snapshot-123' })
      });

      // Mock progress response (ready)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 'ready', records: 1 })
      });

      // Mock snapshot response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [mockProfile]
      });

      const result = await scrapeUrlContent(linkedInUrl);

      expect(result).toContain('John Doe');
      expect(result).toContain('Senior Engineer');
      expect(result).toContain('Tech Corp');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('action=trigger'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-BrightData-Key': brightDataKey
          })
        })
      );
    });

    it('should throw error if BrightData API key is missing for LinkedIn', async () => {
      await expect(scrapeUrlContent(linkedInUrl)).rejects.toThrow(
        'BrightData API Key is missing'
      );
    });

    it.skip('should poll for progress and retrieve snapshot', { timeout: 20000 }, async () => {
      process.env.BRIGHTDATA_API_KEY = 'test-key';

      setupTierFailures();

      // Mock trigger
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ snapshot_id: 'snapshot-456' })
      });

      // Mock progress - pending
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'pending' })
      });

      // Mock progress - ready
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ready', records: 1 })
      });

      // Mock snapshot
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockProfile]
      });

      const result = await scrapeUrlContent(linkedInUrl);

      expect(result).toContain('John Doe');
      expect(mockFetch).toHaveBeenCalledTimes(4); // trigger + progress x2 + snapshot
    });

    it('should handle BrightData trigger errors with graceful degradation', async () => {
      process.env.BRIGHTDATA_API_KEY = 'test-key';

      setupTierFailures();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' })
      });

      const result = await scrapeUrlContent(linkedInUrl);

      // Should return MANUAL_INPUT_REQUIRED markdown instead of throwing
      expect(result).toContain('MANUAL_INPUT_REQUIRED');
      expect(result).toContain('No public data found');
    });

    it('should handle missing snapshot_id in trigger response with graceful degradation', async () => {
      process.env.BRIGHTDATA_API_KEY = 'test-key';

      setupTierFailures();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ snapshot_id: null })
      });

      const result = await scrapeUrlContent(linkedInUrl);

      // Should return MANUAL_INPUT_REQUIRED markdown instead of throwing
      expect(result).toContain('MANUAL_INPUT_REQUIRED');
      expect(result).toContain('No public data found');
    });

    it('should handle BrightData scrape failed status with graceful degradation', async () => {
      process.env.BRIGHTDATA_API_KEY = 'test-key';

      setupTierFailures();

      // Mock trigger
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ snapshot_id: 'snapshot-789' })
      });

      // Mock progress - failed
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'failed' })
      });

      const result = await scrapeUrlContent(linkedInUrl);

      // Should return MANUAL_INPUT_REQUIRED markdown instead of throwing
      expect(result).toContain('MANUAL_INPUT_REQUIRED');
      expect(result).toContain('No public data found');
    });

    it.skip('should handle BrightData no records found with graceful degradation', async () => {
      process.env.BRIGHTDATA_API_KEY = 'test-key';

      setupTierFailures();

      // Mock trigger
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ snapshot_id: 'snapshot-000' })
      });

      // Mock progress - ready but no records
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ready', records: 0 })
      });

      const result = await scrapeUrlContent(linkedInUrl);

      // Should return MANUAL_INPUT_REQUIRED markdown instead of throwing
      expect(result).toContain('MANUAL_INPUT_REQUIRED');
      expect(result).toContain('No public data found');
    });

    it('should timeout after max polling attempts and gracefully degrade', async () => {
      process.env.BRIGHTDATA_API_KEY = 'test-key';

      setupTierFailures();

      // Mock trigger
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ snapshot_id: 'snapshot-pending' })
      });

      // Mock progress - always pending (will timeout)
      mockFetch.mockImplementation(async () => ({
        ok: true,
        json: async () => ({ status: 'pending' })
      }));

      const result = await scrapeUrlContent(linkedInUrl);

      // Should return MANUAL_INPUT_REQUIRED markdown instead of throwing
      expect(result).toContain('MANUAL_INPUT_REQUIRED');
      expect(result).toContain('No public data found');
    }, 35000); // Increase test timeout for polling

    it('should handle progress API errors gracefully and degrade', async () => {
      process.env.BRIGHTDATA_API_KEY = 'test-key';

      setupTierFailures();

      // Mock trigger
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ snapshot_id: 'snapshot-err' })
      });

      // Mock progress - error (will be retried, then timeout)
      mockFetch.mockImplementation(async () => ({
        ok: false,
        status: 500
      }));

      const result = await scrapeUrlContent(linkedInUrl);

      // Should return MANUAL_INPUT_REQUIRED markdown after retries fail
      expect(result).toContain('MANUAL_INPUT_REQUIRED');
      expect(result).toContain('No public data found');
    }, 35000); // Increase timeout for polling retries

    it('should handle empty profile data from BrightData with graceful degradation', async () => {
      process.env.BRIGHTDATA_API_KEY = 'test-key';

      setupTierFailures();

      // Mock trigger
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ snapshot_id: 'snapshot-empty' })
      });

      // Mock progress
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ready', records: 1 })
      });

      // Mock snapshot - empty profile
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{}]
      });

      const result = await scrapeUrlContent(linkedInUrl);

      // Should return MANUAL_INPUT_REQUIRED markdown for empty profile
      expect(result).toContain('MANUAL_INPUT_REQUIRED');
      expect(result).toContain('No public data found');
    });

    it.skip('should convert BrightData profile to markdown format', { timeout: 20000 }, async () => {
      process.env.BRIGHTDATA_API_KEY = 'test-key';

      setupTierFailures();

      // Mock complete flow
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ snapshot_id: 'snapshot-md' })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ready', records: 1 })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockProfile]
      });

      const result = await scrapeUrlContent(linkedInUrl);

      // Check markdown structure
      expect(result).toContain('# John Doe');
      expect(result).toContain('**Senior Engineer**');
      expect(result).toContain('## About');
      expect(result).toContain('## Experience');
      expect(result).toContain('## Skills');
      expect(result).toContain('## Education');
    });

    it.skip('should handle profiles with minimal data and require manual input', { timeout: 20000 }, async () => {
      process.env.BRIGHTDATA_API_KEY = 'test-key';

      const minimalProfile = {
        name: 'Jane Smith',
        position: 'Developer'
      };

      setupTierFailures();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ snapshot_id: 'snapshot-min' })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ready', records: 1 })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [minimalProfile]
      });

      const result = await scrapeUrlContent(linkedInUrl);

      // Minimal data (no experience/skills) triggers MANUAL_INPUT_REQUIRED
      expect(result).toContain('Jane Smith');
      expect(result).toContain('MANUAL_INPUT_REQUIRED');
    });

    it('should handle network errors during BrightData scraping with graceful degradation', async () => {
      process.env.BRIGHTDATA_API_KEY = 'test-key';

      setupTierFailures();

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await scrapeUrlContent(linkedInUrl);

      // Network error is caught and returns MANUAL_INPUT_REQUIRED
      expect(result).toContain('MANUAL_INPUT_REQUIRED');
      expect(result).toContain('No public data found');
    });

    it('should handle malformed JSON responses with graceful degradation', async () => {
      process.env.BRIGHTDATA_API_KEY = 'test-key';

      setupTierFailures();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      const result = await scrapeUrlContent(linkedInUrl);

      // Malformed JSON is caught and returns MANUAL_INPUT_REQUIRED
      expect(result).toContain('MANUAL_INPUT_REQUIRED');
      expect(result).toContain('No public data found');
    });
  });

  describe('URL routing logic', () => {
    it('should route LinkedIn URLs to BrightData', { timeout: 20000 }, async () => {
      process.env.BRIGHTDATA_API_KEY = 'test-key';

      setupTierFailures();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ snapshot_id: 'test' })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ready', records: 1 })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          name: 'Test',
          position: 'Engineer',
          about: 'Test about',
          experience: [{ title: 'Engineer', company: 'Co' }]
        }]
      });

      await scrapeUrlContent('https://linkedin.com/in/test');

      // Should call BrightData API (action=trigger)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('brightdata'),
        expect.any(Object)
      );
    });

    it('should route non-LinkedIn URLs to Firecrawl', async () => {
      process.env.FIRECRAWL_API_KEY = 'test-key';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { markdown: 'Test content' }
        })
      });

      await scrapeUrlContent('https://example.com/job');

      // Should call Firecrawl API
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.firecrawl.dev/v1/scrape',
        expect.any(Object)
      );
    });

    it('should recognize various LinkedIn URL formats', async () => {
      process.env.BRIGHTDATA_API_KEY = 'test-key';

      const linkedInUrls = [
        'https://www.linkedin.com/in/johndoe',
        'https://linkedin.com/in/janedoe/',
        'https://www.linkedin.com/in/test-user-123'
      ];

      for (const url of linkedInUrls) {
        mockFetch.mockClear();

        setupTierFailures();

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ snapshot_id: 'test' })
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'ready', records: 1 })
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => [{
            name: 'Test',
            position: 'Engineer',
            about: 'Test',
            experience: [{ title: 'Eng', company: 'Co' }]
          }]
        });

        await scrapeUrlContent(url);

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('brightdata'),
          expect.any(Object)
        );
      }
    }, 20000); // Increase timeout for multiple URLs
  });

  describe('error handling edge cases', () => {
    it('should handle unknown error types properly', async () => {
      process.env.FIRECRAWL_API_KEY = 'test-key';

      mockFetch.mockRejectedValueOnce('String error');

      await expect(scrapeUrlContent('https://example.com')).rejects.toBeDefined();
    });

    it('should handle fetch response without json method', async () => {
      process.env.FIRECRAWL_API_KEY = 'test-key';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Plain text error'
      });

      await expect(scrapeUrlContent('https://example.com')).rejects.toThrow();
    });

    it.skip('should handle profiles with sufficient data successfully', { timeout: 20000 }, async () => {
      process.env.BRIGHTDATA_API_KEY = 'test-key';

      setupTierFailures();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ snapshot_id: 'test' })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ready', records: 1 })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          name: 'Test',
          position: 'Engineer',
          about: 'Test about',
          experience: [{ title: 'Eng', company: 'Co' }]
        }]
      });

      const result = await scrapeUrlContent('https://linkedin.com/in/test');

      // Should successfully convert to markdown
      expect(result).toContain('# Test');
      expect(result).toContain('Engineer');
    });
  });
});
