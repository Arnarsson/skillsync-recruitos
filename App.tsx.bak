
import React, { useState, useCallback, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';

// Lazy load components
const JobIntake = lazy(() => import('./components/CalibrationEngine'));
const ShortlistGrid = lazy(() => import('./components/TalentHeatMap'));
const DeepProfile = lazy(() => import('./components/BattleCardCockpit'));
const OutreachSuite = lazy(() => import('./components/NetworkPathfinder'));
const AuditLogModal = lazy(() => import('./components/AuditLogModal'));
const AdminSettingsModal = lazy(() => import('./components/AdminSettingsModal'));

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
        const routes = ['/', '/shortlist', '/deep-profile', '/outreach'];
        navigate(routes[step - 1]);
    };

    return (
        <div
            onClick={handleClick}
            className={`flex items-center p-3 rounded-lg transition-colors mb-1 cursor-pointer ${active ? 'bg-blue-500/10 border border-blue-500/20' : 'hover:bg-white/5'}`}
        >
            <div className={`w-6 h-6 flex items-center justify-center rounded text-xs font-medium mr-3 transition-colors ${active ? 'bg-blue-600 text-white' :
                completed ? 'bg-slate-700 text-slate-300' : 'bg-slate-800 text-slate-500'
                }`}>
                {completed && !active ? <i className="fa-solid fa-check"></i> : step}
            </div>
            <div className="flex-1">
                <div className={`text-sm font-medium ${active ? 'text-white' : completed ? 'text-slate-300' : 'text-slate-400'}`}>
                    {label}
                </div>
                {active && <div className="text-xs text-blue-400 mt-0.5">In Progress</div>}
            </div>
            <i className={`${icon} ${active ? 'text-blue-400' : 'text-slate-600'}`}></i>
        </div>
    );
};

import { AnimatePresence, motion } from 'framer-motion';

const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
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
        <div className="flex h-screen bg-slate-900 overflow-hidden font-sans selection:bg-blue-500 selection:text-white">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900/95 backdrop-blur-sm border-b border-white/[0.08] z-50 flex items-center justify-between px-4">
                <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                        <i className="fa-solid fa-network-wired text-white text-xs"></i>
                    </div>
                    <h1 className="text-lg font-semibold text-white">6Degrees</h1>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="text-slate-400 hover:text-white p-2"
                >
                    <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-xl`}></i>
                </button>
            </div>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    ></motion.div>
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <div className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-white/[0.08] flex flex-col p-4 transition-transform duration-200 md:relative md:translate-x-0
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
                <div className="mb-8 px-2 flex items-center hidden md:flex">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                        <i className="fa-solid fa-network-wired text-white text-lg"></i>
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-white">6Degrees</h1>
                        <span className="text-xs text-slate-500">Recruiting OS</span>
                    </div>
                </div>

                {/* Mobile Logo in Sidebar */}
                <div className="mb-8 px-2 flex items-center md:hidden">
                    <div className="text-xs font-medium text-slate-500 mt-10">Menu</div>
                </div>

                <div className="flex-1 space-y-1">
                    <div className="text-xs font-medium text-slate-500 mb-2 px-3 mt-4">Funnel Steps</div>

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

                <div className="mt-auto pt-4 border-t border-white/[0.05]">
                    <div
                        onClick={onOpenWallet}
                        className="bg-slate-800/50 p-3 rounded-lg border border-white/[0.08] mb-4 cursor-pointer hover:bg-slate-800 transition-colors"
                    >
                        <div className="flex justify-between items-center mb-1">
                            <div className="text-xs text-slate-400 font-medium">Credits</div>
                            <div className="text-xs bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded font-medium">PILOT</div>
                        </div>
                        <div className="text-xl font-mono text-white font-semibold tabular-nums">{credits.toLocaleString()}</div>
                        <div className="text-xs text-slate-500 mt-1">≈ €{(credits * CREDITS_TO_EUR).toLocaleString(undefined, { maximumFractionDigits: 0 })} EUR</div>
                    </div>

                    <div
                        onClick={onOpenSettings}
                        className="flex items-center px-2 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                    >
                        <img src="https://i.pravatar.cc/150?u=manager" className="w-8 h-8 rounded-lg" alt="User" />
                        <div className="ml-3 flex-1">
                            <div className="flex justify-between items-center">
                                <p className="text-sm font-medium text-white">Hiring Manager</p>
                                <i className="fa-solid fa-gear text-slate-500 text-xs"></i>
                            </div>
                            <p className="text-xs text-slate-400">Admin</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 relative z-10 overflow-hidden pt-14 md:pt-0 bg-slate-900 flex flex-col">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={pageVariants}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="flex-1 h-full flex flex-col"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
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
        <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Layout
                credits={credits}
                selectedCandidate={selectedCandidate}
                outreachCandidate={outreachCandidate}
                onOpenWallet={() => setShowWallet(true)}
                onOpenSettings={() => setShowSettings(true)}
            >
                <Suspense fallback={
                    <div className="flex h-full items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-700 border-t-blue-500"></div>
                    </div>
                }>
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

                    {/* Wallet / Audit Modal / Settings Modal */}
                    {showWallet && (
                        <AuditLogModal
                            credits={credits}
                            logs={logs}
                            onClose={() => setShowWallet(false)}
                        />
                    )}

                    {showSettings && (
                        <AdminSettingsModal
                            onClose={() => setShowSettings(false)}
                            addToast={addToast}
                        />
                    )}
                </Suspense>

                {/* Global Toast Container */}
                <ToastNotification toasts={toasts} removeToast={removeToast} />
            </Layout>
        </HashRouter>
    );
};

export default App;
