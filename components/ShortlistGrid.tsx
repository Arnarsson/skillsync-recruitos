import React, { useState } from 'react';
import { MOCK_CANDIDATES } from '../constants';
import { Candidate, FunnelStage, PRICING, CREDITS_TO_EUR, ConfidenceLevel, formatPrice } from '../types';
import { ConfidenceBadge, StepBadge, ShareModal, useToast } from './ui';

interface Props {
  credits: number;
  onSpendCredits: (amount: number) => void;
  onSelectCandidate: (candidate: Candidate) => void;
}

const ShortlistGrid: React.FC<Props> = ({ credits, onSpendCredits, onSelectCandidate }) => {
  const { addToast } = useToast();
  const [candidates, setCandidates] = useState(MOCK_CANDIDATES);
  const [shareModal, setShareModal] = useState<{ isOpen: boolean; candidate: Candidate | null }>({ 
    isOpen: false, 
    candidate: null 
  });
  const [sortBy, setSortBy] = useState<'score' | 'name'>('score');

  const handleUnlockProfile = (e: React.MouseEvent, candidateId: string) => {
    e.stopPropagation();
    
    if (credits < PRICING.EVIDENCE_REPORT) {
      addToast('error', 'Insufficient credits. Please purchase more credits to continue.');
      return;
    }
    
    onSpendCredits(PRICING.EVIDENCE_REPORT);
    addToast('success', `Evidence Report unlocked for ${PRICING.EVIDENCE_REPORT} credits`);
    
    setCandidates(prev => prev.map(c => {
      if (c.id === candidateId) {
        return { ...c, unlockedSteps: [...c.unlockedSteps, FunnelStage.EVIDENCE_REPORT] };
      }
      return c;
    }));
  };

  const handleShareClick = (e: React.MouseEvent, candidate: Candidate) => {
    e.stopPropagation();
    setShareModal({ isOpen: true, candidate });
  };

  const sortedCandidates = [...candidates].sort((a, b) => {
    if (sortBy === 'score') return b.matchScore - a.matchScore;
    return a.name.localeCompare(b.name);
  });

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="h-full flex flex-col bg-apex-900">
      {/* Header */}
      <header className="p-6 border-b border-apex-800 bg-apex-800/30">
        <div className="flex justify-between items-start">
          <div>
            <StepBadge step={2} label="Shortlist" color="blue" price={{ credits: PRICING.SHORTLIST }} />
            <h2 className="text-2xl font-bold text-white mt-3">Match Scores & Evidence</h2>
            <p className="text-sm text-slate-400 mt-1">
              Review match scores based on job requirements. Unlock Evidence Reports for vetted candidates.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2">
              <label htmlFor="sort" className="text-xs text-slate-500">Sort by</label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'score' | 'name')}
                className="bg-apex-800 border border-apex-700 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="score">Match Score</option>
                <option value="name">Name</option>
              </select>
            </div>
            <div className="text-xs text-slate-500 bg-apex-800 px-3 py-1.5 rounded border border-apex-700">
              {candidates.length} Candidates
            </div>
          </div>
        </div>
      </header>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-apex-800/50 border-b border-apex-700 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
        <div className="col-span-4">Candidate</div>
        <div className="col-span-2 text-center">Match Score</div>
        <div className="col-span-4">Evidence Summary</div>
        <div className="col-span-2 text-right">Action</div>
      </div>

      {/* Candidate List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
        {sortedCandidates.map((c) => {
          const isUnlocked = c.unlockedSteps.includes(FunnelStage.EVIDENCE_REPORT);
          
          return (
            <article 
              key={c.id} 
              onClick={() => isUnlocked ? onSelectCandidate(c) : null}
              className={`grid grid-cols-12 gap-4 p-5 rounded-xl border transition-all items-center ${
                isUnlocked 
                  ? 'bg-apex-800/40 border-apex-700 hover:border-emerald-500/50 cursor-pointer group shadow-lg' 
                  : 'bg-apex-900/50 border-apex-800 opacity-80'
              }`}
              role={isUnlocked ? 'button' : undefined}
              tabIndex={isUnlocked ? 0 : undefined}
              aria-label={isUnlocked ? `View evidence report for ${c.name}` : undefined}
              onKeyDown={(e) => e.key === 'Enter' && isUnlocked && onSelectCandidate(c)}
            >
              {/* Candidate Info */}
              <div className="col-span-4 flex items-center">
                <div className="relative">
                  <img 
                    src={c.avatar} 
                    className={`w-12 h-12 rounded-full border-2 mr-4 transition-all ${
                      isUnlocked 
                        ? 'border-emerald-500/50 group-hover:border-emerald-400' 
                        : 'border-slate-700 grayscale'
                    }`} 
                    alt={`${c.name} avatar`} 
                  />
                  {isUnlocked && (
                    <div className="absolute -bottom-1 -right-0 w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center border-2 border-apex-800">
                      <i className="fa-solid fa-check text-[8px] text-white"></i>
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-200 truncate">{c.name}</div>
                  <div className="text-xs text-slate-500 truncate">{c.currentRole}</div>
                  <div className="text-[10px] text-slate-600 flex items-center mt-0.5">
                    <i className="fa-solid fa-building mr-1"></i>
                    {c.company}
                  </div>
                </div>
              </div>

              {/* Match Score */}
              <div className="col-span-2 flex flex-col items-center justify-center">
                <div className={`text-xl font-bold font-mono ${getScoreColor(c.matchScore)}`}>
                  {c.matchScore}%
                </div>
                <div className="w-16 h-1.5 bg-apex-700 rounded-full mt-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${getScoreBarColor(c.matchScore)}`} 
                    style={{width: `${c.matchScore}%`}}
                  ></div>
                </div>
                <div className="mt-2">
                  <ConfidenceBadge level={c.confidence || ConfidenceLevel.MEDIUM} />
                </div>
              </div>

              {/* Summary */}
              <div className="col-span-4">
                <p className="text-xs text-slate-400 leading-relaxed mb-2 line-clamp-2">
                  "{c.shortlistSummary}"
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {c.keyEvidence?.slice(0, 2).map((ev, i) => (
                    <span key={i} className="text-[10px] bg-emerald-900/20 text-emerald-400/80 px-2 py-0.5 rounded border border-emerald-900/30">
                      <i className="fa-solid fa-check mr-1"></i>{ev.split(' ').slice(0, 4).join(' ')}...
                    </span>
                  ))}
                  {c.risks && c.risks.length > 0 && (
                    <span className="text-[10px] bg-yellow-900/20 text-yellow-500/80 px-2 py-0.5 rounded border border-yellow-900/30">
                      <i className="fa-solid fa-triangle-exclamation mr-1"></i>{c.risks.length} risk{c.risks.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="col-span-2 flex justify-end items-center space-x-2">
                {isUnlocked ? (
                  <>
                    <button 
                      onClick={(e) => handleShareClick(e, c)}
                      className="p-2 bg-apex-800 hover:bg-apex-700 text-slate-400 hover:text-white rounded border border-apex-700 transition-colors"
                      title="Share profile"
                      aria-label="Share profile"
                    >
                      <i className="fa-solid fa-share-nodes text-sm"></i>
                    </button>
                    <button 
                      className="px-4 py-2 bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 text-xs font-bold rounded border border-emerald-900/50 flex items-center transition-colors"
                    >
                      <i className="fa-solid fa-microscope mr-2"></i> View Report
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={(e) => handleUnlockProfile(e, c.id)}
                    className="px-4 py-2 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-400 text-xs font-bold rounded border border-slate-700 hover:border-emerald-500 flex items-center transition-all shadow-sm hover:shadow-emerald-500/20"
                  >
                    <i className="fa-solid fa-lock mr-2"></i> 
                    Unlock ({formatPrice(PRICING.EVIDENCE_REPORT)})
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Algorithm Explainer Footer */}
      <footer className="p-4 border-t border-apex-800 bg-apex-800/30">
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <div className="flex items-center space-x-4">
            <span><i className="fa-solid fa-calculator mr-1"></i> Algorithm v2.3</span>
            <span>|</span>
            <span>
              Weights: Skills (35%) • Experience (25%) • Industry (15%) • Seniority (15%) • Location (10%)
            </span>
          </div>
          <button className="text-slate-400 hover:text-white transition-colors flex items-center">
            <i className="fa-solid fa-circle-question mr-1"></i> How we score
          </button>
        </div>
      </footer>

      {/* Share Modal */}
      {shareModal.candidate && (
        <ShareModal
          isOpen={shareModal.isOpen}
          onClose={() => setShareModal({ isOpen: false, candidate: null })}
          candidateName={shareModal.candidate.name}
          candidateId={shareModal.candidate.id}
          step="shortlist"
        />
      )}
    </div>
  );
};

export default ShortlistGrid;
