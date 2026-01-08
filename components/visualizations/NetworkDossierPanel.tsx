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
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-apex-800/40 border border-apex-700 rounded-lg p-4">
            <div className="h-5 bg-apex-700 rounded w-1/3 mb-3"></div>
            <div className="space-y-2">
              <div className="h-3 bg-apex-700/60 rounded w-full"></div>
              <div className="h-3 bg-apex-700/60 rounded w-5/6"></div>
              <div className="h-3 bg-apex-700/60 rounded w-4/6"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="bg-apex-800/30 border border-apex-700 rounded-lg p-8 text-center">
        <i className="fa-solid fa-network-wired text-slate-600 text-4xl mb-4"></i>
        <h3 className="text-sm font-bold text-slate-400 mb-2">Network Dossier Not Generated</h3>
        <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
          Strategic intelligence is automatically generated when you unlock Deep Profile analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section 1: Strategic Context */}
      <AccordionSection
        icon="fa-chess"
        title="Strategic Context"
        subtitle="Industry & Market Positioning"
        isExpanded={expandedSection === 'strategic'}
        onToggle={() => toggleSection('strategic')}
      >
        <div className="space-y-4">
          <DataCard
            icon="fa-building"
            label="Industry Position"
            content={dossier.strategyContext.industryPosition}
          />
          <DataCard
            icon="fa-chart-line"
            label="Company Dynamics"
            content={dossier.strategyContext.companyDynamics}
          />
          <DataCard
            icon="fa-clock"
            label="Market Timing"
            content={dossier.strategyContext.marketTiming}
          />
          <DataCard
            icon="fa-shield-halved"
            label="Competitive Intelligence"
            content={dossier.strategyContext.competitiveIntel}
          />
        </div>
      </AccordionSection>

      {/* Section 2: Network Intelligence */}
      <AccordionSection
        icon="fa-diagram-project"
        title="Network Intelligence"
        subtitle="Connection Pathways & Introduction Strategies"
        isExpanded={expandedSection === 'network'}
        onToggle={() => toggleSection('network')}
      >
        <div className="space-y-4">
          <ListCard
            icon="fa-users"
            label="Inferred Connections"
            items={dossier.networkIntelligence.inferredConnections}
            emptyMessage="No mutual connections identified"
          />
          <ListCard
            icon="fa-route"
            label="Introduction Paths"
            items={dossier.networkIntelligence.introductionPaths}
            emptyMessage="Direct outreach recommended"
          />
          <ListCard
            icon="fa-people-group"
            label="Professional Communities"
            items={dossier.networkIntelligence.professionalCommunities}
            emptyMessage="No community affiliations identified"
          />
          <DataCard
            icon="fa-microphone"
            label="Thought Leadership"
            content={dossier.networkIntelligence.thoughtLeadership}
          />
        </div>
      </AccordionSection>

      {/* Section 3: Cultural Fit */}
      <AccordionSection
        icon="fa-palette"
        title="Cultural Fit Analysis"
        subtitle="Values, Adaptation & Motivation"
        isExpanded={expandedSection === 'culture'}
        onToggle={() => toggleSection('culture')}
      >
        <div className="space-y-4">
          <DataCard
            icon="fa-building-user"
            label="Current Culture Profile"
            content={dossier.culturalFit.currentCultureProfile}
          />
          <DataCard
            icon="fa-handshake"
            label="Target Culture Match"
            content={dossier.culturalFit.targetCultureMatch}
          />
          <ListCard
            icon="fa-triangle-exclamation"
            label="Adaptation Challenges"
            items={dossier.culturalFit.adaptationChallenges}
            emptyMessage="No significant friction points anticipated"
            variant="warning"
          />
          <ListCard
            icon="fa-bullseye"
            label="Motivational Drivers"
            items={dossier.culturalFit.motivationalDrivers}
            emptyMessage="Motivators not identified"
            variant="success"
          />
        </div>
      </AccordionSection>

      {/* Section 4: Engagement Playbook */}
      <AccordionSection
        icon="fa-book"
        title="Engagement Playbook"
        subtitle="Tactical Execution Strategy"
        isExpanded={expandedSection === 'playbook'}
        onToggle={() => toggleSection('playbook')}
      >
        <div className="space-y-4">
          <DataCard
            icon="fa-bullhorn"
            label="Primary Approach"
            content={dossier.engagementPlaybook.primaryApproach}
            variant="highlight"
          />
          <ListCard
            icon="fa-comments"
            label="Conversation Starters"
            items={dossier.engagementPlaybook.conversationStarters}
            emptyMessage="No conversation starters available"
          />
          <DataCard
            icon="fa-calendar-check"
            label="Timing Considerations"
            content={dossier.engagementPlaybook.timingConsiderations}
          />
          <ObjectionHandlingTable objections={dossier.engagementPlaybook.objectionHandling} />
        </div>
      </AccordionSection>

      {/* Generation Timestamp */}
      <div className="text-xs text-slate-600 text-center pt-2">
        <i className="fa-solid fa-clock mr-2"></i>
        Generated {new Date(dossier.generatedAt).toLocaleString()}
      </div>
    </div>
  );
};

