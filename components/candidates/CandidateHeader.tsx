import React from 'react';

interface CandidateHeaderProps {
    activeTab: 'pipeline' | 'sourcing';
    setActiveTab: (tab: 'pipeline' | 'sourcing') => void;
    handleLoadDemoCandidate: () => void;
    isDemoLoading: boolean;
    handleSetShowImport: (show: boolean) => void;
    candidateCount: number;
}

export const CandidateHeader: React.FC<CandidateHeaderProps> = ({
    activeTab,
    setActiveTab,
    handleLoadDemoCandidate,
    isDemoLoading,
    handleSetShowImport,
    candidateCount
}) => {
    return (
        <div className="p-4 md:p-6 border-b border-white/[0.05] flex justify-between items-center">
            <div className="flex items-center gap-6">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">Step 2</span>
                        <h2 className="text-lg md:text-xl font-semibold text-white">Talent Pipeline</h2>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 hidden md:block">Source, score, and shortlist candidates.</p>
                </div>

                {/* Tabs */}
                <div className="hidden md:flex bg-slate-800/50 p-1 rounded-md border border-white/[0.08]">
                    <button
                        onClick={() => setActiveTab('pipeline')}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${activeTab === 'pipeline' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        Pipeline
                    </button>
                    <button
                        onClick={() => setActiveTab('sourcing')}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${activeTab === 'sourcing' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        Auto-Sourcing <span className="ml-1 px-1 bg-blue-600 text-xs rounded text-white">New</span>
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={handleLoadDemoCandidate}
                    disabled={isDemoLoading}
                    className="hidden md:flex items-center h-8 px-3 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 border border-white/[0.08] rounded-md transition-colors"
                >
                    {isDemoLoading ? <i className="fa-solid fa-circle-notch fa-spin mr-1.5"></i> : <i className="fa-solid fa-flask mr-1.5"></i>}
                    {isDemoLoading ? 'Loading...' : 'Demo'}
                </button>
                <button
                    onClick={() => handleSetShowImport(true)}
                    className="hidden md:flex items-center h-8 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-md transition-colors"
                >
                    <i className="fa-solid fa-plus mr-2"></i> Import
                </button>
                <div className="text-xs text-slate-500 tabular-nums">
                    {candidateCount} candidates
                </div>
            </div>
        </div>
    );
};
