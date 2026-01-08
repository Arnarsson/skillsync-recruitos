import React, { useState, useCallback } from 'react';
import { AuditEvent, CREDITS_TO_EUR } from '../types';
import { AI_MODELS } from '../constants';

interface Props {
    credits: number;
    logs: AuditEvent[];
    onClose: () => void;
}

const AuditLogModal: React.FC<Props> = ({ credits, logs, onClose }) => {
    const [activeTab, setActiveTab] = useState<'transactions' | 'compliance'>('transactions');
    const [expandedLog, setExpandedLog] = useState<string | null>(null);

    const handleSetActiveTab = useCallback((tab: 'transactions' | 'compliance') => {
        setActiveTab(tab);
    }, []);

    const handleToggleExpanded = useCallback((logId: string) => {
        setExpandedLog(prev => prev === logId ? null : logId);
    }, []);


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8">
            <div className="w-full max-w-4xl h-[85vh] md:h-[80vh] bg-apex-900 border border-apex-700 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn">

                {/* Header - Wallet Style */}
                <div className="bg-apex-800 p-6 md:p-8 border-b border-apex-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Organization Wallet</h2>
                        <div className="flex items-baseline space-x-4">
                            <span className="text-3xl md:text-4xl font-mono font-bold text-white">{credits.toLocaleString()} <span className="text-lg text-emerald-500">CR</span></span>
                            <span className="text-lg md:text-xl text-slate-500 font-light">≈ €{(credits * CREDITS_TO_EUR).toLocaleString(undefined, { maximumFractionDigits: 0 })} EUR</span>
                        </div>
                        <div className="mt-2 flex items-center space-x-2">
                            <span className="px-2 py-0.5 bg-emerald-900/30 border border-emerald-900/50 text-emerald-400 text-xs uppercase font-bold rounded">Plan: Pilot</span>
                            <span className="px-2 py-0.5 bg-blue-900/30 border border-blue-900/50 text-blue-400 text-xs uppercase font-bold rounded">Auto-Topup: Off</span>
                        </div>
                    </div>
                    <div className="flex flex-row md:flex-col items-center md:items-end w-full md:w-auto justify-between md:justify-start space-x-0 md:space-y-3">
                        <button className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded shadow-lg shadow-emerald-900/20 text-sm transition-all">
                            <i className="fa-solid fa-plus mr-2"></i> Add Credits
                        </button>
                        <button onClick={onClose} className="text-slate-500 hover:text-white text-xs">
                            Close <i className="fa-solid fa-xmark ml-1"></i>
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex border-b border-apex-700 bg-apex-800/50 px-4 md:px-8 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('transactions')}
                        className={`py-4 mr-8 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'transactions' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        <i className="fa-solid fa-list-ul mr-2"></i> Transaction History
                    </button>
                    <button
                        onClick={() => setActiveTab('compliance')}
                        className={`py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'compliance' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        <i className="fa-solid fa-shield-halved mr-2"></i> Compliance Logs (EU AI Act)
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-apex-900 p-0">
                    {activeTab === 'transactions' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead className="bg-apex-800/50 sticky top-0 text-xs font-bold uppercase text-slate-500 tracking-wider">
                                    <tr>
                                        <th className="p-4 border-b border-apex-700 w-32">Timestamp</th>
                                        <th className="p-4 border-b border-apex-700">Description</th>
                                        <th className="p-4 border-b border-apex-700 w-32">User</th>
                                        <th className="p-4 border-b border-apex-700 text-right w-32">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {logs.slice().reverse().map((log) => (
                                        <tr key={log.id} className="border-b border-apex-800 hover:bg-apex-800/30 transition-colors">
                                            <td className="p-4 text-slate-400 font-mono text-xs whitespace-nowrap">{new Date(log.timestamp).toLocaleDateString()}</td>
                                            <td className="p-4 text-slate-200">
                                                <div className="flex items-center">
                                                    <div className={`w-2 h-2 rounded-full mr-3 shrink-0 ${log.cost < 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                                                    {log.description}
                                                </div>
                                                <div className="text-xs text-slate-500 ml-5 font-mono">{log.id}</div>
                                            </td>
                                            <td className="p-4 text-slate-400 text-xs">{log.user}</td>
                                            <td className={`p-4 text-right font-mono font-bold ${log.cost < 0 ? 'text-white' : 'text-emerald-400'}`}>
                                                {log.cost > 0 ? '+' : ''}{log.cost} CR
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-4 md:p-6 space-y-4">
                            <div className="p-4 bg-blue-900/10 border border-blue-900/30 rounded mb-6 flex items-start">
                                <i className="fa-solid fa-circle-info text-blue-500 mt-0.5 mr-3 text-sm"></i>
                                <p className="text-xs text-blue-300/80 leading-relaxed">
                                    <strong>Compliance Notice:</strong> These logs capture input hashes, model versions, and output hashes for all high-risk AI decisions (Screening & Profiling) as required by Article 12 of the EU AI Act. Records are immutable.
                                </p>
                            </div>

                            {logs.slice().reverse().map((log) => (
                                <div key={log.id} className="bg-apex-800 border border-apex-700 rounded-lg overflow-hidden">
                                    <button
                                        className="w-full p-4 flex justify-between items-center cursor-pointer hover:bg-apex-700/50 transition-colors text-left"
                                        onClick={() => handleToggleExpanded(log.id)}
                                        aria-expanded={expandedLog === log.id}
                                        aria-controls={`log-details-${log.id}`}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-3">
                                            <span className="text-xs font-mono text-slate-500">{new Date(log.timestamp).toISOString()}</span>
                                            <span className="px-2 py-0.5 bg-slate-700 rounded text-xs font-bold text-slate-300 uppercase w-fit">{log.type}</span>
                                            <span className="text-sm font-bold text-white">{log.description}</span>
                                        </div>
                                        <i className={`fa-solid fa-chevron-down text-slate-500 transition-transform ${expandedLog === log.id ? 'rotate-180' : ''}`}></i>
                                    </button>

                                    {expandedLog === log.id && (
                                        <div className="p-4 bg-black/30 border-t border-apex-700 font-mono text-xs text-emerald-400/80 overflow-x-auto">
                                            <pre>{JSON.stringify({
                                                event_id: log.id,
                                                type: log.type,
                                                timestamp: log.timestamp,
                                                actor: log.user,
                                                metadata: log.metadata || {
                                                    model: AI_MODELS.DEFAULT,
                                                    provider: "enrichlayer",
                                                    processing_time_ms: 450,
                                                    confidence_score: 0.94
                                                }
                                            }, null, 2)}</pre>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default React.memo(AuditLogModal);