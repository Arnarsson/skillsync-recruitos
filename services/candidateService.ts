
import { supabase } from './supabase';
import { Candidate } from '../types';

export const candidateService = {
  async fetchAll(): Promise<Candidate[]> {
    if (!supabase) {
      console.warn('Supabase not connected. Returning empty list.');
      return [];
    }

    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase Fetch Error:', error);
      // Fallback to empty list instead of crashing app on initial load
      return [];
    }
    
    // Map DB rows to Candidate objects
    return data.map((row: any) => {
        // If 'data' column exists and has content, use it as the source of truth for the object
        if (row.data && typeof row.data === 'object') {
            return { ...row.data, id: row.id };
        }
        
        // Fallback for rows created without the 'data' blob (legacy)
        return {
            id: row.id,
            name: row.name,
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
            persona: row.persona,
            // Add other defaults as necessary to satisfy Candidate interface
            ...row
        } as Candidate;
    });
  },

  async create(candidate: Candidate) {
    if (!supabase) {
        throw new Error("Database configuration missing. Cannot save candidate.");
    }

    // Ensure ID is UUID if possible, but let's assume the client generated a UUID or we let DB handle it.
    // However, we are sending the ID.
    const { data, error } = await supabase
      .from('candidates')
      .insert([{
        id: candidate.id, 
        name: candidate.name,
        linkedin_url: candidate.sourceUrl || '',
        match_score: candidate.alignmentScore,
        evidence_summary: candidate.shortlistSummary,
        persona: candidate.persona,
        status: 'new',
        data: candidate // Store full object for full fidelity
      }])
      .select();

    if (error) {
       console.error('Supabase Create Error:', error);
       throw error;
    }
    return data;
  },

  async update(candidate: Candidate) {
     if (!supabase) {
        throw new Error("Database configuration missing. Cannot update candidate.");
     }

     const { error } = await supabase
       .from('candidates')
       .update({
         match_score: candidate.alignmentScore,
         evidence_summary: candidate.shortlistSummary,
         persona: candidate.persona,
         data: candidate,
         status: 'processed'
       })
       .eq('id', candidate.id);
     
     if (error) {
         console.error('Supabase Update Error:', error);
         throw error;
     }
  }
};
