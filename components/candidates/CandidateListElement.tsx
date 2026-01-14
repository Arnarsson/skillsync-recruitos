import React from 'react';
import { Candidate, PRICING } from '../../types';
import { QualityBadge } from './QualityBadge';

interface CandidateListElementProps {
    candidate: Candidate;
    isSelected: boolean;
    isDeepProfileUnlocked: boolean;
    isProcessingThis: boolean;
    onToggleSelection: (id: string) => void;
    onDelete: (id: string) => void;
    onSelect: (c: Candidate) => void;
    onUnlock: (e: React.MouseEvent, id: string, name: string) => void;
}

export const CandidateListElement: React.FC<CandidateListElementProps> = ({
    candidate: c,
    isSelected,
    isDeepProfileUnlocked,
    isProcessingThis,
    onToggleSelection,
    onDelete,
    onSelect,
    onUnlock
}) => {
    return (
        <div
            onClick={() => isDeepProfileUnlocked ? onSelect(c) : null}
            className={`
                flex flex-col md:grid md:grid-cols-12 gap-4 p-4 rounded-xl border transition-all duration-200 ease-linear items-start md:items-center relative
                ${isSelected
                    ? 'bg-slate-800/20 border-blue-500/40'
                    : ''
                }
                ${isDeepProfileUnlocked && !isSelected
                    ? 'bg-apex-800/10 border-slate-800 hover:border-slate-700 hover:bg-apex-800/20 cursor-pointer group'
                    : !isSelected && 'bg-transparent border-slate-900 opacity-70'
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
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(c.id);
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
                    <img src={c.avatar} className="w-10 h-10 rounded-full border border-slate-800 mr-3" alt="avatar" />
                    <div>
                        <h4 className="text-sm font-semibold text-slate-100">{c.name}</h4>
                        <div className="text-[11px] text-slate-500 font-normal">
                            {c.currentRole && c.currentRole !== 'N/A' ? c.currentRole : 'Role Not Listed'}
                        </div>
                    </div>
                </div>

                {/* Persona Badge & Data Quality */}
                <div className="mt-2 flex items-center flex-wrap gap-2">
                    <QualityBadge candidate={c} />

                    {/* Persona Archetype */}
                    {c.persona && (
                        <span className="text-[9px] bg-slate-800/30 text-slate-400 border border-slate-700/50 px-1.5 py-0.5 rounded font-medium uppercase tracking-wider">
                            {c.persona.archetype}
                        </span>
                    )}
                </div>
            </div>

            {/* Match Score (Desktop) */}
            <div className="col-span-2 hidden md:flex flex-col items-center justify-center">
                <div className={`text-base font-medium font-mono ${c.alignmentScore > 80 ? 'text-emerald-500/80' : 'text-slate-400'}`}>
                    {c.alignmentScore}%
                </div>
                <div className="w-16 h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ${c.alignmentScore > 80 ? 'bg-emerald-500/40' : 'bg-slate-600'}`}
                        style={{ width: `${c.alignmentScore}%` }}
                    ></div>
                </div>
            </div>

            {/* Summary */}
            <div className="col-span-4 w-full">
                <p className="text-[11px] text-slate-400 leading-normal line-clamp-2 md:line-clamp-none italic">&quot;{c.shortlistSummary}&quot;</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {/* Dynamic Confidence Badge */}
                    {c.scoreConfidence && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-slate-800 text-slate-500 bg-slate-900/50">
                            {c.scoreConfidence.charAt(0).toUpperCase() + c.scoreConfidence.slice(1)}
                        </span>
                    )}
                    {/* Score Drivers */}
                    {c.scoreDrivers && c.scoreDrivers.length > 0 && (
                        <span className="text-[10px] bg-emerald-500/5 text-emerald-500/60 px-1.5 py-0.5 rounded border border-emerald-500/10" title={`Strengths: ${c.scoreDrivers.join(', ')}`}>
                            {c.scoreDrivers.length} {c.scoreDrivers.length === 1 ? 'Driver' : 'Drivers'}
                        </span>
                    )}
                </div>
            </div>

            {/* Action */}
            <div className="col-span-2 flex justify-end w-full md:w-auto mt-2 md:mt-0">
                {isDeepProfileUnlocked ? (
                    <button className="w-full md:w-auto px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded border border-slate-700 transition-colors">
                        View Report
                    </button>
                ) : (
                    <button
                        onClick={(e) => onUnlock(e, c.id, c.name)}
                        disabled={isProcessingThis}
                        className={`
                            w-full md:w-auto px-4 py-1.5 text-xs font-medium rounded border transition-colors
                            ${isProcessingThis
                                ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-wait'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
                            }
                        `}
                    >
                        {isProcessingThis ? (
                            'Unlocking...'
                        ) : (
                            `Unlock (${PRICING.DEEP_PROFILE} Cr)`
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};
