
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchJobContextFromUrl } from '../services/jobService';
import { CREDITS_TO_EUR } from '../types';
import { ToastType } from './ToastNotification';

interface Props {
    jobContext: string;
    setJobContext: (ctx: string) => void;
    addToast: (type: ToastType, message: string) => void;
}

const DEMO_JOB_CONTEXT = `Role: Senior Full-Stack Engineer
Location: Copenhagen, Denmark (Hybrid - 3 days onsite)
Source: Demo Data

Job Summary:
We are seeking an experienced Senior Full-Stack Engineer to join our growing fintech team. You will be responsible for building scalable payment infrastructure, leading technical architecture decisions, and mentoring junior developers. This role offers significant ownership and the opportunity to shape our core platform.

Requirements:
- 5+ years of experience with TypeScript/JavaScript and React
- Strong backend experience with Node.js, Python, or Go
- Experience with PostgreSQL and Redis
- Familiarity with cloud infrastructure (AWS/GCP)
- Experience with payment systems or financial services (preferred)
- Strong communication skills and ability to work cross-functionally
- Experience leading technical projects and mentoring others
- BS/MS in Computer Science or equivalent experience`;


import { motion } from 'framer-motion';
import { GlassCard } from './ui/GlassCard';

const JobIntake: React.FC<Props> = ({ jobContext, setJobContext, addToast }) => {
    const navigate = useNavigate();
    // jobContext acts as the job description here
    const [companyUrl, setCompanyUrl] = useState('');
    const [managerUrl, setManagerUrl] = useState('');
    const [benchmarkUrl, setBenchmarkUrl] = useState('');
    const [jobUrl, setJobUrl] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isFetchingJob, setIsFetchingJob] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const handleLoadDemo = () => {
        setJobContext(DEMO_JOB_CONTEXT);
        setCompanyUrl('https://linkedin.com/company/stripe');
        addToast('info', 'Demo data loaded. Click Initialize to continue.');
    };

    const handleFetchJob = async () => {
        if (!jobUrl) return;
        setIsFetchingJob(true);
        setFetchError(null);
        setJobContext(''); // Clear previous

        try {
            const extractedContext = await fetchJobContextFromUrl(jobUrl);
            setJobContext(extractedContext);
            addToast('success', 'Job context extracted successfully');
        } catch (error: unknown) {
            console.error(error);
            const msg = error instanceof Error ? error.message : "Failed to fetch job. Ensure Firecrawl key is set.";
            setFetchError(msg);
            addToast('error', msg);
            // No simulation fallback. Strictly error out if scraping fails.
        } finally {
            setIsFetchingJob(false);
        }
    };

    const handleStart = () => {
        if (!jobContext.trim()) return;
        setIsProcessing(true);

        // Enrich Context with Social Data if available
        let enrichedContext = jobContext;
        if (companyUrl || managerUrl || benchmarkUrl) {
            enrichedContext += `\n\n=== SOCIAL & CULTURE CONTEXT ===\n`;
            if (companyUrl) enrichedContext += `Target Company: ${companyUrl}\n`;
            if (managerUrl) enrichedContext += `Hiring Manager Profile: ${managerUrl}\n`;
            if (benchmarkUrl) enrichedContext += `Benchmark High Performer: ${benchmarkUrl}\n`;
            enrichedContext += `(Use this social context to infer culture fit in later steps)\n`;
        }

        setJobContext(enrichedContext);
        addToast('success', 'Context Calibrated. Initializing...');

        setTimeout(() => {
            navigate('/shortlist');
        }, 1500);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="h-full flex flex-col p-4 md:p-8 overflow-y-auto custom-scrollbar" // Removed bg-apex-900 as parent handles bg
        >

            {/* Header */}
            <motion.div variants={itemVariants} className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2 py-1 rounded">Step 1</span>
                    <h1 className="text-2xl md:text-3xl font-semibold text-white mt-3">Context & Job Intake</h1>
                    <p className="text-slate-400 mt-2 text-sm max-w-2xl">Provide the job context. This step establishes the baseline for AI alignment scoring.</p>
                </div>
                <button
                    onClick={handleLoadDemo}
                    className="self-start h-9 px-4 text-sm font-medium text-slate-300 bg-white/5 hover:bg-white/10 border border-white/[0.08] rounded-md transition-colors flex items-center gap-2"
                >
                    <i className="fa-solid fa-flask text-slate-400"></i> Load Demo
                </button>
            </motion.div>

            <div className="flex flex-col lg:flex-row gap-6 md:gap-8 max-w-7xl">
                {/* Main Input Column */}
                <div className="flex-1 space-y-6">

                    {/* Social Context Card */}
                    <GlassCard className="p-4 md:p-6" variants={itemVariants}>
                        <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-white/[0.05]">
                            <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center text-slate-400">
                                <i className="fa-solid fa-users-line"></i>
                            </div>
                            <div>
                                <h2 className="text-base font-medium text-white">Social Context</h2>
                                <p className="text-xs text-slate-400">Critical for culture match</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-2">Company LinkedIn URL</label>
                                <div className="relative">
                                    <i className="fa-brands fa-linkedin absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"></i>
                                    <input
                                        type="text"
                                        className="w-full h-9 bg-slate-900/50 border border-white/[0.08] rounded-md pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                                        placeholder="https://linkedin.com/company/..."
                                        value={companyUrl}
                                        onChange={(e) => setCompanyUrl(e.target.value)}
                                        autoCorrect="off"
                                        autoCapitalize="off"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Hiring Manager LinkedIn</label>
                                    <div className="relative">
                                        <i className="fa-brands fa-linkedin absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"></i>
                                        <input
                                            type="text"
                                            className="w-full h-9 bg-slate-900/50 border border-white/[0.08] rounded-md pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                                            placeholder="https://linkedin.com/in/..."
                                            value={managerUrl}
                                            onChange={(e) => setManagerUrl(e.target.value)}
                                            autoCorrect="off"
                                            autoCapitalize="off"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Top Performer (Benchmark)</label>
                                    <div className="relative">
                                        <i className="fa-brands fa-linkedin absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"></i>
                                        <input
                                            type="text"
                                            className="w-full h-9 bg-slate-900/50 border border-white/[0.08] rounded-md pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                                            placeholder="https://linkedin.com/in/..."
                                            value={benchmarkUrl}
                                            onChange={(e) => setBenchmarkUrl(e.target.value)}
                                            autoCorrect="off"
                                            autoCapitalize="off"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-slate-800/50 rounded-md border border-white/[0.05] flex items-start">
                            <i className="fa-solid fa-circle-info text-slate-500 mt-0.5 mr-2 text-xs"></i>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                We analyze these profiles to calibrate for team culture, communication style, and educational background.
                            </p>
                        </div>
                    </GlassCard>

                    {/* Hard Requirements Card */}
                    <GlassCard className="p-4 md:p-6" variants={itemVariants}>
                        <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-white/[0.05]">
                            <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center text-slate-400">
                                <i className="fa-solid fa-file-lines"></i>
                            </div>
                            <div>
                                <h2 className="text-base font-medium text-white">Job Requirements</h2>
                                <p className="text-xs text-slate-400">Paste or import from URL</p>
                            </div>
                        </div>

                        {/* URL Input */}
                        <div className="mb-4">
                            <label className="block text-xs font-medium text-slate-400 mb-2">Import from Job Board URL</label>
                            <div className="flex flex-col md:flex-row gap-2">
                                <div className="relative flex-1">
                                    <i className="fa-solid fa-link absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"></i>
                                    <input
                                        type="text"
                                        className={`w-full h-9 bg-slate-900/50 border rounded-md pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-colors ${fetchError ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/[0.08] focus:border-blue-500/50 focus:ring-blue-500/20'}`}
                                        placeholder="https://boards.greenhouse.io/..."
                                        value={jobUrl}
                                        onChange={(e) => setJobUrl(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleFetchJob()}
                                        autoCorrect="off"
                                        autoCapitalize="off"
                                    />
                                </div>
                                <button
                                    onClick={handleFetchJob}
                                    disabled={isFetchingJob || !jobUrl}
                                    className={`h-9 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center whitespace-nowrap ${isFetchingJob || !jobUrl ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                                >
                                    {isFetchingJob ? <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> : <i className="fa-solid fa-cloud-arrow-down mr-2"></i>}
                                    {isFetchingJob ? 'Scanning...' : 'Fetch'}
                                </button>
                            </div>
                            {fetchError && (
                                <div className="mt-2 text-xs text-red-400 flex items-center">
                                    <i className="fa-solid fa-circle-exclamation mr-1.5"></i> {fetchError}
                                </div>
                            )}
                        </div>

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-white/[0.05]"></div>
                            <span className="flex-shrink-0 mx-4 text-slate-500 text-xs">or paste description</span>
                            <div className="flex-grow border-t border-white/[0.05]"></div>
                        </div>

                        <div className="relative mt-2">
                            <textarea
                                className="w-full h-48 bg-slate-900/50 border border-white/[0.08] rounded-md p-4 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 font-mono leading-relaxed resize-none transition-colors placeholder-slate-500"
                                placeholder="Paste Job Description here..."
                                value={jobContext}
                                onChange={(e) => setJobContext(e.target.value)}
                            ></textarea>
                            <div className="absolute bottom-4 right-4 text-xs text-slate-500 font-mono pointer-events-none tabular-nums">
                                {jobContext.length} chars
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleStart}
                                disabled={isProcessing || !jobContext}
                                className={`w-full md:w-auto h-10 px-6 rounded-md text-sm font-medium transition-colors flex items-center justify-center ${isProcessing || !jobContext
                                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                                    }`}
                            >
                                {isProcessing ? (
                                    <>
                                        <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Initializing...
                                    </>
                                ) : (
                                    <>
                                        Initialize Shortlist <i className="fa-solid fa-arrow-right ml-2"></i>
                                    </>
                                )}
                            </button>
                        </div>
                    </GlassCard>
                </div>

                {/* Process Preview Sidebar */}
                <div className="w-full lg:w-80 space-y-4 order-last lg:order-none">
                    <GlassCard className="p-6 lg:sticky lg:top-8" variants={itemVariants}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-medium text-slate-400">Process Preview</h3>
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        </div>

                        <div className="space-y-6 relative">
                            {/* Vertical Line */}
                            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-white/[0.08] z-0"></div>

                            {/* Step 1 */}
                            <div className="relative z-10 flex items-start">
                                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium mr-3 shrink-0">1</div>
                                <div>
                                    <h4 className="text-sm font-medium text-white">Job Intake</h4>
                                    <p className="text-xs text-slate-400 mt-0.5">Context setup & calibration</p>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="relative z-10 flex items-start opacity-60">
                                <div className="w-6 h-6 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center text-xs font-medium mr-3 shrink-0">2</div>
                                <div>
                                    <h4 className="text-sm font-medium text-slate-300">Shortlist Generation</h4>
                                    <div className="flex items-center mt-1 gap-2">
                                        <span className="text-xs bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded">93 Credits</span>
                                        <span className="text-xs text-slate-500">~€50</span>
                                    </div>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="relative z-10 flex items-start opacity-60">
                                <div className="w-6 h-6 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center text-xs font-medium mr-3 shrink-0">3</div>
                                <div>
                                    <h4 className="text-sm font-medium text-slate-300">Evidence Report</h4>
                                    <div className="flex items-center mt-1 gap-2">
                                        <span className="text-xs bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded">278 Credits</span>
                                        <span className="text-xs text-slate-500">~€150</span>
                                    </div>
                                </div>
                            </div>

                            {/* Step 4 */}
                            <div className="relative z-10 flex items-start opacity-60">
                                <div className="w-6 h-6 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center text-xs font-medium mr-3 shrink-0">4</div>
                                <div>
                                    <h4 className="text-sm font-medium text-slate-300">Outreach Protocol</h4>
                                    <div className="flex items-center mt-1 gap-2">
                                        <span className="text-xs bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded">463 Credits</span>
                                        <span className="text-xs text-slate-500">~€250</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/[0.05]">
                            <div className="bg-slate-800/50 border border-white/[0.05] rounded-md p-3">
                                <div className="flex items-center mb-1">
                                    <i className="fa-solid fa-coins text-slate-400 mr-2 text-xs"></i>
                                    <span className="text-xs font-medium text-slate-300">Pilot Pricing</span>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    1 Credit ≈ €{CREDITS_TO_EUR}. Cost per candidate processed.
                                </p>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </motion.div>
    );
};

export default JobIntake;
