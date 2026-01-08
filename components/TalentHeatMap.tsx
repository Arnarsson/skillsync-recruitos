
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Candidate, FunnelStage, PRICING } from '../types';
import { generateDeepProfile, generateNetworkDossier, analyzeCandidateProfile } from '../services/geminiService';
import { candidateService } from '../services/candidateService';
import { ToastType } from './ToastNotification';
import { ScoreDistributionChart } from './visualizations/ScoreDistributionChart';
import { CandidateCardSkeleton } from './visualizations/CandidateCardSkeleton';
import { CandidateComparisonView } from './visualizations/CandidateComparisonView';
import { useCandidateSourcing } from '../hooks/useCandidateSourcing';

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
Passionate about building scalable fintech solutions. Currently leading the European payments integration team at Stripe. Previously at Klarna where I helped scale their checkout platform to handle 2M+ daily transactions.

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

    // Import Modal State
    const [showImport, setShowImport] = useState(false);
    const [importText, setImportText] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [isDemoLoading, setIsDemoLoading] = useState(false);

    // Loading state for specific candidate actions
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Sorting & Filtering State (Phase 4)
    const [sortBy, setSortBy] = useState<'score-desc' | 'score-asc' | 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc'>('score-desc');
    const [filterScore, setFilterScore] = useState<'high' | 'medium' | 'low' | null>(null);

    // Multi-Select & Comparison State (Phase 4)
    const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
    const [isComparisonMode, setIsComparisonMode] = useState(false);

    // Sourcing Hook - handles URL-based candidate sourcing workflow
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
            if (process.env.NODE_ENV === 'development') {
                console.error(error);
            }
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
            // Generate both Deep Profile AND Network Dossier (Strategic Intelligence Package)
            const [deepProfileData, networkDossier] = await Promise.all([
                generateDeepProfile(candidate, jobContext),
                generateNetworkDossier(candidate, jobContext)
            ]);

            onSpendCredits(PRICING.DEEP_PROFILE, `Unlocked Strategic Intelligence Package: ${candidateName}`);

            // Update local and remote
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
            if (process.env.NODE_ENV === 'development') {
                console.error(error);
            }
            const errorMessage = error instanceof Error ? error.message : "Failed to generate profile.";
            addToast('error', errorMessage);
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
            if (process.env.NODE_ENV === 'development') {
                console.error(error);
            }
            const errorMessage = error instanceof Error ? error.message : "Failed to analyze candidate. Ensure Gemini API key is active.";
            addToast('error', errorMessage);
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
            if (process.env.NODE_ENV === 'development') {
                console.error(error);
            }
            const errorMessage = error instanceof Error ? error.message : "Failed to analyze demo candidate.";
            addToast('error', errorMessage);
        } finally {
            setIsDemoLoading(false);
        }
    }, [jobContext, addToast]);

    // Memoized tab handlers
    const handleSetActiveTab = useCallback((tab: 'pipeline' | 'sourcing') => {
        setActiveTab(tab);
    }, []);

    const handleSetShowImport = useCallback((show: boolean) => {
        setShowImport(show);
    }, []);

    const handleSetSourcingUrl = useCallback((url: string) => {
        setSourcingUrl(url);
    }, []);

    const handleSetImportText = useCallback((text: string) => {
        setImportText(text);
    }, []);

    // Multi-select handlers (Phase 4)
    const toggleCandidateSelection = useCallback((candidateId: string) => {
        setSelectedCandidateIds(prev => {
            if (prev.includes(candidateId)) {
                return prev.filter(id => id !== candidateId);
            } else {
                // Limit to 3 candidates for comparison
                if (prev.length >= 3) {
                    addToast('warning', 'Maximum 3 candidates can be compared at once');
                    return prev;
                }
                return [...prev, candidateId];
            }
        });
    }, [addToast]);

    const clearSelection = useCallback(() => {
        setSelectedCandidateIds([]);
    }, []);

    const openComparison = useCallback(() => {
        if (selectedCandidateIds.length < 2) {
            addToast('warning', 'Select at least 2 candidates to compare');
            return;
        }
        setIsComparisonMode(true);
    }, [selectedCandidateIds.length, addToast]);

    const closeComparison = useCallback(() => {
        setIsComparisonMode(false);
    }, []);

    // Memoized computed values
    const candidateCount = useMemo(() => candidates.length, [candidates.length]);

    const hasNoCandidates = useMemo(() => candidates.length === 0, [candidates.length]);

    // DEBUG: Log chart rendering conditions
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('[TalentHeatMap] Chart render check:', {
                activeTab,
                hasNoCandidates,
                candidatesLength: candidates.length,
                shouldRenderChart: activeTab === 'pipeline' && !hasNoCandidates
            });
        }
    }, [activeTab, hasNoCandidates, candidates.length]);

    // Helper function to calculate data quality score
    const calculateDataQuality = useCallback((candidate: Candidate): { score: number; label: 'Complete' | 'Partial' | 'Minimal'; color: string } => {
        let score = 0;

        // Check presence of key fields
        if (candidate.currentRole && candidate.currentRole !== 'N/A') score += 20;
        if (candidate.yearsExperience && candidate.yearsExperience > 0) score += 20;
        if (candidate.persona?.careerTrajectory) score += 20;
        if (candidate.persona?.skillProfile?.coreSkills && candidate.persona.skillProfile.coreSkills.length > 0) score += 20;
        if (candidate.scoreConfidence === 'high') score += 20;

        return {
            score,
            label: score >= 70 ? 'Complete' : score >= 40 ? 'Partial' : 'Minimal',
            color: score >= 70 ? 'emerald' : score >= 40 ? 'yellow' : 'red'
        };
    }, []);

    // Sorting logic (Phase 4)
    const sortedCandidates = useMemo(() => {
        const sorted = [...candidates];

        switch (sortBy) {
            case 'score-desc':
                return sorted.sort((a, b) => b.alignmentScore - a.alignmentScore);
            case 'score-asc':
                return sorted.sort((a, b) => a.alignmentScore - b.alignmentScore);
            case 'date-desc':
                return sorted; // Most recent first (default order from DB)
            case 'date-asc':
                return sorted.reverse(); // Oldest first
            case 'name-asc':
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            case 'name-desc':
                return sorted.sort((a, b) => b.name.localeCompare(a.name));
            default:
                return sorted;
        }
    }, [candidates, sortBy]);

    // Filtering logic (Phase 4)
    const filteredCandidates = useMemo(() => {
        if (!filterScore) return sortedCandidates;

        switch (filterScore) {
            case 'high':
                return sortedCandidates.filter(c => c.alignmentScore >= 80);
            case 'medium':
                return sortedCandidates.filter(c => c.alignmentScore >= 50 && c.alignmentScore < 80);
            case 'low':
                return sortedCandidates.filter(c => c.alignmentScore < 50);
            default:
                return sortedCandidates;
        }
    }, [sortedCandidates, filterScore]);

    // Memoized candidate list rendering data
    const renderedCandidates = useMemo(() => {
        return filteredCandidates.map((c) => {
            const isDeepProfileUnlocked = c.unlockedSteps.includes(FunnelStage.DEEP_PROFILE);
            const dataQuality = calculateDataQuality(c);
            return {
                candidate: c,
                isDeepProfileUnlocked,
                isProcessingThis: processingId === c.id,
                dataQuality
            };
        });
    }, [filteredCandidates, processingId, calculateDataQuality]);

    return (
        <div className="h-full flex flex-col bg-apex-900 relative">
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-apex-800 flex justify-between items-center bg-apex-800/30">
                <div className="flex items-center space-x-6">
                    <div>
                        <div className="flex items-center space-x-2">
                            <span className="text-emerald-500 font-mono text-xs uppercase tracking-widest bg-emerald-900/20 px-2 py-0.5 rounded">Step 2 of 4</span>
                            <h2 className="text-lg md:text-xl font-bold text-white">Talent Engine</h2>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 hidden md:block">Source, score, and shortlist candidates.</p>
                    </div>

                    {/* Tabs */}
                    <div className="hidden md:flex bg-apex-900 p-1 rounded-lg border border-apex-700">
                        <button
                            onClick={() => handleSetActiveTab('pipeline')}
                            className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${activeTab === 'pipeline' ? 'bg-apex-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Pipeline
                        </button>
                        <button
                            onClick={() => handleSetActiveTab('sourcing')}
                            className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${activeTab === 'sourcing' ? 'bg-apex-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Auto-Sourcing <span className="ml-1 px-1 bg-emerald-600 text-[9px] rounded text-white">NEW</span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleLoadDemoCandidate}
                        disabled={isDemoLoading}
                        className="hidden md:flex items-center px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-400 hover:text-white bg-apex-800 hover:bg-apex-700 border border-apex-700 hover:border-slate-600 rounded transition-all"
                    >
                        {isDemoLoading ? <i className="fa-solid fa-circle-notch fa-spin mr-1.5"></i> : <i className="fa-solid fa-flask mr-1.5 text-[9px]"></i>}
                        {isDemoLoading ? 'Loading...' : 'Demo'}
                    </button>
                    <button
                        onClick={() => handleSetShowImport(true)}
                        className="hidden md:flex items-center px-4 py-2 bg-apex-800 border border-apex-600 hover:bg-apex-700 text-slate-300 text-xs font-bold rounded transition-all"
                    >
                        <i className="fa-solid fa-file-import mr-2"></i> Quick Paste
                    </button>
                    <div className="text-xs text-slate-500">
                        {candidateCount} Candidates
                    </div>
                </div>
            </div>

            {/* Sourcing Console */}
            {activeTab === 'sourcing' && (
                <div className="p-6 bg-apex-800/20 border-b border-apex-700 animate-fadeIn">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-8 h-8 rounded bg-purple-900/20 flex items-center justify-center text-purple-400 border border-purple-500/30">
                                <i className="fa-solid fa-robot"></i>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">Sourcing Agent (Beta)</h3>
                                <p className="text-xs text-slate-400">Enter a public profile URL (LinkedIn, GitHub, Portfolio). The Agent will scrape, build a persona, and check fit.</p>
                            </div>
                        </div>

                        <div className="flex space-x-2">
                            <div className="flex-1 relative">
                                <i className="fa-solid fa-link absolute left-3 top-3 text-slate-500"></i>
                                <input
                                    type="text"
                                    value={sourcingUrl}
                                    onChange={(e) => handleSetSourcingUrl(e.target.value)}
                                    placeholder="https://linkedin.com/in/..."
                                    className="w-full bg-apex-900 border border-apex-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none placeholder-slate-600"
                                />
                            </div>
                            <button
                                onClick={handleSourcingRun}
                                disabled={isSourcing || !sourcingUrl}
                                className={`px-6 rounded-lg font-bold text-xs flex items-center transition-all ${isSourcing ? 'bg-apex-700 text-slate-500' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20'}`}
                            >
                                {isSourcing ? <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> : <i className="fa-solid fa-bolt mr-2"></i>}
                                {isSourcing ? 'Processing...' : 'Run Analysis'}
                            </button>
                        </div>

                        {/* Console Log */}
                        {sourcingLog.length > 0 && (
                            <div className="mt-4 bg-black/50 rounded-lg p-3 font-mono text-xs text-emerald-400 border border-apex-700/50 max-h-32 overflow-y-auto">
                                {sourcingLog.map((line, i) => <div key={i}>{line}</div>)}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImport && (
                <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-3xl bg-apex-900 border border-apex-700 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
                        <div className="p-4 border-b border-apex-700 bg-apex-800 flex justify-between items-center">
                            <div>
                                <h3 className="text-white font-bold flex items-center">
                                    <i className="fa-solid fa-paste mr-2 text-emerald-500"></i>
                                    Quick Paste - Manual Import
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">Get 100% data accuracy - Copy full LinkedIn profile</p>
                            </div>
                            <button onClick={() => handleSetShowImport(false)} className="text-slate-500 hover:text-white"><i className="fa-solid fa-xmark"></i></button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Enhanced Instructions */}
                            <div className="bg-blue-950/30 border border-blue-800/50 rounded-lg p-4">
                                <h4 className="text-blue-400 font-bold text-sm mb-3 flex items-center">
                                    <i className="fa-solid fa-circle-info mr-2"></i>
                                    Step-by-Step Instructions
                                </h4>
                                <ol className="text-xs text-slate-300 space-y-2">
                                    <li className="flex items-start">
                                        <span className="bg-emerald-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2 mt-0.5 shrink-0">1</span>
                                        <span>Open the LinkedIn profile in your browser</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="bg-emerald-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2 mt-0.5 shrink-0">2</span>
                                        <span>Press <code className="bg-apex-800 px-1.5 py-0.5 rounded border border-apex-700 mx-1 font-mono">Ctrl+A</code> (or <code className="bg-apex-800 px-1.5 py-0.5 rounded border border-apex-700 mx-1 font-mono">⌘+A</code> on Mac) to select all</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="bg-emerald-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2 mt-0.5 shrink-0">3</span>
                                        <span>Press <code className="bg-apex-800 px-1.5 py-0.5 rounded border border-apex-700 mx-1 font-mono">Ctrl+C</code> (or <code className="bg-apex-800 px-1.5 py-0.5 rounded border border-apex-700 mx-1 font-mono">⌘+C</code> on Mac) to copy</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="bg-emerald-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2 mt-0.5 shrink-0">4</span>
                                        <span>Click in the text area below and press <code className="bg-apex-800 px-1.5 py-0.5 rounded border border-apex-700 mx-1 font-mono">Ctrl+V</code> to paste</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="bg-emerald-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2 mt-0.5 shrink-0">5</span>
                                        <span>Click &quot;Analyze & Add&quot; - AI will extract experience, skills, education automatically</span>
                                    </li>
                                </ol>
                            </div>

                            {/* What to Include */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-lg p-3">
                                    <h5 className="text-emerald-400 font-bold text-xs mb-2 flex items-center">
                                        <i className="fa-solid fa-check-circle mr-1.5"></i>
                                        Best Results With:
                                    </h5>
                                    <ul className="text-[11px] text-slate-300 space-y-1">
                                        <li>✓ Full LinkedIn profile page</li>
                                        <li>✓ Experience section visible</li>
                                        <li>✓ Skills section expanded</li>
                                        <li>✓ Education section visible</li>
                                    </ul>
                                </div>
                                <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg p-3">
                                    <h5 className="text-amber-400 font-bold text-xs mb-2 flex items-center">
                                        <i className="fa-solid fa-lightbulb mr-1.5"></i>
                                        Pro Tips:
                                    </h5>
                                    <ul className="text-[11px] text-slate-300 space-y-1">
                                        <li>💡 Works with any text format</li>
                                        <li>💡 Paste resume/CV text directly</li>
                                        <li>💡 AI extracts relevant info</li>
                                        <li>💡 100% data accuracy</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Textarea with character count */}
                            <div className="relative">
                                <textarea
                                    className="w-full h-64 bg-apex-950 border border-apex-700 rounded-lg p-4 text-sm text-slate-300 font-mono focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none"
                                    placeholder="Paste LinkedIn profile text here...

Example:
John Smith
Senior Full-Stack Engineer at TechCorp
San Francisco, CA
3,500 followers | 500+ connections

About
Passionate software engineer with 8+ years building scalable web applications...

Experience
Senior Full-Stack Engineer - TechCorp
2020 - Present
- Led development of payment infrastructure
- Built React/Node.js applications
..."
                                    value={importText}
                                    onChange={(e) => handleSetImportText(e.target.value)}
                                ></textarea>
                                <div className="absolute bottom-3 right-3 text-xs text-slate-500 bg-apex-900/80 px-2 py-1 rounded">
                                    {importText.length} characters
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-apex-800 flex justify-between items-center bg-apex-900/50">
                            <div className="text-xs text-slate-500">
                                <i className="fa-solid fa-shield-halved mr-1 text-emerald-600"></i>
                                Data stays local - AI extracts info directly
                            </div>
                            <button
                                onClick={handleImport}
                                disabled={isImporting || !importText.trim()}
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg flex items-center transition-all shadow-lg hover:shadow-emerald-500/20"
                            >
                                {isImporting ? <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> : <i className="fa-solid fa-bolt mr-2"></i>}
                                {isImporting ? 'Analyzing with AI...' : 'Analyze & Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Score Distribution Chart (Pipeline tab only, when candidates exist) */}
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
                    <ScoreDistributionChart
                        candidates={candidates}
                        height={180}
                    />
                </div>
            )}

            {/* Sorting & Filtering Controls (Pipeline tab only, when candidates exist) */}
            {activeTab === 'pipeline' && !hasNoCandidates && (
                <div className="px-6 py-3 bg-apex-800/30 border-b border-apex-700">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                        {/* Sorting Controls */}
                        <div className="flex items-center space-x-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Sort:</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                                className="bg-apex-900 border border-apex-700 rounded px-3 py-1.5 text-xs text-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                            >
                                <option value="score-desc">Highest Score First</option>
                                <option value="score-asc">Lowest Score First</option>
                                <option value="date-desc">Most Recent</option>
                                <option value="date-asc">Oldest First</option>
                                <option value="name-asc">Name (A-Z)</option>
                                <option value="name-desc">Name (Z-A)</option>
                            </select>
                        </div>

                        {/* Filtering Controls */}
                        <div className="flex items-center space-x-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Filter:</label>
                            <div className="flex space-x-1">
                                <button
                                    onClick={() => setFilterScore(filterScore === 'high' ? null : 'high')}
                                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                                        filterScore === 'high'
                                            ? 'bg-emerald-600 text-white shadow-lg'
                                            : 'bg-apex-900 border border-apex-700 text-slate-400 hover:text-slate-300 hover:border-apex-600'
                                    }`}
                                >
                                    High (80-100)
                                </button>
                                <button
                                    onClick={() => setFilterScore(filterScore === 'medium' ? null : 'medium')}
                                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                                        filterScore === 'medium'
                                            ? 'bg-yellow-600 text-white shadow-lg'
                                            : 'bg-apex-900 border border-apex-700 text-slate-400 hover:text-slate-300 hover:border-apex-600'
                                    }`}
                                >
                                    Medium (50-79)
                                </button>
                                <button
                                    onClick={() => setFilterScore(filterScore === 'low' ? null : 'low')}
                                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                                        filterScore === 'low'
                                            ? 'bg-red-600 text-white shadow-lg'
                                            : 'bg-apex-900 border border-apex-700 text-slate-400 hover:text-slate-300 hover:border-apex-600'
                                    }`}
                                >
                                    Low (0-49)
                                </button>
                                {filterScore && (
                                    <button
                                        onClick={() => setFilterScore(null)}
                                        className="px-3 py-1.5 rounded text-xs font-bold bg-apex-900 border border-apex-700 text-slate-400 hover:text-white hover:border-emerald-500 transition-all"
                                    >
                                        <i className="fa-solid fa-xmark mr-1"></i> Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Results Counter & Compare Button */}
                        <div className="flex items-center space-x-3">
                            {selectedCandidateIds.length >= 2 && (
                                <button
                                    onClick={openComparison}
                                    className="px-4 py-1.5 rounded text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all flex items-center space-x-2"
                                >
                                    <i className="fa-solid fa-code-compare"></i>
                                    <span>Compare {selectedCandidateIds.length} Candidates</span>
                                </button>
                            )}
                            {selectedCandidateIds.length > 0 && (
                                <button
                                    onClick={clearSelection}
                                    className="px-3 py-1.5 rounded text-xs font-bold bg-apex-900 border border-apex-700 text-slate-400 hover:text-white hover:border-red-500 transition-all"
                                >
                                    <i className="fa-solid fa-xmark mr-1"></i> Clear Selection
                                </button>
                            )}
                            <div className="text-xs text-slate-500">
                                Showing <span className="font-bold text-emerald-400">{renderedCandidates.length}</span> of <span className="font-bold text-slate-400">{candidates.length}</span> candidates
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Grid Header (Desktop Only) */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-apex-800 border-b border-apex-700 text-xs font-bold uppercase text-slate-500 tracking-wider">
                <div className="col-span-4">Candidate & Persona</div>
                <div className="col-span-2 text-center">Match Score</div>
                <div className="col-span-4">Evidence Summary</div>
                <div className="col-span-2 text-right">Action</div>
            </div>

            {/* List */}
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
                                onClick={() => handleSetShowImport(true)}
                                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg transition-all"
                            >
                                <i className="fa-solid fa-plus mr-2"></i> Import First Candidate
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Show skeleton loader during AI processing */}
                        {(isSourcing || isImporting) && <CandidateCardSkeleton />}

                        {renderedCandidates.map(({ candidate: c, isDeepProfileUnlocked, isProcessingThis, dataQuality }) => {
                            const isSelected = selectedCandidateIds.includes(c.id);
                            return (
                            <div
                                key={c.id}
                                onClick={() => isDeepProfileUnlocked ? onSelectCandidate(c) : null}
                                className={`
                            flex flex-col md:grid md:grid-cols-12 gap-4 p-4 rounded-xl border transition-all duration-300 items-start md:items-center relative
                            ${isSelected ? 'ring-2 ring-blue-500 bg-blue-900/10 border-blue-500' : ''}
                            ${isDeepProfileUnlocked && !isSelected
                                        ? 'bg-apex-800/40 border-apex-700 hover:bg-apex-800 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-900/10 hover:-translate-y-0.5 cursor-pointer group'
                                        : !isSelected && 'bg-apex-900 border-apex-800 opacity-80'
                                    }
                        `}
                            >
                                {/* Multi-select Checkbox (Phase 4) */}
                                <div className="absolute top-3 left-3 z-10">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            toggleCandidateSelection(c.id);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-4 h-4 rounded border-2 border-apex-600 bg-apex-900 checked:bg-blue-600 checked:border-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
                                    />
                                </div>

                                {/* Delete Button */}
                                <div className="absolute top-3 right-3 z-10">
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (window.confirm(`Delete ${c.name} from the pipeline?`)) {
                                                try {
                                                    await candidateService.delete(c.id);
                                                    setCandidates(prev => prev.filter(candidate => candidate.id !== c.id));
                                                    addToast('success', `${c.name} deleted`);
                                                } catch (error: unknown) {
                                                    const errorMessage = error instanceof Error ? error.message : 'Failed to delete candidate';
                                                    addToast('error', errorMessage);
                                                }
                                            }
                                        }}
                                        className="w-8 h-8 rounded-full bg-apex-900/80 hover:bg-red-900/80 border border-apex-700 hover:border-red-600 text-slate-400 hover:text-red-400 transition-all flex items-center justify-center group/delete"
                                        title="Delete candidate"
                                    >
                                        <i className="fa-solid fa-trash text-xs"></i>
                                    </button>
                                </div>

                                {/* Candidate Info + Persona */}
                                <div className="col-span-4 w-full md:w-auto pl-6 md:pl-0">
                                    <div className="flex items-center mb-1">
                                        <img src={c.avatar} className="w-10 h-10 rounded-full border border-slate-700 mr-3 grayscale group-hover:grayscale-0 transition-all" alt="avatar" />
                                        <div>
                                            <div className="text-sm font-bold text-slate-200">{c.name}</div>
                                            <div className="text-xs text-slate-500">
                                                {c.currentRole && c.currentRole !== 'N/A' ? c.currentRole : 'Role Not Listed'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Persona Badge & Data Quality */}
                                    <div className="mt-2 flex items-center flex-wrap gap-2">
                                        {/* Data Quality Badge */}
                                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wide ${
                                            dataQuality.label === 'Complete'
                                                ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-800/50'
                                                : dataQuality.label === 'Partial'
                                                ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-800/50'
                                                : 'bg-red-900/20 text-red-400 border border-red-800/50'
                                        }`}>
                                            <i className={`fa-solid ${dataQuality.label === 'Complete' ? 'fa-check-circle' : dataQuality.label === 'Partial' ? 'fa-circle-half-stroke' : 'fa-circle-exclamation'} mr-1`}></i>
                                            {dataQuality.label} Profile
                                        </span>

                                        {/* Persona Archetype */}
                                        {c.persona && (
                                            <span className="text-[9px] bg-purple-900/30 text-purple-300 border border-purple-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                                                <i className="fa-solid fa-fingerprint mr-1"></i> {c.persona.archetype}
                                            </span>
                                        )}

                                        {/* Flags */}
                                        {c.persona?.redFlags && c.persona.redFlags.length > 0 && (
                                            <div className="relative group/flag flex items-center cursor-help">
                                                <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-red-900/20 border border-red-900/30 text-red-400 hover:bg-red-900/40 transition-colors">
                                                    <i className="fa-solid fa-triangle-exclamation text-xs"></i>
                                                    <span className="text-[9px] font-bold">{c.persona.redFlags.length} Risk{c.persona.redFlags.length > 1 ? 's' : ''}</span>
                                                </div>

                                                {/* Tooltip */}
                                                <div className="absolute bottom-full left-0 mb-2 w-56 p-3 bg-apex-950 border border-red-900/50 rounded-lg shadow-xl text-xs text-red-200 hidden group-hover/flag:block z-30">
                                                    <div className="font-bold text-red-400 uppercase tracking-wider mb-1">Detected Risks</div>
                                                    <ul className="list-disc list-inside space-y-1 text-slate-300">
                                                        {c.persona.redFlags.map((flag, i) => <li key={i} className="leading-tight">{flag}</li>)}
                                                    </ul>
                                                    {/* Tooltip Arrow */}
                                                    <div className="absolute top-full left-4 -mt-1 w-2 h-2 bg-apex-950 border-r border-b border-red-900/50 transform rotate-45"></div>
                                                </div>
                                            </div>
                                        )}
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
                                            style={{ width: `${c.alignmentScore}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="col-span-4 w-full">
                                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 md:line-clamp-none">&quot;{c.shortlistSummary}&quot;</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {/* Dynamic Confidence Badge */}
                                        {c.scoreConfidence && (
                                            <span className={`text-xs px-1.5 py-0.5 rounded border ${
                                                c.scoreConfidence === 'high'
                                                    ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/50'
                                                    : c.scoreConfidence === 'moderate'
                                                    ? 'bg-yellow-950/50 text-yellow-400 border-yellow-800/50'
                                                    : 'bg-slate-800 text-slate-500 border-slate-700'
                                            }`}>
                                                <i className={`fa-solid ${
                                                    c.scoreConfidence === 'high' ? 'fa-check-circle' :
                                                    c.scoreConfidence === 'moderate' ? 'fa-circle-half-stroke' :
                                                    'fa-circle'
                                                } mr-1`}></i>
                                                {c.scoreConfidence.charAt(0).toUpperCase() + c.scoreConfidence.slice(1)} Confidence
                                            </span>
                                        )}
                                        {/* Score Drivers */}
                                        {c.scoreDrivers && c.scoreDrivers.length > 0 && (
                                            <span className="text-xs bg-emerald-950/30 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800/50" title={`Strengths: ${c.scoreDrivers.join(', ')}`}>
                                                <i className="fa-solid fa-arrow-trend-up mr-1"></i>
                                                {c.scoreDrivers.length} {c.scoreDrivers.length === 1 ? 'Driver' : 'Drivers'}
                                            </span>
                                        )}
                                        {/* Score Drags */}
                                        {c.scoreDrags && c.scoreDrags.length > 0 && (
                                            <span className="text-xs bg-red-950/30 text-red-400 px-1.5 py-0.5 rounded border border-red-800/50" title={`Gaps: ${c.scoreDrags.join(', ')}`}>
                                                <i className="fa-solid fa-arrow-trend-down mr-1"></i>
                                                {c.scoreDrags.length} {c.scoreDrags.length === 1 ? 'Gap' : 'Gaps'}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Action */}
                                <div className="col-span-2 flex justify-end w-full md:w-auto mt-2 md:mt-0">
                                    {isDeepProfileUnlocked ? (
                                        <button className="w-full md:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-900/20 border border-emerald-500/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95 group-hover:shadow-emerald-500/40">
                                            <i className="fa-solid fa-file-invoice mr-2"></i> View Report
                                        </button>
                                    ) : (
                                        <button
                                            onClick={(e) => handleUnlockProfile(e, c.id, c.name)}
                                            disabled={isProcessingThis}
                                            className={`
                                        w-full md:w-auto px-4 py-2 text-xs font-bold rounded-lg border flex items-center justify-center transition-all shadow-sm
                                        ${isProcessingThis
                                                    ? 'bg-apex-800 border-apex-700 text-slate-500 cursor-wait'
                                                    : 'bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-400 border-slate-700 hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-0.5'
                                                }
                                    `}
                                        >
                                            {isProcessingThis ? (
                                                <><i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Unlocking...</>
                                            ) : (
                                                <><i className="fa-solid fa-lock mr-2"></i> Unlock ({PRICING.DEEP_PROFILE} Cr)</>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                        })}
                    </>
                )}
                {/* Mobile Import Button at bottom */}
                {!hasNoCandidates && activeTab !== 'sourcing' && (
                    <button
                        onClick={() => handleSetShowImport(true)}
                        className="md:hidden w-full py-3 bg-apex-800 border border-dashed border-apex-700 text-slate-400 rounded-lg text-sm font-bold mt-4"
                    >
                        <i className="fa-solid fa-plus mr-2"></i> Import Candidate
                    </button>
                )}
            </div>

            {/* Comparison View Modal (Phase 4) */}
            {isComparisonMode && (
                <CandidateComparisonView
                    candidates={candidates.filter(c => selectedCandidateIds.includes(c.id))}
                    onClose={closeComparison}
                />
            )}
        </div>
    );
};

export default ShortlistGrid;
