
import React, { useState, useEffect } from 'react';
import { ToastType } from './ToastNotification';

interface Props {
    onClose: () => void;
    addToast: (type: ToastType, message: string) => void;
}

const AdminSettingsModal: React.FC<Props> = ({ onClose, addToast }) => {
    const [firecrawlKey, setFirecrawlKey] = useState('');
    const [brightDataKey, setBrightDataKey] = useState('');
    const [openRouterKey, setOpenRouterKey] = useState('');
    const [geminiKey, setGeminiKey] = useState('');
    const [supabaseUrl, setSupabaseUrl] = useState('');
    const [supabaseKey, setSupabaseKey] = useState('');
    const [hasGeminiAuth, setHasGeminiAuth] = useState(false); // Tracks AI Studio / Env status

    useEffect(() => {
        // Load keys from storage
        setFirecrawlKey(localStorage.getItem('FIRECRAWL_API_KEY') || '');
        setBrightDataKey(localStorage.getItem('BRIGHTDATA_API_KEY') || '');
        setOpenRouterKey(localStorage.getItem('OPENROUTER_API_KEY') || '');
        setGeminiKey(localStorage.getItem('GEMINI_API_KEY') || '');
        setSupabaseUrl(localStorage.getItem('SUPABASE_URL') || '');
        setSupabaseKey(localStorage.getItem('SUPABASE_ANON_KEY') || '');

        // Check Gemini Key status (AI Studio or Env)
        const checkGemini = async () => {
            if (window.aistudio?.hasSelectedApiKey) {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setHasGeminiAuth(hasKey);
            } else {
                // Safely check process.env
                try {
                    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
                        setHasGeminiAuth(true);
                    }
                } catch (e) {
                    // Ignore process error
                }
            }
        };
        checkGemini();
    }, []);

    const handleSave = () => {
        if (firecrawlKey) localStorage.setItem('FIRECRAWL_API_KEY', firecrawlKey);
        else localStorage.removeItem('FIRECRAWL_API_KEY');

        if (brightDataKey) localStorage.setItem('BRIGHTDATA_API_KEY', brightDataKey);
        else localStorage.removeItem('BRIGHTDATA_API_KEY');

        if (openRouterKey) localStorage.setItem('OPENROUTER_API_KEY', openRouterKey);
        else localStorage.removeItem('OPENROUTER_API_KEY');

        if (geminiKey) localStorage.setItem('GEMINI_API_KEY', geminiKey);
        else localStorage.removeItem('GEMINI_API_KEY');

        if (supabaseUrl) localStorage.setItem('SUPABASE_URL', supabaseUrl);
        else localStorage.removeItem('SUPABASE_URL');

        if (supabaseKey) localStorage.setItem('SUPABASE_ANON_KEY', supabaseKey);
        else localStorage.removeItem('SUPABASE_ANON_KEY');

        addToast('success', 'Settings Saved. Reloading...');

        // Reload to apply new keys to service instances
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    };

    const handleGeminiAuth = async () => {
        if (window.aistudio?.openSelectKey) {
            await window.aistudio.openSelectKey();
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setHasGeminiAuth(hasKey);
            if (hasKey) addToast('success', 'AI Studio Connected');
        } else {
            addToast('warning', "AI Studio Key selection not available. Please use the manual input below.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-8">
            <div className="w-full max-w-lg bg-apex-900 border border-apex-700 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn max-h-[90vh]">

                {/* Header */}
                <div className="bg-apex-800 p-6 border-b border-apex-700 flex justify-between items-center shrink-0">
                    <h2 className="text-lg font-bold text-white">Admin Settings</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* Security Warning Banner */}
                <div className="mx-6 mt-6 p-4 bg-amber-900/20 border border-amber-600/50 rounded-lg shrink-0">
                    <div className="flex items-start space-x-3">
                        <i className="fa-solid fa-triangle-exclamation text-amber-500 mt-0.5"></i>
                        <div>
                            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Security Notice</h4>
                            <p className="text-xs text-amber-200/80 leading-relaxed">
                                API keys are stored unencrypted in browser localStorage and are vulnerable to XSS attacks.
                                For production use, implement a backend proxy or use environment variables. Never share your browser
                                profile or allow untrusted extensions. Rotate keys regularly.
                            </p>
                            <a
                                href="https://github.com/your-repo/security.md"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-amber-400 hover:text-amber-300 underline mt-2 inline-block"
                            >
                                Learn more about API key security →
                            </a>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">

                    {/* Gemini Section */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Intelligence Engine (Gemini)</h3>

                        {/* Method 1: AI Studio Auth */}
                        <div className="bg-apex-800/50 border border-apex-700 rounded-lg p-4 flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                                <div className={`w-3 h-3 rounded-full ${hasGeminiAuth ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`}></div>
                                <div>
                                    <div className="text-sm font-bold text-white">AI Studio Connection</div>
                                    <div className="text-xs text-slate-400">
                                        {hasGeminiAuth ? 'Active via Environment/Auth' : 'Not Detected'}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleGeminiAuth}
                                className="text-xs bg-apex-800 hover:bg-apex-700 border border-apex-600 text-slate-300 px-3 py-2 rounded transition-colors"
                            >
                                {hasGeminiAuth ? 'Change' : 'Connect'}
                            </button>
                        </div>

                        {/* Method 2: Manual Key */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400">Or Manual API Key</label>
                            <div className="relative">
                                <i className="fa-brands fa-google absolute left-3 top-3 text-slate-600"></i>
                                <input
                                    type="password"
                                    value={geminiKey}
                                    onChange={(e) => setGeminiKey(e.target.value)}
                                    className="w-full bg-apex-800 border border-apex-700 rounded p-2.5 pl-10 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none placeholder-slate-600"
                                    placeholder="AIzaSy..."
                                />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 px-1">
                            Manual key overrides AI Studio connection if set.
                        </p>
                    </div>

                    <div className="w-full h-px bg-apex-800"></div>

                    {/* OpenRouter Section */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Alternative Inference (OpenRouter)</h3>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400">API Key</label>
                            <div className="relative">
                                <i className="fa-solid fa-microchip absolute left-3 top-3 text-slate-600"></i>
                                <input
                                    type="password"
                                    value={openRouterKey}
                                    onChange={(e) => setOpenRouterKey(e.target.value)}
                                    className="w-full bg-apex-800 border border-apex-700 rounded p-2.5 pl-10 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none placeholder-slate-600"
                                    placeholder="sk-or-..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-apex-800"></div>

                    {/* Firecrawl Section */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Data Extraction (Firecrawl)</h3>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400">API Key</label>
                            <div className="relative">
                                <i className="fa-solid fa-spider absolute left-3 top-3 text-slate-600"></i>
                                <input
                                    type="password"
                                    value={firecrawlKey}
                                    onChange={(e) => setFirecrawlKey(e.target.value)}
                                    className="w-full bg-apex-800 border border-apex-700 rounded p-2.5 pl-10 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none placeholder-slate-600"
                                    placeholder="fc-..."
                                />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 px-1">
                            Used for general website scraping (non-LinkedIn).
                        </p>
                    </div>

                    <div className="w-full h-px bg-apex-800"></div>

                    {/* BrightData Section */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">LinkedIn Scraping (BrightData)</h3>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400">API Key</label>
                            <div className="relative">
                                <i className="fa-brands fa-linkedin absolute left-3 top-3 text-slate-600"></i>
                                <input
                                    type="password"
                                    value={brightDataKey}
                                    onChange={(e) => setBrightDataKey(e.target.value)}
                                    className="w-full bg-apex-800 border border-apex-700 rounded p-2.5 pl-10 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none placeholder-slate-600"
                                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 px-1">
                            Required for scraping LinkedIn profiles. Uses BrightData&apos;s People Dataset API.
                        </p>
                    </div>

                    <div className="w-full h-px bg-apex-800"></div>

                    {/* Supabase Section */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Database Storage (Supabase)</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400">Project URL</label>
                                <div className="relative">
                                    <i className="fa-solid fa-database absolute left-3 top-3 text-slate-600"></i>
                                    <input
                                        type="text"
                                        value={supabaseUrl}
                                        onChange={(e) => setSupabaseUrl(e.target.value)}
                                        className="w-full bg-apex-800 border border-apex-700 rounded p-2.5 pl-10 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none placeholder-slate-600"
                                        placeholder="https://your-project.supabase.co"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400">Anon Key</label>
                                <div className="relative">
                                    <i className="fa-solid fa-key absolute left-3 top-3 text-slate-600"></i>
                                    <input
                                        type="password"
                                        value={supabaseKey}
                                        onChange={(e) => setSupabaseKey(e.target.value)}
                                        className="w-full bg-apex-800 border border-apex-700 rounded p-2.5 pl-10 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none placeholder-slate-600"
                                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                                    />
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 px-1">
                            Optional. Enables persistent cloud storage for candidates. Without this, data is stored locally in browser.
                        </p>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-apex-800 bg-apex-800/30 flex justify-end shrink-0">
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded shadow-lg shadow-emerald-900/20 transition-all"
                    >
                        Save & Reload
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AdminSettingsModal;
