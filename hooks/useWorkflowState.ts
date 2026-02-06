"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  WorkflowUrlState,
  getWorkflowStateFromUrl,
  pushWorkflowState,
  replaceWorkflowState,
  buildWorkflowUrl,
  hashJobContext,
  WORKFLOW_STEPS,
  STORAGE_KEYS,
} from "@/lib/workflowState";

interface UseWorkflowStateOptions {
  /** Current step ID (1-5) */
  step: number;
  /** Whether to sync state on mount */
  syncOnMount?: boolean;
}

interface WorkflowStateResult {
  /** Current workflow state from URL */
  urlState: WorkflowUrlState;
  /** Whether localStorage state is stale compared to URL */
  isStale: boolean;
  /** Navigate to next step with state */
  navigateToStep: (step: keyof typeof WORKFLOW_STEPS, additionalState?: Partial<WorkflowUrlState>) => void;
  /** Navigate with custom path and state */
  navigateTo: (path: string, state?: WorkflowUrlState) => void;
  /** Update current URL state without navigation */
  updateState: (state: Partial<WorkflowUrlState>, replace?: boolean) => void;
  /** Mark current step as complete */
  markComplete: (key: 'intakeComplete' | 'skillsComplete') => void;
  /** Get job context hash from localStorage */
  getJobHash: () => string;
}

/**
 * Hook for managing workflow state with browser history support
 * 
 * This hook ensures:
 * 1. Browser back/forward buttons work correctly
 * 2. State is preserved in URL for shareability
 * 3. localStorage and URL state stay in sync
 * 
 * @example
 * ```tsx
 * const { navigateToStep, updateState, isStale } = useWorkflowState({ step: 1 });
 * 
 * // Navigate to next step
 * const handleContinue = () => {
 *   navigateToStep('SKILLS_REVIEW', { intakeComplete: true });
 * };
 * 
 * // Update state without navigation
 * const handleChange = () => {
 *   updateState({ intakeComplete: true }, true); // replace current entry
 * };
 * ```
 */
export function useWorkflowState({ step, syncOnMount = true }: UseWorkflowStateOptions): WorkflowStateResult {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const initializedRef = useRef(false);
  
  const [urlState, setUrlState] = useState<WorkflowUrlState>(() => {
    if (typeof window === 'undefined') return { step };
    return getWorkflowStateFromUrl();
  });
  
  const [isStale, setIsStale] = useState(false);
  
  // Get job hash from localStorage
  const getJobHash = useCallback((): string => {
    if (typeof window === 'undefined') return '';
    const storedContext = localStorage.getItem(STORAGE_KEYS.JOB_CONTEXT);
    if (!storedContext) return '';
    try {
      return hashJobContext(JSON.parse(storedContext));
    } catch {
      return '';
    }
  }, []);
  
  // Sync state on mount and handle popstate events
  useEffect(() => {
    if (!syncOnMount || initializedRef.current) return;
    initializedRef.current = true;
    
    const currentState = getWorkflowStateFromUrl();
    setUrlState(currentState);
    
    // Check if state is stale
    if (currentState.jobHash) {
      const currentJobHash = getJobHash();
      setIsStale(currentState.jobHash !== currentJobHash);
    }
    
    // Update URL with current step if not present
    if (!currentState.step) {
      replaceWorkflowState({ ...currentState, step });
    }
    
    // Handle browser back/forward
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?._workflowState) {
        setUrlState(event.state);
        
        // Check staleness on navigation
        if (event.state.jobHash) {
          const currentJobHash = getJobHash();
          setIsStale(event.state.jobHash !== currentJobHash);
        }
      } else {
        // No workflow state in history, read from URL
        setUrlState(getWorkflowStateFromUrl());
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [step, syncOnMount, getJobHash]);
  
  // Navigate to a workflow step
  const navigateToStep = useCallback((
    stepKey: keyof typeof WORKFLOW_STEPS,
    additionalState?: Partial<WorkflowUrlState>
  ) => {
    const targetStep = WORKFLOW_STEPS[stepKey];
    const jobHash = getJobHash();
    
    const fullState: WorkflowUrlState = {
      step: targetStep.id,
      jobHash: jobHash || undefined,
      ...additionalState,
    };
    
    const url = buildWorkflowUrl(targetStep.path, fullState);
    router.push(url);
  }, [router, getJobHash]);
  
  // Navigate to custom path with state
  const navigateTo = useCallback((path: string, state?: WorkflowUrlState) => {
    if (state) {
      const url = buildWorkflowUrl(path, state);
      router.push(url);
    } else {
      router.push(path);
    }
  }, [router]);
  
  // Update state without navigation
  const updateState = useCallback((state: Partial<WorkflowUrlState>, replace = false) => {
    const newState = { ...urlState, ...state };
    setUrlState(newState);
    
    if (replace) {
      replaceWorkflowState(newState);
    } else {
      pushWorkflowState(newState);
    }
  }, [urlState]);
  
  // Mark step as complete
  const markComplete = useCallback((key: 'intakeComplete' | 'skillsComplete') => {
    const newState = { ...urlState, [key]: true };
    setUrlState(newState);
    replaceWorkflowState(newState);
  }, [urlState]);
  
  return {
    urlState,
    isStale,
    navigateToStep,
    navigateTo,
    updateState,
    markComplete,
    getJobHash,
  };
}

export default useWorkflowState;
