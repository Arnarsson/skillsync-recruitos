
import { Candidate } from '../types';

// ===== API-backed Candidate Service =====
// All persistence is handled by /api/candidates routes (Prisma).
// No localStorage, no Supabase client imports.

const BASE_URL = '/api/candidates';

/** Build a URL with query-string params, omitting undefined/null values. */
function buildUrl(
  base: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string {
  if (!params) return base;
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `${base}?${qs}` : base;
}

/** Shared error handler: reads the JSON body for an error message when the
 *  response is not OK and throws a descriptive Error. */
async function handleResponse<T>(response: Response, action: string): Promise<T> {
  if (!response.ok) {
    let message = `Failed to ${action}`;
    try {
      const body = await response.json();
      if (body?.error) {
        message = body.error;
      }
    } catch {
      // response body was not JSON — use default message
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

// ===== Filter types =====

export interface CandidateFilters {
  sourceType?: 'GITHUB' | 'LINKEDIN' | 'MANUAL';
  pipelineStage?: string;
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'alignmentScore' | 'name';
  order?: 'asc' | 'desc';
}

// ===== Service =====

export const candidateService = {
  /**
   * Fetch a paginated, filterable list of candidates.
   * Returns both the candidate array and the total count for pagination.
   */
  async fetchAll(
    filters?: CandidateFilters
  ): Promise<{ candidates: Candidate[]; total: number }> {
    const url = buildUrl(BASE_URL, filters as Record<string, string | number | undefined>);
    const response = await fetch(url);
    const data = await handleResponse<{
      candidates: Candidate[];
      total: number;
      limit: number;
      offset: number;
    }>(response, 'fetch candidates');

    return { candidates: data.candidates, total: data.total };
  },

  /**
   * Fetch a single candidate by ID (includes notes from the API).
   * Returns null when the candidate is not found (404).
   */
  async getById(id: string): Promise<Candidate | null> {
    const response = await fetch(`${BASE_URL}/${encodeURIComponent(id)}`);

    if (response.status === 404) {
      return null;
    }

    const data = await handleResponse<{ candidate: Candidate }>(
      response,
      'fetch candidate'
    );
    return data.candidate;
  },

  /**
   * Create a new candidate. `name` and `sourceType` are required by the API.
   */
  async create(
    candidate: Partial<Candidate> & { name: string; sourceType: string }
  ): Promise<Candidate> {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidate),
    });

    const data = await handleResponse<{ candidate: Candidate }>(
      response,
      'create candidate'
    );
    return data.candidate;
  },

  /**
   * Partially update an existing candidate. Only the fields present in `data`
   * are sent to the API.
   */
  async update(id: string, data: Partial<Candidate>): Promise<Candidate> {
    const response = await fetch(`${BASE_URL}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await handleResponse<{ candidate: Candidate }>(
      response,
      'update candidate'
    );
    return result.candidate;
  },

  /**
   * Delete a candidate by ID.
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    await handleResponse<{ success: boolean }>(response, 'delete candidate');
  },

  /**
   * Convenience method: update only the pipeline stage of a candidate.
   * `pipelineStage` lives on the Prisma model but not in the client-side
   * Candidate interface, so we send it as a plain object to the PATCH endpoint.
   */
  async updateStage(id: string, stage: string): Promise<Candidate> {
    const response = await fetch(`${BASE_URL}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pipelineStage: stage }),
    });

    const result = await handleResponse<{ candidate: Candidate }>(
      response,
      'update candidate stage'
    );
    return result.candidate;
  },
};
