import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import JobIntake from './components/JobIntake';
import ShortlistGrid from './components/ShortlistGrid';
import EvidenceReport from './components/EvidenceReport';
import OutreachSuite from './components/OutreachSuite';
import { ToastProvider, CreditDisplay, useToast } from './components/ui';
import { Candidate, PRICING, FunnelStage, CREDITS_TO_EUR } from './types';
import { INITIAL_CREDITS } from './constants';

// ============================================
// MOBILE DETECTION HOOK
// ============================================

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
};

// ============================================
// MOBILE BOTTOM NAVIGATION
// ============================================

const MobileBottomNav: React.FC<{
    currentStep: number;
    completedSteps: Record<number, boolean>;
    onNavigateToStep: (step: number) => void;
}> = ({ currentStep, completedSteps, onNavigateToStep }) => {
    const steps = [
        { step: 1, label: 'Job', icon: 'fa-file-contract' },
        { step: 2, label: 'Shortlist', icon: 'fa-users' },
        { step: 3, label: 'Evidence', icon: 'fa-microscope' },
        { step: 4, label: 'Outreach', icon: 'fa-paper-plane' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-apex-900/95 backdrop-blur-md border-t border-apex-800 flex items-center justify-around z-40 safe-area-pb">
            {steps.map(({ step, label, icon }) => {
                const isActive = currentStep === step;
                const isCompleted = completedSteps[step];
                const isDisabled = step > 1 && !completedSteps[step - 1] && step !== currentStep;

                return (
                    <button
                        key={step}
                        onClick={() => !isDisabled && onNavigateToStep(step)}
                        disabled={isDisabled}
                        className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
                            isActive
                                ? 'text-emerald-400'
                                : isCompleted
                                    ? 'text-emerald-600'
                                    : isDisabled
                                        ? 'text-slate-700'
                                        : 'text-slate-500'
                        }`}
                    >
                        <div className={`relative w-10 h-10 flex items-center justify-center rounded-full transition-all ${
                            isActive ? 'bg-emerald-900/50 scale-110' : ''
                        }`}>
                            <i className={`fa-solid ${icon} text-lg`}></i>
                            {isCompleted && !isActive && (
                                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center">
                                    <i className="fa-solid fa-check text-[6px] text-white"></i>
                                </div>
                            )}
                        </div>
                        <span className={`text-[10px] mt-0.5 font-medium ${isActive ? 'font-bold' : ''}`}>{label}</span>
                    </button>
                );
            })}
        </nav>
    );
};

// ============================================
// THEME CONTEXT
// ============================================

type Theme = 'dark' | 'light';

const ThemeContext = React.createContext<{
    theme: Theme;
    toggleTheme: () => void;
}>({ theme: 'dark', toggleTheme: () => {} });

export const useTheme = () => React.useContext(ThemeContext);

// ============================================
// SIDEBAR NAVIGATION
// ============================================

const SidebarLink: React.FC<{ 
    step: number;
    label: string;
    sublabel?: string;
    active: boolean;
    completed: boolean;
    disabled?: boolean;
    icon: string;
    onClick?: () => void;
}> = ({ step, label, sublabel, active, completed, disabled, icon, onClick }) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        className={`w-full flex items-center p-3 rounded-lg transition-all mb-1 text-left ${
            active 
                ? 'bg-emerald-900/20 border border-emerald-900/50' 
                : disabled 
                    ? 'opacity-40 cursor-not-allowed' 
                    : 'hover:bg-apex-800 cursor-pointer'
        }`}
    >
        <div className={`w-7 h-7 flex items-center justify-center rounded text-xs font-bold mr-3 transition-colors ${
            active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 
            completed ? 'bg-emerald-900 text-emerald-400' : 'bg-slate-800 text-slate-500'
        }`}>
            {completed && !active ? <i className="fa-solid fa-check"></i> : step}
        </div>
        <div className="flex-1 min-w-0">
            <div className={`text-sm font-bold truncate ${active ? 'text-white' : completed ? 'text-emerald-400' : 'text-slate-400'}`}>
                {label}
            </div>
            {active && sublabel && (
                <div className="text-[10px] text-emerald-400 uppercase tracking-wider mt-0.5">{sublabel}</div>
            )}
        </div>
        <i className={`${icon} text-sm ${active ? 'text-emerald-500' : 'text-slate-700'}`}></i>
    </button>
);

// ============================================
// MAIN LAYOUT
// ============================================

const Layout: React.FC<{
    credits: number;
    currentStep: number;
    selectedCandidate: Candidate | null;
    outreachCandidate: Candidate | null;
    onNavigateToStep: (step: number) => void;
    children: React.ReactNode;
}> = ({ credits, currentStep, selectedCandidate, outreachCandidate, onNavigateToStep, children }) => {
    const location = useLocation();
    const isMobile = useIsMobile();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { theme, toggleTheme } = useTheme();

    // Close sidebar when navigating on mobile
    useEffect(() => {
        if (isMobile) setSidebarOpen(false);
    }, [location.pathname, isMobile]);

    // Determine step states
    const isStep1 = location.pathname === '/';
    const isStep2 = location.pathname === '/shortlist';
    const isStep3 = !!selectedCandidate;
    const isStep4 = !!outreachCandidate;

    const completedSteps = {
        1: !isStep1,
        2: isStep3 || isStep4,
        3: isStep4,
        4: false
    };

    const handleNavClick = (step: number) => {
        onNavigateToStep(step);
        if (isMobile) setSidebarOpen(false);
    };

    return (
        <div className="flex h-screen bg-apex-900 overflow-hidden font-sans selection:bg-emerald-500 selection:text-white">
            {/* Mobile Header */}
            {isMobile && (
                <header className="fixed top-0 left-0 right-0 h-14 bg-apex-900 border-b border-apex-800 flex items-center justify-between px-4 z-50">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                        aria-label="Toggle menu"
                    >
                        <i className={`fa-solid ${sidebarOpen ? 'fa-xmark' : 'fa-bars'} text-xl`}></i>
                    </button>
                    <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-teal-900 rounded-lg flex items-center justify-center mr-2">
                            <i className="fa-solid fa-diagram-project text-white text-sm"></i>
                        </div>
                        <span className="text-lg font-bold text-white">6Degrees</span>
                    </div>
                    <div className="text-right">
                        <div className="text-sm font-mono text-white font-bold">{credits.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-500">Credits</div>
                    </div>
                </header>
            )}

            {/* Mobile Overlay */}
            {isMobile && sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    ${isMobile ? 'fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out' : ''}
                    ${!isMobile && sidebarCollapsed ? 'w-16' : !isMobile ? 'w-64' : ''}
                    ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
                    ${isMobile ? 'pt-14' : ''}
                    bg-apex-900 border-r border-apex-800 flex flex-col p-4 shadow-xl transition-all duration-300
                `}
                aria-label="Main navigation"
            >
                {/* Logo - Hidden on mobile (shown in header) */}
                {!isMobile && (
                    <div className={`mb-8 px-2 flex items-center ${sidebarCollapsed ? 'justify-center' : ''}`}>
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-900 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <i className="fa-solid fa-diagram-project text-white text-lg"></i>
                        </div>
                        {!sidebarCollapsed && (
                            <div className="ml-3">
                                <h1 className="text-xl font-bold text-white tracking-tight">6Degrees</h1>
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Recruiting OS</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 space-y-1" aria-label="Funnel steps">
                    {!sidebarCollapsed && (
                        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-3 px-3">Hiring Funnel</div>
                    )}

                    <SidebarLink
                        step={1}
                        label="Job Context"
                        sublabel={isStep1 ? "In Progress" : undefined}
                        active={isStep1}
                        completed={completedSteps[1]}
                        icon="fa-solid fa-file-contract"
                        onClick={() => handleNavClick(1)}
                    />
                    <SidebarLink
                        step={2}
                        label="Shortlist"
                        sublabel={isStep2 && !isStep3 ? "Reviewing" : undefined}
                        active={isStep2 && !isStep3 && !isStep4}
                        completed={completedSteps[2]}
                        icon="fa-solid fa-users"
                        onClick={() => handleNavClick(2)}
                        disabled={isStep1}
                    />
                    <SidebarLink
                        step={3}
                        label="Evidence Report"
                        sublabel={isStep3 ? "Analyzing" : undefined}
                        active={isStep3}
                        completed={completedSteps[3]}
                        icon="fa-solid fa-microscope"
                        disabled={!completedSteps[2]}
                    />
                    <SidebarLink
                        step={4}
                        label="Outreach"
                        sublabel={isStep4 ? "Drafting" : undefined}
                        active={isStep4}
                        completed={completedSteps[4]}
                        icon="fa-regular fa-paper-plane"
                        disabled={!completedSteps[3]}
                    />
                </nav>

                {/* Credits & User */}
                <div className="mt-auto pt-4 border-t border-apex-800 space-y-4">
                    {/* Credit Balance - Collapsed shows only icon */}
                    {sidebarCollapsed ? (
                        <div className="flex justify-center">
                            <div className="w-10 h-10 bg-apex-800/50 rounded-lg border border-apex-700 flex items-center justify-center" title={`${credits.toLocaleString()} credits`}>
                                <i className="fa-solid fa-coins text-emerald-400"></i>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-apex-800/50 p-4 rounded-lg border border-apex-700">
                            <div className="flex justify-between items-center mb-2">
                                <div className="text-[10px] text-slate-500 uppercase font-bold">Credit Balance</div>
                                <div className="text-[10px] bg-emerald-900/50 text-emerald-400 px-1.5 py-0.5 rounded font-bold">PILOT</div>
                            </div>
                            <div className="text-2xl font-mono text-white font-bold">{credits.toLocaleString()}</div>
                            <div className="text-xs text-slate-500 mt-1">≈ €{Math.round(credits * CREDITS_TO_EUR).toLocaleString()}</div>
                            <div className="mt-3 w-full bg-apex-900 rounded-full h-1.5">
                                <div
                                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                                    style={{width: `${(credits / INITIAL_CREDITS) * 100}%`}}
                                ></div>
                            </div>
                            <div className="text-[10px] text-slate-600 mt-1">{Math.round((credits / INITIAL_CREDITS) * 100)}% remaining</div>
                        </div>
                    )}

                    {/* Theme Toggle & Collapse Toggle */}
                    <div className={`flex ${sidebarCollapsed ? 'flex-col space-y-2' : 'space-x-2'}`}>
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className={`${sidebarCollapsed ? 'w-full' : 'flex-1'} flex items-center justify-center py-2.5 bg-apex-800 hover:bg-apex-700 rounded-lg border border-apex-700 transition-colors`}
                            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            <i className={`fa-solid ${theme === 'dark' ? 'fa-sun text-yellow-400' : 'fa-moon text-blue-400'}`}></i>
                            {!sidebarCollapsed && (
                                <span className="ml-2 text-xs text-slate-400">{theme === 'dark' ? 'Light' : 'Dark'}</span>
                            )}
                        </button>

                        {/* Collapse Toggle - Desktop only */}
                        {!isMobile && (
                            <button
                                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                className={`${sidebarCollapsed ? 'w-full' : ''} flex items-center justify-center py-2.5 px-3 bg-apex-800 hover:bg-apex-700 rounded-lg border border-apex-700 transition-colors`}
                                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            >
                                <i className={`fa-solid ${sidebarCollapsed ? 'fa-angles-right' : 'fa-angles-left'} text-slate-400`}></i>
                            </button>
                        )}
                    </div>

                    {/* User Profile */}
                    {sidebarCollapsed ? (
                        <div className="flex justify-center">
                            <img
                                src="https://i.pravatar.cc/150?u=manager"
                                className="w-9 h-9 rounded-full border-2 border-slate-700 cursor-pointer hover:border-emerald-500 transition-colors"
                                alt="User avatar"
                                title="Hiring Manager"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center px-2 py-2 opacity-70 hover:opacity-100 transition-opacity cursor-pointer rounded-lg hover:bg-apex-800">
                            <img
                                src="https://i.pravatar.cc/150?u=manager"
                                className="w-9 h-9 rounded-full border-2 border-slate-700"
                                alt="User avatar"
                            />
                            <div className="ml-3 flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">Hiring Manager</p>
                                <p className="text-[10px] text-emerald-400">Admin</p>
                            </div>
                            <i className="fa-solid fa-gear text-slate-600 text-sm"></i>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className={`flex-1 relative bg-gradient-to-br from-apex-900 via-apex-900 to-[#0f1f1a] overflow-hidden ${isMobile ? 'pt-14 pb-16' : ''}`}>
                {children}
            </main>

            {/* Mobile Bottom Navigation */}
            {isMobile && (
                <MobileBottomNav
                    currentStep={currentStep}
                    completedSteps={completedSteps}
                    onNavigateToStep={onNavigateToStep}
                />
            )}
        </div>
    );
};

// ============================================
// APP ROOT
// ============================================

const AppContent: React.FC = () => {
    const [credits, setCredits] = useState(INITIAL_CREDITS);
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [outreachCandidate, setOutreachCandidate] = useState<Candidate | null>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const location = useLocation();

    const handleSpendCredits = (amount: number) => {
        setCredits(prev => prev - amount);
    };

    const handleSelectCandidate = (c: Candidate) => {
        setSelectedCandidate(c);
        setCurrentStep(3);
    };

    const handleOpenOutreach = (c: Candidate) => {
        setSelectedCandidate(null);
        setOutreachCandidate(c);
        setCurrentStep(4);
    };

    const handleNavigateToStep = (step: number) => {
        if (step === 1) {
            window.location.hash = '/';
        } else if (step === 2) {
            window.location.hash = '/shortlist';
        }
        setCurrentStep(step);
    };

    return (
        <Layout 
            credits={credits} 
            currentStep={currentStep}
            selectedCandidate={selectedCandidate} 
            outreachCandidate={outreachCandidate}
            onNavigateToStep={handleNavigateToStep}
        >
            <Routes>
                <Route path="/" element={<JobIntake />} />
                <Route 
                    path="/shortlist" 
                    element={
                        <ShortlistGrid 
                            credits={credits}
                            onSpendCredits={handleSpendCredits}
                            onSelectCandidate={handleSelectCandidate}
                        />
                    } 
                />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>

            {/* Step 3: Evidence Report (Slide-in Panel) */}
            {selectedCandidate && (
                <EvidenceReport 
                    candidate={selectedCandidate}
                    credits={credits}
                    onSpendCredits={handleSpendCredits}
                    onClose={() => { setSelectedCandidate(null); setCurrentStep(2); }}
                    onOpenOutreach={handleOpenOutreach}
                />
            )}

            {/* Step 4: Outreach (Modal) */}
            {outreachCandidate && (
                <OutreachSuite 
                    candidate={outreachCandidate}
                    onClose={() => { setOutreachCandidate(null); setCurrentStep(3); }}
                />
            )}
        </Layout>
    );
};

// ============================================
// THEME PROVIDER
// ============================================

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        // Default to dark, check localStorage for saved preference
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme');
            return (saved as Theme) || 'dark';
        }
        return 'dark';
    });

    useEffect(() => {
        // Apply theme class to document
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

const App: React.FC = () => {
    return (
        <HashRouter>
            <ThemeProvider>
                <ToastProvider>
                    <AppContent />
                </ToastProvider>
            </ThemeProvider>
        </HashRouter>
    );
};

export default App;
