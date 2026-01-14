import React, { useState } from 'react';
import { Candidate } from '../../types';
import { PersonaIntelligencePanel } from '../visualizations/PersonaIntelligencePanel';
import { NetworkDossierPanel } from '../visualizations/NetworkDossierPanel';
import { AdvancedProfilePanel } from '../visualizations/AdvancedProfilePanel';
import { ToastType } from '../ToastNotification';

interface IntelligenceTabsProps {
    candidate: Candidate;
    addToast: (type: ToastType, message: string) => void;
}

export const IntelligenceTabs: React.FC<IntelligenceTabsProps> = ({ candidate, addToast }) => {
    const [activeTab, setActiveTab] = useState<'evidence' | 'persona' | 'company' | 'network' | 'advanced'>('evidence');
    const [isRefreshingAdvanced, setIsRefreshingAdvanced] = useState(false);

    const indicators = candidate.indicators || [];
    const questions = candidate.interviewGuide || [];

    return (
        <section>
            {/* Tab Navigation */}
            <div className="flex space-x-6 mb-6 border-b border-slate-900 pb-px">
                <button
                    onClick={() => setActiveTab('evidence')}
                    className={`pb-3 text-[11px] font-semibold transition-all uppercase tracking-widest ${activeTab === 'evidence'
                        ? 'text-slate-100 border-b-2 border-slate-300'
                        : 'text-slate-600 hover:text-slate-400'
                        }`}
                >
                    Evidence
                </button>
                <button
                    onClick={() => setActiveTab('persona')}
                    className={`pb-3 text-[11px] font-semibold transition-all uppercase tracking-widest ${activeTab === 'persona'
                        ? 'text-slate-100 border-b-2 border-slate-300'
                        : 'text-slate-600 hover:text-slate-400'
                        }`}
                >
                    Persona
                </button>
                <button
                    onClick={() => setActiveTab('company')}
                    className={`pb-3 text-[11px] font-semibold transition-all uppercase tracking-widest ${activeTab === 'company'
                        ? 'text-slate-100 border-b-2 border-slate-300'
                        : 'text-slate-600 hover:text-slate-400'
                        }`}
                >
                    Match
                </button>
                <button
                    onClick={() => setActiveTab('network')}
                    className={`pb-3 text-[11px] font-semibold transition-all uppercase tracking-widest ${activeTab === 'network'
                        ? 'text-slate-100 border-b-2 border-slate-300'
                        : 'text-slate-600 hover:text-slate-400'
                        }`}
                >
                    Network
                </button>
                <button
                    onClick={() => setActiveTab('advanced')}
                    className={`pb-3 text-[11px] font-semibold transition-all uppercase tracking-widest ${activeTab === 'advanced'
                        ? 'text-slate-100 border-b-2 border-slate-300'
                        : 'text-slate-600 hover:text-slate-400'
                        }`}
                >
                    Advanced
                </button>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
                {/* Evidence Report Tab */}
                {activeTab === 'evidence' && (
                    <>
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

                        {/* Trajectory & Indicators Side-by-Side */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Trajectory */}
                            <div className="bg-apex-800/30 rounded-lg p-5 border border-apex-700">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-4"><i className="fa-solid fa-arrow-trend-up mr-2 text-blue-400"></i> Career Trajectory</h4>
                                {candidate.persona?.careerTrajectory ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <div>
                                                <div className="text-[9px] text-slate-600 uppercase font-bold">Avg Tenure</div>
                                                <div className="text-xs font-bold text-white mt-1">{candidate.persona.careerTrajectory.averageTenure}</div>
                                            </div>
                                            <div>
                                                <div className="text-[9px] text-slate-600 uppercase font-bold">Pattern</div>
                                                <div className="text-xs font-bold text-white mt-1 capitalize">{candidate.persona.careerTrajectory.tenurePattern.replace('-', ' ')}</div>
                                            </div>
                                            <div>
                                                <div className="text-[9px] text-slate-600 uppercase font-bold">Growth</div>
                                                <div className="text-xs font-bold text-emerald-400 mt-1 capitalize">{candidate.persona.careerTrajectory.growthVelocity}</div>
                                            </div>
                                            <div>
                                                <div className="text-[9px] text-slate-600 uppercase font-bold">Promotions</div>
                                                <div className="text-xs font-bold text-purple-400 mt-1 capitalize">{candidate.persona.careerTrajectory.promotionFrequency}</div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-500 italic pt-2 border-t border-apex-700">
                                            Role Progression: <span className="text-slate-400 capitalize">{candidate.persona.careerTrajectory.roleProgression}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-xs text-slate-500 italic py-4">
                                        <i className="fa-solid fa-circle-info mr-2 text-yellow-500"></i>
                                        Career trajectory data unavailable.
                                    </div>
                                )}
                            </div>

                            {/* Indicators */}
                            <div className="bg-apex-800/30 rounded-lg p-5 border border-apex-700">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-4"><i className="fa-solid fa-fingerprint mr-2 text-purple-400"></i> Key Indicator</h4>
                                {indicators.slice(0, 1).map((ind, i) => (
                                    <div key={i}>
                                        <div className="text-xs font-bold text-purple-400 uppercase mb-1">{ind.category}</div>
                                        <div className="text-sm font-bold text-white mb-2">{ind.label}</div>
                                        <div className="text-xs text-slate-400 font-mono border-l border-slate-700 pl-2">
                                            &quot;{ind.evidence.text}&quot;
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Interview Guide Component extracted later if needed or kept here for simplicity */}
                        <div id="interview-guide" className="mt-8 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 rounded-xl p-6 border-2 border-indigo-500/30">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="text-3xl">🎯</div>
                                <div>
                                    <h4 className="text-lg font-bold text-indigo-300 uppercase tracking-wide">Interview Guide</h4>
                                    <p className="text-xs text-slate-400 mt-1">Evidence-based questions to validate hypotheses</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {questions.map((q, i) => (
                                    <div key={i} className="bg-apex-800/50 rounded-lg p-5 border border-apex-700/50 hover:border-indigo-500/30 transition-all">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="w-7 h-7 flex items-center justify-center bg-indigo-600 rounded-full text-sm font-bold text-white flex-shrink-0">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-bold text-white leading-relaxed mb-2">{q.question}</div>
                                                <div className="bg-apex-900/50 rounded-lg p-3 mb-3">
                                                    <div className="text-[10px] font-bold text-indigo-400 uppercase mb-1 flex items-center">
                                                        <i className="fa-solid fa-microscope mr-1"></i> Hypothesis to Test
                                                    </div>
                                                    <p className="text-xs text-slate-300 leading-relaxed">{q.reason}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Persona Intelligence Tab */}
                {activeTab === 'persona' && candidate.persona && (
                    <PersonaIntelligencePanel persona={candidate.persona} />
                )}

                {/* Company Match Tab */}
                {activeTab === 'company' && candidate.companyMatch && (
                    <div className="bg-apex-800/30 rounded-lg border border-apex-700 overflow-hidden">
                        <div className="bg-apex-800/50 px-5 py-3 border-b border-apex-700 flex justify-between items-center">
                            <h4 className="text-xs font-bold text-purple-400 uppercase"><i className="fa-solid fa-handshake-simple mr-2"></i> Company Match</h4>
                            <div className="text-xs font-mono text-slate-500">Score: {candidate.companyMatch.score}/100</div>
                        </div>
                        <div className="p-5">
                            <p className="text-sm text-slate-300 leading-relaxed mb-6 italic border-l-2 border-purple-500/30 pl-3">
                                &quot;{candidate.companyMatch.analysis}&quot;
                            </p>
                            <div className="flex flex-col md:flex-row gap-0 md:gap-px bg-apex-700/50 rounded-lg overflow-hidden border border-apex-700">
                                <div className="flex-1 bg-apex-800/50 p-4">
                                    <div className="flex items-center mb-3">
                                        <div className="w-6 h-6 rounded-full bg-emerald-900/40 text-emerald-400 flex items-center justify-center mr-2 border border-emerald-500/20">
                                            <i className="fa-solid fa-thumbs-up text-xs"></i>
                                        </div>
                                        <h5 className="text-xs font-bold text-emerald-400 uppercase">Alignment Signals</h5>
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
                                <div className="flex-1 bg-apex-800/50 p-4">
                                    <div className="flex items-center mb-3">
                                        <div className="w-6 h-6 rounded-full bg-amber-900/40 text-amber-400 flex items-center justify-center mr-2 border border-amber-500/20">
                                            <i className="fa-solid fa-hand-paper text-xs"></i>
                                        </div>
                                        <h5 className="text-xs font-bold text-amber-400 uppercase">Friction Points</h5>
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

                {/* Network Dossier Tab */}
                {activeTab === 'network' && (
                    <NetworkDossierPanel dossier={candidate.networkDossier} />
                )}

                {/* Advanced Intelligence Tab */}
                {activeTab === 'advanced' && (
                    candidate.advancedProfile ? (
                        <AdvancedProfilePanel
                            advancedProfile={candidate.advancedProfile}
                            candidate={candidate}
                            onRefresh={() => {
                                setIsRefreshingAdvanced(true);
                                addToast('info', 'Advanced profile refresh triggered');
                                setTimeout(() => setIsRefreshingAdvanced(false), 1000);
                            }}
                            isRefreshing={isRefreshingAdvanced}
                        />
                    ) : (
                        <div className="bg-apex-800/30 border border-dashed border-apex-700 rounded-lg p-8 text-center">
                            <i className="fa-solid fa-brain text-4xl text-emerald-400 mb-4"></i>
                            <h3 className="text-lg font-bold text-slate-200 mb-2">Advanced Intelligence</h3>
                            <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
                                Unlock 10x better candidate insights with network analysis, behavioral signals, and AI-verified evidence.
                            </p>
                        </div>
                    )
                )}
            </div>
        </section>
    );
};
