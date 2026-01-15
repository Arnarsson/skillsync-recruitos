import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
            <div className="flex space-x-1 mb-5 border-b border-white/[0.05] pb-1 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3 py-2 text-xs font-medium transition-colors rounded-t-md relative ${activeTab === tab.id
                            ? 'text-blue-400 bg-slate-800/50'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                            }`}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTabIndicator"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-5"
                    >
                        {/* Evidence Report Tab */}
                        {activeTab === 'evidence' && (
                            <>
                                {/* Deep Profile Analysis */}
                                {candidate.deepAnalysis && (
                                    <div className="bg-slate-800/30 border border-white/[0.08] rounded-lg p-5">
                                        <h4 className="text-xs font-medium text-blue-400 mb-3 flex items-center">
                                            <i className="fa-solid fa-magnifying-glass-chart mr-2"></i> Deep Profile Analysis
                                        </h4>
                                        <p className="text-sm text-slate-300 leading-relaxed">
                                            {candidate.deepAnalysis}
                                        </p>
                                    </div>
                                )}

                                {/* Trajectory & Indicators Side-by-Side */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Trajectory */}
                                    <div className="bg-slate-800/30 border border-white/[0.08] rounded-lg p-4">
                                        <h4 className="text-xs font-medium text-slate-400 mb-3">
                                            <i className="fa-solid fa-arrow-trend-up mr-2 text-blue-400"></i> Career Trajectory
                                        </h4>
                                        {candidate.persona?.careerTrajectory ? (
                                            <>
                                                <div className="grid grid-cols-2 gap-3 mb-3">
                                                    <div>
                                                        <div className="text-xs text-slate-500 mb-1">Avg Tenure</div>
                                                        <div className="text-xs font-medium text-white">{candidate.persona.careerTrajectory.averageTenure}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-slate-500 mb-1">Pattern</div>
                                                        <div className="text-xs font-medium text-white capitalize">{candidate.persona.careerTrajectory.tenurePattern.replace('-', ' ')}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-slate-500 mb-1">Growth</div>
                                                        <div className="text-xs font-medium text-emerald-400 capitalize">{candidate.persona.careerTrajectory.growthVelocity}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-slate-500 mb-1">Promotions</div>
                                                        <div className="text-xs font-medium text-blue-400 capitalize">{candidate.persona.careerTrajectory.promotionFrequency}</div>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-slate-500 pt-2 border-t border-white/[0.05]">
                                                    Role Progression: <span className="text-slate-400 capitalize">{candidate.persona.careerTrajectory.roleProgression}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-xs text-slate-500 py-4">
                                                <i className="fa-solid fa-circle-info mr-2 text-amber-400"></i>
                                                Career trajectory data unavailable.
                                            </div>
                                        )}
                                    </div>

                                    {/* Indicators */}
                                    <div className="bg-slate-800/30 border border-white/[0.08] rounded-lg p-4">
                                        <h4 className="text-xs font-medium text-slate-400 mb-3">
                                            <i className="fa-solid fa-fingerprint mr-2 text-blue-400"></i> Key Indicator
                                        </h4>
                                        {indicators.slice(0, 1).map((ind, i) => (
                                            <div key={i}>
                                                <div className="text-xs font-medium text-blue-400 mb-1">{ind.category}</div>
                                                <div className="text-sm font-medium text-white mb-2">{ind.label}</div>
                                                <div className="text-xs text-slate-400 border-l-2 border-slate-700/50 pl-3">
                                                    &quot;{ind.evidence?.text || 'No evidence provided'}&quot;
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Interview Guide */}
                                <div className="bg-slate-800/30 border border-white/[0.08] rounded-lg border-l-2 border-l-blue-500/50 overflow-hidden">
                                    <div className="p-5">
                                        <div className="flex items-center gap-3 mb-5">
                                            <div className="text-xl">🎯</div>
                                            <div>
                                                <h4 className="text-sm font-medium text-blue-300">Interview Guide</h4>
                                                <p className="text-xs text-slate-400 mt-0.5">Evidence-based questions to validate hypotheses</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {questions.map((q, i) => (
                                                <div key={i} className="bg-slate-800/50 rounded-md p-4 border border-white/[0.05]">
                                                    <div className="flex items-start gap-3 mb-2">
                                                        <div className="w-6 h-6 flex items-center justify-center bg-blue-500/10 text-blue-400 rounded text-xs font-medium flex-shrink-0 border border-blue-500/20">
                                                            {i + 1}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="text-sm text-white leading-relaxed mb-2">{q.question}</div>
                                                            <div className="bg-slate-900/50 rounded p-2 border border-white/[0.05]">
                                                                <div className="text-xs font-medium text-blue-400 mb-1 flex items-center">
                                                                    <i className="fa-solid fa-microscope mr-1.5"></i> Hypothesis to Test
                                                                </div>
                                                                <p className="text-xs text-slate-400 leading-relaxed">{q.reason}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
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
                            <div className="bg-slate-800/30 border border-white/[0.08] rounded-lg overflow-hidden">
                                <div className="bg-slate-800/50 px-4 py-3 border-b border-white/[0.05] flex justify-between items-center">
                                    <h4 className="text-xs font-medium text-blue-400">
                                        <i className="fa-solid fa-handshake-simple mr-2"></i> Company Match
                                    </h4>
                                    <div className="text-xs font-mono text-slate-400">Score: {candidate.companyMatch.score}/100</div>
                                </div>
                                <div className="p-4">
                                    <p className="text-sm text-slate-300 leading-relaxed mb-5 border-l-2 border-blue-500/30 pl-3">
                                        &quot;{candidate.companyMatch.analysis}&quot;
                                    </p>
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="flex-1 bg-emerald-500/5 rounded-lg p-4 border border-emerald-500/10">
                                            <div className="flex items-center mb-3">
                                                <div className="w-6 h-6 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center mr-2 border border-emerald-500/20">
                                                    <i className="fa-solid fa-thumbs-up text-xs"></i>
                                                </div>
                                                <h5 className="text-xs font-medium text-emerald-400">Alignment Signals</h5>
                                            </div>
                                            <ul className="space-y-2">
                                                {candidate.companyMatch.strengths.map((str, i) => (
                                                    <li key={i} className="text-xs text-slate-400 flex items-start">
                                                        <i className="fa-solid fa-check text-emerald-500/50 mt-0.5 mr-2 text-xs"></i>
                                                        {str}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="flex-1 bg-amber-500/5 rounded-lg p-4 border border-amber-500/10">
                                            <div className="flex items-center mb-3">
                                                <div className="w-6 h-6 rounded bg-amber-500/10 text-amber-400 flex items-center justify-center mr-2 border border-amber-500/20">
                                                    <i className="fa-solid fa-hand text-xs"></i>
                                                </div>
                                                <h5 className="text-xs font-medium text-amber-400">Friction Points</h5>
                                            </div>
                                            <ul className="space-y-2">
                                                {candidate.companyMatch.potentialFriction.map((fric, i) => (
                                                    <li key={i} className="text-xs text-slate-400 flex items-start">
                                                        <i className="fa-solid fa-exclamation text-amber-500/50 mt-0.5 mr-2 text-xs"></i>
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
                                <div className="bg-slate-800/30 border border-white/[0.08] border-dashed rounded-lg p-10 text-center">
                                    <div className="w-16 h-16 bg-slate-800/50 rounded-lg flex items-center justify-center mx-auto mb-4 border border-white/[0.08]">
                                        <i className="fa-solid fa-brain text-3xl text-slate-500"></i>
                                    </div>
                                    <h3 className="text-base font-medium text-white mb-2">Advanced Intelligence</h3>
                                    <p className="text-sm text-slate-400 mb-4 max-w-md mx-auto leading-relaxed">
                                        Unlock better candidate insights with network analysis, behavioral signals, and AI-verified evidence.
                                    </p>
                                </div>
                            )
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </section>
    );
};
