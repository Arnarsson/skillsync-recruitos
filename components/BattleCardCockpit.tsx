
import React, { useState } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { Candidate, FunnelStage, WorkstyleIndicator, InterviewQuestion, PRICING, ConfidenceLevel, CREDITS_TO_EUR } from '../types';
import { ToastType } from './ToastNotification';

interface Props {
  candidate: Candidate | null;
  credits: number;
  onSpendCredits: (amount: number, description?: string) => void;
  onClose: () => void;
  onOpenOutreach: (c: Candidate) => void;
  addToast: (type: ToastType, message: string) => void;
}

const DeepProfile: React.FC<Props> = ({ candidate, credits, onSpendCredits, onClose, onOpenOutreach, addToast }) => {
  const [showBreakdown, setShowBreakdown] = useState(true);
  
  // Use mock data from candidate object or fallbacks
  const indicators = candidate?.indicators || [];
  const questions = candidate?.interviewGuide || [];

  if (!candidate) return null;

  const isOutreachUnlocked = candidate.unlockedSteps.includes(FunnelStage.OUTREACH);

  const handleUnlockOutreach = () => {
    if (credits < PRICING.OUTREACH) {
        addToast('error', "Insufficient credits.");
        return;
    }
    onSpendCredits(PRICING.OUTREACH, `Unlocked Outreach Protocol: ${candidate.name}`);
    addToast('success', "Outreach Protocol Unlocked");
    onOpenOutreach(candidate);
  };

  const handleRefresh = () => {
      if (credits < PRICING.REFRESH) {
          addToast('error', "Insufficient credits.");
          return;
      }
      if(window.confirm(`Refresh data for 1 Credit (~€${(PRICING.REFRESH * CREDITS_TO_EUR).toFixed(2)})?`)) {
          onSpendCredits(PRICING.REFRESH, `Manual Profile Refresh: ${candidate.name}`);
          addToast('success', "Profile refreshed");
      }
  };

  // Prepare Data for Radar Chart with fallbacks
  const radarData = candidate.scoreBreakdown ? [
      { subject: 'Skills', A: candidate.scoreBreakdown.skills?.percentage || 0, fullMark: 100 },
      { subject: 'Exp.', A: candidate.scoreBreakdown.experience?.percentage || 0, fullMark: 100 },
      { subject: 'Industry', A: candidate.scoreBreakdown.industry?.percentage || 0, fullMark: 100 },
      { subject: 'Seniority', A: candidate.scoreBreakdown.seniority?.percentage || 0, fullMark: 100 },
      { subject: 'Location', A: candidate.scoreBreakdown.location?.percentage || 0, fullMark: 100 },
  ] : [];

  return (
    <div className="fixed inset-y-0 right-0 left-0 md:left-auto md:w-[700px] bg-apex-900 border-l border-apex-700 shadow-2xl transform transition-transform duration-300 z-50 flex flex-col font-sans">
      
      {/* 1. Header Area */}
      <div className="p-4 md:p-6 bg-apex-800 border-b border-apex-700 flex justify-between items-start">
        <div className="flex items-center space-x-3 md:space-x-5">
             <img src={candidate.avatar} alt="avatar" className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-emerald-500/50 shadow-lg" />
             <div>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-1">{candidate.name}</h2>
                <div className="flex items-center text-xs text-slate-400 space-x-3">
                    <span><i className="fa-solid fa-briefcase mr-1"></i> {candidate.yearsExperience}y exp</span>
                    <span><i className="fa-solid fa-location-dot mr-1"></i> {candidate.location}</span>
                </div>
             </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
            <div className="flex items-center space-x-2">
                <button 
                    onClick={handleRefresh}
                    className="hidden md:flex text-[10px] text-slate-400 hover:text-white items-center bg-apex-900 px-2 py-1 rounded border border-apex-700 transition-colors"
                    title="Refresh from LinkedIn (1 Credit)"
                >
                    <i className="fa-solid fa-rotate mr-1"></i> Refresh
                </button>
                <button onClick={onClose} className="text-slate-500 hover:text-white p-1 ml-2"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>
            <div className="flex items-center space-x-2 hidden md:flex">
                 <button className="text-[10px] text-slate-400 hover:text-white flex items-center bg-apex-900 px-2 py-1 rounded border border-apex-700 transition-colors">
                    <i className="fa-solid fa-share-nodes mr-1"></i> Share
                 </button>
                 <button className="text-[10px] text-slate-400 hover:text-white flex items-center bg-apex-900 px-2 py-1 rounded border border-apex-700 transition-colors">
                    <i className="fa-solid fa-file-pdf mr-1"></i> PDF
                 </button>
            </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
        
        {/* STEP 2: Alignment & Evidence */}
        <section>
            <div className="flex items-center justify-between mb-4 border-b border-apex-700 pb-2">
                <div className="flex items-center space-x-2">
                    <span className="text-emerald-500 font-mono text-[10px] uppercase tracking-widest bg-emerald-900/20 px-2 py-0.5 rounded">Step 2: Match Score & Evidence</span>
                </div>
                <div className="text-xs text-slate-500">PAID ({PRICING.SHORTLIST} Cr)</div>
            </div>

            <div className="bg-apex-800/50 rounded-xl p-4 md:p-6 border border-apex-700">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Visual Score (Radar) */}
                    <div className="w-full md:w-1/2 flex flex-col items-center">
                        <div className="relative w-full h-48">
                            {radarData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                        <PolarGrid stroke="#334155" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar name={candidate.name} dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px', color: '#fff' }} 
                                            itemStyle={{ color: '#10b981' }}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-xs text-slate-500">No score data</div>
                            )}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <div className="text-2xl font-bold text-white">{candidate.alignmentScore}%</div>
                                <div className="text-[9px] uppercase text-emerald-500 font-bold">Fit Score</div>
                            </div>
                        </div>
                    </div>

                    {/* Evidence List */}
                    <div className="w-full md:w-1/2 space-y-4">
                         <div>
                            <h4 className="text-xs font-bold text-emerald-400 uppercase mb-2"><i className="fa-regular fa-circle-check mr-1"></i> Key Evidence</h4>
                            <ul className="space-y-2">
                                {candidate.keyEvidence?.slice(0,3).map((item, i) => (
                                    <li key={i} className="text-xs text-slate-300 leading-tight flex items-start">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 mt-1 mr-2 flex-shrink-0"></span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                         <div>
                            <h4 className="text-xs font-bold text-red-400 uppercase mb-2"><i className="fa-solid fa-triangle-exclamation mr-1"></i> Risks</h4>
                            <ul className="space-y-2">
                                {candidate.risks?.slice(0,3).map((item, i) => (
                                    <li key={i} className="text-xs text-slate-300 leading-tight flex items-start">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500/50 mt-1 mr-2 flex-shrink-0"></span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-apex-700/50 text-[10px] text-slate-500 flex justify-between items-center">
                     <span>Score Algorithm v2.3</span>
                     <button onClick={() => setShowBreakdown(!showBreakdown)} className="hover:text-emerald-400">
                         {showBreakdown ? 'Hide Breakdown' : 'Show Details'}
                     </button>
                </div>
            </div>
        </section>

        {/* STEP 3: Evidence Report */}
        <section>
            <div className="flex items-center justify-between mb-4 border-b border-apex-700 pb-2">
                 <div className="flex items-center space-x-2">
                    <span className="text-blue-500 font-mono text-[10px] uppercase tracking-widest bg-blue-900/20 px-2 py-0.5 rounded">Step 3: Candidate Evidence Report</span>
                </div>
            </div>

            <div className="space-y-6">
                
                {/* Deep Profile Analysis */}
                {candidate.deepAnalysis && (
                    <div className="bg-gradient-to-br from-apex-800 to-apex-800/50 rounded-lg p-5 border border-apex-700 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <i className="fa-solid fa-brain text-4xl text-blue-500"></i>
                        </div>
                        
                        <h4 className="text-xs font-bold text-blue-400 uppercase mb-3"><i className="fa-solid fa-magnifying-glass-chart mr-2"></i> Deep Profile Analysis</h4>
                        <p className="text-sm text-slate-300 leading-relaxed font-light">
                            {candidate.deepAnalysis}
                        </p>
                    </div>
                )}
                
                {/* Company Match Analysis (Improved Visuals) */}
                {candidate.companyMatch && (
                    <div className="bg-apex-800/30 rounded-lg border border-apex-700 overflow-hidden">
                        <div className="bg-apex-800/50 px-5 py-3 border-b border-apex-700 flex justify-between items-center">
                             <h4 className="text-xs font-bold text-purple-400 uppercase"><i className="fa-solid fa-handshake-simple mr-2"></i> Company Match</h4>
                             <div className="text-[10px] font-mono text-slate-500">Score: {candidate.companyMatch.score}/100</div>
                        </div>

                        <div className="p-5">
                            <p className="text-sm text-slate-300 leading-relaxed mb-6 italic border-l-2 border-purple-500/30 pl-3">
                                "{candidate.companyMatch.analysis}"
                            </p>

                            <div className="flex flex-col md:flex-row gap-0 md:gap-px bg-apex-700/50 rounded-lg overflow-hidden border border-apex-700">
                                {/* Strengths */}
                                <div className="flex-1 bg-apex-800/50 p-4">
                                    <div className="flex items-center mb-3">
                                        <div className="w-6 h-6 rounded-full bg-emerald-900/40 text-emerald-400 flex items-center justify-center mr-2 border border-emerald-500/20">
                                            <i className="fa-solid fa-thumbs-up text-[10px]"></i>
                                        </div>
                                        <h5 className="text-[10px] font-bold text-emerald-400 uppercase">Alignment Signals</h5>
                                    </div>
                                    <ul className="space-y-2">
                                        {candidate.companyMatch.strengths.map((str, i) => (
                                            <li key={i} className="text-xs text-slate-400 flex items-start">
                                                <i className="fa-solid fa-plus text-emerald-500/50 mt-1 mr-2 text-[8px]"></i>
                                                {str}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                
                                {/* Friction */}
                                <div className="flex-1 bg-apex-800/50 p-4">
                                    <div className="flex items-center mb-3">
                                        <div className="w-6 h-6 rounded-full bg-amber-900/40 text-amber-400 flex items-center justify-center mr-2 border border-amber-500/20">
                                            <i className="fa-solid fa-hand-paper text-[10px]"></i>
                                        </div>
                                        <h5 className="text-[10px] font-bold text-amber-400 uppercase">Friction Points</h5>
                                    </div>
                                    <ul className="space-y-2">
                                        {candidate.companyMatch.potentialFriction.map((fric, i) => (
                                            <li key={i} className="text-xs text-slate-400 flex items-start">
                                                <i className="fa-solid fa-minus text-amber-500/50 mt-1 mr-2 text-[8px]"></i>
                                                {fric}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Trajectory & Indicators Side-by-Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {/* Trajectory */}
                    <div className="bg-apex-800/30 rounded-lg p-5 border border-apex-700">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-4"><i className="fa-solid fa-arrow-trend-up mr-2 text-blue-400"></i> Trajectory</h4>
                        <div className="flex justify-between mb-4 text-center">
                            <div>
                                <div className="text-[9px] text-slate-600 uppercase font-bold">Avg Tenure</div>
                                <div className="text-sm font-bold text-white mt-1">{candidate.avgTenure || 'N/A'}</div>
                            </div>
                            <div>
                                <div className="text-[9px] text-slate-600 uppercase font-bold">Pace</div>
                                <div className="text-sm font-bold text-white mt-1">{candidate.progressionPace || 'N/A'}</div>
                            </div>
                        </div>
                        <div className="text-[10px] text-slate-400 italic">
                            "{candidate.trajectoryEvidence}"
                        </div>
                    </div>

                    {/* Indicators */}
                    <div className="bg-apex-800/30 rounded-lg p-5 border border-apex-700">
                         <h4 className="text-xs font-bold text-slate-400 uppercase mb-4"><i className="fa-solid fa-fingerprint mr-2 text-purple-400"></i> Key Indicator</h4>
                         {indicators.slice(0,1).map((ind, i) => (
                            <div key={i}>
                                <div className="text-[10px] font-bold text-purple-400 uppercase mb-1">{ind.category}</div>
                                <div className="text-sm font-bold text-white mb-2">{ind.label}</div>
                                <div className="text-[10px] text-slate-400 font-mono border-l border-slate-700 pl-2">
                                    "{ind.evidence.text}"
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Spec Compliant Disclaimer */}
                <div className="bg-yellow-900/10 border border-yellow-900/30 p-3 rounded flex items-start">
                    <i className="fa-solid fa-triangle-exclamation text-yellow-500 mt-0.5 mr-3 text-xs"></i>
                    <p className="text-[10px] text-yellow-600/80 leading-relaxed font-mono">
                        <strong>⚠️ Decision Support Notice:</strong> This analysis provides evidence-based indicators from public professional history. It is not a diagnostic assessment and should be verified during the interview process. Final hiring decisions must involve human judgment.
                    </p>
                </div>

                {/* Interview Guide */}
                <div className="mt-6">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Interview Guide</h4>
                    <ul className="space-y-2">
                        {questions.map((q, i) => (
                            <li key={i} className="flex items-start text-xs text-slate-300">
                                <span className="w-5 h-5 flex items-center justify-center bg-apex-800 rounded-full text-[10px] font-bold text-slate-500 mr-3 flex-shrink-0">{i+1}</span>
                                <span>
                                    {q.question} <span className="text-slate-500 block mt-0.5 text-[10px]">Reason: {q.reason}</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

            </div>
        </section>

        {/* STEP 4 Preview / Unlock */}
        <section className="pt-4 border-t border-apex-700/50 pb-8">
             <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center space-x-2">
                    <span className="text-slate-400 font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded">Step 4: Outreach Protocol</span>
                </div>
            </div>

            {isOutreachUnlocked ? (
                 <div className="bg-apex-800/30 border border-apex-700 rounded-lg p-5">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] bg-emerald-900 text-emerald-400 px-2 py-1 rounded font-bold uppercase">Recommended: Warm Intro</span>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">The Hook</div>
                            <div className="p-3 bg-apex-900 border border-apex-800 rounded text-sm text-slate-300">
                                Shared connection: {candidate.connectionPath || 'Network check required'}
                            </div>
                        </div>
                        <button 
                            onClick={() => onOpenOutreach(candidate)}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded shadow-lg shadow-emerald-900/20 transition-all"
                        >
                            Open Outreach Suite <i className="fa-solid fa-arrow-up-right-from-square ml-2"></i>
                        </button>
                    </div>
                 </div>
            ) : (
                <div className="bg-apex-800/20 border border-dashed border-apex-700 rounded-lg p-8 text-center">
                    <div className="w-12 h-12 bg-apex-800 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-600">
                        <i className="fa-solid fa-lock"></i>
                    </div>
                    <h3 className="text-sm font-bold text-slate-300 mb-1">Unlock Outreach Protocol</h3>
                    <p className="text-xs text-slate-500 mb-4 max-w-xs mx-auto">Reveal connection paths, shared context hooks, and AI-drafted messages.</p>
                    <button 
                        onClick={handleUnlockOutreach}
                        className="px-6 py-2 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-400 text-xs font-bold rounded border border-slate-600 transition-all"
                    >
                        Unlock for {PRICING.OUTREACH} Credits
                    </button>
                </div>
            )}
        </section>

      </div>
    </div>
  );
};

export default DeepProfile;
