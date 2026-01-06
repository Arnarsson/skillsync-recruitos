import React, { useState } from 'react';
import { MOCK_CANDIDATES } from '../constants';
import { Candidate, FunnelStage, PRICING, CREDITS_TO_EUR } from '../types';
import { analyzeCandidateProfile } from '../services/geminiService';

interface Props {
  jobContext: string;
  credits: number;
  onSpendCredits: (amount: number, description?: string) => void;
  onSelectCandidate: (candidate: Candidate) => void;
}

const ShortlistGrid: React.FC<Props> = ({ jobContext, credits, onSpendCredits, onSelectCandidate }) => {
  // Start with Mocks for demo, but allow adding real ones
  const [candidates, setCandidates] = useState<Candidate[]>(MOCK_CANDIDATES);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleUnlockProfile = (e: React.MouseEvent, candidateId: string, candidateName: string) => {
    e.stopPropagation();
    if (credits < PRICING.DEEP_PROFILE) {
        alert("Insufficient credits for pilot.");
        return;
    }
    onSpendCredits(PRICING.DEEP_PROFILE, `Unlocked Evidence Report: ${candidateName}`);
    
    setCandidates(prev => prev.map(c => {
        if (c.id === candidateId) {
            const newSteps = [...c.unlockedSteps, FunnelStage.DEEP_PROFILE];
            return { ...c, unlockedSteps: newSteps };
        }
        return c;
    }));
  };

  const handleImport = async () => {
      if (!importText.trim()) return;
      if (!jobContext) {
          alert("Please set a Job Context in Step 1 first.");
          return;
      }
      setIsImporting(true);
      try {
          const newCandidate = await analyzeCandidateProfile(importText, jobContext);
          setCandidates(prev => [newCandidate, ...prev]);
          setShowImport(false);
          setImportText('');
          onSpendCredits(10, `Imported Candidate: ${newCandidate.name}`); // Nominal fee for import
      } catch (e) {
          console.error(e);
          alert("Failed to analyze candidate. Ensure Gemini API key is active.");
      } finally {
          setIsImporting(false);
      }
  };

  return (
    <div className="h-full flex flex-col bg-apex-900 relative">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-apex-800 flex justify-between items-center bg-apex-800/30">
        <div>
            <div className="flex items-center space-x-2">
                <span className="text-emerald-500 font-mono text-xs uppercase tracking-widest bg-emerald-900/20 px-2 py-0.5 rounded">Step 2 of 4</span>
                <h2 className="text-lg md:text-xl font-bold text-white">Shortlist & Match Score</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 hidden md:block">Review match scores. Unlock Evidence Reports for vetted candidates.</p>
        </div>
        <div className="flex items-center space-x-4">
            <button 
                onClick={() => setShowImport(true)}
                className="hidden md:flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded shadow-lg shadow-emerald-900/20 transition-all"
            >
                <i className="fa-solid fa-file-import mr-2"></i> Import Profile
            </button>
            <div className="text-xs text-slate-500">
                {candidates.length} Candidates
            </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImport && (
          <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-2xl bg-apex-900 border border-apex-700 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
                  <div className="p-4 border-b border-apex-700 bg-apex-800 flex justify-between items-center">
                      <h3 className="text-white font-bold">Import Candidate Data</h3>
                      <button onClick={() => setShowImport(false)} className="text-slate-500 hover:text-white"><i className="fa-solid fa-xmark"></i></button>
                  </div>
                  <div className="p-4">
                      <p className="text-xs text-slate-400 mb-2">Paste Resume text or LinkedIn profile data. Gemini will parse and score it against the Job Context.</p>
                      <textarea 
                        className="w-full h-64 bg-apex-950 border border-apex-700 rounded p-3 text-sm text-slate-300 font-mono focus:border-emerald-500 outline-none"
                        placeholder="Paste text here..."
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                      ></textarea>
                  </div>
                  <div className="p-4 border-t border-apex-800 flex justify-end">
                      <button 
                        onClick={handleImport}
                        disabled={isImporting}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded flex items-center"
                      >
                          {isImporting ? <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> : <i className="fa-solid fa-bolt mr-2"></i>}
                          {isImporting ? 'Analyzing...' : 'Analyze & Add'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Grid Header (Desktop Only) */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-apex-800 border-b border-apex-700 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
        <div className="col-span-4">Candidate</div>
        <div className="col-span-2 text-center">Match Score</div>
        <div className="col-span-4">Evidence Summary</div>
        <div className="col-span-2 text-right">Action</div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-3">
        {candidates.map((c) => {
            const isDeepProfileUnlocked = c.unlockedSteps.includes(FunnelStage.DEEP_PROFILE);
            
            return (
                <div 
                    key={c.id} 
                    onClick={() => isDeepProfileUnlocked ? onSelectCandidate(c) : null}
                    className={`
                        flex flex-col md:grid md:grid-cols-12 gap-4 p-4 rounded-xl border transition-all items-start md:items-center relative
                        ${isDeepProfileUnlocked 
                            ? 'bg-apex-800/40 border-apex-700 hover:border-emerald-500/50 cursor-pointer group' 
                            : 'bg-apex-900 border-apex-800 opacity-80'
                        }
                    `}
                >
                    {/* Candidate Info */}
                    <div className="col-span-4 flex items-center w-full md:w-auto">
                        <img src={c.avatar} className="w-10 h-10 rounded-full border border-slate-700 mr-3 grayscale group-hover:grayscale-0 transition-all" alt="avatar" />
                        <div>
                            <div className="text-sm font-bold text-slate-200">{c.name}</div>
                            <div className="text-xs text-slate-500">{c.currentRole}</div>
                            <div className="text-[10px] text-slate-600">at {c.company}</div>
                        </div>
                        {/* Mobile Score Badge */}
                        <div className="ml-auto md:hidden bg-apex-800 rounded px-2 py-1 flex items-center border border-apex-700">
                             <span className={`font-bold ${c.alignmentScore > 80 ? 'text-emerald-400' : 'text-yellow-400'}`}>{c.alignmentScore}%</span>
                        </div>
                    </div>

                    {/* Match Score (Desktop) */}
                    <div className="col-span-2 hidden md:flex flex-col items-center justify-center">
                        <div className={`text-lg font-bold font-mono ${c.alignmentScore > 80 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                            {c.alignmentScore}%
                        </div>
                        <div className="w-16 h-1 bg-apex-700 rounded-full mt-1">
                            <div 
                                className={`h-full rounded-full ${c.alignmentScore > 80 ? 'bg-emerald-500' : 'bg-yellow-500'}`} 
                                style={{width: `${c.alignmentScore}%`}}
                            ></div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="col-span-4 w-full">
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 md:line-clamp-none">"{c.shortlistSummary}"</p>
                        <div className="mt-2 flex space-x-2">
                             <span className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded border border-slate-700">Confidence: High</span>
                        </div>
                    </div>

                    {/* Action */}
                    <div className="col-span-2 flex justify-end w-full md:w-auto mt-2 md:mt-0">
                        {isDeepProfileUnlocked ? (
                            <button className="w-full md:w-auto px-4 py-2 bg-apex-800 hover:bg-apex-700 text-emerald-400 text-xs font-bold rounded border border-emerald-900/30 flex items-center justify-center transition-colors">
                                <i className="fa-solid fa-file-invoice mr-2"></i> View Report
                            </button>
                        ) : (
                            <button 
                                onClick={(e) => handleUnlockProfile(e, c.id, c.name)}
                                className="w-full md:w-auto px-4 py-2 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-400 text-xs font-bold rounded border border-slate-700 flex items-center justify-center transition-all shadow-sm hover:shadow-emerald-500/20"
                            >
                                <i className="fa-solid fa-lock mr-2"></i> Unlock ({PRICING.DEEP_PROFILE} Cr)
                            </button>
                        )}
                    </div>
                </div>
            );
        })}
        {/* Mobile Import Button at bottom */}
         <button 
            onClick={() => setShowImport(true)}
            className="md:hidden w-full py-3 bg-apex-800 border border-dashed border-apex-700 text-slate-400 rounded-lg text-sm font-bold mt-4"
        >
            <i className="fa-solid fa-plus mr-2"></i> Import Candidate
        </button>
      </div>
    </div>
  );
};

export default ShortlistGrid;