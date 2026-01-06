import React, { useState, useEffect } from 'react';
import { Candidate, FunnelStage } from '../types';
import { generateOutreach } from '../services/geminiService';

interface Props {
  candidate: Candidate;
  onClose: () => void;
}

const OutreachSuite: React.FC<Props> = ({ candidate, onClose }) => {
  const [template, setTemplate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    // Combine shared context if available
    const context = candidate.sharedContext?.join(', ') || "No direct overlap";
    
    // Prefer the mock hook if available for demo
    if (candidate.outreachHook) {
         setTemplate(`Hi ${candidate.name.split(' ')[0]},\n\n${candidate.outreachHook} We are building a similar architecture here at Apex and your background in ${candidate.keyEvidence?.[0] || 'frontend'} looks like a great fit.\n\nWould you be open to a 15 min chat?\n\nBest,\n[Recruiter Name]`);
         setLoading(false);
         return;
    }

    generateOutreach(candidate, context).then(t => {
        setTemplate(t);
        setLoading(false);
    });
  }, [candidate]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm md:p-4">
      <div className="w-full h-full md:w-[800px] md:h-[600px] bg-apex-900 border border-apex-700 md:rounded-xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-apex-800 flex justify-between items-center bg-apex-800 shrink-0">
            <div className="flex items-center space-x-3">
                <span className="text-emerald-500 font-mono text-[10px] uppercase tracking-widest bg-emerald-900/20 px-2 py-0.5 rounded">Step 4 of 4</span>
                <h3 className="text-lg font-bold text-white">Outreach Protocol</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                <i className="fa-solid fa-xmark"></i>
            </button>
        </div>

        <div className="flex-1 flex flex-col md:grid md:grid-cols-2 overflow-y-auto md:overflow-hidden">
            
            {/* Left: Strategy & Context */}
            <div className="p-4 md:p-6 border-b md:border-b-0 md:border-r border-apex-800 bg-apex-900/50 overflow-y-auto">
                <div className="mb-6">
                    <h4 className="text-xs font-bold uppercase text-slate-500 mb-3">Connection Path</h4>
                    {candidate.connectionPath ? (
                        <div className="p-3 bg-emerald-900/10 border border-emerald-900/30 rounded flex items-center">
                            <i className="fa-solid fa-route text-emerald-500 mr-3"></i>
                            <div>
                                <div className="text-sm font-bold text-emerald-400">Warm Intro Available</div>
                                <div className="text-xs text-slate-400">Via {candidate.connectionPath}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-3 bg-slate-800/50 border border-slate-700 rounded flex items-center">
                            <i className="fa-regular fa-snowflake text-slate-500 mr-3"></i>
                            <div className="text-xs text-slate-400">No direct path. Cold outreach recommended.</div>
                        </div>
                    )}
                </div>

                <div className="mb-6">
                    <h4 className="text-xs font-bold uppercase text-slate-500 mb-3">Shared Context Hooks</h4>
                    <div className="space-y-2">
                        {candidate.sharedContext && candidate.sharedContext.length > 0 ? candidate.sharedContext.map((ctx, i) => (
                            <div key={i} className="flex items-center text-xs text-slate-300">
                                <i className="fa-solid fa-check text-apex-accent mr-2"></i> {ctx}
                            </div>
                        )) : (
                            <div className="text-xs text-slate-500 italic">No shared history detected.</div>
                        )}
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-apex-700">
                    {/* Mandatory Disclaimer */}
                    <div className="mb-4 bg-blue-900/10 border border-blue-900/30 p-2 rounded">
                        <p className="text-[10px] text-blue-400 leading-relaxed font-mono">
                            <strong>ℹ️ Human Review Required:</strong> These suggestions are starting points. Review and personalize before sending. Do not use automated sending tools.
                        </p>
                    </div>

                    <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Human Approval</h4>
                    <div className="flex items-center text-xs text-slate-400 mb-4">
                        <input type="checkbox" className="mr-2 rounded bg-apex-800 border-apex-600" />
                        I certify I have reviewed the Evidence Report.
                    </div>
                    <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded border border-slate-600">
                        <i className="fa-solid fa-share-nodes mr-2"></i> Copy Shareable Link
                    </button>
                    <p className="text-[10px] text-center text-slate-600 mt-2">Link expires in 30 days.</p>
                </div>
            </div>

            {/* Right: The Draft */}
            <div className="p-4 md:p-6 bg-apex-800/30 flex flex-col h-[500px] md:h-auto">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-bold uppercase text-slate-500">Generated Draft</h4>
                    <button onClick={() => {}} className="text-[10px] text-apex-accent hover:text-white">
                        <i className="fa-solid fa-rotate mr-1"></i> Regenerate
                    </button>
                </div>

                <div className="flex-1 bg-apex-900 border border-apex-700 rounded-lg p-4 relative group">
                    {loading ? (
                         <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                            <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Writing...
                        </div>
                    ) : (
                        <textarea 
                            className="w-full h-full bg-transparent border-none focus:ring-0 text-sm text-slate-300 font-mono resize-none leading-relaxed"
                            value={template}
                            onChange={(e) => setTemplate(e.target.value)}
                        ></textarea>
                    )}
                </div>

                <div className="mt-4 flex space-x-3">
                    <button className="flex-1 py-3 bg-apex-accent hover:bg-blue-600 text-white font-bold rounded shadow-lg transition-colors text-sm">
                        <i className="fa-brands fa-linkedin mr-2"></i> Open LinkedIn
                    </button>
                    <button className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors" title="Copy to Clipboard">
                        <i className="fa-solid fa-copy"></i>
                    </button>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default OutreachSuite;