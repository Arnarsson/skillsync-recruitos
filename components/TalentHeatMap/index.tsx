import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../ui/GlassCard';
import { Candidate, FunnelStage, PRICING } from '../../types';
import { generateDeepProfile, generateNetworkDossier, analyzeCandidateProfile } from '../../services/geminiService';
import { candidateService } from '../../services/candidateService';
import { ToastType } from '../ToastNotification';
import { ScoreDistributionChart } from '../visualizations/ScoreDistributionChart';
import { CandidateCardSkeleton } from '../visualizations/CandidateCardSkeleton';
import { CandidateComparisonView } from '../visualizations/CandidateComparisonView';
import { useCandidateSourcing } from '../../hooks/useCandidateSourcing';
import { CandidateHeader } from '../candidates/CandidateHeader';
import { SourcingConsole } from '../candidates/SourcingConsole';
import { ImportModal } from '../candidates/ImportModal';
import { FilterToolbar } from '../candidates/FilterToolbar';
import { CandidateListElement } from '../candidates/CandidateListElement';

interface Props {
    jobContext: string;
    credits: number;
    onSpendCredits: (amount: number, description?: string) => void;
    onSelectCandidate: (candidate: Candidate) => void;
    addToast: (type: ToastType, message: string) => void;
}

const DEMO_CANDIDATE_PROFILE = `Sarah Chen
Senior Software Engineer at Stripe
Copenhagen, Denmark

About:
Passion about building scalable fintech solutions. Currently leading the European payments integration team at Stripe. Previously at Klarna where I helped scale their checkout platform to handle 2M+ daily transactions.

Experience:
• Senior Software Engineer, Stripe (2021 - Present)
  - Lead engineer for European payment integrations
  - Architected real-time fraud detection pipeline processing 500K events/sec
  - Mentored 4 junior engineers, 2 promoted to mid-level

• Software Engineer, Klarna (2018 - 2021)
  - Core contributor to checkout platform (React, Node.js)
  - Reduced payment latency by 40% through infrastructure optimization
  - Led migration from monolith to microservices

• Junior Developer, Danske Bank (2016 - 2018)
  - Built internal tools for transaction monitoring
  - First exposure to financial regulations and compliance

Education:
MSc Computer Science, Technical University of Denmark (DTU), 2016
BSc Software Engineering, Aarhus University, 2014

Skills: TypeScript, React, Node.js, Python, PostgreSQL, Redis, AWS, Kubernetes, Payment Systems`;

