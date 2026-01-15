import React from 'react';
import { Candidate, PRICING } from '../../types';

export interface DataQuality {
  score: number;
  label: 'Complete' | 'Partial' | 'Minimal';
  color: string;
}

interface CandidateGridRowProps {
  candidate: Candidate;
  isSelected: boolean;
  isDeepProfileUnlocked: boolean;
  isProcessing: boolean;
  dataQuality: DataQuality;
  onSelectCandidate: (candidate: Candidate) => void;
  onToggleSelection: (id: string) => void;
  onDelete: (id: string, name: string) => Promise<void>;
  onUnlockProfile: (e: React.MouseEvent, id: string, name: string) => void;
}

export const CandidateGridRow: React.FC<CandidateGridRowProps> = ({
  candidate: c,
  isSelected,
  isDeepProfileUnlocked,
  isProcessing,
  dataQuality,
  onSelectCandidate,
  onToggleSelection,
  onDelete,
  onUnlockProfile
}) => {
  return (
    <div
      key={c.id}
      onClick={() => isDeepProfileUnlocked ? onSelectCandidate(c) : null}
      className={`
        flex flex-col md:grid md:grid-cols-12 gap-4 p-4 rounded-xl border transition-all duration-300 items-start md:items-center relative
        ${isSelected ? 'ring-2 ring-blue-500 bg-blue-900/10 border-blue-500' : ''}
        ${isDeepProfileUnlocked && !isSelected
          ? 'bg-apex-800/40 border-apex-700 hover:bg-apex-800 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-900/10 hover:-translate-y-0.5 cursor-pointer group'
          : !isSelected && 'bg-apex-900 border-apex-800 opacity-80'
        }
      `}
    >
      {/* Multi-select Checkbox */}
      <div className="absolute top-3 left-3 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelection(c.id);
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-2 border-apex-600 bg-apex-900 checked:bg-blue-600 checked:border-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
        />
      </div>

      {/* Delete Button */}
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={async (e) => {
            e.stopPropagation();
            if (window.confirm(`Delete ${c.name} from the pipeline?`)) {
              await onDelete(c.id, c.name);
            }
          }}
          className="w-8 h-8 rounded-full bg-apex-900/80 hover:bg-red-900/80 border border-apex-700 hover:border-red-600 text-slate-400 hover:text-red-400 transition-all flex items-center justify-center group/delete"
          title="Delete candidate"
        >
          <i className="fa-solid fa-trash text-xs"></i>
        </button>
      </div>

      {/* Candidate Info + Persona */}
      <div className="col-span-4 w-full md:w-auto pl-6 md:pl-0">
        <div className="flex items-center mb-1">
          <img src={c.avatar} className="w-10 h-10 rounded-full border border-slate-700 mr-3 grayscale group-hover:grayscale-0 transition-all" alt="avatar" />
          <div>
            <div className="text-sm font-bold text-slate-200">{c.name}</div>
            <div className="text-xs text-slate-500">
              {c.currentRole && c.currentRole !== 'N/A' ? c.currentRole : 'Role Not Listed'}
            </div>
          </div>
        </div>

        {/* Persona Badge & Data Quality */}
        <div className="mt-2 flex items-center flex-wrap gap-2">
          {/* Data Quality Badge */}
          <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wide ${
            dataQuality.label === 'Complete'
              ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-800/50'
              : dataQuality.label === 'Partial'
              ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-800/50'
              : 'bg-red-900/20 text-red-400 border border-red-800/50'
          }`}>
            <i className={`fa-solid ${dataQuality.label === 'Complete' ? 'fa-check-circle' : dataQuality.label === 'Partial' ? 'fa-circle-half-stroke' : 'fa-circle-exclamation'} mr-1`}></i>
            {dataQuality.label} Profile
          </span>

          {/* Persona Archetype */}
          {c.persona && (
            <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded font-medium">
              <i className="fa-solid fa-fingerprint mr-1"></i> {c.persona.archetype}
            </span>
          )}

          {/* Flags */}
          {c.persona?.redFlags && c.persona.redFlags.length > 0 && (
            <div className="relative group/flag flex items-center cursor-help">
              <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-red-900/20 border border-red-900/30 text-red-400 hover:bg-red-900/40 transition-colors">
                <i className="fa-solid fa-triangle-exclamation text-xs"></i>
                <span className="text-[9px] font-bold">{c.persona.redFlags.length} Risk{c.persona.redFlags.length > 1 ? 's' : ''}</span>
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-0 mb-2 w-56 p-3 bg-apex-950 border border-red-900/50 rounded-lg shadow-xl text-xs text-red-200 hidden group-hover/flag:block z-30">
                <div className="font-bold text-red-400 uppercase tracking-wider mb-1">Detected Risks</div>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {c.persona.redFlags.map((flag, i) => <li key={i} className="leading-tight">{flag}</li>)}
                </ul>
                {/* Tooltip Arrow */}
                <div className="absolute top-full left-4 -mt-1 w-2 h-2 bg-apex-950 border-r border-b border-red-900/50 transform rotate-45"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Match Score (Desktop) */}
      <div className="col-span-2 hidden md:flex flex-col items-center justify-center">
        <div className={`text-lg font-bold font-mono ${c.alignmentScore > 80 ? 'text-emerald-400' : 'text-yellow-400'}`}>
          {c.alignmentScore}%
        </div>
        <div className="w-16 h-1 bg-apex-700 rounded-full mt-1">
          <div
            className={`h-full rounded-full ${c.alignmentScore > 80 ? 'bg-emerald-500' : 'bg-yellow-500'}`}
            style={{ width: `${c.alignmentScore}%` }}
          ></div>
        </div>
      </div>

      {/* Summary */}
      <div className="col-span-4 w-full">
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 md:line-clamp-none">&quot;{c.shortlistSummary}&quot;</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {/* Dynamic Confidence Badge */}
          {c.scoreConfidence && (
            <span className={`text-xs px-1.5 py-0.5 rounded border ${
              c.scoreConfidence === 'high'
                ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/50'
                : c.scoreConfidence === 'moderate'
                ? 'bg-yellow-950/50 text-yellow-400 border-yellow-800/50'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}>
              <i className={`fa-solid ${
                c.scoreConfidence === 'high' ? 'fa-check-circle' :
                c.scoreConfidence === 'moderate' ? 'fa-circle-half-stroke' :
                'fa-circle'
              } mr-1`}></i>
              {c.scoreConfidence.charAt(0).toUpperCase() + c.scoreConfidence.slice(1)} Confidence
            </span>
          )}
          {/* Score Drivers */}
          {c.scoreDrivers && c.scoreDrivers.length > 0 && (
            <span className="text-xs bg-emerald-950/30 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800/50" title={`Strengths: ${c.scoreDrivers.join(', ')}`}>
              <i className="fa-solid fa-arrow-trend-up mr-1"></i>
              {c.scoreDrivers.length} {c.scoreDrivers.length === 1 ? 'Driver' : 'Drivers'}
            </span>
          )}
          {/* Score Drags */}
          {c.scoreDrags && c.scoreDrags.length > 0 && (
            <span className="text-xs bg-red-950/30 text-red-400 px-1.5 py-0.5 rounded border border-red-800/50" title={`Gaps: ${c.scoreDrags.join(', ')}`}>
              <i className="fa-solid fa-arrow-trend-down mr-1"></i>
              {c.scoreDrags.length} {c.scoreDrags.length === 1 ? 'Gap' : 'Gaps'}
            </span>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="col-span-2 flex justify-end w-full md:w-auto mt-2 md:mt-0">
        {isDeepProfileUnlocked ? (
          <button className="w-full md:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-900/20 border border-emerald-500/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95 group-hover:shadow-emerald-500/40">
            <i className="fa-solid fa-file-invoice mr-2"></i> View Report
          </button>
        ) : (
          <button
            onClick={(e) => onUnlockProfile(e, c.id, c.name)}
            disabled={isProcessing}
            className={`
              w-full md:w-auto px-4 py-2 text-xs font-bold rounded-lg border flex items-center justify-center transition-all shadow-sm
              ${isProcessing
                ? 'bg-apex-800 border-apex-700 text-slate-500 cursor-wait'
                : 'bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-400 border-slate-700 hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-0.5'
              }
            `}
          >
            {isProcessing ? (
              <><i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Unlocking...</>
            ) : (
              <><i className="fa-solid fa-lock mr-2"></i> Unlock ({PRICING.DEEP_PROFILE} Cr)</>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
