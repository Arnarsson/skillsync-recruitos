
import React, { useState, useCallback } from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import JobIntake from './components/CalibrationEngine';
import ShortlistGrid from './components/TalentHeatMap';
import DeepProfile from './components/BattleCardCockpit';
import OutreachSuite from './components/NetworkPathfinder';
import AuditLogModal from './components/AuditLogModal';
import AdminSettingsModal from './components/AdminSettingsModal';
import ToastNotification, { Toast, ToastType } from './components/ToastNotification';
import { Candidate, CREDITS_TO_EUR, AuditEvent, AuditEventType } from './types';
import { INITIAL_CREDITS, INITIAL_LOGS } from './constants';
import { usePersistedState } from './hooks/usePersistedState';

const SidebarLink: React.FC<{
    step: number,
    label: string,
    active: boolean,
    completed: boolean,
    icon: string
}> = ({ step, label, active, completed, icon }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        // Allow navigation to any step (not just forward)
        const routes = ['/', '/shortlist', '/deep-profile', '/outreach'];
        navigate(routes[step - 1]);
    };

    return (
        <div
            onClick={handleClick}
            className={`flex items-center p-3 rounded-lg transition-all mb-1 cursor-pointer ${active ? 'bg-emerald-900/20 border border-emerald-900/50' : 'hover:bg-apex-800'}`}
        >
            <div className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold mr-3 transition-colors ${active ? 'bg-emerald-600 text-white' :
                completed ? 'bg-emerald-900 text-emerald-500' : 'bg-slate-800 text-slate-500'
                }`}>
                {completed && !active ? <i className="fa-solid fa-check"></i> : step}
            </div>
            <div className="flex-1">
                <div className={`text-sm font-bold ${active ? 'text-white' : completed ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {label}
                </div>
                {active && <div className="text-xs text-emerald-400 uppercase tracking-wider mt-0.5">In Progress</div>}
            </div>
            <i className={`${icon} ${active ? 'text-emerald-500' : 'text-slate-700'}`}></i>
        </div>
    );
};

