import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PRICING, CREDITS_TO_EUR, formatPrice } from '../types';
import { useToast, StepBadge } from './ui';

const JobIntake: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [jobDesc, setJobDesc] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [managerUrl, setManagerUrl] = useState('');
  const [benchmarkUrl, setBenchmarkUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation per Spec 17.3
  const validateInputs = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (jobDesc.length < 100) {
      newErrors.jobDesc = 'Job description must be at least 100 characters';
    }
    if (jobDesc.length > 10000) {
      newErrors.jobDesc = 'Job description must be under 10,000 characters';
    }
    if (companyUrl && !companyUrl.match(/linkedin\.com\/company\/[a-zA-Z0-9-]+/)) {
      newErrors.companyUrl = 'Please enter a valid LinkedIn company URL';
    }
    if (managerUrl && !managerUrl.match(/linkedin\.com\/in\/[a-zA-Z0-9-]+/)) {
      newErrors.managerUrl = 'Please enter a valid LinkedIn profile URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleMockFill = () => {
    setJobDesc(`Role: Senior Frontend Engineer
Location: Copenhagen (Hybrid)

About Us:
We're building the next generation of financial infrastructure at Apex Financial Systems. Our platform processes billions in transactions daily, and we need engineers who can build reliable, scalable frontends.

Requirements:
- 5+ years with React, TypeScript and Next.js
- Experience with large-scale data visualization (charts, dashboards)
- Experience from regulated industries (Fintech/Pharma preferred)
- Architecture ownership mindset - you'll own the frontend platform
- Mentorship of junior developers

Nice to Have:
- Experience with micro-frontends or module federation
- Knowledge of WebSocket real-time data
- Contributions to open source projects

What We Offer:
- Competitive salary (700-850k DKK)
- Equity package
- Flexible hybrid work (3 days office)
- Learning budget`);
    setCompanyUrl('https://linkedin.com/company/apex-financial-systems');
    setManagerUrl('https://linkedin.com/in/lars-jensen-vp-eng');
    setBenchmarkUrl('https://linkedin.com/in/sofie-nielsen-tech-lead');
    setErrors({});
    addToast('success', 'Demo data loaded');
  };

  const handleStart = () => {
    if (!validateInputs()) {
      addToast('error', 'Please fix the errors before continuing');
      return;
    }
    
    setIsProcessing(true);
    addToast('info', 'Initializing job context...');
    
    setTimeout(() => {
      addToast('success', 'Job context created! Generating shortlist...');
      navigate('/shortlist');
    }, 1500);
  };

  const charCount = jobDesc.length;
  const isValidLength = charCount >= 100 && charCount <= 10000;

  return (
    <div className="h-full flex flex-col p-8 bg-apex-900 overflow-y-auto custom-scrollbar">
      
      {/* Header */}
      <header className="mb-8">
        <StepBadge step={1} label="Job Context" color="emerald" price={{ free: true }} />
        <h1 className="text-3xl font-bold text-white mt-4">Context & Job Intake</h1>
        <p className="text-slate-400 mt-2 text-sm max-w-2xl">
          Provide the job context and team profiles. This establishes the baseline for AI-powered match scoring.
          All information is used to calibrate cultural and technical alignment.
        </p>
      </header>

      <div className="flex gap-8 max-w-7xl">
        {/* Main Input Column */}
        <div className="flex-1 space-y-6">
          
          {/* Social Context Card */}
          <section className="bg-apex-800 border border-apex-700 rounded-xl p-6 shadow-lg relative overflow-hidden">
            <div className="flex items-center space-x-3 mb-5 border-b border-apex-700 pb-4">
              <div className="w-9 h-9 rounded-lg bg-blue-900/30 flex items-center justify-center text-blue-400">
                <i className="fa-solid fa-users-line"></i>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Team Context</h2>
                <p className="text-[10px] text-blue-400 uppercase tracking-wide font-bold">Critical for Culture Match</p>
              </div>
            </div>
                   
            <div className="space-y-5">
              {/* Company URL */}
              <div>
                <label htmlFor="companyUrl" className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Company LinkedIn URL
                </label>
                <div className="relative">
                  <i className="fa-brands fa-linkedin absolute left-3 top-3 text-slate-500"></i>
                  <input 
                    id="companyUrl"
                    type="url"
                    className={`w-full bg-apex-900 border rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition-all ${
                      errors.companyUrl 
                        ? 'border-red-500 focus:ring-red-500/50' 
                        : 'border-apex-700 focus:border-blue-500 focus:ring-blue-500/30'
                    }`}
                    placeholder="https://linkedin.com/company/..."
                    value={companyUrl}
                    onChange={(e) => { setCompanyUrl(e.target.value); setErrors(prev => ({...prev, companyUrl: ''})); }}
                    aria-describedby={errors.companyUrl ? 'companyUrl-error' : undefined}
                  />
                </div>
                {errors.companyUrl && (
                  <p id="companyUrl-error" className="text-xs text-red-400 mt-1 flex items-center">
                    <i className="fa-solid fa-circle-exclamation mr-1"></i> {errors.companyUrl}
                  </p>
                )}
              </div>

              {/* Manager & Benchmark URLs */}
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label htmlFor="managerUrl" className="block text-xs font-bold text-slate-400 uppercase mb-2">
                    Hiring Manager LinkedIn
                  </label>
                  <div className="relative">
                    <i className="fa-brands fa-linkedin absolute left-3 top-3 text-slate-500"></i>
                    <input 
                      id="managerUrl"
                      type="url"
                      className={`w-full bg-apex-900 border rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition-all ${
                        errors.managerUrl 
                          ? 'border-red-500 focus:ring-red-500/50' 
                          : 'border-apex-700 focus:border-blue-500 focus:ring-blue-500/30'
                      }`}
                      placeholder="https://linkedin.com/in/..."
                      value={managerUrl}
                      onChange={(e) => { setManagerUrl(e.target.value); setErrors(prev => ({...prev, managerUrl: ''})); }}
                    />
                  </div>
                  {errors.managerUrl && (
                    <p className="text-xs text-red-400 mt-1 flex items-center">
                      <i className="fa-solid fa-circle-exclamation mr-1"></i> {errors.managerUrl}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="benchmarkUrl" className="block text-xs font-bold text-slate-400 uppercase mb-2">
                    Top Performer (Benchmark)
                  </label>
                  <div className="relative">
                    <i className="fa-brands fa-linkedin absolute left-3 top-3 text-slate-500"></i>
                    <input 
                      id="benchmarkUrl"
                      type="url"
                      className="w-full bg-apex-900 border border-apex-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
                      placeholder="https://linkedin.com/in/..."
                      value={benchmarkUrl}
                      onChange={(e) => setBenchmarkUrl(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
                   
            {/* Info Box */}
            <div className="mt-5 p-3 bg-apex-900/50 rounded-lg border border-apex-700/50 flex items-start">
              <i className="fa-solid fa-circle-info text-blue-500 mt-0.5 mr-3 text-sm"></i>
              <p className="text-xs text-slate-400 leading-relaxed">
                We analyze these profiles to calibrate for <strong className="text-slate-300">team culture</strong>, <strong className="text-slate-300">communication style</strong>, and <strong className="text-slate-300">educational background</strong>. 
                This helps generate more accurate match scores.
              </p>
            </div>
                   
            {/* Demo Button */}
            <button 
              onClick={handleMockFill}
              className="absolute top-6 right-6 text-[10px] text-blue-400 hover:text-blue-300 font-mono transition-colors opacity-70 hover:opacity-100 flex items-center bg-blue-900/20 px-2 py-1 rounded border border-blue-900/30"
            >
              <i className="fa-solid fa-wand-magic-sparkles mr-1.5"></i> Load Demo
            </button>
          </section>

          {/* Job Description Card */}
          <section className="bg-apex-800 border border-apex-700 rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-5 border-b border-apex-700 pb-4">
              <div className="w-9 h-9 rounded-lg bg-emerald-900/30 flex items-center justify-center text-emerald-400">
                <i className="fa-solid fa-file-lines"></i>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white">Job Description</h2>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Required for matching</p>
              </div>
            </div>
                   
            <div className="relative">
              <textarea 
                id="jobDesc"
                className={`w-full h-56 bg-apex-900 border rounded-lg p-4 text-sm text-slate-300 focus:outline-none focus:ring-2 font-mono leading-relaxed resize-none transition-all ${
                  errors.jobDesc 
                    ? 'border-red-500 focus:ring-red-500/50' 
                    : 'border-apex-700 focus:border-emerald-500 focus:ring-emerald-500/30'
                }`}
                placeholder="Paste full job description here including role, requirements, nice-to-haves, and what you offer..."
                value={jobDesc}
                onChange={(e) => { setJobDesc(e.target.value); setErrors(prev => ({...prev, jobDesc: ''})); }}
                aria-describedby="jobDesc-hint"
              ></textarea>
              
              {/* Character count */}
              <div className={`absolute bottom-4 right-4 text-[10px] font-mono pointer-events-none flex items-center space-x-2 ${
                !isValidLength && charCount > 0 ? 'text-red-400' : 'text-slate-600'
              }`}>
                <span>{charCount.toLocaleString()}</span>
                <span>/</span>
                <span>100-10,000</span>
              </div>
            </div>
            
            {errors.jobDesc && (
              <p className="text-xs text-red-400 mt-2 flex items-center">
                <i className="fa-solid fa-circle-exclamation mr-1"></i> {errors.jobDesc}
              </p>
            )}
            <p id="jobDesc-hint" className="text-[10px] text-slate-600 mt-2">
              Include: role title, location, requirements, nice-to-haves, salary range, team info
            </p>

            {/* Action Button */}
            <div className="mt-6 flex justify-between items-center">
              <div className="text-xs text-slate-500">
                {charCount >= 100 && (
                  <span className="text-emerald-500">
                    <i className="fa-solid fa-check mr-1"></i> Ready to proceed
                  </span>
                )}
              </div>
              <button 
                onClick={handleStart}
                disabled={isProcessing || charCount < 100}
                className={`
                  relative px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wide transition-all shadow-lg 
                  ${isProcessing || charCount < 100
                    ? 'bg-apex-700 text-slate-500 cursor-not-allowed' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30 hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0'
                  }
                `}
                aria-busy={isProcessing}
              >
                {isProcessing ? (
                  <span className="flex items-center">
                    <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Initializing...
                  </span>
                ) : (
                  <span className="flex items-center">
                    Generate Shortlist <i className="fa-solid fa-arrow-right ml-2"></i>
                  </span>
                )}
              </button>
            </div>
          </section>
        </div>

        {/* Process Preview Sidebar */}
        <aside className="w-80 space-y-4">
          <div className="bg-apex-800 border border-apex-700 rounded-xl p-6 sticky top-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hiring Funnel</h3>
              <div className="flex items-center space-x-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] text-emerald-400 font-bold">ACTIVE</span>
              </div>
            </div>
                   
            <div className="space-y-6 relative">
              {/* Vertical Line */}
              <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-apex-700 z-0"></div>

              {/* Steps */}
              {[
                { step: 1, label: 'Job Intake', desc: 'Context & calibration', credits: 'Free', active: true },
                { step: 2, label: 'Shortlist', desc: 'Match scores for candidates', credits: PRICING.SHORTLIST },
                { step: 3, label: 'Evidence Report', desc: 'Deep career analysis', credits: PRICING.EVIDENCE_REPORT },
                { step: 4, label: 'Outreach Protocol', desc: 'Channels & templates', credits: PRICING.OUTREACH }
              ].map((item, idx) => (
                <div key={item.step} className={`relative z-10 flex items-start ${idx > 0 ? 'opacity-50' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mr-3 shrink-0 border-2 border-apex-800 ${
                    item.active 
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                      : 'bg-apex-700 text-slate-400'
                  }`}>
                    {item.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-bold ${item.active ? 'text-white' : 'text-slate-300'}`}>
                      {item.label}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                    <div className="flex items-center mt-1.5 space-x-2">
                      <span className="text-[10px] bg-apex-900 text-slate-400 px-1.5 py-0.5 rounded border border-apex-700 font-mono">
                        {typeof item.credits === 'string' ? item.credits : `${item.credits} Cr`}
                      </span>
                      {typeof item.credits === 'number' && (
                        <span className="text-[10px] text-slate-600">~€{Math.round(item.credits * CREDITS_TO_EUR)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing Info */}
            <div className="mt-8 pt-6 border-t border-apex-700">
              <div className="bg-gradient-to-br from-blue-900/20 to-blue-900/5 border border-blue-900/30 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <i className="fa-solid fa-coins text-blue-400 mr-2 text-sm"></i>
                  <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wide">Pilot Package</span>
                </div>
                <p className="text-xs text-blue-200/70 leading-relaxed">
                  <strong className="text-blue-200">5,000 credits</strong> = 20,000 DKK
                </p>
                <p className="text-[10px] text-blue-200/50 mt-1">
                  1 Credit ≈ 4 DKK (~€{CREDITS_TO_EUR})
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default JobIntake;
