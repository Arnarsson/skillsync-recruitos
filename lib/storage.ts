import { kv } from "@vercel/kv";

// Keys
const CANDIDATES_KEY = "recruitos:candidates";
const NOTES_PREFIX = "recruitos:notes:";
const PIPELINE_PREFIX = "recruitos:pipeline:";

export interface StoredCandidate {
  id: string;
  linkedinId: string;
  linkedinUrl: string;
  name: string;
  headline: string;
  location: string;
  currentCompany: string;
  photoUrl: string;
  about: string;
  experience: any[];
  education: any[];
  skills: any[];
  languages: any[];
  certifications: any[];
  connectionDegree: string;
  mutualConnections: string;
  connectionCount?: string;
  followers?: string;
  openToWork: boolean;
  isPremium: boolean;
  isCreator: boolean;
  source: string;
  capturedAt: string;
  createdAt: string;
  updatedAt?: string;
  stage?: string;
}

export interface StoredNote {
  id: string;
  linkedinId: string;
  author: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Check if KV is configured
function isKVConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// ============================================
// CANDIDATES
// ============================================

export async function getAllCandidates(): Promise<StoredCandidate[]> {
  if (!isKVConfigured()) {
    console.warn("[Storage] KV not configured, returning empty array");
    return [];
  }
  
  try {
    const candidates = await kv.lrange<StoredCandidate>(CANDIDATES_KEY, 0, -1);
    return candidates || [];
  } catch (error) {
    console.error("[Storage] Failed to get candidates:", error);
    return [];
  }
}

export async function getCandidateByLinkedinId(linkedinId: string): Promise<StoredCandidate | null> {
  const candidates = await getAllCandidates();
  return candidates.find(c => c.linkedinId === linkedinId) || null;
}

export async function saveCandidate(candidate: StoredCandidate): Promise<{ success: boolean; isNew: boolean }> {
  if (!isKVConfigured()) {
    console.warn("[Storage] KV not configured, cannot save candidate");
    return { success: false, isNew: false };
  }
  
  try {
    const candidates = await getAllCandidates();
    const existingIndex = candidates.findIndex(c => c.linkedinId === candidate.linkedinId);
    
    if (existingIndex !== -1) {
      // Update existing
      candidates[existingIndex] = { ...candidates[existingIndex], ...candidate, updatedAt: new Date().toISOString() };
      await kv.del(CANDIDATES_KEY);
      if (candidates.length > 0) {
        await kv.rpush(CANDIDATES_KEY, ...candidates);
      }
      return { success: true, isNew: false };
    } else {
      // Add new (prepend to list)
      await kv.lpush(CANDIDATES_KEY, candidate);
      
      // Trim to keep max 1000 candidates
      await kv.ltrim(CANDIDATES_KEY, 0, 999);
      
      return { success: true, isNew: true };
    }
  } catch (error) {
    console.error("[Storage] Failed to save candidate:", error);
    return { success: false, isNew: false };
  }
}

export async function updateCandidateStage(linkedinId: string, stage: string): Promise<boolean> {
  if (!isKVConfigured()) return false;
  
  try {
    const candidates = await getAllCandidates();
    const index = candidates.findIndex(c => c.linkedinId === linkedinId);
    
    if (index === -1) return false;
    
    candidates[index].stage = stage;
    candidates[index].updatedAt = new Date().toISOString();
    
    await kv.del(CANDIDATES_KEY);
    if (candidates.length > 0) {
      await kv.rpush(CANDIDATES_KEY, ...candidates);
    }
    
    return true;
  } catch (error) {
    console.error("[Storage] Failed to update stage:", error);
    return false;
  }
}

export async function deleteCandidate(linkedinId: string): Promise<boolean> {
  if (!isKVConfigured()) return false;
  
  try {
    const candidates = await getAllCandidates();
    const filtered = candidates.filter(c => c.linkedinId !== linkedinId);
    
    if (filtered.length === candidates.length) return false;
    
    await kv.del(CANDIDATES_KEY);
    if (filtered.length > 0) {
      await kv.rpush(CANDIDATES_KEY, ...filtered);
    }
    
    return true;
  } catch (error) {
    console.error("[Storage] Failed to delete candidate:", error);
    return false;
  }
}

// ============================================
// NOTES
// ============================================

export async function getNotes(linkedinId: string): Promise<StoredNote[]> {
  if (!isKVConfigured()) return [];
  
  try {
    const notes = await kv.lrange<StoredNote>(`${NOTES_PREFIX}${linkedinId}`, 0, -1);
    return notes || [];
  } catch (error) {
    console.error("[Storage] Failed to get notes:", error);
    return [];
  }
}

export async function addNote(note: StoredNote): Promise<boolean> {
  if (!isKVConfigured()) return false;
  
  try {
    await kv.lpush(`${NOTES_PREFIX}${note.linkedinId}`, note);
    return true;
  } catch (error) {
    console.error("[Storage] Failed to add note:", error);
    return false;
  }
}

export async function deleteNote(linkedinId: string, noteId: string): Promise<boolean> {
  if (!isKVConfigured()) return false;
  
  try {
    const notes = await getNotes(linkedinId);
    const filtered = notes.filter(n => n.id !== noteId);
    
    if (filtered.length === notes.length) return false;
    
    const key = `${NOTES_PREFIX}${linkedinId}`;
    await kv.del(key);
    if (filtered.length > 0) {
      await kv.rpush(key, ...filtered);
    }
    
    return true;
  } catch (error) {
    console.error("[Storage] Failed to delete note:", error);
    return false;
  }
}

// ============================================
// STATS
// ============================================

export async function getStorageStats(): Promise<{
  configured: boolean;
  candidateCount: number;
}> {
  const configured = isKVConfigured();
  
  if (!configured) {
    return { configured: false, candidateCount: 0 };
  }
  
  try {
    const count = await kv.llen(CANDIDATES_KEY);
    return { configured: true, candidateCount: count || 0 };
  } catch {
    return { configured: true, candidateCount: 0 };
  }
}
