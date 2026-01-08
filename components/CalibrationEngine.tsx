
import React, { useState, useCallback } from 'react';
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

    const handleLoadDemo = useCallback(() => {
        setJobContext(DEMO_JOB_CONTEXT);
        setCompanyUrl('https://linkedin.com/company/stripe');
        addToast('info', 'Demo data loaded. Click Initialize to continue.');
    }, [setJobContext, addToast]);

    const handleFetchJob = useCallback(async () => {
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
    }, [jobUrl, setJobContext, addToast]);

    const handleStart = useCallback(() => {
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
    }, [jobContext, companyUrl, managerUrl, benchmarkUrl, setJobContext, addToast, navigate]);

    return (
        <div className="h-full flex flex-col p-4 md:p-8 bg-apex-900 overflow-y-auto custom-scrollbar">

            {/* Header */}
            <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <span className="text-emerald-400 font-mono text-xs uppercase tracking-widest bg-emerald-900/30 border border-emerald-900/50 px-3 py-1 rounded">Step 1: Free</span>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mt-3">Context & Job Intake</h1>
                    <p className="text-slate-400 mt-1 text-sm">Provide the job context. This step establishes the baseline for AI alignment scoring.</p>
                </div>
                <button
                    onClick={handleLoadDemo}
                    className="self-start px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-400 hover:text-white bg-apex-800 hover:bg-apex-700 border border-apex-700 hover:border-slate-600 rounded transition-all flex items-center gap-1.5"
                >
                    <i className="fa-solid fa-flask text-[9px]"></i> Load Demo
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 md:gap-8 max-w-7xl">
                {/* Main Input Column */}
                <div className="flex-1 space-y-6">

                    {/* Social Context Card */}
                    <div className="bg-apex-800 border border-apex-700 rounded-xl p-4 md:p-6 shadow-lg relative overflow-hidden group">
                        <div className="flex items-center space-x-3 mb-5 border-b border-apex-700 pb-4">
                            <div className="w-8 h-8 rounded bg-blue-900/20 flex items-center justify-center text-blue-400">
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
                                <div className="relative">
                                    <i className="fa-brands fa-linkedin absolute left-3 top-3 text-slate-500"></i>
                                    <input
                                        type="text"
                                        className="w-full bg-apex-900 border border-apex-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
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
                                    <div className="relative">
                                        <i className="fa-brands fa-linkedin absolute left-3 top-3 text-slate-500"></i>
                                        <input
                                            type="text"
                                            className="w-full bg-apex-900 border border-apex-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
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
                                    <div className="relative">
                                        <i className="fa-brands fa-linkedin absolute left-3 top-3 text-slate-500"></i>
                                        <input
                                            type="text"
                                            className="w-full bg-apex-900 border border-apex-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
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

                        <div className="mt-5 p-3 bg-apex-900/50 rounded border border-apex-700/50 flex items-start">
                            <i className="fa-solid fa-circle-info text-slate-500 mt-0.5 mr-2 text-xs"></i>
                            <p className="text-xs text-slate-500 italic leading-relaxed">
                                We analyze these profiles to calibrate for <strong>team culture</strong>, <strong>communication style</strong>, and <strong>educational background</strong>.
                            </p>
                        </div>
                    </div>

                    {/* Hard Requirements Card */}
                    <div className="bg-apex-800 border border-apex-700 rounded-xl p-4 md:p-6 shadow-lg">
                        <div className="flex items-center space-x-3 mb-5 border-b border-apex-700 pb-4">
                            <div className="w-8 h-8 rounded bg-emerald-900/20 flex items-center justify-center text-emerald-400">
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
                                <div className="relative flex-1">
                                    <i className="fa-solid fa-link absolute left-3 top-3 text-slate-500"></i>
                                    <input
                                        type="text"
                                        className={`w-full bg-apex-900 border rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 transition-all ${fetchError ? 'border-red-500 focus:ring-red-500' : 'border-apex-700 focus:border-emerald-500 focus:ring-emerald-500'}`}
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
                                    className={`px-4 py-2.5 md:py-0 rounded-lg font-bold text-xs transition-all border border-apex-600 flex items-center justify-center whitespace-nowrap ${isFetchingJob || !jobUrl ? 'bg-apex-700 text-slate-500 cursor-not-allowed' : 'bg-apex-700 hover:bg-emerald-600 hover:text-white text-slate-300'}`}
                                >
                                    {isFetchingJob ? <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> : <i className="fa-solid fa-cloud-arrow-down mr-2"></i>}
                                    {isFetchingJob ? 'Scanning...' : 'Fetch Context'}
                                </button>
                            </div>
                            {fetchError && (
                                <div className="mt-2 text-xs text-red-400 flex items-center">
                                    <i className="fa-solid fa-circle-exclamation mr-1.5"></i> {fetchError}
                                </div>
                            )}
                        </div>

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-apex-700"></div>
                            <span className="flex-shrink-0 mx-4 text-slate-500 text-xs uppercase font-bold">OR Paste Description</span>
                            <div className="flex-grow border-t border-apex-700"></div>
                        </div>

                        <div className="relative mt-2">
                            <textarea
                                className="w-full h-48 bg-apex-900 border border-apex-700 rounded-lg p-4 text-sm text-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono leading-relaxed resize-none transition-all placeholder-slate-600"
                                placeholder="Paste Job Description here..."
                                value={jobContext}
                                onChange={(e) => setJobContext(e.target.value)}
                            ></textarea>
                            <div className="absolute bottom-4 right-4 text-xs text-slate-600 font-mono pointer-events-none">
                                {jobContext.length} chars
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleStart}
                                disabled={isProcessing || !jobContext}
                                className={`
                                w-full md:w-auto relative px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wide transition-all shadow-lg 
                                ${isProcessing || !jobContext
                                        ? 'bg-apex-700 text-slate-500 cursor-not-allowed'
                                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5'
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
                            </button>
                        </div>
                    </div>
                </div>

                {/* Process Preview Sidebar */}
                <div className="w-full lg:w-80 space-y-4 order-last lg:order-none">
                    <div className="bg-apex-800 border border-apex-700 rounded-xl p-6 lg:sticky lg:top-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Process Preview</h3>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        </div>

                        <div className="space-y-7 relative">
                            {/* Vertical Line */}
                            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-apex-700 z-0"></div>

                            {/* Step 1 */}
                            <div className="relative z-10 flex items-start group">
                                <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-apex-800 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-emerald-500/20 mr-3 shrink-0">1</div>
                                <div>
                                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">Job Intake (Free)</h4>
                                    <p className="text-xs text-slate-400 mt-0.5">Context setup & calibration</p>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="relative z-10 flex items-start opacity-60">
                                <div className="w-6 h-6 rounded-full bg-apex-700 border-2 border-apex-800 text-slate-400 flex items-center justify-center text-xs font-bold mr-3 shrink-0">2</div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-300">Shortlist Generation</h4>
                                    <div className="flex items-center mt-1 space-x-2">
                                        <span className="text-xs bg-apex-900 text-slate-400 px-1.5 py-0.5 rounded border border-apex-700">93 Credits</span>
                                        <span className="text-xs text-slate-500">~€50</span>
                                    </div>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="relative z-10 flex items-start opacity-60">
                                <div className="w-6 h-6 rounded-full bg-apex-700 border-2 border-apex-800 text-slate-400 flex items-center justify-center text-xs font-bold mr-3 shrink-0">3</div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-300">Evidence Report</h4>
                                    <div className="flex items-center mt-1 space-x-2">
                                        <span className="text-xs bg-apex-900 text-slate-400 px-1.5 py-0.5 rounded border border-apex-700">278 Credits</span>
                                        <span className="text-xs text-slate-500">~€150</span>
                                    </div>
                                </div>
                            </div>

                            {/* Step 4 */}
                            <div className="relative z-10 flex items-start opacity-60">
                                <div className="w-6 h-6 rounded-full bg-apex-700 border-2 border-apex-800 text-slate-400 flex items-center justify-center text-xs font-bold mr-3 shrink-0">4</div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-300">Outreach Protocol</h4>
                                    <div className="flex items-center mt-1 space-x-2">
                                        <span className="text-xs bg-apex-900 text-slate-400 px-1.5 py-0.5 rounded border border-apex-700">463 Credits</span>
                                        <span className="text-xs text-slate-500">~€250</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-apex-700">
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                <div className="flex items-center mb-2">
                                    <i className="fa-solid fa-coins text-blue-400 mr-2 text-xs"></i>
                                    <span className="text-xs font-bold text-blue-300 uppercase">Pilot Pricing Active</span>
                                </div>
                                <p className="text-xs text-blue-200/70 leading-relaxed font-mono">
                                    1 Credit ≈ 4 DKK (~€{CREDITS_TO_EUR}). Pricing is based on unit cost per candidate processed.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(JobIntake);
