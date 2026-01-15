
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
                    <span className="text-emerald-400 font-mono text-xs uppercase tracking-widest bg-emerald-900/30 border border-emerald-900/50 px-3 py-1 rounded backdrop-blur-sm">Step 1: Free</span>
                    <h1 className="text-2xl md:text-4xl font-bold text-white mt-3 tracking-tight">Context & Job Intake</h1>
                    <p className="text-slate-400 mt-2 text-sm max-w-2xl">Provide the job context. This step establishes the baseline for AI alignment scoring.</p>
                </div>
                <button
                    onClick={handleLoadDemo}
                    className="self-start px-4 py-2 text-xs font-bold uppercase tracking-wide text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all flex items-center gap-2 backdrop-blur-sm"
                >
                    <i className="fa-solid fa-flask text-emerald-400"></i> Load Demo
                </button>
            </motion.div>

            <div className="flex flex-col lg:flex-row gap-6 md:gap-8 max-w-7xl">
                {/* Main Input Column */}
                <div className="flex-1 space-y-6">

                    {/* Social Context Card */}
                    <GlassCard variant="neo" className="p-4 md:p-6" variants={itemVariants}>
                        <div className="flex items-center space-x-3 mb-5 border-b border-white/10 pb-4">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10">
                                <i className="fa-solid fa-users-line"></i>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Social Context</h2>
                                <p className="text-xs text-blue-400 uppercase tracking-wide font-bold">Critical for Culture Match</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Company LinkedIn URL</label>
                                <div className="relative group">
                                    <i className="fa-brands fa-linkedin absolute left-3 top-3 text-slate-500 group-focus-within:text-blue-400 transition-colors"></i>
                                    <input
                                        type="text"
                                        className="w-full bg-black/20 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-black/40 transition-all"
                                        placeholder="https://linkedin.com/company/..."
                                        value={companyUrl}
                                        onChange={(e) => setCompanyUrl(e.target.value)}
                                        autoCorrect="off"
                                        autoCapitalize="off"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Hiring Manager LinkedIn</label>
                                    <div className="relative group">
                                        <i className="fa-brands fa-linkedin absolute left-3 top-3 text-slate-500 group-focus-within:text-blue-400 transition-colors"></i>
                                        <input
                                            type="text"
                                            className="w-full bg-black/20 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-black/40 transition-all"
                                            placeholder="https://linkedin.com/in/..."
                                            value={managerUrl}
                                            onChange={(e) => setManagerUrl(e.target.value)}
                                            autoCorrect="off"
                                            autoCapitalize="off"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Top Performer (Benchmark)</label>
                                    <div className="relative group">
                                        <i className="fa-brands fa-linkedin absolute left-3 top-3 text-slate-500 group-focus-within:text-blue-400 transition-colors"></i>
                                        <input
                                            type="text"
                                            className="w-full bg-black/20 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-black/40 transition-all"
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

                        <div className="mt-5 p-3 bg-blue-500/5 rounded border border-blue-500/10 flex items-start">
                            <i className="fa-solid fa-circle-info text-blue-400/70 mt-0.5 mr-2 text-xs"></i>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                We analyze these profiles to calibrate for <strong className="text-blue-200">team culture</strong>, <strong className="text-blue-200">communication style</strong>, and <strong className="text-blue-200">educational background</strong>.
                            </p>
                        </div>
                    </GlassCard>

                    {/* Hard Requirements Card */}
                    <GlassCard variant="dark" className="p-4 md:p-6" variants={itemVariants}>
                        <div className="flex items-center space-x-3 mb-5 border-b border-white/10 pb-4">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                                <i className="fa-solid fa-file-lines"></i>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Job Requirements</h2>
                                <p className="text-xs text-slate-400 uppercase tracking-wide font-bold">Paste or Import from URL</p>
                            </div>
                        </div>

                        {/* URL Input */}
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Import from Job Board URL</label>
                            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                                <div className="relative flex-1 group">
                                    <i className="fa-solid fa-link absolute left-3 top-3 text-slate-500 group-focus-within:text-emerald-400 transition-colors"></i>
                                    <input
                                        type="text"
                                        className={`w-full bg-black/20 border rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:bg-black/40 transition-all ${fetchError ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20'}`}
                                        placeholder="https://boards.greenhouse.io/..."
                                        value={jobUrl}
                                        onChange={(e) => setJobUrl(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleFetchJob()}
                                        autoCorrect="off"
                                        autoCapitalize="off"
                                    />
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleFetchJob}
                                    disabled={isFetchingJob || !jobUrl}
                                    className={`px-4 py-2.5 md:py-0 rounded-lg font-bold text-xs transition-all border flex items-center justify-center whitespace-nowrap ${isFetchingJob || !jobUrl ? 'bg-white/5 border-white/5 text-slate-600 cursor-not-allowed' : 'bg-emerald-600/20 border-emerald-500/30 hover:bg-emerald-600 hover:text-white text-emerald-400'}`}
                                >
                                    {isFetchingJob ? <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> : <i className="fa-solid fa-cloud-arrow-down mr-2"></i>}
                                    {isFetchingJob ? 'Scanning...' : 'Fetch Context'}
                                </motion.button>
                            </div>
                            {fetchError && (
                                <div className="mt-2 text-xs text-red-400 flex items-center">
                                    <i className="fa-solid fa-circle-exclamation mr-1.5"></i> {fetchError}
                                </div>
                            )}
                        </div>

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-white/10"></div>
                            <span className="flex-shrink-0 mx-4 text-slate-500 text-xs uppercase font-bold">OR Paste Description</span>
                            <div className="flex-grow border-t border-white/10"></div>
                        </div>

                        <div className="relative mt-2">
                            <textarea
                                className="w-full h-48 bg-black/20 border border-white/10 rounded-lg p-4 text-sm text-slate-300 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 font-mono leading-relaxed resize-none transition-all placeholder-slate-600 focus:bg-black/40"
                                placeholder="Paste Job Description here..."
                                value={jobContext}
                                onChange={(e) => setJobContext(e.target.value)}
                            ></textarea>
                            <div className="absolute bottom-4 right-4 text-xs text-slate-600 font-mono pointer-events-none">
                                {jobContext.length} chars
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleStart}
                                disabled={isProcessing || !jobContext}
                                className={`
                                w-full md:w-auto relative px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wide transition-all shadow-lg 
                                ${isProcessing || !jobContext
                                        ? 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'
                                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 hover:shadow-emerald-500/50'
                                    }
                            `}
                            >
                                {isProcessing ? (
                                    <span className="flex items-center justify-center">
                                        <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Initializing...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center">
                                        Initialize Shortlist <i className="fa-solid fa-arrow-right ml-2"></i>
                                    </span>
                                )}
                            </motion.button>
                        </div>
                    </GlassCard>
                </div>

                {/* Process Preview Sidebar */}
                <div className="w-full lg:w-80 space-y-4 order-last lg:order-none">
                    <GlassCard variant="dark" className="p-6 lg:sticky lg:top-8" variants={itemVariants}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Process Preview</h3>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        </div>

                        <div className="space-y-7 relative">
                            {/* Vertical Line */}
                            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-white/10 z-0"></div>

                            {/* Step 1 */}
                            <div className="relative z-10 flex items-start group">
                                <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-emerald-500/20 mr-3 shrink-0">1</div>
                                <div>
                                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">Job Intake (Free)</h4>
                                    <p className="text-xs text-slate-400 mt-0.5">Context setup & calibration</p>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="relative z-10 flex items-start opacity-60">
                                <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-900 text-slate-400 flex items-center justify-center text-xs font-bold mr-3 shrink-0">2</div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-300">Shortlist Generation</h4>
                                    <div className="flex items-center mt-1 space-x-2">
                                        <span className="text-xs bg-white/5 text-slate-400 px-1.5 py-0.5 rounded border border-white/5">93 Credits</span>
                                        <span className="text-xs text-slate-500">~€50</span>
                                    </div>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="relative z-10 flex items-start opacity-60">
                                <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-900 text-slate-400 flex items-center justify-center text-xs font-bold mr-3 shrink-0">3</div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-300">Evidence Report</h4>
                                    <div className="flex items-center mt-1 space-x-2">
                                        <span className="text-xs bg-white/5 text-slate-400 px-1.5 py-0.5 rounded border border-white/5">278 Credits</span>
                                        <span className="text-xs text-slate-500">~€150</span>
                                    </div>
                                </div>
                            </div>

                            {/* Step 4 */}
                            <div className="relative z-10 flex items-start opacity-60">
                                <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-900 text-slate-400 flex items-center justify-center text-xs font-bold mr-3 shrink-0">4</div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-300">Outreach Protocol</h4>
                                    <div className="flex items-center mt-1 space-x-2">
                                        <span className="text-xs bg-white/5 text-slate-400 px-1.5 py-0.5 rounded border border-white/5">463 Credits</span>
                                        <span className="text-xs text-slate-500">~€250</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10">
                            <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3">
                                <div className="flex items-center mb-2">
                                    <i className="fa-solid fa-coins text-blue-400 mr-2 text-xs"></i>
                                    <span className="text-xs font-bold text-blue-300 uppercase">Pilot Pricing Active</span>
                                </div>
                                <p className="text-xs text-blue-200/50 leading-relaxed font-mono">
                                    1 Credit ≈ 4 DKK (~€{CREDITS_TO_EUR}). Pricing is based on unit cost per candidate processed.
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
