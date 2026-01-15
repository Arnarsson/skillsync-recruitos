
import { getSupabase } from './supabase';
import { Candidate, FunnelStage } from '../types';

// LocalStorage key for candidates when Supabase is unavailable
const CANDIDATES_STORAGE_KEY = 'apex_candidates';

// Helper functions for localStorage persistence
const loadFromLocalStorage = (): Candidate[] => {
  try {
    const stored = localStorage.getItem(CANDIDATES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err: unknown) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to load candidates from localStorage:', err);
    }
    return [];
  }
};

const saveToLocalStorage = (candidates: Candidate[]): void => {
  try {
    localStorage.setItem(CANDIDATES_STORAGE_KEY, JSON.stringify(candidates));
  } catch (err: unknown) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to save candidates to localStorage:', err);
    }
  }
};

export const candidateService = {
  async fetchAll(): Promise<Candidate[]> {
    const supabase = getSupabase();
    if (!supabase) {
      console.warn('Supabase not connected. Using localStorage persistence.');
      return loadFromLocalStorage();
    }

    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase Fetch Error:', error);
        return loadFromLocalStorage();
      }

      // Map DB rows to Candidate objects using actual schema
      const candidates = data.map((row: {
        id: string;
        name: string | null;
        role_title: string | null;
        company: string | null;
        location: string | null;
        years_experience: number | null;
        avatar_url: string | null;
        alignment_score: number | null;
        score_breakdown: unknown;
        shortlist_summary: string | null;
        key_evidence: string[] | null;
        risks: string[] | null;
        deep_analysis: string | null;
        culture_fit: string | null;
        company_match: unknown;
        indicators: unknown;
        interview_guide: unknown;
        unlocked_steps: FunnelStage[] | null;
        source_url: string | null;
        raw_profile_text: string | null;
        persona: unknown;
        score_confidence: string | null;
        score_drivers: string[] | null;
        score_drags: string[] | null;
      }) => ({
        id: row.id,
        name: row.name || 'Unknown',
        currentRole: row.role_title || 'Unknown',
        company: row.company || 'Unknown',
        location: row.location || 'Unknown',
        yearsExperience: row.years_experience || 0,
        avatar: row.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name || 'C')}&background=random`,
        alignmentScore: row.alignment_score || 0,
        scoreBreakdown: row.score_breakdown || undefined,
        shortlistSummary: row.shortlist_summary || '',
        keyEvidence: row.key_evidence || [],
        risks: row.risks || [],
        deepAnalysis: row.deep_analysis || undefined,
        cultureFit: row.culture_fit || undefined,
        companyMatch: row.company_match || undefined,
        indicators: row.indicators || undefined,
        interviewGuide: row.interview_guide || undefined,
        unlockedSteps: row.unlocked_steps || [],
        sourceUrl: row.source_url || '',
        rawProfileText: row.raw_profile_text || '',
        persona: row.persona || undefined,
        scoreConfidence: (row.score_confidence as 'high' | 'moderate' | 'low') || undefined,
        scoreDrivers: row.score_drivers || undefined,
        scoreDrags: row.score_drags || undefined
      } as Candidate));

      saveToLocalStorage(candidates);
      return candidates;
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Supabase connection error:', err);
      }
      return loadFromLocalStorage();
    }
  },

  async create(candidate: Candidate) {
    // Always add to local cache first
    const cachedCandidates = loadFromLocalStorage();
    const updatedCandidates = [candidate, ...cachedCandidates.filter(c => c.id !== candidate.id)];
    saveToLocalStorage(updatedCandidates);

    const supabase = getSupabase();
    if (!supabase) {
      console.warn("Database not configured. Candidate saved locally only.");
      return [candidate];
    }

    try {
      const { data, error } = await supabase
        .from('candidates')
        .insert([{
          id: candidate.id,
          name: candidate.name,
          role_title: candidate.currentRole,
          company: candidate.company,
          location: candidate.location,
          years_experience: candidate.yearsExperience || 0,
          avatar_url: candidate.avatar,
          source_type: 'sourcing',
          source_url: candidate.sourceUrl || '',
          alignment_score: candidate.alignmentScore,
          score_breakdown: candidate.scoreBreakdown || null,
          shortlist_summary: candidate.shortlistSummary,
          key_evidence: candidate.keyEvidence || [],
          risks: candidate.risks || [],
          unlocked_steps: candidate.unlockedSteps || [FunnelStage.SHORTLIST],
          // Enhanced scoring fields
          score_confidence: candidate.scoreConfidence || null,
          score_drivers: candidate.scoreDrivers || null,
          score_drags: candidate.scoreDrags || null,
          // Persona and company match
          persona: candidate.persona || null,
          company_match: candidate.companyMatch || null,
          raw_profile_text: candidate.rawProfileText || null
        }])
        .select();

      if (error) {
        console.error('Supabase Create Error:', error);
        return [candidate];
      }
      return data;
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Supabase connection error:', err);
      }
      return [candidate];
    }
  },

  async update(candidate: Candidate) {
    // Update local cache first
    const cachedCandidates = loadFromLocalStorage();
    const updatedCandidates = cachedCandidates.map(c => c.id === candidate.id ? candidate : c);
    saveToLocalStorage(updatedCandidates);

    const supabase = getSupabase();
    if (!supabase) {
      console.warn("Database not configured. Candidate updated locally only.");
      return;
    }

    try {
      const { error } = await supabase
        .from('candidates')
        .update({
          role_title: candidate.currentRole,
          company: candidate.company,
          location: candidate.location,
          alignment_score: candidate.alignmentScore,
          score_breakdown: candidate.scoreBreakdown || null,
          shortlist_summary: candidate.shortlistSummary,
          key_evidence: candidate.keyEvidence || [],
          risks: candidate.risks || [],
          deep_analysis: candidate.deepAnalysis || null,
          culture_fit: candidate.cultureFit || null,
          indicators: candidate.indicators || null,
          interview_guide: candidate.interviewGuide || null,
          unlocked_steps: candidate.unlockedSteps || [],
          // Enhanced scoring fields
          score_confidence: candidate.scoreConfidence || null,
          score_drivers: candidate.scoreDrivers || null,
          score_drags: candidate.scoreDrags || null,
          // Persona and company match
          persona: candidate.persona || null,
          company_match: candidate.companyMatch || null,
          raw_profile_text: candidate.rawProfileText || null
        })
        .eq('id', candidate.id);

      if (error) {
        console.error('Supabase Update Error:', error);
      }
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Supabase connection error:', err);
      }
    }
  },

  async delete(candidateId: string) {
    // Remove from local cache first
    const cachedCandidates = loadFromLocalStorage();
    const updatedCandidates = cachedCandidates.filter(c => c.id !== candidateId);
    saveToLocalStorage(updatedCandidates);

    const supabase = getSupabase();
    if (!supabase) {
      console.warn("Database not configured. Candidate deleted locally only.");
      return;
    }

    try {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidateId);

      if (error) {
        console.error('Supabase Delete Error:', error);
      }
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Supabase connection error:', err);
      }
    }
  }
};
