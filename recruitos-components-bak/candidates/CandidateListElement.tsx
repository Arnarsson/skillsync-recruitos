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
    // Score color helper
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-400';
        if (score >= 50) return 'text-amber-400';
        return 'text-red-400';
    };

    const getScoreBarColor = (score: number) => {
        if (score >= 80) return 'bg-emerald-500';
        if (score >= 50) return 'bg-amber-500';
        return 'bg-red-500';
    };

    return (
        <div
            data-testid={`candidate-card-${c.id}`}
            onClick={() => isDeepProfileUnlocked ? onSelect(c) : null}
            className={`
                flex flex-col md:grid md:grid-cols-12 gap-4 p-4 rounded-lg border transition-colors items-start md:items-center relative
                ${isSelected
                    ? 'bg-blue-500/5 border-blue-500/30'
                    : isDeepProfileUnlocked
                        ? 'bg-slate-800/30 border-white/[0.08] hover:border-white/[0.12] hover:bg-slate-800/50 cursor-pointer'
                        : 'bg-transparent border-white/[0.05] opacity-60'
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
                    className="w-4 h-4 rounded border border-slate-600 bg-slate-800 checked:bg-blue-600 checked:border-blue-600 focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-colors"
                />
            </div>

            {/* Delete Button */}
            <div className="absolute top-3 right-3 z-10">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(c.id);
                    }}
                    className="w-7 h-7 rounded-md bg-slate-800/80 hover:bg-red-500/20 border border-white/[0.08] hover:border-red-500/30 text-slate-500 hover:text-red-400 transition-colors flex items-center justify-center"
                    title="Delete candidate"
                >
                    <i className="fa-solid fa-trash text-xs"></i>
                </button>
            </div>

            {/* Candidate Info + Persona */}
            <div className="col-span-4 w-full md:w-auto pl-6 md:pl-0">
                <div className="flex items-center mb-1">
                    <img src={c.avatar} className="w-10 h-10 rounded-lg mr-3" alt="avatar" />
                    <div>
                        <h4 className="text-sm font-medium text-white">{c.name}</h4>
                        <div className="text-xs text-slate-400">
                            {c.currentRole && c.currentRole !== 'N/A' ? c.currentRole : 'Role not listed'}
                        </div>
                    </div>
                </div>

                {/* Persona Badge & Data Quality */}
                <div className="mt-2 flex items-center flex-wrap gap-2">
                    <QualityBadge candidate={c} />

                    {/* Persona Archetype */}
                    {c.persona && (
                        <span className="text-xs bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded">
                            {c.persona.archetype}
                        </span>
                    )}
                </div>
            </div>

            {/* Match Score (Desktop) */}
            <div className="col-span-2 hidden md:flex flex-col items-center justify-center">
                <div className={`text-base font-semibold tabular-nums ${getScoreColor(c.alignmentScore)}`}>
                    {c.alignmentScore}
                </div>
                <div className="w-12 h-1 bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${getScoreBarColor(c.alignmentScore)}`}
                        style={{ width: `${c.alignmentScore}%` }}
                    ></div>
                </div>
            </div>

            {/* Summary */}
            <div className="col-span-4 w-full">
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{c.shortlistSummary}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {c.scoreConfidence && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">
                            {c.scoreConfidence.charAt(0).toUpperCase() + c.scoreConfidence.slice(1)}
                        </span>
                    )}
                    {c.scoreDrivers && c.scoreDrivers.length > 0 && (
                        <span className="text-xs bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded" title={`Strengths: ${c.scoreDrivers.join(', ')}`}>
                            {c.scoreDrivers.length} {c.scoreDrivers.length === 1 ? 'driver' : 'drivers'}
                        </span>
                    )}
                </div>
            </div>

            {/* Action */}
            <div className="col-span-2 flex justify-end w-full md:w-auto mt-2 md:mt-0">
                {isDeepProfileUnlocked ? (
                    <button className="w-full md:w-auto h-8 px-4 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-md transition-colors">
                        View Report
                    </button>
                ) : (
                    <button
                        onClick={(e) => onUnlock(e, c.id, c.name)}
                        disabled={isProcessingThis}
                        className={`w-full md:w-auto h-8 px-4 text-xs font-medium rounded-md border transition-colors ${isProcessingThis
                                ? 'bg-slate-800 border-white/[0.05] text-slate-500 cursor-wait'
                                : 'bg-slate-800/50 hover:bg-slate-700 text-slate-300 border-white/[0.08]'
                            }`}
                    >
                        {isProcessingThis ? 'Unlocking...' : `Unlock · ${PRICING.DEEP_PROFILE} Cr`}
                    </button>
                )}
            </div>
        </div>
    );
};
