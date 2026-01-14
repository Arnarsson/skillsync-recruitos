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
        <div className="p-4 md:p-6 border-b border-apex-800 flex justify-between items-center bg-apex-800/30">
            <div className="flex items-center space-x-6">
                <div>
                    <div className="flex items-center space-x-2">
                        <span className="text-emerald-500 font-mono text-xs uppercase tracking-widest bg-emerald-900/20 px-2 py-0.5 rounded">Step 2 of 4</span>
                        <h2 className="text-lg md:text-xl font-bold text-white">Talent Engine</h2>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 hidden md:block">Source, score, and shortlist candidates.</p>
                </div>

                {/* Tabs */}
                <div className="hidden md:flex bg-apex-900 p-1 rounded-lg border border-apex-700">
                    <button
                        onClick={() => setActiveTab('pipeline')}
                        className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${activeTab === 'pipeline' ? 'bg-apex-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Pipeline
                    </button>
                    <button
                        onClick={() => setActiveTab('sourcing')}
                        className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${activeTab === 'sourcing' ? 'bg-apex-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Auto-Sourcing <span className="ml-1 px-1 bg-emerald-600 text-[9px] rounded text-white">NEW</span>
                    </button>
                </div>
            </div>

            <div className="flex items-center space-x-3">
                <button
                    onClick={handleLoadDemoCandidate}
                    disabled={isDemoLoading}
                    className="hidden md:flex items-center px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-400 hover:text-white bg-apex-800 hover:bg-apex-700 border border-apex-700 hover:border-slate-600 rounded transition-all"
                >
                    {isDemoLoading ? <i className="fa-solid fa-circle-notch fa-spin mr-1.5"></i> : <i className="fa-solid fa-flask mr-1.5 text-[9px]"></i>}
                    {isDemoLoading ? 'Loading...' : 'Demo'}
                </button>
                <button
                    onClick={() => handleSetShowImport(true)}
                    className="hidden md:flex items-center px-4 py-2 bg-apex-800 border border-apex-600 hover:bg-apex-700 text-slate-300 text-xs font-bold rounded transition-all"
                >
                    <i className="fa-solid fa-file-import mr-2"></i> Quick Paste
                </button>
                <div className="text-xs text-slate-500">
                    {candidateCount} Candidates
                </div>
            </div>
        </div>
    );
};