const Layout: React.FC<{
    credits: number;
    selectedCandidate: Candidate | null;
    outreachCandidate: Candidate | null;
    onOpenWallet: () => void;
    onOpenSettings: () => void;
    children: React.ReactNode;
}> = ({ credits, selectedCandidate, outreachCandidate, onOpenWallet, onOpenSettings, children }) => {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Determine active step
    const isStep1 = location.pathname === '/';
    const isStep2 = location.pathname === '/shortlist' && !selectedCandidate && !outreachCandidate;
    const isStep3 = !!selectedCandidate;
    const isStep4 = !!outreachCandidate;

    return (
        <div className="flex h-screen bg-apex-900 overflow-hidden font-sans selection:bg-emerald-500 selection:text-white">

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-apex-900 border-b border-apex-800 z-50 flex items-center justify-between px-4">
                <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-teal-900 rounded flex items-center justify-center shadow-lg shadow-emerald-500/20 mr-3">
                        <i className="fa-solid fa-network-wired text-white text-xs"></i>
                    </div>
                    <h1 className="text-lg font-bold text-white tracking-tight">6Degrees</h1>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="text-slate-400 hover:text-white p-2"
                >
                    <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-xl`}></i>
                </button>
            </div>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <div className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-apex-900 border-r border-apex-800 flex flex-col p-4 shadow-xl transition-transform duration-300 md:relative md:translate-x-0
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
                <div className="mb-8 px-2 flex items-center hidden md:flex">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-900 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20 mr-3">
                        <i className="fa-solid fa-network-wired text-white text-lg"></i>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">6Degrees</h1>
                        <span className="text-xs text-slate-500 uppercase tracking-widest">Recruiting OS</span>
                    </div>
                </div>

                {/* Mobile Logo in Sidebar */}
                <div className="mb-8 px-2 flex items-center md:hidden">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-10">Menu</div>
                </div>

                <div className="flex-1 space-y-1">
                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 px-3 mt-4">Funnel Steps</div>

                    {/* Visual Step Tracker */}
                    <SidebarLink
                        step={1}
                        label="Job Context"
                        active={isStep1}
                        completed={!isStep1}
                        icon="fa-solid fa-file-contract"
                    />
                    <SidebarLink
                        step={2}
                        label="Shortlist"
                        active={isStep2}
                        completed={isStep3 || isStep4}
                        icon="fa-solid fa-users-viewfinder"
                    />
                    <SidebarLink
                        step={3}
                        label="Evidence Report"
                        active={isStep3}
                        completed={isStep4}
                        icon="fa-solid fa-microscope"
                    />
                    <SidebarLink
                        step={4}
                        label="Outreach"
                        active={isStep4}
                        completed={false}
                        icon="fa-regular fa-paper-plane"
                    />
                </div>

                <div className="mt-auto pt-4 border-t border-apex-800">
                    <div
                        onClick={onOpenWallet}
                        className="bg-apex-800/50 p-3 rounded-lg border border-apex-700 mb-4 cursor-pointer hover:bg-apex-800 hover:border-emerald-500/50 transition-all group"
                    >
                        <div className="flex justify-between items-center mb-1">
                            <div className="text-xs text-slate-500 uppercase font-bold group-hover:text-emerald-400 transition-colors">Credits</div>
                            <div className="text-xs bg-emerald-900 text-emerald-400 px-1.5 rounded">PILOT</div>
                        </div>
                        <div className="text-xl font-mono text-white font-bold">{credits.toLocaleString()}</div>
                        <div className="text-xs text-slate-500 mt-1">≈ €{(credits * CREDITS_TO_EUR).toLocaleString(undefined, { maximumFractionDigits: 0 })} EUR</div>
                    </div>

                    <div
                        onClick={onOpenSettings}
                        className="flex items-center px-2 py-2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer rounded-lg hover:bg-apex-800"
                    >
                        <img src="https://i.pravatar.cc/150?u=manager" className="w-8 h-8 rounded-full border border-slate-600" alt="User" />
                        <div className="ml-3 flex-1">
                            <div className="flex justify-between items-center">
                                <p className="text-sm font-bold text-white">Hiring Manager</p>
                                <i className="fa-solid fa-gear text-slate-500 text-xs"></i>
                            </div>
                            <p className="text-xs text-emerald-400">Admin</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 relative bg-gradient-to-br from-apex-900 via-apex-900 to-[#0f1f1a] pt-16 md:pt-0">
                {children}
            </main>
        </div>
    );
}

const App: React.FC = () => {
    // Use persisted state for critical data
    const [credits, setCredits] = usePersistedState('apex_credits', INITIAL_CREDITS);
    const [logs, setLogs] = usePersistedState<AuditEvent[]>('apex_logs', INITIAL_LOGS);
    const [jobContext, setJobContext] = usePersistedState('apex_job_context', '');

    // UI State (Non-persistent)
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [outreachCandidate, setOutreachCandidate] = useState<Candidate | null>(null);
    const [showWallet, setShowWallet] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Toast State
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((type: ToastType, message: string) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000); // Auto dismiss
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const logEvent = useCallback((type: AuditEventType, description: string, cost: number, metadata?: Record<string, unknown>) => {
        const newEvent: AuditEvent = {
            id: `evt_${Date.now()}`,
            type,
            timestamp: new Date().toISOString(),
            description,
            cost: -cost, // displayed as negative in log if spending
            user: 'Hiring Manager',
            metadata: metadata || {}
        };
        setLogs(prev => [...prev, newEvent]);
    }, [setLogs]);

    const handleSpendCredits = useCallback((amount: number, description: string, type: AuditEventType) => {
        setCredits(prev => prev - amount);
        logEvent(type, description, amount);
    }, [logEvent, setCredits]);

    const handleSelectCandidate = useCallback((c: Candidate) => {
        setSelectedCandidate(c);
    }, []);

    return (
        <HashRouter>
            <Layout
                credits={credits}
                selectedCandidate={selectedCandidate}
                outreachCandidate={outreachCandidate}
                onOpenWallet={() => setShowWallet(true)}
                onOpenSettings={() => setShowSettings(true)}
            >
                <Routes>
                    <Route
                        path="/"
                        element={
                            <JobIntake
                                jobContext={jobContext}
                                setJobContext={setJobContext}
                                addToast={addToast}
                            />
                        }
                    />
                    <Route
                        path="/shortlist"
                        element={
                            <ShortlistGrid
                                jobContext={jobContext}
                                credits={credits}
                                onSpendCredits={(amt, desc) => handleSpendCredits(amt, desc || 'Deep Profile Unlock', AuditEventType.PROFILE_ENRICHED)}
                                onSelectCandidate={handleSelectCandidate}
                                addToast={addToast}
                            />
                        }
                    />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>

                {/* Global Toast Container */}
                <ToastNotification toasts={toasts} removeToast={removeToast} />

                {/* Step 3: Evidence Report (Side Panel) */}
                {selectedCandidate && (
                    <DeepProfile
                        candidate={selectedCandidate}
                        credits={credits}
                        onSpendCredits={(amt, desc) => handleSpendCredits(amt, desc || 'Action', AuditEventType.SCORE_GENERATED)}
                        onClose={() => setSelectedCandidate(null)}
                        onOpenOutreach={(c) => {
                            setSelectedCandidate(null);
                            setOutreachCandidate(c);
                        }}
                        addToast={addToast}
                    />
                )}

                {/* Step 4: Outreach (Modal) */}
                {outreachCandidate && (
                    <OutreachSuite
                        candidate={outreachCandidate}
                        jobContext={jobContext}
                        onClose={() => setOutreachCandidate(null)}
                    />
                )}

                {/* Wallet / Audit Modal */}
                {showWallet && (
                    <AuditLogModal
                        credits={credits}
                        logs={logs}
                        onClose={() => setShowWallet(false)}
                    />
                )}

                {/* Admin Settings Modal */}
                {showSettings && (
                    <AdminSettingsModal
                        onClose={() => setShowSettings(false)}
                        addToast={addToast}
                    />
                )}
            </Layout>
        </HashRouter>
    );
};

export default App;
