import React, { useState, useEffect } from 'react';
import { Candidate, FunnelStage, PRICING, ConfidenceLevel, formatPrice, getConfidenceColor } from '../types';
import { SCORE_WEIGHTS } from '../constants';
import { ConfidenceBadge, ShareModal, StepBadge, useToast } from './ui';

interface Props {
  candidate: Candidate;
  credits: number;
  onSpendCredits: (amount: number) => void;
  onClose: () => void;
  onOpenOutreach: (c: Candidate) => void;
}

type MobileTab = 'score' | 'evidence' | 'interview' | 'outreach';

const EvidenceReport: React.FC<Props> = ({ candidate, credits, onSpendCredits, onClose, onOpenOutreach }) => {
  const { addToast } = useToast();
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showAlgorithm, setShowAlgorithm] = useState(false);
  const [shareModal, setShareModal] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('score');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const indicators = candidate.indicators || [];
  const questions = candidate.interviewGuide || [];
  const isOutreachUnlocked = candidate.unlockedSteps.includes(FunnelStage.OUTREACH);

  const handleUnlockOutreach = () => {
    if (credits < PRICING.OUTREACH) {
      addToast('error', 'Insufficient credits for Outreach Protocol');
      return;
    }
    onSpendCredits(PRICING.OUTREACH);
    addToast('success', `Outreach Protocol unlocked for ${PRICING.OUTREACH} credits`);
    onOpenOutreach(candidate);
  };

  const handleRefresh = () => {
    if (credits < PRICING.REFRESH) {
      addToast('error', 'Insufficient credits');
      return;
    }
    if (window.confirm(`Refresh data for ${PRICING.REFRESH} Credit (~€${(PRICING.REFRESH * 0.54).toFixed(2)})?`)) {
      onSpendCredits(PRICING.REFRESH);
      addToast('success', 'Profile data refreshed from source');
    }
  };

  const handleReport = () => {
    addToast('info', 'Report flagged. Support will review within 24 hours.');
  };

  const handleExportPDF = () => {
    addToast('info', 'Generating PDF... This may take a few seconds.');
    // In production, this would trigger actual PDF generation
    setTimeout(() => addToast('success', 'PDF downloaded'), 1500);
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-emerald-400';
    if (percentage >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <>
      <div
        className="fixed inset-0 md:inset-y-0 md:left-auto md:right-0 w-full md:w-[720px] bg-apex-900 border-l border-apex-700 shadow-2xl z-40 flex flex-col font-sans animate-slideIn"
        role="dialog"
        aria-labelledby="evidence-report-title"
        aria-modal="true"
      >
        {/* Header */}
        <header className="p-4 md:p-6 bg-gradient-to-r from-apex-800 to-apex-800/80 border-b border-apex-700">
          {/* Mobile: Close button row */}
          <div className="flex justify-between items-center mb-4 md:hidden">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Evidence Report</span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded hover:bg-apex-700 transition-colors"
              aria-label="Close panel"
            >
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="flex items-center space-x-4 md:space-x-5 w-full md:w-auto">
              <div className="relative shrink-0">
                <img
                  src={candidate.avatar}
                  alt={`${candidate.name} avatar`}
                  className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/20"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-emerald-600 rounded-full flex items-center justify-center border-2 border-apex-800">
                  <i className="fa-solid fa-check text-[10px] md:text-xs text-white"></i>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="evidence-report-title" className="text-xl md:text-2xl font-bold text-white truncate">{candidate.name}</h2>
                <div className="flex flex-wrap items-center text-xs text-slate-400 gap-x-4 gap-y-1 mt-1">
                  <span><i className="fa-solid fa-briefcase mr-1.5"></i>{candidate.yearsExperience} years exp</span>
                  <span><i className="fa-solid fa-location-dot mr-1.5"></i>{candidate.location}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1 truncate">{candidate.currentRole} at {candidate.company}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto md:flex-col md:items-end md:space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleRefresh}
                  className="text-[10px] text-slate-400 hover:text-white flex items-center bg-apex-900 px-2.5 py-1.5 rounded border border-apex-700 transition-colors"
                  title={`Refresh from LinkedIn (${PRICING.REFRESH} Credit)`}
                >
                  <i className="fa-solid fa-rotate mr-1.5"></i> <span className="hidden sm:inline">Refresh</span>
                </button>
                <button
                  onClick={handleReport}
                  className="text-[10px] text-slate-400 hover:text-yellow-400 flex items-center bg-apex-900 px-2.5 py-1.5 rounded border border-apex-700 transition-colors"
                  title="Report incorrect data"
                >
                  <i className="fa-solid fa-flag mr-1.5"></i> <span className="hidden sm:inline">Report</span>
                </button>
                <button
                  onClick={() => setShareModal(true)}
                  className="text-[10px] text-slate-400 hover:text-emerald-400 flex items-center bg-apex-900 px-2.5 py-1.5 rounded border border-apex-700 transition-colors"
                >
                  <i className="fa-solid fa-share-nodes mr-1.5"></i> <span className="hidden sm:inline">Share</span>
                </button>
                <button
                  onClick={handleExportPDF}
                  className="text-[10px] text-slate-400 hover:text-blue-400 flex items-center bg-apex-900 px-2.5 py-1.5 rounded border border-apex-700 transition-colors"
                >
                  <i className="fa-solid fa-file-pdf mr-1.5"></i> <span className="hidden sm:inline">PDF</span>
                </button>
                {/* Desktop close button */}
                <button
                  onClick={onClose}
                  className="hidden md:flex text-slate-500 hover:text-white p-2 rounded hover:bg-apex-700 transition-colors"
                  aria-label="Close panel"
                >
                  <i className="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Tab Navigation */}
        {isMobile && (
          <nav className="flex border-b border-apex-700 bg-apex-800/50 overflow-x-auto scrollbar-hide">
            {[
              { id: 'score' as MobileTab, label: 'Score', icon: 'fa-chart-simple' },
              { id: 'evidence' as MobileTab, label: 'Evidence', icon: 'fa-microscope' },
              { id: 'interview' as MobileTab, label: 'Interview', icon: 'fa-comments' },
              { id: 'outreach' as MobileTab, label: 'Outreach', icon: 'fa-paper-plane' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMobileTab(tab.id)}
                className={`flex-1 min-w-[80px] py-3 px-2 text-center transition-all relative ${
                  mobileTab === tab.id
                    ? 'text-emerald-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <i className={`fa-solid ${tab.icon} text-sm mb-1 block`}></i>
                <span className="text-[10px] font-bold uppercase">{tab.label}</span>
                {mobileTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"></div>
                )}
              </button>
            ))}
          </nav>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 md:space-y-6 custom-scrollbar">

          {/* SECTION: Match Score (Step 2 Data) */}
          <section
            aria-labelledby="match-score-heading"
            className={isMobile && mobileTab !== 'score' ? 'hidden' : ''}
          >
            <div className="flex items-center justify-between mb-4">
              <StepBadge step={2} label="Match Score" color="emerald" />
              <span className="text-[10px] text-slate-500">INCLUDED</span>
            </div>

            <div className="bg-apex-800/50 rounded-xl p-4 md:p-6 border border-apex-700">
              {/* Main Score */}
              <div className="flex items-end justify-between mb-3">
                <div>
                  <h3 id="match-score-heading" className="sr-only">Match Score</h3>
                  <div className="text-4xl md:text-5xl font-bold text-emerald-400">{candidate.matchScore}%</div>
                </div>
                <ConfidenceBadge level={candidate.confidence || ConfidenceLevel.HIGH} size="md" />
              </div>
              
              {/* Score Bar */}
              <div className="w-full bg-apex-900 rounded-full h-2.5 mb-4">
                <div 
                  className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-2.5 rounded-full shadow-lg shadow-emerald-500/30 transition-all duration-500" 
                  style={{width: `${candidate.matchScore}%`}}
                ></div>
              </div>

              {/* Breakdown Toggle */}
              <button 
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="text-xs text-slate-400 hover:text-white flex items-center transition-colors mb-4"
                aria-expanded={showBreakdown}
              >
                <i className={`fa-solid fa-chevron-${showBreakdown ? 'down' : 'right'} mr-2 text-[10px]`}></i>
                {showBreakdown ? 'Hide Score Breakdown' : 'Show Score Breakdown'}
              </button>
              
              {/* Score Breakdown (Spec 12.5) */}
              {showBreakdown && candidate.scoreBreakdown && (
                <div className="bg-apex-900/50 rounded-lg p-4 border border-apex-800 space-y-3 animate-fadeIn mb-6">
                  <div className="flex justify-between items-center border-b border-apex-800 pb-2 mb-2">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase">Score Components</h4>
                    <span className="text-[10px] text-slate-600">Algorithm v2.3</span>
                  </div>
                  {Object.entries(candidate.scoreBreakdown).map(([key, data]) => {
                    const weight = SCORE_WEIGHTS[key as keyof typeof SCORE_WEIGHTS];
                    return (
                      <div key={key} className="flex justify-between items-center text-xs">
                        <div className="flex items-center">
                          <span className="text-slate-400">{weight.label}</span>
                          <span className="text-[10px] text-slate-600 ml-2">({weight.weight}%)</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-slate-600 font-mono text-[10px]">{data.value}/{data.max}</span>
                          <span className={`font-bold w-12 text-right ${getScoreColor(data.percentage)}`}>
                            {data.percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <button 
                    onClick={() => setShowAlgorithm(!showAlgorithm)}
                    className="pt-2 mt-2 border-t border-apex-800 text-[10px] text-slate-500 hover:text-slate-300 flex items-center w-full transition-colors"
                  >
                    <i className="fa-solid fa-circle-question mr-1.5"></i> How we calculated this
                  </button>
                </div>
              )}

              {/* Evidence & Risks Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <h4 className="text-xs font-bold text-emerald-400 uppercase mb-3 flex items-center">
                    <i className="fa-regular fa-circle-check mr-2"></i> Key Evidence
                  </h4>
                  <ul className="space-y-2.5">
                    {candidate.keyEvidence?.map((item, i) => (
                      <li key={i} className="text-xs text-slate-300 leading-relaxed flex items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 mt-1.5 mr-2.5 flex-shrink-0"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-yellow-400 uppercase mb-3 flex items-center">
                    <i className="fa-solid fa-triangle-exclamation mr-2"></i> Potential Risks
                  </h4>
                  <ul className="space-y-2.5">
                    {candidate.risks?.map((item, i) => (
                      <li key={i} className="text-xs text-slate-300 leading-relaxed flex items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/60 mt-1.5 mr-2.5 flex-shrink-0"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION: Evidence Report (Step 3 Data) */}
          <section
            aria-labelledby="evidence-heading"
            className={isMobile && mobileTab !== 'evidence' ? 'hidden' : ''}
          >
            <div className="flex items-center justify-between mb-4">
              <StepBadge step={3} label="Evidence Report" color="blue" />
            </div>

            <div className="space-y-5">
              {/* Deep Analysis */}
              {candidate.deepAnalysis && (
                <div className="bg-gradient-to-br from-blue-900/20 to-apex-800/50 rounded-xl p-5 border border-blue-900/30 relative overflow-hidden">
                  <div className="absolute top-4 right-4 opacity-10">
                    <i className="fa-solid fa-brain text-4xl text-blue-500"></i>
                  </div>
                  
                  <h4 className="text-xs font-bold text-blue-400 uppercase mb-3 flex items-center">
                    <i className="fa-solid fa-magnifying-glass-chart mr-2"></i> Deep Profile Analysis
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed font-light pr-8">
                    {candidate.deepAnalysis}
                  </p>

                  {candidate.cultureFit && (
                    <div className="mt-4 bg-apex-900/50 rounded-lg p-4 border border-apex-700 flex items-start">
                      <i className="fa-solid fa-building-user text-emerald-500 mt-0.5 mr-3"></i>
                      <div>
                        <h5 className="text-[10px] font-bold text-slate-500 uppercase mb-1">Company Culture Match</h5>
                        <p className="text-xs text-slate-300">{candidate.cultureFit}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Career Trajectory */}
              <div className="bg-apex-800/30 rounded-xl p-4 md:p-5 border border-apex-700">
                <h4 className="text-xs font-bold text-slate-200 uppercase mb-4 flex items-center">
                  <i className="fa-solid fa-arrow-trend-up mr-2 text-blue-400"></i> Career Trajectory Analysis
                </h4>
                <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
                  <div className="bg-apex-900/50 p-3 md:p-4 rounded-lg border border-apex-800">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Avg Tenure</div>
                    <div className="text-lg md:text-xl font-bold text-white mt-1">{candidate.avgTenure || 'N/A'}</div>
                  </div>
                  <div className="bg-apex-900/50 p-3 md:p-4 rounded-lg border border-apex-800">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Progression Pace</div>
                    <div className="text-lg md:text-xl font-bold text-white mt-1">{candidate.progressionPace || 'N/A'}</div>
                  </div>
                </div>
                {candidate.trajectoryEvidence && (
                  <div className="bg-blue-900/10 p-4 rounded-lg border border-blue-900/20 text-xs text-slate-300">
                    <strong className="text-blue-400">Evidence:</strong> {candidate.trajectoryEvidence}
                  </div>
                )}
              </div>

              {/* Career & Workstyle Indicators (Spec 16.1 - renamed from Workstyle) */}
              <div className="bg-apex-800/30 rounded-xl p-4 md:p-5 border border-apex-700">
                <h4 className="text-xs font-bold text-slate-200 uppercase mb-4 flex items-center">
                  <i className="fa-solid fa-fingerprint mr-2 text-purple-400"></i> Career & Workstyle Indicators
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                  {indicators.map((ind, i) => {
                    const colors = getConfidenceColor(ind.evidence.confidence);
                    return (
                      <div key={i} className="bg-apex-900/30 p-4 rounded-lg border border-apex-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-slate-600 uppercase">{ind.category}</span>
                          <ConfidenceBadge level={ind.evidence.confidence} showLabel={false} />
                        </div>
                        <div className="text-sm font-bold text-white mb-2">{ind.label}</div>
                        {/* Spec 16.3 Citation Format */}
                        <div className="text-xs text-slate-400">
                          <span className="text-slate-600 mr-1">└─</span> 
                          Evidence: <span className="italic text-slate-300">"{ind.evidence.text}"</span>
                        </div>
                        <div className="text-[10px] text-slate-600 mt-1">
                          Source: {ind.evidence.source}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mandatory Disclaimer (Spec 16.2) */}
              <div className="bg-yellow-900/10 border border-yellow-900/30 p-4 rounded-lg flex items-start">
                <i className="fa-solid fa-triangle-exclamation text-yellow-500 mt-0.5 mr-3"></i>
                <div>
                  <p className="text-[10px] text-yellow-600/90 leading-relaxed font-mono">
                    <strong>⚠️ Decision Support Notice:</strong> This analysis provides evidence-based indicators from public professional history. It is not a diagnostic assessment and should be verified during the interview process. Final hiring decisions must involve human judgment.
                  </p>
                </div>
              </div>

              {/* Interview Guide - Desktop only (mobile shows in separate tab) */}
              {!isMobile && questions.length > 0 && (
                <div className="bg-apex-800/30 rounded-xl p-5 border border-apex-700">
                  <h4 className="text-xs font-bold text-slate-200 uppercase mb-4 flex items-center">
                    <i className="fa-solid fa-comments mr-2 text-cyan-400"></i> Interview Guide
                  </h4>
                  <ul className="space-y-4">
                    {questions.map((q, i) => (
                      <li key={i} className="flex items-start">
                        <span className="w-6 h-6 flex items-center justify-center bg-cyan-900/30 rounded-full text-[10px] font-bold text-cyan-400 mr-3 flex-shrink-0 border border-cyan-900/50">
                          {i + 1}
                        </span>
                        <div>
                          <div className="text-sm text-slate-200 font-medium">{q.question}</div>
                          <div className="text-[10px] text-slate-500 mt-1 flex items-center">
                            <span className="bg-apex-800 px-2 py-0.5 rounded mr-2">{q.topic}</span>
                            <span>Reason: {q.reason}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          {/* SECTION: Interview Guide (Mobile Tab) */}
          <section
            className={isMobile && mobileTab !== 'interview' ? 'hidden' : (isMobile ? '' : 'hidden')}
          >
            {questions.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white flex items-center">
                    <i className="fa-solid fa-comments mr-2 text-cyan-400"></i> Interview Guide
                  </h3>
                  <span className="text-[10px] text-slate-500">{questions.length} questions</span>
                </div>
                <ul className="space-y-4">
                  {questions.map((q, i) => (
                    <li key={i} className="bg-apex-800/30 rounded-xl p-4 border border-apex-700">
                      <div className="flex items-start">
                        <span className="w-8 h-8 flex items-center justify-center bg-cyan-900/30 rounded-full text-xs font-bold text-cyan-400 mr-3 flex-shrink-0 border border-cyan-900/50">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <div className="text-sm text-slate-200 font-medium leading-relaxed">{q.question}</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="text-[10px] bg-apex-800 text-slate-400 px-2 py-1 rounded border border-apex-700">{q.topic}</span>
                            <span className="text-[10px] text-slate-500">{q.reason}</span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <i className="fa-solid fa-comments text-3xl mb-3 opacity-50"></i>
                <p className="text-sm">No interview questions generated yet</p>
              </div>
            )}
          </section>

          {/* SECTION: Outreach Preview (Step 4) */}
          <section
            className={`${isMobile && mobileTab !== 'outreach' ? 'hidden' : ''} ${!isMobile ? 'pt-4 border-t border-apex-700/50' : ''}`}
          >
            <div className="flex items-center justify-between mb-4">
              <StepBadge step={4} label="Outreach Protocol" color="slate" />
            </div>

            {isOutreachUnlocked ? (
              <div className="bg-emerald-900/10 border border-emerald-900/30 rounded-xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] bg-emerald-900/50 text-emerald-400 px-2 py-1 rounded font-bold uppercase flex items-center">
                    <i className="fa-solid fa-check mr-1.5"></i> Unlocked
                  </span>
                  <ConfidenceBadge level={candidate.outreachConfidence || ConfidenceLevel.HIGH} />
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Best Connection Path</div>
                    <div className="p-3 bg-apex-900 border border-apex-800 rounded-lg text-sm text-emerald-400 flex items-center">
                      <i className="fa-solid fa-route mr-2"></i>
                      {candidate.connectionPath || 'Direct outreach recommended'}
                    </div>
                  </div>
                  <button 
                    onClick={() => onOpenOutreach(candidate)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-emerald-900/30 transition-all hover:-translate-y-0.5"
                  >
                    Open Outreach Suite <i className="fa-solid fa-arrow-up-right-from-square ml-2"></i>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-apex-800/20 border border-dashed border-apex-700 rounded-xl p-8 text-center">
                <div className="w-14 h-14 bg-apex-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                  <i className="fa-solid fa-lock text-xl"></i>
                </div>
                <h3 className="text-sm font-bold text-slate-300 mb-2">Unlock Outreach Protocol</h3>
                <p className="text-xs text-slate-500 mb-5 max-w-sm mx-auto">
                  Reveal connection paths, shared context hooks, and AI-drafted outreach messages.
                </p>
                <button 
                  onClick={handleUnlockOutreach}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-400 text-sm font-bold rounded-lg border border-slate-700 hover:border-emerald-500 transition-all shadow-sm hover:shadow-emerald-500/20"
                >
                  <i className="fa-solid fa-unlock mr-2"></i>
                  Unlock for {formatPrice(PRICING.OUTREACH)}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModal}
        onClose={() => setShareModal(false)}
        candidateName={candidate.name}
        candidateId={candidate.id}
        step="evidence"
      />
    </>
  );
};

export default EvidenceReport;
