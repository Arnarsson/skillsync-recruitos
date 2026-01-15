import React, { useState } from 'react';
import { NetworkDossier } from '@/types';

interface NetworkDossierPanelProps {
  dossier: NetworkDossier | undefined;
  isLoading?: boolean;
}

/**
 * Strategic Intelligence Panel for Network Pathfinding Dossier
 * Displays 4 sections: Strategic Context, Network Intelligence, Cultural Fit, Engagement Playbook
 */
export const NetworkDossierPanel: React.FC<NetworkDossierPanelProps> = ({ dossier, isLoading = false }) => {
  const [expandedSection, setExpandedSection] = useState<string>('strategic');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? '' : section);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-900/10 border border-slate-900 rounded-lg p-6">
            <div className="h-4 bg-slate-900 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-2 bg-slate-900/50 rounded w-full"></div>
              <div className="h-2 bg-slate-900/50 rounded w-5/6"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="bg-slate-900/10 border border-dashed border-slate-900 rounded-lg p-12 text-center">
        <h3 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-widest">Network Data Unavailable</h3>
        <p className="text-[11px] text-slate-600 leading-relaxed max-w-xs mx-auto italic">
          Strategic network intelligence is synthesized upon deep analysis activation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Section 1: Strategic Context */}
      <AccordionSection
        title="Market Dynamics"
        subtitle="Sourcing Context & Industry Vector"
        isExpanded={expandedSection === 'strategic'}
        onToggle={() => toggleSection('strategic')}
      >
        <div className="space-y-3">
          <DataCard
            label="Industry Position"
            content={dossier.strategyContext.industryPosition}
          />
          <DataCard
            label="Company Status"
            content={dossier.strategyContext.companyDynamics}
          />
          <DataCard
            label="Timing Vector"
            content={dossier.strategyContext.marketTiming}
          />
          <DataCard
            label="Competitor Pulse"
            content={dossier.strategyContext.competitiveIntel}
          />
        </div>
      </AccordionSection>

      {/* Section 2: Network Intelligence */}
      <AccordionSection
        title="Network Vectors"
        subtitle="Graph Proximity & Access Strategy"
        isExpanded={expandedSection === 'network'}
        onToggle={() => toggleSection('network')}
      >
        <div className="space-y-3">
          <ListCard
            label="Inferred Nodes"
            items={dossier.networkIntelligence.inferredConnections}
            emptyMessage="No direct proxies identified"
          />
          <ListCard
            label="Access Channels"
            items={dossier.networkIntelligence.introductionPaths}
            emptyMessage="Open protocol required"
          />
          <ListCard
            label="Ecosystem Presence"
            items={dossier.networkIntelligence.professionalCommunities}
            emptyMessage="Peripheral presence only"
          />
          <DataCard
            label="Domain Voice"
            content={dossier.networkIntelligence.thoughtLeadership}
          />
        </div>
      </AccordionSection>

      {/* Section 3: Culture Mapping */}
      <AccordionSection
        title="Culture Vector"
        subtitle="Alignment Proof & Friction Risks"
        isExpanded={expandedSection === 'culture'}
        onToggle={() => toggleSection('culture')}
      >
        <div className="space-y-3">
          <DataCard
            label="Origin DNA"
            content={dossier.culturalFit.currentCultureProfile}
          />
          <DataCard
            label="Alignment Theory"
            content={dossier.culturalFit.targetCultureMatch}
          />
          <ListCard
            label="Friction Hazards"
            items={dossier.culturalFit.adaptationChallenges}
            emptyMessage="Synergy likely"
          />
          <ListCard
            label="Core Intent"
            items={dossier.culturalFit.motivationalDrivers}
            emptyMessage="Ambiguous intent"
          />
        </div>
      </AccordionSection>

      {/* Section 4: Protocol Playbook */}
      <AccordionSection
        title="Engagement Protocol"
        subtitle="Execution Strategy & Objection Handling"
        isExpanded={expandedSection === 'playbook'}
        onToggle={() => toggleSection('playbook')}
      >
        <div className="space-y-3">
          <DataCard
            label="Target Approach"
            content={dossier.engagementPlaybook.primaryApproach}
            variant="highlight"
          />
          <ListCard
            label="Openers"
            items={dossier.engagementPlaybook.conversationStarters}
            emptyMessage="Procedural outreach recommended"
          />
          <DataCard
            label="Temporal Context"
            content={dossier.engagementPlaybook.timingConsiderations}
          />
          <ObjectionHandlingTable objections={dossier.engagementPlaybook.objectionHandling} />
        </div>
      </AccordionSection>

      <div className="text-[10px] text-slate-700 text-center pt-6 uppercase tracking-widest italic">
        Snapshot: {new Date(dossier.generatedAt).toLocaleDateString()}
      </div>
    </div>
  );
};

