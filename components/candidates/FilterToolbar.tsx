import React from 'react';

interface FilterToolbarProps {
    sortBy: 'score-desc' | 'score-asc' | 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc';
    setSortBy: (val: any) => void;
    filterScore: 'high' | 'medium' | 'low' | null;
    setFilterScore: (val: any) => void;
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
    selectedCandidateIds,
    openComparison,
    clearSelection,
    renderedCount,
    totalCount
}) => {
    return (
        <div className="px-6 py-2 border-b border-slate-900 bg-transparent">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                {/* Sorting Controls */}
                <div className="flex items-center space-x-2">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Sort:</label>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-transparent border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-400 focus:border-slate-600 outline-none transition-colors"
                    >
                        <option value="score-desc">Score High</option>
                        <option value="score-asc">Score Low</option>
                        <option value="date-desc">Recent</option>
                        <option value="date-asc">Oldest</option>
                        <option value="name-asc">Name A-Z</option>
                        <option value="name-desc">Name Z-A</option>
                    </select>
                </div>

                {/* Filtering Controls */}
                <div className="flex items-center space-x-2">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Filter:</label>
                    <div className="flex space-x-1.5">
                        <button
                            onClick={() => setFilterScore(filterScore === 'high' ? null : 'high')}
                            className={`px-3 py-1 rounded text-[11px] font-medium transition-colors border ${filterScore === 'high'
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : 'bg-transparent border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                                }`}
                        >
                            High
                        </button>
                        <button
                            onClick={() => setFilterScore(filterScore === 'medium' ? null : 'medium')}
                            className={`px-3 py-1 rounded text-[11px] font-medium transition-colors border ${filterScore === 'medium'
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                : 'bg-transparent border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                                }`}
                        >
                            Medium
                        </button>
                        <button
                            onClick={() => setFilterScore(filterScore === 'low' ? null : 'low')}
                            className={`px-3 py-1 rounded text-[11px] font-medium transition-colors border ${filterScore === 'low'
                                ? 'bg-slate-700/20 text-slate-400 border-slate-700/30'
                                : 'bg-transparent border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                                }`}
                        >
                            Low
                        </button>
                        {filterScore && (
                            <button
                                onClick={() => setFilterScore(null)}
                                className="px-2 py-1 text-[11px] text-slate-600 hover:text-slate-400 transition-colors"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* Results Counter & Compare Button */}
                <div className="flex items-center space-x-3">
                    {selectedCandidateIds.length >= 2 && (
                        <button
                            onClick={openComparison}
                            className="px-3 py-1 rounded text-[11px] font-medium bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors"
                        >
                            Compare {selectedCandidateIds.length}
                        </button>
                    )}
                    {selectedCandidateIds.length > 0 && (
                        <button
                            onClick={clearSelection}
                            className="px-2 py-1 text-[11px] text-slate-600 hover:text-slate-400"
                        >
                            Clear
                        </button>
                    )}
                    <div className="text-[10px] text-slate-600 uppercase tracking-tight">
                        {renderedCount} / {totalCount} Candidates
                    </div>
                </div>
            </div>
        </div>
    );
};
