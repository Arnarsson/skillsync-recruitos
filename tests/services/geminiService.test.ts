import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAiClient, callOpenRouter } from '../../services/geminiService';

// Mock fetch for OpenRouter API tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

const originalEnv = process.env;

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.GEMINI_API_KEY;
    delete process.env.API_KEY;
    delete process.env.OPENROUTER_API_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('getAiClient', () => {
    it('should return null when no API key is configured', () => {
      const client = getAiClient();
      expect(client).toBeNull();
    });

    it('should initialize client with API key from process.env.GEMINI_API_KEY', () => {
      process.env.GEMINI_API_KEY = 'test-api-key-123';
      const client = getAiClient();
      expect(client).toBeTruthy();
    });

    it('should fall back to API_KEY env var', () => {
      process.env.API_KEY = 'fallback-key';
      const client = getAiClient();
      expect(client).toBeTruthy();
    });

    it('should handle empty string API key', () => {
      process.env.GEMINI_API_KEY = '';
      const client = getAiClient();
      expect(client).toBeNull();
    });
  });

  describe('callOpenRouter', () => {
    const mockApiKey = 'test-openrouter-key';

    beforeEach(() => {
      process.env.OPENROUTER_API_KEY = mockApiKey;
    });

    it('should throw error when OpenRouter API key is missing', async () => {
      delete process.env.OPENROUTER_API_KEY;

      await expect(
        callOpenRouter('test prompt')
      ).rejects.toThrow('OpenRouter API key not configured');
    });

    it('should make successful API call with correct headers', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'AI response' } }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await callOpenRouter('test prompt');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toBe('AI response');
    });

    it('should use primary model by default', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: 'response' } }],
        }),
      });

      await callOpenRouter('test prompt');

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body as string);
      expect(body.model).toBe('google/gemini-3-flash-preview');
    });

    it('should include JSON schema when provided', async () => {
      const testSchema = {
        type: 'object',
        properties: {
          score: { type: 'number' },
          reason: { type: 'string' },
        },
        required: ['score', 'reason'],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: '{"score": 85, "reason": "Good fit"}' } }],
        }),
      });

      await callOpenRouter('test prompt', { schema: testSchema });

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body as string);
      expect(body.response_format).toEqual({
        type: 'json_schema',
        json_schema: {
          name: 'response',
          strict: true,
          schema: testSchema,
        },
      });
    });

    it('should handle rate limiting with exponential backoff', async () => {
      // First two calls return 429, third succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            choices: [{ message: { content: 'success after retries' } }],
          }),
        });

      const result = await callOpenRouter('test prompt', undefined, 3);

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result).toBe('success after retries');
    });

    it('should respect custom max_tokens option', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: 'response' } }],
        }),
      });

      await callOpenRouter('test prompt', { max_tokens: 8000 });

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body as string);
      expect(body.max_tokens).toBe(8000);
    });

    it('should use default max_tokens when not specified', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: 'response' } }],
        }),
      });

      await callOpenRouter('test prompt');

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body as string);
      expect(body.max_tokens).toBe(4000);
    });

    it('should handle API error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: { message: 'Internal server error' },
        }),
      });

      await expect(callOpenRouter('test prompt', undefined, 1)).rejects.toThrow();
    });

    it('should set low temperature for stable extraction', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: 'response' } }],
        }),
      });

      await callOpenRouter('test prompt');

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body as string);
      expect(body.temperature).toBe(0.1);
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(callOpenRouter('test prompt', undefined, 1)).rejects.toThrow('Network error');
    });

    it('should include proper referer header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: 'response' } }],
        }),
      });

      await callOpenRouter('test prompt');

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers['HTTP-Referer']).toBeTruthy();
      expect(callArgs.headers['X-Title']).toBe('6Degrees Recruitment OS');
    });

    it('should construct correct message format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: 'response' } }],
        }),
      });

      const testPrompt = 'Analyze this candidate profile';
      await callOpenRouter(testPrompt);

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body as string);
      expect(body.messages).toEqual([
        { role: 'user', content: testPrompt },
      ]);
    });

    it('should handle empty response content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: '' } }],
        }),
      });

      const result = await callOpenRouter('test prompt');
      expect(result).toBe('');
    });
  });

  describe('AI scoring logic', () => {
    it('should handle malformed JSON responses gracefully', async () => {
      process.env.OPENROUTER_API_KEY = 'test-key';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: 'not valid json {{{' } }],
        }),
      });

      const result = await callOpenRouter('test prompt');
      // Should return the raw string, not throw
      expect(result).toBe('not valid json {{{');
    });

    it('should respect retry limit', async () => {
      process.env.OPENROUTER_API_KEY = 'test-key';

      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
      });

      await expect(callOpenRouter('test prompt', undefined, 2)).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
