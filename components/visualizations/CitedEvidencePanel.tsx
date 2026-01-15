/**
 * CitedEvidencePanel - Displays candidate profile with source citations
 *
 * Features:
 * - Every claim linked to source URL
 * - Exact quoted text as evidence
 * - Confidence scores with visual indicators
 * - Cross-verification status
 * - Data quality score
 */

import React, { useState, useMemo } from 'react';
import type {
  CitedProfile,
  CitedClaim,
  SkillEvidence,
  ExperienceEvidence,
} from '../../types';

interface CitedEvidencePanelProps {
  citedProfile: CitedProfile;
  candidateName: string;
}

const VERIFICATION_STATUS_CONFIG = {
  verified: {
    icon: 'fa-check-circle',
    color: 'text-emerald-400',
    label: 'Verified',
  },
  unverified: {
    icon: 'fa-question-circle',
    color: 'text-amber-400',
    label: 'Unverified',
  },
  conflicting: {
    icon: 'fa-exclamation-triangle',
    color: 'text-red-400',
    label: 'Conflicting',
  },
};

const SOURCE_TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  linkedin: { icon: 'fa-brands fa-linkedin', color: 'text-blue-400' },
  github: { icon: 'fa-brands fa-github', color: 'text-slate-300' },
  publication: { icon: 'fa-solid fa-newspaper', color: 'text-purple-400' },
  news: { icon: 'fa-solid fa-broadcast-tower', color: 'text-amber-400' },
  company_page: { icon: 'fa-solid fa-building', color: 'text-blue-300' },
  resume: { icon: 'fa-solid fa-file-lines', color: 'text-emerald-400' },
};