// ============================================================================
// Helper Components
// ============================================================================

interface AccordionSectionProps {
  icon: string;
  title: string;
  subtitle: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({
  icon,
  title,
  subtitle,
  isExpanded,
  onToggle,
  children
}) => {
  return (
    <div className="bg-apex-800/40 border border-apex-700 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-apex-800/60 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <i className={`fa-solid ${icon} text-emerald-400 text-sm`}></i>
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} text-slate-500 text-xs`}></i>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 py-4 border-t border-apex-700">
          {children}
        </div>
      )}
    </div>
  );
};

interface DataCardProps {
  icon: string;
  label: string;
  content: string;
  variant?: 'default' | 'highlight';
}

const DataCard: React.FC<DataCardProps> = ({ icon, label, content, variant = 'default' }) => {
  const bgColor = variant === 'highlight' ? 'bg-emerald-900/20' : 'bg-apex-900/40';
  const borderColor = variant === 'highlight' ? 'border-emerald-800/50' : 'border-apex-700';

  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-3`}>
      <div className="flex items-start space-x-3">
        <i className={`fa-solid ${icon} text-slate-500 text-sm mt-0.5`}></i>
        <div className="flex-1">
          <div className="text-xs font-bold text-slate-400 uppercase mb-1">{label}</div>
          <p className="text-xs text-slate-300 leading-relaxed">{content}</p>
        </div>
      </div>
    </div>
  );
};

interface ListCardProps {
  icon: string;
  label: string;
  items: string[];
  emptyMessage: string;
  variant?: 'default' | 'warning' | 'success';
}

const ListCard: React.FC<ListCardProps> = ({ icon, label, items, emptyMessage, variant = 'default' }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          bg: 'bg-yellow-900/10',
          border: 'border-yellow-800/30',
          iconColor: 'text-yellow-500',
          bulletColor: 'text-yellow-500'
        };
      case 'success':
        return {
          bg: 'bg-emerald-900/10',
          border: 'border-emerald-800/30',
          iconColor: 'text-emerald-500',
          bulletColor: 'text-emerald-500'
        };
      default:
        return {
          bg: 'bg-apex-900/40',
          border: 'border-apex-700',
          iconColor: 'text-slate-500',
          bulletColor: 'text-slate-600'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className={`${styles.bg} border ${styles.border} rounded-lg p-3`}>
      <div className="flex items-start space-x-3">
        <i className={`fa-solid ${icon} ${styles.iconColor} text-sm mt-0.5`}></i>
        <div className="flex-1">
          <div className="text-xs font-bold text-slate-400 uppercase mb-2">{label}</div>
          {items.length > 0 ? (
            <ul className="space-y-1.5">
              {items.map((item, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <i className={`fa-solid fa-circle text-[6px] ${styles.bulletColor} mt-1.5`}></i>
                  <span className="text-xs text-slate-300 leading-relaxed flex-1">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic">{emptyMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
};

interface ObjectionHandlingTableProps {
  objections: Array<{ objection: string; response: string }>;
}

const ObjectionHandlingTable: React.FC<ObjectionHandlingTableProps> = ({ objections }) => {
  if (!objections || objections.length === 0) {
    return (
      <div className="bg-apex-900/40 border border-apex-700 rounded-lg p-4 text-center">
        <p className="text-xs text-slate-500 italic">No objections identified</p>
      </div>
    );
  }

  return (
    <div className="bg-apex-900/40 border border-apex-700 rounded-lg overflow-hidden">
      <div className="px-3 py-2 bg-apex-800/60 border-b border-apex-700">
        <div className="flex items-center space-x-2">
          <i className="fa-solid fa-comments-question text-slate-500 text-sm"></i>
          <h4 className="text-xs font-bold text-slate-400 uppercase">Objection Handling</h4>
        </div>
      </div>
      <div className="divide-y divide-apex-700">
        {objections.map((obj, index) => (
          <div key={index} className="p-3">
            <div className="flex items-start space-x-3 mb-2">
              <div className="w-6 h-6 rounded bg-red-900/20 border border-red-800/50 flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-exclamation text-red-400 text-xs"></i>
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-300 mb-1">Objection:</div>
                <p className="text-xs text-slate-400 italic">&ldquo;{obj.objection}&rdquo;</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 ml-9">
              <div className="flex-1">
                <div className="text-xs font-bold text-emerald-400 mb-1">Response:</div>
                <p className="text-xs text-slate-300 leading-relaxed">{obj.response}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
