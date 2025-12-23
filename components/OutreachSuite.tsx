import React, { useState, useEffect } from 'react';
import { Candidate, ConfidenceLevel, formatPrice, PRICING } from '../types';
import { ConfidenceBadge, StepBadge, ShareModal, useToast } from './ui';

interface Props {
  candidate: Candidate;
  onClose: () => void;
}

type MobilePanel = 'strategy' | 'draft';

const OutreachSuite: React.FC<Props> = ({ candidate, onClose }) => {
  const { addToast } = useToast();
  const [template, setTemplate] = useState('');
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<'linkedin' | 'email' | 'intro'>('linkedin');
  const [approved, setApproved] = useState(false);
  const [shareModal, setShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('strategy');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setLoading(true);
    // Simulate AI generation
    const timer = setTimeout(() => {
      const templates: Record<typeof channel, string> = {
        linkedin: `Hi ${candidate.name.split(' ')[0]},

${candidate.outreachHook || `I noticed your work at ${candidate.company} and your experience in frontend development.`}

We're building something similar here at Apex Financial Systems, and your background in ${candidate.keyEvidence?.[0]?.split(' ').slice(0, 5).join(' ') || 'modern frontend technologies'} looks like it could be a great fit.

Would you be open to a 15-minute chat this week?

Best,
[Your Name]`,
        email: `Subject: Opportunity at Apex Financial Systems

Hi ${candidate.name.split(' ')[0]},

I came across your profile and was impressed by your experience at ${candidate.company}.

${candidate.outreachHook || `Your background in frontend development and fintech`} aligns well with what we're building at Apex.

I'd love to share more about the role and learn about your career goals. Would you have 15 minutes for a quick call?

Best regards,
[Your Name]
[Title]`,
        intro: `Hi [Mutual Connection],

I noticed you're connected with ${candidate.name} on LinkedIn. We have an exciting Senior Frontend Engineer role at Apex that seems like a great fit for their background.

Would you be comfortable making an introduction? Happy to send you the details to share.

Thanks!
[Your Name]`
      };
      setTemplate(templates[channel]);
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [candidate, channel]);

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(template);
    setCopied(true);
    addToast('success', 'Message copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    setLoading(true);
    setTimeout(() => {
      setTemplate(prev => prev + '\n\n[Regenerated variation]');
      setLoading(false);
      addToast('info', 'Template regenerated');
    }, 600);
  };

  const handleOpenLinkedIn = () => {
    if (!approved) {
      addToast('warning', 'Please confirm you have reviewed the Evidence Report first');
      return;
    }
    window.open(candidate.linkedinUrl || 'https://linkedin.com', '_blank');
    addToast('info', 'Opening LinkedIn...');
  };

  const handleShareLink = () => {
    setShareModal(true);
  };

  const channels = [
    { id: 'linkedin', label: 'LinkedIn DM', icon: 'fa-brands fa-linkedin', color: 'text-blue-400' },
    { id: 'email', label: 'Email', icon: 'fa-solid fa-envelope', color: 'text-emerald-400' },
    { id: 'intro', label: 'Warm Intro', icon: 'fa-solid fa-handshake', color: 'text-purple-400' }
  ];

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="outreach-title"
      >
        <div
          className="w-full max-w-[900px] max-h-[90vh] md:max-h-[85vh] bg-apex-900 border border-apex-700 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-scaleIn"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <header className="p-4 md:p-5 border-b border-apex-800 flex justify-between items-center bg-gradient-to-r from-apex-800 to-apex-800/80">
            <div className="flex items-center space-x-3 md:space-x-4 min-w-0">
              <img
                src={candidate.avatar}
                alt={candidate.name}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-emerald-500/50 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center space-x-3">
                  <StepBadge step={4} label="Outreach Protocol" color="emerald" />
                </div>
                <h3 id="outreach-title" className="text-base md:text-lg font-bold text-white mt-1 truncate">{candidate.name}</h3>
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-3 shrink-0">
              <button
                onClick={handleShareLink}
                className="text-xs text-slate-400 hover:text-white flex items-center bg-apex-900 px-2 md:px-3 py-1.5 rounded border border-apex-700 transition-colors"
              >
                <i className="fa-solid fa-share-nodes md:mr-1.5"></i> <span className="hidden md:inline">Share</span>
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full bg-apex-800 text-slate-400 hover:text-white hover:bg-apex-700 transition-colors"
                aria-label="Close modal"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </header>

          {/* Mobile Panel Toggle */}
          {isMobile && (
            <div className="flex border-b border-apex-800 bg-apex-800/50">
              <button
                onClick={() => setMobilePanel('strategy')}
                className={`flex-1 py-3 px-4 text-center text-xs font-bold uppercase transition-all relative ${
                  mobilePanel === 'strategy'
                    ? 'text-emerald-400 bg-apex-900/50'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <i className="fa-solid fa-route mr-2"></i>Strategy
                {mobilePanel === 'strategy' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"></div>
                )}
              </button>
              <button
                onClick={() => setMobilePanel('draft')}
                className={`flex-1 py-3 px-4 text-center text-xs font-bold uppercase transition-all relative ${
                  mobilePanel === 'draft'
                    ? 'text-emerald-400 bg-apex-900/50'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <i className="fa-solid fa-pen mr-2"></i>Draft
                {mobilePanel === 'draft' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"></div>
                )}
              </button>
            </div>
          )}

          <div className="flex-1 flex flex-col md:grid md:grid-cols-2 overflow-hidden">
            {/* Left: Strategy & Context */}
            <div className={`p-4 md:p-6 border-b md:border-b-0 md:border-r border-apex-800 bg-apex-900/50 overflow-y-auto ${
              isMobile && mobilePanel !== 'strategy' ? 'hidden' : ''
            }`}>
              {/* Connection Path */}
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 flex items-center">
                  <i className="fa-solid fa-route mr-2 text-slate-600"></i> Connection Path
                </h4>
                {candidate.connectionPath ? (
                  <div className="p-4 bg-emerald-900/15 border border-emerald-900/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <i className="fa-solid fa-check-circle text-emerald-500 mr-2"></i>
                        <span className="text-sm font-bold text-emerald-400">Warm Intro Available</span>
                      </div>
                      <ConfidenceBadge level={candidate.outreachConfidence || ConfidenceLevel.HIGH} />
                    </div>
                    <div className="text-xs text-slate-300">
                      <i className="fa-solid fa-user mr-1.5 text-slate-500"></i>
                      Via {candidate.connectionPath}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg flex items-center">
                    <i className="fa-regular fa-snowflake text-slate-500 mr-3"></i>
                    <div>
                      <div className="text-sm text-slate-400">No direct path found</div>
                      <div className="text-xs text-slate-500">Cold outreach recommended</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Shared Context */}
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 flex items-center">
                  <i className="fa-solid fa-link mr-2 text-slate-600"></i> Shared Context Hooks
                </h4>
                <div className="space-y-2">
                  {candidate.sharedContext && candidate.sharedContext.length > 0 ? (
                    candidate.sharedContext.map((ctx, i) => (
                      <div key={i} className="flex items-center text-xs text-slate-300 bg-apex-800/50 px-3 py-2 rounded border border-apex-700">
                        <i className="fa-solid fa-check text-emerald-500 mr-2"></i> {ctx}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 italic p-3 bg-apex-800/30 rounded border border-apex-800">
                      No shared history detected. Consider researching recent posts or activity.
                    </div>
                  )}
                </div>
              </div>

              {/* Channel Selection */}
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-3">Outreach Channel</h4>
                <div className="grid grid-cols-3 gap-2">
                  {channels.map(ch => (
                    <button
                      key={ch.id}
                      onClick={() => setChannel(ch.id as typeof channel)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        channel === ch.id
                          ? 'bg-apex-800 border-emerald-500/50 text-white'
                          : 'bg-apex-900 border-apex-700 text-slate-400 hover:border-apex-600'
                      }`}
                    >
                      <i className={`${ch.icon} ${ch.color} text-lg mb-1`}></i>
                      <div className="text-[10px] font-bold uppercase">{ch.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Human Approval (Required) */}
              <div className="pt-6 border-t border-apex-700">
                {/* Mandatory Disclaimer (Spec 16.2) */}
                <div className="mb-4 bg-blue-900/10 border border-blue-900/30 p-3 rounded-lg">
                  <p className="text-[10px] text-blue-400 leading-relaxed font-mono">
                    <strong>ℹ️ Human Review Required:</strong> These outreach suggestions are starting points. Review and personalize before sending. Do not use automated sending tools that violate platform terms of service.
                  </p>
                </div>

                <h4 className="text-xs font-bold uppercase text-slate-500 mb-3">Human Approval</h4>
                <label className="flex items-start text-xs text-slate-400 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={approved}
                    onChange={(e) => setApproved(e.target.checked)}
                    className="mr-3 mt-0.5 rounded bg-apex-800 border-apex-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-apex-900"
                  />
                  <span className="group-hover:text-slate-300 transition-colors">
                    I certify I have reviewed the Evidence Report and will personalize this message before sending.
                  </span>
                </label>

                <button 
                  onClick={handleShareLink}
                  className="w-full mt-4 py-2.5 bg-apex-800 hover:bg-apex-700 text-white text-xs font-bold rounded-lg border border-apex-700 transition-colors"
                >
                  <i className="fa-solid fa-share-nodes mr-2"></i> Copy Shareable Link
                </button>
                <p className="text-[10px] text-center text-slate-600 mt-2">Link expires in 30 days.</p>
              </div>
            </div>

            {/* Right: The Draft */}
            <div className={`p-4 md:p-6 bg-apex-800/20 flex flex-col overflow-hidden flex-1 min-h-[300px] md:min-h-0 ${
              isMobile && mobilePanel !== 'draft' ? 'hidden' : ''
            }`}>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-bold uppercase text-slate-500">Generated Draft</h4>
                <button
                  onClick={handleRegenerate}
                  disabled={loading}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center transition-colors disabled:opacity-50"
                >
                  <i className="fa-solid fa-rotate mr-1"></i> Regenerate
                </button>
              </div>

              <div className="flex-1 bg-apex-900 border border-apex-700 rounded-lg relative overflow-hidden min-h-[200px]">
                {loading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                    <i className="fa-solid fa-circle-notch fa-spin text-xl mb-2"></i>
                    <span className="text-xs">Generating {channel} message...</span>
                  </div>
                ) : (
                  <textarea
                    className="w-full h-full bg-transparent border-none focus:ring-0 text-sm text-slate-300 font-mono resize-none leading-relaxed p-3 md:p-4 focus:outline-none"
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    placeholder="Your message will appear here..."
                  ></textarea>
                )}
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex space-x-2 md:space-x-3">
                  <button
                    onClick={handleOpenLinkedIn}
                    disabled={!approved}
                    className={`flex-1 py-2.5 md:py-3 text-sm font-bold rounded-lg shadow-lg transition-all flex items-center justify-center ${
                      approved
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30'
                        : 'bg-apex-700 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <i className="fa-brands fa-linkedin mr-2"></i> <span className="hidden sm:inline">Open </span>LinkedIn
                  </button>
                  <button
                    onClick={handleCopyTemplate}
                    className={`px-4 md:px-5 py-2.5 md:py-3 rounded-lg transition-all flex items-center ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-apex-700 hover:bg-apex-600 text-white'
                    }`}
                    title="Copy to Clipboard"
                  >
                    <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                  </button>
                </div>

                {!approved && (
                  <p className="text-[10px] text-yellow-500/80 text-center flex items-center justify-center">
                    <i className="fa-solid fa-lock mr-1.5"></i>
                    Check the approval box to enable sending
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModal}
        onClose={() => setShareModal(false)}
        candidateName={candidate.name}
        candidateId={candidate.id}
        step="outreach"
      />
    </>
  );
};

export default OutreachSuite;