export const CitedEvidencePanel: React.FC<CitedEvidencePanelProps> = ({
  citedProfile,
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('experiences');

  // Calculate stats
  const stats = useMemo(() => {
    let totalClaims = 0;
    let verifiedClaims = 0;

    const countClaim = (claim: CitedClaim | null) => {
      if (!claim) return;
      totalClaims++;
      if (claim.verificationStatus === 'verified') verifiedClaims++;
    };

    countClaim(citedProfile.name);
    countClaim(citedProfile.headline);
    countClaim(citedProfile.location);

    citedProfile.experiences.forEach((exp) => {
      exp.evidence.forEach(countClaim);
      exp.keyAchievements.forEach(countClaim);
    });

    citedProfile.skills.forEach((skill) => {
      skill.evidence.forEach(countClaim);
    });

    citedProfile.education.forEach((edu) => {
      countClaim(edu.evidence);
    });

    citedProfile.certifications.forEach((cert) => {
      countClaim(cert.evidence);
    });

    return {
      totalClaims,
      verifiedClaims,
      verificationRate: totalClaims > 0 ? Math.round((verifiedClaims / totalClaims) * 100) : 0,
      sourcesCount: citedProfile.sourcesUsed.length,
    };
  }, [citedProfile]);

  return (
    <div className="space-y-6">
      {/* Data Quality Banner */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center">
            <i className="fa-solid fa-shield-check text-emerald-400 mr-2"></i>
            Data Quality Score
          </h3>
          <div className={`text-2xl font-bold ${citedProfile.dataQualityScore >= 70 ? 'text-emerald-400' :
              citedProfile.dataQualityScore >= 40 ? 'text-amber-400' :
                'text-red-400'
            }`}>
            {citedProfile.dataQualityScore}%
          </div>
        </div>

        {/* Quality Bar */}
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full transition-all duration-500 ${citedProfile.dataQualityScore >= 70 ? 'bg-emerald-500' :
                citedProfile.dataQualityScore >= 40 ? 'bg-amber-500' :
                  'bg-red-500'
              }`}
            style={{ width: `${citedProfile.dataQualityScore}%` }}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <div className="text-lg font-bold text-white">{stats.totalClaims}</div>
            <div className="text-xs text-slate-400">Total Claims</div>
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-400">{stats.verifiedClaims}</div>
            <div className="text-xs text-slate-400">Verified</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">{stats.verificationRate}%</div>
            <div className="text-xs text-slate-400">Citation Rate</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">{stats.sourcesCount}</div>
            <div className="text-xs text-slate-400">Sources</div>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <h3 className="text-sm font-semibold text-white mb-3">Basic Information</h3>
        <div className="space-y-3">
          <CitedClaimRow label="Name" claim={citedProfile.name} />
          {citedProfile.headline && (
            <CitedClaimRow label="Headline" claim={citedProfile.headline} />
          )}
          {citedProfile.location && (
            <CitedClaimRow label="Location" claim={citedProfile.location} />
          )}
        </div>
      </div>

      {/* Experiences - Expandable */}
      <ExpandableSection
        title="Work Experience"
        icon="fa-briefcase"
        count={citedProfile.experiences.length}
        expanded={expandedSection === 'experiences'}
        onToggle={() => setExpandedSection(
          expandedSection === 'experiences' ? null : 'experiences'
        )}
      >
        <div className="space-y-4">
          {citedProfile.experiences.map((exp, idx) => (
            <ExperienceCard key={idx} experience={exp} />
          ))}
        </div>
      </ExpandableSection>

      {/* Skills - Expandable */}
      <ExpandableSection
        title="Skills"
        icon="fa-code"
        count={citedProfile.skills.length}
        expanded={expandedSection === 'skills'}
        onToggle={() => setExpandedSection(
          expandedSection === 'skills' ? null : 'skills'
        )}
      >
        <div className="space-y-3">
          {citedProfile.skills.map((skill, idx) => (
            <SkillCard key={idx} skill={skill} />
          ))}
        </div>
      </ExpandableSection>

      {/* Education - Expandable */}
      {citedProfile.education.length > 0 && (
        <ExpandableSection
          title="Education"
          icon="fa-graduation-cap"
          count={citedProfile.education.length}
          expanded={expandedSection === 'education'}
          onToggle={() => setExpandedSection(
            expandedSection === 'education' ? null : 'education'
          )}
        >
          <div className="space-y-3">
            {citedProfile.education.map((edu, idx) => (
              <div key={idx} className="bg-slate-700/30 rounded p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">{edu.institution}</div>
                    <div className="text-xs text-slate-400">
                      {edu.degree} {edu.year && `• ${edu.year}`}
                    </div>
                  </div>
                  <VerificationBadge status={edu.evidence.verificationStatus} />
                </div>
                <CitationSource claim={edu.evidence} />
              </div>
            ))}
          </div>
        </ExpandableSection>
      )}

      {/* Certifications - Expandable */}
      {citedProfile.certifications.length > 0 && (
        <ExpandableSection
          title="Certifications"
          icon="fa-certificate"
          count={citedProfile.certifications.length}
          expanded={expandedSection === 'certifications'}
          onToggle={() => setExpandedSection(
            expandedSection === 'certifications' ? null : 'certifications'
          )}
        >
          <div className="space-y-3">
            {citedProfile.certifications.map((cert, idx) => (
              <div key={idx} className="bg-slate-700/30 rounded p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">{cert.name}</div>
                    <div className="text-xs text-slate-400">
                      {cert.issuer} {cert.date && `• ${cert.date}`}
                    </div>
                  </div>
                  <VerificationBadge status={cert.evidence.verificationStatus} />
                </div>
                <CitationSource claim={cert.evidence} />
              </div>
            ))}
          </div>
        </ExpandableSection>
      )}

      {/* Uncited Claims Warning */}
      {citedProfile.uncitedClaims.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-amber-400 mb-2 flex items-center">
            <i className="fa-solid fa-exclamation-triangle mr-2"></i>
            Uncited Claims ({citedProfile.uncitedClaims.length})
          </h3>
          <p className="text-xs text-slate-400 mb-2">
            These claims could not be verified from available sources:
          </p>
          <ul className="space-y-1">
            {citedProfile.uncitedClaims.map((claim, idx) => (
              <li key={idx} className="text-xs text-amber-300">• {claim}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Sources Used */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
          <i className="fa-solid fa-link text-blue-400 mr-2"></i>
          Sources Used ({citedProfile.sourcesUsed.length})
        </h3>
        <div className="space-y-2">
          {citedProfile.sourcesUsed.map((source, idx) => {
            const config = SOURCE_TYPE_CONFIG[source.type] || SOURCE_TYPE_CONFIG.company_page;
            return (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center">
                  <i className={`${config.icon} ${config.color} mr-2`}></i>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline truncate max-w-xs"
                  >
                    {source.url}
                  </a>
                </div>
                <span className="text-slate-500">
                  Reliability: {Math.round(source.reliability * 100)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-slate-500 text-center">
        <i className="fa-solid fa-clock mr-1"></i>
        Generated: {new Date(citedProfile.generatedAt).toLocaleString()}
      </div>
    </div>
  );
};

// Sub-components
const CitedClaimRow: React.FC<{ label: string; claim: CitedClaim }> = ({ label, claim }) => (
  <div className="flex items-start justify-between">
    <div className="flex-1">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-sm text-white">{claim.claim}</div>
    </div>
    <div className="flex items-center ml-4">
      <ConfidenceIndicator confidence={claim.confidence} />
      <VerificationBadge status={claim.verificationStatus} />
    </div>
  </div>
);

const ConfidenceIndicator: React.FC<{ confidence: number }> = ({ confidence }) => {
  const pct = Math.round(confidence * 100);
  const color = pct >= 70 ? 'text-emerald-400' : pct >= 40 ? 'text-amber-400' : 'text-red-400';

  return (
    <span className={`text-xs ${color} mr-2`} title={`Confidence: ${pct}%`}>
      {pct}%
    </span>
  );
};

const VerificationBadge: React.FC<{ status: CitedClaim['verificationStatus'] }> = ({ status }) => {
  const config = VERIFICATION_STATUS_CONFIG[status];
  return (
    <i
      className={`fa-solid ${config.icon} ${config.color}`}
      title={config.label}
    />
  );
};

const CitationSource: React.FC<{ claim: CitedClaim }> = ({ claim }) => {
  const config = SOURCE_TYPE_CONFIG[claim.sourceType] || SOURCE_TYPE_CONFIG.company_page;

  return (
    <div className="mt-2 pt-2 border-t border-slate-700/50">
      <div className="flex items-center text-xs text-slate-500 mb-1">
        <i className={`${config.icon} ${config.color} mr-1`}></i>
        <a
          href={claim.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline truncate"
        >
          {claim.sourceUrl}
        </a>
      </div>
      {claim.extractedText && (
        <div className="text-xs text-slate-400 italic bg-slate-800/50 rounded p-2">
          &ldquo;{claim.extractedText.slice(0, 200)}{claim.extractedText.length > 200 ? '...' : ''}&rdquo;
        </div>
      )}
    </div>
  );
};

const ExpandableSection: React.FC<{
  title: string;
  icon: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, icon, count, expanded, onToggle, children }) => (
  <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
    >
      <div className="flex items-center">
        <i className={`fa-solid ${icon} text-blue-400 mr-2`}></i>
        <span className="text-sm font-semibold text-white">{title}</span>
        <span className="text-xs text-slate-400 ml-2">({count})</span>
      </div>
      <i className={`fa-solid fa-chevron-${expanded ? 'up' : 'down'} text-slate-400`}></i>
    </button>
    {expanded && (
      <div className="p-4 pt-0 border-t border-slate-700">
        {children}
      </div>
    )}
  </div>
);

const ExperienceCard: React.FC<{ experience: ExperienceEvidence }> = ({ experience }) => (
  <div className="bg-slate-700/30 rounded p-4">
    <div className="flex items-start justify-between mb-2">
      <div>
        <div className="text-sm font-medium text-white">{experience.role}</div>
        <div className="text-xs text-slate-400">
          {experience.company}
          {experience.startDate && ` • ${experience.startDate}`}
          {experience.endDate && ` - ${experience.endDate}`}
          {experience.isCurrent && !experience.endDate && ' - Present'}
        </div>
      </div>
      {experience.evidence.length > 0 && (
        <VerificationBadge status={experience.evidence[0].verificationStatus} />
      )}
    </div>

    {/* Key Achievements */}
    {experience.keyAchievements.length > 0 && (
      <div className="mt-3">
        <div className="text-xs text-slate-400 mb-2">Key Achievements (Cited)</div>
        <ul className="space-y-2">
          {experience.keyAchievements.map((ach, idx) => (
            <li key={idx} className="bg-slate-800/50 rounded p-2">
              <div className="flex items-start justify-between">
                <span className="text-xs text-white">{ach.claim}</span>
                <ConfidenceIndicator confidence={ach.confidence} />
              </div>
              {ach.extractedText && (
                <div className="text-[10px] text-slate-500 italic mt-1">
                  Source: &ldquo;{ach.extractedText.slice(0, 100)}...&rdquo;
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Citation Source */}
    {experience.evidence.length > 0 && (
      <CitationSource claim={experience.evidence[0]} />
    )}
  </div>
);

const SkillCard: React.FC<{ skill: SkillEvidence }> = ({ skill }) => {
  const proficiencyColors = {
    expert: 'bg-emerald-500',
    advanced: 'bg-blue-500',
    intermediate: 'bg-amber-500',
    beginner: 'bg-slate-500',
  };

  return (
    <div className="bg-slate-700/30 rounded p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <span className="text-sm font-medium text-white">{skill.skill}</span>
          <span className={`ml-2 text-[10px] px-2 py-0.5 rounded ${proficiencyColors[skill.proficiencyLevel]} text-white`}>
            {skill.proficiencyLevel}
          </span>
        </div>
        <span className="text-xs text-slate-400">
          {skill.yearsOfEvidence} yr{skill.yearsOfEvidence !== 1 ? 's' : ''} evidence
        </span>
      </div>

      {/* Evidence Sources */}
      {skill.evidence.length > 0 && (
        <div className="space-y-1">
          {skill.evidence.slice(0, 2).map((ev, idx) => (
            <div key={idx} className="flex items-center text-xs">
              <ConfidenceIndicator confidence={ev.confidence} />
              <a
                href={ev.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline truncate"
              >
                {ev.sourceUrl}
              </a>
            </div>
          ))}
          {skill.evidence.length > 2 && (
            <div className="text-xs text-slate-500">
              + {skill.evidence.length - 2} more sources
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CitedEvidencePanel;
