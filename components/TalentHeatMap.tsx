import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Candidate, FunnelStage, PRICING } from '../types';
import { generateDeepProfile, generateNetworkDossier, analyzeCandidateProfile } from '../services/geminiService';
import { candidateService } from '../services/candidateService';
import { ToastType } from './ToastNotification';
import { ScoreDistributionChart } from './visualizations/ScoreDistributionChart';
import { CandidateCardSkeleton } from './visualizations/CandidateCardSkeleton';
import { CandidateComparisonView } from './visualizations/CandidateComparisonView';
import { useCandidateSourcing } from '../hooks/useCandidateSourcing';
import { CandidateHeader } from './candidates/CandidateHeader';
import { SourcingConsole } from './candidates/SourcingConsole';
import { ImportModal } from './candidates/ImportModal';
import { FilterToolbar } from './candidates/FilterToolbar';
import { CandidateListElement } from './candidates/CandidateListElement';

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

    // Multi-Select & Comparison State
    const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
    const [isComparisonMode, setIsComparisonMode] = useState(false);

    const onCandidateCreated = useCallback((candidate: Candidate) => {
        setCandidates(prev => [candidate, ...prev]);
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

    const filteredCandidates = useMemo(() => {
        if (!filterScore) return sortedCandidates;
        switch (filterScore) {
            case 'high': return sortedCandidates.filter(c => c.alignmentScore >= 80);
            case 'medium': return sortedCandidates.filter(c => c.alignmentScore >= 50 && c.alignmentScore < 80);
            case 'low': return sortedCandidates.filter(c => c.alignmentScore < 50);
            default: return sortedCandidates;
        }
    }, [sortedCandidates, filterScore]);

    const hasNoCandidates = candidates.length === 0;

    return (
        <div className="h-full flex flex-col bg-slate-950">
            <CandidateHeader
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                handleLoadDemoCandidate={handleLoadDemoCandidate}
                isDemoLoading={isDemoLoading}
                handleSetShowImport={setShowImport}
                candidateCount={candidates.length}
            />

            {activeTab === 'sourcing' && (
                <SourcingConsole
                    sourcingUrl={sourcingUrl}
                    setSourcingUrl={setSourcingUrl}
                    handleSourcingRun={handleSourcingRun}
                    isSourcing={isSourcing}
                    sourcingLog={sourcingLog}
                />
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
                <div className="px-6 py-4 bg-apex-800/20 border-b border-apex-700" style={{ minHeight: '240px' }}>
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide">Pipeline Distribution</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Score distribution across all candidates</p>
                        </div>
                        <div className="text-xs text-slate-500">
                            <span className="inline-block w-3 h-3 bg-emerald-600 rounded mr-1.5"></span>
                            Selected candidate
                        </div>
                    </div>
                    <ScoreDistributionChart candidates={candidates} height={180} />
                </div>
            )}

            {activeTab === 'pipeline' && !hasNoCandidates && (
                <FilterToolbar
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    filterScore={filterScore}
                    setFilterScore={setFilterScore}
                    selectedCandidateIds={selectedCandidateIds}
                    openComparison={() => setIsComparisonMode(true)}
                    clearSelection={() => setSelectedCandidateIds([])}
                    renderedCount={filteredCandidates.length}
                    totalCount={candidates.length}
                />
            )}

            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-apex-800 border-b border-apex-700 text-xs font-bold uppercase text-slate-500 tracking-wider">
                <div className="col-span-4">Candidate & Persona</div>
                <div className="col-span-2 text-center">Match Score</div>
                <div className="col-span-4">Evidence Summary</div>
                <div className="col-span-2 text-right">Action</div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-3">
                {isLoading ? (
                    <div className="space-y-3">
                        <CandidateCardSkeleton />
                        <CandidateCardSkeleton />
                        <CandidateCardSkeleton />
                    </div>
                ) : hasNoCandidates ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-60">
                        <div className="w-16 h-16 bg-apex-800 rounded-full flex items-center justify-center mb-4">
                            <i className="fa-solid fa-users-slash text-2xl text-slate-600"></i>
                        </div>
                        <h3 className="text-white font-bold mb-2">Pipeline Empty</h3>
                        <p className="text-sm text-slate-500 mb-6 max-w-sm text-center">
                            {activeTab === 'sourcing' ? 'Use the Sourcing Agent above to find candidates.' : 'Import a profile to start.'}
                        </p>
                        {activeTab !== 'sourcing' && (
                            <button
                                onClick={() => setShowImport(true)}
                                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg transition-all"
                            >
                                <i className="fa-solid fa-plus mr-2"></i> Import First Candidate
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {(isSourcing || isImporting) && <CandidateCardSkeleton />}
                        {filteredCandidates.map((c) => (
                            <CandidateListElement
                                key={c.id}
                                candidate={c}
                                isSelected={selectedCandidateIds.includes(c.id)}
                                isDeepProfileUnlocked={c.unlockedSteps.includes(FunnelStage.DEEP_PROFILE)}
                                isProcessingThis={processingId === c.id}
                                onToggleSelection={toggleCandidateSelection}
                                onDelete={handleDeleteCandidate}
                                onSelect={onSelectCandidate}
                                onUnlock={handleUnlockProfile}
                            />
                        ))}
                    </>
                )}

                {!hasNoCandidates && activeTab !== 'sourcing' && (
                    <button
                        onClick={() => setShowImport(true)}
                        className="md:hidden w-full py-3 bg-apex-800 border border-dashed border-apex-700 text-slate-400 rounded-lg text-sm font-bold mt-4"
                    >
                        <i className="fa-solid fa-plus mr-2"></i> Import Candidate
                    </button>
                )}
            </div>

            {isComparisonMode && (
                <CandidateComparisonView
                    candidates={candidates.filter(c => selectedCandidateIds.includes(c.id))}
                    onClose={() => setIsComparisonMode(false)}
                />
            )}
        </div>
    );
};

export default ShortlistGrid;
