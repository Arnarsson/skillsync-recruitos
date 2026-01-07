
import { supabase } from './supabase';
import { Candidate, FunnelStage } from '../types';

// In-memory cache for candidates when Supabase is unavailable or schema differs
let localCandidateCache: Candidate[] = [];

export const candidateService = {
  async fetchAll(): Promise<Candidate[]> {
    if (!supabase) {
      console.warn('Supabase not connected. Using local cache.');
      return localCandidateCache;
    }

    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase Fetch Error:', error);
        return localCandidateCache;
      }

      // Map DB rows to Candidate objects using actual schema
      const candidates = data.map((row: any) => ({
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
        indicators: row.indicators || undefined,
        interviewGuide: row.interview_guide || undefined,
        unlockedSteps: row.unlocked_steps || [],
        sourceUrl: row.source_url || '',
        rawProfileText: row.raw_profile_text || ''
      } as Candidate));

      localCandidateCache = candidates;
      return candidates;
    } catch (err) {
      console.error('Supabase connection error:', err);
      return localCandidateCache;
    }
  },

  async create(candidate: Candidate) {
    // Always add to local cache first
    localCandidateCache = [candidate, ...localCandidateCache.filter(c => c.id !== candidate.id)];

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
          unlocked_steps: candidate.unlockedSteps || [FunnelStage.SHORTLIST]
        }])
        .select();

      if (error) {
        console.error('Supabase Create Error:', error);
        return [candidate];
      }
      return data;
    } catch (err) {
      console.error('Supabase connection error:', err);
      return [candidate];
    }
  },

  async update(candidate: Candidate) {
    // Update local cache first
    localCandidateCache = localCandidateCache.map(c => c.id === candidate.id ? candidate : c);

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
          unlocked_steps: candidate.unlockedSteps || []
        })
        .eq('id', candidate.id);

      if (error) {
        console.error('Supabase Update Error:', error);
      }
    } catch (err) {
      console.error('Supabase connection error:', err);
    }
  }
};
