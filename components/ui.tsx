import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { ConfidenceLevel, getConfidenceColor, Toast as ToastType } from '../types';

// ============================================
// TOAST NOTIFICATION SYSTEM
// ============================================

interface ToastContextType {
  toasts: ToastType[];
  addToast: (type: ToastType['type'], message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const addToast = (type: ToastType['type'], message: string, duration = 4000) => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, type, message, duration }]);
    
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC<{ toasts: ToastType[]; onRemove: (id: string) => void }> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  const icons = {
    success: 'fa-circle-check',
    error: 'fa-circle-xmark',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info'
  };

  const colors = {
    success: 'bg-emerald-900/90 border-emerald-700 text-emerald-100',
    error: 'bg-red-900/90 border-red-700 text-red-100',
    warning: 'bg-yellow-900/90 border-yellow-700 text-yellow-100',
    info: 'bg-blue-900/90 border-blue-700 text-blue-100'
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg border shadow-xl backdrop-blur-sm animate-slideIn ${colors[toast.type]}`}
          role="alert"
        >
          <i className={`fa-solid ${icons[toast.type]}`}></i>
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => onRemove(toast.id)}
            className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      ))}
    </div>
  );
};

// ============================================
// CONFIDENCE BADGE (Spec 12.4 / 16.4)
// ============================================

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ 
  level, 
  showLabel = true,
  size = 'sm' 
}) => {
  const colors = getConfidenceColor(level);
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';
  
  const labels = {
    [ConfidenceLevel.HIGH]: { icon: '🟢', text: 'High', tooltip: 'Complete profile data, high certainty' },
    [ConfidenceLevel.MEDIUM]: { icon: '🟡', text: 'Medium', tooltip: 'Partial data, moderate certainty' },
    [ConfidenceLevel.LOW]: { icon: '🔴', text: 'Low', tooltip: 'Limited data, verify in interview' }
  };

  const { text, tooltip } = labels[level];

  return (
    <span 
      className={`inline-flex items-center space-x-1.5 rounded font-bold uppercase tracking-wide ${colors.bg} ${colors.text} ${sizeClasses}`}
      title={tooltip}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}></span>
      {showLabel && <span>{text}</span>}
    </span>
  );
};

// ============================================
// SHARE MODAL (Spec 15.2)
// ============================================

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  candidateId: string;
  step: 'shortlist' | 'evidence' | 'outreach';
}

export const ShareModal: React.FC<ShareModalProps> = ({ 
  isOpen, 
  onClose, 
  candidateName,
  candidateId,
  step 
}) => {
  const [copied, setCopied] = useState(false);
  const [expiry, setExpiry] = useState(30);
  
  if (!isOpen) return null;

  // Generate mock share URL (Spec 15.2 format)
  const shareToken = `${candidateId}-${Date.now().toString(36)}`;
  const shareUrl = `https://app.6degrees.ai/share/${shareToken}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-[480px] bg-apex-900 border border-apex-700 rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-apex-800 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-white">Share {step === 'evidence' ? 'Evidence Report' : 'Profile'}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{candidateName}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Link Input */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Shareable Link</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 bg-apex-800 border border-apex-700 rounded-lg px-3 py-2 text-sm text-slate-300 font-mono"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  copied 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-apex-800 border border-apex-700 text-slate-300 hover:bg-apex-700'
                }`}
              >
                {copied ? <><i className="fa-solid fa-check mr-1"></i> Copied</> : <><i className="fa-solid fa-copy mr-1"></i> Copy</>}
              </button>
            </div>
          </div>

          {/* Expiry Setting */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Link Expiration</label>
            <select
              value={expiry}
              onChange={(e) => setExpiry(Number(e.target.value))}
              className="w-full bg-apex-800 border border-apex-700 rounded-lg px-3 py-2 text-sm text-slate-300"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days (default)</option>
            </select>
          </div>

          {/* Info Box */}
          <div className="bg-apex-800/50 border border-apex-700 rounded-lg p-4 space-y-2">
            <div className="flex items-center text-xs text-slate-400">
              <i className="fa-solid fa-eye mr-2 text-slate-500"></i>
              <span>Read-only view, no login required</span>
            </div>
            <div className="flex items-center text-xs text-slate-400">
              <i className="fa-solid fa-shield-halved mr-2 text-slate-500"></i>
              <span>Watermarked with "Shared from 6Degrees"</span>
            </div>
            <div className="flex items-center text-xs text-slate-400">
              <i className="fa-solid fa-chart-simple mr-2 text-slate-500"></i>
              <span>View counter available in your dashboard</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-apex-800 bg-apex-800/30 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { handleCopy(); onClose(); }}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition-colors"
          >
            Copy & Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// CREDIT DISPLAY (Spec 11.4)
// ============================================

interface CreditDisplayProps {
  credits: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CreditDisplay: React.FC<CreditDisplayProps> = ({ credits, label, size = 'md' }) => {
  const eurValue = Math.round(credits * 0.54);
  
  const sizes = {
    sm: { credits: 'text-sm', eur: 'text-[10px]' },
    md: { credits: 'text-lg', eur: 'text-xs' },
    lg: { credits: 'text-2xl', eur: 'text-sm' }
  };

  return (
    <div className="text-right">
      {label && <div className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">{label}</div>}
      <div className={`font-mono font-bold text-white ${sizes[size].credits}`}>
        {credits.toLocaleString()}
      </div>
      <div className={`text-slate-500 ${sizes[size].eur}`}>
        ~€{eurValue.toLocaleString()}
      </div>
    </div>
  );
};

// ============================================
// EMPTY STATE
// ============================================

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
    <div className="w-16 h-16 bg-apex-800 rounded-full flex items-center justify-center mb-4">
      <i className={`${icon} text-2xl text-slate-600`}></i>
    </div>
    <h3 className="text-lg font-bold text-slate-300 mb-2">{title}</h3>
    <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition-colors"
      >
        {action.label}
      </button>
    )}
  </div>
);

// ============================================
// LOADING SPINNER
// ============================================

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; message?: string }> = ({ 
  size = 'md', 
  message 
}) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className={`${sizes[size]} border-2 border-apex-700 border-t-emerald-500 rounded-full animate-spin`}></div>
      {message && <p className="text-sm text-slate-400 mt-3">{message}</p>}
    </div>
  );
};

// ============================================
// STEP BADGE (for headers)
// ============================================

interface StepBadgeProps {
  step: number;
  label: string;
  color?: 'emerald' | 'blue' | 'purple' | 'slate';
  price?: { credits?: number; free?: boolean };
}

export const StepBadge: React.FC<StepBadgeProps> = ({ step, label, color = 'emerald', price }) => {
  const colors = {
    emerald: 'text-emerald-500 bg-emerald-900/20 border-emerald-900/50',
    blue: 'text-blue-500 bg-blue-900/20 border-blue-900/50',
    purple: 'text-purple-500 bg-purple-900/20 border-purple-900/50',
    slate: 'text-slate-400 bg-slate-900/20 border-slate-800'
  };

  return (
    <div className="flex items-center space-x-3">
      <span className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border ${colors[color]}`}>
        Step {step}: {label}
      </span>
      {price && (
        <span className="text-[10px] text-slate-500">
          {price.free ? 'FREE' : `${price.credits ?? 0} Cr (~€${Math.round((price.credits ?? 0) * 0.54)})`}
        </span>
      )}
    </div>
  );
};

