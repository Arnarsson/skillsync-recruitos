/**
 * Pipeline URL State Management
 * Preserves filter/sort state in URL for navigation back/forward
 */

export interface PipelineState {
  sort: 'score-desc' | 'score-asc' | 'name-asc' | 'name-desc';
  filter: 'high' | 'medium' | 'low' | null;
  filterRange: string | null;
  selected: string[];
  scrollTo: string | null;
  viewMode: 'list' | 'split';
}

const DEFAULT_STATE: PipelineState = {
  sort: 'score-desc',
  filter: null,
  filterRange: null,
  selected: [],
  scrollTo: null,
  viewMode: 'list',
};

/**
 * Serialize pipeline state to URL search params
 */
export function serializePipelineState(state: Partial<PipelineState>): URLSearchParams {
  const params = new URLSearchParams();

  if (state.sort && state.sort !== DEFAULT_STATE.sort) {
    params.set('sort', state.sort);
  }

  if (state.filter) {
    params.set('filter', state.filter);
  }

  if (state.filterRange) {
    params.set('range', state.filterRange);
  }

  if (state.selected && state.selected.length > 0) {
    params.set('selected', state.selected.join(','));
  }

  if (state.scrollTo) {
    params.set('scrollTo', state.scrollTo);
  }

  if (state.viewMode && state.viewMode !== DEFAULT_STATE.viewMode) {
    params.set('view', state.viewMode);
  }

  return params;
}

/**
 * Deserialize URL search params to pipeline state
 */
export function deserializePipelineState(searchParams: URLSearchParams): PipelineState {
  const state: PipelineState = { ...DEFAULT_STATE };

  const sort = searchParams.get('sort');
  if (sort && ['score-desc', 'score-asc', 'name-asc', 'name-desc'].includes(sort)) {
    state.sort = sort as PipelineState['sort'];
  }

  const filter = searchParams.get('filter');
  if (filter && ['high', 'medium', 'low'].includes(filter)) {
    state.filter = filter as PipelineState['filter'];
  }

  const filterRange = searchParams.get('range');
  if (filterRange && ['90-100', '80-89', '70-79', '60-69', '0-59'].includes(filterRange)) {
    state.filterRange = filterRange;
  }

  const selected = searchParams.get('selected');
  if (selected) {
    state.selected = selected.split(',').filter(Boolean);
  }

  const scrollTo = searchParams.get('scrollTo');
  if (scrollTo) {
    state.scrollTo = scrollTo;
  }

  const viewMode = searchParams.get('view');
  if (viewMode && ['list', 'split'].includes(viewMode)) {
    state.viewMode = viewMode as PipelineState['viewMode'];
  }

  return state;
}

/**
 * Build URL with pipeline state
 */
export function buildPipelineUrl(state: Partial<PipelineState>): string {
  const params = serializePipelineState(state);
  const queryString = params.toString();
  return queryString ? `/pipeline?${queryString}` : '/pipeline';
}

/**
 * Get state diff from current state (for efficient URL updates)
 */
export function getStateDiff(
  current: PipelineState,
  newState: Partial<PipelineState>
): Partial<PipelineState> {
  const diff: Partial<PipelineState> = {};

  if (newState.sort !== undefined && newState.sort !== current.sort) {
    diff.sort = newState.sort;
  }

  if (newState.filter !== undefined && newState.filter !== current.filter) {
    diff.filter = newState.filter;
  }

  if (newState.filterRange !== undefined && newState.filterRange !== current.filterRange) {
    diff.filterRange = newState.filterRange;
  }

  if (newState.selected !== undefined) {
    const currentSelected = current.selected.join(',');
    const newSelected = newState.selected.join(',');
    if (currentSelected !== newSelected) {
      diff.selected = newState.selected;
    }
  }

  if (newState.scrollTo !== undefined && newState.scrollTo !== current.scrollTo) {
    diff.scrollTo = newState.scrollTo;
  }

  if (newState.viewMode !== undefined && newState.viewMode !== current.viewMode) {
    diff.viewMode = newState.viewMode;
  }

  return diff;
}
