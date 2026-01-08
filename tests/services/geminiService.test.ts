import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeCandidateProfile, generatePersona } from '../../services/geminiService';

// Mock localStorage
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('geminiService', () => {
  describe('analyzeCandidateProfile', () => {
    it('should throw error when API key is missing', async () => {
      localStorage.getItem = vi.fn().mockReturnValue(null);

      await expect(
        analyzeCandidateProfile('test resume', 'test job')
      ).rejects.toThrow('API Key missing');
    });

    // Add more tests when you have API mocking set up
    it.skip('should parse candidate data from resume text', async () => {
      // TODO: Add API mocking
    });
  });

  describe('generatePersona', () => {
    it('should throw error when API key is missing', async () => {
      localStorage.getItem = vi.fn().mockReturnValue(null);

      await expect(
        generatePersona('test profile')
      ).rejects.toThrow('API Key missing');
    });

    // Add more tests when you have API mocking set up
    it.skip('should generate persona from profile text', async () => {
      // TODO: Add API mocking
    });
  });
});
