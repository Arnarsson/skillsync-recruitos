/* eslint-disable no-console */
import { useState, useCallback } from 'react';
import { Candidate, PRICING } from '../types';
import { analyzeCandidateProfile, generatePersona } from '../services/geminiService';
import { scrapeUrlContent } from '../services/scrapingService';
import { candidateService } from '../services/candidateService';
import { ToastType } from '../components/ToastNotification';

interface UseCandidateSourcingProps {
  jobContext: string;
  credits: number;
  onSpendCredits: (amount: number, description?: string) => void;
  addToast: (type: ToastType, message: string) => void;
  onCandidateCreated: (candidate: Candidate) => void;
}

interface UseCandidateSourcingReturn {
  sourcingUrl: string;
  setSourcingUrl: (url: string) => void;
  isSourcing: boolean;
  sourcingLog: string[];
  handleSourcingRun: () => Promise<void>;
}

export const useCandidateSourcing = ({
  jobContext,
  credits,
  onSpendCredits,
  addToast,
  onCandidateCreated
}: UseCandidateSourcingProps): UseCandidateSourcingReturn => {
  const [sourcingUrl, setSourcingUrl] = useState('');
  const [isSourcing, setIsSourcing] = useState(false);
  const [sourcingLog, setSourcingLog] = useState<string[]>([]);

  const addToLog = useCallback((msg: string) => {
    setSourcingLog(prev => [...prev, `> ${msg}`]);
  }, []);

  const handleSourcingRun = useCallback(async () => {
    if (!sourcingUrl) return;
    if (credits < PRICING.SOURCING_SCAN) {
      addToast('error', "Insufficient credits for sourcing scan.");
      return;
    }

    setIsSourcing(true);
    setSourcingLog([]);
    addToLog(`Initializing Sourcing Agent for: ${sourcingUrl}`);

    // Check for appropriate API key based on URL
    const isLinkedIn = sourcingUrl.toLowerCase().includes('linkedin.com');

    // Safely get env keys
    let envFirecrawl = '';
    let envBrightData = '';
    try {
      if (typeof process !== 'undefined' && process.env) {
        envFirecrawl = process.env.FIRECRAWL_API_KEY || '';
        envBrightData = process.env.BRIGHTDATA_API_KEY || '';
      }
    } catch (error: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error(error);
      }
    }

    const firecrawlKey = localStorage.getItem('FIRECRAWL_API_KEY') || envFirecrawl;
    const brightDataKey = localStorage.getItem('BRIGHTDATA_API_KEY') || envBrightData;

    if (isLinkedIn && !brightDataKey) {
      addToLog(`⚠️ API Key Missing: BrightData key required for LinkedIn profiles.`);
      addToast('error', "BrightData API Key Missing. Configure it in Settings.");
      setIsSourcing(false);
      return;
    }

    if (!isLinkedIn && !firecrawlKey) {
      addToLog(`⚠️ API Key Missing: Firecrawl key required.`);
      addToast('error', "Firecrawl Key Missing");
      setIsSourcing(false);
      return;
    }

    try {
      // 1. Scrape
      if (isLinkedIn) {
        addToLog(`Step 1: Scraping LinkedIn profile via BrightData...`);
        addToLog(`(This may take 10-30 seconds)`);
      } else {
        addToLog(`Step 1: Ingesting public profile data...`);
      }

      console.log('[UI] Starting scrapeUrlContent...');
      const rawMarkdown = await scrapeUrlContent(sourcingUrl, jobContext);
      console.log('[UI] scrapeUrlContent resolved. Length:', rawMarkdown.length);

      addToLog(`✓ Data Ingested (${rawMarkdown.length} chars).`);

      // 2. Persona Engine
      addToLog(`Step 2: Constructing Psychometric Persona...`);
      console.log('[UI] Starting generatePersona...');
      const persona = await generatePersona(rawMarkdown);
      console.log('[UI] generatePersona resolved:', persona.archetype);

      addToLog(`✓ Persona Identified: ${persona.archetype}`);

      // 3. Fit Analysis
      addToLog(`Step 3: Calculating Job Fit & Scoring...`);
      console.log('[UI] Starting analyzeCandidateProfile...');
      const candidate = await analyzeCandidateProfile(rawMarkdown, jobContext, persona);
      console.log('[UI] analyzeCandidateProfile resolved');

      // Add URL for reference
      candidate.sourceUrl = sourcingUrl;

      // Save to DB
      addToLog(`Step 4: Persisting to Supabase...`);
      await candidateService.create(candidate);

      addToLog(`✓ Candidate Added to Pipeline.`);
      console.log('[UI] Sourcing finished successfully');

      // Explicitly update state before callbacks to ensure UI reflects completion
      setIsSourcing(false);

      onSpendCredits(PRICING.SOURCING_SCAN, `Sourcing Run: ${candidate.name}`);
      addToast('success', "Candidate sourced successfully");
      setSourcingUrl(''); // Clear input

      // Trigger parent callback last
      console.log('[UI] Triggering onCandidateCreated');
      onCandidateCreated(candidate);

    } catch (error: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error(error);
      }
      const errorMessage = error instanceof Error ? error.message : "Sourcing failed";
      addToLog(`ERROR: ${errorMessage}`);
      addToast('error', errorMessage);
      setIsSourcing(false);
    } finally {
      // Redundant but safe
      setIsSourcing(false);
    }
  }, [sourcingUrl, credits, jobContext, onSpendCredits, addToast, addToLog, onCandidateCreated]);

  return {
    sourcingUrl,
    setSourcingUrl,
    isSourcing,
    sourcingLog,
    handleSourcingRun
  };
};
