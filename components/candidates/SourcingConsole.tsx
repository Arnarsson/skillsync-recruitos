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
        <div className="p-6 bg-slate-800/30 border border-white/[0.08] rounded-lg">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                        <i className="fa-solid fa-robot"></i>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">Sourcing Agent</h3>
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
                            className="w-full bg-slate-900/50 border border-white/[0.08] rounded-md h-10 pl-10 pr-4 text-sm text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none placeholder-slate-500"
                        />
                    </div>
                    <button
                        onClick={handleSourcingRun}
                        disabled={isSourcing || !sourcingUrl}
                        className={`px-6 h-10 rounded-md font-medium text-sm flex items-center transition-colors ${
                            isSourcing
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-500 text-white'
                        }`}
                    >
                        {isSourcing ? (
                            <>
                                <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>
                                Processing...
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-bolt mr-2"></i>
                                Run Analysis
                            </>
                        )}
                    </button>
                </div>

                {/* Console Log */}
                {sourcingLog.length > 0 && (
                    <div className="mt-4 bg-slate-900/50 rounded-md p-3 font-mono text-xs text-slate-300 border border-white/[0.08] max-h-32 overflow-y-auto">
                        {sourcingLog.map((line, i) => (
                            <div key={i} className="py-0.5">{line}</div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