const ShortlistGrid: React.FC<Props> = ({ jobContext, credits, onSpendCredits, onSelectCandidate, addToast }) => {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pipeline' | 'sourcing'>('pipeline');

    // Modal & Action State
    const [showImport, setShowImport] = useState(false);
    const [importText, setImportText] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [isDemoLoading, setIsDemoLoading] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Sorting & Filtering State
    const [sortBy, setSortBy] = useState<'score-desc' | 'score-asc' | 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc'>('score-desc');
    const [filterScore, setFilterScore] = useState<'high' | 'medium' | 'low' | null>(null);
    const [filterArchetype, setFilterArchetype] = useState<string | null>(null);
    const [filterRisk, setFilterRisk] = useState<'high' | 'moderate' | 'low' | null>(null);

    // Multi-Select & Comparison State
    const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
    const [isComparisonMode, setIsComparisonMode] = useState(false);

    const onCandidateCreated = useCallback((candidate: Candidate) => {
        setCandidates(prev => {
            if (prev.some(c => c.id === candidate.id)) return prev;
            return [candidate, ...prev];
        });
    }, []);

    const {
        sourcingUrl,
        setSourcingUrl,
        isSourcing,
        sourcingLog,
        handleSourcingRun
    } = useCandidateSourcing({
        jobContext,
        credits,
        onSpendCredits,
        addToast,
        onCandidateCreated
    });

    const loadCandidates = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await candidateService.fetchAll();
            setCandidates(data);
        } catch (error: unknown) {
            console.error(error);
            addToast('error', 'Failed to load candidates from Database.');
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadCandidates();
    }, [loadCandidates]);

    const handleUnlockProfile = useCallback(async (e: React.MouseEvent, candidateId: string, candidateName: string) => {
        e.stopPropagation();
        if (credits < PRICING.DEEP_PROFILE) {
            addToast('error', "Insufficient credits for pilot.");
            return;
        }

        const candidate = candidates.find(c => c.id === candidateId);
        if (!candidate) return;

        setProcessingId(candidateId);
        addToast('info', `Generating Strategic Intelligence Package for ${candidateName}...`);

        try {
            const [deepProfileData, networkDossier] = await Promise.all([
                generateDeepProfile(candidate, jobContext),
                generateNetworkDossier(candidate, jobContext)
            ]);

            onSpendCredits(PRICING.DEEP_PROFILE, `Unlocked Strategic Intelligence Package: ${candidateName}`);

            const updatedCandidate = {
                ...candidate,
                unlockedSteps: [...candidate.unlockedSteps, FunnelStage.DEEP_PROFILE],
                ...deepProfileData,
                networkDossier
            };

            setCandidates(prev => prev.map(c => c.id === candidateId ? updatedCandidate : c));
            await candidateService.update(updatedCandidate);
            addToast('success', `Strategic Intelligence Ready: ${candidateName}`);

        } catch (error: unknown) {
            console.error(error);
            addToast('error', error instanceof Error ? error.message : "Failed to generate profile.");
        } finally {
            setProcessingId(null);
        }
    }, [credits, candidates, jobContext, onSpendCredits, addToast]);

    const handleImport = useCallback(async () => {
        if (!importText.trim()) return;
        if (!jobContext) {
            addToast('warning', "Please set a Job Context in Step 1 first.");
            return;
        }
        setIsImporting(true);
        try {
            const newCandidate = await analyzeCandidateProfile(importText, jobContext);
            await candidateService.create(newCandidate);
            setCandidates(prev => [newCandidate, ...prev]);
            setShowImport(false);
            setImportText('');
            onSpendCredits(10, `Imported Candidate: ${newCandidate.name}`);
            addToast('success', "Candidate Imported");
        } catch (error: unknown) {
            console.error(error);
            addToast('error', error instanceof Error ? error.message : "Failed to analyze candidate.");
        } finally {
            setIsImporting(false);
        }
    }, [importText, jobContext, onSpendCredits, addToast]);

    const handleLoadDemoCandidate = useCallback(async () => {
        if (!jobContext) {
            addToast('warning', "Please set a Job Context in Step 1 first.");
            return;
        }
        setIsDemoLoading(true);
        addToast('info', 'Analyzing demo candidate with AI...');
        try {
            const newCandidate = await analyzeCandidateProfile(DEMO_CANDIDATE_PROFILE, jobContext);
            await candidateService.create(newCandidate);
            setCandidates(prev => [newCandidate, ...prev]);
            addToast('success', "Demo candidate added to pipeline");
        } catch (error: unknown) {
            console.error(error);
            addToast('error', "Failed to analyze demo candidate.");
        } finally {
            setIsDemoLoading(false);
        }
    }, [jobContext, addToast]);

    const toggleCandidateSelection = useCallback((candidateId: string) => {
        setSelectedCandidateIds(prev => {
            if (prev.includes(candidateId)) {
                return prev.filter(id => id !== candidateId);
            } else {
                if (prev.length >= 3) {
                    addToast('warning', 'Maximum 3 candidates can be compared at once');
                    return prev;
                }
                return [...prev, candidateId];
            }
        });
    }, [addToast]);

    const handleDeleteCandidate = useCallback(async (id: string) => {
        const candidate = candidates.find(c => c.id === id);
        if (!candidate) return;
        if (window.confirm(`Delete ${candidate.name} from the pipeline?`)) {
            try {
                await candidateService.delete(id);
                setCandidates(prev => prev.filter(c => c.id !== id));
                addToast('success', `${candidate.name} deleted`);
            } catch (error: unknown) {
                console.error(error);
                addToast('error', 'Failed to delete candidate');
            }
        }
    }, [candidates, addToast]);

    const sortedCandidates = useMemo(() => {
        const sorted = [...candidates];
        switch (sortBy) {
            case 'score-desc': return sorted.sort((a, b) => b.alignmentScore - a.alignmentScore);
            case 'score-asc': return sorted.sort((a, b) => a.alignmentScore - b.alignmentScore);
            case 'date-asc': return sorted.reverse();
            case 'name-asc': return sorted.sort((a, b) => a.name.localeCompare(b.name));
            case 'name-desc': return sorted.sort((a, b) => b.name.localeCompare(a.name));
            default: return sorted;
        }
    }, [candidates, sortBy]);

    const availableArchetypes = useMemo(() => {
        const archetypes = new Set<string>();
        candidates.forEach(c => {
            if (c.persona?.archetype) {
                archetypes.add(c.persona.archetype);
            }
        });
        return Array.from(archetypes).sort();
    }, [candidates]);

    const filteredCandidates = useMemo(() => {
        let result = sortedCandidates;

        // 1. Filter by Score
        if (filterScore) {
            switch (filterScore) {
                case 'high': result = result.filter(c => c.alignmentScore >= 80); break;
                case 'medium': result = result.filter(c => c.alignmentScore >= 50 && c.alignmentScore < 80); break;
                case 'low': result = result.filter(c => c.alignmentScore < 50); break;
            }
        }

        // 2. Filter by Archetype
        if (filterArchetype) {
            result = result.filter(c => c.persona?.archetype === filterArchetype);
        }

        // 3. Filter by Risk
        if (filterRisk) {
            result = result.filter(c => {
                // Determine risk level based on score + explicit risks
                const hasHighRisk = c.risks.length >= 2 || (c.persona?.riskAssessment?.attritionRisk === 'high');
                const hasModerateRisk = c.risks.length === 1 || (c.persona?.riskAssessment?.attritionRisk === 'moderate');
                const isLowRisk = c.risks.length === 0 && (!c.persona?.riskAssessment || c.persona?.riskAssessment?.attritionRisk === 'low');

                if (filterRisk === 'high') return hasHighRisk;
                if (filterRisk === 'moderate') return hasModerateRisk;
                if (filterRisk === 'low') return isLowRisk;
                return true;
            });
        }

        return result;
    }, [sortedCandidates, filterScore, filterArchetype, filterRisk]);

    const hasNoCandidates = candidates.length === 0;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex flex-col bg-transparent" // Transparent to show App background
        >
            <CandidateHeader
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                handleLoadDemoCandidate={handleLoadDemoCandidate}
                isDemoLoading={isDemoLoading}
                handleSetShowImport={setShowImport}
                candidateCount={candidates.length}
            />

            {activeTab === 'sourcing' && (
                <div className="px-6 mb-4">
                    <SourcingConsole
                        sourcingUrl={sourcingUrl}
                        setSourcingUrl={setSourcingUrl}
                        handleSourcingRun={handleSourcingRun}
                        isSourcing={isSourcing}
                        sourcingLog={sourcingLog}
                    />
                </div>
            )}

            <ImportModal
                showImport={showImport}
                setShowImport={setShowImport}
                importText={importText}
                setImportText={setImportText}
                handleImport={handleImport}
                isImporting={isImporting}
            />

            {activeTab === 'pipeline' && !hasNoCandidates && (
                <div className="px-4 md:px-8 mb-4">
                    <GlassCard variant="light" className="p-4 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-blue-500/5 pointer-events-none"></div>
                        <div className="flex items-center justify-between mb-3 relative z-10">
                            <div>
                                <h3 className="text-xs font-bold text-white uppercase tracking-wide flex items-center">
                                    <i className="fa-solid fa-chart-pie mr-2 text-emerald-400"></i>
                                    Pipeline Intelligence
                                </h3>
                                <p className="text-[10px] text-slate-400 mt-0.5 ml-5">Real-time score distribution</p>
                            </div>
                            <div className="text-[10px] text-slate-400 bg-black/20 px-2 py-1 rounded border border-white/5">
                                <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-1.5 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                Top Match
                            </div>
                        </div>
                        <div className="relative z-10">
                            <ScoreDistributionChart candidates={candidates} height={140} />
                        </div>
                    </GlassCard>
                </div>
            )}

            {activeTab === 'pipeline' && !hasNoCandidates && (
                <FilterToolbar
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    filterScore={filterScore}
                    setFilterScore={(val) => setFilterScore(val as 'high' | 'medium' | 'low' | null)}
                    filterArchetype={filterArchetype}
                    setFilterArchetype={setFilterArchetype}
                    filterRisk={filterRisk}
                    setFilterRisk={(val) => setFilterRisk(val as 'high' | 'moderate' | 'low' | null)}
                    availableArchetypes={availableArchetypes}
                    selectedCandidateIds={selectedCandidateIds}
                    openComparison={() => setIsComparisonMode(true)}
                    clearSelection={() => setSelectedCandidateIds([])}
                    renderedCount={filteredCandidates.length}
                    totalCount={candidates.length}
                />
            )}

            <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-3 border-b border-white/5 text-[10px] font-bold uppercase text-slate-500 tracking-widest">
                <div className="col-span-4 pl-4">Candidate & Persona</div>
                <div className="col-span-2 text-center">Match Score</div>
                <div className="col-span-4">Evidence Summary</div>
                <div className="col-span-2 text-right pr-4">Action</div>
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 space-y-3"
            >
                {isLoading ? (
                    <div className="space-y-3">
                        <CandidateCardSkeleton />
                        <CandidateCardSkeleton />
                        <CandidateCardSkeleton />
                    </div>
                ) : hasNoCandidates ? (
                    <GlassCard variant="dark" className="flex flex-col items-center justify-center p-12 opacity-80 mt-8">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/5">
                            <i className="fa-solid fa-users-slash text-3xl text-slate-600"></i>
                        </div>
                        <h3 className="text-white font-bold text-lg mb-2">Pipeline Empty</h3>
                        <p className="text-sm text-slate-400 mb-8 max-w-sm text-center leading-relaxed">
                            {activeTab === 'sourcing' ? 'Use the Sourcing Agent above to find candidates.' : 'Import a profile manually or try the demo data.'}
                        </p>
                        {activeTab !== 'sourcing' && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowImport(true)}
                                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/40 transition-all flex items-center"
                            >
                                <i className="fa-solid fa-plus mr-2"></i> Import First Candidate
                            </motion.button>
                        )}
                    </GlassCard>
                ) : (
                    <>
                        {(isSourcing || isImporting) && <CandidateCardSkeleton />}
                        <AnimatePresence>
                            {filteredCandidates.map((c) => (
                                <motion.div key={c.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                                    <CandidateListElement
                                        candidate={c}
                                        isSelected={selectedCandidateIds.includes(c.id)}
                                        isDeepProfileUnlocked={c.unlockedSteps.includes(FunnelStage.DEEP_PROFILE)}
                                        isProcessingThis={processingId === c.id}
                                        onToggleSelection={toggleCandidateSelection}
                                        onDelete={handleDeleteCandidate}
                                        onSelect={onSelectCandidate}
                                        onUnlock={handleUnlockProfile}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </>
                )}

                {!hasNoCandidates && activeTab !== 'sourcing' && (
                    <button
                        onClick={() => setShowImport(true)}
                        className="md:hidden w-full py-4 bg-white/5 border border-dashed border-white/10 text-slate-400 rounded-xl text-sm font-bold mt-4 hover:bg-white/10 hover:text-white transition-all"
                    >
                        <i className="fa-solid fa-plus mr-2"></i> Import Candidate
                    </button>
                )}
            </motion.div>

            {isComparisonMode && (
                <CandidateComparisonView
                    candidates={candidates.filter(c => selectedCandidateIds.includes(c.id))}
                    onClose={() => setIsComparisonMode(false)}
                />
            )}
        </motion.div>
    );
};

export default ShortlistGrid;
