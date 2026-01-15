import React from 'react';

type SortOption = 'score-desc' | 'score-asc' | 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc';
type FilterOption = 'high' | 'medium' | 'moderate' | 'low' | null;

interface FilterToolbarProps {
    sortBy: SortOption;
    setSortBy: (val: SortOption) => void;
    filterScore: FilterOption;
    setFilterScore: (val: FilterOption) => void;
    filterArchetype: string | null;
    setFilterArchetype: (val: string | null) => void;
    filterRisk: FilterOption;
    setFilterRisk: (val: FilterOption) => void;
    availableArchetypes: string[];
    selectedCandidateIds: string[];
    openComparison: () => void;
    clearSelection: () => void;
    renderedCount: number;
    totalCount: number;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
    sortBy,
    setSortBy,
    filterScore,
    setFilterScore,
    filterArchetype,
    setFilterArchetype,
    filterRisk,
    setFilterRisk,
    availableArchetypes,
    selectedCandidateIds,
    openComparison,
    clearSelection,
    renderedCount,
    totalCount
}) => {
    // Helper to clear all filters
    const clearAllFilters = () => {
        setFilterScore(null);
        setFilterArchetype(null);
        setFilterRisk(null);
    };

    const hasActiveFilters = filterScore || filterArchetype || filterRisk;

    return (
        <div className="px-4 md:px-8 py-3 border-b border-white/[0.05]">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">

                {/* Left Side: Controls */}
                <div className="flex flex-wrap items-center gap-3">

                    {/* Sorting */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500 hidden sm:block">Sort</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="h-8 bg-slate-800/50 border border-white/[0.08] rounded-md px-2 text-xs text-slate-300 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
                        >
                            <option value="score-desc">Score: High → Low</option>
                            <option value="score-asc">Score: Low → High</option>
                            <option value="date-desc">Newest First</option>
                            <option value="date-asc">Oldest First</option>
                            <option value="name-asc">Name A-Z</option>
                            <option value="name-desc">Name Z-A</option>
                        </select>
                    </div>

                    {/* Divider */}
                    <div className="h-4 w-px bg-white/[0.08] hidden sm:block"></div>

                    {/* Score Filter */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500 hidden sm:block">Score</label>
                        <div className="flex gap-1">
                            {(['high', 'medium', 'low'] as const).map((level) => (
                                <button
                                    key={level}
                                    onClick={() => setFilterScore(filterScore === level ? null : level)}
                                    title={`Filter by ${level} score`}
                                    className={`h-7 px-2 rounded-md text-xs font-medium transition-colors border ${filterScore === level
                                        ? level === 'high' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                                            level === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                                                'bg-red-500/10 text-red-400 border-red-500/30'
                                        : 'bg-transparent border-white/[0.08] text-slate-400 hover:text-white hover:border-white/[0.12]'
                                        }`}
                                >
                                    {level === 'high' ? '80+' : level === 'medium' ? '50-79' : '<50'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Risk Filter */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500 hidden sm:block">Risk</label>
                        <select
                            value={filterRisk || ''}
                            onChange={(e) => setFilterRisk((e.target.value as FilterOption) || null)}
                            className={`h-8 bg-slate-800/50 border rounded-md px-2 text-xs outline-none transition-colors ${filterRisk ? 'border-amber-500/30 text-amber-400' : 'border-white/[0.08] text-slate-400'}`}
                        >
                            <option value="">Any Risk</option>
                            <option value="low">Low</option>
                            <option value="moderate">Moderate</option>
                            <option value="high">High</option>
                        </select>
                    </div>

                    {/* Archetype Filter */}
                    {availableArchetypes.length > 0 && (
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-slate-500 hidden sm:block">Type</label>
                            <select
                                value={filterArchetype || ''}
                                onChange={(e) => setFilterArchetype(e.target.value || null)}
                                className={`h-8 bg-slate-800/50 border rounded-md px-2 text-xs outline-none transition-colors max-w-[180px] truncate ${filterArchetype ? 'border-blue-500/30 text-blue-400' : 'border-white/[0.08] text-slate-400'}`}
                            >
                                <option value="">All Types</option>
                                {availableArchetypes.map(arch => (
                                    <option key={arch} value={arch}>{arch}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Reset Button */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearAllFilters}
                            className="text-xs text-slate-400 hover:text-white transition-colors"
                        >
                            Reset
                        </button>
                    )}
                </div>

                {/* Right Side: Actions & Stats */}
                <div className="flex items-center justify-end gap-3">
                    {selectedCandidateIds.length >= 2 && (
                        <button
                            onClick={openComparison}
                            className="h-8 px-3 rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors flex items-center gap-2"
                        >
                            <i className="fa-solid fa-code-compare"></i>
                            Compare ({selectedCandidateIds.length})
                        </button>
                    )}

                    {selectedCandidateIds.length > 0 && (
                        <button
                            onClick={clearSelection}
                            className="text-xs text-slate-500 hover:text-white transition-colors"
                        >
                            Clear
                        </button>
                    )}

                    <div className="text-xs text-slate-500 tabular-nums">
                        {renderedCount} / {totalCount}
                    </div>
                </div>
            </div>
        </div>
    );
};
