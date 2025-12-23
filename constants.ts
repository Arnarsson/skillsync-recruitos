import { Candidate, FunnelStage, ConfidenceLevel } from './types';

export const INITIAL_CREDITS = 5000; 

export const MOCK_CANDIDATES: Candidate[] = [
  {
    id: 'soren-a',
    name: 'Søren A.',
    currentRole: 'Senior Frontend Engineer',
    company: 'Danske Bank',
    location: 'Copenhagen Area',
    yearsExperience: 7,
    avatar: 'https://i.pravatar.cc/150?u=soren',
    alignmentScore: 94,
    scoreBreakdown: {
        skills: { value: 32, max: 35, percentage: 91 },
        experience: { value: 24, max: 25, percentage: 96 },
        industry: { value: 15, max: 15, percentage: 100 },
        seniority: { value: 14, max: 15, percentage: 93 },
        location: { value: 9, max: 10, percentage: 90 }
    },
    shortlistSummary: 'Top tier match. Next.js expert with Fintech compliance experience.',
    keyEvidence: [
        'Specific experience with Next.js 14+ matching job requirement.',
        'Previously worked in heavily regulated Fintech environment (Danske Bank).',
        'Lead a team of 5 developers (matches leadership requirement).'
    ],
    risks: [
        'Salary expectation likely top of band based on current employer.'
    ],
    unlockedSteps: [FunnelStage.SHORTLIST, FunnelStage.DEEP_PROFILE],
    avgTenure: '3.5 Years',
    progressionPace: 'Fast',
    
    // New Analysis Data
    cultureFit: 'High Corporate Fit. Accustomed to regulated environments (Danske Bank) and matrix organizations. Likely to navigate our compliance processes well.',
    deepAnalysis: 'Søren represents a low-risk, high-competence hire. His trajectory shows loyalty (promoted internally) and steady progression within a similar corporate structure. The transition to our team would be culturally seamless given his background in banking compliance and legacy migration. His communication style suggests he can bridge the gap between technical and business stakeholders.',

    trajectoryEvidence: 'Promoted from Junior to Senior in 4 years at previous role. Consistently takes higher responsibility.',
    indicators: [
      {
        category: 'COMMUNICATION',
        label: 'Structured & Technical',
        observation: 'Uses precise technical language.',
        evidence: { text: 'LinkedIn recommendations highlight code review detail and mentoring junior devs. Public blog posts show clear technical writing.', source: 'Public Activity', confidence: ConfidenceLevel.HIGH }
      },
      {
        category: 'COLLABORATION',
        label: 'Mentorship-focused',
        observation: 'Active in team growth.',
        evidence: { text: 'Multiple endorsements for "Teaching" and "Code Reviews".', source: 'Skills & Endorsements', confidence: ConfidenceLevel.HIGH }
      }
    ],
    interviewGuide: [
      { topic: 'Leadership', question: 'Ask about the transition from IC to Team Lead in 2022.', reason: 'Verify leadership depth.' },
      { topic: 'Tech Stack', question: 'Verify deep knowledge of Server Actions vs API Routes (alignment check).', reason: 'Validate Next.js 14 expertise.' },
      { topic: 'Retention', question: 'Validate "Fast Progression" - was it due to turnover or merit?', reason: 'Check stability.' }
    ],
    connectionPath: 'Lars Jensen (VP Eng)',
    sharedContext: ['Shared connection: Lars Jensen', 'Both worked at Danske Bank'],
    outreachHook: 'Lars mentioned your work on the MobilePay migration project.'
  },
  {
    id: 'mette-k',
    name: 'Mette K.',
    currentRole: 'Full Stack Developer',
    company: 'Lunar',
    location: 'Aarhus (Remote)',
    yearsExperience: 4,
    avatar: 'https://i.pravatar.cc/150?u=mette',
    alignmentScore: 88,
    scoreBreakdown: {
        skills: { value: 30, max: 35, percentage: 85 },
        experience: { value: 20, max: 25, percentage: 80 },
        industry: { value: 15, max: 15, percentage: 100 },
        seniority: { value: 13, max: 15, percentage: 86 },
        location: { value: 10, max: 10, percentage: 100 }
    },
    shortlistSummary: 'Strong generalist. Good cultural fit, but less specific legacy experience.',
    keyEvidence: [
        '4 years of React experience in a modern fintech setup.',
        'Open source contributor to relevant UI libraries.'
    ],
    risks: [
        'Remote-only preference might conflict with hybrid policy.',
        'Less experience with legacy migration.'
    ],
    unlockedSteps: [FunnelStage.SHORTLIST],
  },
  {
    id: 'jens-p',
    name: 'Jens P.',
    currentRole: 'DevOps Engineer',
    company: 'Netcompany',
    location: 'Copenhagen',
    yearsExperience: 8,
    avatar: 'https://i.pravatar.cc/150?u=jens',
    alignmentScore: 72,
    scoreBreakdown: {
        skills: { value: 20, max: 35, percentage: 57 },
        experience: { value: 25, max: 25, percentage: 100 },
        industry: { value: 5, max: 15, percentage: 33 },
        seniority: { value: 15, max: 15, percentage: 100 },
        location: { value: 7, max: 10, percentage: 70 }
    },
    shortlistSummary: 'Technically solid but role mismatch (more Ops than Frontend).',
    keyEvidence: ['Azure Certified', 'Strong CI/CD background'],
    risks: ['Limited recent frontend framework experience.', 'Salary expectations likely high (Consultancy rates).'],
    unlockedSteps: [FunnelStage.SHORTLIST],
  },
  {
    id: 'thomas-l',
    name: 'Thomas L.',
    currentRole: 'Frontend Architect',
    company: 'SimCorp',
    location: 'Copenhagen',
    yearsExperience: 12,
    avatar: 'https://i.pravatar.cc/150?u=thomas',
    alignmentScore: 65,
    scoreBreakdown: {
        skills: { value: 35, max: 35, percentage: 100 },
        experience: { value: 10, max: 25, percentage: 40 }, // Penalized for overqualification logic
        industry: { value: 15, max: 15, percentage: 100 },
        seniority: { value: 5, max: 15, percentage: 33 }, // Mismatch
        location: { value: 0, max: 10, percentage: 0 }
    },
    shortlistSummary: 'Technically overqualified. Might get bored with current scope.',
    keyEvidence: ['Architecture ownership experience', '12+ years tenure'],
    risks: ['Flight risk due to role scope mismatch.', 'Potential cost prohibitor.'],
    unlockedSteps: [FunnelStage.SHORTLIST],
  }
];