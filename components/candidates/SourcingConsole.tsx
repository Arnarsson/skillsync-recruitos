import React from 'react';

interface SourcingConsoleProps {
    sourcingUrl: string;
    setSourcingUrl: (url: string) => void;
    handleSourcingRun: () => void;
    isSourcing: boolean;
    sourcingLog: string[];
}

export const SourcingConsole: React.FC<SourcingConsoleProps> = ({
    sourcingUrl,
    setSourcingUrl,
    handleSourcingRun,
    isSourcing,
    sourcingLog
}) => {
    return (
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
                    <div className="mt-4 bg-black/50 rounded-lg p-3 font-mono text-xs text-emerald-400 border border-apex-700/50 max-h-32 overflow-y-auto">
                        {sourcingLog.map((line, i) => <div key={i}>{line}</div>)}
                    </div>
                )}
            </div>
        </div>
    );
};
