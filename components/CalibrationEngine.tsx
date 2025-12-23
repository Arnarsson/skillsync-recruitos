import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PRICING, CREDITS_TO_EUR } from '../types';

const JobIntake: React.FC = () => {
  const navigate = useNavigate();
  const [jobDesc, setJobDesc] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [managerUrl, setManagerUrl] = useState('');
  const [benchmarkUrl, setBenchmarkUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMockFill = () => {
    setJobDesc(`Role: Senior Frontend Engineer
Location: Copenhagen (Hybrid)
Requirements:
- 5+ years with React, TypeScript and Next.js
- Experience with large-scale data visualization
- Experience from regulated industries (Fintech/Pharma preferred)
- Architecture ownership mindset
- Mentorship of junior developers`);
    setCompanyUrl('https://linkedin.com/company/apex-financial-systems');
    setManagerUrl('https://linkedin.com/in/lars-jensen-vp-eng');
    setBenchmarkUrl('https://linkedin.com/in/sofie-nielsen-tech-lead');
  };

  const handleStart = () => {
    if (!jobDesc.trim()) return;
    setIsProcessing(true);
    setTimeout(() => {
        navigate('/shortlist');
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col p-8 bg-apex-900 overflow-y-auto custom-scrollbar">
      
      {/* Header */}
      <div className="mb-8">
        <span className="text-emerald-400 font-mono text-[10px] uppercase tracking-widest bg-emerald-900/30 border border-emerald-900/50 px-3 py-1 rounded">Step 1: Free</span>
        <h1 className="text-3xl font-bold text-white mt-3">Context & Job Intake</h1>
        <p className="text-slate-400 mt-1 text-sm">Provide the job context. This step establishes the baseline for AI alignment scoring.</p>
      </div>

      <div className="flex gap-8 max-w-7xl">
          {/* Main Input Column */}
          <div className="flex-1 space-y-6">
              
              {/* Social Context Card */}
              <div className="bg-apex-800 border border-apex-700 rounded-xl p-6 shadow-lg relative overflow-hidden group">
                   <div className="flex items-center space-x-3 mb-5 border-b border-apex-700 pb-4">
                        <div className="w-8 h-8 rounded bg-blue-900/20 flex items-center justify-center text-blue-400">
                             <i className="fa-solid fa-people-group"></i>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Social Context</h2>
                            <p className="text-[10px] text-blue-400 uppercase tracking-wide font-bold">Critical for Culture Match</p>
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
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
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
                   
                   <button 
                        onClick={handleMockFill}
                        className="absolute top-6 right-6 text-[10px] text-blue-500 hover:text-blue-400 font-mono transition-colors opacity-60 hover:opacity-100"
                    >
                        <i className="fa-solid fa-wand-magic-sparkles mr-1"></i> Auto-Fill Demo
                   </button>
              </div>

              {/* Hard Requirements Card */}
              <div className="bg-apex-800 border border-apex-700 rounded-xl p-6 shadow-lg">
                   <div className="flex items-center space-x-3 mb-5 border-b border-apex-700 pb-4">
                        <div className="w-8 h-8 rounded bg-emerald-900/20 flex items-center justify-center text-emerald-400">
                            <i className="fa-solid fa-file-lines"></i>
                        </div>
                        <h2 className="text-lg font-bold text-white">Hard Requirements</h2>
                   </div>
                   
                   <div className="relative">
                       <textarea 
                            className="w-full h-48 bg-apex-900 border border-apex-700 rounded-lg p-4 text-sm text-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono leading-relaxed resize-none transition-all placeholder-slate-600"
                            placeholder="Paste Job Description here..."
                            value={jobDesc}
                            onChange={(e) => setJobDesc(e.target.value)}
                       ></textarea>
                       <div className="absolute bottom-4 right-4 text-[10px] text-slate-600 font-mono pointer-events-none">
                           {jobDesc.length} chars
                       </div>
                   </div>

                   <div className="mt-6 flex justify-end">
                       <button 
                            onClick={handleStart}
                            disabled={isProcessing || !jobDesc}
                            className={`
                                relative px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wide transition-all shadow-lg 
                                ${isProcessing || !jobDesc 
                                    ? 'bg-apex-700 text-slate-500 cursor-not-allowed' 
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5'
                                }
                            `}
                        >
                            {isProcessing ? (
                                <span className="flex items-center">
                                    <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Initializing...
                                </span>
                            ) : (
                                <span className="flex items-center">
                                    Initialize Shortlist <i className="fa-solid fa-arrow-right ml-2"></i>
                                </span>
                            )}
                        </button>
                   </div>
              </div>
          </div>

          {/* Process Preview Sidebar */}
          <div className="w-80 space-y-4">
               <div className="bg-apex-800 border border-apex-700 rounded-xl p-6 sticky top-8">
                   <div className="flex items-center justify-between mb-6">
                       <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Process Preview</h3>
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   </div>
                   
                   <div className="space-y-7 relative">
                       {/* Vertical Line */}
                       <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-apex-700 z-0"></div>

                       {/* Step 1 */}
                       <div className="relative z-10 flex items-start group">
                           <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-apex-800 flex items-center justify-center text-white text-[10px] font-bold shadow-lg shadow-emerald-500/20 mr-3 shrink-0">1</div>
                           <div>
                               <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">Job Intake (Free)</h4>
                               <p className="text-[10px] text-slate-400 mt-0.5">Context setup & calibration</p>
                           </div>
                       </div>

                       {/* Step 2 */}
                       <div className="relative z-10 flex items-start opacity-60">
                           <div className="w-6 h-6 rounded-full bg-apex-700 border-2 border-apex-800 text-slate-400 flex items-center justify-center text-[10px] font-bold mr-3 shrink-0">2</div>
                           <div>
                               <h4 className="text-sm font-bold text-slate-300">Shortlist Generation</h4>
                               <div className="flex items-center mt-1 space-x-2">
                                   <span className="text-[10px] bg-apex-900 text-slate-400 px-1.5 py-0.5 rounded border border-apex-700">93 Credits</span>
                                   <span className="text-[10px] text-slate-500">~€50</span>
                               </div>
                           </div>
                       </div>

                       {/* Step 3 */}
                       <div className="relative z-10 flex items-start opacity-60">
                           <div className="w-6 h-6 rounded-full bg-apex-700 border-2 border-apex-800 text-slate-400 flex items-center justify-center text-[10px] font-bold mr-3 shrink-0">3</div>
                           <div>
                               <h4 className="text-sm font-bold text-slate-300">Evidence Report</h4>
                               <div className="flex items-center mt-1 space-x-2">
                                   <span className="text-[10px] bg-apex-900 text-slate-400 px-1.5 py-0.5 rounded border border-apex-700">278 Credits</span>
                                   <span className="text-[10px] text-slate-500">~€150</span>
                               </div>
                           </div>
                       </div>

                       {/* Step 4 */}
                       <div className="relative z-10 flex items-start opacity-60">
                           <div className="w-6 h-6 rounded-full bg-apex-700 border-2 border-apex-800 text-slate-400 flex items-center justify-center text-[10px] font-bold mr-3 shrink-0">4</div>
                           <div>
                               <h4 className="text-sm font-bold text-slate-300">Outreach Protocol</h4>
                               <div className="flex items-center mt-1 space-x-2">
                                   <span className="text-[10px] bg-apex-900 text-slate-400 px-1.5 py-0.5 rounded border border-apex-700">463 Credits</span>
                                   <span className="text-[10px] text-slate-500">~€250</span>
                               </div>
                           </div>
                       </div>
                   </div>

                   <div className="mt-8 pt-6 border-t border-apex-700">
                       <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                           <div className="flex items-center mb-2">
                               <i className="fa-solid fa-coins text-blue-400 mr-2 text-xs"></i>
                               <span className="text-[10px] font-bold text-blue-300 uppercase">Pilot Pricing Active</span>
                           </div>
                           <p className="text-[10px] text-blue-200/70 leading-relaxed font-mono">
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

export default JobIntake;