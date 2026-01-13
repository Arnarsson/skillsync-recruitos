import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { candidateService } from '../../services/candidateService';
import { Candidate, FunnelStage } from '../../types';

// Mock supabase module
vi.mock('../../services/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}));

// Helper to get mocked supabase client (non-null since we mock it above)
async function getMockedSupabase() {
  const { supabase } = await import('../../services/supabase');
  // We know supabase is not null because we mocked it above
  return supabase!;
}

const CANDIDATES_STORAGE_KEY = 'apex_candidates';

describe('candidateService', () => {
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
      location: { value: 13, max: 15, percentage: 87 }
    },
    shortlistSummary: 'Strong technical background',
    keyEvidence: ['5 years React', 'Led team of 4'],
    risks: ['Remote work preference'],
    unlockedSteps: [FunnelStage.SHORTLIST],
    sourceUrl: 'https://linkedin.com/in/johndoe',
    rawProfileText: 'Senior Engineer with 5 years...'
  };

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear all mocks
    vi.clearAllMocks();
    // Suppress console warnings in tests
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchAll', () => {
    it('should return empty array when localStorage is empty', async () => {
      const supabase = await getMockedSupabase();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      } as unknown as ReturnType<typeof supabase.from>);

      const candidates = await candidateService.fetchAll();
      expect(candidates).toEqual([]);
    });

    it('should load candidates from localStorage when Supabase returns error', async () => {
      // Seed localStorage
      localStorage.setItem(CANDIDATES_STORAGE_KEY, JSON.stringify([mockCandidate]));

      const supabase = await getMockedSupabase();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Network error' }
          }))
        }))
      } as unknown as ReturnType<typeof supabase.from>);

      const candidates = await candidateService.fetchAll();
      expect(candidates).toHaveLength(1);
      expect(candidates[0].id).toBe('test-123');
      expect(candidates[0].name).toBe('John Doe');
    });

    it('should map Supabase data to Candidate objects correctly', async () => {
      const dbRow = {
        id: 'db-456',
        name: 'Jane Smith',
        role_title: 'Product Manager',
        company: 'Startup Inc',
        location: 'New York, NY',
        years_experience: 3,
        avatar_url: 'https://example.com/jane.jpg',
        alignment_score: 92,
        score_breakdown: { skills: { value: 20, max: 25, percentage: 80 } },
        shortlist_summary: 'Excellent PM skills',
        key_evidence: ['Launched 3 products'],
        risks: [],
        deep_analysis: null,
        culture_fit: null,
        company_match: null,
        indicators: null,
        interview_guide: null,
        unlocked_steps: [FunnelStage.SHORTLIST],
        source_url: 'https://linkedin.com/in/janesmith',
        raw_profile_text: 'Product Manager...',
        persona: null,
        score_confidence: 'high',
        score_drivers: ['Strong product sense'],
        score_drags: []
      };

      const supabase = await getMockedSupabase();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [dbRow], error: null }))
        }))
      } as unknown as ReturnType<typeof supabase.from>);

      const candidates = await candidateService.fetchAll();
      expect(candidates).toHaveLength(1);
      expect(candidates[0]).toMatchObject({
        id: 'db-456',
        name: 'Jane Smith',
        currentRole: 'Product Manager',
        company: 'Startup Inc',
        alignmentScore: 92,
        scoreConfidence: 'high'
      });
    });

    it('should cache Supabase results to localStorage', async () => {
      const dbRow = {
        id: 'cache-789',
        name: 'Bob Wilson',
        role_title: 'Designer',
        company: 'Agency Co',
        location: 'Austin, TX',
        years_experience: 4,
        avatar_url: null,
        alignment_score: 78,
        score_breakdown: null,
        shortlist_summary: 'Creative designer',
        key_evidence: [],
        risks: [],
        deep_analysis: null,
        culture_fit: null,
        company_match: null,
        indicators: null,
        interview_guide: null,
        unlocked_steps: [FunnelStage.SHORTLIST],
        source_url: '',
        raw_profile_text: '',
        persona: null,
        score_confidence: null,
        score_drivers: null,
        score_drags: null
      };

      const supabase = await getMockedSupabase();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [dbRow], error: null }))
        }))
      } as unknown as ReturnType<typeof supabase.from>);

      await candidateService.fetchAll();

      const cached = localStorage.getItem(CANDIDATES_STORAGE_KEY);
      expect(cached).toBeTruthy();
      const parsed = JSON.parse(cached!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('cache-789');
    });
  });

  describe('create', () => {
    it('should save candidate to localStorage immediately', async () => {
      await candidateService.create(mockCandidate);

      const stored = localStorage.getItem(CANDIDATES_STORAGE_KEY);
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('test-123');
    });

    it('should deduplicate candidates with same ID in localStorage', async () => {
      // Pre-populate with same candidate
      localStorage.setItem(CANDIDATES_STORAGE_KEY, JSON.stringify([mockCandidate]));

      const updatedCandidate = { ...mockCandidate, alignmentScore: 90 };
      await candidateService.create(updatedCandidate);

      const stored = localStorage.getItem(CANDIDATES_STORAGE_KEY);
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1); // Should not duplicate
      expect(parsed[0].alignmentScore).toBe(90); // Should have updated score
    });

    it('should call Supabase insert with correct field mapping', async () => {
      const supabase = await getMockedSupabase();
      const insertMock = vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: [mockCandidate], error: null }))
      }));
      vi.mocked(supabase.from).mockReturnValue({
        insert: insertMock
      } as unknown as ReturnType<typeof supabase.from>);

      await candidateService.create(mockCandidate);

      expect(insertMock).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'test-123',
          name: 'John Doe',
          role_title: 'Senior Engineer',
          company: 'Tech Corp',
          alignment_score: 85
        })
      ]);
    });

    it('should gracefully handle Supabase errors and still save locally', async () => {
      const supabase = await getMockedSupabase();
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Insert failed' }
          }))
        }))
      } as unknown as ReturnType<typeof supabase.from>);

      const result = await candidateService.create(mockCandidate);

      // Should still return the candidate
      expect(result).toEqual([mockCandidate]);

      // Should still be in localStorage
      const stored = localStorage.getItem(CANDIDATES_STORAGE_KEY);
      expect(stored).toBeTruthy();
    });
  });

  describe('update', () => {
    beforeEach(() => {
      // Seed localStorage with existing candidate
      localStorage.setItem(CANDIDATES_STORAGE_KEY, JSON.stringify([mockCandidate]));
    });

    it('should update candidate in localStorage', async () => {
      const updatedCandidate: Candidate = {
        ...mockCandidate,
        alignmentScore: 95,
        shortlistSummary: 'Outstanding fit'
      };

      await candidateService.update(updatedCandidate);

      const stored = localStorage.getItem(CANDIDATES_STORAGE_KEY);
      const parsed = JSON.parse(stored!);
      expect(parsed[0].alignmentScore).toBe(95);
      expect(parsed[0].shortlistSummary).toBe('Outstanding fit');
    });

    it('should call Supabase update with correct ID filter', async () => {
      const supabase = await getMockedSupabase();
      const eqMock = vi.fn(() => Promise.resolve({ error: null }));
      const updateMock = vi.fn(() => ({ eq: eqMock }));
      vi.mocked(supabase.from).mockReturnValue({
        update: updateMock
      } as unknown as ReturnType<typeof supabase.from>);

      await candidateService.update(mockCandidate);

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          role_title: 'Senior Engineer',
          alignment_score: 85
        })
      );
      expect(eqMock).toHaveBeenCalledWith('id', 'test-123');
    });

    it('should preserve other candidates when updating one', async () => {
      const otherCandidate: Candidate = {
        ...mockCandidate,
        id: 'other-999',
        name: 'Other Person'
      };
      localStorage.setItem(
        CANDIDATES_STORAGE_KEY,
        JSON.stringify([mockCandidate, otherCandidate])
      );

      const updated = { ...mockCandidate, alignmentScore: 100 };
      await candidateService.update(updated);

      const stored = localStorage.getItem(CANDIDATES_STORAGE_KEY);
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(2);
      expect(parsed.find((c: Candidate) => c.id === 'test-123')?.alignmentScore).toBe(100);
      expect(parsed.find((c: Candidate) => c.id === 'other-999')?.name).toBe('Other Person');
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      localStorage.setItem(CANDIDATES_STORAGE_KEY, JSON.stringify([mockCandidate]));
    });

    it('should remove candidate from localStorage', async () => {
      await candidateService.delete('test-123');

      const stored = localStorage.getItem(CANDIDATES_STORAGE_KEY);
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(0);
    });

    it('should call Supabase delete with correct ID', async () => {
      const supabase = await getMockedSupabase();
      const eqMock = vi.fn(() => Promise.resolve({ error: null }));
      const deleteMock = vi.fn(() => ({ eq: eqMock }));
      vi.mocked(supabase.from).mockReturnValue({
        delete: deleteMock
      } as unknown as ReturnType<typeof supabase.from>);

      await candidateService.delete('test-123');

      expect(deleteMock).toHaveBeenCalled();
      expect(eqMock).toHaveBeenCalledWith('id', 'test-123');
    });

    it('should only remove specified candidate, not others', async () => {
      const otherCandidate: Candidate = {
        ...mockCandidate,
        id: 'keep-me',
        name: 'Keep Me'
      };
      localStorage.setItem(
        CANDIDATES_STORAGE_KEY,
        JSON.stringify([mockCandidate, otherCandidate])
      );

      await candidateService.delete('test-123');

      const stored = localStorage.getItem(CANDIDATES_STORAGE_KEY);
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('keep-me');
    });

    it('should handle delete when candidate does not exist', async () => {
      await candidateService.delete('non-existent-id');

      // Should not throw error
      const stored = localStorage.getItem(CANDIDATES_STORAGE_KEY);
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1); // Original still there
    });
  });

  describe('error handling', () => {
    it('should handle localStorage quota exceeded error', async () => {
      // Mock localStorage.setItem to throw quota error
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      setItemSpy.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      // Should not throw
      await expect(candidateService.create(mockCandidate)).resolves.toBeDefined();

      setItemSpy.mockRestore();
    });

    it('should handle malformed JSON in localStorage', async () => {
      localStorage.setItem(CANDIDATES_STORAGE_KEY, 'invalid json {{{');

      const supabase = await getMockedSupabase();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      } as unknown as ReturnType<typeof supabase.from>);

      const candidates = await candidateService.fetchAll();
      // Should return empty array instead of throwing
      expect(candidates).toEqual([]);
    });
  });
});
