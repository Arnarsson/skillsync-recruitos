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
        <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-slate-900 border border-white/[0.08] rounded-lg flex flex-col overflow-hidden animate-fade-in">
                <div className="p-4 border-b border-white/[0.05] flex justify-between items-center">
                    <div>
                        <h3 className="text-white font-medium flex items-center">
                            <i className="fa-solid fa-paste mr-2 text-slate-400"></i>
                            Import Candidate
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">Paste LinkedIn profile or resume text</p>
                    </div>
                    <button onClick={() => setShowImport(false)} className="w-8 h-8 rounded-md hover:bg-white/5 text-slate-400 hover:text-white transition-colors flex items-center justify-center">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Instructions */}
                    <div className="bg-slate-800/50 border border-white/[0.05] rounded-md p-4">
                        <h4 className="text-sm font-medium text-white mb-3 flex items-center">
                            <i className="fa-solid fa-circle-info mr-2 text-slate-400"></i>
                            How to import
                        </h4>
                        <ol className="text-xs text-slate-400 space-y-2">
                            <li className="flex items-start gap-2">
                                <span className="bg-slate-700 text-slate-300 rounded w-5 h-5 flex items-center justify-center text-xs font-medium shrink-0">1</span>
                                <span>Open the LinkedIn profile in your browser</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="bg-slate-700 text-slate-300 rounded w-5 h-5 flex items-center justify-center text-xs font-medium shrink-0">2</span>
                                <span>Select all (<code className="bg-slate-700 px-1 rounded text-slate-300">Ctrl+A</code>) and copy (<code className="bg-slate-700 px-1 rounded text-slate-300">Ctrl+C</code>)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="bg-slate-700 text-slate-300 rounded w-5 h-5 flex items-center justify-center text-xs font-medium shrink-0">3</span>
                                <span>Paste below - AI will extract the relevant information</span>
                            </li>
                        </ol>
                    </div>

                    <div className="relative">
                        <textarea
                            className="w-full h-56 bg-slate-900/50 border border-white/[0.08] rounded-md p-4 text-sm text-slate-300 font-mono focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none transition-colors placeholder-slate-500"
                            placeholder="Paste LinkedIn profile or resume text here..."
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                        ></textarea>
                        <div className="absolute bottom-3 right-3 text-xs text-slate-500 tabular-nums">
                            {importText.length} chars
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-white/[0.05] flex justify-between items-center">
                    <div className="text-xs text-slate-500">
                        <i className="fa-solid fa-shield-halved mr-1"></i>
                        Data stays local
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowImport(false)}
                            className="h-9 px-4 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={isImporting || !importText.trim()}
                            className="h-9 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md flex items-center transition-colors"
                        >
                            {isImporting ? <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> : <i className="fa-solid fa-sparkles mr-2"></i>}
                            {isImporting ? 'Analyzing...' : 'Analyze & Add'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
