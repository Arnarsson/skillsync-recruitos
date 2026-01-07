
import React, { useState } from 'react';
import { MOCK_CANDIDATES } from '../constants';
import { Candidate, FunnelStage, PRICING, CREDITS_TO_EUR, Persona } from '../types';
import { analyzeCandidateProfile, generatePersona } from '../services/geminiService';
import { scrapeUrlContent } from '../services/scrapingService';
import { usePersistedState } from '../hooks/usePersistedState';

interface Props {
  jobContext: string;
  credits: number;
  onSpendCredits: (amount: number, description?: string) => void;
  onSelectCandidate: (candidate: Candidate) => void;
}

const ShortlistGrid: React.FC<Props> = ({ jobContext, credits, onSpendCredits, onSelectCandidate }) => {
  const [candidates, setCandidates] = usePersistedState<Candidate[]>('apex_candidates', MOCK_CANDIDATES);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'sourcing'>('pipeline');
  
  // Sourcing State
  const [sourcingUrl, setSourcingUrl] = useState('');
  const [isSourcing, setIsSourcing] = useState(false);
  const [sourcingLog, setSourcingLog] = useState<string[]>([]);
  
  // Import Modal State
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const addToLog = (msg: string) => setSourcingLog(prev => [...prev, `> ${msg}`]);

  const handleUnlockProfile = (e: React.MouseEvent, candidateId: string, candidateName: string) => {
    e.stopPropagation();
    if (credits < PRICING.DEEP_PROFILE) {
        alert("Insufficient credits for pilot.");
        return;
    }
    onSpendCredits(PRICING.DEEP_PROFILE, `Unlocked Evidence Report: ${candidateName}`);
    
    setCandidates(prev => prev.map(c => {
        if (c.id === candidateId) {
            const newSteps = [...c.unlockedSteps, FunnelStage.DEEP_PROFILE];
            return { ...c, unlockedSteps: newSteps };
        }
        return c;
    }));
  };

  const handleSourcingRun = async () => {
    if (!sourcingUrl) return;
    if (credits < PRICING.SOURCING_SCAN) {
        alert("Insufficient credits for sourcing scan.");
        return;
    }

    setIsSourcing(true);
    setSourcingLog([]);
    addToLog(`Initializing Sourcing Agent for: ${sourcingUrl}`);
    
    try {
        // 1. Scrape
        addToLog(`Step 1: Ingesting public profile data via Firecrawl...`);
        const rawMarkdown = await scrapeUrlContent(sourcingUrl);
        addToLog(`✓ Data Ingested (${rawMarkdown.length} chars).`);

        // 2. Persona Engine
        addToLog(`Step 2: Constructing Psychometric Persona...`);
        const persona = await generatePersona(rawMarkdown);
        addToLog(`✓ Persona Identified: ${persona.archetype}`);

        // 3. Fit Analysis
        addToLog(`Step 3: Calculating Job Fit & Scoring...`);
        const candidate = await analyzeCandidateProfile(rawMarkdown, jobContext, persona);
        
        // Add URL for reference
        candidate.sourceUrl = sourcingUrl;
        
        setCandidates(prev => [candidate, ...prev]);
        addToLog(`✓ Candidate Added to Pipeline.`);
        onSpendCredits(PRICING.SOURCING_SCAN, `Sourcing Run: ${candidate.name}`);
        setSourcingUrl(''); // Clear input

    } catch (error: any) {
        console.error(error);
        addToLog(`ERROR: ${error.message}`);
    } finally {
        setIsSourcing(false);
    }
  };

  const handleImport = async () => {
      if (!importText.trim()) return;
      if (!jobContext) {
          alert("Please set a Job Context in Step 1 first.");
          return;
      }
      setIsImporting(true);
      try {
          const newCandidate = await analyzeCandidateProfile(importText, jobContext);
          setCandidates(prev => [newCandidate, ...prev]);
          setShowImport(false);
          setImportText('');
          onSpendCredits(10, `Imported Candidate: ${newCandidate.name}`); 
      } catch (e: any) {
          console.error(e);
          alert(e.message || "Failed to analyze candidate. Ensure Gemini API key is active.");
      } finally {
          setIsImporting(false);
      }
  };

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
                    onClick={() => setActiveTab('pipeline')}
                    className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${activeTab === 'pipeline' ? 'bg-apex-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Pipeline
                </button>
                <button 
                    onClick={() => setActiveTab('sourcing')}
                    className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${activeTab === 'sourcing' ? 'bg-apex-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Auto-Sourcing <span className="ml-1 px-1 bg-emerald-600 text-[9px] rounded text-white">NEW</span>
                </button>
            </div>
        </div>

        <div className="flex items-center space-x-4">
            <button 
                onClick={() => setShowImport(true)}
                className="hidden md:flex items-center px-4 py-2 bg-apex-800 border border-apex-600 hover:bg-apex-700 text-slate-300 text-xs font-bold rounded transition-all"
            >
                <i className="fa-solid fa-file-import mr-2"></i> Quick Paste
            </button>
            <div className="text-xs text-slate-500">
                {candidates.length} Candidates
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
                              onChange={(e) => setSourcingUrl(e.target.value)}
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
                      <div className="mt-4 bg-black/50 rounded-lg p-3 font-mono text-[10px] text-emerald-400 border border-apex-700/50 max-h-32 overflow-y-auto">
                          {sourcingLog.map((line, i) => <div key={i}>{line}</div>)}
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Import Modal */}
      {showImport && (
          <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-2xl bg-apex-900 border border-apex-700 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
                  <div className="p-4 border-b border-apex-700 bg-apex-800 flex justify-between items-center">
                      <h3 className="text-white font-bold">Import Candidate Data</h3>
                      <button onClick={() => setShowImport(false)} className="text-slate-500 hover:text-white"><i className="fa-solid fa-xmark"></i></button>
                  </div>
                  <div className="p-4">
                      <p className="text-xs text-slate-400 mb-2">
                        <strong>Instructions:</strong> Go to a LinkedIn Profile → Press <code className="bg-apex-800 px-1 rounded border border-apex-700">Ctrl+A</code> then <code className="bg-apex-800 px-1 rounded border border-apex-700">Ctrl+C</code> → Paste here.
                      </p>
                      <textarea 
                        className="w-full h-64 bg-apex-950 border border-apex-700 rounded p-3 text-sm text-slate-300 font-mono focus:border-emerald-500 outline-none"
                        placeholder="Paste text here..."
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                      ></textarea>
                  </div>
                  <div className="p-4 border-t border-apex-800 flex justify-end">
                      <button 
                        onClick={handleImport}
                        disabled={isImporting}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded flex items-center"
                      >
                          {isImporting ? <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> : <i className="fa-solid fa-bolt mr-2"></i>}
                          {isImporting ? 'Analyzing...' : 'Analyze & Add'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Grid Header (Desktop Only) */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-apex-800 border-b border-apex-700 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
        <div className="col-span-4">Candidate & Persona</div>
        <div className="col-span-2 text-center">Match Score</div>
        <div className="col-span-4">Evidence Summary</div>
        <div className="col-span-2 text-right">Action</div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-3">
        {candidates.length === 0 ? (
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
            candidates.map((c) => {
                const isDeepProfileUnlocked = c.unlockedSteps.includes(FunnelStage.DEEP_PROFILE);
                
                return (
                    <div 
                        key={c.id} 
                        onClick={() => isDeepProfileUnlocked ? onSelectCandidate(c) : null}
                        className={`
                            flex flex-col md:grid md:grid-cols-12 gap-4 p-4 rounded-xl border transition-all items-start md:items-center relative
                            ${isDeepProfileUnlocked 
                                ? 'bg-apex-800/40 border-apex-700 hover:border-emerald-500/50 cursor-pointer group' 
                                : 'bg-apex-900 border-apex-800 opacity-80'
                            }
                        `}
                    >
                        {/* Candidate Info + Persona */}
                        <div className="col-span-4 w-full md:w-auto">
                            <div className="flex items-center mb-1">
                                <img src={c.avatar} className="w-10 h-10 rounded-full border border-slate-700 mr-3 grayscale group-hover:grayscale-0 transition-all" alt="avatar" />
                                <div>
                                    <div className="text-sm font-bold text-slate-200">{c.name}</div>
                                    <div className="text-xs text-slate-500">{c.currentRole}</div>
                                </div>
                            </div>
                            
                            {/* Persona Badge (New) */}
                            {c.persona && (
                                <div className="mt-2 flex items-center space-x-2">
                                    <span className="text-[9px] bg-purple-900/30 text-purple-300 border border-purple-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                                        <i className="fa-solid fa-fingerprint mr-1"></i> {c.persona.archetype}
                                    </span>
                                    {/* Flags */}
                                    {c.persona.redFlags?.length > 0 && (
                                        <div className="relative group/flag">
                                            <i className="fa-solid fa-flag text-red-500 text-xs cursor-help"></i>
                                            <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-black border border-red-900 rounded shadow-lg text-[10px] text-red-300 hidden group-hover/flag:block z-20">
                                                <strong>Risks:</strong>
                                                <ul className="list-disc list-inside mt-1">
                                                    {c.persona.redFlags.slice(0, 2).map((flag, i) => <li key={i}>{flag}</li>)}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Match Score (Desktop) */}
                        <div className="col-span-2 hidden md:flex flex-col items-center justify-center">
                            <div className={`text-lg font-bold font-mono ${c.alignmentScore > 80 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                {c.alignmentScore}%
                            </div>
                            <div className="w-16 h-1 bg-apex-700 rounded-full mt-1">
                                <div 
                                    className={`h-full rounded-full ${c.alignmentScore > 80 ? 'bg-emerald-500' : 'bg-yellow-500'}`} 
                                    style={{width: `${c.alignmentScore}%`}}
                                ></div>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="col-span-4 w-full">
                            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 md:line-clamp-none">"{c.shortlistSummary}"</p>
                            <div className="mt-2 flex space-x-2">
                                <span className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded border border-slate-700">Confidence: High</span>
                            </div>
                        </div>

                        {/* Action */}
                        <div className="col-span-2 flex justify-end w-full md:w-auto mt-2 md:mt-0">
                            {isDeepProfileUnlocked ? (
                                <button className="w-full md:w-auto px-4 py-2 bg-apex-800 hover:bg-apex-700 text-emerald-400 text-xs font-bold rounded border border-emerald-900/30 flex items-center justify-center transition-colors">
                                    <i className="fa-solid fa-file-invoice mr-2"></i> View Report
                                </button>
                            ) : (
                                <button 
                                    onClick={(e) => handleUnlockProfile(e, c.id, c.name)}
                                    className="w-full md:w-auto px-4 py-2 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-400 text-xs font-bold rounded border border-slate-700 flex items-center justify-center transition-all shadow-sm hover:shadow-emerald-500/20"
                                >
                                    <i className="fa-solid fa-lock mr-2"></i> Unlock ({PRICING.DEEP_PROFILE} Cr)
                                </button>
                            )}
                        </div>
                    </div>
                );
            })
        )}
        {/* Mobile Import Button at bottom */}
        {candidates.length > 0 && activeTab !== 'sourcing' && (
             <button 
                onClick={() => setShowImport(true)}
                className="md:hidden w-full py-3 bg-apex-800 border border-dashed border-apex-700 text-slate-400 rounded-lg text-sm font-bold mt-4"
            >
                <i className="fa-solid fa-plus mr-2"></i> Import Candidate
            </button>
        )}
      </div>
    </div>
  );
};

export default ShortlistGrid;
