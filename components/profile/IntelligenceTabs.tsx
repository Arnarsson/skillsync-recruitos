import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Candidate } from '../../types';
import { GlassCard } from '../ui/GlassCard';
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

    type TabID = 'evidence' | 'persona' | 'company' | 'network' | 'advanced';

    const tabs: { id: TabID; label: string }[] = [
        { id: 'evidence', label: 'Evidence' },
        { id: 'persona', label: 'Persona' },
        { id: 'company', label: 'Match' },
        { id: 'network', label: 'Network' },
        { id: 'advanced', label: 'Advanced' }
    ];

    return (
        <section>
            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6 border-b border-white/5 pb-1 overflow-x-auto custom-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-[11px] font-bold transition-all uppercase tracking-widest rounded-t-lg relative ${activeTab === tab.id
                            ? 'text-emerald-400 bg-white/5'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                            }`}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTabIndicator"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                    >
                        {/* Evidence Report Tab */}
                        {activeTab === 'evidence' && (
                            <>
                                {/* Deep Profile Analysis */}
                                {candidate.deepAnalysis && (
                                    <GlassCard variant="neo" className="p-6 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <i className="fa-solid fa-brain text-4xl text-blue-500"></i>
                                        </div>
                                        <h4 className="text-xs font-bold text-blue-400 uppercase mb-3 flex items-center">
                                            <i className="fa-solid fa-magnifying-glass-chart mr-2"></i> Deep Profile Analysis
                                        </h4>
                                        <p className="text-sm text-slate-200 leading-relaxed font-light">
                                            {candidate.deepAnalysis}
                                        </p>
                                    </GlassCard>
                                )}

                                {/* Trajectory & Indicators Side-by-Side */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Trajectory */}
                                    <GlassCard variant="dark" className="p-5">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-4"><i className="fa-solid fa-arrow-trend-up mr-2 text-blue-400"></i> Career Trajectory</h4>
                                        {candidate.persona?.careerTrajectory ? (
                                            <>
                                                <div className="grid grid-cols-2 gap-3 mb-3">
                                                    <div>
                                                        <div className="text-[9px] text-slate-500 uppercase font-bold">Avg Tenure</div>
                                                        <div className="text-xs font-bold text-white mt-1">{candidate.persona.careerTrajectory.averageTenure}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[9px] text-slate-500 uppercase font-bold">Pattern</div>
                                                        <div className="text-xs font-bold text-white mt-1 capitalize">{candidate.persona.careerTrajectory.tenurePattern.replace('-', ' ')}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[9px] text-slate-500 uppercase font-bold">Growth</div>
                                                        <div className="text-xs font-bold text-emerald-400 mt-1 capitalize">{candidate.persona.careerTrajectory.growthVelocity}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[9px] text-slate-500 uppercase font-bold">Promotions</div>
                                                        <div className="text-xs font-bold text-purple-400 mt-1 capitalize">{candidate.persona.careerTrajectory.promotionFrequency}</div>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-slate-500 italic pt-2 border-t border-white/10">
                                                    Role Progression: <span className="text-slate-400 capitalize">{candidate.persona.careerTrajectory.roleProgression}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-xs text-slate-500 italic py-4">
                                                <i className="fa-solid fa-circle-info mr-2 text-yellow-500"></i>
                                                Career trajectory data unavailable.
                                            </div>
                                        )}
                                    </GlassCard>

                                    {/* Indicators */}
                                    <GlassCard variant="dark" className="p-5">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-4"><i className="fa-solid fa-fingerprint mr-2 text-purple-400"></i> Key Indicator</h4>
                                        {indicators.slice(0, 1).map((ind, i) => (
                                            <div key={i}>
                                                <div className="text-xs font-bold text-purple-400 uppercase mb-1">{ind.category}</div>
                                                <div className="text-sm font-bold text-white mb-2">{ind.label}</div>
                                                <div className="text-xs text-slate-400 font-mono border-l-2 border-slate-700/50 pl-3 italic">
                                                    &quot;{ind.evidence?.text || 'No evidence provided'}&quot;
                                                </div>
                                            </div>
                                        ))}
                                    </GlassCard>
                                </div>

                                {/* Interview Guide */}
                                <GlassCard variant="light" className="p-6 border-l-4 border-l-indigo-500/50">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="text-2xl bg-indigo-500/10 p-2 rounded-lg">🎯</div>
                                        <div>
                                            <h4 className="text-sm font-bold text-indigo-300 uppercase tracking-wide">Interview Guide</h4>
                                            <p className="text-xs text-slate-400 mt-0.5">Evidence-based questions to validate hypotheses</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {questions.map((q, i) => (
                                            <div key={i} className="bg-black/20 rounded-xl p-5 border border-white/5 hover:border-indigo-500/20 transition-all">
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div className="w-6 h-6 flex items-center justify-center bg-indigo-600/20 text-indigo-400 rounded-full text-xs font-bold flex-shrink-0 border border-indigo-500/30">
                                                        {i + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium text-white leading-relaxed mb-3">{q.question}</div>
                                                        <div className="bg-indigo-900/10 rounded-lg p-3 border border-indigo-500/10">
                                                            <div className="text-[10px] font-bold text-indigo-400 uppercase mb-1 flex items-center">
                                                                <i className="fa-solid fa-microscope mr-1.5"></i> Hypothesis to Test
                                                            </div>
                                                            <p className="text-xs text-slate-400 leading-relaxed italic">{q.reason}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </GlassCard>
                            </>
                        )}

                        {/* Persona Intelligence Tab */}
                        {activeTab === 'persona' && candidate.persona && (
                            <PersonaIntelligencePanel persona={candidate.persona} />
                        )}

                        {/* Company Match Tab */}
                        {activeTab === 'company' && candidate.companyMatch && (
                            <GlassCard variant="dark" className="overflow-hidden">
                                <div className="bg-black/20 px-5 py-3 border-b border-white/5 flex justify-between items-center">
                                    <h4 className="text-xs font-bold text-purple-400 uppercase"><i className="fa-solid fa-handshake-simple mr-2"></i> Company Match</h4>
                                    <div className="text-xs font-mono text-slate-400">Score: {candidate.companyMatch.score}/100</div>
                                </div>
                                <div className="p-5">
                                    <p className="text-sm text-slate-300 leading-relaxed mb-6 italic border-l-2 border-purple-500/30 pl-3">
                                        &quot;{candidate.companyMatch.analysis}&quot;
                                    </p>
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="flex-1 bg-emerald-900/10 rounded-xl p-4 border border-emerald-500/10">
                                            <div className="flex items-center mb-3">
                                                <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mr-2 border border-emerald-500/20">
                                                    <i className="fa-solid fa-thumbs-up text-xs"></i>
                                                </div>
                                                <h5 className="text-xs font-bold text-emerald-400 uppercase">Alignment Signals</h5>
                                            </div>
                                            <ul className="space-y-2">
                                                {candidate.companyMatch.strengths.map((str, i) => (
                                                    <li key={i} className="text-xs text-slate-400 flex items-start">
                                                        <i className="fa-solid fa-check text-emerald-500/50 mt-0.5 mr-2 text-[10px]"></i>
                                                        {str}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="flex-1 bg-amber-900/10 rounded-xl p-4 border border-amber-500/10">
                                            <div className="flex items-center mb-3">
                                                <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mr-2 border border-amber-500/20">
                                                    <i className="fa-solid fa-hand-paper text-xs"></i>
                                                </div>
                                                <h5 className="text-xs font-bold text-amber-400 uppercase">Friction Points</h5>
                                            </div>
                                            <ul className="space-y-2">
                                                {candidate.companyMatch.potentialFriction.map((fric, i) => (
                                                    <li key={i} className="text-xs text-slate-400 flex items-start">
                                                        <i className="fa-solid fa-exclamation text-amber-500/50 mt-0.5 mr-2 text-[10px]"></i>
                                                        {fric}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
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
                                <GlassCard variant="light" className="p-12 text-center border-dashed border-white/10">
                                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                                        <i className="fa-solid fa-brain text-4xl text-emerald-400"></i>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">Advanced Intelligence</h3>
                                    <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto leading-relaxed">
                                        Unlock 10x better candidate insights with network analysis, behavioral signals, and AI-verified evidence.
                                    </p>
                                </GlassCard>
                            )
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </section>
    );
};
