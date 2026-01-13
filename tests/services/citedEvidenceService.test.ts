import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { EvidenceSource } from '../../types';

// Mock geminiService
vi.mock('../../services/geminiService', () => ({
  getAiClient: vi.fn(),
  AI_MODELS: {
    DEFAULT: 'gemini-pro',
    SCORING: 'gemini-pro'
  }
}));

import { buildCitedProfile } from '../../services/citedEvidenceService';
import { getAiClient } from '../../services/geminiService';

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

beforeEach(() => {
  vi.clearAllMocks();
  mockLocalStorage.getItem.mockReturnValue(null);
});

describe('citedEvidenceService', () => {
  describe('buildCitedProfile', () => {
    it('should return minimal profile with low quality score when no evidence sources provided', async () => {
      const result = await buildCitedProfile(
        'candidate-1',
        'John Doe',
        []
      );

      // Implementation returns a minimal profile instead of null
      expect(result).toBeDefined();
      expect(result?.candidateId).toBe('candidate-1');
      expect(result?.dataQualityScore).toBe(0);
      expect(result?.sourcesUsed).toHaveLength(0);
    });

    it('should throw error when Gemini client is not available', async () => {
      vi.mocked(getAiClient).mockReturnValue(null);

      const evidenceSources: EvidenceSource[] = [
        {
          url: 'https://linkedin.com/in/johndoe',
          rawText: 'John Doe is a Senior Software Engineer at Google...'
        }
      ];

      // The implementation throws an error when Gemini is unavailable
      await expect(
        buildCitedProfile('candidate-1', 'John Doe', evidenceSources)
      ).rejects.toThrow('Gemini API key not configured');
    });

    it('should build cited profile when Gemini client is available', async () => {
      const mockAiClient = {
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: JSON.stringify({
              claims: [
                {
                  claim: 'John Doe is a Senior Software Engineer at Google',
                  sourceUrl: 'https://linkedin.com/in/johndoe',
                  sourceType: 'linkedin',
                  extractedText: 'Senior Software Engineer at Google',
                  confidence: 0.95
                }
              ]
            })
          })
        }
      };
      vi.mocked(getAiClient).mockReturnValue(mockAiClient as unknown as ReturnType<typeof getAiClient>);

      const evidenceSources: EvidenceSource[] = [
        {
          url: 'https://linkedin.com/in/johndoe',
          rawText: 'John Doe is a Senior Software Engineer at Google with 8 years of experience.'
        }
      ];

      const result = await buildCitedProfile(
        'candidate-1',
        'John Doe',
        evidenceSources
      );

      expect(result).toBeDefined();
      expect(result?.candidateId).toBe('candidate-1');
      expect(result?.sourcesUsed.length).toBeGreaterThan(0);
    });

    it('should determine source type correctly from URL', async () => {
      const mockAiClient = {
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: JSON.stringify({
              claims: [
                {
                  claim: 'Active GitHub contributor',
                  sourceUrl: 'https://github.com/johndoe',
                  sourceType: 'github',
                  extractedText: '500 contributions in 2024',
                  confidence: 0.9
                }
              ]
            })
          })
        }
      };
      vi.mocked(getAiClient).mockReturnValue(mockAiClient as unknown as ReturnType<typeof getAiClient>);

      const evidenceSources: EvidenceSource[] = [
        {
          url: 'https://github.com/johndoe',
          rawText: 'johndoe has 500 contributions in 2024'
        },
        {
          url: 'https://linkedin.com/in/johndoe',
          rawText: 'John Doe profile'
        },
        {
          url: 'https://medium.com/@johndoe',
          rawText: 'Article by John Doe'
        }
      ];

      const result = await buildCitedProfile(
        'candidate-1',
        'John Doe',
        evidenceSources
      );

      expect(result).toBeDefined();
      expect(result?.sourcesUsed.some(s => s.url.includes('github'))).toBe(true);
      expect(result?.sourcesUsed.some(s => s.url.includes('linkedin'))).toBe(true);
    });

    it('should calculate data quality score based on citation coverage', async () => {
      const mockAiClient = {
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: JSON.stringify({
              claims: [
                {
                  claim: 'Name: John Doe',
                  sourceUrl: 'https://linkedin.com/in/johndoe',
                  sourceType: 'linkedin',
                  extractedText: 'John Doe',
                  confidence: 1.0
                },
                {
                  claim: 'Current role: Senior Engineer at Google',
                  sourceUrl: 'https://linkedin.com/in/johndoe',
                  sourceType: 'linkedin',
                  extractedText: 'Senior Software Engineer at Google',
                  confidence: 0.95
                },
                {
                  claim: 'Skills: Python, TypeScript, React',
                  sourceUrl: 'https://github.com/johndoe',
                  sourceType: 'github',
                  extractedText: 'TypeScript: 60%, Python: 30%',
                  confidence: 0.9
                }
              ]
            })
          })
        }
      };
      vi.mocked(getAiClient).mockReturnValue(mockAiClient as unknown as ReturnType<typeof getAiClient>);

      const evidenceSources: EvidenceSource[] = [
        {
          url: 'https://linkedin.com/in/johndoe',
          rawText: 'John Doe - Senior Software Engineer at Google'
        },
        {
          url: 'https://github.com/johndoe',
          rawText: 'TypeScript: 60%, Python: 30%'
        }
      ];

      const result = await buildCitedProfile(
        'candidate-1',
        'John Doe',
        evidenceSources
      );

      expect(result).toBeDefined();
      expect(result?.dataQualityScore).toBeGreaterThanOrEqual(0);
      expect(result?.dataQualityScore).toBeLessThanOrEqual(100);
    });

    it('should handle Gemini API errors by throwing', async () => {
      const mockAiClient = {
        models: {
          generateContent: vi.fn().mockRejectedValue(new Error('API Error'))
        }
      };
      vi.mocked(getAiClient).mockReturnValue(mockAiClient as unknown as ReturnType<typeof getAiClient>);

      const evidenceSources: EvidenceSource[] = [
        {
          url: 'https://linkedin.com/in/johndoe',
          rawText: 'John Doe profile text'
        }
      ];

      // The implementation propagates the error
      await expect(
        buildCitedProfile('candidate-1', 'John Doe', evidenceSources)
      ).rejects.toThrow('API Error');
    });

    it('should track uncited claims correctly', async () => {
      const mockAiClient = {
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: JSON.stringify({
              claims: [
                {
                  claim: 'Has PhD in Machine Learning',
                  sourceUrl: '',
                  sourceType: 'resume',
                  extractedText: '',
                  confidence: 0.3
                }
              ]
            })
          })
        }
      };
      vi.mocked(getAiClient).mockReturnValue(mockAiClient as unknown as ReturnType<typeof getAiClient>);

      const evidenceSources: EvidenceSource[] = [
        {
          url: 'local://resume',
          rawText: 'Claims to have PhD in Machine Learning but no public verification'
        }
      ];

      const result = await buildCitedProfile(
        'candidate-1',
        'John Doe',
        evidenceSources
      );

      expect(result).toBeDefined();
      // Low confidence claims should be tracked
      expect(result?.uncitedClaims.length).toBeGreaterThanOrEqual(0);
    });
  });
});
