/**
 * Team Tailor Export Component
 * 
 * UI component for exporting RecruitOS candidates to Team Tailor ATS.
 * Danish market friction reducer.
 */

'use client';

import { useState } from 'react';
import { Candidate } from '@/types';
import { Upload, CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';

interface TeamTailorExportProps {
  candidates: Candidate[];
  onExportComplete?: (results: ExportResult[]) => void;
}

interface ExportResult {
  success: boolean;
  candidateId: string;
  teamTailorId?: string;
  teamTailorUrl?: string;
  error?: string;
  details?: string;
}

interface CandidateWithContact extends Candidate {
  email?: string;
  phone?: string;
}

export function TeamTailorExport({ candidates, onExportComplete }: TeamTailorExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportResults, setExportResults] = useState<ExportResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [jobId, setJobId] = useState('');
  const [includeEvidence, setIncludeEvidence] = useState(true);
  const [candidateContacts, setCandidateContacts] = useState<Map<string, { email: string; phone?: string }>>(
    new Map()
  );

  // Check if integration is available
  const [integrationStatus, setIntegrationStatus] = useState<{
    configured: boolean;
    available: boolean;
    message?: string;
  } | null>(null);

  const checkIntegrationStatus = async () => {
    try {
      const response = await fetch('/api/teamtailor/export');
      const data = await response.json();
      setIntegrationStatus(data);
      return data.available;
    } catch (error) {
      console.error('Failed to check Team Tailor status:', error);
      setIntegrationStatus({
        configured: false,
        available: false,
        message: 'Failed to check integration status',
      });
      return false;
    }
  };

  const handleExport = async () => {
    // Validate all candidates have email
    const candidatesWithoutEmail = candidates.filter(
      c => !candidateContacts.get(c.id)?.email
    );

    if (candidatesWithoutEmail.length > 0) {
      alert(`Please provide email addresses for all candidates before exporting.`);
      return;
    }

    setIsExporting(true);
    setShowResults(false);

    try {
      // Check integration status first
      const isAvailable = await checkIntegrationStatus();
      if (!isAvailable) {
        alert(integrationStatus?.message || 'Team Tailor integration is not available');
        setIsExporting(false);
        return;
      }

      // Prepare export payload
      const exportPayload = {
        candidates: candidates.map(candidate => {
          const contact = candidateContacts.get(candidate.id);
          return {
            candidate,
            email: contact?.email || '',
            phone: contact?.phone,
          };
        }),
        jobId: jobId || undefined,
        includeEvidence,
        tags: ['RecruitOS', 'AI-Sourced'],
      };

      const response = await fetch('/api/teamtailor/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      const data = await response.json();
      setExportResults(data.results || []);
      setShowResults(true);

      if (onExportComplete) {
        onExportComplete(data.results);
      }

      // Show success message
      if (data.summary.successful > 0) {
        alert(
          `Successfully exported ${data.summary.successful} of ${data.summary.total} candidates to Team Tailor!`
        );
      }
    } catch (error) {
      console.error('Export error:', error);
      alert(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const updateCandidateContact = (candidateId: string, field: 'email' | 'phone', value: string) => {
    const current = candidateContacts.get(candidateId) || { email: '' };
    setCandidateContacts(new Map(candidateContacts.set(candidateId, {
      ...current,
      [field]: value,
    })));
  };

  return (
    <div className="space-y-4">
      <div className="border border-white/10 rounded-lg p-4 bg-[#1a1b1e]">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Export to Team Tailor</h3>
        </div>

        {/* Integration Status */}
        {integrationStatus && !integrationStatus.available && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
            ⚠️ {integrationStatus.message || 'Team Tailor integration not configured'}
          </div>
        )}

        {/* Export Settings */}
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Team Tailor Job ID (Optional)
            </label>
            <input
              type="text"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              placeholder="Enter Team Tailor job ID to apply candidates"
              className="w-full px-3 py-2 bg-[#141517] border border-white/10 rounded-lg focus:outline-none focus:border-blue-500"
              disabled={isExporting}
            />
            <p className="text-xs text-gray-400 mt-1">
              If provided, candidates will be automatically applied to this job
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeEvidence"
              checked={includeEvidence}
              onChange={(e) => setIncludeEvidence(e.target.checked)}
              disabled={isExporting}
              className="rounded"
            />
            <label htmlFor="includeEvidence" className="text-sm">
              Include key evidence in candidate pitch
            </label>
          </div>
        </div>

        {/* Candidate Contact Information */}
        <div className="space-y-3 mb-4">
          <h4 className="text-sm font-medium text-gray-300">
            Candidate Contact Information (Required)
          </h4>
          {candidates.map((candidate) => {
            const contact = candidateContacts.get(candidate.id);
            return (
              <div
                key={candidate.id}
                className="p-3 bg-[#141517] border border-white/10 rounded-lg space-y-2"
              >
                <div className="font-medium text-sm">{candidate.name}</div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="email"
                    placeholder="Email (required)*"
                    value={contact?.email || ''}
                    onChange={(e) => updateCandidateContact(candidate.id, 'email', e.target.value)}
                    className="px-3 py-1.5 bg-[#0a0b0c] border border-white/10 rounded text-sm focus:outline-none focus:border-blue-500"
                    disabled={isExporting}
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone (optional)"
                    value={contact?.phone || ''}
                    onChange={(e) => updateCandidateContact(candidate.id, 'phone', e.target.value)}
                    className="px-3 py-1.5 bg-[#0a0b0c] border border-white/10 rounded text-sm focus:outline-none focus:border-blue-500"
                    disabled={isExporting}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={isExporting || candidates.length === 0}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Exporting {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Export {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} to Team Tailor
            </>
          )}
        </button>
      </div>

      {/* Export Results */}
      {showResults && exportResults.length > 0 && (
        <div className="border border-white/10 rounded-lg p-4 bg-[#1a1b1e]">
          <h3 className="text-lg font-semibold mb-4">Export Results</h3>
          <div className="space-y-2">
            {exportResults.map((result) => {
              const candidate = candidates.find(c => c.id === result.candidateId);
              return (
                <div
                  key={result.candidateId}
                  className={`p-3 rounded-lg border ${
                    result.success
                      ? 'bg-green-500/10 border-green-500/20'
                      : 'bg-red-500/10 border-red-500/20'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{candidate?.name || result.candidateId}</div>
                      {result.success ? (
                        <div className="text-xs text-gray-400 mt-1">
                          {result.teamTailorUrl && (
                            <a
                              href={result.teamTailorUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                            >
                              View in Team Tailor <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-red-400 mt-1">
                          {result.error}: {result.details}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
