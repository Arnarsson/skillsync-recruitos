import React, { useState } from 'react';
import { HashRouter, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import JobIntake from './components/CalibrationEngine'; 
import ShortlistGrid from './components/TalentHeatMap';
import DeepProfile from './components/BattleCardCockpit';
import OutreachSuite from './components/NetworkPathfinder';
import { Candidate, PRICING, FunnelStage, CREDITS_TO_EUR } from './types';
import { INITIAL_CREDITS } from './constants';

const SidebarLink: React.FC<{ 
    step: number, 
    label: string, 
    active: boolean, 
    completed: boolean,
    icon: string
}> = ({ step, label, active, completed, icon }) => (
    <div className={`flex items-center p-3 rounded-lg transition-all mb-1 ${active ? 'bg-emerald-900/20 border border-emerald-900/50' : 'hover:bg-apex-800'}`}>
        <div className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold mr-3 transition-colors ${
            active ? 'bg-emerald-600 text-white' : 
            completed ? 'bg-emerald-900 text-emerald-500' : 'bg-slate-800 text-slate-500'
        }`}>
            {completed && !active ? <i className="fa-solid fa-check"></i> : step}
        </div>
        <div className="flex-1">
            <div className={`text-sm font-bold ${active ? 'text-white' : completed ? 'text-emerald-500' : 'text-slate-400'}`}>
                {label}
            </div>
            {active && <div className="text-[10px] text-emerald-400 uppercase tracking-wider mt-0.5">In Progress</div>}
        </div>
        <i className={`${icon} ${active ? 'text-emerald-500' : 'text-slate-700'}`}></i>
    </div>
);

const Layout: React.FC<{
    credits: number;
    selectedCandidate: Candidate | null;
    outreachCandidate: Candidate | null;
    children: React.ReactNode;
}> = ({ credits, selectedCandidate, outreachCandidate, children }) => {
    const location = useLocation();
    
    // Determine active step
    const isStep1 = location.pathname === '/';
    const isStep2 = location.pathname === '/shortlist' && !selectedCandidate && !outreachCandidate;
    const isStep3 = !!selectedCandidate;
    const isStep4 = !!outreachCandidate;

    return (
        <div className="flex h-screen bg-apex-900 overflow-hidden font-sans selection:bg-emerald-500 selection:text-white">
        {/* Sidebar */}
        <div className="w-64 bg-apex-900 border-r border-apex-800 flex flex-col p-4 shadow-xl z-10">
          <div className="mb-8 px-2 flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-900 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20 mr-3">
               <i className="fa-solid fa-network-wired text-white text-lg"></i>
            </div>
            <div>
               <h1 className="text-xl font-bold text-white tracking-tight">6Degrees</h1>
               <span className="text-[10px] text-slate-500 uppercase tracking-widest">Recruiting OS</span>
            </div>
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
             <div className="bg-apex-800/50 p-3 rounded-lg border border-apex-700 mb-4">
                <div className="flex justify-between items-center mb-1">
                    <div className="text-xs text-slate-500 uppercase font-bold">Credits</div>
                    <div className="text-[10px] bg-emerald-900 text-emerald-400 px-1.5 rounded">PILOT</div>
                </div>
                <div className="text-xl font-mono text-white font-bold">{credits.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-1">≈ €{(credits * CREDITS_TO_EUR).toLocaleString(undefined, { maximumFractionDigits: 0 })} EUR</div>
             </div>
             
             <div className="flex items-center px-2 py-2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                <img src="https://i.pravatar.cc/150?u=manager" className="w-8 h-8 rounded-full border border-slate-600" alt="User" />
                <div className="ml-3">
                    <p className="text-sm font-bold text-white">Hiring Manager</p>
                    <p className="text-xs text-emerald-400">Admin</p>
                </div>
             </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 relative bg-gradient-to-br from-apex-900 via-apex-900 to-[#0f1f1a]">
            {children}
        </main>
      </div>
    );
}

const App: React.FC = () => {
  const [credits, setCredits] = useState(INITIAL_CREDITS);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [outreachCandidate, setOutreachCandidate] = useState<Candidate | null>(null);

  const handleSpendCredits = (amount: number) => {
    setCredits(prev => prev - amount);
  };

  const handleSelectCandidate = (c: Candidate) => {
      setSelectedCandidate(c);
  };

  return (
    <HashRouter>
      <Layout 
        credits={credits} 
        selectedCandidate={selectedCandidate} 
        outreachCandidate={outreachCandidate}
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

          {/* Step 3: Evidence Report (Side Panel) */}
          {selectedCandidate && (
              <DeepProfile 
                  candidate={selectedCandidate}
                  credits={credits}
                  onSpendCredits={handleSpendCredits}
                  onClose={() => setSelectedCandidate(null)}
                  onOpenOutreach={(c) => {
                      setSelectedCandidate(null); 
                      setOutreachCandidate(c); 
                  }}
              />
          )}

          {/* Step 4: Outreach (Modal) */}
          {outreachCandidate && (
              <OutreachSuite 
                  candidate={outreachCandidate}
                  onClose={() => setOutreachCandidate(null)}
              />
          )}
      </Layout>
    </HashRouter>
  );
};

export default App;