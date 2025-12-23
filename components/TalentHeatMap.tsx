import React, { useState } from 'react';
import { MOCK_CANDIDATES } from '../constants';
import { Candidate, FunnelStage, PRICING, CREDITS_TO_EUR } from '../types';

interface Props {
  credits: number;
  onSpendCredits: (amount: number) => void;
  onSelectCandidate: (candidate: Candidate) => void;
}

const ShortlistGrid: React.FC<Props> = ({ credits, onSpendCredits, onSelectCandidate }) => {
  // Simulating local state for demo purposes, in real app this would be synced
  const [candidates, setCandidates] = useState(MOCK_CANDIDATES);

  const handleUnlockProfile = (e: React.MouseEvent, candidateId: string) => {
    e.stopPropagation();
    if (credits < PRICING.EVIDENCE_REPORT) {
        alert("Insufficient credits for pilot.");
        return;
    }
    onSpendCredits(PRICING.EVIDENCE_REPORT);

    setCandidates(prev => prev.map(c => {
        if (c.id === candidateId) {
            const newSteps = [...c.unlockedSteps, FunnelStage.EVIDENCE_REPORT];
            return { ...c, unlockedSteps: newSteps };
        }
        return c;
    }));
  };

  return (
    <div className="h-full flex flex-col bg-apex-900">
      {/* Header */}
      <div className="p-6 border-b border-apex-800 flex justify-between items-center bg-apex-800/30">
        <div>
            <div className="flex items-center space-x-2">
                <span className="text-emerald-500 font-mono text-xs uppercase tracking-widest bg-emerald-900/20 px-2 py-0.5 rounded">Step 2 of 4</span>
                <h2 className="text-xl font-bold text-white">Shortlist & Match Score</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">Review match scores. Unlock Evidence Reports for vetted candidates.</p>
        </div>
        <div className="text-xs text-slate-500">
            Showing {candidates.length} Candidates
        </div>
      </div>

      {/* Grid Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-apex-800 border-b border-apex-700 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
        <div className="col-span-4">Candidate</div>
        <div className="col-span-2 text-center">Match Score</div>
        <div className="col-span-4">Evidence Summary</div>
        <div className="col-span-2 text-right">Action</div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
        {candidates.map((c) => {
            const isDeepProfileUnlocked = c.unlockedSteps.includes(FunnelStage.EVIDENCE_REPORT);

            return (
                <div
                    key={c.id}
                    onClick={() => isDeepProfileUnlocked ? onSelectCandidate(c) : null}
                    className={`grid grid-cols-12 gap-4 p-4 rounded-xl border transition-all items-center ${
                        isDeepProfileUnlocked 
                        ? 'bg-apex-800/40 border-apex-700 hover:border-emerald-500/50 cursor-pointer group' 
                        : 'bg-apex-900 border-apex-800 opacity-80'
                    }`}
                >
                    {/* Candidate Info */}
                    <div className="col-span-4 flex items-center">
                        <img src={c.avatar} className="w-10 h-10 rounded-full border border-slate-700 mr-3 grayscale group-hover:grayscale-0 transition-all" alt="avatar" />
                        <div>
                            <div className="text-sm font-bold text-slate-200">{c.name}</div>
                            <div className="text-xs text-slate-500">{c.currentRole}</div>
                            <div className="text-[10px] text-slate-600">at {c.company}</div>
                        </div>
                    </div>

                    {/* Match Score */}
                    <div className="col-span-2 flex flex-col items-center justify-center">
                        <div className={`text-lg font-bold font-mono ${c.matchScore > 80 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                            {c.matchScore}%
                        </div>
                        <div className="w-16 h-1 bg-apex-700 rounded-full mt-1">
                            <div
                                className={`h-full rounded-full ${c.matchScore > 80 ? 'bg-emerald-500' : 'bg-yellow-500'}`}
                                style={{width: `${c.matchScore}%`}}
                            ></div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="col-span-4">
                        <p className="text-xs text-slate-400 leading-relaxed">"{c.shortlistSummary}"</p>
                        <div className="mt-2 flex space-x-2">
                             <span className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded border border-slate-700">Confidence: High</span>
                        </div>
                    </div>

                    {/* Action */}
                    <div className="col-span-2 flex justify-end">
                        {isDeepProfileUnlocked ? (
                            <button className="px-4 py-2 bg-apex-800 hover:bg-apex-700 text-emerald-400 text-xs font-bold rounded border border-emerald-900/30 flex items-center transition-colors">
                                <i className="fa-solid fa-file-invoice mr-2"></i> View Report
                            </button>
                        ) : (
                            <button
                                onClick={(e) => handleUnlockProfile(e, c.id)}
                                className="px-4 py-2 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-400 text-xs font-bold rounded border border-slate-700 flex items-center transition-all shadow-sm hover:shadow-emerald-500/20"
                            >
                                <i className="fa-solid fa-lock mr-2"></i> Unlock ({PRICING.EVIDENCE_REPORT} Cr ~€{(PRICING.EVIDENCE_REPORT * CREDITS_TO_EUR).toFixed(0)})
                            </button>
                        )}
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default ShortlistGrid;