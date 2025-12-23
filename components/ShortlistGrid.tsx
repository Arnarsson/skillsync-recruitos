import React, { useState, useRef, TouchEvent } from 'react';
import { MOCK_CANDIDATES } from '../constants';
import { Candidate, FunnelStage, PRICING, CREDITS_TO_EUR, ConfidenceLevel, formatPrice } from '../types';
import { ConfidenceBadge, StepBadge, ShareModal, useToast } from './ui';

// Swipeable Card Hook for mobile touch interactions
const useSwipe = (onSwipeLeft?: () => void, onSwipeRight?: () => void) => {
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe && onSwipeLeft) onSwipeLeft();
    if (isRightSwipe && onSwipeRight) onSwipeRight();
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
};

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
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const toggleCardExpand = (candidateId: string) => {
    setExpandedCard(prev => prev === candidateId ? null : candidateId);
  };

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
      <header className="p-4 md:p-6 border-b border-apex-800 bg-apex-800/30">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <StepBadge step={2} label="Shortlist" color="blue" price={{ credits: PRICING.SHORTLIST }} />
            <h2 className="text-xl md:text-2xl font-bold text-white mt-3">Match Scores & Evidence</h2>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Review match scores. Unlock Evidence Reports for vetted candidates.
            </p>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2 flex-1 sm:flex-initial">
              <label htmlFor="sort" className="text-xs text-slate-500 hidden sm:inline">Sort by</label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'score' | 'name')}
                className="bg-apex-800 border border-apex-700 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 flex-1 sm:flex-initial"
              >
                <option value="score">Match Score</option>
                <option value="name">Name</option>
              </select>
            </div>
            <div className="text-xs text-slate-500 bg-apex-800 px-3 py-1.5 rounded border border-apex-700 whitespace-nowrap">
              {candidates.length} Candidates
            </div>
          </div>
        </div>

      </header>

      {/* Table Header - Hidden on mobile */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-apex-800/50 border-b border-apex-700 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
        <div className="col-span-4">Candidate</div>
        <div className="col-span-2 text-center">Match Score</div>
        <div className="col-span-4">Evidence Summary</div>
        <div className="col-span-2 text-right">Action</div>
      </div>

      {/* Candidate List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-3">
        {sortedCandidates.map((c) => {
          const isUnlocked = c.unlockedSteps.includes(FunnelStage.EVIDENCE_REPORT);

          return (
            <article
              key={c.id}
              onClick={() => isUnlocked ? onSelectCandidate(c) : null}
              className={`flex flex-col md:grid md:grid-cols-12 gap-4 p-4 md:p-5 rounded-xl border transition-all ${
                isUnlocked
                  ? 'bg-apex-800/40 border-apex-700 hover:border-emerald-500/50 cursor-pointer group shadow-lg'
                  : 'bg-apex-900/50 border-apex-800 opacity-80'
              }`}
              role={isUnlocked ? 'button' : undefined}
              tabIndex={isUnlocked ? 0 : undefined}
              aria-label={isUnlocked ? `View evidence report for ${c.name}` : undefined}
              onKeyDown={(e) => e.key === 'Enter' && isUnlocked && onSelectCandidate(c)}
            >
              {/* Mobile: Expandable Card Header */}
              <div
                className="flex items-center justify-between md:hidden"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCardExpand(c.id);
                }}
              >
                <div className="flex items-center flex-1 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={c.avatar}
                      className={`w-10 h-10 rounded-full border-2 mr-3 transition-all ${
                        isUnlocked
                          ? 'border-emerald-500/50'
                          : 'border-slate-700 grayscale'
                      }`}
                      alt={`${c.name} avatar`}
                    />
                    {isUnlocked && (
                      <div className="absolute -bottom-1 -right-0 w-4 h-4 bg-emerald-600 rounded-full flex items-center justify-center border-2 border-apex-800">
                        <i className="fa-solid fa-check text-[6px] text-white"></i>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-slate-200 truncate">{c.name}</div>
                    <div className="text-xs text-slate-500 truncate">{c.currentRole} at {c.company}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-3">
                  <div className="flex flex-col items-center">
                    <div className={`text-lg font-bold font-mono ${getScoreColor(c.matchScore)}`}>
                      {c.matchScore}%
                    </div>
                    <ConfidenceBadge level={c.confidence || ConfidenceLevel.MEDIUM} size="sm" />
                  </div>
                  <i className={`fa-solid fa-chevron-down text-slate-500 text-xs transition-transform duration-200 ${
                    expandedCard === c.id ? 'rotate-180' : ''
                  }`}></i>
                </div>
              </div>

              {/* Mobile: Expanded Content */}
              <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
                expandedCard === c.id ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0'
              }`}>
                <div className="pt-3 border-t border-apex-700 space-y-3">
                  {/* Summary */}
                  <p className="text-xs text-slate-400 leading-relaxed">
                    "{c.shortlistSummary}"
                  </p>
                  {/* Evidence Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {c.keyEvidence?.slice(0, 3).map((ev, i) => (
                      <span key={i} className="text-[10px] bg-emerald-900/20 text-emerald-400/80 px-2 py-1 rounded border border-emerald-900/30">
                        <i className="fa-solid fa-check mr-1"></i>{ev.split(' ').slice(0, 4).join(' ')}...
                      </span>
                    ))}
                    {c.risks && c.risks.length > 0 && (
                      <span className="text-[10px] bg-yellow-900/20 text-yellow-500/80 px-2 py-1 rounded border border-yellow-900/30">
                        <i className="fa-solid fa-triangle-exclamation mr-1"></i>{c.risks.length} risk{c.risks.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {/* Mobile Actions */}
                  <div className="flex space-x-2 pt-2">
                    {isUnlocked ? (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleShareClick(e, c); }}
                          className="flex-1 py-2.5 bg-apex-800 hover:bg-apex-700 text-slate-400 hover:text-white rounded-lg border border-apex-700 transition-colors flex items-center justify-center text-xs"
                        >
                          <i className="fa-solid fa-share-nodes mr-2"></i> Share
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onSelectCandidate(c); }}
                          className="flex-1 py-2.5 bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-900/50 flex items-center justify-center transition-colors"
                        >
                          <i className="fa-solid fa-microscope mr-2"></i> View Report
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(e) => handleUnlockProfile(e, c.id)}
                        className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold rounded-lg flex items-center justify-center transition-all shadow-lg shadow-emerald-900/30"
                      >
                        <i className="fa-solid fa-lock-open mr-2"></i> Unlock Report ({formatPrice(PRICING.EVIDENCE_REPORT)})
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Desktop: Candidate Info */}
              <div className="hidden md:flex col-span-4 items-center">
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

              {/* Desktop: Match Score */}
              <div className="hidden md:flex col-span-2 flex-col items-center justify-center">
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

              {/* Summary - Desktop only (mobile shows in expanded section) */}
              <div className="hidden md:block md:col-span-4">
                <p className="text-xs text-slate-400 leading-relaxed mb-2 line-clamp-2">
                  "{c.shortlistSummary}"
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {c.keyEvidence?.slice(0, 2).map((ev, i) => (
                    <span key={i} className="text-[10px] bg-emerald-900/20 text-emerald-400/80 px-2 py-0.5 rounded border border-emerald-900/30">
                      <i className="fa-solid fa-check mr-1"></i>{ev.split(' ').slice(0, 3).join(' ')}...
                    </span>
                  ))}
                  {c.risks && c.risks.length > 0 && (
                    <span className="text-[10px] bg-yellow-900/20 text-yellow-500/80 px-2 py-0.5 rounded border border-yellow-900/30">
                      <i className="fa-solid fa-triangle-exclamation mr-1"></i>{c.risks.length} risk{c.risks.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Action - Desktop only (mobile shows in expanded section) */}
              <div className="hidden md:flex md:col-span-2 justify-end items-center space-x-2">
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
                      className="flex-1 md:flex-initial px-4 py-2 bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 text-xs font-bold rounded border border-emerald-900/50 flex items-center justify-center transition-colors"
                    >
                      <i className="fa-solid fa-microscope mr-2"></i> View Report
                    </button>
                  </>
                ) : (
                  <button
                    onClick={(e) => handleUnlockProfile(e, c.id)}
                    className="flex-1 md:flex-initial px-4 py-2 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-400 text-xs font-bold rounded border border-slate-700 hover:border-emerald-500 flex items-center justify-center transition-all shadow-sm hover:shadow-emerald-500/20"
                  >
                    <i className="fa-solid fa-lock mr-2"></i>
                    <span className="hidden sm:inline">Unlock ({formatPrice(PRICING.EVIDENCE_REPORT)})</span>
                    <span className="sm:hidden">Unlock</span>
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Algorithm Explainer Footer */}
      <footer className="p-3 md:p-4 border-t border-apex-800 bg-apex-800/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] text-slate-500">
          <div className="flex flex-wrap items-center gap-2 sm:space-x-4 sm:gap-0">
            <span><i className="fa-solid fa-calculator mr-1"></i> Algorithm v2.3</span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden md:inline">
              Weights: Skills (35%) • Experience (25%) • Industry (15%) • Seniority (15%) • Location (10%)
            </span>
            <span className="md:hidden">
              5 scoring factors
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
