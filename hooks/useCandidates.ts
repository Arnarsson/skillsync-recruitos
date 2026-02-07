'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Candidate } from '@/types';
import { candidateService, CandidateFilters } from '@/services/candidateService';

interface UseCandidatesReturn {
  /** Current list of candidates (for the active filter set). */
  candidates: Candidate[];
  /** Total count returned by the API (for pagination). */
  total: number;
  /** True while the initial fetch or a refresh is in-flight. */
  isLoading: boolean;
  /** Descriptive error message, or null when no error. */
  error: string | null;
  /** Re-fetch candidates with the current filters. */
  refresh: () => Promise<void>;
  /** Create a new candidate and prepend it to the local list. */
  createCandidate: (
    data: Partial<Candidate> & { name: string; sourceType: string }
  ) => Promise<Candidate>;
  /** Partially update an existing candidate. */
  updateCandidate: (id: string, data: Partial<Candidate>) => Promise<Candidate>;
  /** Delete a candidate by ID. */
  deleteCandidate: (id: string) => Promise<void>;
  /** Convenience: move a candidate to a new pipeline stage. */
  updateStage: (id: string, stage: string) => Promise<Candidate>;
}

/**
 * React hook that wraps `candidateService` with local state management.
 *
 * - Fetches candidates on mount and whenever `filters` change.
 * - Optimistically updates the local array after mutations, then re-fetches
 *   in the background to stay in sync with the server.
 * - Exposes loading / error states.
 */
export function useCandidates(filters?: CandidateFilters): UseCandidatesReturn {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Serialize filters so we can use them as a dependency for useEffect without
  // triggering infinite loops when the caller creates a new object each render.
  const filtersKey = JSON.stringify(filters ?? {});

  // Keep a ref to the latest filters so callbacks always read the current value
  // without needing filters in their dependency arrays.
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  // Core fetch function — used by the initial effect and by refresh().
  const fetchCandidates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await candidateService.fetchAll(filtersRef.current);
      setCandidates(result.candidates);
      setTotal(result.total);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch candidates';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []); // stable — reads from ref

  // Fetch on mount and whenever the serialized filters change.
  useEffect(() => {
    fetchCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  // --- Mutation helpers ---

  /** Silent background refresh (does not set isLoading to avoid flicker). */
  const backgroundRefresh = useCallback(async () => {
    try {
      const result = await candidateService.fetchAll(filtersRef.current);
      setCandidates(result.candidates);
      setTotal(result.total);
    } catch {
      // Background refresh failures are silent — the optimistic state is
      // already shown. The next explicit refresh will surface any errors.
    }
  }, []);

  const createCandidate = useCallback(
    async (
      data: Partial<Candidate> & { name: string; sourceType: string }
    ): Promise<Candidate> => {
      const created = await candidateService.create(data);
      // Optimistic: prepend to list
      setCandidates((prev) => [created, ...prev]);
      setTotal((prev) => prev + 1);
      // Background sync
      backgroundRefresh();
      return created;
    },
    [backgroundRefresh]
  );

  const updateCandidate = useCallback(
    async (id: string, data: Partial<Candidate>): Promise<Candidate> => {
      const updated = await candidateService.update(id, data);
      // Optimistic: replace in list
      setCandidates((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
      );
      // Background sync
      backgroundRefresh();
      return updated;
    },
    [backgroundRefresh]
  );

  const deleteCandidate = useCallback(
    async (id: string): Promise<void> => {
      await candidateService.delete(id);
      // Optimistic: remove from list
      setCandidates((prev) => prev.filter((c) => c.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      // Background sync
      backgroundRefresh();
    },
    [backgroundRefresh]
  );

  const updateStage = useCallback(
    async (id: string, stage: string): Promise<Candidate> => {
      const updated = await candidateService.updateStage(id, stage);
      // Optimistic: replace in list
      setCandidates((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
      );
      // Background sync
      backgroundRefresh();
      return updated;
    },
    [backgroundRefresh]
  );

  return {
    candidates,
    total,
    isLoading,
    error,
    refresh: fetchCandidates,
    createCandidate,
    updateCandidate,
    deleteCandidate,
    updateStage,
  };
}
