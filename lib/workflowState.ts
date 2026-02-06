/**
 * Workflow State Management with Browser History Support
 * 
 * This module provides URL-based state management for the wizard workflow,
 * ensuring browser back/forward buttons work correctly.
 * 
 * Root Cause Fix: Linear Issue 7-365
 * "No proper history.pushState() on step transitions in wizard flow"
 */

/**
 * Workflow step definitions
 */
export const WORKFLOW_STEPS = {
  INTAKE: { id: 1, path: '/intake', label: 'Job Intake' },
  SEARCH: { id: 2, path: '/search', label: 'Candidates' },
  SKILLS_REVIEW: { id: 3, path: '/skills-review', label: 'Skills Review' },
  SHORTLIST: { id: 4, path: '/shortlist', label: 'Deep Dive' },
  PIPELINE: { id: 5, path: '/pipeline', label: 'Outreach' },
} as const;

/**
 * State that should be preserved in URL for back/forward navigation
 */
export interface WorkflowUrlState {
  /** Current step index (1-5) */
  step?: number;
  /** Hash of job context to detect changes */
  jobHash?: string;
  /** Whether intake is complete */
  intakeComplete?: boolean;
  /** Whether skills review is complete */
  skillsComplete?: boolean;
}

/**
 * Generate a simple hash of job context for comparison
 */
export function hashJobContext(context: unknown): string {
  if (!context) return '';
  const str = JSON.stringify(context);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Serialize workflow state to URL search params
 */
export function serializeWorkflowState(state: WorkflowUrlState): URLSearchParams {
  const params = new URLSearchParams();
  
  if (state.step !== undefined) {
    params.set('_wf_step', state.step.toString());
  }
  
  if (state.jobHash) {
    params.set('_wf_job', state.jobHash);
  }
  
  if (state.intakeComplete) {
    params.set('_wf_intake', '1');
  }
  
  if (state.skillsComplete) {
    params.set('_wf_skills', '1');
  }
  
  return params;
}

/**
 * Deserialize URL search params to workflow state
 */
export function deserializeWorkflowState(searchParams: URLSearchParams): WorkflowUrlState {
  const state: WorkflowUrlState = {};
  
  const step = searchParams.get('_wf_step');
  if (step) {
    const parsed = parseInt(step, 10);
    if (parsed >= 1 && parsed <= 5) {
      state.step = parsed;
    }
  }
  
  const jobHash = searchParams.get('_wf_job');
  if (jobHash) {
    state.jobHash = jobHash;
  }
  
  if (searchParams.get('_wf_intake') === '1') {
    state.intakeComplete = true;
  }
  
  if (searchParams.get('_wf_skills') === '1') {
    state.skillsComplete = true;
  }
  
  return state;
}

/**
 * Merge workflow state with existing URL params
 */
export function mergeWithExistingParams(
  existingParams: URLSearchParams,
  workflowState: WorkflowUrlState
): URLSearchParams {
  const newParams = new URLSearchParams(existingParams);
  const workflowParams = serializeWorkflowState(workflowState);
  
  workflowParams.forEach((value, key) => {
    newParams.set(key, value);
  });
  
  return newParams;
}

/**
 * Build URL with workflow state for navigation
 */
export function buildWorkflowUrl(path: string, state: WorkflowUrlState): string {
  const params = serializeWorkflowState(state);
  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}

/**
 * Push workflow state to browser history without full navigation
 * Use this when updating state within a page
 */
export function pushWorkflowState(state: WorkflowUrlState): void {
  if (typeof window === 'undefined') return;
  
  const url = new URL(window.location.href);
  const params = mergeWithExistingParams(url.searchParams, state);
  
  // Update URL without triggering navigation
  const newUrl = `${url.pathname}?${params.toString()}`;
  window.history.pushState({ ...state, _workflowState: true }, '', newUrl);
}

/**
 * Replace current history entry with updated workflow state
 * Use this for state updates that shouldn't create new history entries
 */
export function replaceWorkflowState(state: WorkflowUrlState): void {
  if (typeof window === 'undefined') return;
  
  const url = new URL(window.location.href);
  const params = mergeWithExistingParams(url.searchParams, state);
  
  const newUrl = `${url.pathname}?${params.toString()}`;
  window.history.replaceState({ ...state, _workflowState: true }, '', newUrl);
}

/**
 * Get workflow state from current URL
 */
export function getWorkflowStateFromUrl(): WorkflowUrlState {
  if (typeof window === 'undefined') return {};
  
  const url = new URL(window.location.href);
  return deserializeWorkflowState(url.searchParams);
}

/**
 * Check if current history entry has workflow state
 */
export function hasWorkflowState(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.history.state?._workflowState);
}

/**
 * Create a navigation handler that preserves workflow state
 * For use with Next.js router
 */
export function createWorkflowNavigator(router: { push: (url: string) => void }) {
  return {
    /**
     * Navigate to next step with state preservation
     */
    goToStep(step: (typeof WORKFLOW_STEPS)[keyof typeof WORKFLOW_STEPS], state?: Partial<WorkflowUrlState>) {
      const fullState: WorkflowUrlState = {
        step: step.id,
        ...state,
      };
      const url = buildWorkflowUrl(step.path, fullState);
      router.push(url);
    },
    
    /**
     * Navigate to arbitrary path with workflow state
     */
    navigateTo(path: string, state?: WorkflowUrlState) {
      const url = state ? buildWorkflowUrl(path, state) : path;
      router.push(url);
    },
  };
}

/**
 * Storage keys for localStorage backup
 */
export const STORAGE_KEYS = {
  JOB_CONTEXT: 'apex_job_context',
  SKILLS_CONFIG: 'apex_skills_config',
  SKILLS_DRAFT: 'apex_skills_draft',
  CANDIDATES: 'apex_candidates',
  JOB_CONTEXT_HASH: 'apex_job_context_hash',
  WORKFLOW_STATE: 'apex_workflow_state',
} as const;

/**
 * Sync localStorage state with URL state
 * Call this on page load to ensure consistency
 */
export function syncStorageWithUrl(): { isStale: boolean; urlState: WorkflowUrlState } {
  if (typeof window === 'undefined') return { isStale: false, urlState: {} };
  
  const urlState = getWorkflowStateFromUrl();
  const storedJobContext = localStorage.getItem(STORAGE_KEYS.JOB_CONTEXT);
  
  let isStale = false;
  
  if (urlState.jobHash && storedJobContext) {
    try {
      const context = JSON.parse(storedJobContext);
      const currentHash = hashJobContext(context);
      
      // If URL hash doesn't match current localStorage, state is stale
      if (urlState.jobHash !== currentHash) {
        isStale = true;
      }
    } catch {
      isStale = true;
    }
  }
  
  return { isStale, urlState };
}