// ============================================================================
// Helper Components
// ============================================================================

interface AccordionSectionProps {
  title: string;
  subtitle: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({
  title,
  subtitle,
  isExpanded,
  onToggle,
  children
}) => {
  return (
    <div className="bg-slate-900/10 border border-slate-900 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-900/20 transition-colors"
      >
        <div className="text-left">
          <h3 className="text-[11px] font-bold text-slate-200 uppercase tracking-widest">{title}</h3>
          <p className="text-[10px] text-slate-600 uppercase tracking-tight mt-1">{subtitle}</p>
        </div>
        <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} text-slate-700 text-[10px]`}></i>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-5 py-6 border-t border-slate-900 bg-slate-950/20">
          {children}
        </div>
      )}
    </div>
  );
};

interface DataCardProps {
  label: string;
  content: string;
  variant?: 'default' | 'highlight';
}

const DataCard: React.FC<DataCardProps> = ({ label, content, variant = 'default' }) => {
  const bgColor = variant === 'highlight' ? 'bg-slate-900/40' : 'bg-transparent';
  const borderColor = variant === 'highlight' ? 'border-slate-800' : 'border-slate-900/50';

  return (
    <div className={`${bgColor} border ${borderColor} rounded p-4`}>
      <div className="text-[9px] font-bold text-slate-600 uppercase mb-2 tracking-widest">{label}</div>
      <p className="text-xs text-slate-400 leading-relaxed italic">&ldquo;{content}&rdquo;</p>
    </div>
  );
};

interface ListCardProps {
  label: string;
  items: string[];
  emptyMessage: string;
  variant?: 'default' | 'warning' | 'success';
}

const ListCard: React.FC<ListCardProps> = ({ label, items, emptyMessage }) => {
  return (
    <div className="bg-transparent border border-slate-900/50 rounded p-4">
      <div className="text-[9px] font-bold text-slate-600 uppercase mb-3 tracking-widest">{label}</div>
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="flex items-start space-x-3">
              <span className="w-1 h-1 rounded-full bg-slate-700 mt-1.5 flex-shrink-0"></span>
              <span className="text-xs text-slate-400 leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[10px] text-slate-600 italic tracking-tight">{emptyMessage}</p>
      )}
    </div>
  );
};

interface ObjectionHandlingTableProps {
  objections: Array<{ objection: string; response: string }>;
}

const ObjectionHandlingTable: React.FC<ObjectionHandlingTableProps> = ({ objections }) => {
  if (!objections || objections.length === 0) {
    return (
      <div className="bg-transparent border border-dashed border-slate-900 rounded p-4 text-center">
        <p className="text-[10px] text-slate-600 italic uppercase">No anticipated objections</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-950/30 border border-slate-900 rounded overflow-hidden">
      <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-900">
        <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Objection Matrix</h4>
      </div>
      <div className="divide-y divide-slate-900">
        {objections.map((obj, index) => (
          <div key={index} className="p-4">
            <div className="mb-3">
              <div className="text-[9px] font-bold text-slate-600 uppercase mb-1 tracking-tighter">Signal</div>
              <p className="text-xs text-slate-400 italic">&ldquo;{obj.objection}&rdquo;</p>
            </div>
            <div>
              <div className="text-[9px] font-bold text-slate-600 uppercase mb-1 tracking-tighter">Protocol Response</div>
              <p className="text-xs text-slate-300 leading-relaxed">{obj.response}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
