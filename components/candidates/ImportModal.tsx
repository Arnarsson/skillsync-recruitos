import React from 'react';

interface ImportModalProps {
    showImport: boolean;
    setShowImport: (show: boolean) => void;
    importText: string;
    setImportText: (text: string) => void;
    handleImport: () => void;
    isImporting: boolean;
}

export const ImportModal: React.FC<ImportModalProps> = ({
    showImport,
    setShowImport,
    importText,
    setImportText,
    handleImport,
    isImporting
}) => {
    if (!showImport) return null;

    return (
        <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-apex-900 border border-apex-700 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
                <div className="p-4 border-b border-apex-700 bg-apex-800 flex justify-between items-center">
                    <div>
                        <h3 className="text-white font-bold flex items-center">
                            <i className="fa-solid fa-paste mr-2 text-emerald-500"></i>
                            Quick Paste - Manual Import
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">Get 100% data accuracy - Copy full LinkedIn profile</p>
                    </div>
                    <button onClick={() => setShowImport(false)} className="text-slate-500 hover:text-white"><i className="fa-solid fa-xmark"></i></button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Enhanced Instructions */}
                    <div className="bg-blue-950/30 border border-blue-800/50 rounded-lg p-4">
                        <h4 className="text-blue-400 font-bold text-sm mb-3 flex items-center">
                            <i className="fa-solid fa-circle-info mr-2"></i>
                            Step-by-Step Instructions
                        </h4>
                        <ol className="text-xs text-slate-300 space-y-2">
                            <li className="flex items-start">
                                <span className="bg-emerald-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2 mt-0.5 shrink-0">1</span>
                                <span>Open the LinkedIn profile in your browser</span>
                            </li>
                            <li className="flex items-start">
                                <span className="bg-emerald-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2 mt-0.5 shrink-0">2</span>
                                <span>Press <code className="bg-apex-800 px-1.5 py-0.5 rounded border border-apex-700 mx-1 font-mono">Ctrl+A</code> (or <code className="bg-apex-800 px-1.5 py-0.5 rounded border border-apex-700 mx-1 font-mono">⌘+A</code> on Mac) to select all</span>
                            </li>
                            <li className="flex items-start">
                                <span className="bg-emerald-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2 mt-0.5 shrink-0">3</span>
                                <span>Press <code className="bg-apex-800 px-1.5 py-0.5 rounded border border-apex-700 mx-1 font-mono">Ctrl+C</code> (or <code className="bg-apex-800 px-1.5 py-0.5 rounded border border-apex-700 mx-1 font-mono">⌘+C</code> on Mac) to copy</span>
                            </li>
                            <li className="flex items-start">
                                <span className="bg-emerald-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2 mt-0.5 shrink-0">4</span>
                                <span>Click in the text area below and press <code className="bg-apex-800 px-1.5 py-0.5 rounded border border-apex-700 mx-1 font-mono">Ctrl+V</code> to paste</span>
                            </li>
                            <li className="flex items-start">
                                <span className="bg-emerald-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2 mt-0.5 shrink-0">5</span>
                                <span>Click &quot;Analyze & Add&quot; - AI will extract experience, skills, education automatically</span>
                            </li>
                        </ol>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-lg p-3">
                            <h5 className="text-emerald-400 font-bold text-xs mb-2 flex items-center">
                                <i className="fa-solid fa-check-circle mr-1.5"></i>
                                Best Results With:
                            </h5>
                            <ul className="text-[11px] text-slate-300 space-y-1">
                                <li>✓ Full LinkedIn profile page</li>
                                <li>✓ Experience section visible</li>
                                <li>✓ Skills section expanded</li>
                                <li>✓ Education section visible</li>
                            </ul>
                        </div>
                        <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg p-3">
                            <h5 className="text-amber-400 font-bold text-xs mb-2 flex items-center">
                                <i className="fa-solid fa-lightbulb mr-1.5"></i>
                                Pro Tips:
                            </h5>
                            <ul className="text-[11px] text-slate-300 space-y-1">
                                <li>💡 Works with any text format</li>
                                <li>💡 Paste resume/CV text directly</li>
                                <li>💡 AI extracts relevant info</li>
                                <li>💡 100% data accuracy</li>
                            </ul>
                        </div>
                    </div>

                    <div className="relative">
                        <textarea
                            className="w-full h-64 bg-apex-950 border border-apex-700 rounded-lg p-4 text-sm text-slate-300 font-mono focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none"
                            placeholder="Paste LinkedIn profile text here..."
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                        ></textarea>
                        <div className="absolute bottom-3 right-3 text-xs text-slate-500 bg-apex-900/80 px-2 py-1 rounded">
                            {importText.length} characters
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-apex-800 flex justify-between items-center bg-apex-900/50">
                    <div className="text-xs text-slate-500">
                        <i className="fa-solid fa-shield-halved mr-1 text-emerald-600"></i>
                        Data stays local - AI extracts info directly
                    </div>
                    <button
                        onClick={handleImport}
                        disabled={isImporting || !importText.trim()}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg flex items-center transition-all shadow-lg hover:shadow-emerald-500/20"
                    >
                        {isImporting ? <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> : <i className="fa-solid fa-bolt mr-2"></i>}
                        {isImporting ? 'Analyzing with AI...' : 'Analyze & Add'}
                    </button>
                </div>
            </div>
        </div>
    );
};
