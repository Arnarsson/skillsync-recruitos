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
        <div className="px-6 py-2 border-b border-slate-900 bg-transparent">
            {/* Mobile / Compact Layout */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">

                {/* Left Side: Controls */}
                <div className="flex flex-wrap items-center gap-4">

                    {/* Sorting */}
                    <div className="flex items-center space-x-2">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider hidden sm:block">Sort</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="bg-slate-800/50 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 focus:border-slate-600 outline-none transition-colors"
                        >
                            <option value="score-desc">Score: High to Low</option>
                            <option value="score-asc">Score: Low to High</option>
                            <option value="date-desc">Newest First</option>
                            <option value="date-asc">Oldest First</option>
                            <option value="name-asc">Name A-Z</option>
                            <option value="name-desc">Name Z-A</option>
                        </select>
                    </div>

                    {/* Divider */}
                    <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>

                    {/* Score Filter */}
                    <div className="flex items-center space-x-2">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider hidden sm:block">Score</label>
                        <div className="flex space-x-1">
                            {(['high', 'medium', 'low'] as const).map((level) => (
                                <button
                                    key={level}
                                    onClick={() => setFilterScore(filterScore === level ? null : level)}
                                    title={`Filter by ${level} score`}
                                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors border ${filterScore === level
                                        ? level === 'high' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                                            level === 'medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                                                'bg-slate-700 text-slate-300 border-slate-600'
                                        : 'bg-transparent border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                                        }`}
                                >
                                    {level === 'high' ? '>80' : level === 'medium' ? '50-80' : '<50'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Risk Filter */}
                    <div className="flex items-center space-x-2">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider hidden sm:block">Risk</label>
                        <select
                            value={filterRisk || ''}
                            onChange={(e) => setFilterRisk((e.target.value as FilterOption) || null)}
                            className={`bg-slate-800/50 border rounded px-2 py-1 text-[11px] outline-none transition-colors ${filterRisk ? 'border-amber-500/40 text-amber-400' : 'border-slate-800 text-slate-400'
                                }`}
                        >
                            <option value="">Any Risk</option>
                            <option value="low">Low Risk</option>
                            <option value="moderate">Moderate Risk</option>
                            <option value="high">High Risk</option>
                        </select>
                    </div>

                    {/* Archetype Filter */}
                    {availableArchetypes.length > 0 && (
                        <div className="flex items-center space-x-2">
                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider hidden sm:block">Type</label>
                            <select
                                value={filterArchetype || ''}
                                onChange={(e) => setFilterArchetype(e.target.value || null)}
                                className={`bg-slate-800/50 border rounded px-2 py-1 text-[11px] outline-none transition-colors max-w-[200px] truncate ${filterArchetype ? 'border-purple-500/40 text-purple-400' : 'border-slate-800 text-slate-400'
                                    }`}
                            >
                                <option value="">All Archetypes</option>
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
                            className="text-[10px] text-red-400 hover:text-red-300 underline decoration-red-400/30"
                        >
                            Reset
                        </button>
                    )}
                </div>

                {/* Right Side: Actions & Stats */}
                <div className="flex items-center justify-end space-x-3">
                    {selectedCandidateIds.length >= 2 && (
                        <button
                            onClick={openComparison}
                            className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all flex items-center gap-2 animate-pulse"
                        >
                            <i className="fa-solid fa-code-compare"></i>
                            Compare ({selectedCandidateIds.length})
                        </button>
                    )}

                    {selectedCandidateIds.length > 0 && (
                        <button
                            onClick={clearSelection}
                            className="px-2 py-1 text-[10px] text-slate-500 hover:text-slate-300"
                        >
                            Clear Selection
                        </button>
                    )}

                    <div className="text-[10px] font-mono text-slate-600 bg-slate-800/30 px-2 py-1 rounded">
                        {renderedCount} / {totalCount}
                    </div>
                </div>
            </div>
        </div>
    );
};