// ============================================
// ROI SAVINGS WIDGET (10x Feature)
// ============================================

interface SavingsWidgetProps {
  candidatesEvaluated: number;
  creditsUsed: number;
  compact?: boolean;
}

export const SavingsWidget: React.FC<SavingsWidgetProps> = ({
  candidatesEvaluated,
  creditsUsed,
  compact = false
}) => {
  // Headhunter typically charges 25-30% of first year salary
  // Average senior hire in DK: ~700k DKK = ~21k DKK success fee per candidate reviewed
  // Or flat fee: ~30,000 DKK per successful hire
  const headhunterCostPerHire = 30000; // DKK
  const estimatedHeadhunterCost = Math.round(headhunterCostPerHire * (candidatesEvaluated / 10)); // Assumes 10 candidates per hire
  const ourCost = Math.round(creditsUsed * 4); // 1 credit = 4 DKK
  const savings = Math.max(0, estimatedHeadhunterCost - ourCost);
  const savingsPercent = estimatedHeadhunterCost > 0 ? Math.round((savings / estimatedHeadhunterCost) * 100) : 0;

  if (compact) {
    return (
      <div className="flex items-center space-x-2 text-xs">
        <i className="fa-solid fa-piggy-bank text-emerald-500"></i>
        <span className="text-emerald-400 font-bold">~{savingsPercent}% saved</span>
        <span className="text-slate-500">vs headhunter</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-emerald-900/20 to-apex-800/50 rounded-xl p-4 border border-emerald-900/30">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold text-emerald-400 uppercase flex items-center">
          <i className="fa-solid fa-chart-line mr-2"></i> Your Savings
        </h4>
        <span className="text-[10px] text-slate-500">vs traditional headhunter</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-[10px] text-slate-500 uppercase">Headhunter Est.</div>
          <div className="text-lg font-bold text-slate-400 line-through">{(estimatedHeadhunterCost / 1000).toFixed(0)}k DKK</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 uppercase">6Degrees Cost</div>
          <div className="text-lg font-bold text-white">{(ourCost / 1000).toFixed(1)}k DKK</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 uppercase">You Save</div>
          <div className="text-lg font-bold text-emerald-400">{savingsPercent}%</div>
        </div>
      </div>

      <div className="mt-3 h-2 bg-apex-900 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
          style={{ width: `${100 - savingsPercent}%` }}
        ></div>
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-slate-600">
        <span>Your cost</span>
        <span>Headhunter cost</span>
      </div>
    </div>
  );
};

// ============================================
// FUNNEL PROGRESS TRACKER (10x Feature)
// ============================================

interface FunnelProgressProps {
  currentStep: number;
  completedSteps: Record<number, boolean>;
  stats: {
    candidatesShortlisted?: number;
    profilesUnlocked?: number;
    outreachReady?: number;
  };
}

export const FunnelProgress: React.FC<FunnelProgressProps> = ({
  currentStep,
  completedSteps,
  stats
}) => {
  const steps = [
    { step: 1, label: 'Job Context', icon: 'fa-file-contract', stat: null },
    { step: 2, label: 'Shortlist', icon: 'fa-users', stat: stats.candidatesShortlisted },
    { step: 3, label: 'Evidence', icon: 'fa-microscope', stat: stats.profilesUnlocked },
    { step: 4, label: 'Outreach', icon: 'fa-paper-plane', stat: stats.outreachReady },
  ];

  return (
    <div className="flex items-center justify-between">
      {steps.map((s, idx) => (
        <React.Fragment key={s.step}>
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              completedSteps[s.step]
                ? 'bg-emerald-600 text-white'
                : currentStep === s.step
                  ? 'bg-emerald-900/50 text-emerald-400 ring-2 ring-emerald-500/50'
                  : 'bg-apex-800 text-slate-600'
            }`}>
              {completedSteps[s.step] ? (
                <i className="fa-solid fa-check"></i>
              ) : (
                <i className={`fa-solid ${s.icon}`}></i>
              )}
            </div>
            <span className={`text-[10px] mt-1 font-medium ${
              currentStep === s.step ? 'text-white' : 'text-slate-500'
            }`}>{s.label}</span>
            {s.stat !== null && s.stat !== undefined && (
              <span className="text-[10px] text-emerald-400 font-bold">{s.stat} ready</span>
            )}
          </div>
          {idx < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 ${
              completedSteps[s.step] ? 'bg-emerald-600' : 'bg-apex-700'
            }`}></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// ============================================
// METRIC CARD (10x Feature)
// ============================================

interface MetricCardProps {
  icon: string;
  iconColor: string;
  label: string;
  value: string | number;
  subvalue?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  iconColor,
  label,
  value,
  subvalue,
  trend
}) => {
  const trendColors = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    neutral: 'text-slate-400'
  };

  return (
    <div className="bg-apex-800/50 border border-apex-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <i className={`fa-solid ${icon} ${iconColor}`}></i>
        {trend && (
          <i className={`fa-solid ${trend === 'up' ? 'fa-arrow-up' : trend === 'down' ? 'fa-arrow-down' : 'fa-minus'} ${trendColors[trend]} text-xs`}></i>
        )}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-[10px] text-slate-500 uppercase font-bold">{label}</div>
      {subvalue && <div className="text-xs text-slate-400 mt-1">{subvalue}</div>}
    </div>
  );
};

// ============================================
// QUICK ACTION BUTTON (10x Feature)
// ============================================

interface QuickActionProps {
  icon: string;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  badge?: string | number;
}

export const QuickAction: React.FC<QuickActionProps> = ({
  icon,
  label,
  onClick,
  variant = 'secondary',
  badge
}) => {
  const variants = {
    primary: 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500',
    secondary: 'bg-apex-800 hover:bg-apex-700 text-slate-300 border-apex-700',
    ghost: 'bg-transparent hover:bg-apex-800 text-slate-400 hover:text-white border-transparent'
  };

  return (
    <button
      onClick={onClick}
      className={`relative flex items-center space-x-2 px-4 py-2.5 rounded-lg border transition-all ${variants[variant]}`}
    >
      <i className={`fa-solid ${icon}`}></i>
      <span className="text-sm font-medium">{label}</span>
      {badge !== undefined && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
};

// ============================================
// COMPARISON TABLE (10x Feature)
// ============================================

interface ComparisonItem {
  feature: string;
  traditional: string;
  sixDegrees: string;
  highlight?: boolean;
}

export const ComparisonTable: React.FC<{ items: ComparisonItem[] }> = ({ items }) => (
  <div className="overflow-hidden rounded-xl border border-apex-700">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-apex-800">
          <th className="text-left p-3 text-xs font-bold text-slate-500 uppercase">Feature</th>
          <th className="text-center p-3 text-xs font-bold text-slate-500 uppercase">Headhunter</th>
          <th className="text-center p-3 text-xs font-bold text-emerald-400 uppercase">6Degrees</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr key={i} className={`border-t border-apex-700 ${item.highlight ? 'bg-emerald-900/10' : ''}`}>
            <td className="p-3 text-slate-300">{item.feature}</td>
            <td className="p-3 text-center text-slate-500">{item.traditional}</td>
            <td className="p-3 text-center text-emerald-400 font-medium">{item.sixDegrees}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ============================================
// EVIDENCE CITATION (10x Trust Feature)
// ============================================

interface EvidenceCitationProps {
  text: string;
  source: string;
  confidence: ConfidenceLevel;
  timestamp?: string;
}

export const EvidenceCitation: React.FC<EvidenceCitationProps> = ({
  text,
  source,
  confidence,
  timestamp
}) => {
  const colors = getConfidenceColor(confidence);

  return (
    <div className="bg-apex-900/50 rounded-lg p-3 border-l-2 border-apex-600">
      <p className="text-xs text-slate-300 italic mb-2">"{text}"</p>
      <div className="flex items-center justify-between text-[10px]">
        <div className="flex items-center space-x-2">
          <span className="text-slate-500">Source: {source}</span>
          <span className={`px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
            {confidence}
          </span>
        </div>
        {timestamp && <span className="text-slate-600">{timestamp}</span>}
      </div>
    </div>
  );
};

// ============================================
// PULSE INDICATOR (Activity)
// ============================================

export const PulseIndicator: React.FC<{ active?: boolean; label?: string }> = ({
  active = true,
  label
}) => (
  <div className="flex items-center space-x-2">
    <div className="relative">
      <div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
      {active && (
        <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
      )}
    </div>
    {label && <span className="text-[10px] text-slate-500 uppercase font-bold">{label}</span>}
  </div>
);
