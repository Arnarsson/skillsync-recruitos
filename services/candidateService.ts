
import { supabase } from './supabase';
import { Candidate } from '../types';

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
        .select('id, name, current_role, company, location, match_score, evidence_summary, persona, linkedin_url, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase Fetch Error:', error);
        // Use local cache as fallback
        return localCandidateCache;
      }

      // Map DB rows to Candidate objects
      const candidates = data.map((row: any) => ({
        id: row.id,
        name: row.name || 'Unknown',
        currentRole: row.current_role || 'Unknown',
        company: row.company || 'Unknown',
        location: row.location || 'Unknown',
        yearsExperience: 0,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name || 'C')}&background=random`,
        alignmentScore: row.match_score || 0,
        shortlistSummary: row.evidence_summary || '',
        keyEvidence: [],
        risks: [],
        unlockedSteps: [],
        persona: row.persona ? (typeof row.persona === 'string' ? JSON.parse(row.persona) : row.persona) : undefined,
        sourceUrl: row.linkedin_url || ''
      } as Candidate));

      // Update local cache
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
          current_role: candidate.currentRole,
          company: candidate.company,
          location: candidate.location,
          linkedin_url: candidate.sourceUrl || '',
          match_score: candidate.alignmentScore,
          evidence_summary: candidate.shortlistSummary,
          persona: candidate.persona ? JSON.stringify(candidate.persona) : null,
          status: 'new'
        }])
        .select();

      if (error) {
        console.error('Supabase Create Error:', error);
        // Still return the candidate since it's in local cache
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
          current_role: candidate.currentRole,
          company: candidate.company,
          location: candidate.location,
          match_score: candidate.alignmentScore,
          evidence_summary: candidate.shortlistSummary,
          persona: candidate.persona ? JSON.stringify(candidate.persona) : null,
          status: 'processed'
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
